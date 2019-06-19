const path = require('path');
const fs = require('fs');
const default_config = require('./.config');

const getProjectDir = () => {
  return process.env.REUS_PROJECT_DIR;
};

exports.getProjectDir = getProjectDir;

exports.getProjectConfig = () => {
  const projectDir = getProjectDir();
  const ext_config = fs.existsSync(path.join(projectDir, 'project.config.json')) ? require(path.join(projectDir, 'project.config.json')) : {};
  return Object.assign({}, default_config, ext_config);
};

exports.getAppConfig = (env = process.env.REUS_PROJECT_ENV) => {
  const projectDir = getProjectDir();
  const sourceDir = (!env || env === 'dev') ? 'src' : 'dist';
  const config = fs.existsSync(path.join(projectDir, sourceDir, 'app.config.js')) ? require(path.join(projectDir, sourceDir, 'app.config.js')) : {};
  return config;
};
