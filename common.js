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
  return projectConfig.plugins || [];
};

exports.getPlugin = function(name) {
  const projectDir = getProjectDir();
  if (!name) {
    throw 'plugin name is not specific';
  }

  if (!fs.existsSync(path.join(projectDir, 'node_modules', name))) {
    throw `${name} not found in node_modules`;
  }

  const packageInfo = require(path.join(projectDir, 'node_modules', name, 'package.json'));
  const entry = packageInfo.main || 'index.js';

  if (!fs.existsSync(path.join(projectDir, 'node_modules', name, entry))) {
    throw `${name} has no entry`;
  }

  const handler = require(path.join(projectDir, 'node_modules', name, entry));
  return handler;
};
