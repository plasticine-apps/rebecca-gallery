// Sanity checks run before every deploy: every painting and track in the JSON
// has its file, every file is referenced, and dist/ contains what it should.
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const problems = [];
const json = async (f) => JSON.parse(await readFile(path.join(ROOT, f), 'utf8'));

const paintings = await json('paintings.json');
const raps = await json('raps.json');
const originals = await readdir(path.join(ROOT, 'originals'));
const audio = await readdir(path.join(ROOT, 'audio'));

const seen = new Set();
for (const [i, p] of paintings.entries()) {
  if (!p.title) problems.push(`painting #${i + 1} has no title`);
  if (!p.file) problems.push(`painting #${i + 1} (${p.title}) has no file`);
  else if (!originals.includes(p.file)) problems.push(`painting "${p.title}": originals/${p.file} is missing`);
  if (seen.has(p.file)) problems.push(`originals/${p.file} is listed twice`);
  seen.add(p.file);
}
for (const f of originals) if (!seen.has(f) && !f.startsWith('.')) problems.push(`originals/${f} is not in paintings.json`);
for (const t of raps) if (!audio.includes(t.file)) problems.push(`track "${t.title}": audio/${t.file} is missing`);

try {
  const html = await readFile(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const n = (html.match(/<figure class="work"/g) || []).length;
  if (n !== paintings.length) problems.push(`dist/index.html shows ${n} paintings, expected ${paintings.length}`);
  for (const p of paintings) {
    const base = p.file.replace(/\.[^.]+$/, '');
    for (const f of [`${base}.jpg`, `${base}-thumb.jpg`]) await stat(path.join(ROOT, 'dist', 'img', f)).catch(() => problems.push(`dist/img/${f} missing`));
  }
  for (const f of ['about.html', 'raps.html', 'style.css', 'gallery.js']) await stat(path.join(ROOT, 'dist', f)).catch(() => problems.push(`dist/${f} missing`));
} catch {
  problems.push('dist/index.html missing — run npm run build first');
}

if (problems.length) { console.error('CHECK FAILED:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`check ok: ${paintings.length} paintings, ${raps.length} tracks`);
