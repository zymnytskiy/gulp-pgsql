# gulp-pgsql

Plugin to sync your pgsql scripts with your database. This is really useful in development.

# Install

```
npm install gulp-pgsql --save-dev
```

# Basic usage

Use something like below to apply your scripts to database:

```javascript
const pgsql = require('gulp-pgsql');

gulp.task('pgsql', function(done) {
  gulp.src(['db/**/*.pgsql'])
    .pipe(pgsql('psql://postgres@localhost/postgres')
      .on('error', pgsql.log)
      .on('notice', pgsql.log)
    )
    .on('finish', done);
});
```

And something like this to watch changes and automatically apply it:

```javascript
gulp.task('watch:pgsql', ['pgsql'], function() {
  gulp.watch(['db/**/*.pgsql'])
    .on('change', function(file) {
      return gulp.src(file.path)
        .pipe(pgsql('psql://postgres@localhost/postgres')
          .on('error', pgsql.log)
          .on('notice', pgsql.log)
        );
    });
});
```

