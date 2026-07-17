import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const noPack = args.includes('--no-pack');
const assertImmutable = args.includes('--assert-immutable');
const requestedTarball = valueAfter('--tarball');

async function sha256(filename) {
  return crypto.createHash('sha256')
    .update(await fs.readFile(filename))
    .digest('hex');
}

async function createPreflightTarball(tempRoot) {
  const packDir = path.join(tempRoot, 'pack');
  await fs.mkdir(packDir);
  const { stdout } = await execFileAsync(
    'npm',
    ['pack', '--json', '--pack-destination', packDir],
    { cwd: repositoryRoot, maxBuffer: 10 * 1024 * 1024 },
  );
  const [result] = JSON.parse(stdout);
  return {
    tarball: path.join(packDir, result.filename),
    files: result.files.map((file) => file.path).sort(),
  };
}

function validateFiles(files) {
  const required = [
    '.config/index.js',
    '.config/serve.js',
    '.gulpfiles/serve-utils.js',
    '.gulpfiles/serve.js',
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
    'command.js',
    'commands/create-core.js',
    'commands/process.js',
    'common.js',
    'gulpfile.js',
    'index.js',
    'package.json',
    'src/app.js',
    'types/index.d.ts',
  ];
  for (const filename of required) {
    assert.ok(files.includes(filename), `tarball is missing ${filename}`);
  }
  for (const filename of files) {
    assert.doesNotMatch(filename, /^(?:test|consumer-validation|artifacts)\//);
    assert.doesNotMatch(filename, /^docs\/features\//);
    assert.notEqual(filename, 'pnpm-lock.yaml');
  }
}

async function installAndSmoke(tempRoot, tarball) {
  const installDir = path.join(tempRoot, 'install');
  await fs.mkdir(installDir);
  await fs.writeFile(
    path.join(installDir, 'package.json'),
    '{"name":"reus-package-smoke","private":true,"type":"module"}\n',
  );
  await execFileAsync(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball],
    { cwd: installDir, maxBuffer: 20 * 1024 * 1024 },
  );
  await execFileAsync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      'const mod=await import(\'reus.js\'); if(typeof mod.Controller!==\'function\'||typeof mod.Middleware!==\'function\') process.exit(1)',
    ],
    { cwd: installDir },
  );
  const executable = process.platform === 'win32'
    ? path.join(installDir, 'node_modules', '.bin', 'reus.cmd')
    : path.join(installDir, 'node_modules', '.bin', 'reus');
  const version = await execFileAsync(executable, ['--version'], { cwd: installDir });
  assert.equal(version.stdout.trim(), '5.1.0');
  const help = await execFileAsync(executable, ['--help'], { cwd: installDir });
  assert.match(help.stdout, /Usage:/);
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'reus-pack-smoke-'));
try {
  let tarball;
  let files;
  if (noPack) {
    assert.ok(requestedTarball, '--tarball is required with --no-pack');
    tarball = path.resolve(requestedTarball);
    const { stdout } = await execFileAsync(
      'tar',
      ['-tzf', tarball],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    files = stdout.trim().split('\n')
      .map((filename) => filename.replace(/^package\//, ''))
      .filter(Boolean)
      .sort();
  } else {
    ({ tarball, files } = await createPreflightTarball(tempRoot));
  }

  const hashBefore = assertImmutable ? await sha256(tarball) : undefined;
  validateFiles(files);
  await installAndSmoke(tempRoot, tarball);
  const hashAfter = assertImmutable ? await sha256(tarball) : undefined;
  if (assertImmutable) {
    assert.equal(hashAfter, hashBefore, 'tarball changed during smoke validation');
  }
  console.log(JSON.stringify({
    tarball,
    files: files.length,
    sha256: hashAfter || await sha256(tarball),
  }));
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}
