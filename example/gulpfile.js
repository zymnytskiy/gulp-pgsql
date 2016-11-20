const gulp = require('gulp');
const pgsql = require('..');

gulp.task('default', function() {
  return gulp.src('sql/**/*.pgsql')
    .pipe(pgsql('psql://postgres@localhost/postgres'));
});

