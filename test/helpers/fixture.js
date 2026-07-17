import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const repositoryRoot = path.dirname(testDir);
const fixtureRoot = path.join(testDir, 'fixtures', 'app');

export async function reservePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

export async function createAppFixture(t, overrides = {}) {
  const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reus-app-'));
  await fs.cp(fixtureRoot, projectDir, { recursive: true });
  const port = overrides.port ?? await reservePort();
  const browserSyncPort = overrides.browserSyncPort ?? await reservePort();
  const projectConfig = {
    app: { port },
    browserSync: {
      enabled: false,
      port: browserSyncPort,
      ...overrides.browserSync,
    },
  };
  await fs.writeFile(
    path.join(projectDir, 'project.config.json'),
    `${JSON.stringify(projectConfig, null, 2)}\n`,
  );
  const nodeModulesDir = path.join(projectDir, 'node_modules');
  await fs.mkdir(nodeModulesDir, { recursive: true });
  await fs.symlink(repositoryRoot, path.join(nodeModulesDir, 'reus.js'), 'dir');

  t.after(async () => {
    await fs.rm(projectDir, { recursive: true, force: true });
  });

  return { projectDir, port, browserSyncPort };
}

export async function startAppFixture(t, overrides = {}) {
  const fixture = await createAppFixture(t, overrides);
  for (const [relativePath, contents] of Object.entries(overrides.files || {})) {
    const target = path.join(fixture.projectDir, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, contents);
  }
  const child = spawn(process.execPath, [path.join(repositoryRoot, 'bin', 'app.js')], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      REUS_PROJECT_DIR: fixture.projectDir,
      REUS_PROJECT_ENV: overrides.mode ?? 'dev',
      ...overrides.env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  t.after(async () => {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await Promise.race([
        once(child, 'exit'),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
  });

  const baseUrl = `http://127.0.0.1:${fixture.port}`;
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      assert.fail(`fixture exited with ${child.exitCode}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
    }
    try {
      await fetch(`${baseUrl}/__ready__`);
      return {
        ...fixture,
        baseUrl,
        child,
        output: () => ({ stdout, stderr }),
      };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  assert.fail(`fixture did not listen\nstdout:\n${stdout}\nstderr:\n${stderr}`);
}
