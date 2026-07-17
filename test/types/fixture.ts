import {
  Controller,
  Middleware,
  type AppConfig,
  type HttpOptions,
  type ProjectConfig,
  type Route,
} from 'reus.js';
import type { Context } from 'koa';

class ExampleController extends Controller {
  async index(): Promise<void> {
    this.ctx.json({ ok: true });
  }
}

class ExampleMiddleware extends Middleware {
  async index(): Promise<unknown> {
    return this.next();
  }
}

const route: Route = {
  path: '/known',
  method: 'get',
  controller: ExampleController,
  middlewares: [ExampleMiddleware],
};

const projectConfig: ProjectConfig = {
  app: { port: 8090 },
  browserSync: {
    enabled: false,
  },
};

const appConfig: AppConfig = {
  routers: [route],
  startups: [async () => {}],
  swaggerYmlFile: 'swagger.yml',
  swaggerOptions: { url: '/openapi.json' },
};

async function useContext(ctx: Context): Promise<void> {
  const options: HttpOptions = {
    uri: 'http://127.0.0.1',
    qs: { page: 1 },
    method: 'POST',
    headers: { 'x-test': 'true' },
    body: { ok: true },
    timeout: 1000,
  };
  const response = await ctx.http<{ ok: boolean }>(options);
  ctx.json({
    status: response.status_code,
    ok: response.data?.ok,
  });
}

void projectConfig;
void appConfig;
void useContext;
