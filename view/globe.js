// A small orthographic globe drawn on a canvas: no textures, no libraries.
// Land is drawn from the packs' lon/lat outlines; played places glow in brass.

const RAD = Math.PI / 180;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} opts
 *   layers: [{ items: {code: [[lon,lat,...],...]}, base: 'land'|'sub' }]
 *   highlight: {code: 0..1}   brightness of played places
 *   focus: [lon, lat]         where to turn to
 *   spin: degrees per second when idle
 */
export function createGlobe(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  let rot = [-(opts.focus?.[0] ?? 10), -(opts.focus?.[1] ?? 20)];
  let target = null;
  let highlight = opts.highlight ?? {};
  let dragging = null;
  let raf = 0;
  let last = performance.now();
  let alive = true;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const spin = reduced ? 0 : opts.spin ?? 6;
  let size = 0;
  let dpr = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    size = Math.max(10, Math.min(r.width, r.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  }

  function colors() {
    const cs = getComputedStyle(canvas);
    const v = (k) => cs.getPropertyValue(k).trim();
    return { sea0: v('--globe-sea-0'), sea1: v('--globe-sea-1'), land: v('--globe-land'), edge: v('--globe-edge'), sub: v('--globe-sub'), hot: v('--accent'), rim: v('--globe-rim') };
  }

  function project(lon, lat, R, cx, cy, cosP, sinP, lam) {
    const l = (lon + lam) * RAD;
    const p = lat * RAD;
    const cosp = Math.cos(p);
    const x = cosp * Math.sin(l);
    const y0 = Math.sin(p);
    const z0 = cosp * Math.cos(l);
    const y = y0 * cosP - z0 * sinP;
    const z = y0 * sinP + z0 * cosP;
    if (z < 0) {
      // behind the horizon: push to the rim so fills stay closed
      const k = 1 / Math.sqrt(x * x + y * y || 1);
      return [cx + x * k * R, cy - y * k * R, false];
    }
    return [cx + x * R, cy - y * R, true];
  }

  function drawRing(flat, R, cx, cy, cosP, sinP, lam) {
    let any = false;
    ctx.beginPath();
    for (let i = 0; i < flat.length; i += 2) {
      const [x, y, vis] = project(flat[i], flat[i + 1], R, cx, cy, cosP, sinP, lam);
      any ||= vis;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    return any;
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const R = (size * dpr) / 2 - 2 * dpr;
    const cx = w / 2;
    const cy = h / 2;
    const c = colors();
    // ocean
    const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, c.sea0);
    g.addColorStop(1, c.sea1);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const lam = rot[0];
    const phi = -rot[1] * RAD;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);
    for (const layer of opts.layers ?? []) {
      for (const [code, rings] of Object.entries(layer.items)) {
        const hot = highlight[code];
        for (const flat of rings) {
          if (!drawRing(flat, R, cx, cy, cosP, sinP, lam)) continue;
          if (hot !== undefined) {
            ctx.globalAlpha = 0.35 + 0.65 * hot;
            ctx.fillStyle = c.hot;
            ctx.fill();
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = layer.base === 'sub' ? c.sub : c.land;
            ctx.fill();
          }
          ctx.lineWidth = 0.6 * dpr;
          ctx.strokeStyle = c.edge;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
    // terminator shading and rim light
    const s = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.2, cx, cy, R * 1.02);
    s.addColorStop(0, 'rgba(255,255,255,0.10)');
    s.addColorStop(0.6, 'rgba(0,0,0,0)');
    s.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fillStyle = s;
    ctx.fill();
    ctx.lineWidth = 1.2 * dpr;
    ctx.strokeStyle = c.rim;
    ctx.stroke();
  }

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!dragging) {
      if (target) {
        const k = 1 - Math.pow(0.002, dt);
        let d = target[0] - rot[0];
        d = ((d + 540) % 360) - 180;
        rot[0] += d * k;
        rot[1] += (target[1] - rot[1]) * k;
        if (Math.abs(d) < 0.05 && Math.abs(target[1] - rot[1]) < 0.05) target = null;
      } else rot[0] += spin * dt;
    }
    draw();
    raf = requestAnimationFrame(frame);
  }

  const down = (e) => {
    dragging = { x: e.clientX, y: e.clientY, r: rot.slice() };
    target = null;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!dragging) return;
    const k = 180 / Math.max(80, size);
    rot[0] = dragging.r[0] + (e.clientX - dragging.x) * k;
    rot[1] = Math.max(-80, Math.min(80, dragging.r[1] + (e.clientY - dragging.y) * k));
  };
  const up = () => {
    dragging = null;
  };
  if (opts.draggable !== false) {
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }
  const ro = new ResizeObserver(() => {
    resize();
    draw();
  });
  ro.observe(canvas);
  resize();
  raf = requestAnimationFrame(frame);

  return {
    focus([lon, lat]) {
      target = [-lon, -Math.max(-60, Math.min(60, lat))];
    },
    setHighlight(h) {
      highlight = h;
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
  };
}
