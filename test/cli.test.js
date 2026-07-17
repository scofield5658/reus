import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { createFromTemplate } from '../commands/create-core.js';
import { spawnAndWait } from '../commands/process.js';

import { createAppFixture, repositoryRoot } from './helpers/fixture.js';
import { listen } from './helpers/server.js';

const execFileAsync = promisify(execFile);

test('spawn errors reject the parent operation', async () => {
  await assert.rejects(
    spawnAndWait('reus-command-that-does-not-exist', []),
    (error) => error.code === 'ENOENT',
  );
});

test('non-zero child exits are propagated', async () => {
  await assert.rejects(
    spawnAndWait(process.execPath, ['-e', 'process.exit(7)']),
    (error) => error.exitCode === 7,
  );
});

test('launch help documents prod as the default mode', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    ['command.js', 'launch', '--help'],
    { cwd: repositoryRoot },
  );

  assert.match(stdout, /use prod by default/);
});

async function createDestination(t) {
  const destination = await fs.mkdtemp(path.join(os.tmpdir(), 'reus-create-'));
  t.after(() => fs.rm(destination, { recursive: true, force: true }));
  return destination;
}

test('create rejects non-2xx downloads without leaving a temporary file', async (t) => {
  const destination = await createDestination(t);
  const upstream = await listen(t, (_request, response) => {
    response.writeHead(404);
    response.end('not found');
  });

  await assert.rejects(createFromTemplate(upstream.origin, destination), /404/);
  await assert.rejects(fs.access(path.join(destination, 'tmp.zip')));
});

test('create waits for extraction and cleans temporary files on failure', async (t) => {
  const destination = await createDestination(t);
  const upstream = await listen(t, (_request, response) => response.end('not a zip'));

  await assert.rejects(createFromTemplate(upstream.origin, destination));
  await assert.rejects(fs.access(path.join(destination, 'tmp.zip')));
});

test('create resolves only after the downloaded archive is extracted', async (t) => {
  const destination = await createDestination(t);
  const archive = Buffer.from(
    'UEsDBBQAAAAIAJOS8VysLGB1CgAAAAgAAAAYAAAAc3RhcnRlci1tYXN0ZXIvUkVBRE1FLm1kS8usKCktSuUCAFBLAQIUAxQAAAAIAJOS8VysLGB1CgAAAAgAAAAYAAAAAAAAAAAAAACAAQAAAABzdGFydGVyLW1hc3Rlci9SRUFETUUubWRQSwUGAAAAAAEAAQBGAAAAQAAAAAAA',
    'base64',
  );
  const upstream = await listen(t, (_request, response) => response.end(archive));

  await createFromTemplate(upstream.origin, destination);

  assert.equal(
    await fs.readFile(path.join(destination, 'starter-master', 'README.md'), 'utf8'),
    'fixture\n',
  );
  await assert.rejects(fs.access(path.join(destination, 'tmp.zip')));
});

test('build produces dist and exits successfully', async (t) => {
  const fixture = await createAppFixture(t);

  await execFileAsync(
    process.execPath,
    ['command.js', 'build', fixture.projectDir],
    { cwd: repositoryRoot },
  );

  const builtConfig = await fs.readFile(
    path.join(fixture.projectDir, 'dist', 'app.config.js'),
    'utf8',
  );
  assert.match(builtConfig, /KnownController/);
});

test('build CLI exits non-zero when the Gulp child fails', async (t) => {
  const fixture = await createAppFixture(t);
  await fs.writeFile(
    path.join(fixture.projectDir, 'project.config.json'),
    '{invalid-json\n',
  );

  await assert.rejects(
    execFileAsync(
      process.execPath,
      ['command.js', 'build', fixture.projectDir],
      { cwd: repositoryRoot },
    ),
    (error) => error.code !== 0,
  );
});

test('dev launch CLI exits non-zero when the Gulp child fails', async (t) => {
  const fixture = await createAppFixture(t);
  await fs.writeFile(
    path.join(fixture.projectDir, 'project.config.json'),
    '{invalid-json\n',
  );

  await assert.rejects(
    execFileAsync(
      process.execPath,
      ['command.js', 'launch', fixture.projectDir, '--mode', 'dev'],
      { cwd: repositoryRoot, timeout: 10000 },
    ),
    (error) => error.code !== 0 && error.killed !== true,
  );
});

test('launch keeps prod as the effective default mode', async (t) => {
  const fixture = await createAppFixture(t);
  await execFileAsync(
    process.execPath,
    ['command.js', 'build', fixture.projectDir],
    { cwd: repositoryRoot },
  );
  const launched = spawn(
    process.execPath,
    ['command.js', 'launch', fixture.projectDir],
    {
      cwd: repositoryRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  launched.stdout.on('data', (chunk) => { output += chunk; });
  launched.stderr.on('data', (chunk) => { output += chunk; });
  t.after(async () => {
    if (launched.exitCode === null) {
      launched.kill('SIGTERM');
      await Promise.race([
        new Promise((resolve) => launched.once('exit', resolve)),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
  });

  const deadline = Date.now() + 10000;
  let response;
  while (Date.now() < deadline) {
    try {
      response = await fetch(`http://127.0.0.1:${fixture.port}/known`);
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  assert.ok(response, output);
  assert.equal(response.status, 200);
  assert.match(output, /Running Mode: prod/);
});
