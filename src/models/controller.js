class Controller {
  /**
  * @constructor Controller
  * @description If you want to override it, please call super(ctx) first.
  * @param {Object} ctx koa.context
  */
  constructor(ctx) {
    this.ctx = ctx;
  }

  async index() {
    const { ctx } = this;
    ctx.body = 'hello';
    ctx.status = 200;
  }
}

module.exports = Controller;
