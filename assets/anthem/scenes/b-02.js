// b-02 · The wall of screens. The spark is the first screen: one tiny
// display at the centre of the home lattice. Then the dark fills with screens,
// every lattice cell a display that boots with a crest flash and settles into
// its glass. Each word is a crowd of screens booting at once, swept left to
// right from its onset, so the line is spelled by machines coming on; around
// it strangers' screens light ever faster until the dark is full. The snares
// flicker the whole wall. Then every lit screen drops into the centre row,
// column by column, and the row closes into one crest line: the road's first strip.

// Edit camera: the backbeat jolts carry this line's two turns, the last word booting 41 ms
// after the 199.209 beat and the wall dropping on the 200.276 snare, so the
// jolt and roll are raised from the section's 6 px / 0.004 rad to read on them.
OM.edit.plan('b-02', { back: 10, roll: 0.006 });

OM.ownWords.add('b-02');
OM.scene({
  id: 'b-02',
  build(el, { start, duration }) {
    const B = OM.bridge;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 base = src(q);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    float a = float(i) * 0.6283;
    vec2 o = vec2(cos(a) / 1920.0, sin(a) / 1080.0) * (6.0 + 6.0 * float(i % 2));
    b += max(src(q + o).rgb - 0.42, 0.0);
  }
  b /= 10.0;
  vec2 cell = floor(q * vec2(131.0, 75.5));
  float fl = 0.55 + 0.9 * hash(cell + floor(uTime * 14.0));
  vec3 glow = b * vec3(0.62, 0.81, 0.42) * 1.8 * fl;
  return mix(base, vec4(base.rgb + glow, 1.0), uAmount);
}` });
    const END = start + duration;
    const L = OM.HOME;
    const ink = OM.fieldInks('tokyo-night');
    const th = OM.theme('tokyo-night');
    const sung = OM.sung('b-02');
    // The first word is sung 14 ms after the cut: it lands on its onset, held off only past the
    // seam frames (the bridge's usual 50 ms guard would boot it two frames late).
    const on = sung.map((w) => Math.max(w.t0, start + 0.013));
    // The wall flickers on the snares, at their measured onsets.
    const SNARES = [197.857, 198.275, 198.67, 198.902, 199.993].map((t) => B.onDrum(t, 'snare'));
    const DROP = 200.25, CLOSE = 200.9;
    const HITS = [199.99, 200.27, 200.53, 200.92].map((t) => B.onDrum(t, 'snare')); // the refresh rows, on the snares
    const LAST_KICK = B.onDrum(201.09, 'kick');
    const SR = B.SPARK.row, SC = B.SPARK.col;
    const C0 = L.cMin, C1 = L.cMin + L.cols;

    const lay = B.lazy(() => {
      const set = B.set(sung, { weight: 800, cap: 136, minCap: 96, maxW: 1600, cy: 530, lead: 1.3 });
      const taken = new Set();
      // The first screens are b-01's drums, already landed and glowing when the line begins.
      const screens = B.bootList().map((d) => ({ col: d.col, row: d.row, at: start - 1, word: false, k: -1, boot: true }));
      for (const s of screens) taken.add(s.col + ',' + s.row);
      set.words.forEach((w) => {
        const cells = B.cells(w, set, L);
        const x0 = Math.min(...cells.map((q) => q[0])), x1 = Math.max(...cells.map((q) => q[0]));
        for (const [col, row] of cells) {
          taken.add(col + ',' + row);
          // Booted in a quick left-to-right sweep from the onset, a little scatter per cell:
          // the whole word is on within about four frames.
          const at = on[w.k] + 0.065 * ((col - x0) / Math.max(1, x1 - x0)) + 0.012 * OM.hash(col, row, 5);
          screens.push({ col, row, at, word: true, k: w.k });
        }
      });
      // Strangers' screens: ignition accelerates through the line until the dark is full.
      const rng = OM.rng(2202);
      const n = 1100;
      for (let i = 0; i < n; i++) {
        const col = C0 + Math.floor(rng() * L.cols), row = L.rMin + Math.floor(rng() * L.rows);
        if (taken.has(col + ',' + row)) continue;
        taken.add(col + ',' + row);
        const u = Math.pow(i / n, 0.55);
        screens.push({ col, row, at: start + 0.25 + u * (DROP - start - 0.45), word: false, k: -1 });
      }
      // Each column's lit screens drop into the centre row, the far columns last.
      for (const s of screens) s.drop = DROP + 0.32 * (Math.abs(s.col - SC) / (L.cols / 2)) + 0.06 * OM.hash(s.col, s.row, 9);
      return { set, screens };
    });

    const screen = B.screen;

    return {
      draw(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T >= END - 0.1) return OM.handoff('line', ctx, T, dpr);
        if (T < Math.min(start + 0.05, on[0])) return B.bootCut(ctx, T, dpr);
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const { screens } = lay();
        const flick = OM.pulse(SNARES, T, 0.06);
        const snap = (v) => Math.round(v * dpr) / dpr;
        const cw = L.cw, ch = L.ch;
        for (const s of screens) {
          if (T < s.at) continue;
          const age = T - s.at;
          const d = OM.ease.inCubic(OM.prog(T, s.drop, s.drop + 0.34));
          const row = OM.lerp(s.row, SR, d);
          const x = snap(L.x0 + s.col * cw), y = snap(L.y0 + row * ch);
          if (d >= 1) { ctx.fillStyle = ink.crest; ctx.fillRect(x, y, snap(L.x0 + (s.col + 1) * cw) - x, snap(L.y0 + (SR + 1) * ch) - snap(L.y0 + SR * ch)); continue; }
          // Booting: a crest flash, then the frame cools and the glass holds its ink.
          const boot = Math.exp(-age / (s.word ? 0.12 : 0.08));
          let glass, frame;
          if (s.word) {
            // Word screens burn solid: the whole face lit, only a hairline between neighbours.
            glass = OM.mix(ink.hover, ink.crest, Math.max(boot, 0.35 + 0.65 * flick));
            frame = glass;
          } else {
            const deep = OM.hash(s.col, s.row, 3) < 0.6;
            glass = s.boot ? OM.mix(B.bootGlass(s.col, s.row), ink.crest, 0.4 * flick) : OM.mix(deep ? ink.dim : ink.mid, ink.lit, Math.max(boot, 0.4 * flick));
            frame = OM.mix(th.surface, ink.mid, boot);
          }
          if (d > 0) { glass = OM.mix(glass, ink.crest, d); frame = glass; }
          screen(ctx, x, y, cw, ch, frame, glass);
        }
        // The row closes outward from the centre into one crest line.
        const close = OM.ease.inOutCubic(OM.prog(T, CLOSE, END - 0.12));
        if (close > 0) {
          const reach = close * (L.cols / 2 + 2);
          ctx.fillStyle = ink.crest;
          for (let col = C0; col < C1; col++) if (Math.abs(col - SC) <= reach) OM.cell(ctx, L, col, SR, dpr);
        }
      },
      render(t, T) {
          this.draw(t, T);
          const e = B.env(T, start, END);
          const ctx = c.ensure();
          ctx.globalAlpha = 1;
          if (e > 0) {

            // Refresh Rows: on each snare a band of strangers' screens re-boots crest as the wall drops.
            {
              const { screens } = lay();
              const ik = OM.fieldInks('tokyo-night'), L = OM.HOME;
              HITS.forEach((h, hi) => {
                const a = T - h;
                if (a < 0 || a > 0.16) return;
                ctx.fillStyle = ik.crest;
                ctx.globalAlpha = e * (1 - a / 0.16);
                for (const s of screens) {
                  if (s.word || T < s.at || OM.hash(s.col, s.row, 31 + hi) > 0.22) continue;
                  const d = OM.ease.inCubic(OM.prog(T, s.drop, s.drop + 0.34));
                  if (d >= 1) continue;
                  const row = OM.lerp(s.row, SR, d);
                  ctx.fillRect(L.x0 + s.col * L.cw + 3, L.y0 + row * L.ch + 3, L.cw - 6, L.ch - 6);
                }
              });
              // Line Pips: the closed line throws cells off its edges on the last kick.
              const a = T - LAST_KICK;
              if (a >= 0 && a < 0.09) {
                ctx.globalAlpha = e * (1 - a / 0.09);
                ctx.fillStyle = ik.hover;
                for (let col = C0; col < C1; col++) if (OM.hash(col, 5, 77) < 0.12) {
                  const off = 1 + Math.round(a * 30);
                  ctx.fillRect(L.x0 + col * L.cw + 3, L.y0 + (SR - off) * L.ch + 3, L.cw - 6, L.ch - 6);
                  ctx.fillRect(L.x0 + col * L.cw + 3, L.y0 + (SR + off) * L.ch + 3, L.cw - 6, L.ch - 6);
                }
              }
              ctx.globalAlpha = 1;
            }

            const { screens } = lay();
            const ik = OM.fieldInks('tokyo-night');
            const L = OM.HOME;
            // Power-on sparkles: a four-point glint on every few booting word screens.
            ctx.fillStyle = ik.crest;
            for (let i = 0; i < screens.length; i += 7) {
              const s = screens[i];
              const a = T - s.at;
              if (!s.word || a < 0 || a > 0.22) continue;
              const x = L.x0 + (s.col + 0.5) * L.cw, y = L.y0 + (s.row + 0.5) * L.ch;
              const z = 14 * (1 - a / 0.22);
              ctx.globalAlpha = e * (1 - a / 0.22);
              ctx.fillRect(x - z, y - 1, 2 * z, 2);
              ctx.fillRect(x - 1, y - z, 2, 2 * z);
            }
          }
          ctx.globalAlpha = 1;
          fx.apply(T, {
            amount: e * 0.9,
            cam: { zoom: 1 + e * (0.025 + 0.045 * (1 - OM.smooth(OM.prog(T, start + 0.4, END - 0.6)))), x: e * 14 * Math.sin(T * 1.3), y: e * 10 * Math.sin(T * 0.9 + 1) },
          });
        },
        release: () => { fx.release(); c.release(); },
    };
  },
});
