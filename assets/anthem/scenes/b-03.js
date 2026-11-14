// b-03 · The road that paves itself. The crest line splits into curbs: two
// lanes of road, and a road roller on each. The road only exists just ahead of
// a drum: on each word's onset a stretch of pavers drops into place in front of
// its lane's roller, and the pavers that drop lit are that word's letters. The
// roller then presses its way across them, the fresh crest cooling as it is
// rolled flat, thumping on the kicks, so the line is laid as road. When the
// last word is down the rollers run on out of frame, still going, and the
// pavers settle back into the lattice they were cut from: the board.

// Edit camera: the scene's own camera bumps on its kicks, so the 204.574 backbeat jolt, 46 ms
// after the 204.528 kick bump, is skipped rather than stacked. The key (last) word lands 28 ms
// before the 203.502 backbeat, so the jolt and roll are raised to read on it.
OM.edit.plan('b-03', { skip: [204.574], back: 10, roll: 0.006 });

OM.ownWords.add('b-03');
OM.scene({
  id: 'b-03',
  build(el, { start, duration }) {
    const B = OM.bridge;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 base = src(q);
  float n = vnoise(vec2(q.x * 40.0, q.y * 14.0 - uTime * 3.0)) - 0.5;
  float m = vnoise(vec2(q.x * 90.0 + 3.0, q.y * 30.0 - uTime * 5.0)) - 0.5;
  vec2 off = vec2(n * 0.0024 + m * 0.001, m * 0.0014);
  vec4 h = src(q + off);
  h.rgb += vec3(0.24, 0.31, 0.16) * 0.05 * (n + 0.5) * smoothstep(0.2, 0.5, 1.0 - abs(uv.y - 0.5) * 2.0);
  return mix(base, h, uAmount);
}` });
    const END = start + duration;
    const ink = OM.fieldInks('tokyo-night');
    const th = OM.theme('tokyo-night');
    const H = B.sub(2);
    const sung = OM.sung('b-03');
    const on = sung.map((w) => B.land(w.t0, start));
    const n = on.length;
    // The roller's thumps, on the measured kick onsets (202.188, 203.182, 203.622, 204.528).
    const KICKS = [202.176, 203.221, 203.639, 204.568].map((t) => B.onDrum(t, 'kick'));
    const STUDS = [205.22, 205.36].map((t) => B.onDrum(t, 'snare')); // the seam studs' snares
    const EXIT = 204.3, SETTLE = 204.95;
    const SR = B.SPARK.row;
    const DW = 54;

    const lay = B.lazy(() => {
      const set = B.set(sung, { weight: 800, cap: 104, minCap: 80, maxW: 1700, cy: B.SPARK.y + 4, lead: 2.05, maxRows: 2 });
      const letters = set.words.map((w) => B.cells(w, set, H));
      // One lane per row: its band hugs the row's letters.
      const lanes = set.rows.map((ks) => {
        const cells = ks.flatMap((k) => letters[k]);
        const first = set.words[ks[0]], last = set.words[ks[ks.length - 1]];
        return {
          ks,
          rTop: Math.min(...cells.map((q) => q[1])) - 3,
          rBot: Math.max(...cells.map((q) => q[1])) + 3,
          xL: first.x - 40,
          xR: last.x + last.w + DW + 30, // the drum clears the lane's last letter
        };
      });
      const lit = new Map();
      letters.forEach((cells, k) => cells.forEach(([q, r]) => lit.set(q + ',' + r, k)));
      const spans = [], pavers = [];
      lanes.forEach((ln) => {
        ln.ks.forEach((k, i) => {
          const w = set.words[k], last = i === ln.ks.length - 1;
          const x0 = i ? spans[ln.ks[i - 1]].x1 : ln.xL;
          const x1 = last ? ln.xR : w.x + w.w + DW + 6; // park in the gap, clear of the word's last letter
          spans[k] = { x0, x1, lane: ln };
          const q0 = Math.floor((x0 - H.x0) / H.cw), q1 = last ? Math.ceil((w.x + w.w - H.x0) / H.cw) + 3 : Math.ceil((x1 - H.x0) / H.cw);
          for (let q = q0; q < q1; q++)
            for (let r = ln.rTop; r <= ln.rBot; r++) {
              // Laid in a fast front from the roller forward: the word is down within about six frames.
              const f = (q - q0) / Math.max(1, q1 - q0);
              pavers.push({ q, r, k, letter: lit.has(q + ',' + r), at: on[k] + 0.07 * f + 0.01 * OM.hash(q, r, 4) });
            }
        });
      });
      return { set, lanes, spans, pavers };
    });

    // A lane's drum front, in CSS px: it rolls across each word between its onset and the next.
    const rollerX = (T, ln, spans) => {
      let x = ln.xL;
      ln.ks.forEach((k, i) => {
        if (T < on[k]) return;
        const nk = ln.ks[i + 1];
        const stop = nk !== undefined ? on[nk] : Math.min(EXIT, on[k] + 0.7);
        x = OM.lerp(spans[k].x0, spans[k].x1, OM.ease.outCubic(OM.prog(T, on[k], stop)));
      });
      return x + 2200 * OM.ease.inCubic(OM.prog(T, EXIT, EXIT + 0.7));
    };
    const grid = (ctx, dpr, a) => {
      const L = OM.HOME, snap = (v) => Math.round(v * dpr) / dpr;
      ctx.globalAlpha = a;
      ctx.fillStyle = th['border-subtle'];
      for (let col = L.cMin; col <= L.cMin + L.cols; col++) ctx.fillRect(snap(L.x0 + col * L.cw), 0, 1, 1080);
      for (let row = L.rMin; row <= L.rMin + L.rows; row++) ctx.fillRect(0, snap(L.y0 + row * L.ch), 1920, 1);
      ctx.globalAlpha = 1;
    };

    return {
      draw(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T < on[0] || T >= END - 0.1) return OM.handoff(T < on[0] ? 'line' : 'grid', ctx, T, dpr);
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const { lanes, spans, pavers } = lay();
        const settle = OM.ease.inOutCubic(OM.prog(T, SETTLE, END - 0.14));
        grid(ctx, dpr, settle);
        const fade = 1 - settle;

        // The curbs: the crest line splits outward to every lane's edges on the first word, then cools.
        const split = OM.ease.inOutCubic(OM.prog(T, on[0] - 0.01, start + 0.5));
        ctx.globalAlpha = fade;
        ctx.fillStyle = OM.mix(ink.crest, ink.mid, OM.prog(T, on[0], on[0] + 0.6));
        for (const ln of lanes)
          for (const [from, to] of [[2 * SR, ln.rTop - 2], [2 * SR + 1, ln.rBot + 2]])
            ctx.fillRect(0, Math.round((H.y0 + OM.lerp(from, to, split) * H.ch) * dpr) / dpr, 1920, H.ch);

        const rx = lanes.map((ln) => rollerX(T, ln, spans));
        const thump = KICKS.reduce((s, k) => s + (T >= k ? 4 * Math.exp(-(T - k) / 0.06) : 0), 0);
        // The pavers: dropped in from above the road, then pressed flat under the drum.
        for (const p of pavers) {
          if (T < p.at) continue;
          // Each paver shows from its first frame and slams flat 50 ms later.
          const drop = OM.ease.inCubic(OM.prog(T, p.at, p.at + 0.05));
          const x = rx[lanes.indexOf(spans[p.k].lane)];
          const px = H.x0 + (p.q + 0.5) * H.cw, pressed = px < x - 10;
          const sinceP = pressed ? OM.clamp((x - 10 - px) / 220) : 0;
          let fill;
          if (p.letter) fill = pressed ? OM.mix(ink.crest, p.k === n - 1 || p.k === 1 ? ink.hover : ink.lit, sinceP) : ink.crest;
          else fill = pressed ? th['surface-2'] : th.surface;
          const k = OM.lerp(1.9, 1, drop) * (p.letter ? 1 : 0.86);
          const w = H.cw * k, h = H.ch * k;
          ctx.globalAlpha = fade * OM.prog(T, p.at - 0.001, p.at + 0.02);
          ctx.fillStyle = fill;
          ctx.fillRect(px - w / 2, H.y0 + (p.r + 0.5) * H.ch - h / 2 - (1 - drop) * 18, w, h);
        }
        ctx.globalAlpha = fade;

        // The rollers: a ribbed drum on each lane, a short handle frame trailing inside the road.
        lanes.forEach((ln, i) => {
          const x = rx[i];
          if (x > 2000 || T < on[ln.ks[0]] - 0.4) return;
          const y0 = H.y0 + (ln.rTop - 3) * H.ch - thump, y1 = H.y0 + (ln.rBot + 4) * H.ch - thump;
          ctx.fillStyle = th['border-strong'];
          ctx.fillRect(x - DW, y0, DW, y1 - y0);
          ctx.fillStyle = th.surface;
          const ph = ((x / 9) % 1 + 1) % 1;
          for (let j = 0; j < 6; j++) ctx.fillRect(x - DW + ((j + ph) / 6) * DW, y0, 3, y1 - y0);
          ctx.fillStyle = ink.crest;
          ctx.fillRect(x - 3, y0, 3, y1 - y0);
          ctx.fillStyle = ink.lit;
          ctx.fillRect(x - DW - 6, y0 - 8, DW + 12, 8);
          // Grit thrown up on the kicks.
          for (const k of KICKS) {
            const a = T - k;
            if (a < 0 || a > 0.3) continue;
            for (let j = 0; j < 10; j++) {
              const u = OM.hash(j, Math.round(k * 100) + i, 7);
              ctx.globalAlpha = fade * (1 - a / 0.3);
              ctx.fillStyle = ink.hover;
              ctx.fillRect(x + 8 + a * 260 * u, OM.lerp(y0, y1, OM.hash(j, 3, Math.round(k * 100))) - a * 90 * (u - 0.3), 4, 4);
            }
            ctx.globalAlpha = fade;
          }
        });
        ctx.globalAlpha = 1;
      },
      render(t, T) {
          this.draw(t, T);
          const e = B.env(T, start, END);
          const ctx = c.ensure();
          ctx.globalAlpha = 1;
          if (e > 0) {

            // Seam Studs: as the road settles into the grid, its crossings stud crest on the snares.
            {
              const p = OM.pulse(STUDS, T, 0.07);
              if (p > 0.02) {
                const L = OM.HOME, ik = OM.fieldInks('tokyo-night');
                const { lanes } = lay();
                const H2 = B.sub(2);
                ctx.fillStyle = ik.crest;
                ctx.globalAlpha = e * p;
                for (const ln of lanes) {
                  const r0 = Math.floor((ln.rTop - 3) / 2), r1 = Math.ceil((ln.rBot + 3) / 2);
                  for (let row = r0; row <= r1; row++)
                    for (let col = L.cMin; col <= L.cMin + L.cols; col++) {
                      if (OM.hash(col, row, T >= STUDS[1] ? 2 : 1) > 0.2) continue;
                      ctx.fillRect(L.x0 + col * L.cw - 2, L.y0 + row * L.ch - 2, 4, 4);
                    }
                }
                ctx.globalAlpha = 1;
              }
            }

            const { lanes, spans } = lay();
            const ink2 = OM.fieldInks('tokyo-night'), th2 = OM.theme('tokyo-night');
            const H2 = B.sub(2);
            // Steam off each drum: soft puffs rising from where the drum was when they left it.
            lanes.forEach((ln, li) => {
              const y0 = H2.y0 + (ln.rTop - 3) * H2.ch;
              for (let i = 0; i < 14; i++) {
                const a = ((T * 1.4 + i / 14) % 1 + 1) % 1, born = T - a / 1.4;
                if (born < on[ln.ks[0]]) continue;
                const x = rollerX(born, ln, spans) - 27 + (OM.hash(i, li, 5) - 0.5) * 30 - a * 60;
                if (x > 1990) continue;
                B.pool(ctx, x, y0 - a * 150, 18 + a * 40, th2['text-muted'], 0.22 * e * (1 - a));
              }
              // Gravel bits ticking off the road surface ahead of the drum.
              const x = rollerX(T, ln, spans);
              ctx.fillStyle = ink2.mid;
              for (let i = 0; i < 8; i++) {
                const a = ((T * 3 + OM.hash(i, li, 9)) % 1 + 1) % 1;
                ctx.globalAlpha = e * (1 - a);
                ctx.fillRect(x + 6 + a * 70 * OM.hash(i, 2, li), H2.y0 + OM.lerp(ln.rTop, ln.rBot, OM.hash(i, 3, li)) * H2.ch - Math.sin(a * Math.PI) * 26, 3, 3);
              }
              ctx.globalAlpha = 1;
            });
          }
          ctx.globalAlpha = 1;
          fx.apply(T, {
            amount: e * (1 - 0.7 * OM.pulse(on, T, 0.2)),
            cam: (() => {
              const L0 = lay().lanes[0];
              const kick = OM.pulse(KICKS, T, 0.08);
              // The pan stops short on the right so the first word stays whole and clear of the
              // border band (it ran 110 px and pushed that word out of frame once the roller left).
              const x = OM.clamp(-(rollerX(T, L0, lay().spans) - 960) * 0.12, -30, 110);
              return { zoom: 1 + e * (0.12 + 0.012 * kick), x: e * x, y: e * (18 - 7 * kick) };
            })(),
          });
        },
        release: () => { fx.release(); c.release(); },
    };
  },
});
