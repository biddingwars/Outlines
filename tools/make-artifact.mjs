#!/usr/bin/env node
// Builds dist/artifact.html: the game as ONE page for a shared test link
// (a Claude artifact), with every script and the stylesheet inlined and the
// pack files and US map data registered up front. Images and the borders file
// are published next to it (see ASSETS). The real app needs none of this:
// index.html loads the flat files directly.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ASSETS = ['earth.jpg', 'globe-hero.webp', 'countries-110m.json', 'us-map.webp', 'us-ak.webp', 'us-hi.webp'];
const read = (f) => readFileSync(join(root, f), 'utf8');
const inline = (src) => `<script>\n${read(src).replace(/<\/script/gi, '<\\/script')}\n</script>`;

let html = read('index.html');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
let out = body
  .replace('<script src="three.min.js" onerror="window.__noThree=1"></script>', inline('three.min.js'))
  .replace(/<script src="([\w.-]+\.js)"><\/script>/g, (m, f) => {
    if (f === 'packs.js') return inline('packs.js') + '\n' + inline('pack-countries.js') + '\n' + inline('pack-states.js');
    if (f === 'us-view.js') return inline('us-map.js') + '\n' + inline('us-view.js');
    return inline(f);
  });
if (/<script src=/.test(out)) throw new Error('a script was not inlined');
const page = `<title>Project X</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#0E0D0B">
<style>
${read('app.css')}
</style>
<script>document.documentElement.setAttribute('data-theme','dark');</script>
${out}`;
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/artifact.html'), page);
for (const a of ASSETS) writeFileSync(join(root, 'dist', a), readFileSync(join(root, a)));
console.log(`wrote dist/artifact.html (${(page.length / 1024).toFixed(0)} KB) + ${ASSETS.length} assets`);
