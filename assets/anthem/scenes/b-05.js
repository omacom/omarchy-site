// b-05 · The glow escapes. The screen pulls back into a notebook computer on a dark floor
// and its glass fills with green light that will not stay in: it pours over
// the bottom edge, down the deck, and pools on the floor. From the pool the
// light runs out along the floor in lattice channels, one to each word, the
// front reaching the word exactly on its onset and flooding its letters, so
// the line is written in light that left the machine. The key word lands on
// the downbeat with the biggest flood; the kicks send pulses down every
// channel. Over the end of the riser the letters melt like wax and pour into
// the next line's candles, the channels drain back into the pool, the glass
// empties and the machine folds shut, and the pool condenses into one drop
// that rises on the kick to light the first wick.

// Edit camera: the key word floods 73 ms after the 210.208 downbeat, so the downbeat punch is
// raised to make the key word's beat the biggest. The scene's own camera never moves on the
// drums; its pool swells on the beats (the jiggle) and kicks as one of its elements, in step
// with the camera rather than stacked on it, so it stays.
OM.edit.plan('b-05', { down: 2.4 });

OM.ownWords.add('b-05');
// The b-05 -> b-06 cut, shared by both scenes: the next line's row of unlit
// candles (measured from b-06's own words) and the condensed drop of light,
// which leaves the pool on the 213.95 kick and lands on the first wick on b-06's first onset.
(() => {
  const B = OM.bridge;
  const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
  B.WAX = OM.mix(th['surface-2'], th['text-secondary'], 0.22);
  B.CANDLE_SET = { weight: 800, cap: 92, minCap: 60, maxW: 1640, cy: 560, lead: 2.6, maxRows: 2 };
  B.candleRow = B.lazy(() => {
    const set = B.set(OM.sung('b-06'), B.CANDLE_SET);
    const row = [];
    set.words.forEach((w) => {
      for (let j = 0; j < w.text.length; j++)
        row.push({ k: w.k, j, x: w.x + (j + 0.5) * set.adv, top: w.y + set.size * 0.36, bw: Math.max(14, set.adv * 0.34), bh: set.cap * 0.95 });
    });
    return { set, row };
  });
  B.POOL_AT = { x: 960, y: 452 };
  B.LAUNCH = 213.95;
  /** Where the drop of light is at T (null once it has landed on the first wick). */
  B.dropAt = (T) => {
    const { row } = B.candleRow();
    const first = row[0];
    const land = B.land(OM.sung('b-06')[0].t0, 214.018);
    if (!first || T >= land) return null;
    const u = OM.prog(T, B.LAUNCH, land);
    return { x: OM.lerp(B.POOL_AT.x, first.x, OM.smooth(u)), y: OM.lerp(B.POOL_AT.y, first.top - 12, u) - 240 * Math.sin(Math.PI * u) };
  };
  B.drawDrop = (ctx, T) => {
    const d = B.dropAt(T);
    if (!d) return;
    B.pool(ctx, d.x, d.y, 34, ink.hover, 0.55);
    ctx.fillStyle = ink.crest;
    ctx.fillRect(d.x - 5, d.y - 5, 10, 10);
  };
  /** Unlit candle bodies, with `fill` 0..1 of each body poured from the bottom up. */
  B.drawCandles = (ctx, fill = 1) => {
    for (const cd of B.candleRow().row) {
      const h = cd.bh * fill;
      ctx.fillStyle = B.WAX;
      ctx.fillRect(cd.x - cd.bw / 2, cd.top + cd.bh - h, cd.bw, h);
      if (fill >= 1) {
        ctx.fillStyle = th['border-strong'];
        ctx.fillRect(cd.x - 1, cd.top - 8, 2, 8);
      }
    }
  };
  /** The cut frame itself. */
  B.waxCut = (ctx, T) => {
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    B.drawCandles(ctx, 1);
    B.drawDrop(ctx, T);
  };
})();
OM.scene({
  id: 'b-05',
  build(el, { start, duration }) {
    const B = OM.bridge;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 base = src(q);
  vec2 w = vec2(sin(q.y * 60.0 + uTime * 4.0), cos(q.x * 50.0 + uTime * 3.0)) * 0.0011;
  vec4 s = src(q + w);
  float g = clamp((s.g - max(s.r, s.b) * 0.6) * 2.5, 0.0, 1.0);
  vec2 cp = q * vec2(16.0, 9.0) * 3.0;
  float c1 = vnoise(cp + vec2(uTime * 0.6, -uTime * 0.4));
  float c2 = vnoise(cp * 1.7 - vec2(uTime * 0.5, uTime * 0.7));
  float caus = pow(clamp(1.0 - abs(c1 - c2) * 2.5, 0.0, 1.0), 10.0);
  vec3 col = s.rgb + vec3(0.73, 0.87, 0.59) * caus * 0.22 * g * g;
  return mix(base, vec4(col, 1.0), uAmount);
}` });
    const END = start + duration;
    const ink = OM.fieldInks('tokyo-night');
    const th = OM.theme('tokyo-night');
    const H = B.sub(2);
    const sung = OM.sung('b-05');
    const on = sung.map((w) => B.land(w.t0, start));
    const K = 3; // the key word, on the 210.208 downbeat
    const KICKS = [209.816, 211.278, 212.904].map((t) => B.onDrum(t, 'kick')); // measured: 209.826, 211.288, 212.898
    // The pool drops land on the 212.898 kick and the 213.428 beat; the channel surge floods on
    // the 212.892 beat (the strongest hit here; no snare was measured at 212.97).
    const DROPS = [B.onDrum(212.9, 'kick'), OM.beatOnset(213.461)], SURGE = OM.beatOnset(212.927);
    const MELT = 213.0, ASSEMBLED = 213.9; // the melt over the end of the riser, from the 212.97 snare
    const S1 = 0.32, CX = 960, CY = 238; // keep the lid inside the camera crop and the deck at the pour's height
    const POUR = start + 0.08, IMPACT = { x: 960, y: 452 };

    const lay = B.lazy(() => {
      const set = B.set(sung, { weight: 800, cap: 100, minCap: 80, maxW: 1780, cy: 745, lead: 1.62 });
      const toQ = (x) => Math.floor((x - H.x0) / H.cw), toR = (y) => Math.floor((y - H.y0) / H.ch);
      const words = set.words.map((w, k) => {
        const cells = B.cells(w, set, H);
        const q0 = Math.min(...cells.map((p) => p[0])), q1 = Math.max(...cells.map((p) => p[0]));
        // The channel: down from the pool to the gutter above the text, out along it,
        // round the side of the block to the word's own gutter, then down into the word.
        const gy = (y) => toR(y - set.cap - set.cap * 0.45);
        const pts = [];
        const add = (q, r) => { const l = pts[pts.length - 1]; if (!l || l[0] !== q || l[1] !== r) pts.push([q, r]); };
        const qa = toQ(IMPACT.x), ra = toR(IMPACT.y), r0g = gy(set.words[0].y), rg = gy(w.y);
        const qe = toQ(w.x + Math.min(w.w / 2, set.adv * 0.5));
        const rt = Math.min(...cells.map((p) => p[1]));
        for (let r = ra; r <= r0g; r++) add(qa, r);
        if (w.row === 0) {
          for (let q = qa; q !== qe; q += Math.sign(qe - qa)) add(q, r0g);
        } else {
          const left = w.x + w.w / 2 < 960;
          const qs = left ? toQ(Math.min(...set.words.map((v) => v.x)) - 34) : toQ(Math.max(...set.words.map((v) => v.x + v.w)) + 34);
          for (let q = qa; q !== qs; q += Math.sign(qs - qa)) add(q, r0g);
          for (let r = r0g; r <= rg; r++) add(qs, r);
          for (let q = qs; q !== qe; q += Math.sign(qe - qs)) add(q, rg);
        }
        for (let r = rg; r < rt; r++) add(qe, r);
        return { cells, q0, q1, pts, w };
      });
      // Each lit cell's place in the next line's candles: cells spread across the candles in reading order.
      const { row } = B.candleRow();
      const all = words.flatMap((w) => w.cells.map((cl) => ({ w, cl })));
      const melt = new Map();
      all.forEach(({ w, cl }, i) => {
        const cd = row[Math.min(row.length - 1, Math.floor((i / all.length) * row.length))];
        if (!cd) return;
        const r0 = Math.min(...w.cells.map((q) => q[1])), r1 = Math.max(...w.cells.map((q) => q[1]));
        const rr = (cl[1] - r0) / Math.max(1, r1 - r0);
        melt.set(cl, {
          at: MELT + 0.28 * (1 - rr) + 0.17 * OM.hash(cl[0], cl[1], 21),
          tx: cd.x - cd.bw / 2 + OM.hash(cl[0], cl[1], 22) * Math.max(1, cd.bw - H.cw),
          ty: cd.top + OM.hash(cl[0], cl[1], 23) * Math.max(1, cd.bh - H.ch),
        });
      });
      // The letter cells and a one-cell margin round them: the channel surge runs round the words, never over them.
      const clear = new Set();
      for (const w of words) for (const [q, r] of w.cells) for (let dq = -1; dq <= 1; dq++) for (let dr = -1; dr <= 1; dr++) clear.add((q + dq) * 4096 + r + dr);
      return { set, words, melt, clear };
    });
    // The machine at camera scale s: screen rect and deck.
    const machine = (ctx, s, glow, alphaDeck, lid = 0, drain = 0, fold = 0) => {
      if (fold >= 1) return { x: 960, y: 400, w: 0, h: 0 };
      ctx.save();
      ctx.translate(960, 400);
      ctx.scale(1 - fold, 1);
      ctx.translate(-960, -400);
      const w = 1280 * s, hf = 800 * s;
      const x = OM.lerp(320, CX - w / 2, (1 - s) / (1 - S1)), yf = OM.lerp(140, CY - hf / 2, (1 - s) / (1 - S1));
      const h = hf * (1 - lid), y = yf + hf * lid;
      if (alphaDeck > 0) {
        const q = s / S1;
        ctx.globalAlpha = alphaDeck;
        ctx.fillStyle = th['surface-2'];
        ctx.beginPath();
        ctx.moveTo(x - 8 * q, y + h + 4);
        ctx.lineTo(x + w + 8 * q, y + h + 4);
        ctx.lineTo(x + w + 40 * q, y + h + 40 * q);
        ctx.lineTo(x - 40 * q, y + h + 40 * q);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = th['border-strong'];
        ctx.fillRect(x - 40 * q, y + h + 40 * q - 3, w + 80 * q, 3);
        ctx.fillRect(x + w * 0.1, y + h + 2, w * 0.8, 3 * q);
        ctx.globalAlpha = alphaDeck * (1 - lid);
        ctx.fillStyle = ink.bg;
        for (let r = 0; r < 4; r++) {
          const ky = y + h + (8 + r * 4) * q, kw = w * (0.78 + r * 0.025) / 14;
          for (let k = 0; k < 14; k++) ctx.fillRect(x + w / 2 + (k - 7) * kw, ky, kw - 2 * q, 2.5 * q);
        }
        ctx.fillRect(x + w * 0.35, y + h + 24 * q, w * 0.3, 2.5 * q);
        ctx.strokeStyle = th['text-muted'];
        ctx.lineWidth = q;
        ctx.strokeRect(x + w * 0.35, y + h + 29 * q, w * 0.3, 7 * q);
        ctx.fillStyle = th['surface-2'];
        ctx.fillRect(x - 6 * q, y - 7 * q, w + 12 * q, h + 11 * q);
        ctx.fillStyle = th['text-muted'];
        ctx.fillRect(x + w / 2 - q, y - 5 * q, 2 * q, 2 * q);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = th.bg;
      ctx.fillRect(x, y, w, h);
      if (glow > 0) {
        ctx.globalAlpha = glow;
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, B.rgba(ink.lit, 0.35));
        g.addColorStop(1, B.rgba(ink.hover, 0.95));
        ctx.fillStyle = g;
        // The light runs out of the glass from the top down, into the pour.
        ctx.fillRect(x, y + h * drain, w, h * (1 - drain));
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = ink.mid;
      ctx.lineWidth = 2;
      if (h > 2) ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.restore();
      return { x, y, w, h };
    };

    return {
      draw(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T < start + 0.05) return OM.handoff('screen', ctx, T, dpr);
        if (T >= ASSEMBLED) return B.waxCut(ctx, T);
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const { set, words } = lay();
        const keep = 1;
        const drainG = OM.prog(T, 213.1, 213.55), lid = OM.ease.inOutCubic(OM.prog(T, 213.5, 213.72)), fold = OM.ease.inCubic(OM.prog(T, 213.68, 213.86));
        const drainC = OM.prog(T, MELT + 0.02, 213.45), shrink = OM.prog(T, 213.55, ASSEMBLED - 0.02);
        const { melt } = lay();
        // The wax gathers: the next line's candles fill from the bottom up as the melted cells pour in.
        if (T >= MELT + 0.2) B.drawCandles(ctx, OM.smooth(OM.prog(T, MELT + 0.2, ASSEMBLED)) * 0.999);
        ctx.globalAlpha = keep;

        const pull = OM.ease.inOutCubic(OM.prog(T, start + 0.05, start + 0.55));
        const s = OM.lerp(1, S1, pull);
        const fill = OM.smooth(OM.prog(T, start + 0.05, start + 0.65));
        const scr = machine(ctx, s, fill * keep, pull * keep, lid, drainG, fold);
        ctx.globalAlpha = keep;
        const kick = OM.pulse(KICKS, T, 0.1);

        // The pour: a falling sheet of light over the deck's lip to the floor.
        const pourA = OM.prog(T, POUR, on[0]);
        if (pull > 0.35) {
          const q0 = Math.floor((960 - 70 - H.x0) / H.cw), q1 = Math.floor((960 + 70 - H.x0) / H.cw);
          const r0 = Math.floor((scr.y + scr.h + 40 * s / S1 - H.y0) / H.ch), r1 = Math.floor((IMPACT.y - H.y0) / H.ch);
          const reach = r0 + (r1 - r0) * OM.ease.inCubic(pourA);
          const tail = r0 + (r1 - r0) * OM.ease.inCubic(OM.prog(T, 213.5, 213.68)); // the last of the light falls through
          for (let q = q0; q <= q1; q++)
            for (let r = Math.ceil(tail); r <= reach; r++) {
              const f = OM.hash(q, Math.floor(r - T * 40), 2);
              if (f < 0.35) continue;
              ctx.fillStyle = f > 0.85 ? ink.crest : f > 0.6 ? ink.hover : ink.lit;
              OM.cell(ctx, H, q, r, dpr);
            }
          // The pool also swells on the beats its own kicks and words leave free, until the light drains back.
          const beat = Math.max(kick, (1 - drainC) * OM.jiggle(T, [...KICKS, ...on]));
          B.pool(ctx, IMPACT.x, IMPACT.y, (160 + 90 * pourA) * (1 - 0.8 * shrink), ink.lit, keep * (0.3 * pourA + 0.12 * beat) * (1 - 0.4 * shrink));
          // The pool on the floor.
          // The pool condenses into one drop, waiting to rise.
          const pr = (10 * pourA + 4 * kick) * (1 - shrink);
          if (shrink > 0) { ctx.fillStyle = ink.crest; const z = 4 + 6 * shrink; ctx.fillRect(IMPACT.x - z / 2, IMPACT.y - z / 2, z, z); }
          ctx.fillStyle = ink.hover;
          for (let q = -pr; q <= pr; q++) {
            const qq = Math.floor((IMPACT.x - H.x0) / H.cw) + Math.round(q);
            const hh = Math.round((1 - Math.abs(q) / (pr + 1)) * 2.5);
            for (let r = -hh; r <= hh; r++) OM.cell(ctx, H, qq, Math.floor((IMPACT.y - H.y0) / H.ch) + r, dpr);
          }
        }

        // The channels: each front races out of the pool and reaches its word on the onset.
        for (const w of words) {
          const o = on[w.w.k], run = w.pts.length;
          const go = w.w.k ? Math.max(on[w.w.k - 1], o - 0.3) : POUR;
          const f = OM.ease.inCubic(OM.prog(T, go, o));
          const n = Math.floor(f * run * (1 - drainC)); // after the melt starts, the light runs back to the pool
          for (let i = 0; i < n; i++) {
            const [q, r] = w.pts[i];
            const pulse = KICKS.reduce((m, kk) => (T >= kk ? Math.max(m, Math.exp(-Math.abs((T - kk) * 90 - i) / 3) * Math.exp(-(T - kk) / 0.5)) : m), 0);
            ctx.fillStyle = i >= n - 2 && (f < 1 || drainC > 0) ? ink.crest : OM.mix(ink.mid, ink.crest, pulse);
            OM.cell(ctx, H, q, r, dpr);
          }
        }
        // The letters go over every channel, so the last word's channel, which runs along the
        // gutter under the first row, passes behind that row's descenders instead of through them.
        for (const w of words) {
          const o = on[w.w.k];
          // The flood: the letters fill left to right from the onset, crest cooling to their ink.
          if (T < o) continue;
          const key = w.w.k === K;
          // A quick flood: the word is lit within about five frames (seven for the key word).
          const SW = key ? 0.12 : 0.08;
          const sweep = OM.prog(T, o, o + SW);
          const a = T - o;
          if (key) B.pool(ctx, w.w.x + w.w.w / 2, w.w.y - set.cap / 2, Math.max(260, w.w.w), ink.lit, keep * (0.3 * Math.exp(-a / 0.4) + 0.08 * (1 - OM.prog(T, MELT, 213.45))));
          for (const cl of w.cells) {
            const [q, r] = cl;
            const m = melt.get(cl);
            if (m && T >= m.at) {
              // Melting: the cell drips down out of its letter, then runs to its place in a candle, cooling to wax.
              const p = OM.prog(T, m.at, m.at + 0.45);
              const x0 = H.x0 + q * H.cw, y0 = H.y0 + r * H.ch;
              const drip = OM.ease.inCubic(OM.prog(p, 0, 0.35)) * 50;
              const fl = OM.ease.inOutCubic(OM.prog(p, 0.25, 1));
              ctx.fillStyle = OM.mix(ink.hover, B.WAX, OM.prog(p, 0.5, 1));
              ctx.fillRect(OM.lerp(x0, m.tx, fl), OM.lerp(y0 + drip, m.ty, fl), H.cw, H.ch);
              continue;
            }
            const u = (q - w.q0) / Math.max(1, w.q1 - w.q0);
            if (u > sweep + 1e-6) continue;
            const age = a - u * SW;
            const th0 = OM.threshold(q, r);
            const cool = age / (key ? 0.6 : 0.35);
            ctx.fillStyle = th0 > cool ? ink.crest : key ? ink.crest : ink.hover;
            if (!key && th0 < cool - 0.6) ctx.fillStyle = ink.lit;
            OM.cell(ctx, H, q, r, dpr);
          }
        }
        ctx.globalAlpha = 1;
      },
      render(t, T) {
          this.draw(t, T);
          const e = B.env(T, start, END);
          const ctx = c.ensure();
          ctx.globalAlpha = 1;
          if (e > 0) {

            // Pool Drops: a fat drop leaves the deck lip and lands in the pool on each kick; the pool flares and rings wide.
            {
              const ik = OM.fieldInks('tokyo-night');
              const H2 = B.sub(2);
              for (const h of DROPS) {
                const f = OM.prog(T, h - 0.16, h);
                if (f > 0 && f < 1) {
                  ctx.globalAlpha = e;
                  ctx.fillStyle = ik.crest;
                  ctx.fillRect(948, OM.lerp(372, IMPACT.y - 18, f * f), 24, 36);
                }
                const a = T - h;
                if (a >= 0 && a < 0.4) {
                  const k = 1 - a / 0.4;
                  ctx.globalAlpha = 1;
                  B.pool(ctx, IMPACT.x, IMPACT.y, 340, ik.hover, 0.6 * e * k);
                  const R = 30 + a * 900, qc = (IMPACT.x - H2.x0) / H2.cw, rc = (IMPACT.y - H2.y0) / H2.ch;
                  ctx.globalAlpha = e * k;
                  ctx.fillStyle = ik.crest;
                  for (let ring = 0; ring < 3; ring++)
                    for (let i = 0; i < 120; i++) {
                      const ang = (i / 120) * Math.PI * 2, rr = R - ring * 9;
                      OM.cell(ctx, H2, Math.round(qc + (Math.cos(ang) * rr) / H2.cw), Math.round(rc + (Math.sin(ang) * rr * 0.32) / H2.ch), c.dpr);
                    }
                }
              }
              // Channel Surge: the beat floods every channel crest at once, three cells wide, and it drains back.
              const a = T - SURGE;
              if (a >= 0 && a < 0.35) {
                const { words, clear } = lay();
                ctx.globalAlpha = e * (1 - a / 0.35);
                ctx.fillStyle = ik.crest;
                const put = (q, r) => { if (!clear.has(q * 4096 + r)) OM.cell(ctx, H2, q, r, c.dpr); };
                for (const w of words)
                  for (const [q, r] of w.pts)
                    for (let d = -1; d <= 1; d++) { put(q + d, r); put(q, r + d); }
                ctx.globalAlpha = 1;
                for (const w of words) { const [q, r] = w.pts[w.pts.length - 1]; B.pool(ctx, H2.x0 + q * H2.cw, H2.y0 + r * H2.ch, 120, ik.lit, 0.45 * e * (1 - a / 0.35)); }
              }
              ctx.globalAlpha = 1;
            }

            const { set, words } = lay();
            const ik = OM.fieldInks('tokyo-night');
            // Droplets falling through the pour.
            ctx.fillStyle = ik.hover;
            for (let i = 0; i < 26; i++) {
              const a = ((T * 1.8 + OM.hash(i, 1, 55)) % 1 + 1) % 1;
              if (T < POUR + 0.2) break;
              ctx.globalAlpha = e * (1 - a) * 0.9;
              ctx.fillRect(960 + (OM.hash(i, 2, 55) - 0.5) * 240, 360 + a * a * 110, 3, 6);
            }
            // Light splashes: crest specks thrown up from each word as it floods.
            ctx.fillStyle = ik.crest;
            for (const w of words) {
              const a = T - on[w.w.k];
              if (a < 0 || a > 0.45) continue;
              for (let i = 0; i < 14; i++) {
                const ang = Math.PI * (1.1 + 0.8 * OM.hash(i, w.w.k, 3)), v = 160 + 220 * OM.hash(i, w.w.k, 4);
                const x = w.w.x + 8 + Math.cos(ang) * v * a, y = w.w.y - set.cap + Math.sin(ang) * v * a + 500 * a * a;
                ctx.globalAlpha = e * (1 - a / 0.45);
                ctx.fillRect(x, y, 4, 4);
              }
            }
          }
          ctx.globalAlpha = 1;
          fx.apply(T, {
            amount: e * (1 - 0.6 * OM.pulse(on, T, 0.2)),
            cam: { zoom: 1 + e * 0.1, y: e * 48 * (1 - OM.smooth(OM.prog(T, start + 0.3, 211.6))) },
          });
        },
        release: () => { fx.release(); c.release(); },
    };
  },
});
