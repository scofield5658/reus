const { getProjectConfig, getAppConfig } = require('../common');
const { registerMiddleware, registerRoutes } = require('./utils');

(async () => {
  const projectConfig = getProjectConfig();
  const appConfig = getAppConfig();
  if (appConfig.startups && Array.isArray(appConfig.startups)) {
    for (const startup of appConfig.startups) {
      if (typeof startup === 'function') {
        await startup();
      }
    }
  }

  const Koa = require('koa');
  const Cors = require('@koa/cors');
  const KoaBody = require('koa-body');
  const { FailResponse } = require('./models');

  const UPLOAD_CONFIG = {
    encoding: 'utf-8',
    multipart: true,
    formidable: {
      multipart: false,
      keepExtensions: true,
      maxFieldsSize: projectConfig.upload.max_field_size,
      maxFileSize: projectConfig.upload.max_file_size,
    },
    onError: (error, ctx) => {
      ctx.status = 400;
      ctx.body = new FailResponse(-1, projectConfig.upload.err_msg);
      return;
    },
  };

  const app = new Koa;
  app.use(Cors());
  app.use(KoaBody(UPLOAD_CONFIG));

  if (appConfig.middlewares && Array.isArray(appConfig.middlewares)) {
    for (const middleware of appConfig.middlewares) {
      const middlewareInstance = registerMiddleware(middleware);
      app.use(middlewareInstance);
    }
  }

  if (appConfig.routers) {
    let router;
    if (typeof appConfig.routers === 'function') {
      router = registerRoutes(await appConfig.routers());
    } else if (Array.isArray(appConfig.routers)) {
      router = registerRoutes(appConfig.routers);
    }
    app.use(router.routes(), router.allowedMethods());
  }

  console.log(`server started at: ${(new Date)}`);
  console.log(`server port: ${projectConfig.app.port}`);
  app.listen(projectConfig.app.port);
})();
