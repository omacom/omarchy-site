// v1-07 · The photocopier. The bar of light v1-06 forged is the copier's
// lamp. On each word it splits and sweeps out over the glass, and behind it a
// copy comes out with that word on it; each copy is [line] last, so
// each word comes out worse: blockier toner, dropped cells, rows slipping, a
// ghost image, specks and streaks, greyer paper. The old copies are shoved
// back into a pile. On the held last word the lamp sweeps the whole frame,
// the pile is blown away, and the last sheet prints the whole line crisp and
// new: an original. Then the lamp closes back to one row, and the row bends
// into a ring that squares up into the mark at v1-08's print core
// (V.lampRing, the shared cut frame).

// Edit camera: the section's defaults fit. The scene's own camera only rides each sweep of the lamp
// (a soft vertical move per word, no drum hits), so nothing stacks. The key word (the held last
// word, 65.663) takes the camera's 65.686 backbeat jolt, and the scene's own camera adds a punch on
// its onset, so the original's print is the biggest hit of the scene.
OM.edit.plan('v1-07', {});

OM.ownWords.add('v1-07');
(() => {
  const V = OM.v1;
  const WEIGHT = 800;
  const PROBE = V.ready('v1-07-type', WEIGHT);
  const GLSL = V.TEXTMASK + `
vec4 effect(vec2 uv) {
  vec4 c = src(cam(uv));
  float a = uAmount;
  if (a <= 0.0) return c;
  float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  float crush = smoothstep(0.08, 0.5, l);
  float n = hash(floor(uv * uRes / 3.0) + floor(uTime * 15.0)) - 0.5; // toner noise
  float band = 0.5 + 0.5 * sin(uv.y * 140.0 + uTime * 3.0); // banding
  vec3 col = mix(c.rgb, c.rgb * (0.55 + 0.9 * crush), a); // crushed contrast
  col *= 1.0 + a * (0.22 * n - 0.08 * band);
  return vec4(col, 1.0);
}`;
  OM.scene({
    id: 'v1-07',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = V.post(el, c, GLSL);
      const END = start + duration, H = V.HOLD, H0 = 0.045; // the first sweep starts 0.06s in
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const on = OM.sung('v1-07').map((w) => w.t0);
      const N = on.length, LAST = N - 1;
      const HM = OM.HOME, G = { x0: HM.x0, y0: HM.y0, cw: HM.cw / 2, ch: HM.ch / 2 };
      const hc = OM.cellAt(HM, 960, 540), hrow = hc.row, hcol = hc.col;
      const LY = HM.y0 + (hrow + 0.5) * HM.ch, LX = HM.x0 + (hcol + 0.5) * HM.cw;
      const SH = { w: 1560, h: 640 }, FS = { w: 1800, h: 900 };
      const CLOSE0 = 66.6, CLOSE1 = 66.82, SHRINK1 = END - H - 0.01;
      const deg = (k) => 0.15 + 0.7 * (k / Math.max(1, LAST - 1));

      const get = V.lazy(PROBE, () => {
        const mt = V.metrics(WEIGHT);
        const sung = OM.sung('v1-07');
        // The copies: one word each, rasterized ever blockier.
        const copies = sung.slice(0, LAST).map((w, k) => {
          const s = w.text.toUpperCase();
          const size = Math.min(170 / mt.cap, 1420 / (Math.max(1, s.length) * mt.adv));
          const A = mt.adv * size, cell = 8 + 12 * deg(k);
          const Gk = { x0: 960, y0: 540, cw: cell, ch: cell };
          return { cell, cells: V.raster(s, V.font(WEIGHT, size), size, 960 - (s.length * A) / 2, 540 + (mt.cap * size) / 2, Gk, A), G: Gk };
        });
        // The original: the whole line, crisp, on the home half lattice.
        const L = V.layout('v1-07', { weight: WEIGHT, cap: 118, maxW: 1660 });
        const lh = L.cap * 1.55;
        const orig = L.words.map((wd) => {
          const base = 540 + (wd.row - (L.rows - 1) / 2) * lh + L.cap / 2;
          return { cells: V.raster(wd.text, L.font, L.size, wd.x, base, G, L.A), top: base - L.cap, cap: L.cap };
        });
        return { copies, orig };
      });
      // How far the lamp has swept out from its row for the sweep starting at t0.
      const ext = (T, t0, max, d) => max * OM.ease.outCubic(OM.prog(T, t0, t0 + d));
      const bars = (ctx, dpr, e, a) => {
        if (a <= 0.01) return;
        const rows = [hrow - Math.round(e / HM.ch), hrow + Math.round(e / HM.ch)];
        for (const r of rows) {
          const y = HM.y0 + (r + 0.5) * HM.ch;
          const g = ctx.createLinearGradient(0, y - 50, 0, y + 50);
          g.addColorStop(0, V.rgba(ink.lit, 0));
          g.addColorStop(0.5, V.rgba(ink.lit, 0.22 * a * Math.min(1, e / 40)));
          g.addColorStop(1, V.rgba(ink.lit, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, y - 50, 1920, 100);
          ctx.globalAlpha = a;
          ctx.fillStyle = ink.crest;
          for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) OM.cell(ctx, HM, col, r, dpr);
          ctx.globalAlpha = 1;
        }
      };
      const copy = (ctx, S, k, dx, dy, rot) => {
        const d = deg(k), cp = S.copies[k];
        ctx.save();
        ctx.translate(960 + dx, 540 + dy);
        ctx.rotate(rot + (OM.hash(k, 1, 70) - 0.5) * 0.03 * d);
        ctx.translate(-960, -540);
        ctx.fillStyle = OM.mix(th['surface-2'], th['bg-deep'], d * 0.6);
        ctx.fillRect(960 - SH.w / 2, 540 - SH.h / 2, SH.w, SH.h);
        ctx.strokeStyle = th['border-strong'];
        ctx.lineWidth = 2;
        ctx.strokeRect(960 - SH.w / 2, 540 - SH.h / 2, SH.w, SH.h);
        const Gk = cp.G, cell = cp.cell;
        const inkC = OM.mix(th.text, th['text-muted'], d);
        // The ghost of the copy before, then the copy itself, its rows slipping and cells dropping out.
        for (const [pass, col, a] of [[1, th['border-strong'], 0.5], [0, inkC, 1]]) {
          ctx.globalAlpha = a;
          ctx.fillStyle = col;
          for (const [q, r] of cp.cells) {
            if (OM.hash(q, r, k + 5) < d * 0.42) continue;
            const sx = (OM.hash(r, k, 71) - 0.5) * d * 24 + pass * 10 * d, sy = pass * 6 * d;
            ctx.fillRect(Gk.x0 + q * cell + sx, Gk.y0 + r * cell + sy, cell - 0.5, cell - 0.5);
          }
        }
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = th['border-strong'];
        for (let i = 0; i < Math.round(90 * d); i++)
          ctx.fillRect(960 - SH.w / 2 + OM.hash(i, k, 72) * (SH.w - cell), 540 - SH.h / 2 + OM.hash(i, k, 73) * (SH.h - cell), cell * 0.8, cell * 0.8);
        if (d > 0.3) {
          ctx.globalAlpha = 0.35 * d;
          ctx.fillRect(960 - SH.w / 2 + OM.hash(k, 2, 74) * SH.w, 540 - SH.h / 2, 5, SH.h);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      };

      // Camera: tracks the lamp's sweep, riding out with the bars, and punches in as the original prints on
      // the last word. The copy's degradation is in the shader too, and it resolves to nothing on the last
      // word: the original is crisp.
      const FXP = (ctx, dpr, T) => {
        const e = V.env(T, start, END);
        const k = OM.hitCount(on, T) - 1;
        const d = k < 0 ? 0 : k < LAST ? 0.25 + 0.4 * deg(k) : Math.max(0, 0.6 * (1 - OM.prog(T, on[LAST], on[LAST] + 0.3)));
        const sweep = k < 0 ? 0 : Math.sin(Math.PI * OM.prog(T, on[k], on[k] + 0.32));
        const punch = T >= on[LAST] ? 0.035 * Math.exp(-(T - on[LAST]) / 0.1) : 0;
        return { amount: e * d, cam: { zoom: 1 + (0.03 + punch) * e, y: 18 * sweep * e } };
      };
      return {
        render(t, T) {
          this.draw(t, T);
          fx.apply(T, FXP(c.ensure(), c.dpr, T));
        },
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + H0 || T < on[0]) return OM.handoff('line', ctx, T, dpr);
          if (T >= END - H) {
            ctx.fillStyle = ink.bg;
            ctx.fillRect(0, 0, 1920, 1080);
            return V.lampRing(ctx, T, T >= 66.9 ? 0.3 * Math.exp(-(T - 66.9) / 0.12) : 0);
          }
          const S = get();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const k = OM.hitCount(on, T) - 1;
          if (T >= CLOSE1) {
            // Lamp to mark: the row bends into a ring; the lamp surges on the 66.90 kick.
            V.lampRing(ctx, T, T >= 66.9 ? 0.3 * Math.exp(-(T - 66.9) / 0.12) : 0);
            return;
          }
          if (k < LAST) {
            // A copy per word, the older ones shoved back into a pile.
            for (let j = Math.max(0, k - 4); j < k; j++) {
              const back = (k - 1 - j) + OM.ease.outExpo(OM.prog(T, on[k], on[k] + 0.22));
              copy(ctx, S, j, -back * 38, -back * 26, -back * 0.016);
            }
            const e = ext(T, on[k], SH.h / 2 + 40, k ? 0.15 : 0.2); // each sweep snaps open on its word (the first a touch softer)
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, LY - e, 1920, 2 * e);
            ctx.clip();
            copy(ctx, S, k, 0, 0, 0);
            ctx.restore();
            bars(ctx, dpr, e, 1 - OM.prog(T, on[k] + 0.12, on[k] + 0.24));
            return;
          }
          // The original: the pile blown away, the whole line printed crisp and new.
          const blow = OM.ease.inCubic(OM.prog(T, on[LAST], on[LAST] + 0.4));
          if (blow < 1)
            for (let j = Math.max(0, LAST - 4); j < LAST; j++) {
              const back = LAST - 1 - j;
              copy(ctx, S, j, -back * 38 - 2600 * blow * (1 + back * 0.1), -back * 26 + 120 * blow, -back * 0.016 - 0.2 * blow);
            }
          const close = T >= CLOSE0 ? 1 - OM.ease.inCubic(OM.prog(T, CLOSE0, CLOSE1)) : 1;
          const e = T >= CLOSE0 ? 560 * close : ext(T, on[LAST], 560, 0.22);
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, LY - e, 1920, 2 * e);
          ctx.clip();
          ctx.fillStyle = th['bg-deep'];
          ctx.fillRect(960 - FS.w / 2, 540 - FS.h / 2, FS.w, FS.h);
          ctx.strokeStyle = th.brand;
          ctx.lineWidth = 3;
          ctx.strokeRect(960 - FS.w / 2, 540 - FS.h / 2, FS.w, FS.h);
          const age = T - on[LAST];
          for (const o of S.orig)
            for (const [q, r] of o.cells) {
              const f = (G.y0 + (r + 0.5) * G.ch - o.top) / o.cap;
              const thr = OM.threshold(q, r);
              ctx.fillStyle = age < 0.5 && thr > age / 0.5 ? ink.crest : f < 0.34 ? ink.crest : f < 0.67 ? ink.hover : ink.lit;
              OM.cell(ctx, G, q, r, dpr);
            }
          ctx.restore();
          const a = T >= CLOSE0 ? 1 : 1 - OM.prog(T, on[LAST] + 0.2, on[LAST] + 0.34);
          bars(ctx, dpr, e, a);
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
