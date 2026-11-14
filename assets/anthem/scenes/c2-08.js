// c2-08 · Inside the machine. The spark from the cut is the machine's core,
// seen from far off; we dive in and the board opens around it, traces leading
// out from the core like city streets. Each word is a circuit on the board:
// on its onset current runs from the core into it and floods its letterforms
// trace by trace. The key word holds its charge through its long note and the
// downbeat pulses the entire board. Then the dive resumes on the roll: the
// words stream past and go dark, the core rushes up to fill the frame, and on
// the last hit its lights go out into the night the bridge opens on.

// Edit camera: the key word's downbeat (188.81), where its charge pulses the
// whole board, is the scene's big moment: the camera's beat there is skipped and
// the scene lands its own bigger punch on that drum onset. At the dive's downbeat
// (191.11) the camera's punch leaves the words about 20 px clear of the band.
OM.edit.plan('c2-08', { skip: [188.812] });
OM.ownWords.add('c2-08');
(() => {
  const W = 800;
  OM.c2.ready('c2-08', W);
  const { pool, sm, decay } = OM.c2;

  const FX = `vec4 effect(vec2 uv) {
    vec2 p = cam(uv);
    if (uAmount <= 0.0) return src(p);
    // Circuit glow: green traces bloom, with rings of current racing out from the core.
    vec4 c = src(p);
    vec3 g = vec3(0.0);
    vec2 px = 6.0 / uRes;
    for (int i = -2; i <= 2; i++) for (int k = -2; k <= 2; k++) { vec3 s = src(p + vec2(float(i), float(k)) * px).rgb; g += s * step(s.r + 0.12, s.g); }
    g /= 25.0;
    float r = length((p - vec2(0.5)) * vec2(uRes.x / uRes.y, 1.0));
    float wave = pow(0.5 + 0.5 * sin(r * 40.0 - uTime * 18.0), 4.0);
    c.rgb += g * (0.6 + 2.0 * wave) * uAmount;
    return c;
  }`;

  // The board, shared with c2-07 (which grows it out of its bridge deck for the cut).
  OM.c2.board = (() => {
    const HM = OM.HOME, sp = OM.cellAt(HM, 960, 540);
    const ZX = HM.x0 + (sp.col + 0.5) * HM.cw, ZY = HM.y0 + (sp.row + 0.5) * HM.ch;
    const CORE = 44;
    const S0 = HM.cw / CORE;
    // The board: Manhattan traces walking out from the core.
    const rng = OM.rng(0xc208), traces = [];
    for (let n = 0; n < 72; n++) {
      const side = n % 4, off = (rng() - 0.5) * CORE * 0.9;
      let x = ZX + [CORE / 2, 0, -CORE / 2, 0][side] + (side % 2 ? off : 0), y = ZY + [0, CORE / 2, 0, -CORE / 2][side] + (side % 2 ? 0 : off);
      let dir = side;
      const pts = [[x, y]];
      let len = 0;
      const goal = 500 + 1300 * rng();
      while (len < goal) {
        const L = 30 + 160 * rng();
        const v = [[1, 0], [0, 1], [-1, 0], [0, -1]][dir];
        x += v[0] * L;
        y += v[1] * L;
        len += L;
        pts.push([x, y]);
        const turn = rng();
        if (turn < 0.5) dir = (side + (rng() < 0.5 ? 1 : 3)) % 4; // sideways
        else dir = side; // outward
      }
      const segs = [];
      let acc = 0;
      for (let i = 1; i < pts.length; i++) {
        const l = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
        segs.push([pts[i - 1], pts[i], acc, l]);
        acc += l;
      }
      traces.push({ pts, segs, len: acc, ph: rng() });
    }

    return { HM, ZX, ZY, CORE, S0, traces };
  })();
  /**
   * The board seen from far off: its traces grown out to `grow` at the scale where
   * the core is one lattice cell, and the core lit. c2-07 ends on chip(1) and c2-08
   * opens on it: the cut frame both draw.
   */
  OM.c2.chip = (ctx, grow, { bg = true, core = true } = {}) => {
    const { ZX, ZY, CORE, S0, traces } = OM.c2.board, ink = OM.fieldInks('tokyo-night');
    const X = (x) => ZX + (x - ZX) * S0, Y = (y) => ZY + (y - ZY) * S0;
    if (bg) {
      ctx.fillStyle = ink.bg;
      ctx.fillRect(0, 0, 1920, 1080);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = OM.c2.rgba(ink.dim, 1);
    ctx.beginPath();
    for (const tr of traces) {
      const lim = tr.len * grow;
      for (const [a, b, acc, l] of tr.segs) {
        if (acc > lim) break;
        const f = Math.min(1, (lim - acc) / l);
        ctx.moveTo(X(a[0]), Y(a[1]));
        ctx.lineTo(X(a[0] + (b[0] - a[0]) * f), Y(a[1] + (b[1] - a[1]) * f));
      }
    }
    ctx.stroke();
    if (!core) return;
    const cs = CORE * S0;
    OM.c2.pool(ctx, ZX, ZY, 72, 72, ink.lit, 0.4);
    ctx.fillStyle = ink.bg;
    ctx.fillRect(ZX - cs / 2, ZY - cs / 2, cs, cs);
    ctx.strokeStyle = OM.c2.rgba(ink.crest, 1);
    ctx.lineWidth = 2;
    ctx.strokeRect(ZX - cs / 2, ZY - cs / 2, cs, cs);
    ctx.fillStyle = OM.c2.rgba(ink.crest, 1);
    ctx.fillRect(ZX - (cs * 0.34) / 2, ZY - (cs * 0.34) / 2, cs * 0.34, cs * 0.34);
  };

  OM.scene({
    id: 'c2-08',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const END = start + duration;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const words = OM.sung('c2-08');
      const on = words.map((w) => w.t0);
      let K = 0;
      words.forEach((w, k) => { if (w.t1 - w.t0 > words[K].t1 - words[K].t0) K = k; });
      const KICKS = [187.748, 188.026, 188.428, 188.552]; // measured kick onsets
      const DB1 = OM.beatOnset(OM.downbeatsIn(188.7, 189)[0] || 188.848), DB2 = OM.beatOnset(OM.downbeatsIn(191, 191.3)[0] || 191.147); // the downbeats' drum onsets
      const OFF = 192.95; // the core goes dark at the top of the roll
      const { HM, ZX, ZY, CORE, S0, traces } = OM.c2.board;
      const CS = 8;
      /** Camera scale: from the spark out to the board, a slow drift, then the dive on the roll. */
      const scale = (T) => {
        const open = OM.lerp(S0, 1, OM.ease.inOutCubic(OM.prog(T, start + 0.03, on[0] + 0.35)));
        return open * (1 + 0.1 * OM.prog(T, on[0], DB2)) * Math.exp(2.4 * Math.max(0, T - DB2 - 0.1));
      };

      const get = OM.c2.lazy(W, () => {
        const opt = { weight: W, cap: 150, maxW: 1720, cy: 540, rows: 3, lead: 1.5, minCap: 100 };
        let L = OM.c2.layout(words, opt);
        // One row would run through the core: lift it clear, so the feeds climb from the core into the words.
        if (L.rowsUsed === 1) L = OM.c2.layout(words, { ...opt, rows: 1, cy: 540 - 1.1 * L.cap - 40 });
        return words.map((wd, k) => {
          const p = L.place[k];
          if (!p) return null;
          const cells = OM.c2.raster(wd.text, p.x, p.base, L.px, W, CS);
          const idx = new Map(cells.map((cl, n) => [cl.i + ',' + cl.j, n]));
          // Current enters at the cell nearest the core and floods breadth-first.
          let entry = 0, best = Infinity;
          cells.forEach((cl, n) => { const d = Math.hypot(cl.x - ZX, cl.y - ZY); if (d < best) { best = d; entry = n; } });
          // Every letter is fed at its cell nearest the core, so the whole word floods at once.
          const seed = new Map();
          cells.forEach((cl, n) => {
            const d = Math.hypot(cl.x - ZX, cl.y - ZY), b = seed.get(cl.l);
            if (!b || d < b[1]) seed.set(cl.l, [n, d]);
          });
          const dist = new Int32Array(cells.length).fill(-1), q = [...seed.values()].map(([n]) => n);
          for (const n of q) dist[n] = 0;
          for (let h = 0; h < q.length; h++) {
            const a = cells[q[h]];
            for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
              const b = idx.get(a.i + di + ',' + (a.j + dj));
              if (b !== undefined && dist[b] < 0) { dist[b] = dist[q[h]] + 1; q.push(b); }
            }
          }
          let dmax = 1;
          for (const d of dist) dmax = Math.max(dmax, d);
          const links = [];
          cells.forEach((cl, n) => {
            const r = idx.get(cl.i + 1 + ',' + cl.j), b = idx.get(cl.i + ',' + (cl.j + 1));
            const deg = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => idx.has(cl.i + di + ',' + (cl.j + dj))).length;
            if (r !== undefined) links.push([n, r]);
            if (b !== undefined) links.push([n, b]);
            if (deg <= 1) links.push([n, n]); // a pad
          });
          const e = cells[entry] || { x: ZX, y: ZY };
          return { k, cells, dist, dmax, links, feed: [[ZX, ZY], [e.x + CS / 2, ZY], [e.x + CS / 2, e.y + CS / 2]] };
        });
      });

      return {
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.05) return OM.c2.chip(ctx, 1); // the board the bridge's deck grew into, from the cut
          if (T > END - 0.07) return OM.handoff('night', ctx, T, dpr);
          const circuits = get();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const s = scale(T);
          const X = (x) => ZX + (x - ZX) * s, Y = (y) => ZY + (y - ZY) * s;
          const dark = sm(T, OFF - 0.1, OFF + 0.25); // lights out, eased into the night
          const wordsOut = OM.prog(T, DB2 + 0.5, DB2 + 1.2);
          const grow = 1; // the board arrives whole from the cut
          const pulse = Math.max(decay(T, DB1, 0.16), ...KICKS.map((k) => 0.5 * decay(T, k, 0.08)));

          // Board traces, with packets of current riding out from the core on the hits.
          ctx.lineWidth = Math.max(1, 2 * Math.min(s, 3));
          ctx.strokeStyle = OM.c2.rgba(pulse > 0.5 ? ink.mid : ink.dim, 1 - dark);
          ctx.beginPath();
          for (const tr of traces) {
            const lim = tr.len * grow;
            for (const [a, b, acc, l] of tr.segs) {
              if (acc > lim) break;
              const f = Math.min(1, (lim - acc) / l);
              ctx.moveTo(X(a[0]), Y(a[1]));
              ctx.lineTo(X(a[0] + (b[0] - a[0]) * f), Y(a[1] + (b[1] - a[1]) * f));
            }
          }
          ctx.stroke();
          const hits = [...on, ...KICKS, DB1, 189.624, 190.530, DB2]; // 189.62: the perc; 190.53: beat 4's onset
          ctx.fillStyle = OM.c2.rgba(ink.crest, 1 - dark);
          for (const h of hits) {
            const a = T - h;
            if (a < 0 || a > 0.6) continue;
            const d = a * 2400;
            traces.forEach((tr, n) => {
              if ((n + Math.round(h * 10)) % 3) return;
              for (const [p, q, acc, l] of tr.segs) {
                if (d < acc || d > acc + l) continue;
                const f = (d - acc) / l;
                ctx.fillRect(X(p[0] + (q[0] - p[0]) * f) - 3 * Math.min(s, 3), Y(p[1] + (q[1] - p[1]) * f) - 3 * Math.min(s, 3), 6 * Math.min(s, 3), 6 * Math.min(s, 3));
              }
            });
          }

          // The core.
          const cs = CORE * s, cx = X(ZX), cy = Y(ZY);
          if (dark < 1) {
            pool(ctx, cx, cy, Math.max(72, cs * 1.6), Math.max(72, cs * 1.6), ink.lit, (0.4 + 0.2 * pulse) * (1 - dark));
            ctx.fillStyle = ink.bg;
            ctx.fillRect(cx - cs / 2, cy - cs / 2, cs, cs);
            ctx.strokeStyle = OM.c2.rgba(ink.crest, 1 - dark);
            ctx.lineWidth = Math.max(2, cs / 14);
            ctx.strokeRect(cx - cs / 2, cy - cs / 2, cs, cs);
            ctx.fillStyle = OM.c2.rgba(ink.crest, 1 - dark);
            const ic = cs * 0.34;
            ctx.fillRect(cx - ic / 2, cy - ic / 2, ic, ic);
          }

          // The word circuits: fed from the core on the onset, flooding their letterforms.
          for (const w of circuits) {
            if (!w || T < on[w.k] - 0.1) continue;
            const flood = w.k === K ? 0.14 : 0.1; // fast enough that each word reads within a few frames of its onset
            const age = T - on[w.k];
            // The feed: a trace from the core to the word's entry, current arriving on the onset.
            const fd = OM.prog(T, on[w.k] - 0.1, on[w.k]);
            ctx.strokeStyle = OM.c2.rgba(ink.hover, (1 - wordsOut) * (1 - dark));
            ctx.lineWidth = Math.max(1, 2 * Math.min(s, 3));
            ctx.beginPath();
            const [a, b, c2] = w.feed, l1 = Math.abs(b[0] - a[0]), l2 = Math.abs(c2[1] - b[1]), lim = (l1 + l2) * fd;
            ctx.moveTo(X(a[0]), Y(a[1]));
            ctx.lineTo(X(a[0] + (b[0] - a[0]) * Math.min(1, lim / (l1 || 1))), Y(a[1]));
            if (lim > l1) ctx.lineTo(X(b[0]), Y(b[1] + (c2[1] - b[1]) * Math.min(1, (lim - l1) / (l2 || 1))));
            ctx.stroke();
            if (age < 0) continue;
            const front = OM.ease.outCubic(OM.clamp(age / flood)) * w.dmax;
            const isLit = (n) => w.dist[n] >= 0 ? w.dist[n] <= front : age > flood;
            const hold = w.k === K ? 0.5 + 0.5 * Math.sin((T - on[w.k]) * 9) * (T < words[K].t1 ? 1 : 0) : 0;
            const hot = age < flood + 0.08 || decay(T, DB1, 0.12) > 0.4;
            const ink1 = hot ? ink.crest : w.k === K ? (hold > 0.8 ? ink.crest : ink.hover) : ink.crest;
            const cs2 = CS * s, pad = 3 * s;
            // A dark keep-out under the lit letters so they read over the board, then the letters solid.
            for (const pass of [0, 1]) {
              ctx.fillStyle = pass ? ink1 : ink.bg;
              ctx.beginPath();
              w.cells.forEach((cl, n) => {
                if (!isLit(n) || OM.hash(cl.i, cl.j, 4) < wordsOut) return;
                const x = X(cl.x), y = Y(cl.y);
                if (pass) ctx.rect(x, y, cs2 + 0.4, cs2 + 0.4);
                else ctx.rect(x - pad, y - pad, cs2 + 2 * pad, cs2 + 2 * pad);
              });
              ctx.fill();
            }
          }
        },
        render(t, T) {
          this.draw(t, T);
          const ctx = c.ensure();
          if (OM.c2.live(T, start, END)) {
            // Roll couriers and core ticks (hat roll 191.73 to 193.03): more electrons pour onto the traces as the roll climbs, and the core's rim ticks on every sixteenth.
            {
              const s8 = scale(T), X8 = (x) => ZX + (x - ZX) * s8, Y8 = (y) => ZY + (y - ZY) * s8;
              const roll = OM.prog(T, 191.727, 192.8), dark8 = sm(T, OFF - 0.1, OFF + 0.25), sz8 = 4 * Math.min(s8, 3);
              if (roll > 0 && dark8 < 1) {
                ctx.fillStyle = OM.c2.rgba(ink.hover, 1 - dark8);
                traces.forEach((tr, n) => {
                  if (n % 2 === 0 || OM.hash(n, 0, 121) > roll) return;
                  const d = (T * 900 + tr.ph * 3 * tr.len) % tr.len;
                  for (const [a, b, acc, l] of tr.segs) {
                    if (d < acc || d > acc + l) continue;
                    const f = (d - acc) / l;
                    ctx.fillRect(X8(a[0] + (b[0] - a[0]) * f) - sz8 / 2, Y8(a[1] + (b[1] - a[1]) * f) - sz8 / 2, sz8, sz8);
                  }
                });
                const tick = ((T - 191.727) / (OM.SPB / 4)) % 1, cs8 = CORE * s8 * 1.18;
                ctx.strokeStyle = OM.c2.rgba(ink.lit, roll * (1 - tick) * (1 - dark8));
                ctx.lineWidth = Math.max(1.5, cs8 / 40);
                ctx.strokeRect(X8(ZX) - cs8 / 2, Y8(ZY) - cs8 / 2, cs8, cs8);
              }
            }
          // Electrons flowing out along the traces.
          const s = scale(T), X = (x) => ZX + (x - ZX) * s, Y = (y) => ZY + (y - ZY) * s;
          const grow = 1, dark = sm(T, OFF - 0.1, OFF + 0.25), sz = 4 * Math.min(s, 3);
          ctx.fillStyle = OM.c2.rgba(ink.lit, 1 - dark);
          traces.forEach((tr, n) => {
            if (n % 2) return;
            const d = (T * 520 + tr.ph * tr.len) % tr.len;
            if (d > tr.len * grow) return;
            for (const [a, b, acc, l] of tr.segs) {
              if (d < acc || d > acc + l) continue;
              const f = (d - acc) / l;
              ctx.fillRect(X(a[0] + (b[0] - a[0]) * f) - sz / 2, Y(a[1] + (b[1] - a[1]) * f) - sz / 2, sz, sz);
            }
          });
          }
          // Fast dive through the layers, banking as it goes; easing level into the dark.
          // The key word's charge punches in on its downbeat with the board's pulse.
          OM.c2.apply(fx, T, start, END, { amount: 0.85, rot: 0.03 * Math.sin((T - start) * 1.1) * (0.4 + 0.6 * sm(T, DB2, DB2 + 0.5)), zoom: 1 + 0.03 * sm(T, DB2, OFF), ramp: 0.55, punch: 0.045 * OM.c2.punch(T, DB1) });
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
