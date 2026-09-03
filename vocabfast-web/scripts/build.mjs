import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const publicFiles = ['index.html', 'styles.css', 'app.js', 'vocab-data.js'];

// Always create a clean deployment directory. In particular, never keep
// old Cloudflare special files such as _redirects or _headers in dist/.
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of publicFiles) {
  const source = resolve(root, file);
  await stat(source);
  await cp(source, resolve(dist, file));
}

console.log(`VocabFast build complete: ${publicFiles.length} public files -> dist/`);
