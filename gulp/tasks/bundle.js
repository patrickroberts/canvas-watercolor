const path = require('path')

const gulp = require('gulp')
const babelify = require('babelify')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const sourcemaps = require('gulp-sourcemaps')
const gutil = require('gulp-util')

const uglify = require('uglify-es')
const composer = require('gulp-uglify/composer')

const minify = composer(uglify, console)

const config = require('../config')

gulp.task('bundle', () => {
  const basename = path.basename(config.paths.lib.src)
  const dirname = path.dirname(config.paths.lib.src)
  const rootbase = path.basename(dirname) + '/' + basename
  const rootdir = path.dirname(dirname)

  const browser = browserify({
    debug: true,
    entries: rootbase,
    basedir: rootdir,
    standalone: config.names.glob
  })

  return browser
    .transform(babelify)
    .bundle()
    .pipe(source(config.names.lib))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(minify())
    .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.paths.lib.dst))
})
