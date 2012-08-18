# komponist

A simple, yet flexible, Node client library for [MPD](http://mpd.wikia.com/),
the hackable headless audio playback server. As a bonus, it runs the same if
you use it server-side *or* on the browser!

## Installation

``` bash
npm install komponist
```

Of course, before you go ahead and write any code - make sure you
[install MPD](http://mpd.wikia.com/wiki/Install) and start it up wherever you
want to play your music from. You should probably get MPC (the simple CLI client)
too.

## Basic Usage

With a small number of exceptions, komponist exposes all of the available
commands as callback-style methods. For a full list
[check out the docs](http://www.musicpd.org/doc/protocol/).

``` javascript
var komponist = require('komponist')

var client = komponist.createConnection(6600, 'localhost', function() {
  client.add('~/iTunes', function(err) {
    client.play(function(err) {
      client.currentsong(function(err, info) {
        console.log(info.Artist); // Ennio Morricone
        console.log(info.Title);  // Il Buono, Il Cattivo, Il Brutto
        console.log(info.Album);  // The Good, The Bad, And The Ugly
      });
    });
  });
});
```

If you prefer to just fire and forget, you can omit the callbacks.

``` javascript
// You can always omit the port/host if you're running
// MPD locally and with the default settings.
komponist.createConnection(function(err, client) {
  client.add('~/iTunes');
  client.random();
  client.play();
});
```

There's also a general purpose `command` method:

``` javascript
var client = komponist.createConnection(function() {
  // Jump 60 seconds into the 5th track in your playlist:
  client.command('seek', [5, 60], function(err) {
    // And stop playing when it's done.
    client.command('single');
  });
});
```

The client returned by `komponist.createConnection` is just an extended TCP stream, so if you
like you can just pipe data around the Node way:

``` javascript
var fs = require('fs')
  , client = komponist.createConnection()

// Pipe a list of commands to MPD from
// a file, piping the raw response out to
// stdout! (For kicks)
fs.createReadStream('./commands.mpd', 'utf8')
  .pipe(client)
  .pipe(process.stdout)
```

## Watching for Changes

If you're building an interface-driven client for MPD, you're going to want to
be able to listen for changes as they happen. This is all taken care of for you:
just listen for the "changed" event for MPD updates.

``` javascript
var komponist = require('komponist')

komponist.createConnection(6600, 'localhost')
   .on('changed', function(system) {
     console.log('Subsystem changed: ' + system);
   });
```

According to the MPD protocol documentation, you can track changes to the
following systems this way:

* `update`: a database update has started or finished.
* `database`: the song database has been modified after `update`.
* `stored_playlist`: a stored playlist has been modified.
* `playlist`: the current playlist has been modified.
* `player`: the player has been started, stopped or seeked.
* `mixer`: the volume has been changed.
* `output`: an audio output has been enabled or disabled.
* `options`: options like repeat, random, crossfade, replay gain.
* `sticker`: the sticker database has been modified.
* `subscription`: a client has subscribed or unsubscribed to a channel.

## Publish/Subscribe

MPD has simple publish/subscribe support for communicating across multiple
clients. Using the `publish` and `subscribe` methods, you can send messages
to other subscribers across the network, e.g. for simple service discovery.

``` javascript
komponist.createConnection(function(err, subscriber) {
  subscriber.subscribe('hello');
  subscriber.subscribe('world');

  subscriber.on('message', function(message, channel) {
    console.log('Got message "' + message + '" on channel "' + channel + '"');
  });
});

komponist.createConnection(function(err, publisher) {
  setTimeout(function() {
    publisher.publish('hello', 'message #1');
    publisher.publish('world', 'message #2');
  }, 1000);
});

// Output:
// Got message "message #1" on channel "hello"
// Got message "message #2" on channel "world"
```

## Stickers

MPD stickers are a way for you to store arbitrary data in the MPD database,
associated with particular objects. Note that to enable stickers,
add `sticker_file ~/.mpd/mpd.stickers` to your `mpd.conf` file.

``` javascript
komponist.createConnection(function(err, client) {
  client.sticker('song', 'iTunes/song1.mp3').set({
      hello: 'world'
    , lorem: 'ipsum'
  }, function(err) {
    // The sticker method returns a reusable object, taking
    // the arguments "type" and "uri".
    var sticker = client.sticker('song', 'iTunes/song1.mp3');

    sticker.get('hello', function(err, data) {
      console.log(data); // { hello: 'world' }
    });

    sticker.get(['hello', 'lorem'], function(err, data) {
      console.log(data); // { hello: 'world', lorem: 'ipsum' }
    });

    sticker.list(function(err, data) {
      console.log(data); // { hello: 'world', lorem: 'ipsum' }
    });

    client.sticker('song', 'iTunes').find('lorem', function(err, data) {
      console.log(data[0].file);    // 'iTunes/song1.mp3'
      console.log(data[0].sticker); // { name: 'lorem', value: 'ipsum' }
      console.log(data[1].file);    // 'iTunes/song2.mp3'
      console.log(data[1].sticker); // { name: 'lorem', value: 'another ipsum' }
    });
  });

  client.sticker('song', 'iTunes/song2.mp3').set({
    lorem: 'another ipsum'
  });
});
```

If you're looking to use the command in the same style as above, it's still
accessible as `komponist._sticker()`.

## Using Komponist in the Browser

Thanks to the fact that Komponist connections are streams, you can get the use
the module just the same on the browser as you would server-side, using
[@substack](https://github.com/substack/)'s [browserify](//npmjs.org/package/browserify)
module.

``` javascript
// On the server:
var http = require('http')
  , komponist = require('komponist')

var server = http.createServer(function(req, res) {
  res.end('Hello world.')
});

komponist.install(server, 'localhost', 6600);

// And on the browser:
var komponist = require('komponist');

komponist.createConnection(function(err, client) {
  client.status(function(err, status) {
    console.log('Status: ', status);
  });
});
```

There's a full example available in the
[Github repository](https://github.com/hughsk/komponist/tree/master/examples/browser).

## Gotchas

The following methods are reserved for TCP sockets, and as such have been
aliased:

* `pause` is now `client.toggle()`
* `kill` is now `client.killServer()`
* `close` will close the connection without issuing a command to MPD.

There's no support for `command_list_*` commands right now.

You can still access them as normal through the `command` method. If you come
across any other bugs or inconsistencies, you're more than welcome create an
issue or a pull request.