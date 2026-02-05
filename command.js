#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import program from 'commander';
import flog from 'fancy-log';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const packageInfo = require(path.join(__dirname, 'package.json'));

program.version(packageInfo.version, '-v, --version');
program.parse(process.argv);

if (fs.existsSync(path.join(__dirname, 'commands', `${program.args[0]}.js`))) {
  await import(`./commands/${program.args[0]}.js`);
} else {
  flog.error(`[error] unknown args: ${program.args[0]}`);
}
