import assert from 'node:assert/strict';
import test from 'node:test';

import { startAppFixture } from './helpers/fixture.js';

async function getSwaggerHtml(fixture) {
  const response = await fetch(`${fixture.baseUrl}/swagger/index.html`);
  assert.equal(response.status, 200);
  return response.text();
}

test('explicit Swagger URL keeps priority over YAML', async (t) => {
  const fixture = await startAppFixture(t, {
    env: {
      FIXTURE_SWAGGER_URL: '/remote-openapi.json',
      FIXTURE_SWAGGER_YAML: 'swagger.yml',
    },
    files: {
      'swagger.yml': 'openapi: 3.0.0\ninfo:\n  title: YAML should not win\n  version: "1"\n',
    },
  });

  const html = await getSwaggerHtml(fixture);

  assert.match(html, /remote-openapi\.json/);
  assert.doesNotMatch(html, /YAML should not win/);
});

test('Swagger YAML is loaded as spec when explicit options are absent', async (t) => {
  const fixture = await startAppFixture(t, {
    env: { FIXTURE_SWAGGER_YAML: 'swagger.yml' },
    files: {
      'swagger.yml': 'openapi: 3.0.0\ninfo:\n  title: YAML fixture API\n  version: "1"\n',
    },
  });

  const html = await getSwaggerHtml(fixture);

  assert.match(html, /YAML fixture API/);
});

test('invalid Swagger YAML is logged without blocking the service', async (t) => {
  const fixture = await startAppFixture(t, {
    env: { FIXTURE_SWAGGER_YAML: 'missing-swagger.yml' },
  });

  const response = await fetch(`${fixture.baseUrl}/known`);

  assert.equal(response.status, 200);
  assert.match(fixture.output().stderr, /missing-swagger\.yml|ENOENT/);
});
