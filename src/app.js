const path = require('path');
const { getProjectDir, getProjectConfig, getAppConfig, getPlugins, getPlugin } = require('../common');
const { registerMiddleware, registerRoutes } = require('./utils');
const httpHelper = require('./helpers/http');
const jsonHelper = require('./helpers/json');

const plugins = getPlugins().map(v => Object.assign({}, getPlugin(v.name), { config: v.params }));

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
  app.use(KoaBody(UPLOAD_CONFIG));
  app.use(jsonHelper);
  app.use(httpHelper);

  if (appConfig.middlewares && Array.isArray(appConfig.middlewares)) {
    for (const middleware of appConfig.middlewares) {
      const middlewareInstance = registerMiddleware(middleware);
      app.use(middlewareInstance);
    }
  }

  let handleRender;
  let renderConfig = {};
  if (Array.isArray(plugins)) {
    for (let i = 0; i < plugins.length; i += 1) {
      const plugin = plugins[i];
      const projectDir = getProjectDir();
      const configDir = path.join(projectDir, plugin.config);
      const pluginConfig = configDir && require(configDir) || {};
      if (Array.isArray(plugin.launch)) {
        for (let j = 0; j < plugin.launch.length; j += 1) {
          const plugin_middleware = plugin.launch[j];
          app.use(plugin_middleware(projectDir, pluginConfig));
        }
      }
      if (!handleRender && typeof plugin.render === 'function') {
        handleRender = plugin.render(projectDir, pluginConfig);
        renderConfig = pluginConfig;
        app.use(function(ctx, next) {
          ctx.render = handleRender;
          return next();
        });
      }
    }
  }

  if (appConfig.routers) {
    let router;
    if (typeof appConfig.routers === 'function') {
      router = registerRoutes(await appConfig.routers(), renderConfig);
    } else if (Array.isArray(appConfig.routers)) {
      router = registerRoutes(appConfig.routers, renderConfig);
    }
    app.use(router.routes(), router.allowedMethods());
  }

  console.log(`server started at: ${(new Date)}`);
  console.log(`server port: ${projectConfig.app.port}`);
  app.listen(projectConfig.app.port);
})();
