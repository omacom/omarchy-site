// c1-05 · Sketch to real. The empty screen c1-04 hands over becomes a dark
// drafting surface ruled on the home lattice, and a pencil layout of an Omarchy
// desktop goes down on it in graphite construction lines: ruled guides running
// off the sheet, a top bar, three tiled windows, and in each window one sung
// word as hollow hand lettering between its cap and base guides. Each onset
// inks its word into crisp crest-to-hover letters and renders its window cell
// by cell outward from the letters, the active border following the voice. The
// bar renders on the first kick; the held key word renders the rest and erases
// the construction; the downbeat glints across the finished line. On the 100.01
// kick the lattice cuts through the render as a shockwave and the render's
// cells pop out from the edges in; on the snare the letters snap into lattice
// cells that hollow out into the grid itself, landing on the grid handoff.
// Edit camera: the defaults fit. Nothing in the scene's own camera hits a drum (it pans with the
// voice); the key word adds its own punch to the camera's jolt on its beat (98.866), and the
// 99.974 kick's shockwave rides the camera's backbeat jolt there.
OM.edit.plan('c1-05', {});
(() => {
  const ID = 'c1-05';
  OM.ownWords.add(ID);
  const font = (w, s) => `${w} ${s.toFixed(2)}px 'JetBrains Mono'`;
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady[ID + '-type'] = document.fonts.load(font(800, 100));
  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };

  OM.scene({
    id: ID,
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Graphite grain: the pencil's grey marks broken up by the paper's tooth, with a faint lead sheen; the
      // green render is left alone, and the grain fades out as the render becomes real.
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 b = src(q);
  if (uAmount <= 0.0) return b;
  vec2 sp = q * uRes / (uRes.y / 1080.0);
  float l = dot(b.rgb, vec3(0.3, 0.59, 0.11));
  float lead = step(b.g, b.b + 0.03) * smoothstep(0.1, 0.3, l);
  float tooth = smoothstep(0.3, 0.8, vnoise(sp * vec2(0.85, 0.3)) * 0.65 + hash(floor(q * uRes)) * 0.35);
  float sheen = pow(vnoise(sp * 0.012 + vec2(uTime * 0.2, 0.0)), 3.0);
  vec3 c = b.rgb * (1.0 - 0.6 * tooth * lead * uAmount) + vec3(0.753, 0.792, 0.961) * 0.12 * sheen * lead * uAmount;
  float surf = (1.0 - smoothstep(0.04, 0.16, l)) * (hash(floor(q * uRes)) - 0.5);
  c += vec3(0.255, 0.282, 0.408) * 0.18 * surf * uAmount;
  return vec4(c, 1.0);
}`,
      });
      const L = OM.HOME;
      const ink = OM.fieldInks('tokyo-night');
      const th = OM.theme('tokyo-night');
      const END = start + duration, HOLD = 0.07, S0 = start + HOLD;
      const sung = OM.sung(ID);
      const on = sung.map((w) => w.t0);
      // Hits: the kick under word 1, the downbeat in the held word, the kick where the energy turns high, the snare.
      // Each on the drum as measured on the song (OM.T.drums): 98.350, 99.974, 100.734.
      const onDrum = (t, kind) => OM.edit.hits(kind, t - 0.05, t + 0.05).reduce((m, h) => (m === null || Math.abs(h[0] - t) < Math.abs(m - t) ? h[0] : m), null) ?? t;
      const KICK1 = onDrum(98.36, 'kick'), KICK2 = onDrum(100.01, 'kick'), SNARE = onDrum(100.7, 'snare');
      const SHOCK = onDrum(100.22, 'kick');
      const DOWN = OM.beatOnset(OM.downbeatsIn(on[2], KICK2)[0] || 99.451); // the drum onset, not the late grid
      const D = [0.26, 0.2, 0.34]; // seconds each window takes to render, cell by cell

      // Everything inside the screen sits on home-lattice lines.
      const X = (col) => L.x0 + col * L.cw, Y = (row) => L.y0 + row * L.ch;
      const IN = { x: 322, y: 142, w: 1276, h: 796 }; // the screen's face inside its 2px border
      const CS0 = -4, RS0 = -19, NC = 89, NR = 57; // the lattice cells covering the screen
      const BAR = -17; // the bar runs from the face's top edge down to this row line

      const clean = (s) => (s || '').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toUpperCase();

      // ---- layout, measured once the face is loaded ----
      const make = () => {
        const m = document.createElement('canvas').getContext('2d');
        m.font = font(800, 100);
        const adv = m.measureText('M').width / 100;
        const capR = m.measureText('H').actualBoundingBoxAscent / 100 || 0.73;
        const txt = sung.map((w) => clean(w.text));
        const n = txt.map((s) => Math.max(1, [...s].length));
        // Row one splits by letter count so both words share one size; the key word gets the wide row.
        const cs = -2 + Math.round(OM.clamp(n[0] / (n[0] + n[1]), 0.34, 0.66) * 84);
        const tiles = [[-2, cs, -16, 5], [cs + 1, 83, -16, 5], [-2, 83, 6, 36]].map(([c0, c1, r0, r1]) => ({
          c0, c1, r0, r1, x: X(c0), y: Y(r0), w: X(c1) - X(c0), h: Y(r1) - Y(r0),
        }));
        const fit = (k, rows) => Math.min((tiles[k].w - 88) / (n[k] * adv), (rows * L.ch) / capR);
        // Cap height a whole number of lattice rows when that still reads, so cap and base guides are lattice lines.
        const snapS = (s) => {
          const r = Math.floor((s * capR) / L.ch);
          return r >= 5 ? (r * L.ch) / capR : s;
        };
        const s1 = snapS(Math.min(fit(0, 8), fit(1, 8))), s2 = snapS(fit(2, 13));
        const W = [s1, s1, s2].map((s, k) => {
          const t = tiles[k], cap = s * capR, rows = Math.round(cap / L.ch);
          const base = Y(t.r0 + Math.floor((t.r1 - t.r0 - rows) / 2) + 1 + rows);
          const w = n[k] * adv * s;
          return { k, t, text: txt[k], chars: [...txt[k]], s, cap, adv: adv * s, w, x: t.x + (t.w - w) / 2, base, top: base - cap, t0: on[k], cx: t.x + t.w / 2, cy: base - cap / 2 };
        });

        // When each cell's render appears, and when it pops out at the end.
        const at = new Float32Array(NC * NR), die = new Float32Array(NC * NR);
        const far = (w, r) => Math.max(...[[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].map(([x, y]) => Math.hypot(x - w.cx, y - w.cy)));
        const farK = W.map((w, k) => far(w, tiles[k])), farG = far(W[2], IN);
        for (let j = 0; j < NR; j++)
          for (let i = 0; i < NC; i++) {
            const col = CS0 + i, row = RS0 + j, q = j * NC + i;
            const thr = OM.threshold(col, row);
            const x = X(col + 0.5), y = Y(row + 0.5);
            const k = row < BAR ? 3 : tiles.findIndex((t) => col >= t.c0 && col < t.c1 && row >= t.r0 && row < t.r1);
            if (k === 3) at[q] = KICK1 + 0.2 * (0.8 * (i / (NC - 1)) + 0.2 * thr);
            else if (k >= 0) at[q] = on[k] + D[k] * ((0.9 * Math.hypot(x - W[k].cx, y - W[k].cy)) / farK[k] + 0.1 * thr);
            else at[q] = on[2] + 0.1 + 0.32 * ((0.85 * Math.hypot(x - W[2].cx, y - W[2].cy)) / farG + 0.15 * thr);
            const rn = Math.min(1, Math.hypot((x - 960) / 640, (y - 540) / 400) / Math.SQRT2);
            die[q] = KICK2 + 0.04 + 0.56 * (0.6 * (1 - rn) + 0.4 * thr);
          }
        let atMax = 0;
        for (const a of at) atMax = Math.max(atMax, a);

        // The letters rasterized onto the lattice, for the snare.
        const R = document.createElement('canvas');
        R.width = 960;
        R.height = 540;
        const o = R.getContext('2d', { willReadFrequently: true });
        o.scale(0.5, 0.5);
        o.fillStyle = '#fff';
        for (const w of W) {
          o.font = font(800, w.s);
          o.fillText(w.text, w.x, w.base);
        }
        const px = o.getImageData(0, 0, 960, 540).data;
        const cells = [];
        for (let j = 0; j < NR; j++)
          for (let i = 0; i < NC; i++) {
            const col = CS0 + i, row = RS0 + j;
            const x0 = Math.round(X(col) / 2), x1 = Math.round(X(col + 1) / 2), y0 = Math.round(Y(row) / 2), y1 = Math.round(Y(row + 1) / 2);
            let sum = 0, cnt = 0;
            for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++, cnt++) sum += px[(y * 960 + x) * 4 + 3];
            if (!cnt || sum / cnt < 0.42 * 255) continue;
            const cy = Y(row + 0.5);
            const w = W.find((v) => X(col + 0.5) > v.x - 9 && X(col + 0.5) < v.x + v.w + 9 && cy > v.top - 9 && cy < v.base + 9) || W[2];
            cells.push({ col, row, ink: (cy - w.top) / w.cap < 0.45 ? ink.crest : ink.hover, die: SNARE + 0.015 + 0.14 * OM.threshold(col, row) });
          }

        // Window contents: the same marks are scribbled in the sketch and filled in the render.
        const bars = tiles.map((t, k) => {
          const x = t.x + 18, y = t.y + 18;
          const out = [
            { x, y, w: 9, c: th.brand },
            { x: x + 18, y, w: 64 + 30 * OM.hash(k, 1, 5), c: th.text },
            { x, y: y + 18, w: 120 + 60 * OM.hash(k, 2, 5), c: th['text-muted'] },
          ];
          if (k === 2) out.push({ x, y: y + 36, w: 48, c: th['text-secondary'] }, { x: x + 58, y: y + 36, w: 36, c: th.brand });
          return out;
        });

        // ---- the pencil: kind 0 ruled guide, 1 pen line, 2 scribble, 3 circle (x2 = radius) ----
        // Group 'g' is construction (erased by the key word), 'b' the bar, 0..2 a window.
        const ST = [];
        const add = (x1, y1, x2, y2, ta, dur, kind, g) => ST.push({ x1, y1, x2, y2, ta, dur, kind, g, seed: ST.length * 7 + 3 });
        [Y(BAR), Y(-16), Y(5), Y(6), Y(36)].forEach((y, i) => add(262, y, 1658, y, S0 + i * 0.014, 0.08, 0, 'g'));
        [X(-2), X(cs), X(cs + 1), X(83)].forEach((x, i) => add(x, 96, x, 984, S0 + 0.05 + i * 0.014, 0.08, 0, 'g'));
        [[320, 140, -1, -1], [1600, 140, 1, -1], [320, 940, -1, 1], [1600, 940, 1, 1]].forEach(([x, y, sx, sy], i) => {
          add(x + sx * 12, y, x + sx * 44, y, S0 + 0.02 + i * 0.012, 0.05, 0, 'g');
          add(x, y + sy * 12, x, y + sy * 44, S0 + 0.03 + i * 0.012, 0.05, 0, 'g');
        });
        tiles.forEach((t, k) => {
          const a = S0 + [0.01, 0.05, 0.08][k], e = [0.08, 0.1, 0.12][k] / 4;
          add(t.x, t.y, t.x + t.w, t.y, a, e, 1, k);
          add(t.x + t.w, t.y, t.x + t.w, t.y + t.h, a + e, e, 1, k);
          add(t.x + t.w, t.y + t.h, t.x, t.y + t.h, a + 2 * e, e, 1, k);
          add(t.x, t.y + t.h, t.x, t.y, a + 3 * e, e, 1, k);
          bars[k].forEach((b, i) => add(b.x, b.y + 3.5, b.x + b.w, b.y + 3.5, a + 4 * e + i * 0.02, 0.05, 2, k));
        });
        const my = (IN.y + Y(BAR)) / 2;
        add(IN.x, Y(BAR), IN.x + IN.w, Y(BAR), S0 + 0.1, 0.08, 1, 'b');
        for (let i = 0; i < 5; i++) add(IN.x + 16 + i * 16, my, 4, 0, S0 + 0.12 + i * 0.012, 0.04, 3, 'b');
        add(942, my, 978, my, S0 + 0.16, 0.05, 2, 'b');
        for (let i = 0; i < 4; i++) add(IN.x + IN.w - 16 - i * 16, my, 3.5, 0, S0 + 0.17 + i * 0.012, 0.04, 3, 'b');
        // Lettering guides: cap line and baseline across the window, a cell per letter between them.
        const wt = [[S0 + 0.03, on[0] - 0.03], [on[0], on[1] - 0.04], [on[0] + 0.14, on[2] - 0.06]];
        W.forEach((w, k) => {
          const t = tiles[k], [a, b] = wt[k];
          w.ta = a + 0.04;
          w.tb = b;
          if (!w.text) return;
          add(t.x - 10, w.top, t.x + t.w + 10, w.top, a, 0.06, 0, k);
          add(t.x + t.w + 10, w.base, t.x - 10, w.base, a + 0.02, 0.06, 0, k);
          for (let i = 0; i <= w.chars.length; i++) add(w.x + i * w.adv, w.top - 10, w.x + i * w.adv, w.base + 10, a + 0.03 + i * 0.008, 0.04, 0, k);
        });
        // The key word's dimension line, arrow to arrow.
        const k2 = W[2], dy = k2.top - 1.5 * L.ch, x2 = k2.x + k2.w;
        if (k2.text) {
          add(k2.x, dy, x2, dy, on[2] - 0.2, 0.1, 0, 2);
          add(k2.x, dy - 8, k2.x, dy + 8, on[2] - 0.2, 0.03, 1, 2);
          add(x2, dy - 8, x2, dy + 8, on[2] - 0.11, 0.03, 1, 2);
          add(k2.x + 10, dy - 4, k2.x + 1, dy, on[2] - 0.17, 0.02, 1, 2);
          add(k2.x + 10, dy + 4, k2.x + 1, dy, on[2] - 0.16, 0.02, 1, 2);
          add(x2 - 10, dy - 4, x2 - 1, dy, on[2] - 0.1, 0.02, 1, 2);
          add(x2 - 10, dy + 4, x2 - 1, dy, on[2] - 0.09, 0.02, 1, 2);
        }
        return { ok: document.fonts.check(font(800, 100)), tiles, W, at, atMax, die, cells, bars, ST };
      };

      // ---- drawing helpers ----
      /** The home lattice as 1px lines, exactly as the grid handoff draws it. */
      const lines = (ctx, dpr) => {
        const snap = (v) => Math.round(v * dpr) / dpr;
        for (let col = L.cMin; col <= L.cMin + L.cols; col++) ctx.fillRect(snap(L.x0 + col * L.cw), 0, 1, 1080);
        for (let row = L.rMin; row <= L.rMin + L.rows; row++) ctx.fillRect(0, snap(L.y0 + row * L.ch), 1920, 1);
      };
      /** The same lines, only where they cross the ring r1..r2 around the frame's centre, in one ink. */
      const ring = (ctx, dpr, r1, r2, color) => {
        r1 = Math.max(0, r1);
        if (r2 <= r1) return;
        const snap = (v) => Math.round(v * dpr) / dpr;
        // Half-chords of the outer and inner circles at distance d from the centre.
        const chord = (d) => [d < r2 ? Math.sqrt(r2 * r2 - d * d) : -1, d < r1 ? Math.sqrt(r1 * r1 - d * d) : 0];
        ctx.fillStyle = color;
        for (let col = L.cMin; col <= L.cMin + L.cols; col++) {
          const x = snap(L.x0 + col * L.cw), [h2, h1] = chord(Math.abs(x + 0.5 - 960));
          if (h2 < 0) continue;
          const a = Math.max(0, 540 - h2), b = Math.min(1080, 540 + h2);
          if (h1 > 0) {
            ctx.fillRect(x, a, 1, 540 - h1 - a);
            ctx.fillRect(x, 540 + h1, 1, b - 540 - h1);
          } else ctx.fillRect(x, a, 1, b - a);
        }
        for (let row = L.rMin; row <= L.rMin + L.rows; row++) {
          const y = snap(L.y0 + row * L.ch), [h2, h1] = chord(Math.abs(y + 0.5 - 540));
          if (h2 < 0) continue;
          const a = Math.max(0, 960 - h2), b = Math.min(1920, 960 + h2);
          if (h1 > 0) {
            ctx.fillRect(a, y, 960 - h1 - a, 1);
            ctx.fillRect(960 + h1, y, b - 960 - h1, 1);
          } else ctx.fillRect(a, y, b - a, 1);
        }
      };
      // The shockwave's bands, inside out, as distances behind its front: the grid's ink, warming to crest at the front.
      const WAVE = [
        [1e5, 320, th['border-subtle']],
        [320, 210, OM.mix(th['border-subtle'], ink.mid, 0.45)],
        [210, 120, ink.mid],
        [120, 50, ink.lit],
        [50, 15, ink.hover],
        [15, 0, ink.crest],
      ];
      let edges = null;
      const makeEdges = (dpr) => {
        const sx = new Float64Array(NC + 1), sy = new Float64Array(NR + 1);
        for (let i = 0; i <= NC; i++) sx[i] = Math.round(X(CS0 + i) * dpr) / dpr;
        for (let j = 0; j <= NR; j++) sy[j] = Math.round(Y(RS0 + j) * dpr) / dpr;
        return { dpr, sx, sy };
      };
      /** Rows of consecutive cells whose time has come, merged into runs. */
      const runs = (grid, T, fn) => {
        const { sx, sy } = edges;
        for (let j = 0; j < NR; j++) {
          const row = j * NC;
          for (let i = 0; i < NC; i++) {
            if (grid[row + i] > T) continue;
            let e = i;
            while (e + 1 < NC && grid[row + e + 1] <= T) e++;
            fn(sx[i], sy[j], sx[e + 1] - sx[i], sy[j + 1] - sy[j]);
            i = e;
          }
        }
      };
      /** Cells inside their [t, t + life) window, with age 0..1. */
      const flashes = (ctx, grid, T, life, alpha, color) => {
        const { sx, sy } = edges;
        ctx.fillStyle = color;
        for (let q = 0; q < NC * NR; q++) {
          const a = (T - grid[q]) / life;
          if (a < 0 || a >= 1) continue;
          const i = q % NC, j = (q - i) / NC;
          ctx.globalAlpha = alpha * (1 - a);
          ctx.fillRect(sx[i] + 1, sy[j] + 1, sx[i + 1] - sx[i] - 1, sy[j + 1] - sy[j] - 1);
        }
        ctx.globalAlpha = 1;
      };

      const STY = [
        { c: th['border-strong'], w: 1, a: 0.85 },
        { c: th['text-muted'], w: 1.5, a: 0.85 },
        { c: th['text-muted'], w: 1.2, a: 0.6 },
        { c: th['text-muted'], w: 1.2, a: 0.75 },
      ];
      /** One graphite stroke drawn to fraction p: wobbly, overshooting its ends, boiling at 12 fps. */
      const stroke = (ctx, s, p, bf, seed) => {
        ctx.beginPath();
        if (s.kind === 3) {
          const a0 = 6.283 * OM.hash(seed, 7);
          ctx.arc(s.x1 + (OM.hash(seed, bf, 3) - 0.5) * 1.2, s.y1 + (OM.hash(seed, bf, 4) - 0.5) * 1.2, s.x2, a0, a0 + p * 6.283 * 1.1);
          ctx.stroke();
          return;
        }
        const dx = s.x2 - s.x1, dy = s.y2 - s.y1, len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const pen = s.kind > 0, scr = s.kind === 2;
        const o1 = s.kind === 1 ? 3 + 9 * OM.hash(seed, 1) : 0, o2 = s.kind === 1 ? 3 + 9 * OM.hash(seed, 2) : 0;
        const total = len + o1 + o2;
        const amp = scr ? 2.6 : pen ? 1.3 : 0.35, f1 = scr ? 0.7 : 0.021, f2 = scr ? 1.9 : 0.067;
        const ph1 = 6.283 * OM.hash(seed, bf, 3), ph2 = 6.283 * OM.hash(seed, bf, 4);
        const bow = pen && !scr ? (OM.hash(seed, 5) - 0.5) * 3 : 0;
        const n = Math.max(2, Math.ceil(total / (scr ? 3 : 14))), m = p * n;
        for (let i = 0; i <= Math.ceil(m); i++) {
          const d = (Math.min(i, m) / n) * total;
          const off = amp * (0.6 * Math.sin(d * f1 + ph1) + 0.4 * Math.sin(d * f2 + ph2)) + bow * Math.sin((Math.PI * d) / total);
          const x = s.x1 + ux * (d - o1) - uy * off, y = s.y1 + uy * (d - o1) + ux * off;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      };
      const groupA = (g, T) =>
        g === 'g' ? 1 - OM.smooth(OM.prog(T, on[2], on[2] + 0.3))
        : g === 'b' ? 1 - OM.smooth(OM.prog(T, KICK1 + 0.08, KICK1 + 0.28))
        : 1 - OM.smooth(OM.prog(T, on[g] + 0.5 * D[g], on[g] + D[g] + 0.06));

      /** A word as hollow hand lettering, each letter's outline tracing itself, a little off the grid. */
      const hollow = (ctx, w, T, bf) => {
        const n = w.chars.length;
        if (!n || T < w.ta || T >= w.t0) return;
        const span = w.tb - w.ta, per = Math.min(0.14, span * 0.55), st = n > 1 ? (span - per) / (n - 1) : 0;
        ctx.font = font(800, w.s);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.strokeStyle = th['text-muted'];
        for (let pass = 0; pass < 2; pass++) {
          ctx.lineWidth = pass ? 1 : 1.6;
          ctx.globalAlpha = pass ? 0.35 : 0.9;
          for (let i = 0; i < n; i++) {
            const p = OM.clamp((T - w.ta - i * st) / per - pass * 0.3);
            if (p <= 0 || w.chars[i] === ' ') continue;
            const id = w.k * 31 + i;
            ctx.save();
            ctx.translate(
              w.x + i * w.adv + (OM.hash(id, 1, 9) - 0.5) * 5 + (OM.hash(id, bf, 21 + pass) - 0.5) * 1.6 + pass * 1.4,
              w.base + (OM.hash(id, 2, 9) - 0.5) * 4 + (OM.hash(id, bf, 23 + pass) - 0.5) * 1.6 - pass,
            );
            ctx.rotate((OM.hash(id, 3, 9) - 0.5) * 0.05);
            ctx.setLineDash(p < 1 ? [p * 4 * w.s, 1e5] : []);
            ctx.strokeText(w.chars[i], 0, 0);
            ctx.restore();
          }
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      };

      /** A word inked: crisp crest-to-hover letters, snapping in from the sketch with a flash and a glow. */
      const inked = (ctx, w, T, dpr, amp, cool) => {
        const age = T - w.t0;
        const flash = Math.pow(0.5, age / 0.06);
        const sc = 1 + (w.k === 2 ? 0.05 : 0.04) * (1 - OM.ease.outCubic(OM.clamp(age / 0.16)));
        ctx.save();
        ctx.translate(w.cx, w.cy);
        ctx.scale(sc, sc);
        ctx.translate(-w.cx, -w.cy);
        // The downbeat's polish: the glow swells (amp) and a glint runs across the line, word after word,
        // a pool of light sliding behind the letters with it.
        // ponytail: no shadowed second fill for the glint, it doubled the frame cost.
        const u = OM.ease.outCubic(OM.prog(T, DOWN + w.k * 0.05, DOWN + w.k * 0.05 + 0.36)) * 1.36 - 0.18;
        const glint = T >= DOWN + w.k * 0.05 && u < 1.18;
        if (glint) {
          const px = w.x - w.cap * 0.4 + (w.w + w.cap * 0.8) * u, r = w.cap * 1.2;
          const pg = ctx.createRadialGradient(px, w.cy, 0, px, w.cy, r);
          pg.addColorStop(0, rgba(ink.lit, 0.4 * Math.sin(Math.PI * OM.clamp((u + 0.18) / 1.36))));
          pg.addColorStop(1, rgba(ink.lit, 0));
          ctx.fillStyle = pg;
          ctx.save();
          ctx.beginPath();
          ctx.rect(w.t.x + 2, w.t.y + 2, w.t.w - 4, w.t.h - 4); // the light stays inside its window
          ctx.clip();
          ctx.fillRect(px - r, w.cy - r, 2 * r, 2 * r);
          ctx.restore();
        }
        // The word in Omarchy lattice type: crest-topped squares on the 9 px pitch, a soft pool of its light behind.
        if (!w.lt || w.lt.ok !== lay.ok) w.lt = Object.assign(OM.c1.type(w.text, w.x, w.base, w.cap), { ok: lay.ok });
        const ga = Math.min(1, (0.3 + 0.35 * flash + amp) * cool);
        const pg = ctx.createRadialGradient(w.cx, w.cy, 0, w.cx, w.cy, w.w * 0.6 + w.cap);
        pg.addColorStop(0, rgba(ink.lit, 0.22 * ga));
        pg.addColorStop(1, rgba(ink.lit, 0));
        ctx.fillStyle = pg;
        ctx.fillRect(w.cx - w.w, w.cy - w.w, 2 * w.w, 2 * w.w);
        const gx = glint ? w.x - w.cap * 0.4 + (w.w + w.cap * 0.8) * u : -1e9, gw = 0.09 * (w.w + w.cap * 0.8);
        for (const [x, y, f] of w.lt.cells) {
          ctx.fillStyle = flash > 0.5 || Math.abs(x + 4 - gx) < gw ? ink.crest : OM.c1.typeInk(f, ink);
          ctx.fillRect(x, y, 8, 8);
        }
        ctx.restore();
      };

      /** The finished desktop: ground, waybar, windows with their contents. */
      const ui = (ctx, T, lay, snap) => {
        ctx.fillStyle = th['bg-deep'];
        ctx.fillRect(IN.x, IN.y, IN.w, IN.h);
        const by = snap(Y(BAR)), my = (IN.y + by) / 2 + 0.5;
        ctx.fillStyle = th.bg;
        ctx.fillRect(IN.x, IN.y, IN.w, by - IN.y);
        ctx.font = font(600, 11);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i ? th['text-muted'] : th.text;
          ctx.fillText(String(i + 1), IN.x + 16 + i * 16, my);
        }
        ctx.fillStyle = th.text;
        ctx.fillText('20:41', 960, my);
        ctx.fillStyle = th['text-secondary'];
        for (let i = 0; i < 4; i++) ctx.fillRect(IN.x + IN.w - 19.5 - i * 16, my - 3.5, 7, 7);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        const act = OM.hitCount(on, T) - 1;
        lay.tiles.forEach((t, k) => {
          const x = snap(t.x), y = snap(t.y), w = snap(t.x + t.w) - x, h = snap(t.y + t.h) - y;
          ctx.fillStyle = k === act ? th.brand : th['border-strong'];
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = th.bg;
          ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
          for (const b of lay.bars[k]) {
            ctx.fillStyle = b.c;
            ctx.fillRect(b.x, b.y, b.w, 7);
          }
        });
      };

      let lay = null;
      // ---- camera: a tracking pan along the sheet, leaning toward each window as its word inks ----
      const look = (T) => {
        const e = OM.post.envelope(T, start, END, { ramp: 0.45, hold: HOLD });
        let x = 0;
        if (lay) {
          const lean = (k) => -0.085 * (lay.tiles[k].x + lay.tiles[k].w / 2 - 960);
          x = lean(0) * OM.smooth(OM.prog(T, S0, on[0] + 0.1));
          for (let k = 1; k < 3; k++) x += (lean(k) - lean(k - 1)) * OM.smooth(OM.prog(T, on[k] - 0.12, on[k] + 0.32));
          x -= lean(2) * OM.smooth(OM.prog(T, KICK2, KICK2 + 0.5));
        }
        x *= e;
        // The key word's punch: a quick push in on its onset, the scene's biggest camera move.
        const a = T - on[2], kp = a < 0 ? 0 : (1 - Math.exp(-a / 0.015)) * Math.exp(-a / 0.14);
        const zoom = (1 + 0.012 * e + 0.055 * e * kp) * OM.c1.cover(0, x, 0);
        const amount = e * (1 - OM.smooth(OM.prog(T, on[0], on[2] + D[2] + 0.25)));
        return { amount, cam: { zoom, rot: 0, x, y: 0 } };
      };
      // ---- extras: pencil shavings drifting down while it is drawn, eraser crumbs where the construction is rubbed out ----
      const crumbs = (ctx, T) => {
        if (!lay) return;
        const shav = 1 - OM.smooth(OM.prog(T, on[2], on[2] + 0.4));
        if (shav > 0) {
          for (let i = 0; i < 14; i++) {
            const h1 = OM.hash(i, 1, 0xc105), h2 = OM.hash(i, 2, 0xc105), t0 = S0 + h2 * (on[2] - S0);
            const a = T - t0;
            if (a < 0 || a > 1.4) continue;
            const x = IN.x + 80 + h1 * (IN.w - 160) + 30 * Math.sin(a * 5 + 7 * h1), y = IN.y + 40 + a * (260 + 140 * h2);
            ctx.save();
            ctx.globalAlpha = 0.75 * shav * Math.min(1, a * 6) * (1 - a / 1.4);
            ctx.translate(x, y);
            ctx.rotate(a * (3 + 4 * h1) + 6 * h2);
            ctx.fillStyle = i % 3 ? th['text-muted'] : ink.dim;
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.quadraticCurveTo(0, -5, 6, 0);
            ctx.lineTo(0, 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
        // Rubbed out: each window's sketch as it renders, the bar on its kick, all the guides on the key word.
        const rub = [...[0, 1, 2].map((k) => [on[k] + 0.5 * D[k], lay.tiles[k], 10]), [KICK1 + 0.08, { x: IN.x, y: IN.y, w: IN.w, h: Y(BAR) - IN.y }, 10], [on[2], IN, 34]];
        rub.forEach(([t0, r, n], j) => {
          for (let i = 0; i < n; i++) {
            const h1 = OM.hash(i, 1, 0xc15 + j), h2 = OM.hash(i, 2, 0xc15 + j), h3 = OM.hash(i, 3, 0xc15 + j);
            const a = T - t0 - 0.25 * h3;
            if (a < 0 || a > 0.6) continue;
            const x = r.x + h1 * r.w + (h2 - 0.5) * 90 * a, y = r.y + h2 * r.h + 600 * a * a - 40 * a;
            ctx.globalAlpha = 0.8 * (1 - a / 0.6);
            ctx.fillStyle = i % 2 ? th['border-strong'] : th['text-muted'];
            const d = 2 + 3 * h3;
            ctx.fillRect(x, y, d, d * 0.8);
          }
        });
        ctx.globalAlpha = 1;
      };
      return OM.c1.post({
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (t < HOLD) return OM.handoff('screen', ctx, T, dpr);
          if (T > END - HOLD) return OM.handoff('grid', ctx, T, dpr);
          if (!lay || (!lay.ok && document.fonts.check(font(800, 100)))) lay = make();
          if (!edges || edges.dpr !== dpr) edges = makeEdges(dpr);
          const snap = (v) => Math.round(v * dpr) / dpr;
          const bf = Math.floor(T * 12);
          const { W, tiles } = lay;

          // The frame as the handoff left it: the field, the screen's face.
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          ctx.fillStyle = th.bg;
          ctx.fillRect(320, 140, 1280, 800);
          ctx.save();
          ctx.beginPath();
          ctx.rect(IN.x, IN.y, IN.w, IN.h);
          ctx.clip();

          // The drafting surface: the home lattice ruled faintly across the face, under everything drawn.
          if (T < lay.atMax) {
            ctx.globalAlpha = OM.smooth(OM.prog(T, S0, S0 + 0.16));
            ctx.fillStyle = th['border-subtle'];
            lines(ctx, dpr);
            ctx.globalAlpha = 1;
          }
          ctx.restore();

          // The pencil.
          if (T < on[2] + D[2] + 0.1) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (const s of lay.ST) {
              const p = OM.clamp((T - s.ta) / s.dur);
              const ga = groupA(s.g, T);
              if (p <= 0 || ga <= 0.003) continue;
              const st = STY[s.kind];
              ctx.strokeStyle = st.c;
              ctx.lineWidth = st.w;
              ctx.globalAlpha = st.a * ga;
              stroke(ctx, s, p, bf, s.seed);
              if (s.kind === 1 && p > 0.2) {
                ctx.globalAlpha = 0.3 * ga;
                ctx.lineWidth = 1;
                stroke(ctx, s, (p - 0.2) / 0.8, bf, s.seed + 977);
              }
            }
            for (const w of W) hollow(ctx, w, T, bf);
            ctx.restore();
          }

          // The render, cell by cell as each word lands, with a faint flash on each cell as it resolves.
          if (T >= on[0]) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(IN.x, IN.y, IN.w, IN.h);
            ctx.clip();
            if (T < lay.atMax) {
              ctx.beginPath();
              runs(lay.at, T, (x, y, w, h) => ctx.rect(x, y, w, h));
              ctx.clip();
            }
            ui(ctx, T, lay, snap);
            ctx.restore();
            if (T < lay.atMax + 0.06) {
              ctx.save();
              ctx.beginPath();
              ctx.rect(IN.x, IN.y, IN.w, IN.h);
              ctx.clip();
              flashes(ctx, lay.at, T, 0.06, 0.4, ink.lit);
              ctx.restore();
            }
          }

          // The screen's border lights when the render completes; the active window glows.
          const done = OM.smooth(OM.prog(T, on[2], on[2] + 0.25)) * (1 - OM.smooth(OM.prog(T, KICK2, KICK2 + 0.25)));
          const dp = OM.pulse([DOWN], T, 0.12) * (T < KICK2 ? 1 : 0);
          ctx.save();
          ctx.strokeStyle = OM.mix(OM.mix(ink.mid, ink.lit, done), ink.crest, dp);
          ctx.lineWidth = 2;
          if (done > 0.01) {
            ctx.shadowColor = rgba(ink.lit, 0.5 * done);
            ctx.shadowBlur = 8 * dpr;
          }
          ctx.strokeRect(321, 141, 1278, 798);
          const act = OM.hitCount(on, T) - 1;
          const fade = 1 - OM.smooth(OM.prog(T, KICK2, KICK2 + 0.3));
          if (act >= 0 && T >= on[act] + D[act] && fade > 0) {
            const tl = tiles[act], x = snap(tl.x), y = snap(tl.y);
            ctx.strokeStyle = OM.mix(th.brand, ink.crest, dp);
            ctx.shadowColor = rgba(ink.lit, Math.min(1, (0.55 + 0.4 * dp) * fade));
            ctx.shadowBlur = 10 * dpr;
            ctx.strokeRect(x + 1, y + 1, snap(tl.x + tl.w) - x - 2, snap(tl.y + tl.h) - y - 2);
          }
          ctx.restore();

          // The resolve: the render's cells pop out, edges first.
          if (T >= KICK2) {
            ctx.fillStyle = ink.bg;
            runs(lay.die, T, (x, y, w, h) => ctx.fillRect(x, y, w, h));
          }
          // Pause sprinkle, lattice aftershock: the 100.206 kick shakes the ruled lattice once more, under the letters.
          const shock = T >= SHOCK && T < SHOCK + 0.28 ? Math.pow(0.5, (T - SHOCK) / 0.06) : 0;
          if (shock > 0.03) {
            ctx.globalAlpha = 0.8 * shock;
            ctx.fillStyle = ink.mid;
            lines(ctx, dpr);
            ctx.globalAlpha = 1;
          }

          // The words.
          if (T < SNARE) {
            for (const w of W) {
              const age = T - w.t0;
              if (!w.text || age < 0 || age >= 0.2) continue;
              // The construction guides snap in to the letters as they ink.
              const tl = tiles[w.k], e = OM.ease.outExpo(age / 0.2);
              const xa = OM.lerp(tl.x + 4, w.x, e), xb = OM.lerp(tl.x + tl.w - 4, w.x + w.w, e);
              ctx.globalAlpha = 1 - age / 0.2;
              ctx.fillStyle = ink.lit;
              ctx.fillRect(xa, snap(w.top) - 2, xb - xa, 2);
              ctx.fillRect(xa, snap(w.base), xb - xa, 2);
              ctx.globalAlpha = 1;
            }
            const amp = 0.3 * OM.pulse([KICK1], T, 0.1) + 0.45 * OM.pulse([DOWN], T, 0.14) + 0.15 * OM.audio(T).kick;
            const cool = 1 - 0.7 * OM.prog(T, KICK2, SNARE);
            for (const w of W) if (w.text && T >= w.t0) inked(ctx, w, T, dpr, amp, cool);
          } else {
            for (const cl of lay.cells)
              if (T < cl.die) {
                ctx.fillStyle = cl.ink;
                OM.cell(ctx, L, cl.col, cl.row, dpr);
              }
          }

          if (T >= KICK2) {
            // The lattice cuts through everything: a shockwave from the centre, cooling behind its front to the grid's ink.
            const R = 1500 * OM.ease.outExpo(OM.prog(T, KICK2, KICK2 + 0.6));
            if (R - WAVE[1][0] < 1102) for (const [d0, d1, col] of WAVE) ring(ctx, dpr, R - d0, R - d1, col);
            else {
              ctx.fillStyle = th['border-subtle'];
              lines(ctx, dpr);
            }
            flashes(ctx, lay.die, T, 0.05, 0.4, ink.lit);
            // Each letter cell hollows into its own four lattice lines and cools into the grid.
            for (const cl of lay.cells) {
              const a = (T - cl.die) / 0.1;
              if (a < 0 || a >= 1) continue;
              ctx.fillStyle = OM.mix(ink.crest, th['border-subtle'], OM.ease.outCubic(a));
              const x = snap(X(cl.col)), x2 = snap(X(cl.col + 1)), y = snap(Y(cl.row)), y2 = snap(Y(cl.row + 1));
              ctx.fillRect(x, y, x2 - x + 1, 1);
              ctx.fillRect(x, y2, x2 - x + 1, 1);
              ctx.fillRect(x, y, 1, y2 - y + 1);
              ctx.fillRect(x2, y, 1, y2 - y + 1);
            }
          }
          crumbs(ctx, T);
        },
        release: () => c.release(),
      }, fx, look);
    },
  });
})();
