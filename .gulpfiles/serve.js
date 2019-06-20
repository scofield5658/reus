var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var nodemonEntity = require('nodemon');
var browserSync = require('browser-sync');
var path = require('path');
var { getProjectDir, getProjectConfig } = require('../common');

var projectDir = getProjectDir();
var config = getProjectConfig();

gulp.task('nodemon', function() {
  nodemon({
    script: './bin/app.js',
    watch: [path.join(projectDir, 'src')],
    ext: 'js',
    nodemon: nodemonEntity,
  }).on('restart', function() {
    config = getProjectConfig();
    setTimeout(function() {
      browserSync.reload({
        stream: false
      });
    }, config.browserSync.reloadDelay + 3000);
  });
});

gulp.task('serve', ['clean:tmp', 'nodemon'], function() {
  browserSync.init({
    proxy: `http://localhost:${config.browserSync.port}`,
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
