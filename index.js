const through = require('through2');
const pg = require('pg');
const gutil = require('gulp-util');

function getLine(file, pos) {
  let i;
  for (i = pos - 1; i >= 0; i--) {
    if (file[i] === '\n')
      break;
  }

  let line = file.substr(i + 1);
  line = line.substr(0, line.indexOf('\n'));
  const lines = file.split('\n');
  let num;
  lines.forEach((l, i) => { if (l === line) num = i + 1; });
  return { line, pos: pos - i - 1, num };
}

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
        if (err) {
          const line = getLine(file.contents.toString(), Number(err.position));
          return stream.emit('error', Object.assign(err, { file: file.path, line }));
        }

        callback(null, file);
      });
    });
  });

  client.connection.on('PgError', function(err) {
    switch (err.severity) {
      case 'ERROR':
      case 'FATAL':
      case 'PANIC':
        return this.emit('error', err);
      default:
        return stream.emit('notice', err);
    }
  });

  client.connect(function(err) {
    if (err) return stream.emit('error', err);

    isReady = true;
    if (listeners.length) {
      listeners.forEach(function(l) { l(); });
    }
  });

  stream.on('error', function(err) {
    if (isReady) client.end();
  });

  stream.on('finish', function() {
    if (isReady) client.end();
  });

  return stream;
};

module.exports.log = function(err) {
  if (err.file) {
    gutil.log(gutil.colors.yellow('[pgsql]'), 'Error at ', err.file);
  }

  if (err.severity) {
    gutil.log(gutil.colors.yellow('[pgsql]'), err.severity + ': ', err.message);
  } else {
    gutil.log(gutil.colors.yellow('[pgsql]'), err.message);
  }

  if (err.where) {
    gutil.log(gutil.colors.yellow('[pgsql]'), 'CONTEXT: ', err.where);
  } else if (err.line && err.line.num) {
    const info = 'LINE ' + err.line.num + ':';
    gutil.log(gutil.colors.yellow('[pgsql]'), info, err.line.line);
    const spaces = (n) => Array.from({ length: n }, () => ' ').join('');
    gutil.log(gutil.colors.yellow('[pgsql]'), spaces(info.length), spaces(err.line.pos - 1) + '^');
  }
};
