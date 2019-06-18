var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync');
var path = require('path');
var { getProjectDir, getConfig } = require('../src/utils/common');

var projectDir = getProjectDir();;
var config = {};

gulp.task('nodemon', function() {
  nodemon({
    script: './bin/app.js',
    watch: [path.join(projectDir, 'src')],
    ext: 'js',
  }).on('restart', function() {
    config = getConfig();
    setTimeout(function() {
      browserSync.reload({
        stream: false
      });
    }, config.browserSync.reloadDelay + 3000);
  });
});

gulp.task('serve', ['clean:tmp', 'build', 'nodemon'], function() {
  config = getConfig();
  browserSync.init({
    proxy: `http://localhost:${config.port}`,
    port: config.browserSync.port,
    ui: {
      port: config.browserSync.ui_port,
    },
    reloadDelay: config.browserSync.reloadDelay,
    open: false,
    notify: config.browserSync.notify,
    scriptPath: config.browserSync.domain && function (path) {
      return `//${config.browserSync.domain}` + path;
    },
    socket: {
      domain: config.browserSync.domain
    }
  });
});
