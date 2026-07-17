import { once } from 'node:events';
import http from 'node:http';

export async function listen(t, handler) {
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  });
  const { port } = server.address();
  return {
    server,
    origin: `http://127.0.0.1:${port}`,
    port,
  };
}
