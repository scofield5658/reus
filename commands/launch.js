var os = require('os');
var path = require('path');
var fs = require('fs');
var program = require('commander');
var child_process = require('child_process');
var log = require('fancy-log');
var MODES = require('../constants/mode');

program
  .command('launch <entry>')
  .description('launch app in specific mode')
  .option('-m, --mode [value]', 'mode, eg. dev/prod, use dev by default')
  .action(function (entry, options) {
    var project_dir = path.isAbsolute(entry) ? entry : path.resolve(process.cwd(), entry);
    process.env.REUS_PROJECT_DIR = project_dir;
    process.env.REUS_PROJECT_ENV = MODES.includes(options.mode) ? options.mode : 'prod';
    log.info(`========== Project Dir: ${process.env.REUS_PROJECT_DIR} ==========`);
    log.info(`========== Running Mode: ${process.env.REUS_PROJECT_ENV} ==========`);

    var bootstrap;
    var gulpShell = os.platform() === 'win32' ? 'gulp.cmd' : 'gulp';
    if (process.env.REUS_PROJECT_ENV === 'dev') {
      var gulpEntry = `${path.resolve(__dirname, '..', 'node_modules', '.bin', gulpShell)}`;
      var reusPath = path.resolve(__dirname, '..', 'gulpfile.js');
      if (fs.existsSync(gulpEntry)) {
        bootstrap = child_process.spawn(gulpEntry, ['--gulpfile', reusPath, 'serve']);
      } else {
      // gulp in devDependency
        gulpEntry = `${path.resolve(__dirname, '..', '..', 'gulp', 'bin', 'gulp.js')}`;
        if (fs.existsSync(gulpEntry)) {
          bootstrap = child_process.spawn('node', [gulpEntry, '--gulpfile', reusPath, 'serve']);
        } else {
          throw new Error('No Gulp Or Reus Is Broken ...');
        }
      }

      bootstrap.stdout.on('data', function(chunk) {
        console.info(chunk.toString());
      });

      bootstrap.stderr.on('data', function(chunk) {
        console.error(chunk.toString());
      });
    } else {
      var appEntry = `${path.resolve(__dirname, '..', 'bin', 'app.js')}`;
      if (fs.existsSync(appEntry)) {
        require(appEntry);
      } else {
        throw new Error('Reus Entry Is Broken ...');
      }
    }
  });

program.parse(process.argv);
