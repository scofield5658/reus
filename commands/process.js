import childProcess from 'node:child_process';

export function waitForChild(child, { forwardOutput = true } = {}) {
  if (forwardOutput) {
    child.stdout?.on('data', (chunk) => {
      process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      process.stderr.write(chunk);
    });
  }

  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const suffix = signal ? ` from signal ${signal}` : '';
      const error = new Error(`Child process exited with code ${code}${suffix}`);
      error.exitCode = typeof code === 'number' ? code : 1;
      error.signal = signal;
      reject(error);
    });
  });
}

export function spawnAndWait(command, args, options) {
  return waitForChild(childProcess.spawn(command, args, options));
}

export function setFailureExitCode(error) {
  console.error(error);
  process.exitCode = error.exitCode || 1;
}
