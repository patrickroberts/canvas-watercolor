const gulp = require('gulp')

gulp.task('docs:static', () => {
  gulp.src('examples/server/static/**/*')
    .pipe(gulp.dest('docs'))
})

gulp.task('docs:umd', () => {
  gulp.src('umd/*')
    .pipe(gulp.dest('docs/js'))
})

gulp.task('docs', ['docs:static', 'docs:umd'])
