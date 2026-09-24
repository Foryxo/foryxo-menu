import { cp, mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// Publish only the public project overview. The Next.js application needs a server.
const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'site');
const target = path.join(root, 'dist', 'pages');
const files = await readdir(source);
const allowed = new Set(['index.html', 'style.css', 'vazirmatn-arabic.woff2', 'OFL.txt']);
if (files.some(file => !allowed.has(file)) || !files.includes('index.html')) {
  throw new Error('Unexpected or missing public overview files.');
}
const html = await readFile(path.join(source, 'index.html'), 'utf8');
if (!html.includes('The live application is temporarily unavailable.')) {
  throw new Error('Keep the application availability notice explicit.');
}
await mkdir(target, { recursive: true });
for (const file of files) await cp(path.join(source, file), path.join(target, file));
console.log(`Built project overview: ${files.length} public files in dist/pages.`);
