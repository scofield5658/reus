import type Application from 'koa';
import type { Context, Next } from 'koa';

export interface JsonResponse {
  [key: string]: unknown;
}

export interface HttpOptions {
  uri?: string;
  url?: string;
  qs?: Record<string, unknown>;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  json?: boolean;
  timeout?: number;
  encoding?: string | null;
}

export interface HttpResponse<T = unknown> {
  headers: Record<string, string | string[]>;
  data: T | undefined;
  status_code: number;
}

export interface BrowserSyncConfig {
  enabled?: boolean;
  port?: number;
  ui_port?: number;
  reloadDelay?: number;
  notify?: boolean;
  files?: string[];
  domain?: string;
}

export interface UploadConfig {
  json_limit?: string;
  form_limit?: string;
  max_field_size?: number;
  max_file_size?: number;
  err_msg?: string;
}

export interface ProjectConfig {
  app?: {
    port?: number;
  };
  browserSync?: BrowserSyncConfig;
  upload?: UploadConfig;
  koaConfig?: Record<string, unknown>;
  plugins?: Array<{
    name: string;
    params?: string;
  }>;
}

export type ControllerConstructor = new (ctx: Context) => Controller;
export type MiddlewareConstructor = new (
  ctx: Context,
  next: Next,
  app: Application,
) => Middleware;

export interface Route {
  path: string;
  method?: string;
  controller?: ControllerConstructor;
  middlewares?: MiddlewareConstructor[];
  children?: Route[];
  view?: string;
  title?: string;
  preload?: Record<string, unknown> | (() => Record<string, unknown>);
  proxyPattern?: string | string[];
  target?: string;
  pathRewrite?: Record<string, string> | ((path: string) => string);
  timeout?: number;
  proxyTimeout?: number;
  loglevel?: string;
  speed_limit?: Record<string, unknown>;
}

export interface SwaggerOptions {
  url?: string;
  spec?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AppConfig {
  routers?: Route[] | (() => Route[] | Promise<Route[]>);
  middlewares?: MiddlewareConstructor[];
  startups?: Array<() => unknown | Promise<unknown>>;
  swaggerSwitch?: boolean;
  swaggerRoutePrefix?: string;
  swaggerCdnUrl?: string;
  swaggerYmlFile?: string;
  swaggerOptions?: SwaggerOptions;
}

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

declare module 'koa' {
  interface DefaultContext {
    json(data: unknown): void;
    http<T = unknown>(options: HttpOptions): Promise<HttpResponse<T>>;
  }
}
