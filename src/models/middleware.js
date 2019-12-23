class Middleware {
  /**
  * @constructor Middleware
  * @description If you want to override it, please call super(ctx, next) first.
  * @param {Object} ctx koa.context
  * @param {Promise} next koa.next
  * @param {Object} app koa.app
  */
  constructor(ctx, next, app) {
    this.ctx = ctx;
    this.next = next;
    this.app = app;
  }

  async index() {
    const { next } = this;
    return next();
  }
}

module.exports = Middleware;
