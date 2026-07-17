import assert from 'node:assert/strict';
import test from 'node:test';

import { startAppFixture } from './helpers/fixture.js';

test('JSON request bodies keep the existing parsed object behavior', async (t) => {
  const fixture = await startAppFixture(t);
  const response = await fetch(`${fixture.baseUrl}/echo`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ amount: 12, name: 'baseline' }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    body: { amount: 12, name: 'baseline' },
  });
});
