// c3-02 · Orbital ring. The line of light the aurora folded into is a ring in
// orbit seen edge on; it tilts open over a planet's limb and the machine
// assembles: each word is one segment of the ring, its letters standing on the
// band, flying in along the orbit and locking into place on its onset with a
// flash of its rails and two bolts at its seams. The back arc carries the first
// half of the line, the front arc the rest. The downbeat word locks hardest;
// the last segment closes the ring and power runs round it on the kicks. On the
// next downbeat the ring is drawn in round its core and its two rails fuse into
// one spinning ring of lights, which snaps tight on the beat before the cut and
// flares: that ring is the drone swarm c3-03 bursts out of.
OM.ownWords.add('c3-02');
// Edit camera: the key word (w4) locks on the 248.670 downbeat, so the downbeat punch is raised to
// make it the biggest beat in the scene (the 250.806 downbeat, where the ring is drawn in, rises
// with it). The scene's own camera only rolls and pushes slowly, so nothing stacks on the beats.
OM.edit.plan('c3-02', { down: 2 });
// The c3-02 > c3-03 match cut: the orbital ring tightened into a ring of drone lights round the core.
OM.c3cut = OM.c3cut || {};
(() => {
  const HL = OM.HOME, hc = OM.cellAt(HL, 960, 540);
  const CX = HL.x0 + (hc.col + 0.5) * HL.cw, CY = HL.y0 + (hc.row + 0.5) * HL.ch;
  const COLLAPSE = 250.845, BEAT = 251.333, N = 520, SC = 0.42;
  const R = { COLLAPSE, LAND: 251.3, BEAT, N, SC, CX, CY, RX: 910 * SC, RY: 300 * SC };
  R.spin = (T) => (T <= COLLAPSE ? 0 : 1.6 * (T - COLLAPSE) * (T - COLLAPSE));
  /** Light j of the ring at time T. */
  R.at = (j, T) => {
    const a = -Math.PI + (j * Math.PI) / 260 + R.spin(T);
    return [CX + R.RX * Math.cos(a), CY + R.RY * Math.sin(a)];
  };
  /** The shared cut frame: core pool and cell, and the ring's lights flaring on the beat. */
  R.paint = (ctx, T, dpr) => {
    const C = OM.c3, ink = C.ink;
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    const fl = T >= BEAT && T < BEAT + 0.06;
    C.pool(ctx, CX, CY, 72, ink.lit, fl ? 0.7 : 0.4);
    ctx.fillStyle = ink.crest;
    OM.cell(ctx, HL, hc.col, hc.row, dpr);
    ctx.fillStyle = fl ? ink.crest : ink.hover;
    for (let j = 0; j < N; j++) {
      const [x, y] = R.at(j, T);
      ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 5, 4);
    }
  };
  OM.c3cut.ring = R;
})();
OM.scene({
  id: 'c3-02',
  build(el, { start, duration }) {
    const C = OM.c3;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const END = start + duration;
    const ink = C.ink, th = C.th;
    const words = OM.sung('c3-02');
    const on = words.map((w) => w.t0);
    const n = words.length;
    // On the drum as measured: the kicks the power runs round on, and the downbeat the ring is drawn in on
    // (the shared ring keeps its own clock, R.COLLAPSE, for the spin of the cut frames).
    const DOWN = 248.709, KICKS = [249.754, 250.032, 250.54].map((t) => C.onDrum(t, 'kick')), COLLAPSE = OM.beatOnset(250.845);
    const PAUSE = [249.893, 250.404].map((t) => C.onDrum(t, 'snare'));
    const KEY = words.reduce((b, w, k) => (Math.abs(w.t0 - DOWN) < Math.abs(words[b].t0 - DOWN) ? k : b), 0);
    const LAST = n - 1;
    const HL = OM.HOME, hc = OM.cellAt(HL, 960, 540);
    const CX = HL.x0 + (hc.col + 0.5) * HL.cw, CY = HL.y0 + (hc.row + 0.5) * HL.ch;
    const RX = 910, RY = 300, BAND = 58;
    const back = Math.ceil(n / 2); // words 0..back-1 ride the back arc

    // A point on the orbit at x offset dx, back (upper) or front (lower), as an angle so segments can fly along it.
    const angOf = (dx, up) => {
      const a = Math.acos(OM.clamp(dx / RX, -1, 1));
      return up ? -a : a;
    };
    const type = C.lazy(() => {
      const rows = [{ ks: [...Array(back).keys()], cap: 88, cy: 0, maxW: 1620, minCap: 70 }, { ks: [...Array(n - back).keys()].map((i) => i + back), cap: 88, cy: 0, maxW: 1620, minCap: 70 }];
      const place = C.layout(words, rows);
      const step = 9; // the film's lattice type: 8px cells on a 9px pitch
      // Letters one by one, each standing upright on the band at its own angle.
      const segs = words.map((wd, k) => {
        const p = place[k];
        if (!p || !wd.text) return null;
        const up = k < back;
        const adv = C.measure('M', 800, p.px);
        const letters = [...wd.text].map((ch, i) => {
          const x = p.x + i * adv;
          return { ang: angOf(x + adv / 2 - 960, up), w: adv, d: C.dots(ch, 800, p.px, step).pts };
        });
        const a0 = angOf(p.x - 22 - 960, up), a1 = angOf(p.x + p.w + 22 - 960, up);
        return { up, letters, a0: Math.min(a0, a1), a1: Math.max(a0, a1), cap: p.cap };
      });
      return { segs };
    });

    const R = (s) => ({ rx: RX * s, ry: RY * s });
    // Camera: an orbital roll round the planet with a slow push. Effect: the atmosphere scatters light
    // along the planet's limb, green at the edge going to the theme's blue above it.
    const FX = `vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec3 c = src(p).rgb;
  vec2 px = vec2(p.x * 1920.0, (1.0 - p.y) * 1080.0);
  float d = length(px - vec2(960.0, 2010.0)) - 1250.0;
  float rim = d > 0.0 ? exp(-d / 70.0) : exp(d / 16.0);
  vec3 sky = mix(vec3(0.62, 0.81, 0.42), vec3(0.48, 0.64, 0.97), smoothstep(0.0, 120.0, d));
  return vec4(c + uAmount * uP0.x * rim * sky * 0.45, 1.0);
}`;
    const fxAt = (T) => ({
      amount: 1, p0: [C.sm(T, start + 0.05, start + 0.5) * (1 - C.sm(T, COLLAPSE, COLLAPSE + 0.3)), 0, 0, 0],
      cam: { zoom: 1.05 + 0.04 * OM.prog(T, start, END), rot: 0.03 * Math.sin((T - start) * 0.7) },
    });
    return OM.c3.withFx(el, c, start, END, FX, fxAt)({
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        const RG = OM.c3cut.ring;
        if (T > END - 0.07) return RG.paint(ctx, T, dpr);
        if (C.seam(ctx, T, dpr, start, END, 'line', 'spark')) return; // out-side never reached: the ring paints the last frames
        const { segs } = type();
        const open = OM.ease.outCubic(OM.prog(T, start + 0.02, start + 0.3)); // the line tilts open into the ring
        const shrink = 1 - OM.ease.inCubic(OM.prog(T, COLLAPSE, RG.LAND)); // drawn in round the core, slamming tight
        const gone = 1 - shrink; // the rails fuse into one ring of lights
        const s = OM.lerp(RG.SC, 1, shrink), ry = RY * open * s, rx = RX * s;
        const spin = RG.spin(T);
        const wordsA = 1 - C.sm(T, COLLAPSE, COLLAPSE + 0.22);
        const power = C.sm(T, on[LAST], on[LAST] + 0.25);
        const P = (a, dy = 0) => [CX + rx * Math.cos(a + spin), CY + ry * Math.sin(a + spin) + dy * open * s * (1 - gone)];

        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        C.stars(ctx, T, C.sm(T, start, start + 0.4) * shrink);
        // Satellite glints on high orbits, and drifting debris.
        const skyA = C.sm(T, start + 0.1, start + 0.6) * shrink;
        if (skyA > 0.01) {
          for (let i = 0; i < 5; i++) {
            const x = ((OM.hash(i, 1, 21) * 2200 + (T - start) * (40 + 60 * OM.hash(i, 2, 21))) % 2200) - 140, y = 50 + 330 * OM.hash(i, 3, 21);
            const blink = ((T + OM.hash(i, 4, 21)) * 1.4) % 1 < 0.12;
            ctx.fillStyle = C.rgba(blink ? ink.crest : ink.mid, skyA);
            ctx.fillRect(Math.round(x), Math.round(y), blink ? 4 : 2, blink ? 4 : 2);
            if (blink) C.pool(ctx, x + 2, y + 2, 26, ink.hover, 0.35 * skyA);
          }
          ctx.fillStyle = C.rgba(th['border-strong'] || ink.dim, 0.8 * skyA);
          for (let i = 0; i < 36; i++) {
            const x = OM.hash(i, 5, 22) * 2000 - (T - start) * 18 * (0.5 + OM.hash(i, 6, 22));
            ctx.fillRect(Math.round((((x % 2000) + 2000) % 2000) - 40), Math.round(OM.hash(i, 7, 22) * 1080), 3, 2);
          }
        }
        // The line's ends beyond the ring burn off as it tilts open.
        const tail = 1 - C.sm(T, start + 0.02, start + 0.2);
        if (tail > 0) {
          ctx.globalAlpha = tail;
          ctx.fillStyle = ink.crest;
          for (let col = HL.cMin; col < HL.cMin + HL.cols; col++) OM.cell(ctx, HL, col, hc.row, dpr);
          ctx.globalAlpha = 1;
        }
        // The planet's limb below, lit green along its edge.
        const planetA = C.sm(T, start + 0.05, start + 0.5) * (1 - C.sm(T, COLLAPSE, COLLAPSE + 0.3));
        if (planetA > 0.01) {
          ctx.globalAlpha = planetA;
          const pr = 1250, py = 760 + pr;
          ctx.fillStyle = th['bg-deep'] || '#111';
          ctx.beginPath();
          ctx.arc(960, py, pr, 0, Math.PI * 2);
          ctx.fill();
          for (let x = 0; x < 1920; x += 6) {
            const dx = x + 3 - 960, y = py - Math.sqrt(pr * pr - dx * dx);
            const v = 1 - Math.abs(dx) / 1100;
            ctx.fillStyle = v > 0.7 ? ink.lit : v > 0.35 ? ink.mid : ink.dim;
            ctx.fillRect(x, Math.round(y), 5, 3);
            if (v > 0.5) { ctx.fillStyle = ink.dim; ctx.fillRect(x, Math.round(y) + 6, 5, 2); }
          }
          ctx.globalAlpha = 1;
        }

        // Each segment's state: how far along the orbit it still has to fly, and its lock flash.
        const st = segs.map((sg, k) => {
          if (!sg) return null;
          const lead = Math.min(0.42, on[k] - (start + 0.06));
          const arr = C.arrive(T, on[k], Math.max(0.05, lead));
          if (arr <= 0) return null;
          const big = k === KEY ? 1.6 : k === LAST ? 1.3 : 1;
          return { off: (1 - arr) * (sg.up ? 1.1 : -1.1), a: arr, hit: C.decay(T, on[k], 0.12) * big, locked: T >= on[k] };
        });
        // Power running round the closed ring on the kicks.
        const runner = (a) => {
          let v = 0;
          for (const kk of [on[LAST], ...KICKS]) {
            const age = T - kk;
            if (age < 0 || age > 0.7) continue;
            const head = -Math.PI / 2 + age * 11;
            for (const sgn of [1, -1]) {
              let d = Math.abs(((a - sgn * head) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
              if (d < 0.5) v = Math.max(v, (1 - d / 0.5) * (1 - age / 0.7));
            }
          }
          return v;
        };
        const rails = (up) => {
          // Bare rails where no segment has locked; the locked segments' rails lit.
          for (let i = 0; i < 260; i++) {
            const a = (up ? -Math.PI : 0) + (i / 260) * Math.PI;
            let v = 0.15 * open + 0.55 * power + runner(a);
            for (let k = 0; k < n; k++) {
              const sg = segs[k], q = st[k];
              if (!sg || !q || sg.up !== up) continue;
              const aa = a - q.off;
              if (aa >= sg.a0 && aa <= sg.a1) v = Math.max(v, (q.locked ? 0.55 : 0.3 * q.a) + q.hit);
            }
            v = OM.lerp(v, 0.8, gone);
            const col = v > 1 ? ink.crest : v > 0.6 ? ink.hover : v > 0.35 ? ink.lit : v > 0.16 ? ink.mid : ink.dim;
            ctx.fillStyle = col;
            for (const dy of [-BAND, BAND]) {
              const [x, y] = P(a, dy);
              ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 5, 4);
            }
          }
        };
        const letters = (up) => {
          if (wordsA <= 0) return;
          ctx.globalAlpha = wordsA;
          for (let k = 0; k < n; k++) {
            const sg = segs[k], q = st[k];
            if (!sg || !q || sg.up !== up) continue;
            for (const L of sg.letters) {
              const [lx, ly] = P(L.ang + q.off);
              const v = q.hit + (q.locked ? 0.55 : 0.2) + 0.3 * power + runner(L.ang);
              ctx.fillStyle = v > 1.05 ? ink.crest : v > 0.5 ? ink.hover : ink.lit;
              const x0 = lx - L.w / 2, y0 = ly + sg.cap / 2;
              for (let i = 0; i < L.d.length; i += 2) ctx.fillRect(Math.round(x0 + L.d[i] - 4), Math.round(y0 + L.d[i + 1] - 4), 8, 8);
            }
            // Bolts at the seams on the lock.
            // Seam re-strike: the pause snares spark every seam of the closed ring again.
            const bh = Math.max(q.hit, T > on[LAST] + 0.3 ? 0.55 * OM.pulse(PAUSE, T, 0.07) : 0);
            if (bh > 0.05) {
              for (const a of [sg.a0, sg.a1]) {
                const [x, y] = P(a);
                C.pool(ctx, x, y, 90 * bh + 20, ink.hover, 0.6 * bh);
                ctx.fillStyle = ink.crest;
                ctx.fillRect(Math.round(x - 4), Math.round(y - BAND), 8, 2 * BAND);
              }
            }
          }
          ctx.globalAlpha = 1;
        };

        if (open > 0.02 && s > 0.02) {
          rails(true);
          letters(true);
        }
        // The core: the machine's heart, lit when the ring closes.
        const coreA = 0.25 * open + 0.5 * power + 0.5 * C.decay(T, on[KEY], 0.2) + 0.3 * OM.pulse(KICKS, T, 0.1);
        C.pool(ctx, CX, CY, OM.lerp(72, 70 + 200 * power, shrink), ink.lit, OM.lerp(0.4, 0.4 * Math.min(1.5, coreA), shrink));
        ctx.fillStyle = ink.crest;
        OM.cell(ctx, HL, hc.col, hc.row, dpr);
        if (open > 0.02 && s > 0.02) {
          rails(false);
          letters(false);
        }
      },
      release: () => c.release(),
    });
  },
});
