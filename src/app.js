const { getConfig } = require('./utils/common');
const { registerMiddleware, registerRoutes } = require('./utils/model');

(async () => {
  const config = getConfig();
  if (config.startups && Array.isArray(config.startups)) {
    for (const startup of config.startups) {
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
      maxFieldsSize: config.upload.max_field_size,
      maxFileSize: config.upload.max_file_size,
    },
    onError: (error, ctx) => {
      ctx.status = 400;
      ctx.body = new FailResponse(-1, config.upload.err_msg);
      return;
    },
  };

  const app = new Koa;
  app.use(Cors());
  app.use(KoaBody(UPLOAD_CONFIG));

  if (config.middlewares && Array.isArray(config.middlewares)) {
    for (const middleware of config.middlewares) {
      const middlewareInstance = registerMiddleware(middleware);
      app.use(middlewareInstance);
    }
  }


  if (config.routers) {
    let router;
    if (typeof config.routers === 'function') {
      router = registerRoutes(await config.routers());
    } else if (Array.isArray(config.routers)) {
      router = registerRoutes(config.routers);
    }
    app.use(router.routes(), router.allowedMethods());
  }

  console.log(`server started at: ${(new Date)}`);
  app.listen(config.app.port);
})();
