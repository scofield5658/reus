const path = require('path');
const fs = require('fs');
const default_config = require('./.config');

const getProjectDir = function() {
  return process.env.REUS_PROJECT_DIR;
};

const getProjectConfig = function() {
  const projectDir = getProjectDir();
  const ext_config = fs.existsSync(path.join(projectDir, 'project.config.json')) ? require(path.join(projectDir, 'project.config.json')) : {};
  return Object.assign({}, default_config, ext_config);
};

exports.getProjectDir = getProjectDir;

exports.getProjectConfig = getProjectConfig;

exports.getAppConfig = function() {
  const env = process.env.REUS_PROJECT_ENV;
  const projectDir = getProjectDir();
  const sourceDir = (!env || env === 'dev') ? 'src' : 'dist';
  const config = fs.existsSync(path.join(projectDir, sourceDir, 'app.config.js')) ? require(path.join(projectDir, sourceDir, 'app.config.js')) : {};
  return config;
};

exports.getProjectFilePath = function(files = []) {
  const projectDir = getProjectDir();
  const results = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (path.isAbsolute(file)) {
      results.push(file);
    } else {
      results.push(path.join(projectDir, file));
    }
  }
  return results;
};

exports.getPlugins = function() {
  const projectConfig = getProjectConfig();
  return projectConfig.buildPlugins || [];
};

exports.getPlugin = function(name) {
  const projectDir = getProjectDir();
  if (!fs.existsSync(path.join(projectDir, 'plugins'))) {
    throw 'plugins directory not found';
  }
  if (!name) {
    throw 'plugin name is not specific';
  }
  if (!fs.existsSync(path.join(projectDir, 'plugins', `${name}.js`))) {
    throw `plugin:${name} not found`;
  }
  const handler = require(path.join(projectDir, 'plugins', `${name}`));
  if (typeof handler === 'function') {
    return handler;
  }
  throw `plugin:${name} is not a function`;
};
