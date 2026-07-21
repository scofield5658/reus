import assert from 'node:assert/strict';
import test from 'node:test';

import httpHelper from '../dist/src/helpers/http.js';

import { listen } from './helpers/server.js';

async function getHttp() {
  const ctx = {};
  await httpHelper(ctx, async () => {});
  return ctx.http;
}

async function captureRequest(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return {
    method: request.method,
    url: request.url,
    headers: request.headers,
    body: Buffer.concat(chunks).toString(),
  };
}

test('uri takes precedence over url', async (t) => {
  const primary = await listen(t, (_request, response) => response.end('primary'));
  const fallback = await listen(t, (_request, response) => response.end('fallback'));
  const http = await getHttp();

  const result = await http({ uri: primary.origin, url: fallback.origin });

  assert.equal(result.data, 'primary');
});

test('url is accepted when uri is absent', async (t) => {
  const upstream = await listen(t, (_request, response) => response.end('url-only'));
  const http = await getHttp();

  const result = await http({ url: upstream.origin });

  assert.equal(result.data, 'url-only');
});

test('qs merges with existing query parameters', async (t) => {
  let captured;
  const upstream = await listen(t, async (request, response) => {
    captured = await captureRequest(request);
    response.end('{}');
  });
  const http = await getHttp();

  await http({
    uri: `${upstream.origin}/items?existing=yes`,
    qs: { added: 'two words' },
  });

  assert.equal(captured.url, '/items?existing=yes&added=two%20words');
});

test('qs preserves request-style null, undefined and array encoding', async (t) => {
  let captured;
  const upstream = await listen(t, async (request, response) => {
    captured = await captureRequest(request);
    response.end('{}');
  });
  const http = await getHttp();

  await http({
    uri: `${upstream.origin}/items`,
    qs: {
      empty: null,
      omitted: undefined,
      items: ['one', 'two'],
    },
  });

  assert.equal(
    captured.url,
    '/items?empty=&items%5B0%5D=one&items%5B1%5D=two',
  );
});

test('method, headers and JSON object body are mapped', async (t) => {
  let captured;
  const upstream = await listen(t, async (request, response) => {
    captured = await captureRequest(request);
    response.end('{}');
  });
  const http = await getHttp();

  await http({
    uri: upstream.origin,
    method: 'POST',
    headers: { 'x-custom': 'kept' },
    body: { ok: true },
  });

  assert.equal(captured.method, 'POST');
  assert.equal(captured.headers['x-custom'], 'kept');
  assert.equal(captured.headers['content-type'], 'application/json');
  assert.equal(captured.body, '{"ok":true}');
});

for (const method of ['GET', 'HEAD']) {
  test(`${method} does not send a request body`, async (t) => {
    let captured;
    const upstream = await listen(t, async (request, response) => {
      captured = await captureRequest(request);
      response.end('{}');
    });
    const http = await getHttp();

    await http({
      uri: upstream.origin,
      method,
      body: { ignored: true },
    });

    assert.equal(captured.body, '');
  });
}

test('json false preserves a raw text body', async (t) => {
  let captured;
  const upstream = await listen(t, async (request, response) => {
    captured = await captureRequest(request);
    response.end('{}');
  });
  const http = await getHttp();

  await http({
    uri: upstream.origin,
    method: 'POST',
    json: false,
    body: 'raw-body',
  });

  assert.equal(captured.body, 'raw-body');
});

test('default JSON mode serializes scalar request bodies', async (t) => {
  let captured;
  const upstream = await listen(t, async (request, response) => {
    captured = await captureRequest(request);
    response.end('{}');
  });
  const http = await getHttp();

  await http({
    uri: upstream.origin,
    method: 'POST',
    body: 'scalar',
  });

  assert.equal(captured.body, '"scalar"');
});

test('json false preserves JSON-looking responses as text', async (t) => {
  const upstream = await listen(t, (_request, response) => {
    response.setHeader('content-type', 'application/json');
    response.end('{"ok":true}');
  });
  const http = await getHttp();

  const result = await http({ uri: upstream.origin, json: false });

  assert.equal(result.data, '{"ok":true}');
});

test('caller Content-Type is preserved in JSON mode', async (t) => {
  let captured;
  const upstream = await listen(t, async (request, response) => {
    captured = await captureRequest(request);
    response.end('{}');
  });
  const http = await getHttp();

  await http({
    uri: upstream.origin,
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.reus+json' },
    body: { ok: true },
  });

  assert.equal(captured.headers['content-type'], 'application/vnd.reus+json');
});

test('no timeout is added unless explicitly configured', async (t) => {
  const upstream = await listen(t, (_request, response) => {
    setTimeout(() => response.end('eventual'), 80);
  });
  const http = await getHttp();

  const result = await http({ uri: upstream.origin });

  assert.equal(result.data, 'eventual');
});

test('valid JSON, text and invalid JSON preserve response semantics', async (t) => {
  const upstream = await listen(t, (request, response) => {
    if (request.url === '/json') {
      response.setHeader('content-type', 'application/json');
      response.end('{"ok":true}');
      return;
    }
    if (request.url === '/invalid') {
      response.setHeader('content-type', 'application/json');
      response.end('{broken');
      return;
    }
    response.end('plain');
  });
  const http = await getHttp();

  const json = await http({ uri: `${upstream.origin}/json` });
  const invalid = await http({ uri: `${upstream.origin}/invalid` });
  const text = await http({ uri: `${upstream.origin}/text` });

  assert.deepEqual(json.data, { ok: true });
  assert.equal(invalid.data, '{broken');
  assert.equal(text.data, 'plain');
  assert.equal(json.status_code, 200);
  assert.match(json.headers['content-type'], /application\/json/);
});

test('204 responses return undefined data', async (t) => {
  const upstream = await listen(t, (_request, response) => {
    response.writeHead(204);
    response.end();
  });
  const http = await getHttp();

  const result = await http({ uri: upstream.origin });

  assert.equal(result.status_code, 204);
  assert.equal(result.data, undefined);
});

test('encoding null returns a Buffer', async (t) => {
  const upstream = await listen(t, (_request, response) => {
    response.end(Buffer.from([0, 1, 2, 255]));
  });
  const http = await getHttp();

  const result = await http({ uri: upstream.origin, encoding: null });

  assert.ok(Buffer.isBuffer(result.data));
  assert.deepEqual([...result.data], [0, 1, 2, 255]);
});

test('HTTP error statuses resolve with status_code and body', async (t) => {
  const upstream = await listen(t, (_request, response) => {
    response.writeHead(503, { 'content-type': 'application/json' });
    response.end('{"retry":true}');
  });
  const http = await getHttp();

  const result = await http({ uri: upstream.origin });

  assert.equal(result.status_code, 503);
  assert.deepEqual(result.data, { retry: true });
});

test('duplicate Set-Cookie response headers are preserved as an array', async (t) => {
  const upstream = await listen(t, (_request, response) => {
    response.setHeader('set-cookie', [
      'session=one; Path=/',
      'refresh=two; Path=/',
    ]);
    response.end('{}');
  });
  const http = await getHttp();

  const result = await http({ uri: upstream.origin });

  assert.deepEqual(result.headers['set-cookie'], [
    'session=one; Path=/',
    'refresh=two; Path=/',
  ]);
});

test('explicit timeout rejects', async (t) => {
  const upstream = await listen(t, (_request, response) => {
    setTimeout(() => response.end('late'), 100);
  });
  const http = await getHttp();

  await assert.rejects(http({ uri: upstream.origin, timeout: 20 }));
});

test('network failures reject', async () => {
  const http = await getHttp();

  await assert.rejects(http({ uri: 'http://127.0.0.1:1' }));
});
