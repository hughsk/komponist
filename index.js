var MPDClient = module.exports.MPDClient = require('./lib/client.js')

//
// Convenience method for connecting to an MPD
// server and getting a client instance in return.
//
module.exports.connect = function(port, host, callback) {
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

    client.connect(port, host);
    client.once('ready', function() {
        process.nextTick(function(){
            callback(null, client);
        });
    });
    
    return client;
};