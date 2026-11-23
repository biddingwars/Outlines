// Plane geometry helpers. Points are [x, y] arrays. Rings are arrays of points
// with the closing edge implied (first point is not repeated at the end).
//
// Everything used by scoring sticks to + - * / and sqrt, which IEEE-754
// guarantees bit-identical across JavaScript engines. Trigonometry is only
// used by the outline build tool and the bot's sketch generator.

export function isFinitePoint(p) {
  return Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]);
}

/** Signed shoelace area (positive = counter-clockwise in y-up coordinates). */
export function signedArea(ring) {
  let s = 0;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    s += (ring[j][0] * ring[i][1]) - (ring[i][0] * ring[j][1]);
  }
  return s / 2;
}

export function area(ring) {
  return Math.abs(signedArea(ring));
}

/** Area centroid; falls back to the vertex mean for zero-area rings. */
export function centroid(ring) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const f = (ring[j][0] * ring[i][1]) - (ring[i][0] * ring[j][1]);
    a += f;
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
  }
  if (Math.abs(a) < 1e-12) {
    let sx = 0;
    let sy = 0;
    for (const p of ring) {
      sx += p[0];
      sy += p[1];
    }
    return n ? [sx / n, sy / n] : [0, 0];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

export function bbox(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export function dist(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function perimeter(ring, closed = true) {
  let s = 0;
  for (let i = 1; i < ring.length; i++) s += dist(ring[i - 1], ring[i]);
  if (closed && ring.length > 2) s += dist(ring[ring.length - 1], ring[0]);
  return s;
}

/** Largest distance from point c to any vertex. */
export function maxRadius(ring, c) {
  let r = 0;
  for (const p of ring) r = Math.max(r, dist(p, c));
  return r;
}

function segDistSq(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  let t = len ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const x = a[0] + t * dx - p[0];
  const y = a[1] + t * dy - p[1];
  return x * x + y * y;
}

/** Ramer–Douglas–Peucker simplification of an open polyline (iterative). */
export function simplify(points, tolerance) {
  if (points.length <= 2) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const tolSq = tolerance * tolerance;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = -1;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = segDistSq(points[i], points[s], points[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx !== -1 && maxD > tolSq) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  const out = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

/** Simplify a closed ring by splitting it at its two most distant vertices. */
export function simplifyRing(ring, tolerance) {
  if (ring.length <= 4) return ring.slice();
  let far = 0;
  let farD = -1;
  for (let i = 1; i < ring.length; i++) {
    const d = dist(ring[0], ring[i]);
    if (d > farD) {
      farD = d;
      far = i;
    }
  }
  const a = simplify(ring.slice(0, far + 1), tolerance);
  const b = simplify(ring.slice(far).concat([ring[0]]), tolerance);
  const out = a.concat(b.slice(1, -1));
  return out.length >= 3 ? out : ring.slice();
}

/** Resample a ring (closed) or polyline to n points evenly spaced along its length. */
export function resample(points, n, closed = true) {
  if (points.length < 2 || n < 2) return points.slice();
  const pts = closed ? points.concat([points[0]]) : points;
  const total = perimeter(pts, false);
  if (total === 0) return Array.from({ length: n }, () => points[0].slice());
  const step = total / (closed ? n : n - 1);
  const out = [pts[0].slice()];
  let acc = 0;
  let target = step;
  for (let i = 1; i < pts.length && out.length < n; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = dist(a, b);
    while (seg > 0 && acc + seg >= target && out.length < n) {
      const t = (target - acc) / seg;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      target += step;
    }
    acc += seg;
  }
  while (out.length < n) out.push(pts[pts.length - 1].slice());
  return out;
}

/**
 * Lambert azimuthal equal-area projection centred on [lon0, lat0] (degrees).
 * Returns [x, y] in kilometres on a spherical Earth, y pointing north.
 * Used by the outline build tool; the engine works on pre-projected outlines.
 */
export function projectLAEA([lon, lat], [lon0, lat0]) {
  const R = 6371.0088;
  const d = Math.PI / 180;
  const l = (lon - lon0) * d;
  const p = lat * d;
  const p0 = lat0 * d;
  const k = Math.sqrt(2 / (1 + Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l)));
  return [
    R * k * Math.cos(p) * Math.sin(l),
    R * k * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)),
  ];
}
