import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import child_process from 'child_process';

import program from 'commander';
import log from 'fancy-log';

import MODES from '../constants/mode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .command('launch <entry>')
  .description('launch app in specific mode')
  .option('-m, --mode [value]', 'mode, eg. dev/prod, use dev by default')
  .action(async function (entry, options) {
    const project_dir = path.isAbsolute(entry) ? entry : path.resolve(process.cwd(), entry);
    process.env.REUS_PROJECT_DIR = project_dir;
    process.env.REUS_PROJECT_ENV = MODES.includes(options.mode) ? options.mode : 'prod';
    log.info(`========== Project Dir: ${process.env.REUS_PROJECT_DIR} ==========`);
    log.info(`========== Running Mode: ${process.env.REUS_PROJECT_ENV} ==========`);

    let bootstrap;
    const gulpShell = os.platform() === 'win32' ? 'gulp.cmd' : 'gulp';
    if (process.env.REUS_PROJECT_ENV === 'dev') {
      let gulpEntry = path.resolve(__dirname, '..', 'node_modules', '.bin', gulpShell);
      const reusPath = path.resolve(__dirname, '..', 'gulpfile.js');
      const spawnOpts = os.platform() === 'win32' ? { shell: true } : {};
      if (fs.existsSync(gulpEntry)) {
        bootstrap = child_process.spawn(gulpEntry, ['--gulpfile', reusPath, 'serve'], spawnOpts);
      } else {
        gulpEntry = path.resolve(__dirname, '..', '..', 'gulp', 'bin', 'gulp.js');
        if (fs.existsSync(gulpEntry)) {
          bootstrap = child_process.spawn('node', [gulpEntry, '--gulpfile', reusPath, 'serve'], spawnOpts);
        } else {
          throw new Error('No Gulp Or Reus Is Broken ...');
        }
      }

      bootstrap.stdout.on('data', function (chunk) {
        console.info(chunk.toString());
      });

      bootstrap.stderr.on('data', function (chunk) {
        console.error(chunk.toString());
      });
    } else {
      const appEntry = path.resolve(__dirname, '..', 'bin', 'app.js');
      if (fs.existsSync(appEntry)) {
        await import(pathToFileURL(appEntry).href);
      } else {
        throw new Error('Reus Entry Is Broken ...');
      }
    }
  });

program.parse(process.argv);
