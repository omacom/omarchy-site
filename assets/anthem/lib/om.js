// Omarchy music video: the shared design system every scene draws from.
// Ported from omarchy-site (HeroPixelField, Brand, wordmark-bitmap) so the
// video wears the homepage's own lattice, inks and bitmaps. Everything here is
// a pure function of time and seed: no clocks, no Math.random.
(function () {
  const OM = (window.OM = window.OM || {});

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  OM.clamp = clamp;
  OM.lerp = (a, b, t) => a + (b - a) * t;
  /** 0..1 progress of x through [a, b], clamped. */
  OM.prog = (x, a, b) => clamp((x - a) / (b - a));
  OM.smooth = (t) => t * t * (3 - 2 * t);
  OM.ease = {
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    inOutExpo: (t) =>
      t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    /** The site's theme wipe curve: cubic-bezier(0.7, 0, 1, 1). */
    wipe: (t) => bezier(0.7, 0, 1, 1)(t),
  };
  /** CSS cubic-bezier as a function of x (Newton + bisection). */
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 24; i++) {
        const v = sx(t) - x;
        if (Math.abs(v) < 1e-6) break;
        if (v > 0) hi = t; else lo = t;
        t = (lo + hi) / 2;
      }
      return sy(t);
    };
  }
  OM.bezier = bezier;

  /** Seeded PRNG (mulberry32): same seed, same sequence, every render. */
  OM.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  /** Stable hash of two ints to 0..1, for per-cell constants without state. */
  OM.hash = (x, y, s = 0) => {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2147483647);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  // ---------- brand bitmaps ----------
  /** The 81x19 wordmark, cell for cell (src/data/wordmark-bitmap.ts). */
  OM.WORDMARK = {
    w: 81,
    h: 19,
    rows: [
      '000000000000000001110000000000000000000000000000000000000000000000000000000000000',
      '001111100000011111111111000000111111100001111111000011111110000100010000001000100',
      '011111110000111111111111100001111111100011111111000111111110001100011000011000110',
      '111000111001110001110001110011100011100111000111001110001110011100011100111000111',
      '111000111001110001110001110011100011100111000111001110001110011100011100111000111',
      '111000111001110001110001110011100011100111000111001110001100011100011100111000111',
      '111000111001110001110001110011100011100111000111001110001000011100011100111000111',
      '111000111001110001110001110011100011100111000111001110000000011100011100111000111',
      '111000111001110001110001110111111111101111111110001110000000111111111110111111111',
      '111000111001110001110001110111111111101111111100001110000001111111111100111111111',
      '111000111001110001110001110011100011100111000000001110000000011100011100000000111',
      '111000111001110001110001110011100011101111111111001110001000011100011100011000111',
      '111000111001110001110001110011100011101111111111001110001100011100011100111000111',
      '111000111001110001110001110011100011100111000111001110001110011100011100111000111',
      '111000111001110001110001110011100011100111000111001110001110011100011100111000111',
      '011111110000110001110001100011100011000111000111001111111100011100011000011111110',
      '001111100000010001110001000011100010000111000111001111111000011100010000001111100',
      '000000000000000000000000000000000000000111000110000000000000000000000000000000000',
      '000000000000000000000000000000000000000111000100000000000000000000000000000000000',
    ],
  };
  /** The square-spiral mark as a 15x15 bitmap (HeroPixelField LOGO_ROWS). */
  OM.LOGO = {
    w: 15,
    h: 15,
    rows: [
      '111111111111111',
      '100000010000001',
      '101111110001101',
      '101000000000101',
      '101000000000101',
      '101000000000101',
      '101000000000101',
      '111000000000101',
      '101000000000101',
      '101000000000101',
      '101000000000101',
      '101000000000101',
      '101111111111101',
      '100000010000001',
      '111111110111111',
    ],
  };
  /** The mark's vector path, 1200 viewBox (Brand.tsx OMARCHY_MARK_PATH). */
  OM.MARK_PATH =
    'm1200 1200h-480v-80h400v-1040h-479.996v160h-400v720h720v-720h-80v-80h159.996v880h-400v160h-640v-1200h1200zm-1120-80h480v-80h-400l.004-400h-80.004zm0-560h80.004v-400h400v-80h-480.004z';
  /** The drawn-mark strokes, in drawing order (Brand.tsx OmarchyMarkDrawn). */
  OM.MARK_STROKES = [
    'M640 1160H40V40H1160V1160H720',
    'M600 40V200',
    'M640 200H200V1000H1000V200H880',
    'M600 1160V1040',
    'M40 600H200',
  ];
  /** Lit cells of a bitmap as [col, row] pairs. */
  OM.cells = (bitmap) => {
    const out = [];
    bitmap.rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (row[c] === '1') out.push([c, r]);
    });
    return out;
  };
  /** Which field ink each wordmark row rests in (HeroPixelField LASER_BANDS). */
  OM.BANDS = ['crest', 'crest', 'crest', 'crest', 'crest', 'hover', 'hover', 'lit', 'lit', 'lit', 'lit', 'mid', 'mid', 'mid', 'dim', 'dim', 'dim', 'dim', 'dim'];
  /** Classic 8x8 ordered dither matrix, 0..63. */
  OM.BAYER = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
  ];

  // ---------- the field's noise (HeroPixelField buildNoise / sample) ----------
  const NOISE_SIZE = 128;
  OM.noise = (seed) => {
    const size = NOISE_SIZE;
    let state = seed >>> 0;
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    let field = new Float32Array(size * size);
    for (let i = 0; i < field.length; i++) field[i] = random();
    for (let pass = 0; pass < 2; pass++) {
      const next = new Float32Array(size * size);
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) sum += field[((y + dy + size) % size) * size + ((x + dx + size) % size)];
          next[y * size + x] = sum / 9;
        }
      field = next;
    }
    let min = Infinity, max = -Infinity;
    for (const v of field) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const span = max - min || 1;
    for (let i = 0; i < field.length; i++) field[i] = (field[i] - min) / span;
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y);
      const fx = x - xi, fy = y - yi;
      const x0 = ((xi % size) + size) % size, y0 = ((yi % size) + size) % size;
      const x1 = (x0 + 1) % size, y1 = (y0 + 1) % size;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = field[y0 * size + x0], b = field[y0 * size + x1];
      const c = field[y1 * size + x0], d = field[y1 * size + x1];
      return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
    };
  };
  /** A fixed 64x64 tile of per-cell threshold offsets (HeroPixelField buildJitter). */
  OM.jitter = (seed) => {
    let state = seed >>> 0;
    const tile = new Float32Array(64 * 64);
    for (let i = 0; i < tile.length; i++) {
      state = (state * 1664525 + 1013904223) >>> 0;
      tile[i] = state / 4294967296;
    }
    return tile;
  };
  /** The hero's own seeds: the noise is seeded with Tokyo Night green itself. */
  OM.heroNoise = OM.noise(0x9ece6a);
  OM.heroJitter = OM.jitter(0x0a1f14);
  /** Bayer + jitter threshold for a lattice cell, as the hero field computes it. */
  OM.threshold = (col, row) =>
    0.78 * ((OM.BAYER[(row & 7) * 8 + (col & 7)] + 0.5) / 64) + 0.22 * OM.heroJitter[(row & 63) * 64 + (col & 63)];

  // ---------- themes ----------
  OM.THEMES = window.OM_THEMES || {};
  OM.THEME_IDS = Object.keys(OM.THEMES);
  OM.theme = (id = 'tokyo-night') => OM.THEMES[id];
  /** The five field inks of a theme, darkest first. */
  OM.inks = (id = 'tokyo-night') => {
    const t = OM.theme(id);
    return [t['field-dim'], t['field-mid'], t['field-lit'], t['field-hover'], t['field-crest']];
  };
  OM.rgb = (hex) => {
    const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  OM.hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  OM.mix = (a, b, t) => {
    const x = OM.rgb(a), y = OM.rgb(b);
    return OM.hex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t));
  };
  /** Write a theme's tokens onto an element as --t-* custom properties. */
  OM.applyTheme = (el, id) => {
    const t = OM.theme(id);
    for (const k in t) if (k !== 'id' && k !== 'name' && k !== 'light') el.style.setProperty('--t-' + k, t[k]);
  };

  // ---------- canvas ----------
  /**
   * Device pixels per CSS px worth drawing for an element: 2 in a 4K render
   * (deviceScaleFactor 2, no CSS scaling), ~1 in the scaled-down Studio preview.
   */
  OM.drawScale = (el, cssWidth = 1920) => {
    if (window.OM_LIVE && window.OM_LIVE.scale) return window.OM_LIVE.scale; // live player: a fixed, possibly lower, resolution
    const shown = el.getBoundingClientRect().width || cssWidth;
    const s = (shown / cssWidth) * (window.devicePixelRatio || 1);
    return Math.max(1, Math.min(window.devicePixelRatio || 1, Math.ceil(s * 2) / 2));
  };
  /**
   * A canvas whose backing store matches the render's device pixels (2x at
   * 4K), allocated on first use and released by release() so dozens of
   * scenes never hold 4K buffers at once. Draw in CSS px; dpr is applied.
   */
  OM.canvas = (el, opts = {}) => {
    const w = opts.width || 1920, h = opts.height || 1080;
    const state = { el, ctx: null, w, h, dpr: 1 };
    state.ensure = () => {
      const dpr = OM.drawScale(el, w);
      if (!state.ctx || state.dpr !== dpr || el.width !== Math.round(w * dpr)) {
        state.dpr = dpr;
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
        state.ctx = el.getContext('2d', { alpha: opts.alpha !== false });
      }
      state.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      return state.ctx;
    };
    state.release = () => {
      if (el.width) {
        el.width = 0;
        el.height = 0;
        state.ctx = null;
      }
    };
    return state;
  };

  /**
   * Drive a render function from a composition timeline: one linear proxy
   * tween across the scene, so every seek redraws exactly that moment.
   */
  OM.drive = (tl, duration, render) => {
    const clock = { t: 0 };
    tl.to(clock, { t: duration, duration, ease: 'none', onUpdate: () => render(clock.t) }, 0);
    render(0);
    return clock;
  };

  // ---------- lattice ----------
  /**
   * The hero lattice: cells sized so the wordmark spans `wordWidth` CSS px,
   * anchored so the word sits at (wordX, wordY). Field cells share indices
   * with wordmark pixels, exactly like the site.
   */
  OM.lattice = ({ wordWidth = 896, wordX = (1920 - 896) / 2, wordY = 300, width = 1920, height = 1080 } = {}) => {
    const cw = wordWidth / OM.WORDMARK.w;
    const ch = cw * (950 / 4131) * (OM.WORDMARK.w / OM.WORDMARK.h);
    const cMin = -Math.ceil(wordX / cw) - 1;
    const rMin = -Math.ceil(wordY / ch) - 1;
    const cols = Math.ceil((width - wordX) / cw) - cMin + 1;
    const rows = Math.ceil((height - wordY) / ch) - rMin + 1;
    return { cw, ch, x0: wordX, y0: wordY, cMin, rMin, cols, rows, width, height };
  };
  /** Fill one lattice cell, snapped to whole device pixels so cells butt exactly. */
  OM.cell = (ctx, L, col, row, dpr) => {
    const x = Math.round((L.x0 + col * L.cw) * dpr) / dpr;
    const y = Math.round((L.y0 + row * L.ch) * dpr) / dpr;
    const x2 = Math.round((L.x0 + (col + 1) * L.cw) * dpr) / dpr;
    const y2 = Math.round((L.y0 + (row + 1) * L.ch) * dpr) / dpr;
    ctx.fillRect(x, y, x2 - x, y2 - y);
  };

  // ---------- timing ----------
  /** Lyric line windows and the beat grid, filled in by assets/lib/timing.js. */
  OM.T = window.OM_TIMING || null;
})();
