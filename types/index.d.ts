/**
 * reus.js 类型声明
 * 对应导出：Controller, Middleware
 */

import type Application from 'koa';
import type { Context, Next } from 'koa';

/** Controller 基类 - 用于创建业务控制器 */
export class Controller {
  /** Koa 上下文 */
  ctx: Context;

  /**
   * @param ctx - Koa 的 context 对象
   */
  constructor(ctx: Context);

  /** 默认的 index 方法，子类可重写实现具体业务逻辑 */
  index(): Promise<void>;
}

/** Middleware 基类 - 用于创建中间件 */
export class Middleware {
  /** Koa 上下文 */
  ctx: Context;
  /** Koa 的 next 函数 */
  next: Next;
  /** Koa 应用实例 */
  app: Application;

  /**
   * @param ctx - Koa 的 context 对象
   * @param next - Koa 的 next 函数
   * @param app - Koa 应用实例
   */
  constructor(ctx: Context, next: Next, app: Application);

  /** 默认的 index 方法，子类可重写实现具体中间件逻辑 */
  index(): Promise<unknown>;
}
