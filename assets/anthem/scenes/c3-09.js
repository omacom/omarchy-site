// c3-09 · Collapse and rebirth (keep). The girders' lattice is the home grid,
// and the line is set into it in lit cells: the first word flashes up on its
// onset and the girder steel sheds off the grid round it, leaving the bare
// grid; the second lands under the downbeat and holds. On the name's onset
// everything collapses: every lit cell is pulled out of the words into the
// mark at the centre, which locks solid and pulses on the kick and downbeat.
// On the next kick the mark detonates, a square shock ring runs out, and behind
// it the homepage field and the wordmark are reborn, cell by cell, across the
// held note, settling into the field with the wordmark at home.
OM.ownWords.add('c3-09');
// Edit camera: the scene's own camera owns the end of the line. The crash zoom into the collapse slams
// to a stop on the 277.998 backbeat (a hat, no kick or snare), and the finale kicks punch and shake it
// (K2 279.600, K3 280.180, K4 280.524); the camera beats on or just before them would stack, so they
// are skipped. The 278.544 downbeat (the mark locks on the kick) keeps its punch, the camera's biggest
// in the scene.
OM.edit.plan('c3-09', { skip: [277.998, 279.6, 280.134, 280.524] });
OM.scene({
  id: 'c3-09',
  build(el, { start, duration }) {
    const C = OM.c3;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const END = start + duration;
    const L = OM.HOME;
    const ink = C.ink;
    const words = OM.sung('c3-09');
    const on = words.map((w) => w.t0);
    const n = words.length;
    const NAME = C.nameIndex(words);
    const PULL = on[NAME], LOCK = 278.547, BOOM = 278.802, REST = 279.4;
    // The downbeat the mark pulses on, and the finale's four kicks, on the drum as measured.
    const DOWN = OM.beatOnset(278.57), FIN = [279.429, 279.615, 280.149, 280.497].map((t) => C.onDrum(t, 'kick'));
    // The collapse lands on the beat after the name (its onset): the cells lock into the mark there
    // (the pull's ease reaches 0.98 on it), and the crash zoom slams to a stop and the mark flashes with it.
    const LANDP = OM.beatOnset(278.036);
    const home = OM.cellAt(L, 960, 540);
    // The mark: the 15x15 logo, each logo pixel a 2x2 block of home cells, centred.
    const mark = [];
    for (const [mc, mr] of OM.cells(OM.LOGO))
      for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) mark.push([home.col - 15 + mc * 2 + a, home.row - 15 + mr * 2 + b]);
    const WM = OM.cells(OM.WORDMARK);
    const STEP = 9; // the film's lattice type: JetBrains Mono 800 in 8px cells on a 9px pitch

    const type = C.lazy(() => {
      const ks = words.map((_, k) => k).filter((k) => k !== NAME);
      const place = C.layout(words, [{ ks, cap: 120, minCap: 70, cy: 500 }]);
      const pts = C.wordPts(words, place, 800, STEP);
      const cells = [];
      ks.forEach((k) => {
        const P = pts[k];
        for (let i = 0; i < P.length; i += 2) cells.push({ k, x: P[i], y: P[i + 1], slot: mark[cells.length % mark.length] });
      });
      return { place, cells };
    });

    // Camera: a crash zoom into the collapse, an explosive pull back on the rebirth. Effect: a
    // shockwave ring that refracts the frame as it runs out, riding the drawn ring.
    const FX = `vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec2 px = vec2(p.x * 1920.0, (1.0 - p.y) * 1080.0) - vec2(960.0, 540.0);
  vec2 e = px * vec2(1.0, 1.7);
  float d = length(e) - uP0.x;
  float ring = exp(-d * d / 2400.0) * uAmount;
  vec2 dir = normalize(e + 1e-4) / vec2(1.0, 1.7);
  vec2 q = px - dir * ring * 26.0;
  vec3 c = src((q + vec2(960.0, 540.0)) / vec2(1920.0, -1080.0) + vec2(0.0, 1.0)).rgb;
  return vec4(c + ring * 0.25 * vec3(0.73, 0.87, 0.59), 1.0);
}`;
    const fxAt = (T) => {
      const out = OM.ease.outExpo(OM.clamp((T - BOOM) / 1.0));
      const back = OM.ease.outExpo(OM.clamp((T - BOOM) / 0.7));
      const shake = C.decay(T, BOOM, 0.08);
      // The finale kicks punch the camera in, each harder (zero by the cut through the window envelope).
      const punch = [[FIN[0], 0.012], [FIN[1], 0.02], [FIN[2], 0.03], [FIN[3] + 0.1, 0.045]].reduce((m, [k, a]) => Math.max(m, a * C.decay(T, k, 0.06)), 0);
      return {
        amount: T >= BOOM && T < BOOM + 1 ? 1 - out : 0, p0: [out * 1500, 0, 0, 0],
        cam: {
          zoom: 1 + 0.22 * OM.ease.inCubic(OM.prog(T, PULL - 0.05, LANDP)) * (1 - back) + (T > REST ? punch : 0),
          x: 14 * shake * Math.sin(T * 97) + (T > REST ? 900 * punch * Math.sin(T * 97) : 0), y: 10 * shake * Math.cos(T * 83),
        },
      };
    };
    return OM.c3.withFx(el, c, start, END, FX, fxAt)({
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        const GD = OM.c3cut.girders, SHED = 0.3; // the girders shed over the first word's read
        if (T < start + 0.05) return GD.paint(ctx, T, dpr);
        if (C.seam(ctx, T, dpr, start, END, 'grid', 'word', start)) return;
        if (T >= REST) {
          // The finale, one bigger move on each of the last four kicks (event times): the wordmark's echo
          // ripples out across the field; the letters split along their rows and slam back under a triple
          // echo; the field flips to crest in a giant wordmark filling the frame, the home letters cut dark
          // out of it; and the giant mark contracts into the home wordmark and rebounds as one last echo.
          // Everything settles to the exact field with the wordmark at home before the cut.
          const [K1, K2, K3, K4] = FIN, OFF = 280.68;
          if (T >= OFF || T < K1) return OM.handoff('word', ctx, T, dpr);
          const g = 1 - C.sm(T, 280.6, OFF);
          const WR = OM.WORDMARK.rows, WC = 40.5, WRc = 9.5, BIG = 2.05;
          const bit = (c, r) => r >= 0 && r < 19 && c >= 0 && c < 81 && WR[r][c] === '1';
          const at = (col, row, sc) => bit(Math.floor(WC + (col + 0.5 - WC) / sc), Math.floor(WRc + (row + 0.5 - WRc) / sc));
          // The giant wordmark's scale: grows out on kick 3, contracts home on kick 4.
          const big = T < K3 ? 0 : T < K4 ? OM.lerp(1, BIG, OM.ease.outExpo(OM.prog(T, K3, K3 + 0.1))) : OM.lerp(BIG, 1, OM.ease.inCubic(OM.prog(T, K4, K4 + 0.1)));
          const landed = T >= K4 + 0.1;
          let hb = 0;
          [[K1, 0.5], [K2, 0.75], [K3, 1.0], [K4 + 0.1, 1.5]].forEach(([k, a]) => (hb = Math.max(hb, a * C.decay(T, k, 0.1))));
          hb *= g;
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const gl = [{ x: 960, y: 540, strength: 0.5 * hb, reach: 380 + 900 * hb }];
          OM.hero(ctx, T, dpr, { inks: ink, L, word: false, gain: 0.8, bg: false, glows: gl });
          const C0 = L.cMin, C1 = L.cMin + L.cols, R0 = L.rMin, R1 = L.rMin + L.rows;
          // Wordmark-shaped ripples: the band between the echo at scale sc and at 0.82 sc.
          const echo = (sc, col0) => {
            ctx.fillStyle = col0;
            for (let row = R0; row < R1; row++)
              for (let col = C0; col < C1; col++) if (at(col, row, sc) && !at(col, row, sc * 0.82)) OM.cell(ctx, L, col, row, dpr);
          };
          const waves = [];
          const a1 = T - K1;
          if (a1 < 0.32) waves.push([1 + 5 * OM.ease.outCubic(a1 / 0.32), a1 < 0.16 ? ink.hover : ink.lit]);
          for (let w = 0; w < 3; w++) {
            const a2 = T - K2 - w * 0.05;
            if (a2 >= 0 && a2 < 0.34) waves.push([1 + 7 * OM.ease.outCubic(a2 / 0.34), a2 < 0.12 ? ink.crest : a2 < 0.24 ? ink.hover : ink.lit]);
          }
          const a4 = T - K4 - 0.1;
          if (landed && a4 < 0.12) waves.push([1 + 9 * OM.ease.outExpo(a4 / 0.12), a4 < 0.06 ? ink.crest : ink.hover]);
          for (const [sc, col0] of waves) echo(sc, col0);
          // The flip: the giant wordmark filled with crest, shimmering on the hats.
          const flip = T >= K3 && !landed;
          if (flip) {
            const tw = Math.floor(T * 16);
            for (let row = R0; row < R1; row++)
              for (let col = C0; col < C1; col++) {
                if (!at(col, row, big)) continue;
                ctx.fillStyle = OM.hash(col, row, tw) > 0.88 ? ink.hover : ink.crest;
                OM.cell(ctx, L, col, row, dpr);
              }
          }
          // The home wordmark: dark inside the flip, split along its rows on kick 2, crest as the giant lands.
          if (!flip) {
            ctx.fillStyle = ink.bg;
            ctx.fillRect(L.x0 - L.cw, L.y0 - 3 * L.ch, 83 * L.cw, 24 * L.ch);
          }
          const a2 = T - K2, sp = a2 < 0 ? 0 : a2 < 0.04 ? OM.ease.outExpo(a2 / 0.04) : 1 - OM.ease.inCubic(OM.clamp((a2 - 0.04) / 0.12));
          const crest = landed ? C.decay(T, K4 + 0.1, 0.05) * g : 0;
          const sweep = (col) => T - K1 < 0.25 && Math.abs(col - (-5 + ((T - K1) / 0.25) * 91)) < 4;
          if (flip || sp > 0.001) {
            for (const [col, row] of WM) {
              const dx = sp * (row % 2 ? 1 : -1) * (14 + 10 * OM.hash(row, 0, 0x90a)) * L.cw, dy = sp * (row - 9.5) * 1.6 * L.ch;
              ctx.fillStyle = flip ? ink.bg : sp > 0.5 ? ink.crest : ink[OM.BANDS[row]];
              ctx.fillRect(Math.round(L.x0 + col * L.cw + dx), Math.round(L.y0 + row * L.ch + dy), Math.ceil(L.cw), Math.ceil(L.ch));
            }
          } else OM.paintWord(ctx, L, dpr, ink, { glows: gl, wordInk: (row, col) => (crest > 0.12 || sweep(col) ? ink.crest : crest > 0.04 ? ink.hover : null) });
          return;
        }
        const { cells } = type();
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);

        if (T < BOOM) {
          // The grid, fading as the line collapses out of it.
          const gA = 1 - C.sm(T, PULL, PULL + 0.3);
          if (T < on[0] + SHED) GD.paint(ctx, T, dpr, OM.prog(T, on[0], on[0] + SHED));
          else if (gA > 0) {
            ctx.globalAlpha = gA;
            OM.handoff('grid', ctx, T, dpr);
            ctx.globalAlpha = 1;
          }
          const pull = OM.ease.inOutExpo(OM.prog(T, PULL - 0.03, PULL + 0.32));
          for (const cl of cells) {
            const t0 = on[cl.k];
            if (T < t0) continue;
            const hit = C.decay(T, t0, 0.12);
            const sx = L.x0 + (cl.slot[0] + 0.5) * L.cw, sy = L.y0 + (cl.slot[1] + 0.5) * L.ch;
            const x = OM.lerp(cl.x, sx, pull), y = OM.lerp(cl.y, sy, pull);
            const v = 0.7 + hit + (pull > 0 && pull < 1 ? 0.6 : 0);
            ctx.fillStyle = v > 1.1 ? ink.crest : v > 0.6 ? ink.hover : ink.lit;
            const s = OM.lerp(STEP - 1, L.cw, pull);
            ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s));
          }
          // The mark, locked solid once the cells arrive, pulsing on the kick and the downbeat.
          if (pull >= 0.98) {
            const p = C.decay(T, LANDP, 0.12) + C.decay(T, LOCK, 0.1) + 0.6 * C.decay(T, DOWN, 0.14);
            C.pool(ctx, 960, 540, 520, ink.lit, 0.18 + 0.3 * p);
            ctx.fillStyle = p > 0.6 ? ink.crest : p > 0.25 ? ink.hover : ink.lit;
            for (const [col, row] of mark) OM.cell(ctx, L, col, row, dpr);
          }
          return;
        }
        // Rebirth: the field and the wordmark arriving behind the shock ring, settling to the site's own state.
        const out = OM.ease.outExpo(OM.clamp((T - BOOM) / 1.0));
        const r = out * 1500;
        const settle = C.sm(T, BOOM + 0.35, REST - 0.05);
        const inR = (x, y) => Math.hypot(x - 960, (y - 540) * 1.7) < r;
        OM.hero(ctx, T, dpr, {
          inks: ink, L, word: false, gain: OM.lerp(1.25, 0.8, settle), bg: false,
          mask: (col, row) => (inR(L.x0 + (col + 0.5) * L.cw, L.y0 + (row + 0.5) * L.ch) ? 1 : 0),
          glows: settle < 1 ? [{ x: 960, y: 540, strength: (1 - settle) * (1 - out * 0.6), reach: Math.max(1, r) }] : [],
        });
        for (const [col, row] of WM) {
          const x = L.x0 + (col + 0.5) * L.cw, y = L.y0 + (row + 0.5) * L.ch;
          if (!inR(x, y)) continue;
          const fresh = Math.hypot(x - 960, (y - 540) * 1.7) > r - 160 && settle < 1;
          ctx.fillStyle = fresh ? ink.crest : settle < 0.5 && (1 - settle) * OM.hash(col, row, 5) > 0.4 ? ink.hover : ink[OM.BANDS[row]];
          OM.cell(ctx, L, col, row, dpr);
        }
        // Particles blown out of the mark.
        for (let j = 0; j < 300; j++) {
          const age = T - BOOM;
          if (age > 1.2) break;
          const a = OM.hash(j, 1, 99) * Math.PI * 2, sp = 500 + 900 * OM.hash(j, 2, 99);
          const r = sp * OM.ease.outCubic(age / 1.2);
          ctx.fillStyle = C.rgba(j % 3 ? ink.hover : ink.crest, 1 - age / 1.2);
          const s = OM.lerp(5, 2, age / 1.2);
          ctx.fillRect(Math.round(960 + Math.cos(a) * r - s / 2), Math.round(540 + Math.sin(a) * r * 0.6 - s / 2), Math.round(s), Math.round(s));
        }
        // The mark burning off at the centre, and the ring.
        const mA = 1 - C.sm(T, BOOM, BOOM + 0.25);
        if (mA > 0) {
          ctx.globalAlpha = mA;
          ctx.fillStyle = ink.crest;
          for (const [col, row] of mark) OM.cell(ctx, L, col, row, dpr);
          ctx.globalAlpha = 1;
        }
        if (out < 1) {
          ctx.strokeStyle = ink.crest;
          ctx.lineWidth = L.cw * (1 - out) * 2 + 1;
          ctx.globalAlpha = 1 - out;
          ctx.strokeRect(960 - r, 540 - r / 1.7, r * 2, (r * 2) / 1.7);
          ctx.globalAlpha = 1;
        }
      },
      release: () => c.release(),
    });
  },
});
