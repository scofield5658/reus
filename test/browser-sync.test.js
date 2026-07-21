import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { getProjectConfig } from '../dist/src/common.js';
import {
  createBrowserSyncOptions,
  reloadBrowserSync,
} from '../dist/.gulpfiles/serve-utils.js';

import { createAppFixture, repositoryRoot } from './helpers/fixture.js';

async function withProjectConfig(t, config) {
  const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reus-config-'));
  await fs.writeFile(
    path.join(projectDir, 'project.config.json'),
    `${JSON.stringify(config)}\n`,
  );
  const previousProjectDir = process.env.REUS_PROJECT_DIR;
  process.env.REUS_PROJECT_DIR = projectDir;
  t.after(async () => {
    if (previousProjectDir === undefined) {
      delete process.env.REUS_PROJECT_DIR;
    } else {
      process.env.REUS_PROJECT_DIR = previousProjectDir;
    }
    await fs.rm(projectDir, { recursive: true, force: true });
  });
  return getProjectConfig();
}

test('BrowserSync is disabled by default', async (t) => {
  const config = await withProjectConfig(t, {});

  assert.equal(config.browserSync.enabled, false);
});

test('partial BrowserSync config keeps local defaults', async (t) => {
  const config = await withProjectConfig(t, {
    browserSync: { enabled: true },
  });

  assert.deepEqual(config.browserSync, {
    enabled: true,
    port: 3001,
    ui_port: 10000,
    reloadDelay: 300,
    notify: false,
    files: [],
    domain: '',
  });
});

test('enabled BrowserSync proxies the application port', () => {
  const options = createBrowserSyncOptions({
    app: { port: 8090 },
    browserSync: {
      enabled: true,
      port: 3001,
      ui_port: 10000,
      reloadDelay: 300,
      notify: false,
      files: [],
      domain: '',
    },
  }, (files) => files);

  assert.equal(options.proxy, 'http://localhost:8090');
  assert.equal(options.port, 3001);
  assert.equal(options.ui.port, 10000);
});

test('reload is guarded when BrowserSync is disabled or inactive', () => {
  let reloads = 0;
  const browserSync = {
    active: false,
    reload: () => { reloads += 1; },
  };

  assert.equal(reloadBrowserSync({ enabled: false }, browserSync), false);
  assert.equal(reloadBrowserSync({ enabled: true }, browserSync), false);
  browserSync.active = true;
  assert.equal(reloadBrowserSync({ enabled: true }, browserSync), true);
  assert.equal(reloads, 1);
});

async function waitForUrl(url, child, output) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      assert.fail(`dev process exited with ${child.exitCode}\n${output()}`);
    }
    try {
      return await fetch(url);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  assert.fail(`timed out waiting for ${url}\n${output()}`);
}

async function startDev(t, browserSync) {
  const fixture = await createAppFixture(t, { browserSync });
  const child = spawn(
    process.execPath,
    ['dist/src/cli/command.js', 'launch', fixture.projectDir, '--mode', 'dev'],
    {
      cwd: repositoryRoot,
      detached: true,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  t.after(async () => {
    if (child.exitCode === null) {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        child.kill('SIGTERM');
      }
      await Promise.race([
        once(child, 'exit'),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }
  });
  await waitForUrl(`http://127.0.0.1:${fixture.port}/known`, child, () => output);
  return { ...fixture, child, output: () => output };
}

test('dev mode does not start BrowserSync by default', async (t) => {
  const fixture = await startDev(t, { enabled: false });

  await assert.rejects(fetch(
    `http://127.0.0.1:${fixture.browserSyncPort}/known`,
    { signal: AbortSignal.timeout(300) },
  ));
});

test('enabled BrowserSync starts beside nodemon and proxies app.port', async (t) => {
  const fixture = await startDev(t, { enabled: true, reloadDelay: 0 });

  const response = await waitForUrl(
    `http://127.0.0.1:${fixture.browserSyncPort}/known`,
    fixture.child,
    fixture.output,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });

  await fs.appendFile(
    path.join(fixture.projectDir, 'src', 'app.config.js'),
    '\n',
  );
  const deadline = Date.now() + 8000;
  while (
    Date.now() < deadline
    && !/Reloading Browsers/.test(fixture.output())
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(
    fixture.output().match(/server started at:/g)?.length >= 2,
    fixture.output(),
  );
  assert.match(fixture.output(), /Reloading Browsers/);
});
