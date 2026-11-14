// c2-05 · Squeegee. The grid from the cut is the leading of a window, and grey
// grime condenses over every pane. Each word gets one squeegee stroke: the
// blade slaps on at the word's left edge on its onset and drags right, wiping
// a clear band through the grime that shows the bright field behind the glass
// and the word standing in it, crest at the blade. The last word's stroke rides
// the downbeat. Once the line has read together, three fast strokes on the
// roll take the rest of the grime off, the words and leading fade, and the
// clear window is just the field.

// Edit camera: the key word's slap (174.77) gets the scene's own punch, its
// biggest hit; beat 3 at 175.01 (hats only) would land a third hit 243 ms into
// that stroke, right after the cut's, so it is skipped.
OM.edit.plan('c2-05', { skip: [175.01] });
OM.ownWords.add('c2-05');
(() => {
  const W = 800;
  OM.c2.ready('c2-05', W);
  const { sm, decay, rgba } = OM.c2;

  const FX = `vec4 effect(vec2 uv) {
    vec2 p = cam(uv);
    if (uAmount <= 0.0) return src(p);
    // Wet-glass streaks: just behind the blade the fresh water film runs and refracts.
    float behind = clamp((uP0.x - p.x) / 0.07, 0.0, 1.0) * step(p.x, uP0.x);
    float inb = step(uP0.y, p.y) * step(p.y, uP0.z) * uP0.w;
    float m = behind * (1.0 - behind) * 4.0 * inb;
    float n = vnoise(vec2(p.x * 220.0, p.y * 6.0 - uTime * 1.5)) - 0.5;
    vec4 c = src(p + vec2(n * 0.0025 * m * uAmount, 0.0));
    c.rgb += vec3(0.733, 0.867, 0.592) * m * uAmount * 0.07 * (n + 0.5);
    return c;
  }`;

  OM.scene({
    id: 'c2-05',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const END = start + duration;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const words = OM.sung('c2-05');
      const on = words.map((w) => w.t0);
      const HM = OM.HOME, CS = 9; // letter cells: 8px on a 9px pitch
      const GRIME = [th['bg-deep'], th.surface, th['surface-2'], th.selection];
      const WIPES = [177.128, 177.194, 177.394]; // the roll's clear-up strokes, on its measured hits (beat 3's hat, the perc, the next hat)
      const FADE = WIPES[0] + 0.04, CLEAR = 177.5;

      const get = OM.c2.lazy(W, () => {
        const L = OM.c2.layout(words, { weight: W, cap: 150, maxW: 1720, cy: 540, rows: 3, lead: 1.6, minCap: 100 });
        const strokes = [];
        const letters = [];
        words.forEach((wd, k) => {
          const p = L.place[k];
          if (!p) return;
          const cells = OM.c2.raster(wd.text, p.x, p.base, L.px, W, CS);
          const set = new Set(cells.map((cl) => cl.i + ',' + cl.j));
          const halo = [];
          for (const cl of cells)
            for (let dj = -1; dj <= 1; dj++)
              for (let di = -1; di <= 1; di++) {
                const key = cl.i + di + ',' + (cl.j + dj);
                if (!set.has(key)) { set.add(key); halo.push([cl.x + di * CS, cl.y + dj * CS]); }
              }
          const dur = OM.clamp(wd.t1 - wd.t0, 0.12, 0.2); // a fast stroke: the word reads within a couple of frames of its onset
          strokes.push({ k, y0: p.base - L.cap - 34, y1: p.base + 0.32 * L.cap + 18, xa: p.x - 34, xb: p.x + p.w + 40, t0: on[k], dur });
          letters.push({ k, cells, halo, x: p.x });
        });
        return { strokes, letters };
      });
      const bladeX = (s, T) => s.xa + (s.xb - s.xa) * OM.ease.outExpo(OM.prog(T, s.t0, s.t0 + s.dur));
      const wipeX = (i, T) => -100 + 2200 * OM.ease.inOutCubic(OM.prog(T, WIPES[i], WIPES[i] + 0.22));
      const wipeBand = (i) => [i * 360 - 20, (i + 1) * 360 + 20];

      return {
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.05) return OM.c2.wall(ctx, dpr); // the skyline's wall of windows, from the cut
          if (T > END - 0.07) return OM.handoff('field', ctx, T, dpr);
          const { strokes, letters } = get();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          OM.hero(ctx, T, dpr, { inks: ink, L: HM, word: false, gain: 0.8, bg: false });

          // Words behind the glass, drawn where the blade has passed.
          const fade = OM.prog(T, FADE, CLEAR);
          // The wiped band is dark glass, so the words pop; it gives way to the field as the glass clears.
          for (const s of strokes) {
            if (T < s.t0) continue;
            ctx.fillStyle = rgba(ink.bg, 0.92 * (1 - sm(T, FADE, CLEAR)));
            ctx.fillRect(s.xa, s.y0, bladeX(s, T) - s.xa, s.y1 - s.y0);
          }
          for (const lt of letters) {
            const s = strokes.find((s) => s.k === lt.k);
            if (T < s.t0) continue;
            const xb = bladeX(s, T);
            ctx.fillStyle = ink.bg;
            for (const [x, y] of lt.halo) if (x < xb && OM.hash(x | 0, y | 0, 2) >= fade) ctx.fillRect(x, y, CS, CS);
            for (const cl of lt.cells) {
              if (cl.x > xb || OM.hash(cl.i, cl.j, 3) < fade) continue;
              const near = xb - cl.x;
              ctx.fillStyle = near < 60 || decay(T, s.t0, 0.1) > 0.5 ? ink.crest : lt.k === 0 ? ink.crest : ink.hover;
              ctx.fillRect(cl.x, cl.y, CS - 1, CS - 1);
            }
          }

          // The grime: condensing over the panes in dither order, wiped where a stroke has been.
          const cond = OM.smooth(OM.prog(T, start + 0.02, on[0] + 0.45));
          for (let row = HM.rMin; row < HM.rMin + HM.rows; row++) {
            const y = HM.y0 + (row + 0.5) * HM.ch;
            for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
              const x = HM.x0 + (col + 0.5) * HM.cw;
              let clean = false, ridge = false;
              for (const s of strokes) {
                if (T < s.t0 || y < s.y0 || y > s.y1 || x < s.xa) continue;
                const xb = bladeX(s, T);
                if (x < xb) { clean = true; if (y - s.y0 < HM.ch || s.y1 - y < HM.ch) ridge = true; break; }
                if (x < xb + HM.cw * 1.5 && T < s.t0 + s.dur + 0.05) ridge = true;
              }
              for (let i = 0; i < 3 && !clean; i++) {
                const [a, b] = wipeBand(i);
                if (y > a && y < b && x < wipeX(i, T)) clean = true;
              }
              if (clean && !ridge) continue;
              const tq = OM.threshold(col, row);
              if (!clean && tq > cond) {
                // Not yet fogged: still the city's dark window in its facade.
                ctx.fillStyle = th.surface;
                OM.cell(ctx, HM, col, row, dpr);
                ctx.fillStyle = th['bg-deep'];
                ctx.fillRect(HM.x0 + col * HM.cw + 2, HM.y0 + row * HM.ch + 2, HM.cw - 4, HM.ch - 4);
                continue;
              }
              if (clean && ridge && T > FADE) continue;
              const n = OM.heroNoise(col / 7 + 13, row / 4 + 7);
              ctx.fillStyle = ridge ? th['border-strong'] : GRIME[OM.clamp(Math.floor(n * 2.2 + OM.hash(col, row, 1) * 1.6), 0, 3)];
              OM.cell(ctx, HM, col, row, dpr);
            }
          }

          // The leading of the window: the cut's grid, fading as the glass comes clear.
          const lead = 1 - sm(T, FADE + 0.1, CLEAR);
          if (lead > 0) {
            const snap = (v) => Math.round(v * dpr) / dpr;
            ctx.fillStyle = rgba(th['border-subtle'], lead);
            for (let cc = HM.cMin; cc <= HM.cMin + HM.cols; cc++) ctx.fillRect(snap(HM.x0 + cc * HM.cw), 0, 1, 1080);
            for (let r = HM.rMin; r <= HM.rMin + HM.rows; r++) ctx.fillRect(0, snap(HM.y0 + r * HM.ch), 1920, 1);
          }

          // The blades: rubber at the front of each stroke, the pole hanging down and behind from its lower end.
          const blade = (x, y0, y1, a) => {
            ctx.fillStyle = rgba(th['surface-2'], a);
            ctx.fillRect(x - 18, y0 - 8, 14, y1 - y0 + 16);
            ctx.fillStyle = rgba(ink.crest, a);
            ctx.fillRect(x - 4, y0 - 8, 5, y1 - y0 + 16);
            ctx.save();
            ctx.translate(x - 11, y1 + 8);
            ctx.rotate(-0.5);
            ctx.fillStyle = rgba(th['border-strong'], a);
            ctx.fillRect(-180, -6, 180, 12);
            ctx.restore();
          };
          for (const s of strokes) {
            const a = OM.prog(T, s.t0 - 0.04, s.t0) * (1 - OM.prog(T, s.t0 + s.dur, s.t0 + s.dur + 0.12));
            if (a > 0) blade(bladeX(s, T), s.y0, s.y1, a);
            // The slap: spray off the blade on the onset.
            const age = T - s.t0;
            if (age >= 0 && age < 0.35) {
              ctx.fillStyle = ink.crest;
              for (let q = 0; q < 14; q++) {
                const x = bladeX(s, T) + 10 + 600 * age * OM.hash(q, s.k, 1), y = OM.lerp(s.y0, s.y1, OM.hash(q, s.k, 2)) + 500 * age * (OM.hash(q, s.k, 3) - 0.5) + 900 * age * age;
                if (OM.hash(q, s.k, 4) > age / 0.35) ctx.fillRect(x, y, 4, 4);
              }
            }
          }
          for (let i = 0; i < 3; i++) {
            const a = OM.prog(T, WIPES[i] - 0.03, WIPES[i]) * (1 - OM.prog(T, WIPES[i] + 0.2, WIPES[i] + 0.24));
            const [y0, y1] = wipeBand(i);
            if (a > 0) blade(wipeX(i, T), y0 + 20, y1 - 20, a);
          }
        },
        render(t, T) {
          this.draw(t, T);
          const ctx = c.ensure();
          if (OM.c2.live(T, start, END)) {
          // Drips running off the bottom of each wiped band.
          const { strokes } = get();
          for (const s of strokes) {
            const a = T - s.t0 - 0.15;
            if (a < 0) continue;
            for (let n = 0; n < 7; n++) {
              const x = OM.lerp(s.xa + 30, s.xb - 30, OM.hash(n, s.k, 51)), y = s.y1 + 2 + 140 * Math.pow(Math.max(0, a - 0.2 * OM.hash(s.k, n, 52)), 1.6);
              const al = 0.7 * (1 - OM.prog(T, FADE, CLEAR));
              if (y > 1080 || al <= 0) continue;
              ctx.fillStyle = OM.c2.rgba(ink.hover, al);
              ctx.fillRect(x, s.y1, 2, y - s.y1);
              ctx.fillRect(x - 2, y, 5, 6);
            }
          }
          }
          // Snap pans following each stroke, settling back for the clean-up.
          const { strokes } = get();
          let cur = 0, p0 = [0, 0, 0, 0];
          for (const s of strokes) {
            cur = OM.lerp(cur, -((s.xa + s.xb) / 2 - 960) * 0.06, OM.ease.outCubic(OM.prog(T, s.t0, s.t0 + 0.2)));
            if (T >= s.t0 && T < s.t0 + s.dur + 0.4) p0 = [bladeX(s, T) / 1920, 1 - s.y1 / 1080, 1 - s.y0 / 1080, 1 - OM.prog(T, s.t0 + s.dur, s.t0 + s.dur + 0.4)];
          }
          cur = OM.lerp(cur, 0, OM.smooth(OM.prog(T, WIPES[0], WIPES[0] + 0.35)));
          // The key word's slap (the longest-held word, held in crest) punches in.
          OM.c2.apply(fx, T, start, END, { amount: 1, x: cur, p0, punch: 0.04 * OM.c2.punch(T, on[0]) });
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
