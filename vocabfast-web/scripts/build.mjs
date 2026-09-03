import {rm,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'dist');
const files=['index.html','styles.css','app.js','vocab-data.js','grammar-data.js'];
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const f of files)await copyFile(resolve(root,f),resolve(dist,f));
console.log(`VocabFast build complete: ${files.length} public files -> dist/`);
