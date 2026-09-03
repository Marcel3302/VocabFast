import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const required = ['index.html', 'styles.css', 'app.js', 'vocab-data.js', 'wrangler.jsonc'];
for (const file of required) await access(resolve(root, file));

const html = await readFile(resolve(root, 'index.html'), 'utf8');
for (const ref of ['styles.css', 'app.js', 'vocab-data.js']) {
  if (!html.includes(ref)) throw new Error(`index.html references missing/unknown asset: ${ref}`);
}

const distFiles = (await readdir(resolve(root, 'dist'))).sort();
const expected = ['app.js', 'index.html', 'styles.css', 'vocab-data.js'].sort();
if (JSON.stringify(distFiles) !== JSON.stringify(expected)) {
  throw new Error(`Unexpected dist contents: ${distFiles.join(', ')}`);
}

for (const forbidden of ['_redirects', '_headers']) {
  try {
    await access(resolve(root, forbidden));
    throw new Error(`Forbidden Cloudflare special file still exists: ${forbidden}`);
  } catch (err) {
    if (err?.code !== 'ENOENT') throw err;
  }
  try {
    await access(resolve(root, 'dist', forbidden));
    throw new Error(`Forbidden Cloudflare special file still exists in dist: ${forbidden}`);
  } catch (err) {
    if (err?.code !== 'ENOENT') throw err;
  }
}

JSON.parse((await readFile(resolve(root, 'package.json'), 'utf8')));
// wrangler.jsonc currently contains plain JSON-compatible content.
JSON.parse((await readFile(resolve(root, 'wrangler.jsonc'), 'utf8')));
console.log('Self-test passed: app files, dist contents and Cloudflare routing configuration are clean.');
