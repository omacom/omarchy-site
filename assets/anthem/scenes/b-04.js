// b-04 · Life on the board. The grid becomes a Game of Life board. Each
// word is set into the board as live cells on its onset, a crest stamp, and
// the rule (B3/S23) runs on every 8th note: while the line is sung the letters
// hold, and life sprouts and dies along their edges, so the words are alive
// but readable. On the downbeat after the last word they are let go and the
// rule runs on 16ths, the letters breaking up into blinkers, blocks and gliders.
// The kicks flash the board. Then everything outside the screen's edge dies,
// the life inside goes dark, and the board is a screen.

// Edit camera: the scene's turn is the downbeat after the last word (208.198), where the
// letters are let go and life runs on 16ths, so the downbeat punch is raised to make it the
// biggest hit; nothing in the scene's own camera moves on the drums, so nothing stacks.
OM.edit.plan('b-04', { down: 2.4 });

OM.ownWords.add('b-04');
OM.scene({
  id: 'b-04',
  build(el, { start, duration }) {
    const B = OM.bridge;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: `vec4 effect(vec2 uv) {
  vec2 p = uv - 0.5;
  p.x *= 1.7778;
  float r = length(p);
  vec2 pd = p * (1.0 + 0.06 * r * r);
  vec2 q = cam(vec2(pd.x / 1.7778, pd.y) + 0.5);
  vec4 s = src(q);
  float R = 2.5 * uP0.x;
  vec4 acc = s;
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0472;
    acc += src(q + vec2(cos(a) / 1920.0, sin(a) / 1080.0) * R);
  }
  s = acc / 7.0;
  float vig = smoothstep(0.99, 0.74, r);
  vec3 col = s.rgb * vig;
  col += vec3(0.4, 0.52, 0.29) * 0.12 * smoothstep(0.03, 0.0, abs(r - 0.9));
  return mix(src(cam(uv)), vec4(col, 1.0), uAmount);
}` });
    const END = start + duration;
    const L = OM.HOME;
    const ink = OM.fieldInks('tokyo-night');
    const th = OM.theme('tokyo-night');
    const sung = OM.sung('b-04');
    const on = sung.map((w) => B.land(w.t0, start));
    // The board flashes on the measured kicks (206.296, 207.138, 207.552); the letters are let
    // go on the downbeat's drum onset and the outside dies on the next beat's.
    const KICKS = [206.333, 207.122, 207.54].map((t) => B.onDrum(t, 'kick'));
    const RELEASE = OM.beatOnset(208.237), DIE = OM.beatOnset(208.655);
    const SCR = { x: 320, y: 140, w: 1280, h: 800 };
    const beat = OM.edit.scene(start, END);

    // The clock: 8ths while the line is held, 16ths once it is let go, plus every onset,
    // stepping on the beats' drum onsets (the grid runs ~45 ms late).
    const beats = OM.beatsIn(start - 1, END + 1).map(OM.beatOnset);
    const ticks = [start];
    beats.forEach((b, i) => {
      const nx = beats[i + 1] ?? b + OM.SPB;
      const sub = b >= RELEASE - 0.01 ? 4 : 2;
      for (let s = 0; s < sub; s++) {
        const x = b + ((nx - b) * s) / sub;
        if (x > start + 0.02 && x < END) ticks.push(x);
      }
    });
    on.forEach((o) => ticks.push(o));
    ticks.sort((a, b) => a - b);
    // Ticks crowding an onset give way to it.
    const clock = [];
    for (const x of ticks) {
      const last = clock[clock.length - 1];
      if (last !== undefined && x - last < 0.03) { if (on.includes(x) && !on.includes(last)) clock[clock.length - 1] = x; continue; }
      clock.push(x);
    }
    ticks.splice(0, ticks.length, ...clock);

    // The board runs on the half lattice (2x2 cells per grid square), so the letters are clean strokes.
    const G = B.sub(2);
    const M = 24;
    const c0 = 2 * L.cMin - M, r0 = 2 * L.rMin - M, W = 2 * L.cols + 2 * M, Hh = 2 * L.rows + 2 * M;
    const idx = (col, row) => (row - r0) * W + (col - c0);

    const lay = B.lazy(() => {
      const set = B.set(sung, { weight: 800, cap: 100, minCap: 72, maxW: 1640, cy: 530, lead: 1.42 });
      const words = set.words.map((w) => B.cells(w, set, G).map(([col, row]) => idx(col, row)));
      // Every generation precomputed: live cells with their age, the word cells pinned.
      let board = new Uint8Array(W * Hh);
      const pin = new Uint8Array(W * Hh), age = new Uint16Array(W * Hh), born = new Float32Array(W * Hh);
      const gens = [];
      for (let g = 0; g < ticks.length; g++) {
        const tk = ticks[g];
        if (g > 0) {
          const next = new Uint8Array(W * Hh);
          for (let y = 1; y < Hh - 1; y++)
            for (let x = 1; x < W - 1; x++) {
              const i = y * W + x;
              const nb = board[i - W - 1] + board[i - W] + board[i - W + 1] + board[i - 1] + board[i + 1] + board[i + W - 1] + board[i + W] + board[i + W + 1];
              next[i] = nb === 3 || (nb === 2 && board[i]) ? 1 : 0;
            }
          if (tk < RELEASE - 0.01) {
            for (let i = 0; i < W * Hh; i++) if (pin[i]) next[i] = 1;
          } else pin.fill(0);
          for (let i = 0; i < W * Hh; i++) age[i] = next[i] ? (board[i] ? age[i] + 1 : 0) : 0;
          board = next;
        }
        on.forEach((o, k) => {
          if (Math.abs(o - tk) < 1e-6 && tk < RELEASE) for (const i of words[k]) { board[i] = 1; pin[i] = 1; age[i] = 0; born[i] = o; }
        });
        // A one-cell moat around the held letters stays dark, so life works at their edges, never inside the strokes.
        const moat = new Uint8Array(W * Hh);
        for (let i = W + 1; i < W * Hh - W - 1; i++)
          if (pin[i]) for (const o of [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1]) moat[i + o] = 1;
        const live = [], ages = [], pins = [];
        for (let i = 0; i < W * Hh; i++) if (board[i] && (pin[i] || !moat[i])) { live.push(i); ages.push(age[i]); pins.push(pin[i]); }
        gens.push({ live: Int32Array.from(live), ages: Uint16Array.from(ages), pins: Uint8Array.from(pins) });
      }
      return { gens, born };
    });
    const AGE = [ink.crest, ink.hover, ink.lit, ink.mid, ink.mid, ink.dim];
    const grid = (ctx, dpr, a) => {
      const snap = (v) => Math.round(v * dpr) / dpr;
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
        if (T < on[0] || T >= END - 0.1) return OM.handoff(T < on[0] ? 'grid' : 'screen', ctx, T, dpr);
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const { gens, born } = lay();
        const out = OM.prog(T, DIE, DIE + 0.3), dark = OM.prog(T, DIE + 0.2, END - 0.14);
        grid(ctx, dpr, 1 - OM.prog(T, DIE, END - 0.2));
        const g = OM.clamp(OM.hitCount(ticks, T + 1e-4) - 1, 0, gens.length - 1);
        const since = T - ticks[g];
        const pop = OM.ease.outExpo(OM.clamp(since / 0.08));
        const kick = OM.pulse(KICKS, T, 0.1);
        const cur = gens[g];
        // The screen's edge closes in from the frame on the die-off.
        const inset = (1 - OM.ease.outCubic(out)) * 320;
        const ex0 = SCR.x - inset, ey0 = SCR.y - inset, ex1 = SCR.x + SCR.w + inset, ey1 = SCR.y + SCR.h + inset;
        if (dark > 0) {
          ctx.globalAlpha = dark;
          ctx.fillStyle = th.bg;
          ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
          ctx.globalAlpha = 1;
        }
        for (let n = 0; n < cur.live.length; n++) {
          const i = cur.live[n];
          const col = (i % W) + c0, row = Math.floor(i / W) + r0;
          const x = G.x0 + (col + 0.5) * G.cw, y = G.y0 + (row + 0.5) * G.ch;
          if (x < -20 || x > 1940 || y < -20 || y > 1100) continue;
          const inside = x > SCR.x && x < SCR.x + SCR.w && y > SCR.y && y < SCR.y + SCR.h;
          if (out > 0 && !inside && (x < ex0 || x > ex1 || y < ey0 || y > ey1 || out >= 1)) continue;
          let col0;
          if (cur.pins[n]) {
            const a = T - born[i];
            col0 = OM.mix(ink.hover, ink.crest, Math.max(Math.exp(-a / 0.12), kick * 0.3));
          } else col0 = OM.mix(AGE[Math.min(cur.ages[n] + (T < RELEASE ? 2 : 0), AGE.length - 1)], ink.crest, kick * 0.25);
          ctx.globalAlpha = inside ? 1 - dark : 1;
          ctx.fillStyle = col0;
          if (cur.ages[n] === 0 && !cur.pins[n] && pop < 1) {
            const k = 0.35 + 0.65 * pop;
            ctx.fillRect(G.x0 + (col + 0.5 - k / 2) * G.cw, G.y0 + (row + 0.5 - k / 2) * G.ch, k * G.cw, k * G.ch);
          } else OM.cell(ctx, G, col, row, dpr);
        }
        ctx.globalAlpha = 1;
        // The screen's border draws in around what is left.
        if (out > 0) {
          ctx.globalAlpha = OM.prog(T, DIE + 0.1, DIE + 0.35);
          ctx.strokeStyle = ink.mid;
          ctx.lineWidth = 2;
          ctx.strokeRect(321, 141, 1278, 798);
          ctx.globalAlpha = 1;
        }
      },
      render(t, T) {
          this.draw(t, T);
          const e = B.env(T, start, END);
          const ctx = c.ensure();
          ctx.globalAlpha = 1;
          if (e > 0) {

            // Hat Blinkers: on each 16th of the hi-hat roll, a few blinkers pop in the dark of the board, away from the letters.
            {
              const HATS = ticks.filter((x) => x >= 208.05 && x < END - 0.15);
              const h = OM.lastHit(HATS, T);
              if (h !== null && T - h < 0.16) {
                const n = HATS.indexOf(h), ik = OM.fieldInks('tokyo-night');
                const G2 = B.sub(2);
                const a = (T - h) / 0.16;
                ctx.fillStyle = OM.mix(ik.crest, ik.mid, a);
                ctx.globalAlpha = e * (1 - a);
                for (let i = 0; i < 16; i++) {
                  const x = 120 + OM.hash(i, n, 41) * 1680, y = 80 + OM.hash(i, n, 42) * 920;
                  if (y > 380 && y < 720) continue; // the letters' band stays clear
                  if (T >= DIE && (x < 340 || x > 1580 || y < 160 || y > 920)) continue;
                  const q = Math.floor((x - G2.x0) / G2.cw), r = Math.floor((y - G2.y0) / G2.ch), vert = (n + i) % 2;
                  for (let k = -1; k <= 1; k++) OM.cell(ctx, L, Math.floor(q / 2) + (vert ? 0 : k), Math.floor(r / 2) + (vert ? k : 0), c.dpr);
                }
                ctx.globalAlpha = 1;
              }
            }

            // Micro-particles drifting through the slide.
            B.motes(ctx, T, { seed: 404, n: 60, color: OM.fieldInks('tokyo-night').dim, alpha: 0.7 * e, vx: 9, vy: 5, size: 4 });
            B.motes(ctx, T, { seed: 405, n: 18, color: OM.fieldInks('tokyo-night').mid, alpha: 0.4 * e, vx: -5, vy: 8, size: 2 });
          }
          ctx.globalAlpha = 1;
          // The drift and the focus wobble run on the beat clock, so they surge through each beat.
          const C = beat.clock(T);
          fx.apply(T, {
            // The lens eases off while the line is held, so the strokes read crisp.
            amount: e * (1 - 0.9 * OM.smooth(OM.prog(T, on[0] - 0.1, on[0] + 0.1)) * (1 - OM.smooth(OM.prog(T, RELEASE, RELEASE + 0.3)))),
            cam: { zoom: 1 + e * 0.075, x: e * 22 * Math.sin(C * 0.6), y: e * 14 * Math.cos(C * 0.8), rot: e * 0.008 * Math.sin(C * 0.5) },
            p0: [0.5 + 0.5 * Math.sin(C * 2.7), 0, 0, 0],
          });
        },
        release: () => { fx.release(); c.release(); },
    };
  },
});
