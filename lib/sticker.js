var MPDSticker = module.exports = function MPDSticker(parent, type, uri) {
    if (!(this instanceof MPDSticker)) {
        return new MPDSticker(parent, type, uri);
    }

    this.parent = parent;
    this.type = type;
    this.uri = uri;
};

MPDSticker.prototype.get = function(keys, callback) {
    var parent = this.parent
      , type = this.type
      , uri = this.uri
      , complete = 0
      , error = null
      , finished
      , callback = callback || function(err) {
        if (err) parent.emit('error', err);
      };

    if (!Array.isArray(keys)) {
        keys = [keys];
    }

    keys.forEach(function(key, n) {
        parent._sticker('get', type, uri, key, function(err, data) {
            complete += 1;
            error = err || error;
            keys[n] = data;

            if (complete === keys.length) {
                callback(error, finished(keys));
            }
        });
    });

    finished = function finished(keys) {
        return keys.reduce(function(memo, sticker) {
            if (!sticker) return memo;

            Object.keys(sticker).forEach(function(key) {
                memo[key] = sticker[key];
            });

            return memo;
        }, {});
    };
};

MPDSticker.prototype.set = function(values, callback) {
    var setters = []
      , parent = this.parent
      , type = this.type
      , uri = this.uri
      , complete = 0
      , error = null
      , callback = callback || function(err) {
        if (err) parent.emit('error', err);
      }

    Object.keys(values).forEach(function(key) {
        setters.push({ key: key, value: values[key] });
    });

    setters.forEach(function(setter, n) {
        parent._sticker('set', type, uri, setter.key, setter.value, function(err, data) {
            complete += 1;
            error = err || error;

            if (complete === setters.length) {
                callback(error);
            }
        });
    });
};

MPDSticker.prototype.find = function(key, callback) {
    var parent = this.parent;
    return parent._sticker('find', this.type, this.uri, key, callback || function(err) {
        if (err) return parent.emit('error', err);
    });
};

MPDSticker.prototype.list = function(callback) {
    var parent = this.parent;
    return parent._sticker('list', this.type, this.uri, callback || function(err) {
        if (err) return parent.emit('error', err);
    });
};