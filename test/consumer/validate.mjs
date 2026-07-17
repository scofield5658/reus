import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repositoryRoot = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const consumer = valueAfter('--consumer');
const requestedTarball = valueAfter('--tarball');
const goatsRoot = process.env.GOATS_ROOT;
assert.ok(goatsRoot, 'GOATS_ROOT is required');

const consumers = {
  manager: {
    directory: 'uniweb-manager',
    revision: 'f06236e2372e5f14c8032fe9bb2667d3b57f4dfc',
    hasTests: true,
  },
  admin: {
    directory: 'uniweb-admin',
    revision: '3d7f411a94dffc6a8b95770d79b7fff5fe9a010f',
    hasTests: false,
  },
};
const config = consumers[consumer];
assert.ok(config, '--consumer must be manager or admin');

const sourceDir = path.join(goatsRoot, config.directory);
const evidenceDir = path.join(repositoryRoot, 'consumer-validation', consumer);
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), `reus-${consumer}-`));
const isolatedDir = path.join(tempRoot, config.directory);
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

async function git(...commandArgs) {
  return execFileAsync('git', commandArgs, { maxBuffer: 20 * 1024 * 1024 });
}

async function runLogged(filename, command, commandArgs, options = {}) {
  try {
    const result = await execFileAsync(command, commandArgs, {
      cwd: isolatedDir,
      maxBuffer: 100 * 1024 * 1024,
      ...options,
    });
    await fs.writeFile(
      path.join(evidenceDir, filename),
      `${result.stdout}${result.stderr}`,
    );
    return result;
  } catch (error) {
    await fs.writeFile(
      path.join(evidenceDir, filename),
      `${error.stdout || ''}${error.stderr || ''}${error.stack || error}\n`,
    );
    throw error;
  }
}

async function pack() {
  const packDir = path.join(tempRoot, 'pack');
  await fs.mkdir(packDir);
  const { stdout } = await execFileAsync(
    'npm',
    ['pack', '--json', '--pack-destination', packDir],
    { cwd: repositoryRoot, maxBuffer: 20 * 1024 * 1024 },
  );
  const [result] = JSON.parse(stdout);
  return path.join(packDir, result.filename);
}

async function sourceState() {
  const head = (await git('-C', sourceDir, 'rev-parse', 'HEAD')).stdout.trim();
  const status = (await git('-C', sourceDir, 'status', '--short')).stdout;
  return { head, status };
}

await fs.rm(evidenceDir, { recursive: true, force: true });
await fs.mkdir(evidenceDir, { recursive: true });
const before = await sourceState();
assert.equal(before.head, config.revision, `${consumer} source revision changed`);
assert.equal(before.status, '', `${consumer} source worktree is not clean`);
await fs.writeFile(path.join(evidenceDir, 'source-clean-before.txt'), '(clean)\n');
await fs.writeFile(path.join(evidenceDir, 'revision.txt'), `${before.head}\n`);

try {
  await git('clone', '--no-hardlinks', sourceDir, isolatedDir);
  await git('-C', isolatedDir, 'checkout', '--detach', config.revision);
  const sourceLockfile = path.join(sourceDir, 'pnpm-lock.yaml');
  const isolatedLockfile = path.join(isolatedDir, 'pnpm-lock.yaml');
  await fs.copyFile(sourceLockfile, isolatedLockfile);
  const lockfileHash = crypto.createHash('sha256')
    .update(await fs.readFile(sourceLockfile))
    .digest('hex');
  await fs.writeFile(
    path.join(evidenceDir, 'lockfile-sha256.txt'),
    `${lockfileHash}\n`,
  );
  const tarball = requestedTarball
    ? path.resolve(requestedTarball)
    : await pack();
  await fs.access(tarball);
  await runLogged('install-baseline.log', pnpm, ['install', '--frozen-lockfile']);
  await runLogged('install.log', pnpm, ['add', '--save-exact', tarball]);
  await runLogged('lint.log', pnpm, ['exec', 'eslint', '--ext', '.js', 'src/']);

  if (config.hasTests) {
    await runLogged('test.log', pnpm, ['test', '--runInBand']);
  } else {
    const packageInfo = JSON.parse(await fs.readFile(path.join(isolatedDir, 'package.json'), 'utf8'));
    assert.equal(packageInfo.scripts?.test, undefined);
    await fs.writeFile(path.join(evidenceDir, 'scripts.json'), '{"test":"absent"}\n');
  }

  await runLogged('build.log', pnpm, ['build']);
  const projectConfig = JSON.parse(
    await fs.readFile(path.join(isolatedDir, 'project.config.json'), 'utf8'),
  );
  const startup = await runLogged(
    'startup-runner.log',
    process.execPath,
    [
      path.join(repositoryRoot, 'test', 'consumer', 'startup-smoke.mjs'),
      '--cwd',
      isolatedDir,
      '--port',
      String(projectConfig.app.port),
    ],
  );
  const startupResult = JSON.parse(startup.stdout.trim().split('\n').at(-1));
  await fs.writeFile(
    path.join(evidenceDir, 'startup.log'),
    startupResult.output || '',
  );
  await fs.writeFile(
    path.join(evidenceDir, 'startup-status.yaml'),
    `status: ${startupResult.status}\nreason: ${JSON.stringify(startupResult.reason)}\n`,
  );
} finally {
  const after = await sourceState();
  await fs.writeFile(
    path.join(evidenceDir, 'source-clean-after.txt'),
    after.status || '(clean)\n',
  );
  assert.deepEqual(after, before, `${consumer} source repository changed`);
  await fs.rm(tempRoot, { recursive: true, force: true });
}

console.log(JSON.stringify({ consumer, status: 'passed', evidenceDir }));
