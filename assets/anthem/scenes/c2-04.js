// c2-04 · Skyline. The glow from the cut sinks to the horizon and becomes the
// light dome over a night city whose windows are the film's lattice cells.
// Each word is spelled in windows across the towers, switching on in a fast
// wave on its onset, crest at the front and holding green; the key word's
// downbeat sends a wave through every window in the city. Snares wake scattered
// windows. After the line has read together the city goes dark window by
// window, the facades dissolve, and only the lattice it was built on is left:
// the grid of the next cut.

// Edit camera: the key word's downbeat (171.82) is the scene's big moment, the
// power surge through the whole city, so the camera's beat there is skipped and
// the scene lands its own bigger punch on that drum onset instead.
OM.edit.plan('c2-04', { skip: [171.816] });
OM.ownWords.add('c2-04');
(() => {
  const W = 800;
  OM.c2.ready('c2-04', W);
  const { pool, sm, decay } = OM.c2;

  const FX = `vec4 effect(vec2 uv) {
    vec2 p = cam(uv);
    if (uAmount <= 0.0) return src(p);
    // City bloom: the lit windows glow into the night air, and flicker faintly.
    vec4 c = src(p);
    vec3 b = vec3(0.0);
    vec2 px = 6.0 / uRes;
    for (int i = -3; i <= 3; i++) for (int k = -3; k <= 3; k++) b += max(src(p + vec2(float(i), float(k)) * px).rgb - 0.45, 0.0);
    b /= 49.0;
    float fl = 0.92 + 0.08 * hash(floor(p * vec2(132.0, 75.0)) + floor(uTime * 8.0));
    c.rgb = c.rgb * mix(1.0, fl, uAmount * step(0.3, c.g)) + b * vec3(0.7, 1.0, 0.6) * 1.8 * uAmount;
    return c;
  }`;

  /**
   * The wall: every home-lattice cell a dark window in its facade, under the lattice
   * lines. The skyline grows into it at the end of c2-04 and c2-05's grimy window
   * is the same wall, so the cut between them is this exact frame.
   */
  let wallC = null;
  OM.c2.wallCanvas = (dpr) => {
    if (wallC && wallC.dpr === dpr) return wallC.cv;
    const HM = OM.HOME, th = OM.theme('tokyo-night');
    const cvs = document.createElement('canvas');
    cvs.width = 1920 * dpr;
    cvs.height = 1080 * dpr;
    const x = cvs.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let row = HM.rMin; row < HM.rMin + HM.rows; row++)
      for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
        x.fillStyle = th.surface;
        OM.cell(x, HM, col, row, dpr);
        x.fillStyle = th['bg-deep'];
        x.fillRect(HM.x0 + col * HM.cw + 2, HM.y0 + row * HM.ch + 2, HM.cw - 4, HM.ch - 4);
      }
    wallC = { dpr, cv: cvs };
    return cvs;
  };
  /** The lattice lines exactly as the grid handoff draws them, at alpha a. */
  OM.c2.leading = (ctx, dpr, a = 1) => {
    const HM = OM.HOME, snap = (v) => Math.round(v * dpr) / dpr;
    ctx.fillStyle = OM.c2.rgba(OM.theme('tokyo-night')['border-subtle'], a);
    for (let cc = HM.cMin; cc <= HM.cMin + HM.cols; cc++) ctx.fillRect(snap(HM.x0 + cc * HM.cw), 0, 1, 1080);
    for (let r = HM.rMin; r <= HM.rMin + HM.rows; r++) ctx.fillRect(0, snap(HM.y0 + r * HM.ch), 1920, 1);
  };
  /** The shared cut frame of c2-04 > c2-05. */
  OM.c2.wall = (ctx, dpr) => {
    ctx.fillStyle = OM.fieldInks('tokyo-night').bg;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.drawImage(OM.c2.wallCanvas(dpr), 0, 0, 1920, 1080);
    OM.c2.leading(ctx, dpr, 1);
  };

  OM.scene({
    id: 'c2-04',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const END = start + duration;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const words = OM.sung('c2-04');
      const on = words.map((w) => w.t0);
      // The key word: the longest held one (the city-wide wave lands with it).
      let K = 0;
      words.forEach((w, k) => { if (w.t1 - w.t0 > words[K].t1 - words[K].t0) K = k; });
      const DB1 = OM.beatOnset(OM.downbeatsIn(171.6, 172)[0] || 171.851), DB2 = OM.beatOnset(OM.downbeatsIn(173.8, 174.2)[0] || 173.987);
      const SNARES = [170.360, 170.822, 171.408, 171.860, 172.184, 172.746, 172.934, 173.412]; // measured snare onsets
      const OUT = DB2, GONE = 174.42, WALL = 174.380; // WALL: the measured kick the wall lands on
      const HM = OM.HOME, V = 12000; // the switch-on wave, fast enough that a word reads within a frame or two

      const get = OM.c2.lazy(W, () => {
        const L = OM.c2.layout(words, { weight: W, cap: 150, maxW: 1560, cy: 580, rows: 3, lead: 1.32, minCap: 100 });
        const lit = new Map(); // "col,row" -> { k, t } when the window lights
        const colsWithText = new Map(); // col -> top text row
        words.forEach((wd, k) => {
          const p = L.place[k];
          if (!p) return;
          for (const cl of OM.c2.raster(wd.text, p.x, p.base, L.px, W, HM.cw, HM.ch, HM.x0, HM.y0, 0.36)) {
            lit.set(cl.i + ',' + cl.j, { k, t: on[k] + (cl.x - p.x) / V });
            colsWithText.set(cl.i, Math.min(colsWithText.get(cl.i) ?? 999, cl.j));
          }
        });
        // Towers left to right; an alley only where no letter would be cut.
        const rng = OM.rng(0xc204), bottom = HM.rMin + HM.rows;
        const top = new Map();
        let col = HM.cMin;
        while (col < HM.cMin + HM.cols) {
          const w = 4 + Math.floor(rng() * 8);
          const x = HM.x0 + col * HM.cw;
          const edge = Math.abs(x - 960) / 960;
          let t = OM.cellAt(HM, 0, 200 + 520 * edge * edge + 140 * rng()).row;
          for (let i = col; i < col + w; i++) if (colsWithText.has(i)) t = Math.min(t, colsWithText.get(i) - 2 - Math.floor(rng() * 4));
          for (let i = col; i < col + w; i++) top.set(i, t);
          col += w;
          if (!colsWithText.has(col)) col += 1; // the alley
        }
        return { lit, top, bottom };
      });

      // Flat per-window tables, built once.
      let wins = null;
      const win = () => {
        const g = get();
        if (wins && wins.src === g) return wins;
        const list = [];
        for (const [col, t0] of g.top) for (let row = t0; row < g.bottom; row++) list.push([col, row]);
        const n = list.length, F = (f) => Float32Array.from(list, f);
        wins = {
          src: g, n,
          col: Int32Array.from(list, ([c0]) => c0), row: Int32Array.from(list, ([, r]) => r),
          x: F(([c0]) => HM.x0 + c0 * HM.cw), y: F(([, r]) => HM.y0 + r * HM.ch),
          k: Int32Array.from(list, ([c0, r]) => { const w = g.lit.get(c0 + ',' + r); return w ? w.k : -1; }),
          t: Float64Array.from(list, ([c0, r]) => { const w = g.lit.get(c0 + ',' + r); return w ? w.t : 0; }),
          h4: F(([c0, r]) => OM.hash(c0, r, 4)), h5: F(([c0, r]) => OM.hash(c0, r, 5)),
          r: F(([c0, r]) => Math.hypot(HM.x0 + c0 * HM.cw - 960, (HM.y0 + r * HM.ch - 560) * 1.4)),
        };
        return wins;
      };
      return {
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.05) return OM.handoff('glow', ctx, T, dpr);
          if (T > END - 0.07) return OM.c2.wall(ctx, dpr);
          const { lit, top, bottom } = get();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          // The glow sinks behind the skyline into its light dome.
          const sink = OM.ease.inOutCubic(OM.prog(T, start, start + 0.7));
          const out = sm(T, OUT, GONE);
          pool(ctx, 960, OM.lerp(540, 980, sink), 620 + 500 * sink, OM.lerp(620, 300, sink), ink.lit, OM.lerp(0.5, 0.2, sink) * (1 - out));

          const facade = sm(T, start, start + 0.35);
          // Wall rise: after the line, every tower climbs to the top of the frame and the alleys fill, landing on k174.38: the city becomes one wall of windows.
          const rise = OM.ease.inOutCubic(OM.prog(T, OUT, WALL));
          const nSn = OM.hitCount(SNARES, T);
          const sn = SNARES.reduce((a, s) => Math.max(a, decay(T, s, 0.1)), 0);
          const dbA = T - DB1;
          // Darkening: windows go out right to left, a beat's worth of sweep.
          const sweep = 2100 - 2400 * OM.prog(T, OUT, OUT + 0.3);
          // The towers and their dark windows are static: one cached layer, faded as a whole.
          if (facade > 0) {
            ctx.save();
            ctx.globalAlpha = facade;
            ctx.beginPath();
            for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
              const t0 = top.has(col) ? top.get(col) : bottom;
              const r = Math.round(OM.lerp(t0, HM.rMin, rise));
              const x0 = Math.round((HM.x0 + col * HM.cw) * dpr) / dpr, y0 = Math.round((HM.y0 + r * HM.ch) * dpr) / dpr;
              ctx.rect(x0, y0, Math.round((HM.x0 + (col + 1) * HM.cw) * dpr) / dpr - x0, 1080 - y0);
            }
            ctx.clip();
            ctx.drawImage(OM.c2.wallCanvas(dpr), 0, 0, 1920, 1080);
            ctx.restore();
          }
          // Only lit windows are drawn per frame, batched by ink.
          const W2 = win();
          const INKS = [ink.dim, ink.mid, ink.lit, ink.hover, ink.crest];
          const full = INKS.map(() => []), inset = INKS.map(() => []);
          const CI = { [ink.dim]: 0, [ink.mid]: 1, [ink.lit]: 2, [ink.hover]: 3, [ink.crest]: 4 };
          for (let n = 0; n < W2.n; n++) {
            const x = W2.x[n], y = W2.y[n], k = W2.k[n];
            if (x > sweep && T >= OUT) continue;
            let p = null;
            if (k >= 0 && T >= W2.t[n]) {
              const a = T - W2.t[n];
              p = a < 0.06 ? ink.crest : k === K ? (a < 0.4 ? ink.hover : ink.crest) : a < 0.2 ? ink.crest : ink.hover;
              if (sn > 0.5 && OM.hash(W2.col[n], W2.row[n], nSn) < 0.3) p = ink.crest;
              full[CI[p]].push(n);
              continue;
            }
            if (W2.h4[n] < 0.02 + 0.006 * nSn) p = W2.h5[n] < 0.5 ? ink.dim : ink.mid;
            // Power surge on the key word's downbeat: every window in the city pops on as the racing front reaches it, then browns out back to the night.
            if (dbA >= 0 && dbA < 1.2) {
              const a = (dbA * 3000 - W2.r[n]) / 3000;
              if (a > 0) p = a < 0.025 ? ink.crest : a < 0.06 ? ink.lit : a < 0.14 ? ink.mid : a < 0.3 && W2.h5[n] < 0.45 ? ink.dim : p;
            }
            if (p) inset[CI[p]].push(n);
          }
          INKS.forEach((col, i) => {
            if (!full[i].length && !inset[i].length) return;
            ctx.fillStyle = col;
            ctx.beginPath();
            for (const n of full[i]) {
              const x0 = Math.round(W2.x[n] * dpr) / dpr, y0 = Math.round(W2.y[n] * dpr) / dpr;
              ctx.rect(x0, y0, Math.round((W2.x[n] + HM.cw) * dpr) / dpr - x0, Math.round((W2.y[n] + HM.ch) * dpr) / dpr - y0);
            }
            for (const n of inset[i]) ctx.rect(W2.x[n] + 2, W2.y[n] + 2, HM.cw - 4, HM.ch - 4);
            ctx.fill();
          });
          // The wall's leading comes through as it closes.
          const g = sm(T, OUT + 0.1, GONE);
          if (g > 0) OM.c2.leading(ctx, dpr, g);
          // The surge's crackle: arcs jumping between windows along the racing front, kept off the words.
          if (dbA >= 0 && dbA < 0.55) {
            const R = dbA * 3000, slot = Math.floor(T * 30);
            ctx.strokeStyle = ink.crest;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i = 0; i < 26; i++) {
              const ang = OM.hash(i, slot, 131) * 6.283, rr = R + 40 * (OM.hash(slot, i, 132) - 0.5);
              let x = 960 + Math.cos(ang) * rr, y = 560 + (Math.sin(ang) * rr) / 1.4;
              if (x < -20 || x > 1940 || y < -20 || y > 1100) continue;
              const cc = OM.cellAt(HM, x, y);
              if (lit.has(cc.col + ',' + cc.row)) continue;
              ctx.moveTo(x, y);
              for (let s = 0; s < 5; s++) {
                x += (OM.hash(i, s + slot, 133) - 0.5) * 60 + Math.cos(ang + 1.57) * 18;
                y += (OM.hash(s + slot, i, 134) - 0.5) * 60 + Math.sin(ang + 1.57) * 18;
                ctx.lineTo(x, y);
              }
            }
            ctx.stroke();
          }
        },
        render(t, T) {
          this.draw(t, T);
          const ctx = c.ensure();
          if (OM.c2.live(T, start, END)) {
          const { top } = get();
          const out = sm(T, OUT, GONE);
          // Searchlights sweeping the sky.
          for (const [bx, ph] of [[330, 0], [1610, 2.1]]) {
            const ang = -Math.PI / 2 + 0.5 * Math.sin(T * 0.8 + ph);
            ctx.save();
            ctx.translate(bx, 1080);
            ctx.rotate(ang + Math.PI / 2);
            const g = ctx.createLinearGradient(0, 0, 0, -1100);
            g.addColorStop(0, OM.c2.rgba(ink.lit, 0.12 * (1 - out) * sm(T, start, start + 0.6)));
            g.addColorStop(1, OM.c2.rgba(ink.lit, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.lineTo(90, -1100);
            ctx.lineTo(-90, -1100);
            ctx.fill();
            ctx.restore();
          }
          // Warning lights blinking on the tower tops, on the beat: half of them on each alternate drum onset.
          const bt = OM.c2.beat(T);
          let prev = null;
          for (const [col, r] of top) {
            if (r !== prev && OM.hash(col, 0, 41) < 0.5) {
              const on2 = (bt.i + (OM.hash(col, 1, 41) < 0.5 ? 0 : 1)) % 2 === 0 && T - bt.t < 0.2;
              if (on2 && !out && T > start + 0.5) {
                ctx.fillStyle = ink.crest;
                ctx.fillRect(HM.x0 + col * HM.cw + 3, HM.y0 + (r - 1) * HM.ch + 4, 7, 7);
              }
            }
            prev = r;
          }
          }
          // Helicopter pass: a slow track across the city with an altitude bob, punching in on the key word's downbeat surge.
          OM.c2.apply(fx, T, start, END, { amount: 1, x: 40 - 80 * OM.prog(T, start, END), y: 10 * Math.sin(T * 1.6), rot: 0.008 * Math.sin(T * 0.5), punch: 0.045 * OM.c2.punch(T, DB1) });
        },
        release: () => {
          wins = null;
          fx.release();
          c.release();
        },
      };
    },
  });
})();
