const Router = require('koa-router');
const Compose = require('koa-compose');
const c2k = require('koa2-connect');
const proxy = require('http-proxy-middleware');
const log = require('fancy-log');
const ratelimit = require('./modules/ratelimit');
const { FailResponse, Controller, Middleware } = require('./models');

const tgtURL = (url, config = {}) => {
  const tgtBase = (process.env.REUS_PROJECT_ENV && process.env.REUS_PROJECT_ENV !== 'dev') ?
    config.cdnUrl : config.baseUrl;
  return (`${tgtBase || ''}${url.replace(/\\/gmi, '/').replace(/^\/pages/, '')}`).replace(/\\/gmi, '/');
};

const registerMiddleware = (middleware) => {
  const temp = new middleware();
  if (temp instanceof Middleware) {
    return (ctx, next) => {
      const instance = new middleware(ctx, next);
      return instance.index();
    };
  }
  throw 'unknown middleware constructor';
};

const registerController = (controller) => {
  const temp = new controller();
  if (temp instanceof Controller) {
    return (ctx) => {
      const instance = new controller(ctx);
      return instance.index();
    };
  }
  throw 'unknown controller constructor';
};

const registerRoutes = (routes = [], routeConfig = {}) => {
  const router = new Router();

  const getRateLimitConfig = ({
    table_name = 'gt-rtlmt',
    type = 'memory',
    db = null,
    max = 12,
    duration = 60,
    validate,
    errmsg = '请求过于频繁，请稍后再试'
  }) => ({
    type,
    tableName: table_name,
    dbConn: db,
    max,
    duration,
    errorMessage: () =>  new FailResponse(-1, errmsg),
    id: validate || function(ctx){ return ctx.ip; },
  });

  const iterator = (parent, route) => {
    const routepath = `${parent}${route.path}`;
    for (const child of route.children || []) {
      iterator(routepath, child);
    }

    const middlewares = (Array.isArray(route.middlewares) ? route.middlewares : []).map(registerMiddleware);
    if (route.speed_limit) {
      middlewares.push(ratelimit(getRateLimitConfig({
        type: route.speed_limit.type,
        db: route.speed_limit.db,
        table_name: route.speed_limit.table_name,
        max: route.speed_limit.max,
        duration: route.speed_limit.duration,
        errmsg: route.speed_limit.errmsg,
        validate: route.speed_limit.validate,
      })));
    }
    let pathRewrite = undefined;
    if (!route.method && !route.view) {
      throw 'please specify the method of route you set';
    }
    if (route.redirect) {
      pathRewrite = {};
      const originPath = `^${tgtURL(routepath, routeConfig)}`;
      const targetPath = route.redirect;
      pathRewrite[originPath] = targetPath;
      router[route.method](tgtURL(routepath, routeConfig), Compose(middlewares), c2k(proxy({
        target: route.target,
        changeOrigin: false,
        pathRewrite,
        timeout: 60000,
        proxyTimeout: 60000,
        secure: false,
        logLevel: 'warn',
        onError: function (err, req, res) {
          res.writeHead(502, {
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify(new FailResponse(-1, 'service not available')));
        }
      })));
    } else if (route.controller) {
      const action = registerController(route.controller);
      router[route.method](
        tgtURL(routepath, routeConfig),
        Compose(middlewares),
        action
      );
    } else if (route.view) {
      let payload = { title: route.title || 'reus.title' };
      if (typeof route.preload === 'function') {
        payload = Object.assign(payload, route.preload());
      } else if (typeof route.preload === 'object') {
        payload = Object.assign(payload, route.preload);
      }

      router.get(tgtURL(routepath, routeConfig), Compose(middlewares), function(ctx) {
        if (typeof ctx.render === 'function') {
          return ctx.render(ctx, route.view, payload);
        }
        log.error(`Route -> ${tgtURL(routepath, routeConfig)}: render function not exists`);
        ctx.body = `Route -> ${tgtURL(routepath, routeConfig)}: render function not exists`;
        ctx.status = 404;
      });
    }
  };

  routes.forEach((route) => {
    iterator('', route);
  });

  return router;
};

module.exports = {
  registerMiddleware,
  registerController,
  registerRoutes,
};
