import assert from 'node:assert/strict';
import test from 'node:test';

import jsonHelper from '../dist/helpers/json.js';

test('ctx.json keeps status, content type and serialized body behavior', async () => {
  const ctx = {};
  let nextCalled = false;
  await jsonHelper(ctx, async () => { nextCalled = true; });

  ctx.json({ ok: true });

  assert.equal(nextCalled, true);
  assert.equal(ctx.type, 'application/json;charset=utf-8');
  assert.equal(ctx.body, '{"ok":true}');
});
