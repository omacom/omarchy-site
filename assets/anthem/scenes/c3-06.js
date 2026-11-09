// c3-06 · Murmuration. The lit cells of the field take off as a flock of
// thousands. The flock forms each word as it is sung: the field flies straight
// into the first word, which holds through the downbeat; it breaks, sweeps and
// pulls back together into the second; then into the whole line at once, the
// last word's birds joining on its onset. On the kick after the line the
// flock goes wild, folding and wheeling in clean sweeps that turn hard on the
// snares, and on the last downbeat it flares out and comes down as the rain
// of c3-07's storm, every bird stretching into a falling drop round the sun,
// landing on the snare before the cut.
OM.ownWords.add('c3-06');
// Edit camera: the defaults fit. The kick fill builds into the 263.608 downbeat, the drop, where the
// first word holds in formation well clear of the edges (9.3% peak zoom), and the scene's own camera
// only glides, so nothing stacks on the beats; the flock's wingbeat flares light the pause hits.
OM.edit.plan('c3-06', {});
// The c3-06 > c3-07 match cut: the flock come down as rain, falling past the sun.
OM.c3cut = OM.c3cut || {};
(() => {
  const S7 = 268.423, SNARE = 268.399;
  const rng = OM.rng(0xc307), drops = [];
  for (let i = 0; i < 560; i++) drops.push({ x: rng() * 2100 - 90, y: rng() * 1300, sp: 1500 + rng() * 700, len: 14 + rng() * 16, r: rng() });
  /** Drop d's top at rain time Tr: falling, wrapping round 1300px. */
  const at = (d, Tr) => {
    const y = ((((d.y + (Tr - S7) * d.sp) % 1300) + 1300) % 1300) - 110;
    return [d.x - (y + 110) * 0.18, y];
  };
  /** The same drop unwrapped, in free fall through `ref` (for things falling into it). */
  const fall = (d, T, ref) => {
    const y = at(d, ref)[1] + (T - ref) * d.sp;
    return [d.x - (y + 110) * 0.18, y];
  };
  const paint = (ctx, T, dpr) => {
    const C = OM.c3, ink = C.ink, L = OM.HOME, hc = OM.cellAt(L, 960, 540);
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    C.pool(ctx, L.x0 + (hc.col + 0.5) * L.cw, L.y0 + (hc.row + 0.5) * L.ch, 72, ink.lit, 0.4);
    ctx.fillStyle = ink.crest;
    OM.cell(ctx, L, hc.col, hc.row, dpr);
    // The drops glint on the snare as the flock lands as rain.
    ctx.fillStyle = T >= SNARE && T < SNARE + 0.05 ? ink.hover : C.th['text-muted'] || ink.mid;
    for (const d of drops) {
      const [x, y] = at(d, T);
      ctx.fillRect(Math.round(x), Math.round(y), 2, Math.round(d.len));
    }
  };
  OM.c3cut.rain = { drops, at, fall, paint, S7 };
})();
OM.scene({
  id: 'c3-06',
  build(el, { start, duration }) {
    const C = OM.c3;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const END = start + duration;
    const ink = C.ink;
    const L = OM.HOME, hc = OM.cellAt(L, 960, 540);
    const SX = L.x0 + (hc.col + 0.5) * L.cw, SY = L.y0 + (hc.row + 0.5) * L.ch;
    const words = OM.sung('c3-06');
    const on = words.map((w) => w.t0);
    const n = words.length;
    // On the drum: the downbeats, the wild kick, the pour downbeat. TURNS centre the flock's smooth
    // one-second bends (not hits); the wingbeat flares (WB) are hits, on the drums as measured.
    const DOWNS = [263.639, 265.776].map(OM.beatOnset), WILD = 266.008, TURNS = [266.89, 267.424], POUR = OM.beatOnset(267.889);
    const WB = [[266.008, 'kick'], [266.89, 'snare'], [267.424, 'snare'], [267.59, 'kick'], [268.0, 'kick']].map(([t, k]) => C.onDrum(t, k));
    const start0 = OM.heroLit(start, L, { gain: 0.8 });

    const flock = C.lazy(() => {
      // Three formations: the first word alone, the second alone, then the whole line.
      const solo = (k) => C.layout(words, [{ ks: [k], cap: 190, minCap: 70, cy: 470 }]);
      const half = Math.ceil(n / 2);
      const full = C.layout(words, [{ ks: [...Array(half).keys()], cap: 112, minCap: 70, cy: 370 }, { ks: [...Array(n - half).keys()].map((i) => i + half), cap: 112, minCap: 70, cy: 620 }]);
      const step = () => 9; // the film's lattice type: each formed bird an 8px cell on a 9px pitch
      const F = [];
      const add = (place, ks, tin, lead, tout, fromStart) => {
        const pts = C.wordPts(words, place, 800, step);
        const list = [];
        for (const k of ks) for (let i = 0; i < pts[k].length; i += 2) list.push([pts[k][i], pts[k][i + 1], k, step(place[k])]);
        F.push({ list, tin, lead, tout, fromStart });
      };
      if (n > 0) add(solo(0), [0], on[0], Math.max(0.05, on[0] - start - 0.05), Math.min(on[1] || WILD, words[0].t1) - 0.05, true);
      if (n > 2) add(solo(1), [1], on[1], 0.16, words[1].t1 - 0.05);
      add(full, [...Array(n).keys()], n > 2 ? on[2] : on[Math.min(1, n - 1)], 0.13, WILD);
      const NB = Math.max(...F.map((f) => f.list.length)) + 900;
      const rng = OM.rng(0xc306);
      const B = [];
      for (let i = 0; i < NB; i++) {
        const s = start0.length ? start0[i % start0.length] : { col: hc.col, row: hc.row, heat: 0 };
        const a = rng() * Math.PI * 2, r = Math.sqrt(rng());
        B.push({ x0: L.x0 + (s.col + 0.5) * L.cw, y0: L.y0 + (s.row + 0.5) * L.ch, heat: s.heat, u: r * Math.cos(a), v: r * Math.sin(a), r: rng() });
      }
      return { F, B };
    });

    // The flock's shape: a folding, wheeling blob, its course turning on the snares.
    // The flock's course: a Lissajous glide whose snare bends spread over a full second each.
    const course = (T) => {
      let turn = 0;
      for (const s of TURNS) turn += OM.smooth(OM.prog(T, s - 0.5, s + 0.5));
      const wild = C.sm(T, WILD, WILD + 1.3);
      return [960 + 430 * Math.sin(T * 0.9 + turn * 0.7) * (0.6 + 0.4 * wild), 470 + 150 * Math.sin(T * 1.3 + 1 + turn * 0.55)];
    };
    // From the wild section on, the course is re-timed to an even glide speed (just under the speed it had going in),
    // so it never surges or brakes into a turn. Before it, course time is song time, untouched.
    const WARP = (() => {
      const dt = 1 / 240, out = [WILD];
      const sp = (u) => { const a = course(u), b = course(u + 1e-3); return Math.hypot(b[0] - a[0], b[1] - a[1]) / 1e-3; };
      const v0 = sp(WILD);
      let u = WILD;
      for (let T = WILD; T < start + duration + 0.2; T += dt) {
        u += dt * OM.lerp(1, (0.85 * v0) / Math.max(1, sp(u)), C.sm(T, WILD, WILD + 0.8)); // a touch slower than going in, so the tightest arc stays gentle
        out.push(u);
      }
      return (T) => {
        if (T <= WILD) return T;
        const f = (T - WILD) * 240, i = Math.min(out.length - 2, Math.floor(f));
        return OM.lerp(out[i], out[i + 1], f - i);
      };
    })();
    const flockAt = (b, T) => {
      let turn = 0;
      for (const s of TURNS) turn += OM.smooth(OM.prog(T, s - 0.5, s + 0.5));
      const wild = C.sm(T, WILD, WILD + 1.3);
      const [cx, cy] = course(WARP(T));
      const A = 520 + 220 * Math.sin(T * 1.1 + turn * 0.35), Bv = 150 + 90 * Math.sin(T * 1.7 + turn * 0.65);
      const th = 0.5 * Math.sin(T * 0.55 + turn * 0.45);
      let x = b.u * A, y = b.v * Bv;
      x += 130 * Math.sin(b.v * 3 + T * 2.2 + turn * 0.35);
      y += 70 * Math.sin(b.u * 4 - T * 1.6) * (0.5 + wild);
      return [cx + x * Math.cos(th) - y * Math.sin(th), cy + x * Math.sin(th) + y * Math.cos(th)];
    };

    // Camera: gliding arcs with the flock. Effect: a sky-gradient haze (the theme's blue above, green
    // low) and motion streaks smeared off the birds along the flock's heading; the bright word birds stay crisp.
    const FX = C.GLSL_LUM + `vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec3 c = src(p).rgb, s = vec3(0.0);
  vec2 dir = uP0.xy * vec2(1.0 / 1920.0, 1.0 / 1080.0) * 5.0 * uP0.z * uAmount;
  for (int i = 1; i <= 6; i++) s += src(p - dir * float(i)).rgb;
  s /= 6.0;
  vec3 o = mix(max(c, s * 0.8), c, smoothstep(0.3, 0.55, lum(c)));
  vec3 haze = mix(vec3(0.62, 0.81, 0.42) * 0.05, vec3(0.48, 0.64, 0.97) * 0.07, p.y);
  return vec4(o + uAmount * haze, 1.0);
}`;
    const fxAt = (T) => {
      const dx = Math.cos(T * 0.9), dy = 0.45 * Math.cos(T * 1.3 + 1), l = Math.hypot(dx, dy) || 1;
      return {
        amount: 1, p0: [dx / l, -dy / l, 0.5 + C.sm(T, WILD, WILD + 0.5), 0],
        cam: { zoom: 1.09, rot: 0.025 * Math.sin((T - start) * 0.9), x: 45 * Math.sin((T - start) * 0.6) },
      };
    };
    return OM.c3.withFx(el, c, start, END, FX, fxAt)({
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        const RN = OM.c3cut.rain, LANDR = END - 0.07;
        if (T > LANDR) return RN.paint(ctx, T, dpr);
        if (C.seam(ctx, T, dpr, start, END, 'field', 'spark')) return; // out-side never reached: the rain paints the last frames
        const { F, B } = flock();
        const lift = OM.ease.inOutCubic(OM.prog(T, start + 0.05, start + 0.7));
        const pour = OM.ease.inOutCubic(OM.prog(T, POUR, LANDR)); // the flock flares out and falls as the rain
        const rainC = C.th['text-muted'] || ink.mid;
        const down = OM.pulse(DOWNS, T, 0.14);

        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        C.stars(ctx, T, 0.5 * C.sm(T, start + 0.1, start + 0.6) * (1 - pour));
        // The sun the rain falls past comes up as the flock leaves it.
        if (pour > 0) {
          C.pool(ctx, SX, SY, 72, ink.lit, 0.4 * pour);
          ctx.globalAlpha = pour;
          ctx.fillStyle = ink.crest;
          OM.cell(ctx, L, hc.col, hc.row, dpr);
          ctx.globalAlpha = 1;
        }
        const ws = F.map((f) => (T < f.tin - f.lead || T > f.tout + 0.4 ? 0 : C.arrive(T, f.tin, f.lead) * (1 - OM.ease.inOutCubic(OM.prog(T, f.tout, f.tout + 0.4)))));
        for (let i = 0; i < B.length; i++) {
          const b = B[i];
          let [x, y] = flockAt(b, T);
          x = OM.lerp(b.x0, x, lift);
          y = OM.lerp(b.y0, y, lift);
          let v = 0.3 + 0.25 * b.r, sz = 4, inForm = -1;
          for (let f = 0; f < F.length; f++) {
            const w = ws[f], list = F[f].list;
            if (w <= 0 || i >= list.length) continue;
            const [tx, ty, k, st] = list[i];
            // The last word of the line joins the full formation on its own onset.
            const wk = f === F.length - 1 && T < on[k] ? w * C.arrive(T, on[k], 0.13) : w;
            if (wk <= 0) continue;
            // Each bird swings in on its own arc.
            const sw = Math.sin(wk * Math.PI) * 60 * (b.r - 0.5);
            x = OM.lerp(x, tx, wk) + sw;
            y = OM.lerp(y, ty, wk) - sw * 0.5;
            if (wk > 0.9) {
              inForm = k;
              sz = st - 1;
              v = 0.75 + 1.2 * C.decay(T, Math.max(on[k], F[f].tin), 0.12) + 0.5 * down;
            }
          }
          if (T < start + 0.06 + 0.3 && inForm < 0 && lift < 0.2) sz = OM.lerp(L.cw, 4, lift / 0.2);
          let p = 0, d = null;
          if (pour > 0) {
            p = OM.clamp(pour * 1.2 - b.r * 0.2);
            d = RN.drops[i % RN.drops.length];
          }
          // Wingbeat flare: on each pause hit a beat of light runs through the free flock.
          if (inForm < 0 && T > 265.8) {
            const wb = OM.pulse(WB, T, 0.09) * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(b.u * 5 + b.v * 3)));
            v += 0.8 * wb;
            sz += 1.5 * wb * (1 - pour);
          }
          ctx.fillStyle = inForm < 0 && lift < 0.15 ? ink.dim : v > 1.2 ? ink.crest : v > 0.7 ? ink.hover : v > 0.42 ? ink.lit : ink.mid;
          if (p > 0) {
            // Each bird stretches into its drop, falling through the drop's place at the landing.
            const [dx, dy] = RN.fall(d, T, LANDR);
            if (p > 0.6) ctx.fillStyle = rainC;
            ctx.fillRect(Math.round(OM.lerp(x - sz / 2, dx, p)), Math.round(OM.lerp(y - sz / 2, dy, p)), Math.round(OM.lerp(sz, 2, p)), Math.round(OM.lerp(sz, d.len, p)));
            continue;
          }
          ctx.fillRect(Math.round(x - sz / 2), Math.round(y - sz / 2), Math.round(sz), Math.round(sz));
        }
        // Specks shed off the flock, drifting behind it and fading.
        const spA = lift * (1 - pour);
        for (let j = 0; spA > 0.01 && j < 180; j++) {
          const ph = T * 1.2 + OM.hash(j, 1, 66), age = (ph - Math.floor(ph)) * 1.3;
          const b = B[Math.floor(OM.hash(j, Math.floor(ph), 67) * B.length)];
          const [fx0, fy0] = flockAt(b, T - age);
          ctx.fillStyle = C.rgba(ink.mid, spA * (1 - age / 1.3));
          ctx.fillRect(Math.round(fx0 - 30 * age), Math.round(fy0 + 40 * age * age), 2, 2);
        }
      },
      release: () => c.release(),
    });
  },
});
