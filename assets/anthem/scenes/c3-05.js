// c3-05 · Bloom. The homepage field is a meadow of buds. On each onset a bed
// of lattice flowers opens in the shape of the word, petals unfolding across it
// left to right, crest hearts in hover petals; the key word opens on the
// downbeat, biggest, and from it the bloom runs out through every lit cell of
// the field to the edges of the frame on the kick fill. Then the flowers fold
// shut again, words first, back into buds, and the meadow is the field.
OM.ownWords.add('c3-05');
// Edit camera: the key word (w2) opens on the 261.452 downbeat, so the downbeat punch is raised to make
// it the scene's biggest beat. The scene's own camera is a slow dolly, so nothing stacks on the beats.
OM.edit.plan('c3-05', { down: 2.2 });
OM.scene({
  id: 'c3-05',
  build(el, { start, duration }) {
    const C = OM.c3;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const END = start + duration;
    const ink = C.ink;
    const L = OM.HOME;
    const words = OM.sung('c3-05');
    const on = words.map((w) => w.t0);
    const n = words.length;
    const DOWN = OM.beatOnset(261.503), FILL = 261.735, CLOSE = 262.4; // the downbeat on the drum
    const KEY = words.reduce((b, w, k) => (Math.abs(w.t0 - DOWN) < Math.abs(words[b].t0 - DOWN) ? k : b), 0);
    const PK = [262.15, 262.27, 262.52, 262.76].map((t) => C.onDrum(t, 'kick')); // the pause kicks (measured): petal shake and heart beat
    const KK = [261.062, 261.201].map((t) => C.onDrum(t, 'kick')); // the kicks before the key word
    // Seconds for the bloom to cross a word, and for each flower to pop open: quick, so each word is in
    // full bloom within a few frames of its onset (it took up to 0.38 s at 0.22 s + 0.16 s).
    const OPEN = 0.05, POP = 0.07;

    const type = C.lazy(() => {
      const first = words.map((_, k) => k).filter((k) => k !== KEY);
      const rows = [{ ks: first, cap: 104, cy: 380 }, { ks: [KEY], cap: 170, cy: 650 }];
      const place = C.layout(words, rows);
      const pts = C.wordPts(words, place, 800, (p) => Math.max(10, Math.round(p.cap / 10)));
      return { place, pts, step: place.map((p) => (p ? Math.max(10, Math.round(p.cap / 10)) : 10)) };
    });
    /** A lattice flower of size s (0..1 open) at x,y: a crest heart and four petals. */
    const flower = (ctx, x, y, s, size, heart, petal) => {
      if (s <= 0.02) return;
      const u = Math.max(1, Math.round((size / 3) * Math.min(1, s)));
      const reach = Math.round(u * (0.4 + 0.6 * s));
      ctx.fillStyle = petal;
      ctx.fillRect(Math.round(x - u / 2) - reach, Math.round(y - u / 2), u, u);
      ctx.fillRect(Math.round(x - u / 2) + reach, Math.round(y - u / 2), u, u);
      ctx.fillRect(Math.round(x - u / 2), Math.round(y - u / 2) - reach, u, u);
      ctx.fillRect(Math.round(x - u / 2), Math.round(y - u / 2) + reach, u, u);
      ctx.fillStyle = heart;
      ctx.fillRect(Math.round(x - u / 2), Math.round(y - u / 2), u, u);
    };
    const closeAt = (x) => CLOSE + 0.25 * OM.clamp(Math.abs(x - 960) / 960); // the words shut first, the edges last

    // Camera: a low dolly forward through the field, rising. Effect: depth of field, the foreground and
    // the far edge going soft while the word beds in the middle stay sharp.
    const FX = `vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec3 c = src(p).rgb, b = vec3(0.0);
  float blur = uAmount * (smoothstep(0.3, 0.0, p.y) + 0.6 * smoothstep(0.85, 1.0, p.y));
  vec2 r = vec2(9.0 / 1920.0, 9.0 / 1080.0) * blur;
  for (int i = 0; i < 10; i++) { float a = float(i) * 0.628; b += src(p + vec2(cos(a), sin(a)) * r).rgb; }
  return vec4(mix(c, b / 10.0, min(1.0, blur * 1.5)), 1.0);
}`;
    const fxAt = (T) => ({ amount: 1, cam: { zoom: 1.04 + 0.06 * OM.prog(T, start, END), y: 28 * OM.prog(T, start, END) } });
    return OM.c3.withFx(el, c, start, END, FX, fxAt)({
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (C.seam(ctx, T, dpr, start, END, 'field', 'field')) return;
        const { place, pts, step } = type();
        OM.handoff('field', ctx, T, dpr);
        const keyP = place[KEY] || { cx: 960, cy: 650 };
        // One box per row of beds, so no ring blossom lands in the gap between two words.
        const rowsOf = [...new Set(place.filter(Boolean).map((p) => p.cy))].map((cy) => place.filter((p) => p && p.cy === cy));
        const boxes = rowsOf.map((r) => [Math.min(...r.map((p) => p.x)) - 30, Math.min(...r.map((p) => p.base - p.cap)) - 30, Math.max(...r.map((p) => p.x + p.w)) + 30, Math.max(...r.map((p) => p.base)) + 30]);

        // The meadow: lit field cells bloom as the wave out of the key word reaches them, and fold before the cut.
        if (T > DOWN) {
          const lit = OM.heroLit(T, L, { gain: 1.15 });
          for (const cl of lit) {
            const x = L.x0 + (cl.col + 0.5) * L.cw, y = L.y0 + (cl.row + 0.5) * L.ch;
            const d = Math.hypot(x - keyP.cx, (y - keyP.cy) * 1.4);
            const tb = DOWN + 0.05 + d / 1500;
            const s = OM.ease.outBack(OM.clamp((T - tb) / 0.25)) * (1 - OM.ease.inCubic(OM.prog(T, closeAt(x), END - 0.12)));
            if (s <= 0.02) continue;
            ctx.fillStyle = ink.bg;
            OM.cell(ctx, L, cl.col, cl.row, dpr);
            const age = T - tb;
            flower(ctx, x, y, s * (1 + 0.9 * OM.pulse(PK, T, 0.1)), L.cw * (1 + 0.5 * OM.pulse(PK, T, 0.1)), age < 0.12 ? ink.crest : ink.hover, cl.heat > 0.5 ? ink.lit : ink.mid);
          }
        }
        // Bloom ring: each pause kick throws a ring of blossoms out across the meadow from the key word, around the beds.
        for (const k of PK) {
          const age = T - k;
          if (age < 0 || age > 0.4) continue;
          const front = 300 + age * 2600, fade = 1 - age / 0.4;
          for (let row = L.rMin; row < L.rMin + L.rows; row += 1)
            for (let col = L.cMin; col < L.cMin + L.cols; col += 1) {
              const x = L.x0 + (col + 0.5) * L.cw, y = L.y0 + (row + 0.5) * L.ch;
              const d = Math.hypot(x - keyP.cx, (y - keyP.cy) * 1.4);
              if (Math.abs(d - front) > 110 || OM.hash(col, row, 0x55) > 0.55 * fade) continue;
              if (boxes.some((b) => x > b[0] && x < b[2] && y > b[1] && y < b[3])) continue;
              flower(ctx, x, y, fade, L.cw * 1.3, ink.crest, fade > 0.5 ? ink.hover : ink.lit);
            }
        }
        // A green haze over the beds as they open.
        let haze = 0;
        for (let k = 0; k < n; k++) haze = Math.max(haze, (k === KEY ? 0.3 : 0.18) * C.decay(T, on[k], 0.2));
        C.pool(ctx, 960, 540, 900, ink.lit, haze + 0.06 * C.sm(T, on[0], on[0] + 0.3) * (1 - C.sm(T, CLOSE, END - 0.1)));

        // The word beds.
        words.forEach((wd, k) => {
          const p = place[k];
          if (!p || T < on[k]) return;
          const P = pts[k], sz = step[k], big = k === KEY;
          for (let i = 0; i < P.length; i += 2) {
            const x = P[i], y = P[i + 1];
            const tb = on[k] + OPEN * (big ? 0.7 : 1) * OM.clamp((x - p.x) / p.w);
            const open = OM.ease.outBack(OM.clamp((T - tb) / POP), 2.2);
            const shut = 1 - OM.ease.inCubic(OM.prog(T, closeAt(x) - 0.05, Math.min(closeAt(x) + 0.3, END - 0.1)));
            const s = Math.max(T >= on[k] ? 0.25 : 0, open) * shut;
            if (s <= 0.02) continue;
            const age = T - tb;
            const kickGlow = OM.pulse(big ? [...KK, ...PK] : PK, T, 0.1); // heart beat on the pause kicks
            const heart = age < 0.1 || kickGlow > 0.5 ? ink.crest : (OM.hash(x, y, k) > 0.3 ? ink.crest : ink.hover);
            flower(ctx, x, y, s, sz * (1.15 + 0.25 * kickGlow), heart, age < 0.2 || kickGlow > 0.4 ? ink.crest : ink.hover);
          }
        });
        // Pollen drifting up through the meadow.
        const pa = C.sm(T, start + 0.05, start + 0.45) * (1 - C.sm(T, END - 0.45, END - 0.08));
        for (let j = 0; pa > 0.01 && j < 90; j++) {
          const h = OM.hash(j, 1, 55);
          const y = 1100 - ((h * 1200 + (T - start) * 45 * (0.5 + OM.hash(j, 2, 55))) % 1200);
          const x = OM.hash(j, 3, 55) * 1920 + 30 * Math.sin(T * 0.9 + j);
          ctx.fillStyle = C.rgba(j % 3 ? ink.hover : ink.crest, pa * (0.4 + 0.5 * OM.hash(j, 4, 55)));
          const s = j % 4 ? 2 : 3;
          ctx.fillRect(Math.round(x), Math.round(y), s, s);
        }
      },
      release: () => c.release(),
    });
  },
});
