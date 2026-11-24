// Deterministic polygon rasteriser used for shape comparison.
//
// Shapes are filled with the non-zero winding rule, so a loop that crosses
// itself stays filled instead of punching holes, and several strokes are
// unioned. Sampling happens at pixel centres. Only + - * / are used.

/**
 * Rasterise rings into an N×N bitmap.
 * @param {number[][][]} rings   rings in source coordinates
 * @param {{scale:number, tx:number, ty:number}} t  maps source → grid: g = p*scale + t
 * @param {number} n             grid size
 * @param {Uint8Array} [out]     optional bitmap to OR into
 */
export function rasterize(rings, t, n, out = new Uint8Array(n * n)) {
  const rows = new Array(n);
  for (const ring of rings) {
    const m = ring.length;
    if (m < 3) continue;
    for (let i = 0, j = m - 1; i < m; j = i++) {
      const x0 = ring[j][0] * t.scale + t.tx;
      const y0 = ring[j][1] * t.scale + t.ty;
      const x1 = ring[i][0] * t.scale + t.tx;
      const y1 = ring[i][1] * t.scale + t.ty;
      if (y0 === y1) continue;
      const dir = y1 > y0 ? 1 : -1;
      const ya = y0 < y1 ? y0 : y1;
      const yb = y0 < y1 ? y1 : y0;
      // Rows whose centre (r + 0.5) lies in [ya, yb).
      let r0 = Math.ceil(ya - 0.5);
      let r1 = Math.ceil(yb - 0.5) - 1;
      if (r0 < 0) r0 = 0;
      if (r1 > n - 1) r1 = n - 1;
      const inv = (x1 - x0) / (y1 - y0);
      for (let r = r0; r <= r1; r++) {
        const yc = r + 0.5;
        const x = x0 + (yc - y0) * inv;
        (rows[r] ||= []).push(x, dir);
      }
    }
  }
  // Winding is summed across all rings passed in one call (so a ring and an
  // oppositely-wound hole cancel). Use rasterizeUnion() to OR independent shapes.
  for (let r = 0; r < n; r++) {
    const row = rows[r];
    if (!row) continue;
    fillRow(row, r, n, out);
  }
  return out;
}

function fillRow(row, r, n, out) {
  // Crossings going down (+1) and up (−1) are sorted apart with the native numeric sort
  // and merged (up first on a tie, as before): a wild scribble has thousands per row and a
  // comparator sort was most of the judge's time on hostile input. Same pixels as before.
  const k = row.length / 2;
  let np = 0;
  for (let i = 0; i < k; i++) if (row[2 * i + 1] > 0) np++;
  const down = new Float64Array(np);
  const up = new Float64Array(k - np);
  for (let i = 0, a = 0, b = 0; i < k; i++) {
    if (row[2 * i + 1] > 0) down[a++] = row[2 * i];
    else up[b++] = row[2 * i];
  }
  down.sort();
  up.sort();
  const base = r * n;
  let wind = 0;
  let start = 0;
  for (let a = 0, b = 0; a < down.length || b < up.length; ) {
    let x;
    let d;
    if (b < up.length && (a >= down.length || up[b] <= down[a])) {
      x = up[b++];
      d = -1;
    } else {
      x = down[a++];
      d = 1;
    }
    const prev = wind;
    wind += d;
    if (prev === 0) start = x; // a filled span starts here…
    else if (wind === 0) {
      // …and ends where the winding returns to zero: pixels whose centre c+0.5 lies in [start, x)
      let c0 = Math.ceil(start - 0.5);
      let c1 = Math.ceil(x - 0.5) - 1;
      if (c0 < 0) c0 = 0;
      if (c1 > n - 1) c1 = n - 1;
      for (let c = c0; c <= c1; c++) out[base + c] = 1;
    }
  }
}

/** Rasterise each ring independently and OR them (union of shapes). */
export function rasterizeUnion(rings, t, n) {
  const out = new Uint8Array(n * n);
  for (const ring of rings) rasterize([ring], t, n, out);
  return out;
}

export function countOn(bits) {
  let c = 0;
  for (let i = 0; i < bits.length; i++) c += bits[i];
  return c;
}

/** Pixel area and pixel-centre centroid of a bitmap. */
export function moments(bits, n) {
  let c = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < n; y++) {
    const base = y * n;
    for (let x = 0; x < n; x++) {
      if (bits[base + x]) {
        c++;
        sx += x + 0.5;
        sy += y + 0.5;
      }
    }
  }
  return c ? { area: c, cx: sx / c, cy: sy / c } : { area: 0, cx: 0, cy: 0 };
}

/** Intersection and union counts of two equal-size bitmaps. */
export function overlap(a, b) {
  let inter = 0;
  let uni = 0;
  for (let i = 0; i < a.length; i++) {
    const p = a[i];
    const q = b[i];
    inter += p & q;
    uni += p | q;
  }
  return { inter, union: uni };
}
