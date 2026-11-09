// v2-02 · Theme carousel homescreen. The empty six-tile desk from v2-01 boots
// into an Omarchy desktop: a waybar drops in, the tiles re-tile to seven glass
// windows, and every word opens its window and flips the whole desktop to the
// next Omarchy theme. A switch is a homescreen page flick: the new wallpaper
// (each drawn in code as a lattice) pages in from the right behind the glass
// while the window chrome recolors in a cascade spreading out of the window
// the word just opened, and the bar snaps to the theme's name. The flicks
// accelerate through the gap and the held note; on the last word the whole
// workspace swipes home to Tokyo Night. The words clear and the desk powers
// back down to the empty seven-tile still that is the cut into v2-03.

// Edit camera: the theme flicks already cut the line to the words, and the first word sits 64 px from
// the left edge all line long, so the camera stays light here: zoom capped at 0.8% (the scene's own
// sway and zoom cut down to match). The downbeat after the key word (122.868) is skipped so the swipe
// home on the key word stays the line's last big moment, and the word there would reach the band.
OM.edit.plan('v2-02', { skip: [122.868], max: 0.008 });

OM.ownWords.add('v2-02');
OM.scene({
  id: 'v2-02',
  build(el, { start, duration }) {
    const V = OM.v2;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    // A faint bloom on the lit cells (dark themes only) plus a soft vignette: off returns src(cam(uv)) exactly.
    const FX = `vec4 effect(vec2 uv) {
      vec2 q = cam(uv);
      vec4 c = src(q);
      vec2 px = vec2(1.0) / uRes * (uRes.x / 1920.0);
      vec3 b = vec3(0.0);
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7854 + 0.39;
        vec2 o = vec2(cos(a), sin(a)) * px;
        b += max(src(q + o * 7.0).rgb - 0.7, 0.0) + max(src(q + o * 18.0).rgb - 0.7, 0.0) * 0.6;
      }
      float v = smoothstep(0.42, 0.95, length((uv - 0.5) * vec2(1.0, 0.75)));
      vec3 col = c.rgb + b * (0.03 + 0.09 * uP0.x) * (1.0 - uP0.y) * uAmount - c.rgb * v * 0.22 * uAmount;
      return vec4(col, 1.0);
    }`;
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: FX });
    const beat = OM.edit.scene(start, start + duration); // the sway runs on the beat clock, surging through each beat
    const ink = V.ink();
    const sung = OM.sung('v2-02');
    const N = sung.length;
    const on = sung.map((w) => w.t0);
    const END = start + duration;
    const FROM = V.grid(6), TO = V.grid(N);
    // Every drum time on the measured hit (OM.T.drums, OM.T.beatsOn).
    const KICKS = [119.211, 119.676, 120.279].map((t) => V.drum('kick', t));
    const GAP_SNARE = V.drum('snare', 121.25), SNARE = V.drum('snare', 122.95);
    // Hats: true 16ths, four to each measured beat, from the first beat of the line.
    const BO = ((OM.T && OM.T.beatsOn) || []).filter((b) => b > start - 1 && b < END + 1);
    const G0 = BO.find((b) => b >= on[0] - 0.03) ?? 119.119;
    const S16 = [];
    for (let i = 0; i + 1 < BO.length; i++) for (let j = 0; j < 4; j++) { const s = BO[i] + ((BO[i + 1] - BO[i]) * j) / 4; if (s >= G0 - 0.001) S16.push(s); }
    const GAPD = OM.beatOnset(120.767), Q8 = 30 / ((OM.T && OM.T.bpm) || 112.3); // the gap: its downbeat's drum hit, an 8th
    const CL0 = 123.0, CL1 = END - 0.08;
    const KEY = N - 1; // the last word: the workspace swipes home
    const at = (k, fb) => (on[k] !== undefined ? on[k] : fb);

    // ---------- the switches: [time, theme, word that opens it or -1] ----------
    const SW = [
      [at(0, 119.114), 'kanagawa', 0],
      [at(1, 119.694), 'nord', 1],
      [at(2, 120.375), 'gruvbox', 2],
      [GAPD, 'everforest', -1], // the gap: true downbeat, then 8th and 16th
      [GAPD + Q8, 'rose-pine', -1],
      [GAPD + 1.5 * Q8, 'catppuccin', -1],
      [at(3, 121.316), 'retro-82', 3],
      [at(4, 121.536), 'osaka-jade', 4],
      [at(5, 121.796), 'hackerman', 5],
    ];
    const KT = at(KEY, 122.597), KS0 = KT - 0.32; // the held note stays on its theme; the swipe home lands on the key word
    SW.push([KS0, 'tokyo-night', -2]);
    const ST = SW.map((s) => s[0]);
    const SWT = [...ST.slice(0, -1), KT];

    // ---------- per-theme tokens ----------
    const tok = (id, ea) => {
      const t = OM.theme(id);
      return { bg: t.bg, border: t['border-strong'], brand: t.brand, text: t.text, muted: t['text-muted'], crest: t['field-crest'], hover: t['field-hover'], ea, light: !!t.light, id };
    };
    const BARE = tok('tokyo-night', 1); // the still desk: opaque empty faces
    const TOK = SW.map((s) => tok(s[1], 0.12));
    const mixTok = (a, b, p) => {
      if (p <= 0) return a;
      if (p >= 1) return b;
      const o = { ea: OM.lerp(a.ea, b.ea, p), light: p > 0.5 ? b.light : a.light, id: b.id };
      for (const k of ['bg', 'border', 'brand', 'text', 'muted', 'crest', 'hover']) o[k] = OM.mix(a[k], b[k], p);
      return o;
    };
    const lastIdx = (T) => {
      let i = -1;
      while (i + 1 < ST.length && ST[i + 1] <= T) i++;
      return i;
    };
    const tokAt = (i) => (i < 0 ? BARE : TOK[i]);
    // Cascade: per switch a step per unit of distance from the window that opened it (or from the bar).
    const STEP = ST.map((s, i) => (i + 1 < ST.length ? OM.clamp((ST[i + 1] - s) * 0.07, 0.008, 0.03) : 0));
    const SLIDE = ST.map((s, i) => (i + 1 < ST.length ? OM.clamp((ST[i + 1] - s) * 0.6, 0.075, 0.22) : 0));
    const FADE = 0.05;
    const cen = (r) => [r.x + r.w / 2, r.y + r.h / 2];
    const DIST = SW.map(([, , w]) => {
      const o = w >= 0 && TO[w] ? cen(TO[w]) : [960, -200];
      return TO.map((r) => { const [x, y] = cen(r); return Math.hypot(x - o[0], y - o[1]) / 470; });
    });
    /** Window k's chrome at T: the latest switch whose cascade has reached it, faded in. */
    const chrome = (k, T) => {
      for (let i = ST.length - 1; i >= 0; i--) {
        const a = ST[i] + STEP[i] * DIST[i][k];
        if (T < a) continue;
        return i === ST.length - 1 ? TOK[i] : mixTok(tokAt(i - 1), TOK[i], (T - a) / FADE);
      }
      return BARE;
    };

    // ---------- wallpapers: lattice paintings, one cell per 6 px, cached per theme ----------
    const CW = 320, CH = 180, A = CW / CH;
    const vn = (x, y, s) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx_ = x - xi, fy = y - yi;
      const u = fx_ * fx_ * (3 - 2 * fx_), v = fy * fy * (3 - 2 * fy), h = (a, b) => OM.hash(a, b, s);
      return OM.lerp(OM.lerp(h(xi, yi), h(xi + 1, yi), u), OM.lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
    };
    const fbm = (x, y, s, o = 4) => {
      let a = 0.5, t = 0, n = 0;
      for (let i = 0; i < o; i++) { t += a * vn(x, y, s + i * 17); n += a; x *= 2; y *= 2; a *= 0.5; }
      return t / n;
    };
    const ridge = (x, f, s) => 1 - Math.abs(2 * fbm(x * f, 0.5, s, 4) - 1);
    const dz = (b, t, i0, i1) => (t > b ? i1 : i0); // ordered dither between two inks
    const grad = (b, f, lo, hi) => OM.clamp(Math.floor(f + b), lo, hi); // dithered ramp
    const cell = (x, y) => [Math.floor(x * CH), Math.floor(y * CH)];
    const blossoms = (() => {
      const r = OM.rng(4207), out = [];
      for (let i = 0; i < 16; i++) out.push({ x: r() * A, y: r() * 1.05 - 0.02, r: 0.05 + r() * 0.08, rot: r() * 6.28, col: [5, 7, 10][i % 3], la: r() * 6.28 });
      return out;
    })();
    const beans = (() => {
      const r = OM.rng(5303), out = [];
      while (out.length < 9) { const x = r() * A, y = r(); if (Math.hypot(x - 0.889, y - 0.5) > 0.52) out.push({ x, y, a: r() * 3.14 }); }
      return out;
    })();
    const WALL = {
      kanagawa: [['#16161d', '#1f1f28', '#223249', '#2d4f67', '#7e9cd8', '#c8c093', '#dcd7ba', '#f2ecbc'], (x, y, b) => {
        let c = grad(b, 5 + y * 1.4, 5, 6);
        const fd = Math.abs(x - 1.3);
        if (y > 0.47 + fd * 0.85 && y < 0.7) c = y < 0.53 + 0.012 * Math.sin(x * 90) ? 7 : 2;
        if (y > 0.7) { c = grad(b, 3.2 - (y - 0.7) * 3.5, 1, 3); if (Math.sin(x * 26 + Math.sin(y * 30) * 2 + y * 70) > 0.78) c = 4; }
        if (Math.hypot((x - 1.02) / 1.5, y - 0.73) < 0.075 && y < 0.73) c = Math.sin(x * 120) > 0.6 ? 6 : 3;
        const cx = 0.62, cy = 0.39, R = 0.31, dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
        const ring = d < R && d > R * 0.58 && th < -0.22, wall = dx < 0.03 && dy >= 0 && d < R;
        if (ring || wall) {
          c = Math.sin(d * 105 + th * 4) > 0.35 ? 3 : 2;
          if (d > R * 0.88 && th < -0.22) c = 4;
          if (ring && d < R * 0.64) c = 6;
        }
        if (d >= R && d < R + 0.055 * (0.5 + 0.5 * Math.sin(th * 13)) && th > -2.6 && th < -0.22 && Math.sin(th * 55) > 0.1) c = 7;
        const [ci, cj] = cell(x, y);
        if (d > R + 0.02 && d < R + 0.12 && th > -2.4 && th < -0.3 && OM.hash(ci, cj, 5) > 0.86) c = 7;
        if (th > -0.22 && th < 0.25 && d > R * 0.62 && d < R && Math.sin(d * 150) > 0.2 && OM.hash(ci, 0, 6) > 0.4 && dy < 0.04 + 0.08 * OM.hash(ci, 1, 6)) c = 7;
        return c;
      }],
      nord: [['#2e3440', '#3b4252', '#434c5e', '#4c566a', '#5e81ac', '#81a1c1', '#88c0d0', '#d8dee9', '#eceff4'], (x, y, b) => {
        let c = grad(b, 4.6 + y * 2.6, 4, 7);
        for (const [base, amp, f, s, col, snow] of [[0.62, 0.44, 1.5, 11, 5, 8], [0.78, 0.32, 2.3, 23, 3, 7], [0.93, 0.2, 3.4, 37, 1, 7]]) {
          const top = base - amp * ridge(x, f, s);
          if (y <= top) continue;
          c = col;
          if (ridge(x + 0.012, f, s) < ridge(x, f, s) && c > 0) c -= 1;
          if (y - top < amp * (0.16 + 0.12 * vn(x * 30, y * 30, s))) c = snow;
        }
        if (y > 0.975) c = 0;
        return c;
      }],
      gruvbox: [['#1d2021', '#282828', '#3c3836', '#504945', '#665c54', '#cc241d', '#d65d0e', '#d79921', '#fabd2f', '#98971a', '#689d6a', '#458588', '#ebdbb2'], (x, y, b) => {
        const bands = [2, 3, 5, 6, 6, 7, 7, 8];
        let c = bands[OM.clamp(Math.floor((y / 0.6) * 8 + (b - 0.5) * 0.7), 0, 7)];
        if (Math.hypot(x - 1.25, y - 0.56) < 0.17) c = dz(b, (y - 0.42) / 0.14, 12, 8);
        if (y > 0.6 + 0.035 * Math.sin(x * 4.1 + 0.3) + 0.02 * Math.sin(x * 9.7)) c = 4;
        if (y > 0.7 + 0.05 * Math.sin(x * 2.6 + 1.7) + 0.02 * Math.sin(x * 7.3)) c = 9;
        if (y > 0.82 + 0.04 * Math.sin(x * 3.3 + 4) + 0.015 * Math.sin(x * 11)) c = 10;
        if (y > 0.92 + 0.02 * Math.sin(x * 5)) c = dz(b, 0.4, 3, 1);
        return c;
      }],
      everforest: [['#1e2326', '#232a2e', '#2d353b', '#343f44', '#3d484d', '#475258', '#56635f', '#7a8478', '#83c092', '#a7c080', '#d3c6aa'], (x, y, b) => {
        let c = grad(b, 6.6 + y * 4.2, 6, 10);
        for (const [base, H, sp, s, col] of [[0.6, 0.16, 0.05, 3, 8], [0.7, 0.22, 0.07, 5, 6], [0.83, 0.3, 0.1, 7, 3], [1.02, 0.46, 0.15, 9, 1]]) {
          if (y > base) { c = col; continue; }
          const u = x / sp + OM.hash(s, 0, 9) * 7, k = Math.floor(u), fr = u - k;
          const h = H * (0.55 + 0.45 * OM.hash(k, s, 9)), top = base - h;
          if (y <= top) continue;
          const q = (y - top) / h, tier = (q * 4) % 1;
          if (Math.abs(fr - 0.5) < 0.46 * q * (0.6 + 0.4 * tier)) c = col;
        }
        return c;
      }],
      'rose-pine': [['#faf4ed', '#fffaf3', '#f2e9e1', '#dfdad9', '#cecacd', '#d7827e', '#ea9d34', '#907aa9', '#56949f', '#286983', '#b4637a'], (x, y, b) => {
        let c = dz(b, 0.25 + 0.35 * vn(x * 3, y * 3, 4), 0, 2);
        for (const f of blossoms) {
          const dx = x - f.x, dy = y - f.y, d = Math.hypot(dx, dy);
          if (d > f.r * 2.2) continue;
          for (let j = 0; j < 2; j++) {
            const a = f.la + j * 2.4, lx = dx - Math.cos(a) * f.r * 1.25, ly = dy - Math.sin(a) * f.r * 1.25;
            const u = lx * Math.cos(a) + ly * Math.sin(a), v = -lx * Math.sin(a) + ly * Math.cos(a);
            if ((u / (f.r * 0.6)) ** 2 + (v / (f.r * 0.24)) ** 2 < 1) c = v > 0 ? 8 : 9;
          }
          const th = Math.atan2(dy, dx), pr = f.r * (0.45 + 0.55 * Math.abs(Math.cos(2.5 * th + f.rot)));
          if (d < pr) c = d < f.r * 0.2 ? 6 : d > pr * 0.82 ? 4 : f.col;
        }
        return c;
      }],
      catppuccin: [['#11111b', '#181825', '#1e1e2e', '#313244', '#45475a', '#89b4fa', '#b4befe', '#cba6f7', '#f5c2e7', '#fab387', '#f9e2af', '#a6e3a1'], (x, y, b) => {
        let c = dz(b, y * 0.7, 1, 2);
        const v = y - 0.42 * (x / A) + 0.06 * Math.sin(x * 4.2) + 0.03 * Math.sin(x * 9 + 1.3);
        const k = (v - 0.18) * 8, i = Math.floor(k), fr = k - i;
        if (i >= 0 && i < 7 && fr < 0.6) c = [5, 6, 7, 8, 9, 10, 11][i];
        else if (i >= 0 && i < 7 && fr < 0.72) c = dz(b, (0.72 - fr) / 0.12, c, [5, 6, 7, 8, 9, 10, 11][i]);
        const [ci, cj] = cell(x, y);
        if (k < 0 && OM.hash(ci, cj, 12) > 0.985) c = 6;
        return c;
      }],
      'retro-82': [['#05182e', '#0b2342', '#2a2550', '#6b3a72', '#e95678', '#faa968', '#fcc395', '#f6dcac', '#2a6b78', '#3fc1c9'], (x, y, b) => {
        const H = 0.6;
        if (y < H) {
          let c = grad(b, (y / H) * 3.3, 0, 3);
          if (Math.hypot(x - 0.889, y - 0.4) < 0.25) {
            const k = (y - 0.38) / 0.034;
            if (!(y > 0.38 && k % 1 < 0.12 + 0.75 * (y - 0.38) / 0.22)) c = grad(b, 7.4 - ((y - 0.15) / 0.45) * 3.5, 4, 7);
          }
          const m = H - 0.075 * ridge(x, 2.2, 9);
          if (y > m) c = y < m + 0.007 ? 4 : 1;
          return c;
        }
        const dd = y - H + 0.004, z = 0.6 / dd, X = ((x - 0.889) / dd) * 0.25;
        let c = 0;
        if (z % 1 < Math.min(0.5, (0.6 / (dd * dd)) * 0.009)) c = dd < 0.03 ? dz(b, dd / 0.03, 0, 4) : 4;
        if (Math.abs(((X % 1) + 1.5) % 1 - 0.5) < Math.min(0.3, 0.0028 / dd)) c = dd < 0.03 ? dz(b, dd / 0.03, c, 9) : 9;
        return c;
      }],
      'osaka-jade': [['#0a1210', '#111c18', '#1a2a22', '#23372b', '#2f4a3c', '#509475', '#84b49e', '#c1a78e', '#f7e8b2'], (x, y, b) => {
        let c = grad(b, 2.6 + y * 3, 2, 5);
        if (Math.hypot(x - 1.45, y - 0.2) < 0.055) c = 8;
        const cx = 0.889;
        for (let t = 0; t < 4; t++) {
          const y1 = 0.8 - t * 0.085, y0 = y1 - 0.085, w = 0.17 - t * 0.035, dx = Math.abs(x - cx);
          if (y > y0 && y <= y1) {
            const roof = y < y0 + 0.03, rw = roof ? w + 0.035 - (y - y0) * 0.2 + 0.02 * ((y0 + 0.03 - y) / 0.03) ** 2 : w;
            if (dx < rw) c = roof ? 5 : (Math.floor(x * CH) % 4 === 1 && Math.floor(y * CH) % 4 === 2 ? 1 : 7);
          }
        }
        if (Math.abs(x - cx) < 0.012 && y > 0.43 && y < 0.462) c = 8;
        const bw = 0.055, k = Math.floor(x / bw), near = Math.abs(x - cx) < 0.3;
        const top = 0.86 - (near ? 0.05 + 0.06 * OM.hash(k, 3, 21) : 0.1 + 0.3 * OM.hash(k, 3, 21));
        if (y > top && y < 0.9 && (x / bw) % 1 > 0.08) {
          const [ci, cj] = cell(x, y);
          c = k % 2 ? 1 : 2;
          if (ci % 3 === 1 && cj % 3 === 1 && OM.hash(ci, cj, 22) > 0.55) c = OM.hash(ci, cj, 23) > 0.4 ? 8 : 6;
        }
        if (y >= 0.9) { c = 0; const [ci, cj] = cell(x, y); if (OM.hash(ci, cj, 24) > 0.93) c = 4; }
        return c;
      }],
      hackerman: [['#06060c', '#0b0c16', '#10121f', '#1b2a24', '#2b5037', '#539e65', '#82fb9c', '#d0fdd9'], (x, y, b) => {
        const [ci, cj] = cell(x, y);
        let c = dz(b, 0.3, 1, 2);
        if (OM.hash(ci, 0, 31) < 0.38) return c;
        const len = 10 + OM.hash(ci, 1, 31) * 38, gap = 12 + OM.hash(ci, 2, 31) * 40, off = OM.hash(ci, 3, 31) * 200;
        const ph = (cj + off) % (len + gap);
        if (ph < len && OM.hash(ci, cj, 32) > 0.22) {
          const q = ph / len;
          c = q > 0.96 ? 7 : 3 + Math.min(3, Math.floor(q * 4 + b * 0.5));
        }
        return c;
      }],
      'catppuccin-latte': [['#dce0e8', '#e6e9ef', '#eff1f5', '#ccd0da', '#bcc0cc', '#7287fd', '#1e66f5', '#8839ef', '#ea76cb', '#fe640b', '#df8e1d', '#40a02b', '#dd7878'], (x, y, b) => {
        let c = dz(b, y * 1.1, 2, 1);
        const sd = Math.hypot(x - 1.3, y - 0.3);
        if (sd < 0.09) c = 10; else if (sd < 0.13) c = dz(b, (0.13 - sd) / 0.06, c, 10);
        [[0.55, 5, 0.45], [0.66, 8, 0.65], [0.78, 12, 0.85], [0.9, 11, 1]].forEach(([base, col, d], j) => {
          if (y > base + 0.05 * Math.sin(x * (2 + j) + j * 1.7) + 0.025 * Math.sin(x * (5 + 2 * j) + j)) c = dz(b, d, 2, col);
        });
        return c;
      }],
      ristretto: [['#1a1414', '#2c2525', '#3a302f', '#4a3b37', '#5b4a45', '#7a5a4a', '#a0715d', '#c99a73', '#f38d70', '#f9cc6c', '#e6d9db', '#fdf4ef'], (x, y, b) => {
        let c = OM.clamp(1 + Math.floor(vn(x * 2, y * 40, 8) * 2.99 + (b - 0.5) * 0.5), 1, 3);
        if ((y * 5) % 1 < 0.035) c = 0;
        for (const e of beans) {
          const dx = x - e.x, dy = y - e.y, u = dx * Math.cos(e.a) + dy * Math.sin(e.a), v = -dx * Math.sin(e.a) + dy * Math.cos(e.a);
          if ((u / 0.034) ** 2 + (v / 0.022) ** 2 < 1) c = Math.abs(v) < 0.004 ? 1 : 5;
        }
        const d = Math.hypot(x - 0.889, y - 0.5);
        if (d < 0.47 && d >= 0.44) c = 0;
        if (Math.abs(Math.hypot(x - 1.31, y - 0.5) - 0.07) < 0.018) c = 11;
        if (d < 0.44) c = d > 0.37 ? 10 : d > 0.3 ? (d > 0.355 ? 11 : 10) : grad(b, 7.4 - (d / 0.3) * 3, 3, 7);
        const X = (x - 0.889) / 0.13, Y = -(y - 0.5) / 0.13 + 0.15;
        if (d < 0.3 && (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 < 0) c = Math.sin(d * 90) > 0.65 ? 7 : 10;
        return c;
      }],
      'matte-black': [['#090909', '#0e0e0e', '#121212', '#181818', '#1f1f1f', '#2a2a2a', '#e68e0d'], (x, y, b) => {
        let f = 3.2 - Math.hypot(x - 0.45, y - 0.25) * 1.9;
        if (Math.abs(x - y * 0.8 - 0.95) < 0.13) f += 0.9;
        let c = grad(b, f, 0, 5);
        if (Math.abs(y - 0.86) < 0.004 && x > 0.12 && x < 0.52) c = 6;
        if (Math.abs(x - 1.62) < 0.012 && Math.abs(y - 0.86) < 0.012) c = 6;
        return c;
      }],
      'tokyo-night': [['#0f0f17', '#16161e', '#1a1b26', '#24283b', '#2f3549', '#414868', '#565f89', '#7aa2f7', '#bb9af7', '#7dcfff', '#f7768e', '#e0af68', '#9ece6a', '#c0caf5'], (x, y, b) => {
        let c = grad(b, 1 + y * 4.2, 1, 4);
        if (y > 0.5) c = dz(b, ((y - 0.5) / 0.3) * 0.55, c, 5);
        if (Math.hypot(x - 0.34, y - 0.2) < 0.06 && Math.hypot(x - 0.37, y - 0.18) > 0.05) c = 13;
        const [ci, cj] = cell(x, y);
        if (y < 0.5 && OM.hash(ci, cj, 41) > 0.992) c = 6;
        for (const [bw, lo, hi, s, f0, f1] of [[0.05, 0.12, 0.3, 43, 4, 4], [0.075, 0.1, 0.42, 47, 2, 3]]) {
          const k = Math.floor(x / bw + OM.hash(s, 1, 1)), h = lo + (hi - lo) * OM.hash(k, s, 44), top = 0.88 - h;
          if (y <= top || (x / bw + OM.hash(s, 1, 1)) % 1 < 0.06) continue;
          c = k % 2 ? f0 : f1;
          if (y < top + 0.008 && s === 47) c = [7, 8, 10, 9][k % 4];
          if (ci % 3 === 1 && cj % 3 === 1 && OM.hash(ci, cj, s) > (s === 47 ? 0.62 : 0.8)) c = [11, 9, 7, 12][Math.floor(OM.hash(ci, cj, s + 1) * 4)];
        }
        if (y >= 0.88) { c = 1; if (Math.sin(x * 64) > 0.94 && OM.hash(ci, cj, 45) > 0.4) c = [7, 8, 10][Math.floor(x * 3.1) % 3]; }
        return c;
      }],
    };
    const walls = new Map();
    const wall = (id) => {
      if (walls.has(id)) return walls.get(id);
      const [pal, fn] = WALL[id];
      const rgb = pal.map(OM.rgb);
      const w = document.createElement('canvas');
      w.width = CW; w.height = CH;
      const g = w.getContext('2d'), img = g.createImageData(CW, CH), d = img.data;
      for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
        const b = (OM.BAYER[(j % 8) * 8 + (i % 8)] + 0.5) / 64;
        const col = rgb[OM.clamp(fn((i + 0.5) / CH, (j + 0.5) / CH, b) | 0, 0, pal.length - 1)], o = (j * CW + i) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      walls.set(id, w);
      return w;
    };
    SW.forEach((s) => wall(s[1]));
    // The lattice gaps between cells: a pattern in device pixels.
    let gapPat = null, gapDpr = 0;
    const gaps = (ctx, dpr) => {
      if (gapPat && gapDpr === dpr) return gapPat;
      const n = Math.round(6 * dpr), p = document.createElement('canvas');
      p.width = p.height = n;
      const g = p.getContext('2d');
      g.fillStyle = 'rgba(0,0,0,0.3)';
      const lw = Math.max(1, Math.round(dpr));
      g.fillRect(n - lw, 0, lw, n);
      g.fillRect(0, n - lw, n, lw);
      gapPat = ctx.createPattern(p, 'repeat');
      gapPat.setTransform(new DOMMatrix().scale(1 / dpr));
      gapDpr = dpr;
      return gapPat;
    };
    const drawWall = (ctx, dpr, i, x) => {
      if (x <= -1920 || x >= 1920) return;
      if (i < 0) { ctx.fillStyle = ink.bg; ctx.fillRect(x, 0, 1920, 1080); return; }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(wall(SW[i][1]), x, 0, 1920, 1080);
      ctx.fillStyle = gaps(ctx, dpr);
      ctx.fillRect(x, 0, 1920, 1080);
    };

    let fits = null;
    const fit = () => TO.map((r, k) => V.fitWord((sung[k] && sung[k].text) || '', r.x + r.w / 2, r.y + r.h / 2 + 10, r.w - 56, 112));
    const BAR = 26, BARFONT = "600 14px 'JetBrains Mono'";

    return {
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T < start + V.HOLD_IN) return fx.apply(T), V.still(ctx, 6);
        if (T >= END - V.HOLD_OUT) return fx.apply(T), V.still(ctx, N);
        if (!fits || !V.met().ok) fits = fit();
        const clear = OM.ease.inOutSine(OM.prog(T, CL0, CL1)); // the exit: content dims and slides out
        const e = OM.ease.inOutCubic(OM.prog(T, start + V.HOLD_IN, at(0, start) + 0.5)); // re-tile 6 -> 7
        const iNow = lastIdx(T), iK = ST.length - 1;
        const kick = OM.pulse(KICKS, T, 0.07);
        const keyHit = T >= KT ? Math.exp(-(T - KT) / 0.22) : 0;
        const latest = OM.hitCount(on, T) - 1;
        const sp = T >= KS0 && T < KT ? OM.smooth(OM.smooth(OM.prog(T, KS0, KT))) : null; // eased both ends, settles on the onset

        const page = (ox, force) => {
          ctx.save();
          ctx.translate(ox, 0);
          // Wallpaper: paged in from the right on each switch.
          const wi = force !== null ? force : iNow;
          const p = force !== null || wi < 0 || wi === iK ? 1 : OM.ease.outCubic(OM.prog(T, ST[wi], ST[wi] + SLIDE[wi]));
          if (p < 1) { drawWall(ctx, dpr, wi - 1, -1920 * p); drawWall(ctx, dpr, wi, 1920 * (1 - p)); } else drawWall(ctx, dpr, wi, 0);
          const wt = tokAt(wi);
          // Sprinkle, the hats: lattice cells of the wallpaper itself blink on every true 16th.
          if (wi >= 0) {
            let n = -1;
            while (n + 1 < S16.length && S16[n + 1] <= T) n++;
            for (let m = n; m >= n - 1 && m >= 0; m--) {
              const age = T - S16[m], a = Math.exp(-age / 0.06) * (1 - clear);
              if (a < 0.03) continue;
              ctx.globalAlpha = a;
              ctx.fillStyle = wt.crest;
              for (let j = 0; j < 22; j++) ctx.fillRect(Math.floor(OM.hash(m, j, 77) * CW) * 6, Math.floor(OM.hash(m, j, 78) * CH) * 6, 5, 5);
            }
            ctx.globalAlpha = 1;
          }
          if (keyHit > 0.01 && force === null) { ctx.globalAlpha = 0.07 * keyHit; ctx.fillStyle = wt.crest; ctx.fillRect(0, 0, 1920, 1080); ctx.globalAlpha = 1; }
          if (clear > 0) { ctx.globalAlpha = clear; ctx.fillStyle = ink.bg; ctx.fillRect(0, 0, 1920, 1080); ctx.globalAlpha = 1; }
          // The windows: glass until their word opens them.
          TO.forEach((r1, k) => {
            const r = k < FROM.length ? V.lerpRect(FROM[k], r1, e) : r1;
            const popA = k < FROM.length ? 1 : OM.clamp(e * 3);
            if (popA <= 0) return;
            const th = force !== null ? tokAt(force) : chrome(k, T);
            const age = T - at(k, 1e9), opened = age >= 0;
            const op = opened ? OM.clamp(age / 0.06) : 0;
            const faceA = OM.lerp(OM.lerp(th.ea, 0.86, op), 1, clear);
            const pop = opened ? 0.94 + 0.06 * OM.ease.outBack(OM.clamp(age / 0.18)) : 1;
            const s = (k < FROM.length ? 1 : 0.87 + 0.13 * e) * pop * (1 + (opened ? 0.012 * kick : 0));
            let border = k === latest ? th.brand : th.border;
            if (T >= SNARE) border = OM.mix(border, th.brand, Math.exp(-Math.max(0, T - SNARE - 0.03 * k) / 0.12) * (T - SNARE >= 0.03 * k ? 1 : 0));
            border = OM.mix(border, BARE.border, clear);
            ctx.save();
            ctx.globalAlpha = popA;
            ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
            if (s !== 1) ctx.scale(s, s);
            const w = r.w, h = r.h, x0 = -w / 2, y0 = -h / 2;
            ctx.fillStyle = V.rgba(th.bg, faceA);
            ctx.fillRect(x0 + 2, y0 + 2, w - 4, h - 4);
            ctx.fillStyle = border;
            ctx.fillRect(x0, y0, w, 2); ctx.fillRect(x0, y0 + h - 2, w, 2); ctx.fillRect(x0, y0 + 2, 2, h - 4); ctx.fillRect(x0 + w - 2, y0 + 2, 2, h - 4);
            ctx.fillStyle = th.muted;
            ctx.fillRect(x0 + 22, y0 + 24, 10, 10);
            ctx.fillStyle = th.brand;
            ctx.fillRect(x0 + 40, y0 + 24, 6, 10);
            if (opened && sung[k] && fits) {
              // The landing pop: the key word's the biggest; a word hard against the frame's left edge pops
              // about its own left edge, so neither ever reaches into the border band.
              const big = k === KEY ? 0.22 : 0.18;
              const col = OM.mix(th.crest, th.text, OM.clamp(age / 0.35));
              const ps = 1 + big * Math.exp(-age / 0.09), a0 = fits[k].at[0], ax = a0.x < 100 ? a0.x - (r1.x + r1.w / 2) : 0;
              V.drawWord(ctx, sung[k].text, ax * (1 - ps), 10 + 70 * clear * clear, fits[k], OM.mix(col, th.bg, clear), { s: ps, alpha: 1 - clear });
            }
            ctx.restore();
          });
          ctx.restore();
        };

        if (sp !== null) { page(-1920 * sp, iK - 1); page(1920 * (1 - sp), iK); } else page(0, null);

        // Rings off the windows: the gap snare rings the glass ones; the key word rings them all.
        TO.forEach((r, k) => {
          const ga = T - GAP_SNARE;
          if (ga >= 0 && ga < 0.3 && T < at(k, 1e9)) V.ring(ctx, r, 4 + 18 * OM.ease.outCubic(ga / 0.3), 2, chrome(k, T).hover, 0.8 * (1 - ga / 0.3));
          const ka = T - KT;
          if (ka >= 0 && ka < 0.3) V.ring(ctx, r, 4 + 14 * OM.ease.outCubic(ka / 0.3), 3, TOK[iK].crest, (1 - ka / 0.3) * (1 - clear));
        });

        // The bar: drops in with the first switch, snaps to each theme, leaves with the clear.
        const bt = tokAt(iNow), by = -BAR - 2 + (BAR + 2) * OM.ease.outCubic(OM.prog(T, ST[0], ST[0] + 0.25)) * (1 - clear);
        if (by > -BAR - 1) {
          ctx.save();
          ctx.translate(0, by);
          ctx.fillStyle = V.rgba(bt.bg, 0.94);
          ctx.fillRect(0, 0, 1920, BAR);
          ctx.font = BARFONT;
          ctx.textBaseline = 'middle';
          const ws = sp !== null && sp > 0.5 || T >= KT ? 2 : 1;
          for (let n = 1; n <= 5; n++) {
            ctx.fillStyle = n === ws ? bt.brand : bt.muted;
            ctx.fillText(String(n), 18 + (n - 1) * 24, BAR / 2 + 1);
            if (n === ws) ctx.fillRect(16 + (n - 1) * 24, BAR - 3, 12, 2);
          }
          ctx.textAlign = 'center';
          ctx.fillStyle = bt.text;
          const name = iNow >= 0 ? SW[iNow][1] : '';
          ctx.fillText(name, 960, BAR / 2 + 1);
          ctx.fillStyle = bt.brand;
          ctx.fillRect(960 - ctx.measureText(name).width / 2 - 18, BAR / 2 - 4, 8, 8);
          ctx.textAlign = 'right';
          ctx.fillStyle = bt.text;
          ctx.fillText('21:07', 1902, BAR / 2 + 1);
          ctx.fillStyle = bt.muted;
          for (let n = 0; n < 3; n++) ctx.fillRect(1820 - n * 22, BAR / 2 - 5, 10, 10);
          ctx.restore();
        }

        const ce = V.camEnv(T, start, END), fe = V.env(T, start, END);
        const flick = OM.pulse(SWT, T, 0.08);
        const lead = sp !== null ? -8 * Math.sin(Math.PI * sp) : 0;
        const C = beat.clock(T) - start;
        // The sway is kept small enough, and the zoom just big enough to cover it, that the first word
        // (64 px from the left edge) stays clear of the border band, under the edit camera too.
        fx.apply(T, {
          amount: fe * (0.5 + 0.5 * flick),
          cam: {
            zoom: 1 + ce * (0.0095 + 0.0045 * Math.abs(lead / 8) + 0.008 * keyHit),
            rot: ce * 0.002 * Math.sin(C * 1.7),
            x: ce * (4 * Math.sin(C * 1.2) + lead),
            y: ce * 3 * Math.cos(C * 0.9),
          },
          p0: [OM.clamp(flick + keyHit), tokAt(iNow).light ? 1 : 0, 0, 0],
        });
      },
      release: () => { fx.release(); walls.clear(); c.release(); },
    };
  },
});
