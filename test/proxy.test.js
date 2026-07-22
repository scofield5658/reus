import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';

import Koa from 'koa';

import { registerProxies } from '../dist/utils.js';

import { listen } from './helpers/server.js';

async function startProxy(t, route) {
  const app = new Koa();
  const router = registerProxies([route]);
  app.use(router.routes());
  app.use(router.allowedMethods());
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  });
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

test('proxy preserves headers and applies pathRewrite', async (t) => {
  let received;
  const upstream = await listen(t, (request, response) => {
    received = {
      url: request.url,
      header: request.headers['x-proxy-test'],
    };
    response.setHeader('content-type', 'application/json');
    response.end('{"proxied":true}');
  });
  const origin = await startProxy(t, {
    path: '/api/(.*)',
    method: 'get',
    proxyPattern: '/api',
    target: upstream.origin,
    pathRewrite: { '^/api': '/upstream' },
  });

  const response = await fetch(`${origin}/api/orders?id=1`, {
    headers: { 'x-proxy-test': 'preserved' },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { proxied: true });
  assert.deepEqual(received, {
    url: '/upstream/orders?id=1',
    header: 'preserved',
  });
});

test('proxy returns the existing 502 fallback when upstream is unavailable', async (t) => {
  const origin = await startProxy(t, {
    path: '/api',
    method: 'get',
    proxyPattern: '/api',
    target: 'http://127.0.0.1:1',
  });

  const response = await fetch(`${origin}/api`);

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    err_code: -1,
    err_desc: 'service not available',
  });
});

test('proxy timeout terminates a slow upstream request', async (t) => {
  const upstream = await listen(t, (_request, response) => {
    setTimeout(() => response.end('late'), 200);
  });
  const origin = await startProxy(t, {
    path: '/slow',
    method: 'get',
    proxyPattern: '/slow',
    target: upstream.origin,
    timeout: 30,
    proxyTimeout: 30,
  });

  const outcome = await fetch(`${origin}/slow`).then(
    (response) => response.status,
    () => 'rejected',
  );

  assert.ok(outcome === 502 || outcome === 'rejected');
});
