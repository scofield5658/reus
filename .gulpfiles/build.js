var gulp = require('gulp');
var sequence = require('gulp-sequence');
var path = require('path');
var { getProjectDir } = require('../common');

var projectDir = getProjectDir();

gulp.task('copy', function() {
  return gulp.src(path.join(projectDir, 'src'))
    .pipe(gulp.dest(path.join(projectDir, 'dist')));
});

gulp.task('build', sequence(
  ['clean:dist', 'clean:tmp'],
  'copy',
  'clean:tmp'
));
