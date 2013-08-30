var komponist = require('../../index');

var client = komponist.createConnection('/home/bananushka/.mpd/socket',
    function(err, client) {
  if(err) {
    throw err;
  }
  client.command('list', ['artist'], function(err, results) {
    if(err) {
      throw err;
    }
    results.forEach(function(result, index) {
      client.command('find', [ 'artist', result.Artist ], function(err, info) {
        if(err) {
          throw err;
        }
        console.log(info[0].Artist, info.length);
      });
    });
  });
});
