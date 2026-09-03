import { cp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const files = ['index.html', 'styles.css', 'app.js', 'vocab-data.js'];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of files) {
  await stat(resolve(root, file));
  await cp(resolve(root, file), resolve(dist, file));
}
await writeFile(resolve(dist, '.assetsignore'), '_headers\n_redirects\n', 'utf8');
console.log(`VocabFast build complete: ${files.length} public files -> dist/`);
