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
    process.env.NODE_ENV = MODES.includes(options.mode) ? options.mode : 'dev';
    log.info(`========== Project Dir: ${process.env.REUS_PROJECT_DIR} ==========`);
    log.info(`========== Running Mode: ${process.env.NODE_ENV} ==========`);

    var gulpEntry = `${path.resolve(__dirname, '..', 'node_modules', '.bin', 'gulp')}`;
    var reusPath = path.resolve(__dirname, '..', 'gulpfile.js');
    if (fs.existsSync(gulpEntry)) {
      if (os.platform() === 'win32') {
        bootstrap = child_process.spawn(gulpEntry, ['--gulpfile', reusPath, 'serve']);
      } else {
        bootstrap = child_process.spawn('node', [gulpEntry, '--gulpfile', reusPath, 'serve']);
      }
    } else {
      // gulp in devDependency
      gulpEntry = `${path.resolve(__dirname, '..', '..', 'gulp', 'bin', 'gulp.js')}`;
      if (fs.existsSync(gulpEntry)) {
        if (os.platform() === 'win32') {
          bootstrap = child_process.spawn(gulpEntry, ['--gulpfile', reusPath, 'serve']);
        } else {
          bootstrap = child_process.spawn('node', [gulpEntry, '--gulpfile', reusPath, 'serve']);
        }
      } else {
        throw new Error('No Gulp Or Reus Is Broken ...');
      }
    }

    bootstrap.stdout.on('data', function(chunk) {
      log.info(chunk.toString());
    });

    bootstrap.stderr.on('data', function(chunk) {
      log.error(chunk.toString());
    });
  });

program.parse(process.argv);
