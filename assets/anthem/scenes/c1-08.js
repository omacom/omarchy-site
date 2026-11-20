// c1-08 · The unveiling. A draped monolith rises out of the spotlight's pool on
// a stage lift and locks on the first word, which presses up through the cloth
// as a raised relief: the twitch. The second word presses up beside it and
// yanks the cloth off to the right, wiping from the relief to the machine's
// crown, built from those words as raised lattice letters with lit edges, in
// reading order. The downbeat wakes its outline; through the accelerating roll
// the crown letters fill with light in the lattice's dither order and the vents
// climb like level meters. The key word ignites [line] base band and powers
// it on: on the next downbeat everything goes to full glow, the screen flashes
// on and the spotlight cuts out, and the camera pushes into the screen until the
// frame is the screen handoff.
OM.ownWords.add('c1-08');
// Edit camera: the defaults fit. The scene's own camera never hits a drum (crane, creep, push), so
// the camera's beats land its moments: the yank (111.136), the outline waking (112.200) and the
// power-on flash (114.334), the push setting off on the kick after it; the key word, off the beat,
// carries its own punch.
OM.edit.plan('c1-08', {});
(() => {
  const TYPE = "800 100px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['c1-08-type'] = document.fonts.load(TYPE);

  // Stage px. The camera only ever zooms about the frame centre, where the screen
  // face sits: 480 x 300 at (720, 390). At PUSH that face is exactly the screen
  // handoff's (320, 140, 1280, 800), and the band seams CROWN_BOT / BASE_TOP land
  // on the frame's top and bottom edges, so the words are out of frame by then.
  // Change the face size and both must follow.
  const PUSH = 1280 / 480;
  const CROWN_BOT = 540 - 540 / PUSH;
  const BASE_TOP = 540 + 540 / PUSH;
  const GROUND = 884; // the machine stands on the stage floor, across the spot's pool
  const CELL = 7; // letter cells
  const MAXW = 780; // widest a row of letters may run
  const CREEP = 0.04;

  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  /** A soft elliptical pool of light, as handoff.js draws it. */
  const pool = (ctx, x, y, rx, ry, color, a) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx);
    ctx.restore();
  };

  OM.scene({
    id: 'c1-08',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Volumetric haze in the spotlight's cone: slow drifting smoke catching the light, shafts fanning from
      // the lamp, densest toward the pool; it goes when the spot cuts out on the downbeat.
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 b = src(q);
  if (uAmount <= 0.0) return b;
  vec2 sp = vec2(q.x * 1920.0, (1.0 - q.y) * 1080.0);
  vec2 st = (sp - vec2(960.0, 540.0)) / uP0.x + vec2(960.0, 540.0);
  float f = clamp(st.y / 880.0, 0.0, 1.0);
  float x0 = mix(900.0, 520.0, f), x1 = mix(1020.0, 1400.0, f);
  float w = x1 - x0;
  float inside = smoothstep(0.0, 0.18 * w, st.x - x0) * smoothstep(0.0, 0.18 * w, x1 - st.x) * step(0.0, st.y) * (1.0 - smoothstep(860.0, 900.0, st.y));
  if (inside <= 0.0) return b;
  float smoke = vnoise(st * vec2(0.006, 0.004) + vec2(uTime * 0.05, -uTime * 0.11)) * 0.65 + vnoise(st * 0.017 + vec2(-uTime * 0.09, uTime * 0.04)) * 0.35;
  float ang = (st.x - 960.0) / (st.y + 140.0);
  float shafts = 0.55 + 0.45 * vnoise(vec2(ang * 22.0, uTime * 0.25));
  float haze = inside * smoke * shafts * (0.45 + 0.55 * f);
  float l = dot(b.rgb, vec3(0.3, 0.59, 0.11));
  return vec4(mix(b.rgb, vec3(0.620, 0.808, 0.416), clamp(haze * 0.16 * uAmount * (1.0 - smoothstep(0.3, 0.6, l)), 0.0, 0.2)), 1.0);
}`,
      });
      const ink = OM.fieldInks('tokyo-night');
      const th = OM.theme('tokyo-night');
      const [w0, w1, w2] = OM.words('c1-08');
      const DB1 = OM.beatOnset(OM.downbeatsIn(112, 112.5)[0] || 112.245); // on its kick, not the late grid
      const DB2 = OM.beatOnset(OM.downbeatsIn(114.2, 114.6)[0] || 114.381); // on the drum: 114.334
      // A hit on the drum as measured on the song (OM.T.drums), the nearest within 50 ms.
      const onDrum = (t, kind) => OM.edit.hits(kind, t - 0.05, t + 0.05).reduce((m, h) => (m === null || Math.abs(h[0] - t) < Math.abs(m - t) ? h[0] : m), null) ?? t;
      const KICK = onDrum(110.99, 'kick'), ROLL0 = 112.71, ROLL1 = 114.33;
      const [SN_PRE, SN_A, SN_B] = [113.43, 113.78, 113.94].map((t) => onDrum(t, 'snare')); // 113.398, 113.800, 113.938
      const PUSH0 = onDrum(114.38, 'kick'); // the push into the screen sets off on the downbeat's kick (114.382)
      const OUT = start + duration - 0.07; // the push eases to a stop on the screen handoff, held for the last two frames
      const LIFT0 = start + 0.075; // the first frames are the spot handoff exactly
      const RELIEF = OM.mix(th['surface-2'], th['border-strong'], 0.6);
      const EMBOSS = OM.mix(th.surface, th['border-strong'], 0.7);
      const VENTS = 14; // slots per side
      const TONES = [th['bg-deep'], th.bg, th.surface, th['surface-2'], OM.mix(th['surface-2'], th['border-strong'], 0.55)];

      // ---- the words, rasterized onto cells once the face is loaded ----
      let G = null;
      const setup = () => {
        const ok = document.fonts.check(TYPE);
        const m = document.createElement('canvas').getContext('2d');
        m.font = TYPE;
        const capR = m.measureText('H').actualBoundingBoxAscent / 100 || 0.73;
        const fontOf = (rows) => `800 ${((rows * CELL) / capR).toFixed(2)}px 'JetBrains Mono'`;
        const widthOf = (text, rows) => {
          m.font = fontOf(rows);
          return m.measureText(text).width;
        };
        /** Most cap rows (hi..lo) at which every text fits MAXW. */
        const fit = (texts, hi, lo) => {
          for (let r = hi; r > lo; r--) if (Math.max(...texts.map((s) => widthOf(s, r))) <= MAXW) return r;
          return lo;
        };
        /** Text on CELL-px cells, cap height `rows` cells: cells {q, r, ch} with r 0 at the cap top, trimmed to the ink. */
        const raster = (text, rows) => {
          const font = fontOf(rows);
          m.font = font;
          const adv = m.measureText('M').width;
          const met = m.measureText(text);
          const up = Math.max(rows, Math.ceil(met.actualBoundingBoxAscent / CELL));
          const R = up + Math.ceil(Math.max(0, met.actualBoundingBoxDescent) / CELL);
          const pad = 2 * CELL, S = 3, n = CELL * S;
          const cols = Math.ceil((met.width + 2 * pad) / CELL);
          const cnv = document.createElement('canvas');
          cnv.width = cols * n;
          cnv.height = R * n;
          const x = cnv.getContext('2d', { willReadFrequently: true });
          x.scale(S, S);
          x.font = font;
          x.fillStyle = '#fff';
          x.fillText(text, pad, up * CELL);
          const px = x.getImageData(0, 0, cnv.width, cnv.height).data;
          const out = [];
          for (let r = 0; r < R; r++)
            for (let q = 0; q < cols; q++) {
              let sum = 0;
              for (let yy = r * n; yy < (r + 1) * n; yy++) for (let xx = q * n; xx < (q + 1) * n; xx++) sum += px[(yy * cnv.width + xx) * 4 + 3];
              if (sum > 115 * n * n) out.push({ q, r: r - (up - rows), ch: Math.floor(((q + 0.5) * CELL - pad) / adv) });
            }
          if (!out.length) for (let r = 0; r < rows; r++) for (let q = 0; q < 3 * rows; q++) out.push({ q, r, ch: 0 });
          const q0 = Math.min(...out.map((k) => k.q));
          let q1 = 0;
          for (const k of out) q1 = Math.max(q1, (k.q -= q0));
          return { cells: out, width: (q1 + 1) * CELL };
        };
        /** Raster cells placed at (x0, y0) in stage px, with their open sides and dither thresholds. */
        const place = (R, x0, y0, wordOf, tq, tr) => {
          const has = new Set(R.cells.map((k) => k.q + ',' + k.r));
          const open = (q, r) => !has.has(q + ',' + r);
          return R.cells.map((k) => ({
            x: x0 + k.q * CELL, y: y0 + k.r * CELL, w: wordOf(k), th: OM.threshold(k.q + tq, k.r + tr),
            top: open(k.q, k.r - 1), bot: open(k.q, k.r + 1), lft: open(k.q - 1, k.r), rgt: open(k.q + 1, k.r),
          }));
        };
        const sung = OM.sung('c1-08');
        const word = (i) => (sung[i] && sung[i].text ? sung[i].text.toUpperCase() : '███');
        const sep = sung[1] && sung[1].space === false ? '' : ' ';
        // The crown: the first two words on one line, stacked if they won't fit at a monumental size.
        const line = word(0) + sep + word(1);
        const r1 = fit([line], 11, 9);
        const lines = widthOf(line, r1) <= MAXW
          ? [{ text: line, rows: r1, wordOf: (k) => (k.ch < word(0).length ? 0 : 1) }]
          : (() => { const r2 = fit([word(0), word(1)], 11, 8); return [0, 1].map((i) => ({ text: word(i), rows: r2, wordOf: () => i })); })();
        const crown = [];
        let y = CROWN_BOT - 16, widest = 0;
        for (let i = lines.length - 1; i >= 0; i--) {
          const R = raster(lines[i].text, lines[i].rows);
          y -= lines[i].rows * CELL;
          widest = Math.max(widest, R.width);
          crown.push(...place(R, Math.round(960 - R.width / 2), Math.round(y), lines[i].wordOf, 3, 40 + 20 * i));
          y -= 12;
        }
        const MY0 = Math.round(y + 12 - 16);
        // The base: the key word, larger, centred in the band between the screen and the floor.
        const rb = fit([word(2)], 14, 10);
        const RB = raster(word(2), rb);
        const base = place(RB, Math.round(960 - RB.width / 2), Math.round(BASE_TOP + (GROUND - BASE_TOP - rb * CELL) / 2), () => 2, 17, 80);
        const MW = 2 * Math.round(OM.clamp(Math.max(widest, RB.width) + 80, 760, 860) / 2);
        return { ok, crown, base, MY0, MW, MX0: 960 - MW / 2, MX1: 960 + MW / 2 };
      };

      // ---- the cloth: faceted pleats, flat over the crown, deepening toward the hem and the corners ----
      const N = 10, VS = [0, 0.22, 0.5, 0.78, 1], M = VS.length - 1;
      const fold = [], wander = [];
      for (let i = 0; i <= N; i++) {
        fold.push((i % 2 ? -1 : 1) * (i <= 1 || i >= N - 1 ? 1.4 : 1) * (0.6 + 0.4 * OM.hash(i, 3, 108)));
        wander.push(i === 0 || i === N ? 0 : 2 * OM.hash(i, 5, 108) - 1);
      }
      const P = new Float32Array((N + 1) * (M + 1) * 3);
      const at = (j, i) => (j * (N + 1) + i) * 3;
      /** The cloth's twitch: a jolt on the first word (the lift locking), a smaller one on the kick, one more on the yank. */
      const jolt = (T, hits) => {
        let v = 0;
        for (const [t0, a] of hits) {
          const d = T - t0;
          if (d >= 0) v += a * Math.exp(-d / 0.07) * Math.cos(2 * Math.PI * 11 * d);
        }
        return v;
      };
      const TWITCH = [[w0, 1], [KICK, 0.4]], YANK = [[w1, 0.6]];
      /** How hard a crown word presses up through the cloth: from its onset, settling to a residue. */
      const press = (k, T) => (k.w === 0 ? (T < w0 ? 0 : 0.45 + 0.55 * Math.exp(-(T - w0) / 0.2)) : T < w1 ? 0 : 0.55 + 0.45 * Math.exp(-(T - w1) / 0.15));
      const drawCloth = (ctx, T) => {
        const top = G.MY0 - 6, hem = GROUND + 8;
        const d1 = Math.max(0, T - w1);
        const pull = d1 > 0 ? 3600 * (d1 - 0.025 * (1 - Math.exp(-d1 / 0.025))) : 0;
        const flat = 1 - 0.7 * OM.clamp(d1 / 0.2);
        const rise = T < w0 ? (1 - OM.ease.outCubic(OM.prog(T, LIFT0, w0))) * (hem - top + 30) : 0;
        const tw = jolt(T, TWITCH), sh = tw + jolt(T, YANK);
        const taut = 0.55 * OM.clamp(d1 / 0.3), flutter = OM.clamp(d1 / 0.08);
        for (let j = 0; j <= M; j++) {
          const v = VS[j], flare = 58 * Math.pow(v, 1.6);
          const L0 = G.MX0 - 8 - flare, R0 = G.MX1 + 8 + flare;
          for (let i = 0; i <= N; i++) {
            const u = i / N;
            let z = fold[i] * (2 + 34 * Math.pow(v, 1.4)) * flat;
            let x = L0 + (R0 - L0) * u + wander[i] * 18 * v;
            let y = top + (hem - top) * v + z * 0.25 * v; // ridges come forward, so they sit lower
            y -= 9 * sh * (1 - 0.6 * v); // the twitch: the drape jumps, the hem flicks
            x += 5 * sh * fold[i] * v;
            if (d1 > 0) {
              // The yank: pulled taut toward the top right, the hem lifts, ripples run along it, the top leads.
              y += (top + 40 - y) * taut * v;
              const ph = u * 7 - d1 * 32;
              y += 18 * Math.sin(ph) * v * flutter;
              z += 20 * Math.cos(ph) * v * flutter;
              x += pull * (1 + 0.25 * u) * (1 - 0.35 * v);
              y += 500 * d1 * d1 * (0.2 + 0.8 * u); // ...and it drops as it leaves
            }
            const o = at(j, i);
            P[o] = x;
            P[o + 1] = y + rise;
            P[o + 2] = z;
          }
        }
        ctx.save();
        if (rise > 0) {
          ctx.beginPath();
          ctx.rect(0, -2000, 1920, 2900); // still coming up through the floor
          ctx.clip();
        }
        const outline = () => {
          ctx.beginPath();
          for (let i = 0; i <= N; i++) ctx.lineTo(P[at(0, i)], P[at(0, i) + 1]);
          for (let j = 1; j <= M; j++) ctx.lineTo(P[at(j, N)], P[at(j, N) + 1]);
          for (let i = N - 1; i >= 0; i--) ctx.lineTo(P[at(M, i)], P[at(M, i) + 1]);
          for (let j = M - 1; j > 0; j--) ctx.lineTo(P[at(j, 0)], P[at(j, 0) + 1]);
          ctx.closePath();
        };
        // Underlay first, so seams between facets read as creases, not gaps.
        ctx.fillStyle = TONES[0];
        outline();
        ctx.fill();
        // Flat-shaded pleats, one facet per quad (normal from its diagonals): the spot from above and the left,
        // falling off down the drape and away from the cone, posterized to the theme's surface tones.
        for (let j = 0; j < M; j++)
          for (let i = 0; i < N; i++) {
            const a = at(j, i), b = at(j, i + 1), q = at(j + 1, i + 1), d = at(j + 1, i);
            const ux = P[q] - P[a], uy = P[q + 1] - P[a + 1], uz = P[q + 2] - P[a + 2];
            const vx = P[d] - P[b], vy = P[d + 1] - P[b + 1], vz = P[d + 2] - P[b + 2];
            let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
            const lum = (-0.35 * nx - 0.7 * ny + 0.62 * nz) / (Math.hypot(nx, ny, nz) || 1);
            const mx = (P[a] + P[b] + P[q] + P[d]) / 4;
            const fall = (1 - 0.3 * ((j + 0.5) / M)) * (1 - 0.3 * OM.clamp(Math.abs(mx - 960) / 480));
            ctx.fillStyle = TONES[OM.clamp(Math.floor((lum * fall - 0.2) / 0.11), 0, 4)];
            ctx.beginPath();
            ctx.moveTo(P[a], P[a + 1]);
            ctx.lineTo(P[b], P[b + 1]);
            ctx.lineTo(P[q], P[q + 1]);
            ctx.lineTo(P[d], P[d + 1]);
            ctx.closePath();
            ctx.fill();
          }
        // Rim light: the spot grazes the top edge, brightest under the cone; the shoulders catch a little.
        const rim = ctx.createLinearGradient(G.MX0, 0, G.MX1, 0);
        rim.addColorStop(0, rgba(ink.hover, 0.25));
        rim.addColorStop(0.5, rgba(ink.hover, 0.95));
        rim.addColorStop(1, rgba(ink.hover, 0.25));
        ctx.strokeStyle = rim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) ctx.lineTo(P[at(0, i)], P[at(0, i) + 1] + 1);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        for (const [i, a] of [[0, 0.5], [N, 0.2]]) {
          ctx.strokeStyle = rgba(ink.lit, a);
          ctx.beginPath();
          for (let j = 0; j <= 2; j++) ctx.lineTo(P[at(j, i)], P[at(j, i) + 1]);
          ctx.stroke();
        }
        // Each crown word presses up through the cloth on its onset: its letters in relief, catching the light,
        // exactly over the real ones, so the yank wipes from the relief to the letters themselves.
        if (T >= w0) {
          outline();
          ctx.clip();
          const dy = Math.round(-4 * tw);
          const pass = (fill, a, h, off, when) => {
            ctx.fillStyle = fill;
            for (const k of G.crown) {
              const e = press(k, T);
              if (e <= 0 || !when(k)) continue;
              ctx.globalAlpha = a * e;
              ctx.fillRect(k.x, k.y + dy + off, CELL, h);
            }
          };
          pass(EMBOSS, 1, CELL, 0, () => true);
          pass(ink.crest, 0.9, 2, 0, (k) => k.top);
          pass(ink.bg, 0.85, 2, CELL, (k) => k.bot);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      };

      /** Camera zoom about the frame centre: a creep while the machine stands, then the push into the screen. */
      const camera = (T) => {
        const creep = 1 + CREEP * OM.ease.inOutSine(OM.prog(T, w1, PUSH0));
        if (T <= PUSH0) return creep;
        return (1 + CREEP) * Math.pow(PUSH / (1 + CREEP), OM.ease.inOutCubic(OM.prog(T, PUSH0, OUT)));
      };

      // ---- camera: craning down from c1-07's high hold onto the stage as the lift rises; the push is camera() above ----
      const CR = OM.c1.crane78;
      const look = (T) => {
        const down = 1 - OM.smooth(OM.prog(T, start, w0 + 0.4));
        const y = CR.Y * down;
        const amount = OM.post.envelope(T, start, DB2 + 0.5, { ramp: 0.35, hold: 0.075 }) * (T < DB2 ? 1 : 0);
        // The key word's punch: the camera hits as it ignites the base band (the starfall lands on it).
        const a = T - w2, kp = a < 0 || a >= 0.8 ? 0 : (1 - Math.exp(-a / 0.015)) * Math.exp(-a / 0.14) * (1 - OM.smooth(OM.prog(a, 0.5, 0.8)));
        return { amount, cam: { zoom: OM.c1.cover(0, 0, y) * (1 + 0.055 * kp), rot: 0, x: 0, y }, p0: [camera(T), 0, 0, 0] };
      };
      // ---- extras: stage smoke drifting low across the floor, a puff of dust where the cloth's hem drags off ----
      const smoke = (ctx, T, X, Y, s, vis) => {
        const lit = T < DB2 ? 1 : 0.4;
        for (let i = 0; i < 7; i++) {
          const h1 = OM.hash(i, 1, 0xc108), h2 = OM.hash(i, 2, 0xc108);
          const x = 300 + ((h1 * 1500 + T * (18 + 22 * h2)) % 1500), y = GROUND - 30 - 70 * h2 + 10 * Math.sin(T * 0.7 + 6 * h1);
          const r = (140 + 120 * h2) * s;
          const g = ctx.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r);
          g.addColorStop(0, rgba(i % 2 ? th['border-strong'] : ink.dim, 0.13 * lit * vis));
          g.addColorStop(1, rgba(th['border-strong'], 0));
          ctx.fillStyle = g;
          ctx.fillRect(X(x) - r, Y(y) - r, 2 * r, 2 * r);
        }
        if (!G || T < w1) return;
        for (const side of [1, -1])
          OM.c1.burst(T, w1 + 0.06, 22, 0xc18 + side, { x: X(side > 0 ? G.MX1 + 20 : G.MX0 - 10), y: Y(GROUND - 4), speed: side > 0 ? 300 : 170, spread: 1.1, dir: side > 0 ? -0.35 : -Math.PI + 0.35, g: -40, life: 1.0 }, (px, py, u, i) => {
            ctx.globalAlpha = 0.55 * (1 - u) * Math.min(1, u * 10) * vis;
            ctx.fillStyle = i % 3 ? th['text-muted'] : th['border-strong'];
            const d = (2 + 6 * u) * s;
            ctx.fillRect(px - d / 2, py - d / 2, d, d);
          });
        ctx.globalAlpha = 1;
      };

      // ---- explosion, starfall (c1-01's supernova turned inside out): on the key word the frame's edges shed
      // lattice debris that rains inward onto the base band, each cell landing on one of the word's own cells
      // and flashing it, all in by 0.35 s; the word itself is lit from its onset, never covered for long. ----
      const starfall = (ctx, T, X, Y, s) => {
        const a = T - w2, base = G.base;
        if (!base.length) return;
        for (let i = 0; i < 64; i++) {
          const h1 = OM.hash(i, 1, 0x5f), h2 = OM.hash(i, 2, 0x5f), h3 = OM.hash(i, 3, 0x5f);
          const land = 0.18 + 0.17 * h3, u = a / land;
          if (u >= 1.25) continue;
          const tg = base[Math.floor(h2 * base.length)], tx = X(tg.x + CELL / 2), ty = Y(tg.y + CELL / 2);
          const th = 2 * Math.PI * h1, sx = 960 + 1150 * Math.cos(th), sy = 540 + 700 * Math.sin(th);
          if (u < 1) {
            const e = OM.ease.inCubic(u), x = sx + (tx - sx) * e, y = sy + (ty - sy) * e;
            ctx.globalAlpha = 0.4 + 0.6 * u;
            ctx.fillStyle = u > 0.7 ? ink.crest : ink.hover;
            const sz = Math.max(3, CELL * s * (1.6 - 0.6 * u));
            ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
          } else {
            ctx.globalAlpha = 1 - (u - 1) / 0.25;
            ctx.fillStyle = ink.crest;
            const sz = CELL * s * 1.8;
            ctx.fillRect(tx - sz / 2, ty - sz / 2, sz, sz);
          }
        }
        ctx.globalAlpha = 1;
      };

      return OM.c1.post({
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          ctx.globalAlpha = 1;
          if (T < LIFT0) return OM.handoff('spot', ctx, T, dpr);
          if (T >= OUT) return OM.handoff('screen', ctx, T, dpr);
          if (!G || (!G.ok && document.fonts.check(TYPE))) G = setup();
          const s = camera(T);
          const X = (x) => 960 + (x - 960) * s, Y = (y) => 540 + (y - 540) * s;
          const sn = (v) => Math.round(v * dpr) / dpr;
          /** A stage-px rect through the camera, edges snapped to device pixels. */
          const box = (x, y, w, h) => {
            const xa = sn(X(x)), ya = sn(Y(y)), xb = sn(X(x + w)), yb = sn(Y(y + h));
            ctx.fillRect(xa, ya, xb - xa, yb - ya);
          };
          const vis = 1 - OM.smooth(OM.prog(T, 114.7, 115.0)); // words legible to ~114.70, then gone with the push
          const glow = T >= DB2 ? T - DB2 : -1;
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);

          // Stage space: the spotlight (cut on the downbeat, when the machine becomes the light) and the machine's own light on the floor.
          ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * 960 * (1 - s), dpr * 540 * (1 - s));
          if (T < DB2) {
            const g = ctx.createLinearGradient(0, 0, 0, 880);
            g.addColorStop(0, rgba(ink.lit, 0.1));
            g.addColorStop(1, rgba(ink.lit, 0.03));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(900, 0);
            ctx.lineTo(1020, 0);
            ctx.lineTo(1400, 880);
            ctx.lineTo(520, 880);
            ctx.closePath();
            ctx.fill();
            pool(ctx, 960, 880, 440, 110, ink.lit, 0.42);
          }
          let floor = 0;
          if (T >= w2) floor = 0.16 + 0.3 * Math.exp(-(T - w2) / 0.12);
          if (glow >= 0) floor = 0.3 + 0.3 * Math.exp(-glow / 0.2);
          if (floor > 0) pool(ctx, 960, GROUND, 500, 92, ink.lit, floor * vis);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          smoke(ctx, T, X, Y, s, vis); // behind the machine, so it never crosses the words

          if (T >= w1) {
            const { MX0, MW, MY0 } = G;
            // The body, lit from above; once the spot is gone it sinks into the dark around the screen.
            const dark = OM.prog(T, DB2 + 0.08, OUT - 0.04);
            const body = ctx.createLinearGradient(0, Y(MY0), 0, Y(GROUND));
            body.addColorStop(0, OM.mix(th.bg, ink.bg, dark));
            body.addColorStop(1, OM.mix(th['bg-deep'], ink.bg, dark));
            ctx.fillStyle = body;
            box(MX0, MY0, MW, GROUND - MY0);
            // The base band: dark until the key word lights it from within (a flicker on the snare before it).
            let tint = T >= SN_PRE && T < SN_PRE + 0.05 ? 0.06 : 0;
            if (T >= w2) tint = 0.06 + 0.2 * Math.exp(-(T - w2) / 0.09);
            if (glow >= 0) tint = Math.max(tint, 0.06 + 0.16 * Math.exp(-glow / 0.12));
            if (tint) {
              ctx.fillStyle = rgba(ink.lit, tint * vis);
              box(MX0, BASE_TOP, MW, GROUND - BASE_TOP);
            }
            ctx.globalAlpha = vis;
            ctx.fillStyle = glow >= 0 ? ink.mid : th['border-subtle'];
            box(MX0, CROWN_BOT, MW, 1);
            box(MX0, BASE_TOP - 1, MW, 1);
            ctx.globalAlpha = 1;

            // The screen: dark glass; its border sputters on the snares, then it flashes on at full glow and settles to the handoff's face.
            const fx0 = sn(X(720)), fy0 = sn(Y(390)), fx1 = sn(X(1200)), fy1 = sn(Y(690));
            let face = ink.bg, edge = T >= SN_A && T < SN_A + 0.05 ? ink.mid : ink.dim;
            if (T >= SN_B) { face = th['bg-deep']; edge = ink.mid; }
            if (glow >= 0) {
              face = OM.mix(th.bg, ink.crest, 0.9 * Math.exp(-glow / 0.08));
              edge = glow < 0.1 ? ink.crest : glow < 0.22 ? ink.hover : ink.mid;
            }
            ctx.fillStyle = face;
            ctx.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
            if (glow < 0) {
              const gl = ctx.createLinearGradient(0, fy0, 0, fy0 + (fy1 - fy0) * 0.45);
              gl.addColorStop(0, rgba(ink.lit, 0.05));
              gl.addColorStop(1, rgba(ink.lit, 0));
              ctx.fillStyle = gl;
              ctx.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
            }
            ctx.strokeStyle = edge;
            ctx.lineWidth = 2;
            ctx.strokeRect(fx0 + 1, fy0 + 1, fx1 - fx0 - 2, fy1 - fy0 - 2);

            // Vents either side of the screen fill like level meters through the accelerating roll, a slot per step.
            const level = T < ROLL0 ? 0 : Math.min(VENTS, 1 + Math.floor((VENTS - 1) * Math.pow(OM.prog(T, ROLL0, ROLL1), 2)));
            ctx.globalAlpha = vis;
            for (const cx of [(MX0 + 720) / 2, (1200 + MX0 + MW) / 2])
              for (let i = 0; i < VENTS; i++) {
                ctx.fillStyle = glow >= 0 ? (glow < 0.12 ? ink.crest : ink.lit) : i >= level ? th['border-subtle'] : i === level - 1 ? ink.crest : ink.lit;
                box(cx - 14, 634 - 14 * i, 28, 6);
              }
            ctx.globalAlpha = 1;

            // The crown: raised letters with lit edges; through the roll they fill with light in dither order.
            const fill = T < ROLL0 ? -1 : 1.02 * Math.pow(OM.prog(T, ROLL0, ROLL1), 1.7);
            const on = (k) => glow >= 0 || k.th < fill;
            ctx.globalAlpha = vis;
            for (const k of G.crown) {
              ctx.fillStyle = glow >= 0 ? (k.th > glow / 0.3 ? ink.crest : ink.hover) : k.th < fill ? (fill - k.th < 0.05 ? ink.crest : ink.lit) : RELIEF;
              box(k.x, k.y, CELL, CELL);
            }
            if (glow < 0) {
              ctx.globalAlpha = 0.9 * vis;
              ctx.fillStyle = ink.crest;
              for (const k of G.crown) if (k.top && !on(k)) box(k.x, k.y, CELL, 2);
              ctx.globalAlpha = 0.55 * vis;
              ctx.fillStyle = ink.mid;
              for (const k of G.crown) {
                if (on(k)) continue;
                if (k.lft) box(k.x, k.y, 1.5, CELL);
                if (k.rgt) box(k.x + CELL - 1.5, k.y, 1.5, CELL);
              }
              ctx.globalAlpha = 0.8 * vis;
              ctx.fillStyle = ink.bg;
              for (const k of G.crown) if (k.bot) box(k.x, k.y + CELL, CELL, 2);
            }
            // The key word: invisible [line] band until its onset, then struck to crest and cooling to lit.
            if (T >= w2) {
              const a = T - w2;
              ctx.globalAlpha = vis;
              for (const k of G.base) {
                ctx.fillStyle = glow >= 0 ? (k.th > glow / 0.3 ? ink.crest : ink.hover) : a < 0.07 ? ink.crest : k.th > (a - 0.07) / 0.4 ? ink.hover : ink.lit;
                box(k.x, k.y, CELL, CELL);
              }
            }
            // The outline: the spot grazing the top edge; the first downbeat wakes it, the second blazes it.
            const x0 = sn(X(MX0)), x1 = sn(X(MX0 + MW)), y0 = sn(Y(MY0)), y1 = sn(Y(GROUND));
            const f1 = T >= DB1 ? Math.exp(-(T - DB1) / 0.12) : 0;
            const sideInk = glow >= 0 ? (glow < 0.15 ? ink.crest : ink.lit) : f1 > 0.3 ? ink.lit : ink.mid;
            if (T >= DB1) {
              ctx.globalAlpha = vis * (glow >= 0 ? 1 : 0.85);
              ctx.fillStyle = sideInk;
            } else {
              const sg = ctx.createLinearGradient(0, y0, 0, y1);
              sg.addColorStop(0, rgba(ink.mid, 0.6));
              sg.addColorStop(1, rgba(ink.mid, 0));
              ctx.fillStyle = sg;
            }
            ctx.fillRect(x0, y0, 2, y1 - y0);
            ctx.fillRect(x1 - 2, y0, 2, y1 - y0);
            if (glow >= 0) ctx.fillStyle = sideInk;
            else {
              const rg = ctx.createLinearGradient(x0, 0, x1, 0);
              const mid = T >= DB1 ? 0.6 : 0.3;
              rg.addColorStop(0, rgba(ink.hover, mid));
              rg.addColorStop(0.5, rgba(ink.hover, 1));
              rg.addColorStop(1, rgba(ink.hover, mid));
              ctx.fillStyle = rg;
            }
            ctx.globalAlpha = vis;
            ctx.fillRect(x0, y0, x1 - x0, 2);
            ctx.globalAlpha = 1;
          }

          if (T >= w2 && T < w2 + 0.45 && G) starfall(ctx, T, X, Y, s);

          if (T < w1 + 0.9) {
            ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * 960 * (1 - s), dpr * 540 * (1 - s));
            drawCloth(ctx, T);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
        },
        release: () => c.release(),
      }, fx, look);
    },
  });
})();
