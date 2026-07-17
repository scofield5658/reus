import fs from 'node:fs';
import path from 'node:path';

import { Controller, Middleware } from 'reus.js';

class TraceMiddleware extends Middleware {
  async index() {
    this.ctx.set('x-middleware-before', 'true');
    await this.next();
    this.ctx.set('x-middleware-after', this.app ? 'true' : 'false');
  }
}

class KnownController extends Controller {
  async index() {
    this.ctx.json({ ok: true });
  }
}

class EchoController extends Controller {
  async index() {
    this.ctx.json({ body: this.ctx.request.body });
  }
}

class SharedController extends Controller {
  async index() {
    this.ctx.body = 'normal-route';
  }
}

const routers = [
  {
    path: '/known',
    method: 'get',
    controller: KnownController,
  },
  {
    path: '/echo',
    method: 'post',
    controller: EchoController,
  },
  {
    path: '/shared',
    method: 'post',
    proxyPattern: '/shared',
    target: 'http://127.0.0.1:1',
  },
  {
    path: '/shared',
    method: 'get',
    controller: SharedController,
  },
];

const config = {
  routers,
  middlewares: [TraceMiddleware],
  startups: [
    async () => {
      fs.appendFileSync(path.join(process.env.REUS_PROJECT_DIR, 'startup.log'), 'first\n');
    },
    async () => {
      fs.appendFileSync(path.join(process.env.REUS_PROJECT_DIR, 'startup.log'), 'second\n');
    },
  ],
};

if (process.env.FIXTURE_SWAGGER_URL) {
  config.swaggerOptions = { url: process.env.FIXTURE_SWAGGER_URL };
}
if (process.env.FIXTURE_SWAGGER_SPEC === 'true') {
  config.swaggerOptions = {
    ...config.swaggerOptions,
    spec: { openapi: '3.0.0', info: { title: 'Explicit fixture spec', version: '1' } },
  };
}
if (process.env.FIXTURE_SWAGGER_YAML) {
  config.swaggerYmlFile = process.env.FIXTURE_SWAGGER_YAML;
}

export default config;
