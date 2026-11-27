// b-08 · First domino. The spark is a single domino standing on the lattice.
// It tips, and a trail of dominoes runs from it to the first word, whose
// letters are dominoes too: each word topples in a wave from its first cell on
// its onset, crest as they fall, and its last domino starts the trail to the
// next word, so the line is knocked down into being, word by word. On the
// downbeat after the key word the cascade breaks out of the letters across the
// whole lattice, accelerating as it spreads, every fallen cell landing in the
// homepage field. By the kick it fills the frame; the letters settle into it.

// Edit camera: it now carries the beat here (the old jiggle on the scene's own camera is gone).
// The key word's payoff is the flood on the next downbeat (225.222), so the downbeat punch is
// raised; that also lands the drop out of the long kick build (223.076) harder. The 227.368
// downbeat is skipped: the letters have settled into the field and the camera rests into the
// section boundary.
OM.edit.plan('b-08', { down: 2.2, skip: [227.368] });

OM.ownWords.add('b-08');
OM.scene({
  id: 'b-08',
  build(el, { start, duration }) {
    const B = OM.bridge;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: `vec2 ripple(vec2 q, vec4 P) {
  vec2 d = q - P.xy;
  d.x *= 1.7778;
  float r = length(d);
  float front = P.z * 0.8;
  float band = exp(-pow((r - front) * 16.0, 2.0));
  float a = P.w * band * exp(-P.z * 2.2) * 0.005;
  vec2 n = d / max(r, 1e-4);
  return vec2(n.x / 1.7778, n.y) * a * sin((r - front) * 70.0);
}
vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 base = src(q);
  vec2 o = ripple(q, uP0) + ripple(q, uP1);
  vec4 s = src(q + o);
  s.rgb += vec3(0.62, 0.81, 0.42) * length(o) * 25.0;
  return mix(base, s, uAmount);
}` });
    const END = start + duration;
    const L = OM.HOME;
    const ink = OM.fieldInks('tokyo-night');
    const sung = OM.sung('b-08');
    const on = sung.map((w) => B.land(w.t0, start));
    const n = on.length;
    const K = n - 1; // the key word, held into the build
    // The cascade breaks out on the downbeat's drum onset (225.222); the letters flash on the measured snares (223.304, 223.880).
    const FLOOD = OM.beatOnset(225.28), FULL = 226.62, SETTLE = 226.7;
    const SNARES = [223.33, 223.864].map((t) => B.onDrum(t, 'snare'));
    const beat = OM.edit.scene(start, END);
    const C0 = L.cMin, R0 = L.rMin, CW = L.cols, RH = L.rows;
    const at = new Float32Array(CW * RH).fill(Infinity); // when each lattice cell's domino falls
    const kind = new Uint8Array(CW * RH); // 0 field, 1 trail, 2 letter, 3 key letter
    const dir = new Int8Array(CW * RH); // which way it falls: 0 right, 1 down, 2 left, 3 up
    const rowCell = new Uint8Array(CW * RH); // the desk's row of dominoes, standing from the cut
    const I = (col, row) => (row - R0) * CW + (col - C0);

    const lay = B.lazy(() => {
      at.fill(Infinity); kind.fill(0); dir.fill(0); rowCell.fill(0);
      const set = B.set(sung, { weight: 800, cap: 100, minCap: 72, maxW: 1640, cy: 530, lead: 1.42 });
      // The first domino is the desk row's left end; the whole row goes down left to right from it.
      const DR = B.DROW, DT = 0.16 / Math.max(1, DR.c1 - DR.c0);
      for (const q of DR.cells) {
        const j = I(q.col, q.row);
        // Along the plank left to right; down each leg from where it meets the plank.
        at[j] = start + 0.05 + (q.col - DR.c0) * DT + (q.leg ? (q.row - DR.r1) * 0.012 : (DR.r1 - q.row) * 0.01);
        kind[j] = 1; dir[j] = q.leg ? 1 : 0; rowCell[j] = 1;
      }
      let prev = null, prevT = start + 0.05;
      const letters = [];
      set.words.forEach((w) => {
        const cells = B.cells(w, set, L);
        if (!cells.length) return;
        const o = on[w.k];
        // Entry: the word's leftmost cell nearest its middle row; it falls exactly on the onset.
        const mid = (Math.min(...cells.map((q) => q[1])) + Math.max(...cells.map((q) => q[1]))) / 2;
        const entry = cells.reduce((b, q) => (q[0] < b[0] || (q[0] === b[0] && Math.abs(q[1] - mid) < Math.abs(b[1] - mid)) ? q : b));
        // The trail from the last domino to the entry, an L across the lattice.
        const path = [];
        const [ex, ey] = entry;
        if (!prev) { prev = [OM.clamp(ex, DR.c0, DR.c1), DR.row]; prevT = at[I(...prev)]; }
        let [x, y] = prev;
        while (y !== ey) { y += Math.sign(ey - y); path.push([x, y, Math.sign(ey - y) >= 0 ? 1 : 3]); }
        while (x !== ex) { x += Math.sign(ex - x); path.push([x, y, ex > x || ex === x ? 0 : 2]); }
        const t0 = Math.min(prevT + 0.02, o - 0.04), span = o - t0;
        path.forEach(([px, py, d], i) => {
          const j = I(px, py);
          if (j < 0 || j >= at.length || kind[j] >= 2) return;
          at[j] = Math.min(at[j], t0 + (span * (i + 1)) / (path.length + 1));
          kind[j] = 1; dir[j] = d;
        });
        // The word topples in a wave from its entry.
        const far = Math.max(1, ...cells.map((q) => Math.hypot(q[0] - ex, (q[1] - ey) * 1.4)));
        // A quick wave, so the word reads within about six frames of its onset; the key word's
        // slower wave is down just as the cascade breaks out on the next downbeat.
        const dur = w.k === K ? 0.26 : Math.min(0.16, 0.06 + 0.015 * w.text.length);
        let last = entry, lastT = o;
        for (const [qx, qy] of cells) {
          const j = I(qx, qy);
          if (j < 0 || j >= at.length) continue;
          const tt = o + (dur * Math.hypot(qx - ex, (qy - ey) * 1.4)) / far;
          at[j] = tt; kind[j] = w.k === K ? 3 : 2; dir[j] = qx >= ex ? 0 : 2;
          letters.push(j);
          if (qx > last[0] || (qx === last[0] && tt > lastT)) { last = [qx, qy]; lastT = tt; }
        }
        prev = last; prevT = lastT;
      });
      // The cascade: out from every fallen domino across the lattice, accelerating.
      const dist = new Int16Array(CW * RH).fill(-1), q = new Int32Array(CW * RH);
      let h = 0, m = 0;
      for (let j = 0; j < at.length; j++) if (kind[j]) { dist[j] = 0; q[m++] = j; }
      while (h < m) {
        const a = q[h++], ax = a % CW;
        for (const o of [1, -1, CW, -CW, CW + 1, CW - 1, 1 - CW, -1 - CW]) {
          const b = a + o;
          if (b < 0 || b >= dist.length || dist[b] >= 0 || Math.abs((b % CW) - ax) > 1) continue;
          dist[b] = dist[a] + 1;
          q[m++] = b;
          const dx = (b % CW) - ax, dy = Math.floor(b / CW) - Math.floor(a / CW);
          dir[b] = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 0 : 2) : dy > 0 ? 1 : 3;
        }
      }
      let dmax = 1;
      for (const d of dist) if (d > dmax) dmax = d;
      const flood = new Float32Array(CW * RH);
      for (let j = 0; j < at.length; j++) {
        flood[j] = FLOOD + (FULL - FLOOD) * Math.sqrt(Math.max(0, dist[j]) / dmax) + 0.03 * OM.hash(j, 1, 8);
        if (!kind[j]) at[j] = flood[j];
      }
      return { set, letters, flood };
    });

    /** A domino falling: a standing bar that lays down flat across its cell. */
    const domino = (ctx, col, row, f, d, dpr) => {
      const x = L.x0 + col * L.cw, y = L.y0 + row * L.ch;
      if (f >= 1) return OM.cell(ctx, L, col, row, dpr);
      const k = B.STAND_W + (1 - B.STAND_W) * f;
      if (d === 0) ctx.fillRect(x, y, L.cw * k, L.ch);
      else if (d === 2) ctx.fillRect(x + L.cw * (1 - k), y, L.cw * k, L.ch);
      else if (d === 1) ctx.fillRect(x, y, L.cw, L.ch * k);
      else ctx.fillRect(x, y + L.ch * (1 - k), L.cw, L.ch * k);
    };

    return {
      draw(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T >= END - 0.1) return OM.handoff('field', ctx, T, dpr);
        if (T < start + 0.05) return B.dominoCut(ctx);
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const { set, flood } = lay();
        // The field, landing behind the cascade's front.
        if (T >= FLOOD) OM.hero(ctx, T, dpr, { inks: ink, L, word: false, gain: 0.8, bg: false, mask: (col, row) => (T >= flood[I(col, row)] + 0.05 ? 1 : 0) });
        const snare = OM.pulse(SNARES, T, 0.1);
        const settle = OM.prog(T, SETTLE, END - 0.16);
        // Dominoes stand up 0.1 s before they fall; a letter's only 0.05 s, so the word is not shown before its onset.
        const STAND = 0.1, LSTAND = 0.05, FALL = 0.06;
        for (let j = 0; j < at.length; j++) {
          const a = at[j];
          if (T < a - (kind[j] >= 2 ? LSTAND : STAND) && !rowCell[j]) continue;
          const col = (j % CW) + C0, row = Math.floor(j / CW) + R0;
          const kd = kind[j];
          if (!kd) {
            // The cascade's front: standing, falling, then handing over to the field.
            const age = T - a;
            if (age > 0.05 || OM.hash(col, row, 2) > 0.55) continue;
            ctx.fillStyle = age < 0 ? ink.mid : ink.crest;
            domino(ctx, col, row, age < 0 ? 0 : OM.clamp(age / FALL), dir[j], dpr);
            continue;
          }
          const age = T - a;
          const f = age < 0 ? 0 : OM.clamp(age / FALL);
          let fill;
          if (age < 0) fill = rowCell[j] && col === B.DROW.c0 && row === B.DROW.r1 ? ink.crest : ink.mid;
          else if (kd === 1) {
            // Trail dominoes are only the fuse: they burn out behind the run.
            if (age > 0.45) continue;
            fill = OM.mix(ink.bg, OM.mix(ink.mid, ink.crest, Math.exp(-age / 0.12)), 1 - OM.prog(age, 0.2, 0.45));
          }
          else {
            const key = kd === 3;
            fill = OM.mix(key ? ink.crest : ink.hover, ink.crest, Math.max(Math.exp(-age / 0.2), snare * 0.6));
          }
          ctx.globalAlpha = 1 - settle * (kd === 1 ? 1.4 : 1) < 0 ? 0 : 1 - settle * (kd === 1 ? 1.4 : 1);
          ctx.fillStyle = fill;
          domino(ctx, col, row, f, dir[j], dpr);
        }
        ctx.globalAlpha = 1;
        // The key word's fall throws light.
        const kw = set.words[K];
        if (kw && kw.text && T >= on[K]) B.pool(ctx, kw.x + kw.w / 2, kw.y - set.cap / 2, Math.max(260, kw.w), ink.lit, 0.25 * Math.exp(-(T - on[K]) / 0.5) * (1 - settle));
      },
      render(t, T) {
          this.draw(t, T);
          const e = B.env(T, start, END);
          const ctx = c.ensure();
          ctx.globalAlpha = 1;
          if (e > 0) {

            lay();
            const ik = OM.fieldInks('tokyo-night');
            const L = OM.HOME;
            // Dust puffs: each letter domino kicks up two specks as it lands.
            ctx.fillStyle = ik.mid;
            for (let j = 0; j < at.length; j++) {
              if (kind[j] < 2) continue;
              const a = T - at[j] - 0.06;
              if (a < 0 || a > 0.3) continue;
              const col = (j % CW) + C0, row = Math.floor(j / CW) + R0;
              const x = L.x0 + (col + 0.5) * L.cw, y = L.y0 + (row + 0.5) * L.ch;
              ctx.globalAlpha = e * (1 - a / 0.3) * 0.8;
              const sp = 40 * a;
              ctx.fillRect(x - sp - 2, y - sp * 0.6, 3, 3);
              ctx.fillRect(x + sp, y + sp * 0.4, 3, 3);
            }
          }
          ctx.globalAlpha = 1;
          fx.apply(T, (() => {
            const { set } = lay();
            // The spiral runs on the beat clock, so it surges through each beat.
            const s = OM.smooth(OM.prog(beat.clock(T), 222.3, 226.6));
            // The latest word's impact ripples out from its first domino; the flood ripples from the centre.
            let k = -1;
            on.forEach((o, i) => { if (T >= o) k = i; });
            const w = k >= 0 ? set.words[k] : null;
            const p0 = w ? [(w.x + 10) / 1920, 1 - (w.y - set.cap / 2) / 1080, T - on[k], 1] : [0.5, 0.5, 9, 0];
            const p1 = T >= FLOOD ? [0.5, 0.5, (T - FLOOD) * 0.7, 1.4] : [0.5, 0.5, 9, 0];
            return {
              amount: e,
              cam: { zoom: 1 + e * (0.06 + 0.08 * s), rot: e * 0.045 * s, y: e * -22 * s },
              p0, p1,
            };
          })());
        },
        release: () => { fx.release(); c.release(); },
    };
  },
});
