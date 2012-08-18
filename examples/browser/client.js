// 
// You'll need to install Komponist's dev dependencies
// and the run `npm run-script make-examples` to build
// this example.
// 
// But that's all! Ordinarily you would run something
// along the lines of:
// 
// browserify examples/browser/client.js -o examples/browser/client.build.js
// 
// After using `sudo npm install -g browserify` of course :)
// 
var komponist = require('../../index')
  , client = komponist.createConnection(function(err, client) {
    console.log('Connected to MPD!');
  });

window.komponist = client;