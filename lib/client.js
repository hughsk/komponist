var util = require('util')
  , commands = require('./commands')
  , parsers = require('./parsers')
  , MPDSticker = require('./sticker')
  , net = false

try { net = require('net'); } catch(e) { }

// 
// The MPD Client connection.
// 
// This extends the native net.Socket class from Node core,
// which makes for easy interaction with it as a Stream.
// 
// When running on the browser this class falls back to
// a basic Stream class for piping through shoe
// 
MPDClient = module.exports = function MPDClient(options) {
    var self = this

    if (!(this instanceof MPDClient)) {
        return new MPDClient(options)
    }

    MPDClient.super_.call(this, options);

    // listener for the first "OK"
    this.mpdcallbacks = [{
          command: ''
        , callback: function(){ self.emit('ready'); }
    }];

    this.buffer = "";
    this.targets = [];

    // Watch for all input data from MPD.
    this.on('data', function(data) {
        var cbs = self.mpdcallbacks
          , lines = data.toString().split('\n')
          , i, l = lines.length;

        for (i = 0; i < l; i += 1) {
            if (lines[i].match(/^(list_)?OK/)) {
                self.flushBuffer();
            } else
            if (lines[i].match(/^ACK/)) {
                self.errorBuffer(lines[i]);
            } else {
                self.buffer += lines[i];
                self.buffer += '\n';
            }
        }
    });

    // Watch for events using the "idle"
    // command, emitting "changed" messages when
    // in response - and a separate "message" event for
    // each message.
    this.once('ready', function() {
        function goBackToIdle() {
            self.idle(function(err, subsystem) {
                if (!subsystem || !subsystem.changed) return goBackToIdle();

                if (subsystem.changed !== 'message') {
                    self.emit('changed', subsystem.changed)
                    return goBackToIdle();
                }

                captureMessages();
            });
        };

        function captureMessages() {
            self.readmessages(function(err, messages) {
                if (!Array.isArray(messages)) {
                    messages = [messages];
                }

                messages.forEach(function(message) {
                    self.emit('message', message.message, message.channel);
                });

                goBackToIdle();
            });
        };

        goBackToIdle();
    });

    this.on('pipe', function(input) {
        if (input === self) return;

        self.targets.push(input);
        input.on('data', function(data) {
            self.emit('data', data);
        });
    });
};

util.inherits(MPDClient, net.Socket || require('stream'));

MPDClient.prototype.connect = function() {
    var returnVal = MPDClient.super_.prototype.connect.apply(this, arguments);
    this.write = MPDClient.prototype.write;
    return returnVal;
}


MPDClient.prototype._reallywrite = function(data, encoding) {
    var ok = true;

    if (MPDClient.super_.prototype.write) {
        ok = ok && MPDClient.super_.prototype.write.call(this, data, encoding);
    }

    this.targets.forEach(function(target) {
        if (!target || !target.writable) return;

        ok = ok && target.write(data, encoding);
    });

    return ok;
};

//
// Overriding the default write method, which should
// for the most case stop it interfering with callbacks created
// by the `command` method and co.
// 
// This method also takes care of issuing noidle commands before
// continuing :)
// 
MPDClient.prototype.write = function(data, encoding, callback, responseCallback) {
    var self = this
      , utfData = data.toString('utf8');

    // Handle the "idle" and "noidle" commands
    if (utfData === 'noidle\n') {
        return this._reallywrite(data, encoding);
    }

    if (this.isIdle && utfData !== 'idle\n') {
        this.isIdle = false;
        this.write('noidle\n', 'utf8');
    }

    if (!this.isIdle && utfData === 'idle\n') {
        this.isIdle = true;
    }

    // Split the commands out by line.
    utfData.split('\n').slice(0, -1).forEach(function(line) {
        if (!responseCallback) {
            return self.mpdcallbacks.push(false);
        }

        self.mpdcallbacks.push({
              command: line.match(/^\S+/)[0]
            , callback: responseCallback
        });
        responseCallback = false;
    });

    return this._reallywrite.apply(this, Array.prototype.slice.call(arguments, 0, 3));
};

//
// Send a command to the MPD server.
// 
// This method takes care of escaping the input and offering
// a callback for MPD's response, whereas in the case of using
// the default `write` method one would have to manually listen
// for `data` events.
//
MPDClient.prototype.command = function(command, args, callback) {
    var args = args || []
      , self = this
      , callback = callback || function(err){
            if (err) self.emit('error', err);
        };

    if (!Array.isArray(args)) {
        args = [args];
    }

    if (args.length) {
        args = '"' + args.map(function(arg) {
            return (arg+'')
                .replace(/\t/g, '\\t')
                .replace(/\n/g, '\\n')
                .replace(/\"/g, '\\"');
        }).join('" "') + '"';
        
        this.write(command + ' ' + args + '\n', null, null, callback);
    } else {
        this.write(command + '\n', null, null, callback);
    }

    return this;
};

//
// Flush the buffered output from MPD.
// 
// In order to support callbacks for responses,
// data is buffered until a line starting with "OK"
// or "ACK" is found - these appear at the end of every
// response.
// 
// MPD should respond to commands in order, so we
// can keep a queue of callbacks for `command()`
// calls.
// 
// This method is called when we get an "OK".
//
MPDClient.prototype.flushBuffer = function() {
    var buffer = this.buffer
      , responseCallback
      , commandInfo;

    this.buffer = "";

    responseCallback = this.mpdcallbacks.splice(0, 1);

    responseCallback = responseCallback[0] || false;
    commandInfo = commands[responseCallback.command];

    buffer = ((commandInfo && commandInfo.parser) || parsers.generic)(buffer);

    if (responseCallback && responseCallback.callback) {
        responseCallback.callback.call(this, null, buffer);
    }
};

//
// React to "ACK" responses by MPD by emitting
// an error or sending it to the next callback.
//
MPDClient.prototype.errorBuffer = function(err) {
    var buffer = this.buffer
      , responseCallback;

    err = err.split(/\s/g).slice(1);
    err.unshift(err.splice(2).join(' '));
    err = err.join(' ');

    responseCallback = this.mpdcallbacks.splice(0, 1);
    responseCallback = responseCallback[0] || false;

    if (responseCallback && responseCallback.callback) {
        responseCallback.callback.call(this, new Error(err));
    }

    this.buffer = "";
};

MPDClient.prototype.sticker = function(type, uri) {
    return new MPDSticker(this, type, uri);
};

//
// Rather then writing each method individually
// it's easier generating most of them. There are
// a few cases though, such as with the `idle` command,
// where they'd be better off handled another way.
//
Object.keys(commands).forEach(function(command) {
    var name
      , commandInfo = commands[command];

    if (commandInfo.hide) return;

    name = commandInfo.alias || command;

    if (MPDClient.prototype[name]) return;

    MPDClient.prototype[name] = function() {
        var args = Array.prototype.slice.call(arguments)
          , callback = null;

        if (typeof args[args.length-1] === 'function') {
            callback = args.splice(-1)[0];
        }

        if (commandInfo.pre) {
            args = commandInfo.pre(args);
        }

        this.command(command, args, callback);
    };

    Object.keys(commandInfo).forEach(function(key) {
        MPDClient.prototype[name][key] = command[key];
    });
});

MPDClient.prototype.publish = MPDClient.prototype.sendmessage;
