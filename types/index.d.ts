import type Koa from 'koa';
import type { Context, Next } from 'koa';

import type Controller from '../src/models/controller.js';
import type Middleware from '../src/models/middleware.js';

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
  app?: { port?: number };
  browserSync?: BrowserSyncConfig;
  upload?: UploadConfig;
  koaConfig?: Record<string, unknown>;
  plugins?: Array<{ name: string; params?: string }>;
}

export type ControllerConstructor = new (ctx: Context) => Controller;
export type MiddlewareConstructor = new (ctx: Context, next: Next, app: Koa) => Middleware;

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

declare module 'koa' {
  interface DefaultContext {
    json(data: unknown): void;
    http<T = unknown>(options: HttpOptions): Promise<HttpResponse<T>>;
  }
}
