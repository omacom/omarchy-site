// b-06 · Passing the flame. The surge's glow draws down into one small flame.
// Under every letter of the line stands a candle, unseen [line]; the
// flame is passed candle to candle, a spark leaping from the last candle of one
// word to the first of the next and arriving on its onset, and each candle that
// catches lights its own letter above it, the cells nearest the flame burning
// crest. The key word is passed slowly, a chain of flames along its whole hold.
// The flames duck and flare on every hard stop of the music. Then the flames
// rise off the wicks together and the room becomes one lamp's light: the spot.

// Edit camera: the defaults fit. The scene's own camera never moves on the drums (the flames
// duck and the exposure flares on the stops, as elements), and the key word's ember bloom
// (214.685) falls between beats, just as the 214.500 downbeat punch settles, so nothing stacks.
OM.edit.plan('b-06', {});

OM.ownWords.add('b-06');
OM.scene({
  id: 'b-06',
  build(el, { start, duration }) {
    const B = OM.bridge;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 base = src(q);
  float f = 0.5 * vnoise(vec2(uTime * 7.0, 1.3)) + 0.5 * vnoise(vec2(uTime * 13.0, 4.1));
  float ex = 1.0 + (f - 0.5) * 0.3 + uP0.x * 0.22;
  vec3 h = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236;
    vec2 o = vec2(cos(a) / 1920.0, sin(a) / 1080.0) * (8.0 + 10.0 * float(i % 2));
    h += max(src(q + o).rgb - 0.5, 0.0);
  }
  h /= 12.0;
  vec3 col = base.rgb * ex + h * vec3(0.73, 0.87, 0.59) * 1.3;
  return mix(base, vec4(col, 1.0), uAmount);
}` });
    const END = start + duration;
    const ink = OM.fieldInks('tokyo-night');
    const th = OM.theme('tokyo-night');
    const H = B.sub(2);
    const sung = OM.sung('b-06');
    const on = sung.map((w) => B.land(w.t0, start));
    const K = 1;
    // The hard stops as measured, then the two kicks on their measured onsets (216.518, 216.808).
    const STOPS = [214.506, 215.017, 215.179, 215.295, 215.412, 215.551, ...[216.549, 216.805].map((t) => B.onDrum(t, 'kick'))];
    const beat = OM.edit.scene(start, END);
    const RISE = 217.12;

    const lay = B.lazy(() => {
      const set = B.set(sung, B.CANDLE_SET);
      const candles = [];
      set.words.forEach((w) => {
        const cells = B.cells(w, set, H);
        const n = w.text.length;
        // The key word is passed along its hold; the others catch in a quick run (the word is lit within about seven frames).
        const span = w.k === K ? Math.min(0.9, (sung[K].t1 - sung[K].t0) * 0.6) : Math.min(0.12, 0.03 * n);
        for (let j = 0; j < n; j++)
          candles.push({
            k: w.k, j,
            x: w.x + (j + 0.5) * set.adv, top: w.y + set.size * 0.36,
            at: on[w.k] + (n > 1 ? (span * j) / (n - 1) : 0),
            cells: cells.filter((q) => q[2] === j),
          });
      });
      // Each letter's cells and a one-cell margin round them, keyed to when the letter lights:
      // a flaring flame burns behind its lit letters, never over them.
      const near = new Map();
      for (const cd of candles)
        for (const [q, r] of cd.cells)
          for (let dq = -1; dq <= 1; dq++)
            for (let dr = -1; dr <= 1; dr++) {
              const key = (q + dq) * 8192 + r + dr;
              if (!(near.get(key) <= cd.at)) near.set(key, cd.at);
            }
      return { set, candles, near };
    });
    const flick = (i, T) => 0.85 + 0.15 * Math.sin(T * 23 + i * 1.7) * Math.sin(T * 9.3 + i * 0.6);
    const flame = (ctx, x, y, s, a, near, T) => {
      if (s <= 0 || a <= 0) return;
      ctx.globalAlpha = a;
      B.pool(ctx, x, y - 14 * s, 70 * s, ink.lit, 0.35);
      const P = 4;
      // A lattice flame: rows narrowing upward, crest at the heart. Above its resting size it
      // grows as one shape, round foot and all; below it, it narrows faster than it shortens.
      const rows = Math.round(7 * s), g = Math.min(1, s), b = Math.max(1, s), foot = Math.round(2 * b);
      for (let r = 0; r < rows; r++) {
        const half = Math.max(0, Math.round((r < foot ? r + b : rows - r) * 0.8 * g));
        for (let q = -half; q <= half; q++) {
          const px = Math.round(x + q * P - P / 2), py = Math.round(y - (r + 1) * P);
          if (near && near.get(Math.floor((px + P / 2 - H.x0) / H.cw) * 8192 + Math.floor((py + P / 2 - H.y0) / H.ch)) <= T) continue;
          ctx.fillStyle = Math.abs(q) < half * 0.5 && r < rows - 2 ? ink.crest : r > rows - 3 ? ink.lit : ink.hover;
          ctx.fillRect(px, py, P, P);
        }
      }
      ctx.globalAlpha = 1;
    };
    const spot = (ctx, a) => {
      if (a <= 0) return;
      ctx.globalAlpha = a;
      const g = ctx.createLinearGradient(0, 0, 0, 880);
      g.addColorStop(0, B.rgba(ink.lit, 0.1));
      g.addColorStop(1, B.rgba(ink.lit, 0.03));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(900, 0); ctx.lineTo(1020, 0); ctx.lineTo(1400, 880); ctx.lineTo(520, 880);
      ctx.closePath();
      ctx.fill();
      ctx.save();
      ctx.translate(960, 880);
      ctx.scale(1, 110 / 440);
      const p = ctx.createRadialGradient(0, 0, 0, 0, 0, 440);
      p.addColorStop(0, B.rgba(ink.lit, 0.42));
      p.addColorStop(1, B.rgba(ink.lit, 0));
      ctx.fillStyle = p;
      ctx.fillRect(-440, -440, 880, 880);
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    return {
      draw(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T >= END - 0.1) return OM.handoff('spot', ctx, T, dpr);
        // In from the wax cut: the unlit row, and the drop of light on its way to the first wick.
        if (T < on[0]) return B.waxCut(ctx, T);
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const { set, candles, near } = lay();
        const first = candles[0];
        const rise = OM.ease.inCubic(OM.prog(T, RISE, RISE + 0.45));
        const keep = 1 - OM.prog(T, RISE + 0.1, END - 0.16);
        spot(ctx, OM.ease.inOutCubic(OM.prog(T, RISE + 0.05, END - 0.12)));

        // The glow draws down into the first flame.
        const duck = OM.pulse(STOPS, T, 0.08);
        candles.forEach((cd, i) => {
          const lit = T >= cd.at;
          // The spark leaping from the previous candle, landing as this one catches.
          const prev = candles[i - 1];
          if (prev && cd.j === 0 && T < cd.at && T > cd.at - 0.2) {
            const u = OM.ease.inOutCubic(OM.prog(T, cd.at - 0.2, cd.at));
            const x = OM.lerp(prev.x, cd.x, u), y = OM.lerp(prev.top - 20, cd.top - 20, u) - Math.sin(u * Math.PI) * 120;
            ctx.globalAlpha = keep;
            B.pool(ctx, x, y, 40, ink.hover, 0.6);
            ctx.fillStyle = ink.crest;
            ctx.fillRect(x - 4, y - 4, 8, 8);
            ctx.globalAlpha = 1;
          }
          const age = T - cd.at;
          const catchF = lit ? Math.exp(-age / 0.18) : 0;
          // Ember Bloom: the key word's first flame bursts to three times its size as it catches.
          const bloom = cd.k === K && cd.j === 0 && lit ? 2.2 * Math.exp(-age / 0.09) : 0;
          const s = lit ? (1 + 0.8 * catchF + bloom) * flick(i, T) * (1 - 0.35 * duck) + 0.5 * duck * (T > 214.5 ? 1 : 0) : 0;
          // The candle body, lit by its own flame.
          ctx.globalAlpha = keep;
          const bw = Math.max(14, set.adv * 0.34), bh = set.cap * 0.95;
          ctx.fillStyle = lit ? OM.mix(th['surface-2'], th['text-secondary'], 0.35 + 0.3 * catchF) : B.WAX;
          ctx.fillRect(cd.x - bw / 2, cd.top, bw, bh);
          ctx.fillStyle = th['border-strong'];
          ctx.fillRect(cd.x - 1, cd.top - 8, 2, 8);
          if (!lit) return;
          // The letter above, burning by its nearness to the flame.
          const fx = cd.x, fy = cd.top - 16;
          for (const [q, r] of cd.cells) {
            const x = H.x0 + (q + 0.5) * H.cw, y = H.y0 + (r + 0.5) * H.ch;
            const d = Math.hypot(x - fx, (y - fy) * 0.8) / (set.cap * 1.3) - 0.25 * catchF - 0.1 * duck;
            ctx.fillStyle = d < 0.45 ? ink.crest : d < 0.75 ? ink.hover : ink.lit;
            OM.cell(ctx, H, q, r, dpr);
          }
          flame(ctx, fx, cd.top - 8 - rise * 260, s * (1 - 0.5 * rise), keep, rise > 0 ? null : near, T);
        });
        ctx.globalAlpha = 1;
      },
      render(t, T) {
          this.draw(t, T);
          const e = B.env(T, start, END);
          const ctx = c.ensure();
          ctx.globalAlpha = 1;
          if (e > 0) {
            // Ember Bloom: the burst flame throws a spray of embers that drift up on the heat and wink out one by one.
            {
              const cd0 = lay().candles.find((q) => q.k === K && q.j === 0);
              const a = cd0 ? T - cd0.at : -1;
              if (a >= 0 && a < 1.3) {
                const ik = OM.fieldInks('tokyo-night');
                const ox = cd0.x, oy = cd0.top - 30;
                for (let i = 0; i < 150; i++) {
                  const life = 0.35 + 0.9 * OM.hash(i, 1, 616);
                  if (a > life) continue;
                  const ang = -Math.PI / 2 + (OM.hash(i, 2, 616) - 0.5) * 3.4, v = 380 + 900 * OM.hash(i, 3, 616), kd = 3.2;
                  const sp = (1 - Math.exp(-kd * a)) / kd;
                  const x = ox + Math.cos(ang) * v * sp + 18 * Math.sin(a * 7 + i);
                  const y = oy + Math.sin(ang) * v * sp * 0.8 - 90 * a * a;
                  const f = a / life;
                  ctx.globalAlpha = (0.55 + 0.45 * Math.sin(T * 40 + i * 1.7)) * (f > 0.85 ? 0.5 : 1);
                  ctx.fillStyle = f < 0.2 ? ik.crest : f < 0.5 ? ik.hover : f < 0.8 ? ik.lit : ik.mid;
                  const z = f < 0.3 ? 5 : f < 0.7 ? 4 : 3;
                  ctx.fillRect(x - z / 2, y - z / 2, z, z);
                }
                ctx.globalAlpha = 1;
              }
            }

            const { candles } = lay();
            const ik = OM.fieldInks('tokyo-night'), tk = OM.theme('tokyo-night');
            // Embers rising off every lit flame; smoke wisps once the flames lift away.
            for (let ci = 0; ci < candles.length; ci++) {
              const cd = candles[ci];
              if (T < cd.at) continue;
              for (let i = 0; i < 3; i++) {
                const a = ((T * 0.9 + OM.hash(ci, i, 6)) % 1 + 1) % 1;
                if (T - a / 0.9 < cd.at) continue;
                ctx.globalAlpha = e * (1 - a) * 0.9;
                ctx.fillStyle = a < 0.3 ? ik.crest : ik.hover;
                ctx.fillRect(cd.x + Math.sin(a * 6 + ci) * 10, cd.top - 30 - a * 160, 3, 3);
              }
              const sm = OM.prog(T, RISE, RISE + 0.6);
              if (sm > 0) B.pool(ctx, cd.x + Math.sin(T * 2 + ci) * 12, cd.top - 20 - sm * 90, 14 + sm * 20, tk['text-muted'], 0.16 * e * Math.sin(sm * Math.PI));
            }
          }
          ctx.globalAlpha = 1;
          fx.apply(T, {
            amount: e,
            // The relay pan runs on the beat clock, so it surges through each beat.
            cam: { zoom: 1 + e * 0.07, x: e * (60 - 120 * OM.smooth(OM.prog(beat.clock(T), start + 0.2, END - 0.4))) },
            p0: [OM.pulse(STOPS, T, 0.08), 0, 0, 0],
          });
        },
        release: () => { fx.release(); c.release(); },
    };
  },
});
