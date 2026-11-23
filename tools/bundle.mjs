#!/usr/bin/env node
// Packs the app (view + engine + packs) into one self-contained HTML file for
// places that can't serve separate module files, such as a shared test link.
// The app itself needs no build: index.html loads the modules directly.
//
//   node tools/bundle.mjs [--fragment] [--out dist/play.html]
//
// Works on this codebase's module style only: static `import {…} from './x.js'`,
// `import X from`, `export function|const|default`, and literal dynamic imports.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const out = join(root, outArg > 0 ? process.argv[outArg + 1] : 'dist/play.html');
const fragment = process.argv.includes('--fragment');

const mods = new Map();
function rel(from, spec) {
  return posix.normalize(posix.join(posix.dirname(from), spec));
}
function add(id) {
  if (mods.has(id)) return;
  mods.set(id, null);
  let src = readFileSync(join(root, id), 'utf8');
  const deps = [];
  // static imports
  src = src.replace(/import\s+\{([\s\S]*?)\}\s+from\s+'([^']+)';/g, (_, names, spec) => {
    const dep = rel(id, spec);
    deps.push(dep);
    const fields = names.split(',').map((n) => n.trim()).filter(Boolean).map((n) => n.replace(/\s+as\s+/, ': ')).join(', ');
    return `const { ${fields} } = __req(${JSON.stringify(dep)});`;
  });
  src = src.replace(/import\s+(\w+)\s+from\s+'([^']+)';/g, (_, name, spec) => {
    const dep = rel(id, spec);
    deps.push(dep);
    return `const ${name} = __req(${JSON.stringify(dep)}).default;`;
  });
  // dynamic imports with literal paths
  src = src.replace(/import\('([^']+)'\)/g, (_, spec) => {
    const dep = rel(id, spec);
    deps.push(dep);
    return `Promise.resolve(__req(${JSON.stringify(dep)}))`;
  });
  if (/\bimport\s*\(|^\s*import\s/m.test(src)) throw new Error(`${id}: unsupported import form`);
  const names = [];
  src = src.replace(/^export\s+(async\s+function|function|const|let|class)\s+(\w+)/gm, (_, kw, name) => {
    names.push(name);
    return `${kw} ${name}`;
  });
  src = src.replace(/^export\s+default\s+/m, '__exports.default = ');
  if (/^export\s/m.test(src)) throw new Error(`${id}: unsupported export form`);
  src += `\nObject.assign(__exports, { ${names.join(', ')} });`;
  mods.set(id, src);
  deps.forEach(add);
}
add('view/app.js');

let js = `(() => {
const __defs = {};
const __cache = {};
function __req(id) {
  if (!(id in __cache)) { __cache[id] = {}; __defs[id](__cache[id]); }
  return __cache[id];
}
`;
for (const [id, src] of mods) {
  if (id === 'view/app.js') continue;
  js += `__defs[${JSON.stringify(id)}] = function (__exports) {\n'use strict';\n${src}\n};\n`;
}
js += `__defs['view/app.js'] = function (__exports) {\n'use strict';\n${mods.get('view/app.js')}\n};\n__req('view/app.js');\n})();\n`;
js = js.replace(/<\/script/gi, '<\\/script');

const css = readFileSync(join(root, 'view/style.css'), 'utf8');
const head = `<title>Project X</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#0e0d0b">
<style>
${css}
</style>`;
const body = `<main id="app"></main>
<script>
${js}
</script>`;
const html = fragment
  ? `${head}\n${body}\n`
  : `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${relative(root, out)} (${(html.length / 1024).toFixed(0)} KB, ${mods.size} modules)`);
