const path = require('path');
const fs = require('fs');

const projectDir = process.env.PROJECT_DIR;
const config = fs.existsSync(path.join(projectDir, 'config.js')) ? require(path.join(projectDir, 'config.js')) : require('../.config');

(async () => {
  for (const startup of config.startups) {
    if (typeof startup === 'function') {
      await startup();
    }
  }

  let router = [];
  if (typeof config.routers === 'function') {
    router = await config.routers();
  } else if (Array.isArray(config.routers)) {
    router = config.routers;
  }

  const Koa = require('koa');
  const Cors = require('@koa/cors');
  const KoaBody = require('./modules/koa-body');
  const { FailResponse } = require('./models');

  const UPLOAD_CONFIG = {
    encoding: 'utf-8',
    multipart: true,
    formidable: {
      multipart: false,
      keepExtensions: true,
      maxFieldsSize: 10 * 1024 * 1024,
      maxFileSize: config.upload.maxFileSize,
    },
    onError: (error, ctx) => {
      ctx.status = 400;
      ctx.body = new FailResponse(-1, '文件解析错误');
      return;
    },
  };

  const app = new Koa;
  app.use(Cors());
  app.use(KoaBody(UPLOAD_CONFIG));

  for (const middleware of config.middlewares) {
    if (typeof middleware === 'function') {
      app.use(middleware)
    }
  }

  app.use(router.routes(), router.allowedMethods());

  console.log(`server started at: ${(new Date)}`);
  console.log(`current env is: ${config.env}`);
  app.listen(config.port);
})();
