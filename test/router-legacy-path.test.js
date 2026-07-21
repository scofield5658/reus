import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';

import Koa from 'koa';

import { Controller } from '../dist/src/models/index.js';
import { registerRoutes } from '../dist/src/utils.js';

class LegacyPathController extends Controller {
  async index() {
    this.ctx.body = 'legacy-path';
  }
}

test('legacy regular-expression route strings remain supported', async (t) => {
  const app = new Koa();
  const router = registerRoutes([
    {
      path: '/legacy/(.*)',
      method: 'get',
      controller: LegacyPathController,
    },
  ]);
  app.use(router.routes());
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  });

  const response = await fetch(`http://127.0.0.1:${server.address().port}/legacy/value`);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'legacy-path');
});
