const path = require('path');
const mount = require('koa-mount');
const serve = require('koa-static');
const { getProjectDir, getAppConfig } = require('../../../common');

module.exports = function(projectConfig) {
  const baseUrl = (!process.env.REUS_PROJECT_ENV || process.env.REUS_PROJECT_ENV === 'dev') ? projectConfig.baseUrl : projectConfig.cdnUrl;
  const pagesUrl = path.join(getProjectDir(), (!process.env.REUS_PROJECT_ENV || process.env.REUS_PROJECT_ENV === 'dev') ? 'src' : 'dist', 'pages');
  return mount(baseUrl, serve(pagesUrl));
};
