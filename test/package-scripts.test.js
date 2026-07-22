import assert from 'node:assert/strict';
import test from 'node:test';

import packageInfo from '../package.json' with { type: 'json' };

test('check excludes the independent security audit', () => {
  assert.doesNotMatch(packageInfo.scripts.check, /\baudit\b/);
  assert.match(packageInfo.scripts.audit, /pnpm audit --prod --audit-level=high/);
});
