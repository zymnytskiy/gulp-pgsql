const through = require('through2');
const pg = require('pg');

module.exports = function(uri) {
  const listeners = [];
  let isReady = false;
  const onReady = function(cb) {
    if (isReady) cb();
    else listeners.push(cb);
  };

  const client = new pg.Client(uri);

  const stream = through.obj(function(file, encoding, callback) {
    onReady(function() {
      client.query(file.contents.toString(), function(err, result) {
        if (err) return this.emit('error', err);

        callback(null, file);
      });
    });
  });

  client.connect(function(err) {
    if (err) return stream.emit('error', err);

    isReady = true;
    if (listeners.length) {
      listeners.forEach(function(l) { l(); });
    }
  });

  stream.on('finish', function() {
    if (isReady) client.end();
  });

  return stream;
};
