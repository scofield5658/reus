import assert from 'node:assert/strict';
import test from 'node:test';

import { parseNpmPackResult } from '../scripts/npm-pack-result.mjs';

test('parses npm pack JSON after lifecycle output', () => {
  const [result] = parseNpmPackResult('\n> reus.js@6.0.0 prepack\n> pnpm build:framework\n\n[{"filename":"reus.js-6.0.0.tgz"}]\n');

  assert.equal(result.filename, 'reus.js-6.0.0.tgz');
});
