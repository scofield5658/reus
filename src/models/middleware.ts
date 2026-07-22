import type Koa from 'koa';
import type { Context, Next } from 'koa';

export default class Middleware {
  ctx: Context;
  next: Next;
  app: Koa;
  /**
   * @constructor Middleware
   * @description If you want to override it, please call super(ctx, next) first.
   * @param {Koa.Context} ctx koa.context
   * @param {Koa.Next} next koa.next
   * @param {Koa<Koa.DefaultState, Koa.DefaultContext>} app koa.app
   */
  constructor(ctx: Context, next: Next, app: Koa) {
    this.ctx = ctx;
    this.next = next;
    this.app = app;
  }

  async index() {
    const { next } = this;
    return next();
  }
}
