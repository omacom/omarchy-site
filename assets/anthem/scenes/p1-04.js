// p1-04 · Paper plane. The crest line from the cut is a sheet seen edge-on:
// it swings open into a page [line] fine print. Each sung word is
// stamped out of the fine print in heavy type, clearing its own patch of the
// page; between the words the sheet folds itself, corners to the crease, then
// edges to a dart, so the line ends up across its wings. On the key word the
// last word is struck on in highlight and the plane launches; on the downbeat
// it is thrown for real, swooping away into the night trailing lattice light
// until it is a single crest cell with a halo: the spark chorus 1 opens on.
// Edit camera: the throw on the downbeat (80.170) starts the scene's own whip, so
// that punch is lowered to a snap under the whip rather than a second move; the
// cut-landing punch, the backbeat jolts and the build into chorus 1 run as set.
OM.edit.plan('p1-04', { down: 1.2 });
OM.ownWords.add('p1-04');
OM.scene({
  id: 'p1-04',
  build(el, { start, duration }) {
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const END = start + duration;
    const ink = OM.fieldInks('tokyo-night');
    const th = OM.theme('tokyo-night');
    const { rgba, pool, font, sm, decay } = OM.p1;
    const words = OM.sung('p1-04');
    const on = words.map((w) => w.t0);
    const K = words.length - 1;
    const L = OM.HOME, H = OM.cellAt(L, 960, 540);
    const YC = L.y0 + (H.row + 0.5) * L.ch, SX = L.x0 + (H.col + 0.5) * L.cw;
    const OPEN = [start + 0.01, on[0]]; // unfolds from the cut, fully open on word 0's onset
    const F1 = [on[0] + 0.05, on[0] + 0.24], F2 = [on[1] + 0.01, on[K] - 0.03];
    const DOWN = OM.beatOnset(80.202); // the downbeat at its drum onset: the throw
    const SNARE = 79.63, KICK = 79.376; // measured drum onsets (OM.T.drums)
    const THROW = DOWN, ARRIVE = END - 0.085;
    const W2 = 800, H2 = 360; // half sheet
    const PAPER = th.text, SHADE = th['text-secondary'], BACK = th['text-muted'];
    const PRINT = OM.mix(th.text, ink.bg, 0.42);

    const layout = (ctx) => {
      const idx = words.map((_, k) => k);
      const px = OM.p1.fit(ctx, words, idx, 800, 1140, 132, 60);
      ctx.font = font(800, px);
      const sp = ctx.measureText(' ').width;
      const out = [];
      let w = 0;
      words.forEach((wd, k) => {
        if (k && wd.space) w += sp;
        out.push({ x: w, w: ctx.measureText(wd.text).width });
        w += out[k].w;
      });
      const x0 = -170 - w / 2;
      out.forEach((o) => (o.x += x0));
      return { px, out, cap: px * 0.73 };
    };

    // The flight: a small lift on the key word, then the throw, log-shrinking along a swoop onto the spark.
    const bez = (a, m, b, u) => [(1 - u) ** 2 * a[0] + 2 * u * (1 - u) * m[0] + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * m[1] + u * u * b[1]];
    const A0 = [960, YC], A1 = [1010, YC - 50], M = [1560, 120], B = [SX, YC];
    const pose = (T) => {
      const lift = OM.ease.outExpo(OM.prog(T, on[K], on[K] + 0.3));
      const u = OM.prog(T, THROW, ARRIVE), e = 1 - (1 - u) ** 1.7;
      const p0 = [OM.lerp(A0[0], A1[0], lift), OM.lerp(A0[1], A1[1], lift)];
      const p = u > 0 ? bez(p0, M, B, e) : p0;
      const sc = OM.lerp(1, 0.8, lift) * Math.exp(-4.4 * e);
      let rot = -0.12 * lift;
      if (u > 0) {
        const q = bez(p0, M, B, Math.min(1, e + 0.01)), r = bez(p0, M, B, Math.max(0, e - 0.01));
        rot = OM.lerp(rot, Math.atan2(q[1] - r[1], q[0] - r[0]), sm(u, 0, 0.12));
      }
      return { p, sc, rot, u, lift };
    };

    // Launch motion blur: the frame smeared along the flight line, only once the plane is thrown.
    const fx = OM.post(el, c, {
      effect: `vec4 effect(vec2 uv) {
  vec2 s = cam(uv);
  vec4 c = src(s);
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 14; i++) acc += src(s - uP0.xy * (float(i) - 3.0));
  return mix(c, acc / 14.0, uAmount);
}`,
    });
    return {
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T < start + 0.05) return fx.apply(T), OM.handoff('line', ctx, T, dpr);
        if (T > END - 0.07) return fx.apply(T), OM.handoff('spark', ctx, T, dpr);
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const Lay = layout(ctx);
        const o = OM.smooth(OM.prog(T, OPEN[0], OPEN[1])); // smoothstep: at most ~30% of the sheet per 1/24 s
        const f1 = OM.ease.inOutCubic(OM.prog(T, F1[0], F1[1])), f2 = OM.ease.inOutCubic(OM.prog(T, F2[0], F2[1]));
        const P = pose(T);
        const kick = decay(T, on[0], 0.08) + decay(T, SNARE, 0.06);
        const launch = decay(T, on[K], 0.14), thr = decay(T, DOWN, 0.12);

        // The light trail, lattice cells along the throw.
        const fadeT = 1 - sm(P.u, 0.7, 0.97);
        if (P.u > 0 && fadeT > 0) {
          for (let i = 1; i <= 46; i++) {
            const Tq = T - i * 0.011;
            if (Tq < THROW) break;
            const q = pose(Tq), cc = OM.cellAt(L, q.p[0], q.p[1]);
            const a = (1 - i / 46) * fadeT;
            ctx.fillStyle = rgba(i < 6 ? ink.crest : i < 18 ? ink.hover : ink.lit, a * 0.85);
            OM.cell(ctx, L, cc.col, cc.row, dpr);
          }
        }
        // The ribbon: a smooth light trail through the plane's past positions, and wind streaks rushing past.
        if (P.u > 0 && fadeT > 0) {
          ctx.lineCap = 'round';
          for (const [lw, hex, a] of [[22, ink.lit, 0.12], [6, ink.hover, 0.5]]) {
            ctx.strokeStyle = rgba(hex, a * fadeT);
            ctx.lineWidth = lw * (0.3 + P.sc);
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) {
              const q = pose(Math.max(THROW, T - i * 0.012)).p;
              i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
            }
            ctx.stroke();
          }
        }
        const wind = sm(T, on[K], THROW + 0.05) * (1 - sm(T, 80.6, 80.95));
        if (wind > 0) {
          for (let i = 0; i < 26; i++) {
            const sp = 2200 + 1600 * OM.hash(i, 1, 41);
            const x = 2200 - ((OM.hash(i, 2, 41) * 2600 + T * sp) % 2600);
            const y = OM.hash(i, 3, 41) * 1080 + (2200 - x) * 0.35;
            ctx.strokeStyle = rgba(i % 3 ? th['text-muted'] : ink.hover, 0.28 * wind);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 160 + 120 * OM.hash(i, 4, 41), y + 56);
            ctx.stroke();
          }
        }
        // Back light: the open page glows, flaring on the launch and the throw.
        pool(ctx, P.p[0], P.p[1], 900 * P.sc + 80, 520 * P.sc + 80, ink.lit, 0.08 * o + 0.3 * launch + 0.3 * thr);

        const planeA = 1 - sm(P.u, 0.82, 0.98);
        if (planeA > 0.003) {
          ctx.save();
          ctx.globalAlpha = planeA;
          ctx.translate(P.p[0], P.p[1] - 6 * kick);
          ctx.rotate(P.rot);
          const tilt = 1 - 0.12 * f2;
          ctx.scale(P.sc, P.sc * tilt);
          // Opening from edge-on: the line's full width and one cell's height, to the page.
          const hw = OM.lerp(980, W2, o), hh = OM.lerp(L.ch / 2, H2, o);
          ctx.scale(hw / W2, hh / H2);
          const lightK = sm(P.u, 0.2, 0.8); // far away it is just light
          // Brightness: the thin line eases down to 30% as it opens, then the page lights to full on the kick, with word 0's stamp.
          const lit = OM.lerp(OM.lerp(1, 0.3, sm(o, 0, 0.25)), 1, OM.ease.outCubic(OM.prog(T, KICK, KICK + 0.03)));
          const col = (hex) => OM.mix(ink.bg, OM.mix(OM.mix(ink.crest, hex, o), ink.crest, lightK), lit);
          // Body: the sheet below the folds.
          const py = OM.lerp(-H2, -H2 * (1 - 1240 / 1600), f2), px = W2 - H2;
          const body = f1 <= 0 ? [[-W2, -H2], [W2, -H2], [W2, H2], [-W2, H2]] : [[-W2, -H2], [px, py], [W2, 0], [px, -py], [-W2, H2]];
          const path = (pts) => {
            ctx.beginPath();
            pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.closePath();
          };
          // The lower wing sits a shade darker once it is a plane.
          path(body);
          ctx.fillStyle = col(PAPER);
          ctx.fill();
          if (f2 > 0) {
            path([[-W2, 0], [W2, 0], [px, -py], [-W2, H2]]);
            ctx.fillStyle = col(OM.mix(PAPER, SHADE, f2));
            ctx.fill();
          }
          // The fine print, ruled in rows and clipped to the sheet; each word's patch is cleared.
          if (o > 0.3 && lightK < 1) {
            ctx.save();
            path(body);
            ctx.clip();
            ctx.globalAlpha = planeA * OM.prog(o, 0.3, 1) * (1 - lightK);
            ctx.fillStyle = OM.mix(ink.bg, PRINT, lit);
            for (let r = 0; r < 28; r++) {
              const y = -H2 + 34 + r * 24;
              let x = -W2 + 50;
              const hd = r === 0;
              while (x < W2 - 60) {
                const w = hd ? 200 : 26 + 110 * OM.hash(r, x | 0, 4);
                ctx.fillRect(x, y, Math.min(w, W2 - 60 - x), hd ? 14 : 7);
                x += w + 13;
              }
            }
            ctx.fillStyle = col(PAPER);
            Lay.out.forEach((s, k) => {
              const cl = OM.ease.outExpo(OM.prog(T, on[k], on[k] + 0.06));
              if (cl > 0) ctx.fillRect(s.x - 18, -Lay.cap / 2 - 26, (s.w + 36) * cl, Lay.cap + 52);
            });
            ctx.restore();
          }
          // Flaps: the corners folded over onto the crease, back side up.
          if (f1 > 0) {
            for (const sgn of [-1, 1]) {
              const C = [W2 - H2 * f1, sgn * (-H2 + H2 * f1)];
              path([[px, sgn * py], [W2, 0], C]);
              ctx.fillStyle = col(OM.mix(PAPER, BACK, OM.smooth(f1)));
              ctx.fill();
            }
          }
          // Creases.
          if (f1 > 0 && lightK < 1) {
            ctx.strokeStyle = rgba(th['border-strong'], 0.8 * (1 - lightK));
            ctx.lineWidth = 2 / P.sc;
            ctx.beginPath();
            ctx.moveTo(-W2, 0);
            ctx.lineTo(W2, 0);
            if (f2 > 0) for (const sgn of [-1, 1]) { ctx.moveTo(-W2, sgn * H2 * 0.18 * f2); ctx.lineTo(W2, 0); }
            ctx.stroke();
          }
          // The words, stamped out of the fine print and riding the wings.
          const textA = 1 - sm(P.u, 0.18, 0.4);
          if (textA > 0) {
            ctx.save();
            path(body);
            ctx.clip();
            ctx.font = font(800, Lay.px);
            ctx.textBaseline = 'alphabetic';
            Lay.out.forEach((s, k) => {
              if (T < on[k] || !words[k].text) return;
              const st = 1 + 0.4 * (1 - OM.ease.outBack(OM.prog(T, on[k], on[k] + 0.1), 2));
              ctx.save();
              ctx.translate(s.x + s.w / 2, 0);
              ctx.scale(st, st);
              ctx.globalAlpha = planeA * textA;
              if (k === K) {
                ctx.fillStyle = OM.mix(ink.lit, ink.crest, launch);
                ctx.fillRect(-s.w / 2 - 14, -Lay.cap / 2 - 18, (s.w + 28) * OM.ease.outExpo(OM.prog(T, on[K], on[K] + 0.08)), Lay.cap + 36);
              }
              ctx.fillStyle = th['brand-ink'];
              ctx.fillText(words[k].text, -s.w / 2, Lay.cap / 2);
              ctx.restore();
            });
            ctx.restore();
          }
          ctx.restore();
        }
        // Far away it resolves into the spark: the crest cell and its halo.
        const dot = sm(P.u, 0.8, 0.97);
        if (dot > 0) {
          pool(ctx, P.p[0], P.p[1], 72, 72, ink.lit, 0.4 * dot);
          ctx.globalAlpha = dot;
          ctx.fillStyle = ink.crest;
          if (P.u >= 0.97) OM.cell(ctx, L, H.col, H.row, dpr);
          else ctx.fillRect(P.p[0] - L.cw / 2, P.p[1] - L.ch / 2, L.cw, L.ch);
          ctx.globalAlpha = 1;
        }
        // Camera: push in as it lifts, whip and tilt up after the throw, then pull back to rest before the spark.
        const w = OM.prog(T, THROW, 81.0);
        const bw = Math.sin(Math.PI * Math.sqrt(w)) ** 2 * (w < 1 ? 1 : 0);
        const pre = sm(T, on[K], THROW) * (1 - sm(T, THROW, 81.0));
        const cam = T < on[K] || w >= 1 ? null : { zoom: 1 + 0.08 * pre + 0.075 * bw, rot: 0.035 * bw, x: -50 * bw, y: 70 * bw };
        const prev = pose(T - 0.02).p;
        const vx = (P.p[0] - prev[0]) / 1920, vy = -(P.p[1] - prev[1]) / 1080;
        const amount = OM.post.envelope(T, start, END, { ramp: 0.2 }) * sm(T, THROW, THROW + 0.06) * (1 - sm(T, 80.7, 80.98));
        fx.apply(T, { amount, cam, p0: [vx * 0.12, vy * 0.12, 0, 0] });
      },
      release: () => (fx.release(), c.release()),
    };
  },
});
