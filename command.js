#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var process = require('process');
var program = require('commander');
var flog = require('fancy-log');
var packageInfo = require('./package.json');

program.version(packageInfo.version, '-v, --version');
program.parse(process.argv);

if (fs.existsSync(path.join(__dirname, 'commands', `${program.args[0]}.js`))) {
  require(`./commands/${program.args[0]}`);
} else {
  flog.error(`[error] unknown args: ${program.args[0]}`);
}
