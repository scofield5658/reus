var gulp = require('gulp');
var clean = require('gulp-clean');
var path = require('path');
var { getProjectDir } = require('../common');

var projectDir = getProjectDir();

gulp.task('clean:tmp', function() {
  return gulp.src([path.join(projectDir, '.tmp')], { read: false, allowEmpty: true })
    .pipe(clean({ force: true }));
});

gulp.task('clean:dist', function() {
  return gulp.src([path.join(projectDir, 'dist')], { read: false, allowEmpty: true })
    .pipe(clean({ force: true }));
});

gulp.task('clean', gulp.series('clean:tmp', 'clean:dist'));
