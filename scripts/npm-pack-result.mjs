export function parseNpmPackResult(stdout) {
  const jsonStart = stdout.lastIndexOf('\n[');
  return JSON.parse(jsonStart >= 0 ? stdout.slice(jsonStart + 1) : stdout);
}
