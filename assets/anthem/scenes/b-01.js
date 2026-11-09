// b-01 · The odometer of years. Out of the night a mechanical counter slams in
// on the first word: four year wheels above, and below them a bank of letter
// drums, one per letter of the line, every drum resting on 0. Each word rolls
// its drums through the digits and locks them on its letters exactly on its
// onset, the year wheels carrying a stride with it like the real thing; the
// key word locks on the downbeat with the biggest jolt and the century carry.
// On the snare the drums spin away to blank and the counter folds into the one
// lit cell at the centre: the spark the next scene boots from.
//
// Also defines OM.bridge, the section's shared type helpers (used by b-02..b-08).

// Edit camera: the counter's own slam (now sharp on the first word, which lands on the
// 193.340 downbeat) and the key word's own housing jolt (36 ms after the 194.930 beat) are
// the scene's designed hits, so the camera beats under them are skipped rather than stacked.
OM.edit.plan('b-01', { skip: [193.34, 194.93] });

OM.ownWords.add('b-01');
(() => {
  const B = (OM.bridge = OM.bridge || {});
  B.font = (w, px) => `${w} ${px.toFixed(2)}px 'JetBrains Mono'`;
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['bridge-type'] = Promise.all([600, 700, 800].map((w) => document.fonts.load(B.font(w, 100))));
  B.ok = (w) => document.fonts.check(B.font(w, 100));
  const M = document.createElement('canvas').getContext('2d');
  B.metrics = (w) => {
    M.font = B.font(w, 100);
    return { adv: M.measureText('M').width / 100, cap: M.measureText('H').actualBoundingBoxAscent / 100 };
  };
  B.rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  /** A soft round pool of light. */
  B.pool = (ctx, x, y, r, hex, a) => {
    if (a <= 0.002 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, B.rgba(hex, a));
    g.addColorStop(1, B.rgba(hex, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  /** The home lattice at half and third size, sharing its origin. */
  B.sub = (n) => ({ x0: OM.HOME.x0, y0: OM.HOME.y0, cw: OM.HOME.cw / n, ch: OM.HOME.ch / n });
  /** Centre of the home lattice's centre cell (where spark sits). */
  const hc = OM.cellAt(OM.HOME, 960, 540);
  B.SPARK = { col: hc.col, row: hc.row, x: OM.HOME.x0 + (hc.col + 0.5) * OM.HOME.cw, y: OM.HOME.y0 + (hc.row + 0.5) * OM.HOME.ch };
  /** Landing time of a word: its onset, though not inside the in-handoff's first frames. */
  B.land = (t0, start) => Math.max(t0, start + 0.05);
  /** Camera and effect envelope: exactly 0 on the cut frames at both ends, easing in and out with no speed at the cuts. */
  B.env = (T, start, end, ramp = 0.5) => OM.post.envelope(T, start, end, { ramp, hold: 0.12 });
  /** A hand-placed hit time moved onto the nearest measured drum onset of that kind (OM.T.drums) within 50 ms. */
  B.onDrum = (t, kind) => {
    let best = t, d = 0.05;
    for (const [h] of OM.edit.hits(kind, t - 0.05, t + 0.05)) if (Math.abs(h - t) < d) { d = Math.abs(h - t); best = h; }
    return best;
  };
  /** Drifting specks, analytic in T: n of them in a box, wrapping, twinkling. */
  B.motes = (ctx, T, { seed = 1, n = 40, color, alpha = 0.5, x = 0, y = 0, w = 1920, h = 1080, vx = 6, vy = -10, size = 3 }) => {
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = OM.hash(i, 1, seed), b = OM.hash(i, 2, seed), sp = 0.5 + OM.hash(i, 3, seed);
      const px = x + ((((a * w + vx * sp * T) % w) + w) % w), py = y + ((((b * h + vy * sp * T) % h) + h) % h);
      ctx.globalAlpha = alpha * (0.4 + 0.6 * Math.abs(Math.sin(T * (1 + sp) + i)));
      const z = size * (0.6 + 0.8 * OM.hash(i, 4, seed));
      ctx.fillRect(px - z / 2, py - z / 2, z, z);
    }
    ctx.globalAlpha = 1;
  };

  /**
   * Set a line's words in centred rows of monospace type, measured at runtime.
   * Returns { cap, size, adv, lineH, font, rows, words: [{ text, k, row, x, y, w }] },
   * x the word's left edge, y its baseline. Shrinks the cap until the rows fit.
   */
  B.set = (sung, { weight = 800, cap = 70, minCap = 50, maxW = 1700, cx = 960, cy = 540, lead = 1.7, maxRows = 3 } = {}) => {
    const m = B.metrics(weight);
    const texts = sung.map((s) => s.text || '');
    const longest = Math.max(1, ...texts.map((s) => s.length));
    let c = cap, rows, adv;
    for (;;) {
      adv = (m.adv * c) / m.cap;
      const per = Math.max(longest, Math.floor(maxW / adv));
      rows = [];
      let cur = [], len = 0;
      texts.forEach((s, k) => {
        const add = (cur.length ? 1 : 0) + s.length;
        if (cur.length && len + add > per) { rows.push(cur); cur = []; len = 0; }
        len += (cur.length ? 1 : 0) + s.length;
        cur.push(k);
      });
      if (cur.length) rows.push(cur);
      if ((rows.length <= maxRows && longest * adv <= maxW) || c <= minCap) break;
      c -= 2;
    }
    const size = c / m.cap, lineH = c * lead;
    const words = [];
    rows.forEach((ks, r) => {
      const n = ks.reduce((s, k, i) => s + (i ? 1 : 0) + texts[k].length, 0);
      let x = cx - (n * adv) / 2;
      const y = cy - ((rows.length - 1) * lineH) / 2 + r * lineH + c / 2;
      ks.forEach((k, i) => {
        if (i) x += adv;
        words[k] = { text: texts[k], k, row: r, x, y, w: texts[k].length * adv };
        x += texts[k].length * adv;
      });
    });
    return { cap: c, size, adv, lineH, font: B.font(weight, size), rows, words };
  };

  /** A set word rasterized into cells of lattice L: [[col, row, letter]]. */
  B.cells = (word, set, L, { thr = 0.42 } = {}) => {
    if (!word.text) return [];
    const S = Math.max(2, Math.ceil(24 / L.cw));
    const q0 = Math.floor((word.x - L.x0) / L.cw) - 1, q1 = Math.ceil((word.x + word.w - L.x0) / L.cw) + 1;
    const r0 = Math.floor((word.y - set.size * 0.95 - L.y0) / L.ch) - 1, r1 = Math.ceil((word.y + set.size * 0.28 - L.y0) / L.ch) + 1;
    const cols = q1 - q0, rows = r1 - r0;
    const cnv = document.createElement('canvas');
    cnv.width = Math.ceil(cols * L.cw * S);
    cnv.height = Math.ceil(rows * L.ch * S);
    const x = cnv.getContext('2d', { willReadFrequently: true });
    x.scale(S, S);
    x.font = set.font;
    x.fillStyle = '#fff';
    x.fillText(word.text, word.x - (L.x0 + q0 * L.cw), word.y - (L.y0 + r0 * L.ch));
    const px = x.getImageData(0, 0, cnv.width, cnv.height).data;
    const out = [];
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        let sum = 0, cnt = 0;
        const ya = Math.floor(j * L.ch * S), yb = Math.min(cnv.height, Math.floor((j + 1) * L.ch * S));
        const xa = Math.floor(i * L.cw * S), xb = Math.min(cnv.width, Math.floor((i + 1) * L.cw * S));
        for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) { sum += px[(yy * cnv.width + xx) * 4 + 3]; cnt++; }
        if (cnt && sum / cnt > thr * 255) {
          const cxp = L.x0 + (q0 + i + 0.5) * L.cw;
          out.push([q0 + i, r0 + j, OM.clamp(Math.floor((cxp - word.x) / set.adv), 0, word.text.length - 1)]);
        }
      }
    return out;
  };
  /** A layout built lazily on first render, rebuilt once if the font was not ready yet. */
  B.lazy = (make, weight = 800) => {
    let v = null;
    return () => {
      if (!v || (!v.__ok && B.ok(weight))) { v = make(); v.__ok = B.ok(weight); }
      return v;
    };
  };

  // ---------------- the b-01 -> b-02 cut: the counter's drums become the first screens ----------------
  /** b-01's drum windows (year wheels and letter drums) and the lattice cell each one lands on as a screen. */
  B.bootList = B.lazy(() => {
    const set = B.set(OM.sung('b-01'), { weight: 700, cap: 66, maxW: 1560, cy: 700, lead: 2.15 });
    const L = OM.HOME, dh = set.cap * 1.75;
    const out = [];
    for (let i = 0; i < 4; i++) out.push({ x: 960 - 330 + i * 170, y: 210, w: 150, h: 210 });
    let keyFirst = -1;
    set.words.forEach((w) => {
      for (let j = 0; j < w.text.length; j++) {
        if (w.k === 5 && j === 0) keyFirst = out.length;
        out.push({ x: w.x + j * set.adv + 3, y: w.y - set.cap / 2 - dh / 2, w: set.adv - 6, h: dh });
      }
    });
    const used = new Set();
    out.forEach((d, i) => {
      let col, row;
      if (i === keyFirst || (keyFirst < 0 && i === 0)) { col = B.SPARK.col; row = B.SPARK.row; }
      else {
        // Scattered across the dark, as the first strangers' screens.
        for (let tries = 0; ; tries++) {
          col = L.cMin + 3 + Math.floor(OM.hash(i, tries, 77) * (L.cols - 6));
          row = L.rMin + 3 + Math.floor(OM.hash(i, tries, 78) * (L.rows - 6));
          if (!used.has(col + ',' + row) || tries > 8) break;
        }
      }
      used.add(col + ',' + row);
      Object.assign(d, { col, row, go: 196.74 + 0.12 * OM.hash(i, 3, 79) });
    });
    return out;
  }, 700);
  B.BOOT_LAND = 197.068; // the beat at the cut, less 0.046
  /** A screen as b-02 draws it: frame, then glass inset. */
  B.screen = (ctx, x, y, w, h, frame, glass, inset = 3) => {
    ctx.fillStyle = frame;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = glass;
    ctx.fillRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset);
  };
  B.bootGlass = (col, row) => (OM.hash(col, row, 3) < 0.5 ? OM.fieldInks('tokyo-night').lit : OM.fieldInks('tokyo-night').hover);
  /** Every drum at song time T: flying from its window to its cell, a settled screen once landed. */
  B.drawBoot = (ctx, T, dpr) => {
    const L = OM.HOME, th = OM.theme('tokyo-night');
    const snap = (v) => Math.round(v * dpr) / dpr;
    for (const d of B.bootList()) {
      const u = OM.ease.inOutCubic(OM.prog(T, d.go, B.BOOT_LAND));
      const tx = snap(L.x0 + d.col * L.cw), ty = snap(L.y0 + d.row * L.ch);
      if (u >= 1) { B.screen(ctx, tx, ty, L.cw, L.ch, th.surface, B.bootGlass(d.col, d.row)); continue; }
      const x = OM.lerp(d.x, tx, u), y = OM.lerp(d.y, ty, u), w = OM.lerp(d.w, L.cw, u), h = OM.lerp(d.h, L.ch, u);
      B.screen(ctx, x, y, w, h, th.surface, OM.mix(th.surface, B.bootGlass(d.col, d.row), OM.prog(u, 0.5, 1)), OM.lerp(0, 3, u));
    }
  };
  B.bootCut = (ctx, T, dpr) => {
    ctx.fillStyle = OM.fieldInks('tokyo-night').bg;
    ctx.fillRect(0, 0, 1920, 1080);
    B.drawBoot(ctx, B.BOOT_LAND, dpr);
  };

  // ---------------- the scene ----------------
  OM.scene({
    id: 'b-01',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 base = src(q);
  float d = abs(uv.y - uP0.x);
  float R = 11.0 * smoothstep(0.07, 0.34, d);
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236;
    float k = 0.45 + 0.55 * float(i % 3) / 2.0;
    acc += src(q + vec2(cos(a) / 1920.0, sin(a) / 1080.0) * R * k);
  }
  return mix(base, acc / 12.0, uAmount);
}` });
      const END = start + duration;
      const th = OM.theme('tokyo-night');
      const ink = OM.fieldInks('tokyo-night');
      const sung = OM.sung('b-01');
      const on = sung.map((w) => B.land(w.t0, start));
      const K = 5; // the key word, held across the 195.464 downbeat
      // The pause's two snares, on their measured onsets (196.396, 196.530).
      const SHIVER = [196.37, 196.51].map((t) => B.onDrum(t, 'snare'));
      const SNARE = SHIVER[1], FOLD = 196.82;
      const beat = OM.edit.scene(start, END);
      const YEARS = [1991, 1994, 1997, 1999, 2004, 2018, 2026];
      // A roll runs up to speed and slams into its stop on the onset (an in-out roll settled
      // early, so each word was readable two or three frames before it was sung).
      const roll = (u) => u * u;
      // Year as a continuous value: each word's roll lands its stop on the onset.
      const year = (T) => {
        let v = YEARS[0];
        for (let i = 1; i < on.length && i < YEARS.length; i++) v += (YEARS[i] - YEARS[i - 1]) * roll(OM.prog(T, on[i] - 0.26, on[i]));
        return v;
      };
      const wheels = (v) => {
        const carry = (k) => Math.max(0, (v % Math.pow(10, k)) - (Math.pow(10, k) - 1));
        return [Math.floor(v / 1000) + carry(3), (Math.floor(v / 100) % 10) + carry(2), (Math.floor(v / 10) % 10) + carry(1), v % 10];
      };
      const DIG = '0123456789';
      const lay = B.lazy(() => {
        const set = B.set(sung, { weight: 700, cap: 66, maxW: 1560, cy: 700, lead: 2.15 });
        // One drum per letter: it rolls n digits, then the letter, landing on its word's onset.
        const drums = [];
        set.words.forEach((w) => {
          for (let j = 0; j < w.text.length; j++)
            drums.push({ k: w.k, ch: w.text[j], x: w.x + j * set.adv, y: w.y, n: 5 + Math.floor(OM.hash(w.k, j, 11) * 6) + (w.k === K ? 4 : 0) });
        });
        return { set, drums };
      }, 700);

      /** A drum window: the reel at position p (0 = resting on 0, n = locked on its letter). */
      const drum = (ctx, x, y, w, h, p, n, glyph, color, font, cap) => {
        ctx.fillStyle = th.surface;
        ctx.fillRect(x, y, w, h);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.font = font;
        const base = Math.floor(p), frac = p - base;
        for (let s = -1; s <= 1; s++) {
          const i = base + s;
          if (i < 0) continue;
          const g = glyph(i);
          if (!g) continue;
          ctx.fillStyle = i === n ? color : th['text-muted'];
          ctx.fillText(g, x + w / 2, y + h / 2 + cap / 2 + (s - frac) * h);
        }
        ctx.restore();
        // The bezel: a dark hairline across the middle and a shaded lip top and bottom.
        ctx.fillStyle = B.rgba(ink.bg, 0.55);
        ctx.fillRect(x, y, w, h * 0.16);
        ctx.fillRect(x, y + h * 0.84, w, h * 0.16);
      };

      return {
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < on[0]) return OM.handoff('night', ctx, T, dpr);
          if (T >= B.BOOT_LAND) return B.bootCut(ctx, T, dpr);
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const { set, drums } = lay();

          // The whole counter: slams in on the first word (fully there two frames after its
          // onset, settling from 4% big), folds into the spark at the end.
          const slam = 1 - OM.ease.outCubic(OM.prog(T, on[0], on[0] + 0.24));
          const shut = OM.ease.inOutCubic(OM.prog(T, 196.62, 196.88)); // the housings close like shutters behind the drums
          const flying = T >= 196.74;
          const k = 1 + 0.04 * slam;
          ctx.save();
          ctx.translate(B.SPARK.x, B.SPARK.y);
          ctx.scale(k, k);
          ctx.translate(-B.SPARK.x, -B.SPARK.y);
          ctx.globalAlpha = OM.smooth(OM.prog(T, on[0] - 0.017, on[0] + 0.034));

          // The key word's downbeat shakes the housing.
          const jolt = (tt, a) => (T < tt ? 0 : a * Math.exp(-(T - tt) / 0.07) * Math.sin((T - tt) * 70));
          const shake = jolt(on[K], 10) + on.reduce((s, o, i) => s + (i === K ? 0 : jolt(o, 2.5)), 0);
          ctx.translate(0, shake);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          // Year wheels, carrying like a real counter.
          const YW = 150, YH = 210, YX = 960 - 2 * YW - 30, YY = 210;
          const pos = wheels(year(T));
          // Wheel Shiver: on the pause's snares the year's last two wheels tick half a notch and settle back.
          const shiver = SHIVER.reduce((m, h) => m + (T >= h ? 0.22 * Math.exp(-(T - h) / 0.06) * Math.cos((T - h) * 45) : 0), 0);
          pos[2] += shiver * 0.6;
          pos[3] -= shiver;
          const ycap = 128;
          const yfont = B.font(700, ycap / B.metrics(700).cap);
          ctx.fillStyle = th['surface-2'];
          ctx.fillRect(YX - 24, YY - 24 + (YH + 48) * shut / 2, 4 * YW + 3 * 20 + 48, (YH + 48) * (1 - shut));
          if (!flying) pos.forEach((p, i) => {
            const flash = i >= 2 ? OM.pulse(on, T, 0.1) : 0;
            // The year rolls on to blank with the letters before the drums fly.
            const ys = OM.ease.inCubic(OM.prog(T, SNARE, 196.72)) * 4, rest = Math.floor(p + 0.5);
            drum(ctx, YX + i * (YW + 20), YY, YW, YH, p + ys, -1, (n) => (ys > 0 && n > rest ? '' : DIG[((n % 10) + 10) % 10]), th.text, yfont, ycap);
            if (flash > 0.05) {
              ctx.fillStyle = B.rgba(ink.crest, 0.25 * flash);
              ctx.fillRect(YX + i * (YW + 20), YY, YW, YH);
            }
          });
          ctx.fillStyle = ink.lit;
          ctx.fillRect(YX - 24 + (4 * YW + 108) * shut / 2, YY + YH + 24 - 3, (4 * YW + 3 * 20 + 48) * (1 - shut), 3);

          // The letter bank: one housing per row, a drum per letter.
          const dh = set.cap * 1.75, top = (y) => y - set.cap / 2 - dh / 2 - 0;
          ctx.fillStyle = th['surface-2'];
          set.rows.forEach((ks) => {
            const a = set.words[ks[0]], b = set.words[ks[ks.length - 1]];
            ctx.fillRect(a.x - 22, top(a.y) - 14 + (dh + 28) * shut / 2, b.x + b.w - a.x + 44, (dh + 28) * (1 - shut));
          });
          const spin = OM.ease.inCubic(OM.prog(T, SNARE, 196.72)) * 7;
          for (const d of flying ? [] : drums) {
            const o = on[d.k];
            // Rolls through the digits into its letter, locking on the onset with a rebound.
            let p = o <= on[0] + 1e-6 ? (T >= o ? d.n : 0) : d.n * roll(OM.prog(T, o - 0.24, o));
            if (T >= o) p -= 0.16 * Math.exp(-(T - o) / 0.06) * Math.sin((T - o) * 60);
            p += spin;
            const key = d.k === K;
            const lockFlash = T >= o ? Math.exp(-(T - o) / (key ? 0.35 : 0.16)) : 0;
            const col = key ? OM.mix(ink.lit, ink.crest, lockFlash) : OM.mix(th.text, ink.crest, lockFlash);
            drum(ctx, d.x + 3, top(d.y), set.adv - 6, dh, Math.max(0, p), d.n,
              (i) => (i === d.n ? d.ch : i > d.n ? '' : DIG[i % 10]), col, set.font, set.cap);
          }
          // The key word's lock: a crest rule under its drums, and a halo on the downbeat.
          const kw = set.words[K];
          if (kw && kw.text && T >= on[K]) {
            const a = Math.exp(-(T - on[K]) / 0.5);
            B.pool(ctx, kw.x + kw.w / 2, kw.y - set.cap / 2, Math.max(200, kw.w * 0.8) * (1 - shut), ink.lit, 0.22 * a + 0.06);
            ctx.fillStyle = ink.crest;
            ctx.fillRect(kw.x, top(kw.y) + dh + 6, kw.w * OM.ease.outExpo(OM.prog(T, on[K], on[K] + 0.2)) * (1 - shut), 4);
          }
          ctx.restore();
          ctx.globalAlpha = 1;

          // The drums leave the counter and fly out across the dark, landing as the first screens on the beat.
          if (flying) B.drawBoot(ctx, T, dpr);
        },
        render(t, T) {
          this.draw(t, T);
          const e = B.env(T, start, END);
          const ctx = c.ensure();
          ctx.globalAlpha = 1;
          if (e > 0) {
            const { set, drums } = lay();
            // Dust in the counter's light.
            B.motes(ctx, T, { seed: 101, n: 46, color: OM.fieldInks('tokyo-night').mid, alpha: 0.45 * e, vx: 14, vy: -6, size: 3 });
            // Click flashes: a crest tick above each drum as it locks.
            const ik = OM.fieldInks('tokyo-night');
            const dh = set.cap * 1.75;
            for (const d of drums) {
              const a = T - on[d.k];
              if (a < 0 || a > 0.12) continue;
              ctx.globalAlpha = e * (1 - a / 0.12);
              ctx.fillStyle = ik.crest;
              const top = d.y - set.cap / 2 - dh / 2;
              ctx.fillRect(d.x + set.adv / 2 - 2, top - 14 - a * 80, 4, 10);
              ctx.fillRect(d.x + 4, top - 4, set.adv - 8, 2);
            }
          }
          ctx.globalAlpha = 1;
          fx.apply(T, {
            amount: e * (1 - 0.6 * OM.pulse(on, T, 0.15)),
            // The slide runs on the beat clock, so it surges through each beat.
            cam: { zoom: 1 + 0.14 * e, x: e * 110 * (1 - 2 * OM.smooth(OM.prog(beat.clock(T), start, END))) },
            p0: [1 - 700 / 1080, 0, 0, 0],
          });
        },
        release: () => { fx.release(); c.release(); },
      };
    },
  });
})();
