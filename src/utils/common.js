const path = require('path');
const fs = require('fs');
const default_config = require('../../.config');

const getProjectDir = () => {
  return process.env.REUS_PROJECT_DIR;
};

exports.getProjectDir = getProjectDir;

exports.getConfig = (env = process.env.NODE_ENV) => {
  const projectDir = getProjectDir();
  const sourceDir = (!env || env === 'dev') ? 'src' : 'dist';
  const ext_config = fs.existsSync(path.join(projectDir, sourceDir, 'reus.config.js')) ? require(path.join(projectDir, sourceDir, 'reus.config.js')) : {};
  return {
    ...default_config,
    ...ext_config,
  };
};
