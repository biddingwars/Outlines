#!/usr/bin/env node
// Builds the outline geometry files for the content packs.
//
//   node tools/build-outlines.mjs --world <countries-50m.json> --us <states-10m.json>
//
// Inputs are the TopoJSON files shipped in the npm packages
//   world-atlas@2.0.2  (Natural Earth 1:50m Admin 0, public domain)
//   us-atlas@3.0.1     (US Census Bureau cartographic boundaries 1:10m, public domain)
// Fetch them with `npm pack world-atlas@2.0.2 us-atlas@3.0.1` and untar.
//
// For every feature the tool keeps the main landmass (largest polygon by
// area), projects it in its own Lambert azimuthal equal-area projection
// centred on that landmass, flips y so north is up on screen, scales it so the
// longer bounding-box side is 1000 units, centres the area centroid on (0,0)
// and simplifies it. Output is a plain ES module of integer coordinates.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { area, bbox, centroid, projectLAEA, signedArea, simplifyRing } from '../engine/geometry.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : null;
}

// --- TopoJSON decoding (just what we need: Polygon / MultiPolygon) ---------
function decodeArcs(topo) {
  const { scale, translate } = topo.transform;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
}

function ringFromArcs(arcs, indices) {
  const out = [];
  for (const idx of indices) {
    const arc = idx >= 0 ? arcs[idx] : arcs[~idx].slice().reverse();
    for (let i = out.length ? 1 : 0; i < arc.length; i++) out.push(arc[i]);
  }
  if (out.length > 1) {
    const a = out[0];
    const b = out[out.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) out.pop();
  }
  return out;
}

function polygonsOf(geom, arcs) {
  if (geom.type === 'Polygon') return [geom.arcs.map((r) => ringFromArcs(arcs, r))];
  if (geom.type === 'MultiPolygon') return geom.arcs.map((p) => p.map((r) => ringFromArcs(arcs, r)));
  return [];
}

// --- geometry ---------------------------------------------------------------
function unwrap(ring) {
  const out = [ring[0].slice()];
  for (let i = 1; i < ring.length; i++) {
    let lon = ring[i][0];
    const prev = out[i - 1][0];
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}

function lonLatCentroid(ring) {
  // Centroid in an equirectangular frame scaled by cos(lat): good enough as a projection centre.
  const lat0 = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const c = centroid(ring.map(([x, y]) => [x * k, y]));
  return [c[0] / k, c[1]];
}

function km2(ring) {
  const c = lonLatCentroid(ring);
  return area(ring.map((p) => projectLAEA(p, c)));
}

function processFeature(feature, arcs) {
  const polys = polygonsOf(feature, arcs).map((rings) => rings.map(unwrap));
  if (!polys.length) return null;
  let total = 0;
  let main = null;
  let mainArea = -1;
  for (const rings of polys) {
    const outer = km2(rings[0]);
    const holes = rings.slice(1).reduce((s, r) => s + km2(r), 0);
    total += outer - holes;
    if (outer > mainArea) {
      mainArea = outer;
      main = rings[0];
    }
  }
  // Project around the landmass centroid, then refine the centre once.
  let c = lonLatCentroid(main);
  let proj = main.map((p) => projectLAEA(p, c));
  // y up (north) → screen y down
  proj = proj.map(([x, y]) => [x, -y]);
  const b = bbox(proj);
  const side = Math.max(b.w, b.h);
  const unit = 1000 / side; // units per km
  const pc = centroid(proj);
  let pts = proj.map(([x, y]) => [(x - pc[0]) * unit, (y - pc[1]) * unit]);
  let tol = 2;
  let simp = simplifyRing(pts, tol);
  while (simp.length > 360) {
    tol *= 1.25;
    simp = simplifyRing(pts, tol);
  }
  // Integer coordinates; drop consecutive duplicates created by rounding.
  const ints = [];
  for (const [x, y] of simp) {
    const p = [Math.round(x), Math.round(y)];
    const last = ints[ints.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) ints.push(p);
  }
  if (ints.length > 1 && ints[0][0] === ints[ints.length - 1][0] && ints[0][1] === ints[ints.length - 1][1]) ints.pop();
  // Re-centre after rounding so the stored centroid is (0,0) to within a unit.
  const ic = centroid(ints);
  const final = ints.map(([x, y]) => [Math.round(x - ic[0]), Math.round(y - ic[1])]);
  // Store counter-clockwise on screen consistently (positive signed area in y-down = clockwise visually; just normalise).
  if (signedArea(final) < 0) final.reverse();
  return {
    c: [Math.round(c[0] * 100) / 100, Math.round(c[1] * 100) / 100],
    km: Math.round((1 / unit) * 1000) / 1000, // km per outline unit
    area: Math.round(mainArea),
    share: Math.min(1, Math.round((mainArea / total) * 1000) / 1000),
    parts: polys.length,
    pts: final.flat(),
  };
}

function build(file, objectName, keyOf, header) {
  const topo = JSON.parse(readFileSync(file, 'utf8'));
  const arcs = decodeArcs(topo);
  const items = {};
  for (const g of topo.objects[objectName].geometries) {
    const key = keyOf(g);
    if (!key) continue;
    const r = processFeature(g, arcs);
    // Some sources reuse a code for a tiny dependency (e.g. 036 = Australia and
    // Ashmore and Cartier Is.); keep the larger feature.
    if (r && (!items[key] || items[key].area < r.area)) items[key] = { name: g.properties?.name ?? key, ...r };
  }
  const keys = Object.keys(items).sort();
  const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(items[k])},`);
  return `${header}\nexport default {\n  units: 'Local Lambert azimuthal equal-area, north up, y down, longer side = 1000, centroid at 0,0. pts = flat [x0,y0,x1,y1,...]',\n  items: {\n${lines.join('\n')}\n  },\n};\n`;
}

const world = arg('world');
const us = arg('us');
if (!world && !us) {
  console.error('usage: node tools/build-outlines.mjs --world countries-50m.json --us states-10m.json');
  process.exit(1);
}
if (world) {
  const src = build(
    world,
    'countries',
    (g) => g.id ?? null,
    '// GENERATED by tools/build-outlines.mjs. Do not edit by hand.\n// Source: Natural Earth 1:50m Admin 0 Countries (public domain), via world-atlas@2.0.2.\n// Keyed by ISO 3166-1 numeric code. Main landmass only.',
  );
  writeFileSync(join(root, 'packs/world/outlines.js'), src);
  console.log('wrote packs/world/outlines.js');
}
if (us) {
  const src = build(
    us,
    'states',
    (g) => g.id ?? null,
    '// GENERATED by tools/build-outlines.mjs. Do not edit by hand.\n// Source: US Census Bureau Cartographic Boundary Files 1:10m (public domain), via us-atlas@3.0.1.\n// Keyed by state FIPS code. Main landmass only.',
  );
  writeFileSync(join(root, 'packs/us-states/outlines.js'), src);
  console.log('wrote packs/us-states/outlines.js');
}
