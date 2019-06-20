const Router = require('koa-router');
const Compose = require('koa-compose');
const c2k = require('koa2-connect');
const proxy = require('http-proxy-middleware');
const ratelimit = require('./modules/ratelimit');
const { FailResponse, Controller, Middleware } = require('./models');

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

const registerRoutes = (routes = []) => {
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
    const path = `${parent}${route.path}`;
    for (const child of route.children || []) {
      iterator(path, child);
    }

    const middlewares = (Array.isArray(route.middlewares) ? route.middlewares : []).map(registerMiddleware);
    let routeMiddlewares = middlewares || [];
    if (route.speed_limit) {
      routeMiddlewares = middlewares.concat(ratelimit(getRateLimitConfig({
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
    if (!route.method) {
      throw 'please specify the method of route you set';
    }
    if (route.redirect) {
      pathRewrite = {};
      const originPath = `^${path}`;
      const targetPath = route.redirect;
      pathRewrite[originPath] = targetPath;
      if (routeMiddlewares.length) {
        router[route.method](path, Compose(routeMiddlewares), c2k(proxy({
          target: route.target,
          changeOrigin: false,
          pathRewrite,
          timeout: 30000,
          proxyTimeout: 30000,
          secure: false,
          logLevel: 'warn',
          onError: function (err, req, res) {
            res.writeHead(502, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify(new FailResponse(-1, 'service not available')));
          }
        })));
      } else {
        router[route.method](path, c2k(proxy({
          target: route.target,
          changeOrigin: false,
          pathRewrite,
          timeout: 30000,
          proxyTimeout: 30000,
          secure: false,
          logLevel: 'warn',
          onError: function (err, req, res) {
            res.writeHead(502, {
              'Content-Type': 'application/json'
            });
            res.end(JSON.stringify(new FailResponse(-1, 'service not available')));
          }
        })));
      }
    } else if (route.controller) {
      const action = registerController(route.controller);
      if (routeMiddlewares.length) {
        router[route.method](
          path,
          Compose(routeMiddlewares),
          action,
        );
      } else {
        router[route.method](path, action);
      }
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
