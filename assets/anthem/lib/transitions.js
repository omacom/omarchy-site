// Line-to-line transitions. During its `enter` window an incoming scene is
// revealed over the outgoing one through a mask built from lattice cells
// (2x2 home cells), so every edge is stepped on the homepage grid. Each type
// is a predicate: is this cell revealed at progress p? Each (type, variant)
// is used once in the film; assemble.mjs enforces it.
(function () {
  const OM = window.OM;
  const CW = OM.HOME.cw * 2, CH = OM.HOME.ch * 2;
  const COLS = Math.ceil(1920 / CW), ROWS = Math.ceil(1080 / CH);
  const cx = (c) => (c + 0.5) * CW, cy = (r) => (r + 0.5) * CH;
  const DIAG = Math.hypot(1920, 1080);
  const at = (v) => ({ x: (v && v.x) ?? 960, y: (v && v.y) ?? 540 });
  const reach = (o) => Math.max(Math.hypot(o.x, o.y), Math.hypot(1920 - o.x, o.y), Math.hypot(o.x, 1080 - o.y), Math.hypot(1920 - o.x, 1080 - o.y));
  const bitmapHit = (bm, x, y, s, o) => {
    const ww = bm.w * s, hh = bm.h * s * (bm === OM.WORDMARK ? 0.98 : 1);
    const u = Math.floor(((x - o.x) / ww + 0.5) * bm.w), v = Math.floor(((y - o.y) / hh + 0.5) * bm.h);
    return u >= 0 && v >= 0 && u < bm.w && v < bm.h && bm.rows[v][u] === '1';
  };

  /** type -> (col, row, p, v) => revealed. v carries the variant's origin/direction. */
  const TYPES = {
    iris: (c, r, p, v) => { const o = at(v); return Math.hypot(cx(c) - o.x, cy(r) - o.y) < p * reach(o); },
    box: (c, r, p, v) => { const o = at(v); return Math.max(Math.abs(cx(c) - o.x) / 1.78, Math.abs(cy(r) - o.y)) < p * 620; },
    diamond: (c, r, p, v) => { const o = at(v); return Math.abs(cx(c) - o.x) + Math.abs(cy(r) - o.y) < p * 1560; },
    cross: (c, r, p) => Math.min(Math.abs(cx(c) - 960), Math.abs(cy(r) - 540) * 1.78) < p * 980,
    wipe: (c, r, p, v) => { const a = ((v && v.deg) || 0) * Math.PI / 180; const d = (cx(c) - 960) * Math.cos(a) + (cy(r) - 540) * Math.sin(a); return d < (p - 0.5) * DIAG; },
    doors: (c, r, p, v) => (v && v.axis === 'y' ? Math.abs(cy(r) - 540) < p * 560 : Math.abs(cx(c) - 960) < p * 980),
    dither: (c, r, p) => OM.threshold(c, r) < p * 1.02,
    noise: (c, r, p, v) => OM.heroNoise(c / 5 + ((v && v.seed) || 0), r / 5) * 0.86 + 0.07 < p,
    columns: (c, r, p, v) => { const k = v && v.from === 'right' ? COLS - 1 - c : c; return r / ROWS < p * 1.7 - (k / COLS) * 0.7; },
    rain: (c, r, p) => r / ROWS < (p * 2 - OM.hash(c, 7, 3)) * 1.2,
    venetian: (c, r, p) => ((r & 1 ? COLS - 1 - c : c) / COLS) < p,
    stairs: (c, r, p) => c / COLS < p * 1.6 - ((r % 6) / 6) * 0.6,
    spiral: (c, r, p) => { const a = (Math.atan2(cy(r) - 540, cx(c) - 960) / (2 * Math.PI) + 1) % 1; return (a + Math.hypot(cx(c) - 960, cy(r) - 540) / 520) / 3.1 < p; },
    clock: (c, r, p, v) => { const o = at(v); const a = (Math.atan2(cx(c) - o.x, -(cy(r) - o.y)) / (2 * Math.PI) + 1) % 1; return a < p; },
    checker: (c, r, p) => ((c + r) & 1 ? p * 2 - 1 : p * 2) > OM.hash(c, r, 11) * 0.8 + 0.1,
    band: (c, r, p) => Math.abs(cy(r) - 540) < p * 560,
    word: (c, r, p, v) => { const o = at(v); const s = (OM.HOME.cw * 0.35) * Math.pow(60, OM.ease.inCubic(p)); return p > 0.97 || bitmapHit(OM.WORDMARK, cx(c), cy(r), s, o); },
    mark: (c, r, p, v) => { const o = at(v); const s = 6 * Math.pow(55, OM.ease.inCubic(p)); return p > 0.97 || bitmapHit(OM.LOGO, cx(c), cy(r), s, o); },
    zigzag: (c, r, p) => c / COLS + (Math.abs(((r / 3) % 2) - 1) * 0.12) < p * 1.14,
    blinds: (c, r, p) => (c % 4 < 2 ? r / ROWS : 1 - r / ROWS) < p,
    shards: (c, r, p) => OM.hash(Math.floor(c / 5), Math.floor(r / 3), 21) < p,
    ripple: (c, r, p) => { const d = Math.hypot(cx(c) - 960, cy(r) - 540) / 1100; const ring = Math.floor(d * 7); return (ring & 1 ? d : 1 - d) * 0.9 < p; },
    interlace: (c, r, p) => (r & 1 ? (p - 0.5) * 2 : p * 2) > c / COLS,
    tetris: (c, r, p) => { const bc = Math.floor(c / 4); const land = 1 - (r + 1) / ROWS; return land < p * 1.5 - OM.hash(bc, 1, 5) * 0.5; },
    snake: (c, r, p) => { const k = r * COLS + (r & 1 ? COLS - 1 - c : c); return k / (ROWS * COLS) < p; },
    quad: (c, r, p) => { const ox = cx(c) < 960 ? 0 : 1920, oy = cy(r) < 540 ? 0 : 1080; return Math.hypot(cx(c) - ox, cy(r) - oy) < p * 1110; },
    sunburst: (c, r, p) => { const a = (Math.atan2(cy(r) - 540, cx(c) - 960) / (2 * Math.PI) + 1) % 1; return (a * 12) % 1 < p; },
    blocks: (c, r, p) => OM.hash(Math.floor(c / 8), Math.floor(r / 4), 31) < p * 1.6 - 0.3 || OM.hash(c, r, 33) < p * 1.6 - 0.6,
    stripes: (c, r, p) => ((c + r * 1.78) % 12) / 12 < p,
    gate: (c, r, p) => Math.abs(cy(r) - 540) > (1 - p) * 560,
    corners: (c, r, p) => Math.max(Math.abs(cx(c) - 960) / 1.78, Math.abs(cy(r) - 540)) > (1 - p) * 560,
    ring: (c, r, p) => Math.hypot(cx(c) - 960, cy(r) - 540) > (1 - p) * 1110,
    logopath: (c, r, p) => { const u = Math.floor((cx(c) - 420) / 1080 * 15), w = Math.floor((cy(r) + 0) / 1080 * 15); const k = u >= 0 && u < 15 && w >= 0 && w < 15 && OM.LOGO.rows[w][u] === '1'; return k ? (u + w) / 28 < p * 1.4 : p > 0.5 + OM.hash(c, r, 41) * 0.5; },
  };
  OM.TRANSITION_TYPES = Object.keys(TYPES);

  /** A clip-path for progress p: revealed cells merged into horizontal runs. */
  OM.transitionClip = (type, p, v) => {
    if (p >= 1) return '';
    const f = TYPES[type];
    const parts = [];
    for (let r = 0; r < ROWS; r++) {
      let run = -1;
      for (let c = 0; c <= COLS; c++) {
        const on = c < COLS && f(c, r, p, v);
        if (on && run < 0) run = c;
        if (!on && run >= 0) {
          const x = (run * CW).toFixed(1), y = (r * CH).toFixed(1);
          parts.push(`M${x} ${y}H${(c * CW).toFixed(1)}V${((r + 1) * CH).toFixed(1)}H${x}Z`);
          run = -1;
        }
      }
    }
    return parts.length ? `path('${parts.join('')}')` : 'inset(50% 50% 50% 50%)';
  };
})();
