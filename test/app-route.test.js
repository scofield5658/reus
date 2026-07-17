import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { startAppFixture } from './helpers/fixture.js';

test('correct route and middleware behavior match the 5.0.9 baseline', async (t) => {
  const fixture = await startAppFixture(t);
  const response = await fetch(`${fixture.baseUrl}/known`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-middleware-before'), 'true');
  assert.equal(response.headers.get('x-middleware-after'), 'true');
  assert.deepEqual(await response.json(), { ok: true });
});

test('startup hooks run in declaration order before the server is usable', async (t) => {
  const fixture = await startAppFixture(t);
  const startupLog = await fs.readFile(path.join(fixture.projectDir, 'startup.log'), 'utf8');

  assert.equal(startupLog, 'first\nsecond\n');
});

test('proxy routes do not preempt a normal route with the same path', async (t) => {
  const fixture = await startAppFixture(t);
  const response = await fetch(`${fixture.baseUrl}/shared`);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'normal-route');
});
