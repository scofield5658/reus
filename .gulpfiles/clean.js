import path from 'path';

import gulp from 'gulp';
import clean from 'gulp-clean';

import { getProjectDir } from '../common.js';

const projectDir = getProjectDir();

gulp.task('clean:tmp', function () {
  return gulp.src([path.join(projectDir, '.tmp')], { read: false, allowEmpty: true })
    .pipe(clean({ force: true }));
});

gulp.task('clean:dist', function () {
  return gulp.src([path.join(projectDir, 'dist')], { read: false, allowEmpty: true })
    .pipe(clean({ force: true }));
});

gulp.task('clean', gulp.series('clean:tmp', 'clean:dist'));
