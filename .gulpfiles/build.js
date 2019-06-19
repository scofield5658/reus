var gulp = require('gulp');
var sequence = require('gulp-sequence');
var path = require('path');

gulp.task('copy', function() {
  return gulp.src(path.join(process.env.REUS_PROJECT_DIR, 'src', '**', '*'))
    .pipe(gulp.dest(process.env.REUS_PROJECT_OUTPUT));
});

gulp.task('build', sequence(
  ['clean:dist', 'clean:tmp'],
  'copy',
  'clean:tmp'
));
