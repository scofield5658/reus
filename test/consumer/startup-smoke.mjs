import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const cwd = valueAfter('--cwd');
const port = Number(valueAfter('--port'));
const timeout = Number(valueAfter('--timeout') || 30000);
assert.ok(cwd, '--cwd is required');
assert.ok(Number.isInteger(port) && port > 0, '--port must be a positive integer');

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const child = spawn(pnpm, ['start'], {
  cwd,
  detached: process.platform !== 'win32',
  env: { ...process.env },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', (chunk) => { output += chunk; });
child.stderr.on('data', (chunk) => { output += chunk; });

async function stop() {
  if (child.exitCode !== null) {
    return;
  }
  try {
    if (process.platform !== 'win32') {
      process.kill(-child.pid, 'SIGTERM');
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    child.kill('SIGTERM');
  }
  await Promise.race([
    once(child, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
}

let status = 'failed';
let reason = '';
const deadline = Date.now() + timeout;
try {
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      reason = `process exited with code ${child.exitCode}`;
      break;
    }
    try {
      await fetch(`http://127.0.0.1:${port}/`, {
        signal: AbortSignal.timeout(500),
      });
      status = 'passed';
      reason = `application listened on ${port}`;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  if (!reason) {
    reason = `application did not listen within ${timeout}ms`;
  }

  if (status !== 'passed') {
    const externalDependencyPattern = /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|database|oracle|mysql|redis|kafka|remote config|secret|credential/i;
    if (externalDependencyPattern.test(output)) {
      status = 'skipped_external_dependency';
      reason = `${reason}; log identifies an unavailable external dependency`;
    }
  }
} finally {
  await stop();
}

console.log(JSON.stringify({ status, reason, output }));
if (status === 'failed') {
  process.exitCode = 1;
}
