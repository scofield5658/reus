import childProcess from 'node:child_process';
import type { ChildProcess, SpawnOptions } from 'node:child_process';

interface ChildProcessError extends Error {
  exitCode?: number;
  signal?: NodeJS.Signals | null;
}

export function waitForChild(
  child: ChildProcess,
  { forwardOutput = true }: { forwardOutput?: boolean } = {},
): Promise<void> {
  if (forwardOutput) {
    child.stdout?.on('data', (chunk) => {
      process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      process.stderr.write(chunk);
    });
  }

  return new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const suffix = signal ? ` from signal ${signal}` : '';
      const error: ChildProcessError = new Error(`Child process exited with code ${code}${suffix}`);
      error.exitCode = typeof code === 'number' ? code : 1;
      error.signal = signal;
      reject(error);
    });
  });
}

export function spawnAndWait(command: string, args: string[], options?: SpawnOptions): Promise<void> {
  return waitForChild(childProcess.spawn(command, args, options || {}));
}

export function setFailureExitCode(error: unknown) {
  console.error(error);
  process.exitCode = typeof error === 'object' && error !== null && 'exitCode' in error
    && typeof error.exitCode === 'number'
    ? error.exitCode
    : 1;
}
