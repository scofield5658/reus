import { readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = 'dist';
const sourceDir = path.join(distDir, 'src');

for (const entry of await readdir(sourceDir)) {
  await rename(path.join(sourceDir, entry), path.join(distDir, entry));
}
await rm(sourceDir, { recursive: true, force: true });

const indexDeclaration = path.join(distDir, 'index.d.ts');
const declaration = await readFile(indexDeclaration, 'utf8');
await writeFile(indexDeclaration, declaration.replaceAll('../types/index.js', './types/index.js'));
