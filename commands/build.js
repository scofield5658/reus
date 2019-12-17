var os = require('os');
var path = require('path');
var fs = require('fs');
var program = require('commander');
var child_process = require('child_process');
var log = require('fancy-log');

program
  .command('build <entry>')
  .description('build app in specific mode')
  .action(function (entry, options) {
    var project_dir = path.isAbsolute(entry) ? entry : path.resolve(process.cwd(), entry);
    var output_dir = path.resolve(project_dir, 'dist');
    process.env.REUS_PROJECT_ENV = 'prod';
    process.env.REUS_PROJECT_DIR = project_dir;
    process.env.REUS_PROJECT_OUTPUT = output_dir;
    log.info(`========== Project Dir: ${process.env.REUS_PROJECT_DIR} ==========`);
    log.info(`========== Output Dir: ${process.env.REUS_PROJECT_OUTPUT} ==========`);

    var gulpShell = os.platform() === 'win32' ? 'gulp.cmd' : 'gulp';
    var gulpEntry = `${path.resolve(__dirname, '..', 'node_modules', '.bin', gulpShell)}`;
    var reusPath = path.resolve(__dirname, '..', 'gulpfile.js');
    var bootstrap;
    if (fs.existsSync(gulpEntry)) {
      bootstrap = child_process.spawn('node', [gulpEntry, '--gulpfile', reusPath, 'build']);
    } else {
      // gulp in devDependency
      gulpEntry = `${path.resolve(__dirname, '..', '..', 'gulp', 'bin', 'gulp.js')}`;
      if (fs.existsSync(gulpEntry)) {
        bootstrap = child_process.spawn('node', [gulpEntry, '--gulpfile', reusPath, 'build']);
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
  });

program.parse(process.argv);
