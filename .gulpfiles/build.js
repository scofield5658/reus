const path = require('path');
const gulp = require('gulp');
const babel = require('gulp-babel');
const { getProjectDir, getPlugins, getPlugin } = require('../common');

const reservedTaskName = ['copy', 'build', 'serve', 'clean:dist', 'clean:tmp'];
const sequences = [
  'clean:dist',
  'clean:tmp',
  'copy'
];

const plugins = getPlugins();
if (plugins.length) {
  let mixins = {};
  for (let index = plugins.length - 1; index > 0; index -= 1) {
    const pluginName = plugins[index].name;
    if (!pluginName || reservedTaskName.indexOf(pluginName) > -1) {
      throw 'invalid plugin name'
    }
    const handler = getPlugin(pluginName);
    if (handler.mixins) {
      mixins = Object.assign(mixins, handler.mixins);
    }
  }

  const pluginName = plugins[0].name;
  const handler = getPlugin(pluginName);
  const buildHandler = handler.build;
  if (buildHandler && typeof buildHandler === 'function') {
    const params = plugins[0].params && require(path.join(getProjectDir(), plugins[0].params)) || {};
    (function(handler) {
      gulp.task(pluginName, function() {
        return handler(getProjectDir(), params, mixins)(gulp);
      })
    })(buildHandler)
    sequences.push(pluginName);
  }
}

gulp.task('copy', function() {
  return gulp.src([
    path.join(process.env.REUS_PROJECT_DIR, 'src', '**', '*'),
    `!${path.join(process.env.REUS_PROJECT_DIR, 'src', 'pages', '**', 'node_modules', '**', '*')}`
  ])
    .pipe(babel({
      presets: [
        ['env', {
          modules: 'commonjs',
          targets: { node: 'current' }
        }]
      ],
      plugins: [
        'syntax-dynamic-import',
        'transform-object-rest-spread',
        'transform-runtime'
      ]
    }))
    .pipe(gulp.dest(process.env.REUS_PROJECT_OUTPUT));
});

gulp.task('build', gulp.series(...sequences));
