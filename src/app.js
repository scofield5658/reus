const { getConfig } = require('./utils/common');
const { registerRoutes } = require('./utils/model');

(async () => {
  const config = getConfig();
  for (const startup of config.startups) {
    if (typeof startup === 'function') {
      await startup();
    }
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

  for (const middleware of config.middlewares) {
    if (typeof middleware === 'function') {
      app.use(middleware);
    }
  }

  let router;
  if (typeof config.routers === 'function') {
    router = registerRoutes(await config.routers());
  } else if (Array.isArray(config.routers)) {
    router = registerRoutes(config.routers);
  }
  app.use(router.routes(), router.allowedMethods());

  console.log(`server started at: ${(new Date)}`);
  console.log(`current env is: ${config.app.env}`);
  app.listen(config.app.port);
})();
