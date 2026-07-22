import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('dist/types', { recursive: true });
await cp('types', 'dist/types', { recursive: true });
const indexPath = 'dist/types/index.d.ts';
const index = await readFile(indexPath, 'utf8');
await writeFile(indexPath, index.replaceAll('../src/', '../'));
