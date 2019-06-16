const path = require('path');
const fs = require('fs');
const default_config = require('../../.config');

const getProjectDir = () => {
  return process.env.REUS_PROJECT_DIR;
};

exports.getProjectDir = getProjectDir;

exports.getConfig = () => {
  const projectDir = getProjectDir();
  const ext_config = fs.existsSync(path.join(projectDir, 'reus.config.js')) ? require(path.join(projectDir, 'reus.config.js')) : {};
  return {
    ...default_config,
    ...ext_config,
  };
};
