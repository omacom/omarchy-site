// c3-03 · Drone show. The orbital ring's lights are the drones: the spinning
// ring bursts into a swarm of thousands of lights hanging dim over the night,
// and the swarm flies the line.
// Each word's drones leave the swarm and slam into formation on its onset, in a
// flash; the name is flown as the wordmark itself, the biggest formation, one
// drone per bitmap cell, locking on the kick under it. Colour waves run across
// the name on the downbeat and snares. On the kicks after the line the show
// breaks formation and the whole swarm pours down into a stage spotlight,
// becoming the dust in its beam.
OM.ownWords.add('c3-03');
// Edit camera: the pour starts on the strong 254.104 kick, 100 ms after the 254.002 beat (a bare hat);
// the beat's punch would stack on the kick's, so it is skipped and the kick punches as a full beat
// (offbeat 1). The name lands between beats, so the scene's own camera punches on it (fxAt).
OM.edit.plan('c3-03', { skip: [253.99], offbeat: 1 });
OM.scene({
  id: 'c3-03',
  build(el, { start, duration }) {
    const C = OM.c3;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const END = start + duration;
    const ink = C.ink, th = C.th;
    const words = OM.sung('c3-03');
    const on = words.map((w) => w.t0);
    const NAME = C.nameIndex(words);
    // On the drum as measured: the downbeat and snare colour waves, the break and pour kicks, the beam pulses.
    const DOWN = OM.beatOnset(252.981), SNARES = [253.167, 253.469].map((t) => C.onDrum(t, 'snare'));
    const BREAK = C.onDrum(253.887, 'kick'), POUR = C.onDrum(254.073, 'kick');
    const BEAM = [254.073, 254.68, 255.35].map((t) => C.onDrum(t, 'kick'));
    const HL = OM.HOME, hc = OM.cellAt(HL, 960, 540);
    const SX = HL.x0 + (hc.col + 0.5) * HL.cw, SY = HL.y0 + (hc.row + 0.5) * HL.ch;
    const EXTRA = 700;

    const swarm = C.lazy(() => {
      const others = words.map((_, k) => k).filter((k) => k !== NAME);
      const place = C.layout(words, [{ ks: others, cap: 92, cy: 250 }]);
      const pts = C.wordPts(words, place, 800, 10);
      // The name: the wordmark bitmap, one drone per lit cell, 1500px wide.
      const cell = 1500 / OM.WORDMARK.w, nx = 960 - 750, ny = 650 - (OM.WORDMARK.h * cell) / 2;
      pts[NAME] = Float32Array.from(OM.cells(OM.WORDMARK).flatMap(([col, row]) => [nx + (col + 0.5) * cell, ny + (row + 0.5) * cell]));
      const D = [];
      const rng = OM.rng(0xc303);
      const home = () => [40 + rng() * 1840, 60 + rng() * 820];
      words.forEach((_, k) => {
        const P = pts[k];
        for (let i = 0; i < P.length; i += 2) D.push({ k, tx: P[i], ty: P[i + 1], h: home(), r: rng(), big: k === NAME });
      });
      for (let i = 0; i < EXTRA; i++) D.push({ k: -1, tx: 0, ty: 0, h: home(), r: rng() });
      // Where each drone ends: drifting down inside the spotlight's beam.
      for (const d of D) {
        const y = 140 + 720 * Math.sqrt(rng());
        const f = y / 880, half = 60 + 380 * f;
        d.sx = 960 + (rng() * 2 - 1) * half * 0.9;
        d.sy = y;
      }
      return { D, cell };
    });

    // Camera: a wide pan following the formation. Effect: the dim swarm goes to soft bokeh while the
    // formed drones stay crisp, and moving drones leave short glow trails.
    const FX = C.GLSL_LUM + `vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec3 c = src(p).rgb, b = vec3(0.0), tr = vec3(0.0);
  vec2 r = vec2(7.0 / 1920.0, 7.0 / 1080.0) * uAmount;
  for (int i = 0; i < 12; i++) { float a = float(i) * 0.5236; b += src(p + vec2(cos(a), sin(a)) * r).rgb; }
  b /= 12.0;
  for (int i = 1; i < 6; i++) tr += src(p + vec2(0.0, float(i) * 4.0 / 1080.0) * uAmount * uP0.x).rgb;
  tr /= 5.0;
  vec3 soft = mix(c, max(b * 1.7, c * 0.5), uAmount);
  return vec4(mix(soft, c, smoothstep(0.3, 0.55, lum(c))) + max(tr - 0.25, 0.0) * 0.6 * uAmount, 1.0);
}`;
    const fxAt = (T) => ({
      amount: 1, p0: [Math.max(1 - OM.ease.outExpo(OM.prog(T, start + 0.03, start + 0.45)), OM.clamp(OM.prog(T, POUR, END - 0.25) * 3), C.decay(T, on[NAME], 0.2)), 0, 0, 0],
      // The name slams into formation: the camera punches in on its onset, the scene's biggest hit.
      cam: { zoom: 1.07 + 0.05 * C.decay(T, on[NAME], 0.08), x: 55 * Math.sin((T - start) * 0.7) },
    });
    let XS = new Float32Array(0), YS = XS;
    return OM.c3.withFx(el, c, start, END, FX, fxAt)({
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        const RG = OM.c3cut.ring;
        if (T < start + 0.05) return RG.paint(ctx, T, dpr);
        if (C.seam(ctx, T, dpr, start, END, 'spark', 'spot', start)) return;
        const { D, cell } = swarm();
        if (XS.length !== D.length) { XS = new Float32Array(D.length); YS = new Float32Array(D.length); }
        const burst = OM.ease.outExpo(OM.prog(T, start + 0.05, start + 0.47));
        const pour = OM.ease.inOutCubic(OM.prog(T, POUR, END - 0.25));
        const brk = OM.ease.outCubic(OM.prog(T, BREAK, BREAK + 0.4));
        const spotA = C.sm(T, POUR + 0.2, END - 0.1);
        const fade = C.sm(T, END - 0.6, END - 0.1);

        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        C.stars(ctx, T, 0.6 * C.sm(T, start + 0.05, start + 0.55) * (1 - spotA));
        // The spotlight comes up under the pour.
        if (spotA > 0) {
          ctx.globalAlpha = spotA;
          OM.handoff('spot', ctx, T, dpr);
          ctx.globalAlpha = 1;
        }
        const nameHit = C.decay(T, on[NAME], 0.16);
        if (T >= on[NAME]) C.pool(ctx, 960, 650, 900, ink.lit, (0.1 + 0.25 * nameHit) * (1 - pour));
        // Colour waves across the name: the downbeat sweeps crest left to right, the snares sweep back.
        const wave = (x) => {
          let v = 0;
          for (const [h, dir] of [[DOWN, 1], [SNARES[0], -1], [SNARES[1], 1]]) {
            const a = T - h;
            if (a < 0 || a > 0.4) continue;
            const front = dir > 0 ? 160 + a * 4000 : 1760 - a * 4000;
            const d = Math.abs(x - front);
            if (d < 140) v = Math.max(v, 1 - d / 140);
          }
          return v;
        };
        // The ring's core burns down as its lights fly out.
        if (burst < 1) {
          C.pool(ctx, SX, SY, 72, ink.lit, 0.4 * (1 - burst));
          ctx.globalAlpha = 1 - burst;
          ctx.fillStyle = ink.crest;
          OM.cell(ctx, HL, hc.col, hc.row, dpr);
          ctx.globalAlpha = 1;
        }
        for (let i = 0; i < D.length; i++) {
          const d = D[i];
          // The swarm: out of the spinning ring to its hover, bobbing.
          const bob = 6 * Math.sin(T * 1.7 + d.r * 40) * burst;
          const [rx0, ry0] = RG.at(i % RG.N, T);
          let x = OM.lerp(rx0, d.h[0], burst), y = OM.lerp(ry0, d.h[1], burst) + bob;
          let v = OM.lerp(0.8, 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(T * 3 + d.r * 60)), burst), sz = 3;
          if (d.k >= 0) {
            const t0 = on[d.k];
            const lead = Math.min(d.big ? 0.4 : 0.32, t0 - (start + 0.08)) * (0.85 + 0.15 * d.r);
            const a = C.arrive(T, t0, Math.max(0.05, lead));
            if (a > 0) {
              const lift = Math.sin(a * Math.PI) * (40 + 90 * d.r);
              x = OM.lerp(x, d.tx, a);
              y = OM.lerp(y, d.ty, a) - lift;
              v = OM.lerp(v, 0.82, a) + C.decay(T, t0, 0.12) * 1.2 + (d.big ? 0.6 * wave(d.tx) : 0);
              sz = d.big ? 8 : 6;
              if (T >= t0 && d.big) v += 0.2;
            }
          }
          // Breaking formation: scatter a little, then pour into the beam.
          if (brk > 0) {
            x += (d.r - 0.5) * 120 * brk * (1 - pour);
            y += (OM.hash(i, 3) - 0.5) * 80 * brk * (1 - pour);
            v *= 1 - 0.4 * brk;
          }
          if (pour > 0) {
            const p = OM.clamp(pour * 1.15 - d.r * 0.15);
            x = OM.lerp(x, d.sx, p);
            y = OM.lerp(y, d.sy + 20 * Math.sin(T * 2 + d.r * 9), p);
            sz = OM.lerp(sz, 3, p);
            v = OM.lerp(v, 0.3, p);
            // Beam pulse: each kick sends a bright band falling down the spotlight through the drones.
            for (const k of BEAM) {
              const a = T - k;
              if (a >= 0 && a < 0.45 && Math.abs(y - (140 + a * 1700)) < 55) v += 0.7 * (1 - a / 0.45) * p;
            }
          }
          XS[i] = x;
          YS[i] = y;
          const a = 1 - fade;
          if (a <= 0) continue;
          ctx.globalAlpha = a;
          if (burst < 0.5) {
            // Still a ring light: the ring's own 5x4 lamp.
            ctx.fillStyle = v > 1.1 ? ink.crest : ink.hover;
            ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 5, 4);
            continue;
          }
          if (v > 0.5) {
            ctx.fillStyle = C.rgba(ink.lit, 0.16);
            ctx.fillRect(Math.round(x - sz * 1.4), Math.round(y - sz * 1.4), Math.round(sz * 2.8), Math.round(sz * 2.8));
          }
          ctx.fillStyle = v > 1.1 ? ink.crest : v > 0.6 ? ink.hover : v > 0.35 ? ink.lit : v > 0.2 ? ink.mid : ink.dim;
          ctx.fillRect(Math.round(x - sz / 2), Math.round(y - sz / 2), Math.round(sz), Math.round(sz));
        }
        ctx.globalAlpha = 1;
        // Twinkle sparkles across the swarm: little four-point stars on drones.
        const spA = burst * (1 - fade);
        for (let j = 0; j < 16 && spA > 0.01; j++) {
          const ph = T * 5 + j * 0.37, slot = Math.floor(ph), life = ph - slot;
          const i = Math.floor(OM.hash(slot, j, 33) * D.length), x = XS[i], y = YS[i], s = 12 * (1 - life);
          ctx.fillStyle = C.rgba(ink.crest, spA * (1 - life));
          ctx.fillRect(Math.round(x - s), Math.round(y - 1), Math.round(2 * s), 2);
          ctx.fillRect(Math.round(x - 1), Math.round(y - s), 2, Math.round(2 * s));
        }
      },
      release: () => c.release(),
    });
  },
});
