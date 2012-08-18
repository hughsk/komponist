var komponist = require('../../index')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')

// A lazy static file server.
var server = http.createServer(function(req, res, next) {
	var filename;

	if (req.url === '/') {
		req.url = '/index.html';
	}
	req.url = req.url.replace(/^\//g, '');
	filename = path.resolve(__dirname, req.url);

	fs.exists(filename, function(exists) {
		if (!exists) {
			return res.end('404');
		}
		fs.createReadStream(filename).pipe(res);
	})
});

// HTTP available at port 9000
server.listen(9000, function() {
	console.log('Demo server running on port 9000')
});

// Open up a proxy on the HTTP server that points
// to MPD (assuming it's accessible at localhost:6600).
komponist.install(server, 'muse.io', 6600);