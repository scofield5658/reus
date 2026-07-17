import assert from 'node:assert/strict';
import test from 'node:test';

import { startAppFixture } from './helpers/fixture.js';

test('method mismatch returns 405 and Allow', async (t) => {
  const fixture = await startAppFixture(t);
  const response = await fetch(`${fixture.baseUrl}/known`, { method: 'POST' });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'HEAD, GET');
});

test('OPTIONS is answered automatically', async (t) => {
  const fixture = await startAppFixture(t);
  const response = await fetch(`${fixture.baseUrl}/known`, { method: 'OPTIONS' });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('allow'), 'HEAD, GET');
});

test('unsupported method returns 501', async (t) => {
  const fixture = await startAppFixture(t);
  const response = await fetch(`${fixture.baseUrl}/known`, { method: 'PROPFIND' });

  assert.equal(response.status, 501);
  assert.equal(response.headers.get('allow'), 'HEAD, GET');
});

test('unknown paths remain 404', async (t) => {
  const fixture = await startAppFixture(t);
  const response = await fetch(`${fixture.baseUrl}/missing`);

  assert.equal(response.status, 404);
});
