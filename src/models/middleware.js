class Middleware {
  /**
  * @constructor Middleware
  * @description If you want to override it, please call super(ctx, next) first.
  * @param {Object} ctx koa.context
  * @param {Promise} next koa.next
  */
  constructor(ctx, next) {
    this.ctx = ctx;
    this.next = next;
  }

  async index() {
    const { next } = this;
    return next();
  }
}

module.exports = Middleware;
