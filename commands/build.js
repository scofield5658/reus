import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import child_process from 'child_process';

import program from 'commander';
import log from 'fancy-log';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program
  .command('build <entry>')
  .description('build app in specific mode')
  .action(function (entry) {
    const project_dir = path.isAbsolute(entry) ? entry : path.resolve(process.cwd(), entry);
    const output_dir = path.resolve(project_dir, 'dist');
    process.env.REUS_PROJECT_ENV = 'prod';
    process.env.REUS_PROJECT_DIR = project_dir;
    process.env.REUS_PROJECT_OUTPUT = output_dir;
    log.info(`========== Project Dir: ${process.env.REUS_PROJECT_DIR} ==========`);
    log.info(`========== Output Dir: ${process.env.REUS_PROJECT_OUTPUT} ==========`);

    const gulpShell = os.platform() === 'win32' ? 'gulp.cmd' : 'gulp';
    let gulpEntry = path.resolve(__dirname, '..', 'node_modules', '.bin', gulpShell);
    const reusPath = path.resolve(__dirname, '..', 'gulpfile.js');
    const spawnOpts = os.platform() === 'win32' ? { shell: true } : {};
    let bootstrap;
    if (fs.existsSync(gulpEntry)) {
      bootstrap = child_process.spawn(gulpEntry, ['--gulpfile', reusPath, 'build'], spawnOpts);
    } else {
      gulpEntry = path.resolve(__dirname, '..', '..', 'gulp', 'bin', 'gulp.js');
      if (fs.existsSync(gulpEntry)) {
        bootstrap = child_process.spawn('node', [gulpEntry, '--gulpfile', reusPath, 'build'], spawnOpts);
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
  });

program.parse(process.argv);
