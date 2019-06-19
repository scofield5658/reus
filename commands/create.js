var path = require('path');
var os = require('os');
var fs = require('fs');
var program = require('commander');
var log = require('fancy-log');
var rp = require('request-promise');
var unzipper = require('unzipper');
var del = require('del');

var mkdirs = function(dirname) {
  var dirs = dirname.split(path.sep);
  for (let i = 1, ii = dirs.length; i < ii; i++) {
    var tmp = dirs.slice(0, i + 1).join(path.sep);
    if (!fs.existsSync(tmp)) {
      fs.mkdirSync(tmp);
    }
  }
};

var writeFileSync = function(filepath, buffer) {
  mkdirs(path.dirname(filepath));
  fs.writeFileSync(filepath, buffer);
  return filepath;
};

var unzip = function(originfile, filepath) {
  fs.createReadStream(originfile)
    .pipe(unzipper.Extract({ path: filepath }))
    .promise()
    .then(() => {
      del([originfile]);
      fs.renameSync();
      log.info('done!');
    }, (err) => {
      log.error(err);
    });
};

program
  .command('create')
  .description('create app by specific template in current directory')
  .option('-t, --template [value]', 'template, eg. scofield5658/reus-simple-starter, used by default')
  .action(function (options) {
    var project_dir = path.join(process.cwd());
    var repo_name = `${options.template || 'scofield5658/reus-simple-starter'}`;
    var template_uri = `https://github.com/${repo_name}/archive/master.zip`;

    log.info(`========== Current Dir: ${project_dir} ==========`);
    log.info(`========== Template: ${template_uri} ==========`);

    rp({
      uri: template_uri,
      method: 'GET',
      resolveWithFullResponse: true,
      simple: false,
      encoding: null,
    }).then(response => {
      var downloadfile = path.join(project_dir, 'tmp.zip');
      writeFileSync(downloadfile, response.body);
      unzip(downloadfile, project_dir);
    });
  });

program.parse(process.argv);
