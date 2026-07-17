import path from 'path';

import gulp from 'gulp';
import nodemon from 'nodemon';
import browserSync from 'browser-sync';

import { getProjectDir, getProjectConfig, getProjectFilePath } from '../common.js';

import { createBrowserSyncOptions, reloadBrowserSync } from './serve-utils.js';

const projectDir = getProjectDir();
let projectConfig = getProjectConfig();

gulp.task('nodemon', function () {
  nodemon({
    script: './bin/app.js',
    watch: [path.join(projectDir, 'src')],
    ext: 'js',
    ignore: getProjectFilePath(projectConfig.browserSync.files || []),
  }).on('restart', function () {
    projectConfig = getProjectConfig();
    setTimeout(function () {
      reloadBrowserSync(projectConfig.browserSync, browserSync);
    }, projectConfig.browserSync.reloadDelay + 3000);
  });
});

gulp.task('browser-sync', function (done) {
  projectConfig = getProjectConfig();
  if (!projectConfig.browserSync.enabled) {
    done();
    return;
  }
  browserSync.init(
    createBrowserSyncOptions(projectConfig, getProjectFilePath),
    done,
  );
});

gulp.task('serve', gulp.series(
  'clean:tmp',
  gulp.parallel('nodemon', 'browser-sync'),
));
