var gulp = require('gulp');
var sequence = require('gulp-sequence');
var path = require('path');
var { getPlugins, getPlugin } = require('../common');

var reservedTaskName = ['copy', 'build', 'serve', 'clean:dist', 'clean:tmp'];
var sequences = [
  ['clean:dist', 'clean:tmp'],
  'copy'
];

var plugins = getPlugins();
for (let index = 0; index < plugins.length; index += 1) {
  var pluginName = plugins[index].name;
  if (!pluginName || reservedTaskName.indexOf(pluginName) > -1) {
    throw 'invalid plugin name'
  }
  var handler = getPlugin(pluginName);
  gulp.task(pluginName, function() {
    return handler(gulp, plugins[index].params || {});
  })
  sequences.push(pluginName);
}

gulp.task('copy', function() {
  return gulp.src(path.join(process.env.REUS_PROJECT_DIR, 'src', '**', '*'))
    .pipe(gulp.dest(process.env.REUS_PROJECT_OUTPUT));
});

var gulpSequence = sequence.apply(this, sequences)
gulp.task('build', gulpSequence);
