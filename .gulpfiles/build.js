import gulp from 'gulp';
import sequence from 'gulp-sequence';
import path from 'path';

const projectDir = process.env.PROJECT_DIR;

gulp.task('copy', () => {
  return gulp.src(path.join(projectDir, 'src'))
    .pipe(gulp.dest(path.join(projectDir, 'dist')));
});

gulp.task('build', sequence(
  ['clean:dist', 'clean:tmp'],
  'copy',
  'clean:tmp'
));
