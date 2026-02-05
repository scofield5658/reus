import path from 'path';

import gulp from 'gulp';
import nodemon from 'gulp-nodemon';
import nodemonEntity from 'nodemon';
import browserSync from 'browser-sync';

import { getProjectDir, getProjectConfig, getProjectFilePath } from '../common.js';

const projectDir = getProjectDir();
let projectConfig = getProjectConfig();

gulp.task('nodemon', function () {
  nodemon({
    script: './bin/app.js',
    watch: [path.join(projectDir, 'src')],
    ext: 'js',
    ignore: getProjectFilePath(projectConfig.browserSync.files || []),
    nodemon: nodemonEntity,
  }).on('restart', function () {
    projectConfig = getProjectConfig();
    setTimeout(function () {
      browserSync.reload({
        stream: false,
      });
    }, projectConfig.browserSync.reloadDelay + 3000);
  });
});

gulp.task('serve', gulp.series('clean:tmp', 'nodemon'), function () {
  browserSync.init({
    proxy: `http://localhost:${projectConfig.browserSync.port}`,
    files: getProjectFilePath(projectConfig.browserSync.files || []),
    port: projectConfig.browserSync.port,
    ui: {
      port: projectConfig.browserSync.ui_port,
    },
    reloadDelay: projectConfig.browserSync.reloadDelay,
    open: false,
    notify: projectConfig.browserSync.notify,
    scriptPath: projectConfig.browserSync.domain && function (path) {
      return `//${projectConfig.browserSync.domain}` + path;
    },
    socket: {
      domain: projectConfig.browserSync.domain,
    },
  });
});
