import path from 'path';
import fs from 'fs';

import program from 'commander';
import log from 'fancy-log';
import rp from 'request-promise';
import unzipper from 'unzipper';
import del from 'del';

const mkdirs = function (dirname) {
  const dirs = dirname.split(path.sep);
  for (let i = 1, ii = dirs.length; i < ii; i++) {
    const tmp = dirs.slice(0, i + 1).join(path.sep);
    if (!fs.existsSync(tmp)) {
      fs.mkdirSync(tmp);
    }
  }
};

const writeFileSync = function (filepath, buffer) {
  mkdirs(path.dirname(filepath));
  fs.writeFileSync(filepath, buffer);
  return filepath;
};

const unzip = function (originfile, filepath) {
  fs.createReadStream(originfile)
    .pipe(unzipper.Extract({ path: filepath }))
    .promise()
    .then(() => {
      del([originfile]);
      log.info('done!');
    }, (err) => {
      log.error(err);
    });
};

program
  .command('create')
  .description('create app by specific template in current directory')
  .option('-t, --template [value]', 'template, eg. simple, used by default')
  .action(function (options) {
    const project_dir = path.join(process.cwd());
    const template_name = `${options.template || 'simple'}`;
    const template_uri = `https://github.com/scofield5658/reus-${template_name}-starter/archive/master.zip`;

    log.info(`========== Current Dir: ${project_dir} ==========`);
    log.info(`========== Template: ${template_uri} ==========`);

    rp({
      uri: template_uri,
      method: 'GET',
      resolveWithFullResponse: true,
      simple: false,
      encoding: null,
    }).then((response) => {
      const downloadfile = path.join(project_dir, 'tmp.zip');
      writeFileSync(downloadfile, response.body);
      unzip(downloadfile, project_dir);
    });
  });

program.parse(process.argv);
