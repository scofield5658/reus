const Router = require('koa-router');
const c2k = require('koa2-connect');
const proxy = require('http-proxy-middleware');
const { FailResponse } = require('../models');

const registerController = () => {

};

const registerMiddleware = () => {

};

const registerRoutes = (routes = []) => {
  const router = new Router();

  const getRateLimitConfig = ({
    table_name = 'gt-rtlmt',
    type = 'memory',
    db = null,
    max = 12,
    duration = 60,
    validate = (ctx) => ctx.ip,
    errmsg = '请求过于频繁，请稍后再试'
  }) => ({
    type,
    tableName: table_name,
    dbConn: db,
    max,
    duration,
    errorMessage: () =>  new FailResponse(-1, errmsg),
    id: validate,
  });

  const iterator = (parent, route) => {
    const path = `${parent}${route.path}`;
    for (const child of route.children || []) {
      iterator(path, child);
    }

    const middlewares = (Array.isArray(route.middlewares) ? route.middlewares : []).filter(Boolean);

    let pathRewrite = undefined;
    if (!route.method) {
      throw 'please specify the method of route you set';
    }
    if (route.redirect) {
      pathRewrite = {};
      const originPath = `^${path}`;
      const targetPath = route.redirect;
      pathRewrite[originPath] = targetPath;

      router[route.method].apply(router, [path, ...middlewares, c2k(proxy({
        target: config.serverUrl,
        changeOrigin: false,
        pathRewrite,
        timeout: 30000,
        proxyTimeout: 30000,
        secure: false,
        logLevel: 'warn',
        onError: function (err, req, res) {
          res.writeHead(500, {
            'Content-Type': 'application/json'
          });
          res.end(JSON.stringify(new FailResponse(-1, 'service not available')));
        }
      }))]);
    } else if (route.action) {
      if (route.speed_limit) {
        router[route.method].apply(router, [
          path,
          ...middlewares,
          ratelimit(getRateLimitConfig({
            type: route.speed_limit.type,
            db: route.speed_limit.db,
            table_name: route.speed_limit.table_name,
            max: route.speed_limit.max,
            duration: route.speed_limit.duration,
            errmsg: route.speed_limit.errmsg,
            validate: route.speed_limit.validate,
          })),
          route.action
        ]);
      } else {
        router[route.method].apply(router, [path, ...middlewares, route.action]);
      }
    }
  };

  routes.forEach((route) => {
    iterator('', route);
  });

  return router;
};

module.exports = {
  registerController,
  registerMiddleware,
  registerRoutes,
};
