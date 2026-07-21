import type { Context } from 'koa';

export default class Controller {
  ctx: Context;
  /**
   * @constructor Controller
   * @description If you want to override it, please call super(ctx) first.
   * @param {Koa.Context} ctx koa.context
   */
  constructor(ctx: Context) {
    this.ctx = ctx;
  }

  async index() {
    const { ctx } = this;
    ctx.body = 'hello';
    ctx.status = 200;
  }
}
