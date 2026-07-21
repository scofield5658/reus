import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/types', { recursive: true });
await cp('types', 'dist/types', { recursive: true });
