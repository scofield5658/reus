#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const process = require('process');
const program = require('commander');
const flog = require('fancy-log');
const packageInfo = require('../package.json');

program.version(packageInfo.version, '-v, --version');
program.parse(process.argv);

if (fs.existsSync(path.join(__dirname, 'commands', `${program.args[0]}.js`))) {
  require(`./commands/${program.args[0]}`);
} else {
  flog.error(`[error] unknown args: ${program.args[0]}`);
}
