import gulp from 'gulp';
import clean from 'gulp-clean';
import path from 'path';

const projectDir = process.env.PROJECT_DIR;

gulp.task('clean:tmp', () => {
  return gulp.src([path.join(projectDir, '.tmp')], { read: false })
    .pipe(clean({ force: true }));
});

gulp.task('clean:dist', () => {
  return gulp.src([path.join(projectDir, '.dist')], { read: false })
    .pipe(clean({ force: true }));
});

gulp.task('clean', ['clean:tmp', 'clean:dist']);

