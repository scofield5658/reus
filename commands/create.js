import path from 'path';

import program from 'commander';
import log from 'fancy-log';

import { createFromTemplate } from './create-core.js';
import { setFailureExitCode } from './process.js';

program
  .command('create')
  .description('create app by specific template in current directory')
  .option('-t, --template [value]', 'template, eg. simple, used by default')
  .action(async function (options) {
    const project_dir = path.join(process.cwd());
    const template_name = `${options.template || 'simple'}`;
    const template_uri = `https://github.com/scofield5658/reus-${template_name}-starter/archive/master.zip`;

    log.info(`========== Current Dir: ${project_dir} ==========`);
    log.info(`========== Template: ${template_uri} ==========`);

    try {
      await createFromTemplate(template_uri, project_dir);
      log.info('done!');
    } catch (error) {
      setFailureExitCode(error);
    }
  });

program.parse(process.argv);
