// c3-01 · Aurora. The spark from the drop rises into a night over a dark ridge
// and the northern lights come on: every word is its own curtain, the letters
// its bright lower hem and the rays streaming up the sky out of each letter's
// top. A curtain sweeps open on each onset with a flare of the whole sky; the
// key word is the widest curtain, low over the ridge, on the downbeat. The
// curtains ripple on the snares, then on the last downbeat they fall into the
// horizon and fold flat into one line of light, the orbital ring seen edge on.
//
// Also defines OM.c3, the helpers the rest of chorus 3 shares.
OM.ownWords.add('c3-01');
// Edit camera: the 244.388 downbeat is a bare beat (no drum) 166 ms before the key word, whose own
// explosion punches and shakes the scene camera; the camera's punch there would land first and blur
// that hit, so it is skipped. The rest (the chorus drop at 243.344, the backbeats) fit as they are.
OM.edit.plan('c3-01', { skip: [244.388] });
(() => {
  const C = (OM.c3 = {});
  C.FONT = (w, px) => `${w} ${px}px 'JetBrains Mono'`;
  /** A hit on the drum as measured on the song (OM.T.drums): the nearest of `kind` within 50 ms of t, else t. */
  C.onDrum = (t, kind) => {
    let best = t, d = Infinity;
    for (const [x] of OM.edit.hits(kind, t - 0.05, t + 0.05)) if (Math.abs(x - t) < d) (d = Math.abs(x - t)), (best = x);
    return best;
  };
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['c3-type'] = Promise.all([document.fonts.load(C.FONT(800, 100)), document.fonts.load(C.FONT(700, 100))]);
  C.ready = () => document.fonts.check(C.FONT(800, 100));
  C.ink = OM.fieldInks('tokyo-night');
  C.th = OM.theme('tokyo-night');
  C.rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  /** A soft round pool of light. */
  C.pool = (ctx, x, y, r, hex, a) => {
    if (a <= 0.002) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, C.rgba(hex, Math.min(1, a)));
    g.addColorStop(1, C.rgba(hex, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  C.sm = (T, a, b) => OM.smooth(OM.prog(T, a, b));
  C.decay = (T, t0, half) => (T < t0 ? 0 : Math.pow(0.5, (T - t0) / half));
  /** 0 until t0-lead, accelerating to exactly 1 at t0: a thing that slams in on the onset. */
  C.arrive = (T, t0, lead) => OM.ease.inCubic(OM.prog(T, t0 - lead, t0));
  /** Paint the agreed seam frames: the in-handoff until `hold`, the out-handoff for the last frames. */
  C.seam = (ctx, T, dpr, start, END, inN, outN, hold = start + 0.05) => {
    if (T < hold) return OM.handoff(inN, ctx, T, dpr), true;
    if (T > END - 0.07) return OM.handoff(outN, ctx, T, dpr), true;
    return false;
  };

  // ---- type: words measured and rasterized at runtime into point sets ----
  const m = document.createElement('canvas').getContext('2d');
  C.measure = (text, weight, px) => {
    m.font = C.FONT(weight, px);
    return m.measureText(text).width;
  };
  C.capRatio = (weight) => {
    m.font = C.FONT(weight, 100);
    return (m.measureText('H').actualBoundingBoxAscent || 73) / 100;
  };
  const cache = new Map();
  /** A string's ink sampled on a `step` px grid: { pts: [dx, dy, ...] from (left, baseline), w: advance }. */
  C.dots = (text, weight, px, step) => {
    const key = [text, weight, px.toFixed(2), step, C.ready()].join('|');
    if (cache.has(key)) return cache.get(key);
    const w = C.measure(text, weight, px);
    const ox = Math.ceil(px * 0.2), oy = Math.ceil(px * 1.1);
    const W = Math.ceil(w + 2 * ox), H = Math.ceil(px * 1.5);
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, W);
    cv.height = Math.max(1, H);
    const x = cv.getContext('2d', { willReadFrequently: true });
    x.font = C.FONT(weight, px);
    x.fillStyle = '#fff';
    x.fillText(text, ox, oy);
    const d = x.getImageData(0, 0, cv.width, cv.height).data;
    const out = [];
    for (let y = step / 2; y < H; y += step)
      for (let xx = step / 2; xx < W; xx += step) if (d[((y | 0) * cv.width + (xx | 0)) * 4 + 3] > 110) out.push(xx - ox, y - oy);
    const r = { pts: Float32Array.from(out), w };
    cache.set(key, r);
    return r;
  };
  /**
   * Lay words out in centred rows: rows = [{ ks: [word indices], cap, cy, cx?, maxW? }].
   * A row shrinks to fit maxW but never under a 60px cap (or the row's minCap). Returns place[k] = { x, base, px, w, cap, cx, cy }.
   */
  C.layout = (words, rows, { weight = 800, maxW = 1680 } = {}) => {
    const cr = C.capRatio(weight), place = [];
    for (const row of rows) {
      const ks = row.ks.filter((k) => words[k]);
      const width = (px) => ks.reduce((s, k, n) => s + (n && words[k].space ? C.measure(' ', weight, px) : 0) + C.measure(words[k].text, weight, px), 0);
      let px = row.cap / cr;
      while (width(px) > (row.maxW || maxW) && px * cr > (row.minCap || 60)) px *= 0.97;
      let x = (row.cx ?? 960) - width(px) / 2;
      const base = row.cy + (px * cr) / 2;
      ks.forEach((k, n) => {
        if (n && words[k].space) x += C.measure(' ', weight, px);
        const w = C.measure(words[k].text, weight, px);
        place[k] = { x, base, px, w, cap: px * cr, cx: x + w / 2, cy: row.cy };
        x += w;
      });
    }
    return place;
  };
  /** Each word's absolute ink points [x, y, ...] at its place. */
  C.wordPts = (words, place, weight, step) =>
    words.map((wd, k) => {
      const p = place[k];
      if (!p || !wd.text) return new Float32Array(0);
      const d = C.dots(wd.text, weight, p.px, typeof step === 'function' ? step(p) : step);
      const o = new Float32Array(d.pts.length);
      for (let i = 0; i < o.length; i += 2) {
        o[i] = d.pts[i] + p.x;
        o[i + 1] = d.pts[i + 1] + p.base;
      }
      return o;
    });
  /**
   * The words rasterized onto a grid of `cell` px squares over the frame:
   * { GW, GH, of: Int8Array (word index per cell, -1 none) }.
   */
  C.mask = (words, place, weight, cell, cover = 0.45) => {
    const GW = Math.ceil(1920 / cell), GH = Math.ceil(1080 / cell), S = 3;
    const cv = document.createElement('canvas');
    cv.width = GW * S;
    cv.height = GH * S;
    const x = cv.getContext('2d', { willReadFrequently: true });
    const of = new Int8Array(GW * GH).fill(-1);
    words.forEach((wd, k) => {
      const p = place[k];
      if (!p || !wd.text) return;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, cv.width, cv.height);
      x.setTransform(S / cell, 0, 0, S / cell, 0, 0);
      x.font = C.FONT(weight, p.px);
      x.fillStyle = '#fff';
      x.fillText(wd.text, p.x, p.base);
      const i0 = Math.max(0, Math.floor((p.x - p.px * 0.1) / cell)), i1 = Math.min(GW - 1, Math.ceil((p.x + p.w + p.px * 0.1) / cell));
      const j0 = Math.max(0, Math.floor((p.base - p.px) / cell)), j1 = Math.min(GH - 1, Math.ceil((p.base + p.px * 0.35) / cell));
      const d = x.getImageData(0, 0, cv.width, cv.height).data;
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          let sum = 0;
          for (let b = 0; b < S; b++) for (let a = 0; a < S; a++) sum += d[((j * S + b) * cv.width + i * S + a) * 4 + 3];
          if (sum > cover * S * S * 255) of[j * GW + i] = k;
        }
    });
    return { GW, GH, of };
  };
  /** A cell-resolution frame buffer drawn scaled up with crisp edges. */
  C.buffer = (GW, GH) => {
    const img = new ImageData(GW, GH), buf = new Uint32Array(img.data.buffer);
    const off = document.createElement('canvas');
    off.width = GW;
    off.height = GH;
    const o = off.getContext('2d');
    return {
      buf,
      draw(ctx, x = 0, y = 0, w = 1920, h = 1080) {
        o.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, x, y, w, h);
        ctx.imageSmoothingEnabled = true;
      },
    };
  };
  C.pack = (hex) => {
    const [r, g, b] = OM.rgb(hex);
    return (255 << 24) | (b << 16) | (g << 8) | r;
  };
  /**
   * Wrap a scene in its camera and effect pass. at(T) returns the full-strength
   * { amount, cam, p0, p1 }; it is scaled by the window envelope, so the effect
   * is exactly 0 and the camera exactly at rest (with zero speed) at both cuts.
   */
  C.withFx = (el, c, start, END, effect, at) => (scene) => {
    const fx = OM.post(el, c, { effect });
    const draw = scene.render, rel = scene.release;
    scene.render = (t, T) => {
      draw(t, T);
      const e = OM.post.envelope(T, start, END, { ramp: 0.4, hold: 0.07 });
      if (e <= 0) return fx.apply(T, {});
      const p = at(T) || {}, k = p.cam || {};
      fx.apply(T, {
        amount: (p.amount ?? 0) * e,
        cam: { zoom: 1 + ((k.zoom ?? 1) - 1) * e, rot: (k.rot || 0) * e, x: (k.x || 0) * e, y: (k.y || 0) * e },
        p0: p.p0, p1: p.p1,
      });
    };
    scene.release = () => {
      fx.release();
      rel();
    };
    return scene;
  };
  /** Luminance in GLSL, shared by the chorus 3 effects. */
  C.GLSL_LUM = 'float lum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }\n';
  /** A value built from type, rebuilt once when the font arrives. */
  C.lazy = (build) => {
    let v = null, ok = false;
    return () => {
      if (!v || (!ok && C.ready())) {
        ok = C.ready();
        v = build();
      }
      return v;
    };
  };
  /** Which word is the name: the one spelled like it, else the longest held. */
  C.nameIndex = (words) => {
    let k = words.findIndex((w) => w.text.toLowerCase().replace(/[^a-z]/g, '') === 'omarchy');
    if (k < 0) words.forEach((w, i) => { if (k < 0 || w.t1 - w.t0 > words[k].t1 - words[k].t0) k = i; });
    return k;
  };

  // ---- the night sky: fixed stars on the home lattice, twinkling ----
  const STARS = [];
  {
    const L = OM.HOME;
    for (let row = L.rMin; row < L.rMin + L.rows; row++)
      for (let col = L.cMin; col < L.cMin + L.cols; col++) {
        const h = OM.hash(col, row, 0xc3);
        if (h < 0.022) STARS.push({ x: L.x0 + (col + 0.5) * L.cw, y: L.y0 + (row + 0.5) * L.ch, b: h / 0.022, ph: OM.hash(row, col, 7) * 6.283 });
      }
  }
  C.STARS = STARS;
  C.stars = (ctx, T, a = 1, yMax = 1080) => {
    if (a <= 0.01) return;
    const ink = C.ink;
    ctx.save();
    ctx.globalAlpha = a;
    for (const s of STARS) {
      if (s.y > yMax) continue;
      const tw = 0.5 + 0.5 * Math.sin(T * 2.3 + s.ph);
      const v = s.b * (0.55 + 0.45 * tw);
      ctx.fillStyle = v > 0.8 ? ink.crest : v > 0.5 ? ink.hover : v > 0.25 ? ink.mid : ink.dim;
      const z = v > 0.8 ? 3 : 2;
      ctx.fillRect(Math.round(s.x - z / 2), Math.round(s.y - z / 2), z, z);
    }
    ctx.restore();
  };

  // ======================= c3-01 =======================
  OM.scene({
    id: 'c3-01',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const END = start + duration;
      const ink = C.ink, th = C.th;
      const words = OM.sung('c3-01');
      const on = words.map((w) => w.t0);
      const K = words.length - 1; // the key word: the widest curtain, on the downbeat
      const SNARES = [243.879, 245.296, 245.435, 246.155].map((t) => C.onDrum(t, 'snare'));
      const PAUSE = SNARES.slice(1); // the pause snares: curtain surge and ridge echo
      const FALL = OM.beatOnset(246.596); // last downbeat (on the drum): the curtains fall into the horizon
      const HL = OM.HOME, hc = OM.cellAt(HL, 960, 540);
      const LINE_Y = HL.y0 + (hc.row + 0.5) * HL.ch;
      const RIDGE = (x) => 965 + 38 * Math.sin(x * 0.0041 + 1.3) + 22 * Math.sin(x * 0.011 + 0.4) + 10 * Math.sin(x * 0.031);

      const type = C.lazy(() => {
        const rows = [{ ks: words.map((_, k) => k).filter((k) => k !== K), cap: 86, cy: 320 }, { ks: [K], cap: 200, cy: 640 }];
        const place = C.layout(words, rows);
        const step = (p) => Math.max(6, Math.round(p.cap / 12));
        const pts = C.wordPts(words, place, 800, step);
        // Each curtain's columns: the top of the letters in that column, where its rays start.
        const cols = pts.map((P, k) => {
          const top = new Map();
          for (let i = 0; i < P.length; i += 2) {
            const x = Math.round(P[i]);
            if (!top.has(x) || P[i + 1] < top.get(x)) top.set(x, P[i + 1]);
          }
          return [...top.entries()];
        });
        return { place, pts, cols, steps: place.map((p) => (p ? step(p) : 6)) };
      });

      // Camera: a slow tilt across the sky with a sway. Effect: the curtains shimmer (a wave warp in the
      // sky above the letters only) and glow green; the key word flares it.
      const FX = C.GLSL_LUM + `vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  float top = smoothstep(0.8, 0.97, p.y);
  p.x += uAmount * top * 0.004 * sin(p.y * 46.0 + uTime * 3.2);
  vec3 c = src(p).rgb, g = vec3(0.0);
  for (int i = 0; i < 8; i++) { float a = float(i) * 0.785; g += src(p + vec2(cos(a), sin(a)) * vec2(16.0 / 1920.0, 16.0 / 1080.0)).rgb; }
  g /= 8.0;
  return vec4(c + uAmount * max(g - 0.12, 0.0) * vec3(0.5, 1.0, 0.45) * (0.5 + uP0.x), 1.0);
}`;
      const fxAt = (T) => ({
        amount: 0.8, p0: [0.8 * C.decay(T, on[K], 0.2) + 1.2 * C.decay(T, on[K], 0.07), 0, 0, 0],
        // The key word's explosion punches the camera in and shakes it.
        cam: {
          zoom: 1.06 + 0.06 * C.decay(T, on[K], 0.08), rot: 0.012 * Math.sin((T - start) * 0.8),
          x: 12 * C.decay(T, on[K], 0.07) * Math.sin(T * 97), y: 26 * Math.sin((T - start) * 0.9) + 9 * C.decay(T, on[K], 0.07) * Math.cos(T * 83),
        },
      });
      return OM.c3.withFx(el, c, start, END, FX, fxAt)({
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (C.seam(ctx, T, dpr, start, END, 'spark', 'line', Math.max(start + 0.05, on[0]))) return;
          const { place, pts, cols, steps } = type();
          const fall = OM.ease.inCubic(OM.prog(T, FALL, FALL + 0.36)); // curtains drop into the horizon
          const fold = OM.prog(T, FALL + 0.26, END - 0.08); // and fold into the line

          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const skyIn = C.sm(T, start, start + 0.35) * (1 - fold);
          C.stars(ctx, T, skyIn * 0.9);
          // The spark rises off the centre and opens into the first wash of sky light.
          const sparkA = 1 - C.sm(T, start + 0.03, start + 0.4);
          if (sparkA > 0) {
            C.pool(ctx, 960, 540, 72, ink.lit, 0.4 * sparkA);
            ctx.globalAlpha = sparkA;
            ctx.fillStyle = ink.crest;
            OM.cell(ctx, HL, hc.col, hc.row, dpr);
            ctx.globalAlpha = 1;
          }
          const surge = T > 245.25 ? OM.pulse(PAUSE, T, 0.14) : 0;
          // The sky glows green behind every curtain that has opened, flaring on each onset.
          let flare = 0;
          words.forEach((w, k) => (flare = Math.max(flare, (k === K ? 1 : 0.55) * C.decay(T, on[k], 0.16))));
          const glowY = OM.lerp(560, LINE_Y, fall);
          C.pool(ctx, 960, glowY, 980, ink.lit, (0.06 * C.sm(T, on[0], on[K]) + 0.16 * flare + 0.12 * surge) * (1 - fold) + 0.12 * skyIn * (1 - fall)); // the sky glow flares with the curtain surge

          // Snare ripples: a brightness wave running across every curtain.
          const ripple = (x) => {
            let v = 0;
            for (const s of SNARES) {
              const a = T - s;
              if (a < 0 || a > 0.5) continue;
              const front = -200 + a * 5200, d = Math.abs(x - front);
              if (d < 260) v = Math.max(v, (1 - d / 260) * (1 - a / 0.5));
            }
            return v;
          };

          for (const pass of [0, 1]) words.forEach((wd, k) => {
            const p = place[k];
            if (!p || T < on[k] || fold >= 1) return;
            const age = T - on[k];
            const hit = C.decay(T, on[k], 0.13) * (k === K ? 1.4 : 1);
            const open = k === K ? 1 : 0.35 + 0.65 * OM.ease.outExpo(OM.clamp(age / 0.13)); // the curtain sweeps open left to right (the key word explodes in whole)
            const edge = p.x + open * (p.w + p.px * 0.2);
            const sink = (y) => OM.lerp(y, LINE_Y, fall); // the hem falls onto the horizon line
            const ray = (k === K ? 420 : 290) * (1 - fall);
            const s = steps[k];
            // Rays: green from the letter top, fading through blue into the sky.
            if (pass === 0 && ray > 4) {
              const sg = k === K ? 0 : surge; // the key word's rays cross the row above, so only the others brighten
              const g = ctx.createLinearGradient(0, p.base - p.cap - ray * 1.6, 0, p.base - p.cap * 0.6);
              g.addColorStop(0, C.rgba(th.brand || ink.hover, 0));
              g.addColorStop(0.45, C.rgba(th.brand || ink.hover, 0.12 + 0.12 * hit + 0.3 * sg));
              g.addColorStop(0.85, C.rgba(ink.lit, 0.22 + 0.3 * hit + 0.45 * sg));
              g.addColorStop(1, C.rgba(ink.hover, 0.4 + 0.4 * hit + 0.4 * sg));
              ctx.fillStyle = g;
              for (const [x, top] of cols[k]) {
                if (x > edge) continue;
                const n = OM.heroNoise(x * 0.012 + T * 0.55, k * 13 + T * 0.2);
                const base = ray * (0.35 + 0.85 * n * n + 0.6 * hit + 0.5 * ripple(x));
                // Curtain surge on the pause snares; the key word's surge stops short of the row above so it stays clear.
                let len = base * (1 + 0.7 * surge) * (k === K ? 1 + 1.4 * C.decay(T, on[K], 0.1) : 1); // the explosion throws the rays to full height
                if (k === K && place[0] && surge > 0) len = Math.max(base, Math.min(len, top - place[0].base - 30));
                const y1 = sink(top);
                const rw = Math.max(2, Math.round(s * (0.4 + 0.35 * surge)));
                ctx.fillRect(Math.round(x - rw / 2), Math.round(y1 - len), rw, Math.round(len));
              }
            }
            if (pass === 0) return;
            // The hem: the letters themselves, bright where the curtain folds.
            const P = pts[k], z = s - 1;
            // The key word's cells blast out of a burst point at its centre and land in ~0.15 s.
            const blast = k === K ? OM.ease.outExpo(OM.clamp(age / 0.15)) : 1;
            for (let i = 0; i < P.length; i += 2) {
              const x = OM.lerp(p.cx, P[i], blast);
              if (x > edge) continue;
              const y = sink(OM.lerp(p.cy, P[i + 1], blast));
              const fold2 = 0.5 + 0.5 * Math.sin(x * 0.018 - T * 3.1 + k);
              const v = hit + 0.25 + 0.4 * fold2 + ripple(x) + (x > edge - 40 ? 0.8 : 0) + (k === K ? 0.3 : 0); // the key curtain holds bright
              ctx.fillStyle = v > 1 ? ink.crest : v > 0.45 ? ink.hover : ink.lit;
              ctx.fillRect(Math.round(x - z / 2), Math.round(y - z / 2), z, z);
            }
          });

          // The ridge: a dark horizon the lights hang over, its crest lit green from above.
          const ridgeA = (1 - fold) * C.sm(T, start + 0.03, start + 0.3);
          if (ridgeA > 0.01) {
            ctx.globalAlpha = ridgeA;
            ctx.fillStyle = th['bg-deep'] || '#08080c';
            ctx.beginPath();
            ctx.moveTo(0, 1080);
            for (let x = 0; x <= 1920; x += 16) ctx.lineTo(x, Math.round(RIDGE(x) / 4) * 4);
            ctx.lineTo(1920, 1080);
            ctx.fill();
            ctx.fillStyle = ink.mid;
            for (let x = 0; x < 1920; x += 8) {
              const y = Math.round(RIDGE(x + 4) / 4) * 4;
              // Ridge echo: each pause snare runs a lit band along the ridge crest.
              let echo = 0;
              for (const s of PAUSE) {
                const a = T - s;
                if (a >= 0 && a < 0.4 && Math.abs(x - a * 5000) < 320) echo = Math.max(echo, (1 - a / 0.4) * (1 - Math.abs(x - a * 5000) / 400));
              }
              ctx.fillStyle = echo > 0.5 ? ink.hover : echo > 0.1 ? ink.lit : ink.mid;
              ctx.fillRect(x, y - 2, 7, echo > 0.1 ? 3 : 2);
              // The aurora's light pooling down the ridge face under the band.
              for (let r = 1; echo > 0.1 && r < 9; r++) {
                if (OM.hash(x, r, 11) > echo * (1 - r / 10)) continue;
                ctx.fillStyle = r < 3 ? ink.lit : ink.mid;
                ctx.fillRect(x, y + r * 8, 7, 7);
              }
            }
            ctx.globalAlpha = 1;
          }

          // A shooting star over the curtains.
          const ss = OM.prog(T, 245.7, 246.15);
          if (ss > 0 && ss < 1) {
            const x = OM.lerp(1560, 1080, ss), y = OM.lerp(70, 205, ss);
            for (let i = 0; i < 16; i++) {
              const b = i / 16;
              ctx.fillStyle = C.rgba(ink.crest, (1 - b) * (1 - ss * 0.6));
              ctx.fillRect(Math.round(x + b * 120), Math.round(y - b * 34), 4, 3);
            }
          }
          // The explosion: a crest flash, a square shockwave of cells across the sky and ridge, and debris cells.
          const kp = place[K];
          if (kp && T >= on[K] && T < on[K] + 0.9 && fold < 1) {
            const age = T - on[K];
            C.pool(ctx, kp.cx, kp.cy, 260 + 900 * age, ink.crest, 0.55 * C.decay(T, on[K], 0.06));
            if (age < 0.5) {
              const r = 60 + age * 3200, f = 1 - age / 0.5;
              ctx.fillStyle = f > 0.55 ? ink.crest : f > 0.25 ? ink.hover : ink.lit;
              for (let row = HL.rMin; row < HL.rMin + HL.rows; row++)
                for (let col = HL.cMin; col < HL.cMin + HL.cols; col++) {
                  const x = HL.x0 + (col + 0.5) * HL.cw, y = HL.y0 + (row + 0.5) * HL.ch;
                  const d = Math.max(Math.abs(x - kp.cx), Math.abs(y - kp.cy) * 1.8);
                  if (Math.abs(d - r) >= HL.cw * 1.3 || OM.hash(col, row, 0x301) >= 0.3 + 0.6 * f) continue;
                  if (place.some((q) => q && x > q.x - 12 && x < q.x + q.w + 12 && y > q.base - q.cap - 14 && y < q.base + q.cap * 0.35)) continue; // the shock passes behind the words
                  OM.cell(ctx, HL, col, row, dpr);
                }
            }
            for (let j = 0; j < 160; j++) {
              const a = OM.hash(j, 1, 0x302) * Math.PI * 2, sp = 300 + 900 * OM.hash(j, 2, 0x302);
              const u = OM.ease.outCubic(OM.clamp(age / 0.7));
              const x = kp.cx + Math.cos(a) * sp * u, y = kp.cy + Math.sin(a) * sp * 0.6 * u + 160 * age * age;
              ctx.fillStyle = C.rgba(j % 3 ? ink.hover : ink.crest, 1 - age / 0.9);
              const z = j % 4 ? 6 : 9;
              ctx.fillRect(Math.round(x - z / 2), Math.round(y - z / 2), z, z);
            }
          }
          // The fold: one crest line grows out of the fallen hems across the frame.
          if (fold > 0) {
            const reach = 1100 * OM.ease.outCubic(fold);
            ctx.fillStyle = ink.crest;
            for (let col = HL.cMin; col < HL.cMin + HL.cols; col++) {
              const x = HL.x0 + (col + 0.5) * HL.cw;
              if (Math.abs(x - 960) < reach) OM.cell(ctx, HL, col, hc.row, dpr);
            }
          }
        },
        release: () => c.release(),
      });
    },
  });
})();
