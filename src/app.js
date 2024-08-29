const path = require('path');
const { koaSwagger } = require('koa2-swagger-ui');
const yamljs = require('yamljs');

const { getProjectDir, getProjectConfig, getAppConfig, getPlugins, getPlugin } = require('../common');
const { registerMiddleware, registerRoutes, registerProxies } = require('./utils');
const staticHandler = require('./modules/static');
const httpHelper = require('./helpers/http');
const jsonHelper = require('./helpers/json');

const plugins = getPlugins().map(v => Object.assign({}, getPlugin(v.name), { config: v.params }));

(async () => {
  const projectConfig = getProjectConfig();
  const appConfig = getAppConfig();
  if (appConfig.startups && Array.isArray(appConfig.startups)) {
    await (function() {
      return appConfig.startups.reduce((prev, startup) => {
        if (typeof startup === 'function') {
          return prev.then(() => startup());
        }
        return prev.then(() => resolve());
      }, Promise.resolve());
    })();
  }

  const Koa = require('koa');
  const KoaBody = require('koa-body').default;

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
      const errMsg = projectConfig.upload.err_msg;
      ctx.throw(400, errMsg);
    },
  };

  const app = new Koa(projectConfig.koaConfig);

  // swagger
  if (process.env.REUS_PROJECT_ENV === 'dev') {
    try {
      const projectDir = getProjectDir();
      const swaggerOptions = {};
      if (appConfig.swaggerOptions) {
        Object.assign(swaggerOptions, { ...appConfig.swaggerOptions });
      } else if (appConfig.swaggerYmlFile) {
        Object.assign(swaggerOptions, {
          sepc: yamljs.load(path.isAbsolute(appConfig.swaggerYmlFile) ? appConfig.swaggerYmlFile : path.join(projectDir, appConfig.swaggerYmlFile)),
        });
      }
      app.use(
        koaSwagger({
          routePrefix: appConfig.swaggerRoutePrefix || '/swagger/index.html',
          swaggerCdnUrl: appConfig.swaggerCdnUrl,
          swaggerOptions,
        }),
      );
    } catch (e) {
      console.error(e);
    }
  }

  // global middleware
  if (appConfig.middlewares && Array.isArray(appConfig.middlewares)) {
    for (const middleware of appConfig.middlewares) {
      const middlewareInstance = registerMiddleware(middleware, app);
      app.use(middlewareInstance);
    }
  }

  // proxy routers
  if (appConfig.routers) {
    let proxies;
    if (typeof appConfig.routers === 'function') {
      proxies = registerProxies(await appConfig.routers(), {});
    } else if (Array.isArray(appConfig.routers)) {
      proxies = registerProxies(appConfig.routers, {});
    }
    app.use(proxies.routes(), proxies.allowedMethods());
  }

  app.use(KoaBody(UPLOAD_CONFIG));
  app.use(jsonHelper);
  app.use(httpHelper);

  // global plugins
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
          app.use(plugin_middleware(projectDir, pluginConfig, projectConfig));
        }
      }
      if (!handleRender && typeof plugin.render === 'function') {
        app.use(staticHandler(pluginConfig));
        handleRender = plugin.render(projectDir, pluginConfig);
        renderConfig = pluginConfig;
        app.use(function(ctx, next) {
          ctx.render = handleRender;
          return next();
        });
      }
    }
  }

  // normal routers
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
