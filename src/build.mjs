// Builds the static site into dist/ from paintings.json, raps.json,
// content/about.md, originals/ and audio/. Run: npm run build
import { readFile, writeFile, mkdir, copyFile, readdir, stat, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const CACHE = path.join(ROOT, '.cache');
const SITE_TITLE = 'The Works of Rebecca Newman';
const SIZES = { thumb: 700, full: 1800 }; // max long edge in px

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function readJson(name) {
  return JSON.parse(await readFile(path.join(ROOT, name), 'utf8'));
}

function layout({ title, page, body, extraHead = '' }) {
  const nav = [['index.html', 'Paintings', 'paintings'], ['raps.html', 'Raps', 'raps'], ['about.html', 'About', 'about']]
    .map(([href, label, id]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="Paintings by Rebecca Newman, an abstract artist working in acrylic.">
<link rel="stylesheet" href="style.css">
${extraHead}
</head>
<body>
<header>
  <h1 class="site-title"><a href="index.html">${SITE_TITLE}</a></h1>
  <nav>${nav}</nav>
</header>
<main>
${body}
</main>
<footer>&copy; Rebecca Newman</footer>
</body>
</html>
`;
}

// Resize with a content-addressed cache so rebuilds only process new images.
async function derive(srcPath, outName, maxEdge) {
  const buf = await readFile(srcPath);
  const key = createHash('sha256').update(buf).update(String(maxEdge)).digest('hex').slice(0, 16);
  const cached = path.join(CACHE, `${key}.jpg`);
  const out = path.join(DIST, 'img', outName);
  try {
    await stat(cached);
  } catch {
    await mkdir(CACHE, { recursive: true });
    await sharp(buf).rotate().resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true }).toFile(cached);
  }
  await copyFile(cached, out);
  const meta = await sharp(out).metadata();
  return { width: meta.width, height: meta.height };
}

function caption(p, tag = 'span') {
  const detail = [p.medium, p.size ? `${p.size} in` : null].filter(Boolean).join(', ');
  return `<${tag} class="title">${esc(p.title)}${p.sold ? ' <span class="sold">sold</span>' : ''}</${tag}>` +
    (detail ? `<span class="detail">${esc(detail)}</span>` : '');
}

async function buildPaintings() {
  const paintings = await readJson('paintings.json');
  await mkdir(path.join(DIST, 'img'), { recursive: true });
  const figures = [];
  for (const [i, p] of paintings.entries()) {
    const src = path.join(ROOT, 'originals', p.file);
    const base = p.file.replace(/\.[^.]+$/, '');
    const thumb = await derive(src, `${base}-thumb.jpg`, SIZES.thumb);
    const full = await derive(src, `${base}.jpg`, SIZES.full);
    figures.push(`<figure class="work" data-index="${i}">
  <a href="img/${base}.jpg" data-full="img/${base}.jpg" data-w="${full.width}" data-h="${full.height}">
    <img src="img/${base}-thumb.jpg" width="${thumb.width}" height="${thumb.height}" alt="${esc(p.title)}" loading="${i < 6 ? 'eager' : 'lazy'}" decoding="async">
  </a>
  <figcaption>${caption(p)}</figcaption>
</figure>`);
  }
  const body = `<div class="gallery">
${figures.join('\n')}
</div>
<dialog class="lightbox" aria-label="Painting">
  <figure>
    <img alt="">
    <figcaption></figcaption>
  </figure>
  <button class="prev" aria-label="Previous">&lsaquo;</button>
  <button class="next" aria-label="Next">&rsaquo;</button>
  <button class="close" aria-label="Close">&times;</button>
</dialog>
<script src="gallery.js" defer></script>`;
  await writeFile(path.join(DIST, 'index.html'), layout({ title: SITE_TITLE, page: 'paintings', body }));
  return paintings.length;
}

async function buildRaps() {
  const raps = await readJson('raps.json');
  await mkdir(path.join(DIST, 'audio'), { recursive: true });
  const items = [];
  for (const t of raps) {
    await copyFile(path.join(ROOT, 'audio', t.file), path.join(DIST, 'audio', t.file));
    items.push(`<li>
  <h2 class="track-title">${esc(t.title)}${t.year ? `<span class="year">${esc(t.year)}</span>` : ''}</h2>
  <audio controls preload="none" src="audio/${esc(t.file)}"></audio>
</li>`);
  }
  const body = `<ul class="tracks">\n${items.join('\n')}\n</ul>`;
  await writeFile(path.join(DIST, 'raps.html'), layout({ title: `Raps — ${SITE_TITLE}`, page: 'raps', body }));
  return raps.length;
}

async function buildAbout() {
  const md = await readFile(path.join(ROOT, 'content', 'about.md'), 'utf8');
  const html = md.trim().split(/\n\s*\n/).map((block) => {
    const m = block.match(/^#\s+(.*)$/);
    return m ? `<h1>${esc(m[1])}</h1>` : `<p>${esc(block.replace(/\s*\n\s*/g, ' '))}</p>`;
  }).join('\n');
  await writeFile(path.join(DIST, 'about.html'), layout({ title: `About — ${SITE_TITLE}`, page: 'about', body: `<div class="prose">\n${html}\n</div>` }));
}

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await copyFile(path.join(ROOT, 'src', 'style.css'), path.join(DIST, 'style.css'));
  await copyFile(path.join(ROOT, 'src', 'gallery.js'), path.join(DIST, 'gallery.js'));
  await writeFile(path.join(DIST, '.nojekyll'), '');
  const n = await buildPaintings();
  const r = await buildRaps();
  await buildAbout();
  console.log(`built dist/: ${n} paintings, ${r} tracks, ${(await readdir(path.join(DIST, 'img'))).length} images`);
}

main().catch((e) => { console.error(e); process.exit(1); });
