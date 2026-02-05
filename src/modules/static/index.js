import path from 'path';

import mount from 'koa-mount';
import serve from 'koa-static';

import { getProjectDir } from '../../../common.js';

export default function (projectConfig) {
  const baseUrl = (!process.env.REUS_PROJECT_ENV || process.env.REUS_PROJECT_ENV === 'dev') ? projectConfig.baseUrl : projectConfig.cdnUrl;
  const pagesUrl = path.join(getProjectDir(), (!process.env.REUS_PROJECT_ENV || process.env.REUS_PROJECT_ENV === 'dev') ? 'src' : 'dist', 'pages');
  return mount(baseUrl, serve(pagesUrl));
}
