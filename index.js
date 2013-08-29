var MPDClient = module.exports.MPDClient = require('./lib/client.js')
  , shoe = require('shoe')
  , net;

try { net = require('net'); } catch(e) {}

//
// Convenience method for connecting to an MPD
// server and getting a client instance in return.
//
module.exports.createConnection = function(port, host, callback) {
    var client = new MPDClient()

    if (typeof port === 'function') {
        callback = port;
        port = 6600;
        host = 'localhost';
    } else
    if (typeof host === 'function') {
        callback = host;
        host = 'localhost';
    } else {
        port = port || 6600;
        host = host || 'localhost';
        callback = callback || function(){};
    }

    if(+port != +port) { // port is NaN, i.e. path
        client.connect(port);
    } else {
        client.connect(+port, host);
    }
    client.once('ready', function() {
        process.nextTick(function(){
            callback(null, client);
        });
    });
    
    return client;
};

module.exports.createStream = function() {
    return new MPDClient();
};

module.exports.createConnection = MPDClient.prototype.connect ?
    module.exports.createConnection :
    function (uri, callback) {
        var client = new MPDClient()
          , uri = uri || '/komponist'
          , callback = callback || function(){};

        if (typeof uri === 'function') {
            callback = uri;
            uri = '/komponist';
        }

        client.once('ready', function() {
            callback(null, client);
        });

        return shoe(uri).pipe(client);
    };

// 
// Simple wrapper function for piping content between `shoe`
// and the browser:
// 
module.exports.install = function(server, port, host, uri) {
    if (!net) throw new Error('install is a server-side only method');

    var uri = uri || '/komponist'
      , host = host || 'localhost'
      , port = port || 6600;

    var sock = shoe(function(stream) {
        var client = net.createConnection(host, port)

        client.pipe(stream);

        stream.on('data', function(data) {
            client.write(data);
        });
    });

    sock.install(server, uri);
};
