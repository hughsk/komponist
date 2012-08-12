var parsers = require('./parsers')

module.exports = {
      "clearerror": {}
    , "currentsong": {
        parser: parsers.options({ single: true })
    }
    , "idle": {}
    , "status": {
        parser: parsers.single
    }
    , "stats": {
        parser: parsers.single
    }
    , "consume": {}
    , "crossfade": {}
    , "mixrampdb": {}
    , "mixrampdelay": {}
    , "random": {}
    , "repeat": {}
    , "setvol": {}
    , "single": {}
    , "replay_gain_mode": {}
    , "replay_gain_status": {}
    , "next": {}
    , "pause": {
          alias: "toggle"
        , pre: function(args) { return args ? 0 : 1; }
    }
    , "play": {}
    , "playid": {}
    , "previous": {}
    , "seek": {}
    , "seekid": {}
    , "seekcur": {}
    , "stop": {}
    , "add": {}
    , "addid": {}
    , "clear": {}
    , "delete": {}
    , "deleteid": {}
    , "move": {}
    , "moveid": {}
    , "playlist": {
        parser: parsers.array
    }
    , "playlistfind": {
        parser: parsers.options({ delimitOn: 'file', group: true })
    }
    , "playlistid": {
        parser: parsers.options({ delimitOn: 'file', group: true })
    }
    , "playlistinfo": {
        parser: parsers.options({ delimitOn: 'file', group: true })
    }
    , "playlistsearch": {
        parser: parsers.options({ delimitOn: 'file', group: true })
    }
    , "plchanges": {
        parser: parsers.options({ delimitOn: 'playlist', group: true })
    }
    , "plchangesposid": {}
    , "prio": {}
    , "prioid": {}
    , "shuffle": {}
    , "swap": {}
    , "swapid": {}
    , "listplaylist": {}
    , "listplaylistinfo": {}
    , "listplaylists": {}
    , "load": {}
    , "playlistadd": {}
    , "playlistclear": {}
    , "playlistdelete": {}
    , "playlistmove": {}
    , "rename": {}
    , "rm": {}
    , "save": {}
    , "count": {
        parser: parsers.options({ single: true })
    }
    , "find": {
        parser: parsers.options({ delimitOn: 'file', group: true })
    }
    , "findadd": {}
    , "list": {}
    , "listall": {}
    , "listallinfo": {}
    , "lsinfo": {}
    , "search": {
        parser: parsers.options({ delimitOn: 'file', group: true })
    }
    , "searchadd": {}
    , "searchaddpl": {}
    , "update": {}
    , "rescan": {}
    , "sticker": {
          alias: "_sticker"
        , parser: parsers.stickers
    }
    , "close": {
        hide: true
    }
    , "kill": {
        alias: "killServer"
    }
    , "password": {}
    , "ping": {}
    , "disableoutput": {}
    , "enableoutput": {}
    , "outputs": {
        parser: parsers.options({ delimitOn: 'outputid', group: true })
    }
    , "config": {}
    , "commands": {
        parser: parsers.options({ pluck: 'command', group: true })
    }
    , "notcommands": {}
    , "tagtypes": {
        parser: parsers.options({ pluck: 'tagtype', group: true })
    }
    , "urlhandlers": {
        parser: parsers.options({ pluck: 'handler', group: true })
    }
    , "decoders": {
        // @todo: Array instead of overwrite
        parser: parsers.options({ delimitOn: 'plugin', group: true })
    }
    , "subscribe": {}
    , "unsubscribe": {}
    , "sendmessage": {}
    , "readmessages": {
        parser: parsers.options({ delimitOn: 'channel' })
    }
    , "channels": {
        parser: parsers.options({ pluck: 'channel', group: true })
    }
};