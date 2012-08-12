var options = module.exports.options = function(options) {
    var options = options || {};

    options.split = !!options.split;

    return function(buffer) {
        var objn = 0;

        buffer = buffer.split('\n').reduce(function(memo, line) {
            if (!line.match(/\S/)) return memo;

            line = line.split(':').map(function(part) {
                return part.replace(/^\s*|\s*$/g, '')
            });

            if (!options.single && (options.delimitOn ? line[0] === options.delimitOn : memo[objn][line[0]]) && Object.keys(memo[objn]).length) {
                objn += 1;
                memo[objn] = {};
            }

            if (!options.split) {
                memo[objn][line[0]] = line.length > 2 ? line.slice(1).join(':') : line[1];
            } else {
                memo[objn][line[0]] = line.length > 2 ? line.slice(1) : line[1];
            }

            return memo;
        }, [{}]);

        if (options.pluck) {
            buffer = buffer.reduce(function(plucked, item) {
                if (item[options.pluck]) {
                    plucked.push(item[options.pluck]);
                }
                return plucked;
            }, []);
        }

        if (!options.group && buffer.length === 1) {
            buffer = buffer[0];
        }

        if (options.after) {
            buffer = options.after(buffer);
        }

        return buffer;
    };
};

module.exports.generic = options();
module.exports.single = options({ single: true });

module.exports.stickers = options({
      group: true
    , after: function(buffer) {
        var makeArray = false;

        buffer = buffer.reduce(function(memo, data, n) {
            var sticker, value, file;

            if (!Object.keys(data).length) return memo;

            file = data.file;
            data = data.sticker.split('=');
            sticker = data[0];
            value = data.slice(1).join('=');

            if (makeArray || file) {
                makeArray = true;
                memo.arrayData = memo.arrayData || [];
                memo.arrayData.push({
                      file: file
                    , sticker: {
                          name: sticker
                        , value: value
                    }
                });
            } else {
                memo[sticker] = value;
            }  

            return memo;
        }, {});

        if (makeArray) {
            buffer = buffer.arrayData;
        }

        return buffer;
    }
});

module.exports.array = function(buffer) {
    var queued = '';

    buffer = buffer.split('\n').reduce(function(memo, line) {
        if (!line.match(/\S/)) return memo;

        line = line.split(':');

        if (line[0] && line[0].match(/^[0-9]+$/g)) {
            if (queued) {
                memo.push(module.exports.single(queued));
            }
            queued = line.slice(1).join(':');
        } else {
            queued += line.join(':');
        }

        return memo;
    }, []);

    if (queued) {
        buffer.push(module.exports.single(queued));
    }

    return buffer;
};