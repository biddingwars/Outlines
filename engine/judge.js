// Drawing judge: cleans a finger drawing, fits it onto the real outline
// (position and size only — never rotation or aspect) and measures overlap
// as intersection over union on a fixed grid.
//
// Deterministic: same strokes in → same numbers out, on any JS engine.

import { area, bbox, centroid, dist, isFinitePoint, maxRadius, perimeter, resample, simplifyRing } from './geometry.js';
import { countOn, moments, overlap, rasterize, rasterizeUnion } from './raster.js';
import { accuracyFromGap } from './scoring.js';

export const JUDGE_DEFAULTS = Object.freeze({
  grid: 160, // minimum comparison grid (pixels per side)
  maxGrid: 512, // thin shapes (Chile, Norway) get a finer grid, up to this
  minWidthPx: 14, // the target's mean width must span at least this many pixels
  frame: 1.6, // half-size of comparison frame, in target max-radii
  maxStrokes: 32,
  maxPoints: 1500, // across all strokes (20 s of finger drawing at 60 Hz ≈ 1200)
  joinGap: 0.08, // join strokes whose ends are closer than this × drawing size
  minArea: 1e-6, // drawings below this fraction of their bbox² count as empty
  maxSpan: 40000, // raster work budget: total rows crossed by the drawing's edges
  scales: [0.92, 0.96, 1, 1.04, 1.08],
  shifts: [-0.04, 0, 0.04], // in target max-radii
  // Tilts tried (cos, sin) for -30° … +30°: a fixed table, so scoring never depends on Math.cos.
  rotations: [
    [1, 0],
    [0.984807753012, -0.173648177667],
    [0.984807753012, 0.173648177667],
    [0.939692620786, -0.342020143326],
    [0.939692620786, 0.342020143326],
    [0.866025403784, -0.5],
    [0.866025403784, 0.5],
  ],
  samples: 256, // boundary samples per shape for the gap measure
  minBlobGap: 0.04, // floor for a shape's blob gap (near-rectangular states)
  maxBlobGap: 0.2, // ceiling for thin shapes, where a blob is too easy to beat
});

/** Flatten an outline stored as [x0,y0,x1,y1,...] into points. */
export function unflatten(flat) {
  const out = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push([flat[i], flat[i + 1]]);
  return out;
}

/**
 * Clean raw strokes from the canvas.
 * - drops non-finite points and exact consecutive duplicates
 * - caps the stroke count and total point count (deterministic decimation)
 * - chains strokes whose end points nearly meet, so an outline drawn in
 *   several pieces becomes one shape
 * Returns closed rings (closing edge implied), possibly empty.
 */
export function cleanStrokes(strokes, opts = {}) {
  const o = { ...JUDGE_DEFAULTS, ...opts };
  if (!Array.isArray(strokes)) return [];
  let list = [];
  for (const s of strokes.slice(0, o.maxStrokes)) {
    if (!Array.isArray(s)) continue;
    const pts = [];
    for (const p of s) {
      if (!isFinitePoint(p)) continue;
      const q = [+p[0], +p[1]];
      const last = pts[pts.length - 1];
      if (!last || last[0] !== q[0] || last[1] !== q[1]) pts.push(q);
    }
    if (pts.length) list.push(pts);
  }
  const total = list.reduce((s, l) => s + l.length, 0);
  if (total > o.maxPoints) {
    const keepEvery = Math.ceil(total / o.maxPoints);
    list = list.map((l) => l.filter((_, i) => i % keepEvery === 0 || i === l.length - 1));
  }
  if (!list.length) return [];
  const all = list.flat();
  const b = bbox(all);
  const size = Math.max(b.w, b.h);
  return chainStrokes(list, size * o.joinGap);
}

function chainStrokes(list, gap) {
  const pool = list.map((l) => l.slice());
  const out = [];
  while (pool.length) {
    let chain = pool.shift();
    let grown = true;
    while (grown) {
      grown = false;
      const head = chain[0];
      const tail = chain[chain.length - 1];
      // Already closed on itself? Stop growing.
      if (chain.length > 2 && dist(head, tail) <= gap) break;
      let best = -1;
      let bestD = gap;
      let mode = 0;
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i];
        const cands = [
          [dist(tail, s[0]), 0], // tail → start
          [dist(tail, s[s.length - 1]), 1], // tail → end (reverse)
          [dist(head, s[s.length - 1]), 2], // end → head
          [dist(head, s[0]), 3], // start → head (reverse)
        ];
        for (const [d, m] of cands) {
          if (d <= bestD) {
            if (d < bestD || best === -1) {
              bestD = d;
              best = i;
              mode = m;
            }
          }
        }
      }
      if (best !== -1) {
        const s = pool.splice(best, 1)[0];
        if (mode === 0) chain = chain.concat(s);
        else if (mode === 1) chain = chain.concat(s.slice().reverse());
        else if (mode === 2) chain = s.concat(chain);
        else chain = s.slice().reverse().concat(chain);
        grown = true;
      }
    }
    out.push(chain);
  }
  return out;
}

/**
 * Prepare a target outline once (cached by callers). `outline` is a ring in
 * outline units, y down.
 */
export function prepareTarget(outline, opts = {}) {
  const o = { ...JUDGE_DEFAULTS, ...opts };
  const c = centroid(outline);
  const r = maxRadius(outline, c);
  const half = r * o.frame;
  const a = area(outline);
  const meanWidth = a / (2 * r);
  const grid = Math.min(o.maxGrid, Math.max(o.grid, Math.ceil((o.minWidthPx * 2 * half) / meanWidth)));
  const scale = grid / (2 * half);
  const t = { scale, tx: (half - c[0]) * scale, ty: (half - c[1]) * scale };
  const bits = rasterize([outline], t, grid);
  const m = moments(bits, grid);
  const target = {
    outline,
    centroid: c,
    radius: r,
    area: a,
    frame: t, // outline units → grid
    bits,
    pixels: m.area,
    grid,
    req: Math.sqrt(a / Math.PI), // radius of the circle with the same area
    samples: resample(outline, o.samples),
    baseline: 0,
    blobGap: 0,
  };
  return target;
}

function segDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  let t = len ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const x = a[0] + t * dx - p[0];
  const y = a[1] + t * dy - p[1];
  return Math.sqrt(x * x + y * y);
}

function distToRings(p, rings) {
  let m = Infinity;
  for (const r of rings) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const d = segDist(p, r[j], r[i]);
      if (d < m) m = d;
    }
  }
  return m;
}

/**
 * Average gap between two outlines, both ways (symmetric chamfer distance),
 * divided by the target's equal-area radius. 0 = identical; a featureless
 * blob on a compact country is around 0.1.
 */
export function outlineGap(target, rings, n = JUDGE_DEFAULTS.samples) {
  const total = rings.reduce((s, r) => s + perimeter(r), 0);
  if (!(total > 0)) return Infinity;
  const drawn = rings.map((r) => resample(r, Math.max(8, Math.round((n * perimeter(r)) / total))));
  let a = 0;
  for (const p of target.samples) a += distToRings(p, drawn);
  let b = 0;
  let k = 0;
  for (const r of drawn) {
    for (const p of r) {
      b += distToRings(p, [target.samples]);
      k++;
    }
  }
  return (a / target.samples.length + b / k) / 2 / target.req;
}

const BLOB_CIRCLE = Array.from({ length: 96 }, (_, i) => {
  // Polygon with fixed vertices; trig here is fine because the result is
  // compared only against itself on this engine (and pinned by golden tests).
  const a = (i / 96) * 2 * Math.PI;
  return [Math.round(10000 * Math.cos(a)) / 10, Math.round(10000 * Math.sin(a)) / 10];
});
const BLOB_SQUARE = [[-1000, -1000], [1000, -1000], [1000, 1000], [-1000, 1000]];

/**
 * How well a featureless blob (circle or square, auto-fitted like any
 * drawing) matches this outline: its best overlap and its smallest gap.
 * Accuracy is scored relative to the blob, so a blind circle earns 1x on a
 * round country too, while drawing real features pays on every shape.
 */
export function blobBaseline(target, opts = {}) {
  const a = judge([BLOB_CIRCLE], target, { ...opts, baseline: false });
  const b = judge([BLOB_SQUARE], target, { ...opts, baseline: false });
  return {
    overlap: Math.round(Math.max(a.iou, b.iou) * 1000) / 1000,
    gap: Math.round(Math.min(a.gap, b.gap) * 10000) / 10000,
  };
}

/** Pixel area and centroid of drawing rings in their own coordinates. */
function measureDrawing(rings, n) {
  const all = rings.flat();
  const b = bbox(all);
  const size = Math.max(b.w, b.h);
  if (!(size > 0)) return null;
  const pad = size * 0.02;
  const scale = n / (size + 2 * pad);
  const t = { scale, tx: (pad - b.minX) * scale, ty: (pad - b.minY) * scale };
  const bits = rasterizeUnion(rings, t, n);
  const m = moments(bits, n);
  if (!m.area) return null;
  return {
    area: m.area / (scale * scale), // in drawing units²
    centroid: [(m.cx - t.tx) / scale, (m.cy - t.ty) / scale],
    bbox: b,
  };
}

/**
 * Score a drawing against a prepared target.
 * The drawing is placed by the best overlap (intersection over union), then
 * scored by how closely its outline follows the real one (outlineGap),
 * relative to what a featureless blob achieves on the same shape.
 * @returns {{accuracy:number, overlap:number, iou:number, gap:number, baseline:number, empty:boolean,
 *            fit:{scale:number, tx:number, ty:number}|null, rings:number[][][]}}
 *   overlap:  raw intersection over union, rounded to 0.1 % (0..1)
 *   gap:      average outline gap / equal-area radius (see outlineGap)
 *   accuracy: 0..1, rounded to 0.1 %; a blob scores about 35 %
 *   fit: maps drawing coords → outline units (p*scale + t); invert it to draw
 *        the real outline over the sketch.
 */
export function judge(strokes, target, opts = {}) {
  const o = { ...JUDGE_DEFAULTS, ...opts };
  const rings = cleanStrokes(strokes, o).filter((r) => r.length >= 3);
  const empty = { accuracy: 0, overlap: 0, iou: 0, gap: Infinity, baseline: target.baseline, empty: true, fit: null, rings };
  if (!rings.length) return empty;
  const m = measureDrawing(rings, target.grid);
  if (!m) return empty;
  const bb = m.bbox;
  if (m.area < o.minArea * Math.max(bb.w, bb.h) ** 2) return empty;

  const s0 = Math.sqrt(target.area / m.area);
  if (!(s0 > 0 && Number.isFinite(s0) && Number.isFinite(m.centroid[0]) && Number.isFinite(m.centroid[1]))) return empty;
  const n = target.grid;
  const F = target.frame;
  const [cx, cy] = m.centroid;
  const rotate = (rs, [co, si]) =>
    co === 1 ? rs : rs.map((r) => r.map(([x, y]) => [cx + (x - cx) * co - (y - cy) * si, cy + (x - cx) * si + (y - cy) * co]));
  const base = tame(rings, s0 * F.scale, o.maxSpan, Math.max(bb.w, bb.h));

  // One fit of the drawing (already rotated) at scale k and offset (dx, dy).
  const fitAt = (work, k, dx, dy) => {
    const s = s0 * k;
    const ox = target.centroid[0] + dx * target.radius - cx * s;
    const oy = target.centroid[1] + dy * target.radius - cy * s;
    // drawing → outline units → grid
    const t = { scale: s * F.scale, tx: ox * F.scale + F.tx, ty: oy * F.scale + F.ty };
    const bits = rasterizeUnion(work, t, n);
    const { inter, union } = overlap(bits, target.bits);
    // Area of the drawing that fell outside the frame still counts against it.
    const expected = m.area * t.scale * t.scale;
    const inside = countOn(bits);
    const wb = bbox(work.flat());
    const gx0 = wb.minX * t.scale + t.tx;
    const gy0 = wb.minY * t.scale + t.ty;
    const gx1 = wb.maxX * t.scale + t.tx;
    const gy1 = wb.maxY * t.scale + t.ty;
    const clipped = gx0 < 0 || gy0 < 0 || gx1 > n || gy1 > n ? Math.max(0, expected - inside) : 0;
    const iou = union + clipped > 0 ? inter / (union + clipped) : 0;
    return { iou, scale: s, tx: ox, ty: oy, k, dx, dy };
  };

  // 1. Which way round? A hand-drawn map is rarely held perfectly north-up:
  //    try a few tilts (fixed table, so every engine computes the same thing).
  let bestRot = null;
  for (const rot of o.rotations) {
    const work = rotate(base, rot);
    for (const dx of o.shifts) for (const dy of o.shifts) {
      const f = fitAt(work, 1, dx, dy);
      if (!bestRot || f.iou > bestRot.iou) bestRot = { iou: f.iou, rot, work };
    }
  }
  // 2. Size and position at that tilt, then one refinement pass at half step.
  const work = bestRot.work;
  let best = null;
  const tryFit = (k, dx, dy) => {
    const f = fitAt(work, k, dx, dy);
    if (!best || f.iou > best.iou) best = f;
  };
  for (const k of o.scales) for (const dx of o.shifts) for (const dy of o.shifts) tryFit(k, dx, dy);
  const c = best;
  const ks = (o.scales[1] - o.scales[0]) / 2;
  const ds = (o.shifts[1] - o.shifts[0]) / 2;
  for (const a of [-ks, 0, ks]) for (const b of [-ds, 0, ds]) for (const d of [-ds, 0, ds]) {
    if (a || b || d) tryFit(c.k + a, c.dx + b, c.dy + d);
  }

  const iou = best.iou;
  const fit = { scale: best.scale, tx: best.tx, ty: best.ty, cos: bestRot.rot[0], sin: bestRot.rot[1], cx, cy };
  const placed = work.map((r) => r.map(([x, y]) => [x * fit.scale + fit.tx, y * fit.scale + fit.ty]));
  const gap = outlineGap(target, placed, o.samples);
  return {
    accuracy: accuracyFromGap(gap),
    overlap: Math.round(iou * 1000) / 1000,
    iou,
    gap,
    baseline: target.baseline,
    empty: false,
    fit,
    rings,
  };
}

/**
 * Keep raster work bounded. Real outlines cross a few thousand grid rows in
 * total; a frantic scribble can cross hundreds of thousands. Such drawings are
 * simplified (deterministically) until they fit the budget.
 */
function tame(rings, gridScale, budget, size) {
  const span = (rs) => {
    let s = 0;
    for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += Math.abs(r[i][1] - r[j][1]);
    return s * gridScale;
  };
  let out = rings;
  let tol = size / 200;
  while (span(out) > budget && tol < size) {
    out = rings.map((r) => simplifyRing(r, tol));
    tol *= 2;
  }
  return out;
}

/** Map the real outline into drawing (canvas) coordinates using a judge fit (undoing its tilt). */
export function outlineToCanvas(outline, fit) {
  const co = fit.cos ?? 1;
  const si = fit.sin ?? 0;
  const cx = fit.cx ?? 0;
  const cy = fit.cy ?? 0;
  return outline.map(([x, y]) => {
    const qx = (x - fit.tx) / fit.scale - cx;
    const qy = (y - fit.ty) / fit.scale - cy;
    return [cx + qx * co + qy * si, cy - qx * si + qy * co];
  });
}

/**
 * Width / height of the drawing area for a place: its bounding box, clamped so
 * thin places (Chile, Norway) get a tall canvas and wide ones (Russia) a wide
 * one, without giving the exact proportions away.
 */
export function drawingAspect(outline, min = 0.55, max = 1.8) {
  const b = bbox(outline);
  const a = b.w / (b.h || 1);
  const soft = Math.sqrt(a); // halfway to the true proportions
  return Math.round(Math.min(max, Math.max(min, soft)) * 100) / 100;
}

/** Map a ring from outline units into a square canvas of `size` px with margin. */
export function outlineToBox(outline, size, margin = 0.1) {
  const b = bbox(outline);
  const s = (size * (1 - 2 * margin)) / Math.max(b.w, b.h);
  const ox = (size - b.w * s) / 2 - b.minX * s;
  const oy = (size - b.h * s) / 2 - b.minY * s;
  return outline.map(([x, y]) => [x * s + ox, y * s + oy]);
}
