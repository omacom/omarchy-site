// v2-08 · Night drive into sunrise. The crest line from v2-07 is the horizon,
// and a lattice highway unfolds under it, rushing at the camera. The words are
// the road: overhead signs and painted lane markings, alternating, each lit by
// the headlights on its onset and then sweeping past overhead or under the car.
// Every word that passes rises again on the horizon as a skyline of lit letters
// in front of the coming sunrise, until the whole line stands there. Then the
// sun comes up, the skyline and the road sink into the horizon, and the frame
// is the crest line handoff into pre-chorus 2.

// Edit camera: the defaults fit. Nothing of the scene's own camera hits the drums but a 3 px lift on
// the kicks (now on the measured hits), the last word's sign lights on the strong snare that carries one
// of the two hardest backbeat jolts (147.898), and the skyline sits well inside the frame (the signs
// and the painted words leave it by design, overhead and under the car).
OM.edit.plan('v2-08', {});

OM.ownWords.add('v2-08');
OM.scene({
  id: 'v2-08',
  build(el, { start, duration }) {
    const V = OM.v2;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    // Sunrise lens flare: a halo and an anamorphic streak on the sun point at the horizon (uP0.y),
    // strength uP0.x; heat shimmer wobbling the road just below the horizon only.
    const FX = `vec4 effect(vec2 uv) {
      vec2 q = cam(uv);
      float hy = uP0.y, s = uP0.x * uAmount;
      float below = smoothstep(0.0, 0.01, hy - q.y) * smoothstep(0.12, 0.0, hy - q.y);
      q.x += (vnoise(vec2(q.y * 260.0, uTime * 7.0)) - 0.5) * 0.006 * below * uAmount;
      vec3 c = src(q).rgb;
      vec2 d = (uv - vec2(0.5, hy)) * vec2(uRes.x / uRes.y, 1.0);
      float halo = exp(-length(d) * 7.0) * 0.35;
      float streak = exp(-abs(d.y) * 160.0) * exp(-abs(d.x) * 1.6) * 0.5;
      return vec4(c + vec3(0.73, 0.87, 0.59) * (halo + streak) * s, 1.0);
    }`;
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: FX });
    const beat = OM.edit.scene(start, start + duration); // the slow roll runs on the beat clock
    const ink = V.ink(), th = V.th();
    const sung = OM.sung('v2-08');
    const N = sung.length;
    const on = sung.map((w) => w.t0);
    const END = start + duration;
    const H0 = OM.cellAt(OM.HOME, 960, 540);
    const YH = OM.HOME.y0 + (H0.row + 0.5) * OM.HOME.ch; // the horizon: the line row
    const FL = 900, CAMH = 1.3, VEL = 16, ROAD = 4.2;
    const Z_SIGN = 10, Z_MARK = 5.5, LZ = 4.5;
    const SET0 = END - 0.62, SET1 = END - 0.12; // the sun up, everything into the horizon
    // Every drum time on the measured hit (OM.T.drums).
    const PAUSEK = [148.84, 149.12, 149.37, 149.51].map((t) => V.drum('kick', t)), PAUSES = V.drum('snare', 148.91);
    const KICKS = [146.193, 146.704, 147.377, 148.19, 148.445, 148.84, 149.119, 149.374].map((t) => V.drum('kick', t));
    const X = (x, z) => 960 + (FL * x) / z;
    const Y = (y, z) => YH - (FL * (y - CAMH)) / z;
    const zOf = (k, T) => (k % 2 ? Z_MARK : Z_SIGN) - VEL * (T - on[k]);
    const passAt = (k) => on[k] + ((k % 2 ? Z_MARK : Z_SIGN) - 2.2) / VEL;
    let F = null, M = null;
    const plan = () => {
      M = V.met();
      const probe = V.layout(sung, { cap: 84, maxW: 1820, cx: 960, cy: 0, lead: 1.4 });
      const cy = YH - 18 - probe.capPx / 2 - ((probe.rows - 1) * probe.lh);
      F = V.layout(sung, { cap: 84, maxW: 1820, cx: 960, cy: cy + ((probe.rows - 1) * probe.lh) / 2, lead: 1.4 });
    };

    return {
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T < start + V.HOLD_IN || T >= END - V.HOLD_OUT) return fx.apply(T), OM.handoff('line', ctx, T, dpr);
        if (!F || !V.met().ok) plan();
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const unfold = OM.ease.outCubic(OM.prog(T, start + V.HOLD_IN, start + 0.3));
        const set = OM.ease.inOutCubic(OM.prog(T, SET0, SET1));
        const road = unfold * (1 - set);
        const dist = VEL * (T - start);
        const hit = OM.wordAt('v2-08', T).hit;
        const kick = OM.pulse(KICKS, T, 0.08);

        // The sunrise: a glow hugging the horizon, growing through the drive, flaring at the end.
        const dawn = OM.prog(T, start, END);
        const flare = Math.sin(Math.PI * set);
        V.pool(ctx, 960, YH, 500 + 700 * dawn + 300 * flare, 120 + 160 * dawn + 120 * flare, ink.lit, (0.18 + 0.32 * dawn + 0.3 * flare) * unfold * (1 - OM.clamp(set * 1.6 - 0.6)));
        V.pool(ctx, 960, YH, 180 + 160 * dawn, 50 + 60 * dawn, ink.hover, (0.2 + 0.4 * dawn) * unfold * (1 - set));

        // The ground: lattice cells on the plane, rushing in. Everything below the horizon unfolds from it.
        ctx.save();
        ctx.translate(0, YH);
        ctx.scale(1, Math.max(0.001, road));
        ctx.translate(0, -YH);
        ctx.globalAlpha = road;
        const STEP = 1.6;
        for (let i = 0; i < 34; i++) {
          const z = (i + 1) * STEP - (dist % STEP);
          if (z < 0.9) continue;
          const sz = Math.max(1, (FL * 0.12) / z);
          const near = OM.clamp(1 - z / 50);
          for (let xi = -16; xi <= 16; xi++) {
            const x = xi * 2.2 + (Math.abs(xi) < 2 ? 0 : 0);
            if (Math.abs(x) < ROAD + 0.5) continue;
            if (OM.hash(xi, i + Math.floor(dist / STEP), 81) > 0.45) continue;
            ctx.fillStyle = V.rgba(ink.dim, 0.9 * near);
            ctx.fillRect(X(x, z) - sz / 2, Y(0, z) - sz / 4, sz, sz / 2);
          }
        }
        // Road edges in crest cells, centre dashes in lit, pulsing on each word.
        for (let i = 0; i < 60; i++) {
          const z = (i + 1) * 0.8 - (dist % 0.8);
          if (z < 0.6) continue;
          const sz = Math.max(1.2, (FL * 0.16) / z);
          ctx.fillStyle = V.rgba(ink.crest, OM.clamp(1.2 - z / 48));
          for (const x of [-ROAD, ROAD]) ctx.fillRect(X(x, z) - sz / 2, Y(0, z) - sz / 4, sz, sz / 2);
        }
        for (let i = 0; i < 22; i++) {
          const z0 = i * 4 - (dist % 4) + 0.6;
          if (z0 + 2 < 0.6) continue;
          const a = Math.max(z0, 0.6), b = z0 + 2;
          const wA = (FL * 0.12) / a, wB = (FL * 0.12) / b;
          ctx.fillStyle = OM.mix(ink.mid, ink.crest, OM.clamp(hit + kick * 0.5 + (T >= PAUSES ? Math.exp(-(T - PAUSES) / 0.1) : 0))); // sprinkle: lane flash on the snare
          ctx.beginPath();
          ctx.moveTo(960 - wA, Y(0, a));
          ctx.lineTo(960 + wA, Y(0, a));
          ctx.lineTo(960 + wB, Y(0, b));
          ctx.lineTo(960 - wB, Y(0, b));
          ctx.closePath();
          ctx.fill();
        }
        // Painted words: lying on the road, lit by the headlights on their onset.
        for (let k = 1; k < N; k += 2) {
          const zn = zOf(k, T), zf = zn + LZ;
          if (zn < 0.7 || zf > 60 || T < on[k] - 0.6) continue;
          const lit = T >= on[k] ? 1 : 0.18;
          const zm = Math.max(0.7, zn + LZ * 0.4);
          const text = sung[k].text, n = Math.max(1, text.length);
          const wW = Math.min(2 * ROAD - 0.6, 1.0 * n);
          ctx.save();
          ctx.translate(960, Y(0, zf));
          ctx.scale((FL * wW) / zm / (n * M.adv * 100), (Y(0, zn) - Y(0, zf)) / (M.cap * 100));
          ctx.font = V.fontOf(100);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = OM.mix(ink.mid, OM.mix(ink.crest, th.text, OM.clamp((T - on[k]) / 0.4)), lit);
          ctx.fillText(text, 0, M.cap * 100);
          ctx.restore();
          if (T >= on[k] && T - on[k] < 0.2) V.pool(ctx, 960, Y(0, zm), FL * wW / zm, 40, ink.crest, 0.5 * (1 - (T - on[k]) / 0.2));
        }
        ctx.restore();
        ctx.globalAlpha = 1;

        // The horizon itself: the crest row, always there.
        ctx.fillStyle = ink.crest;
        for (let col = OM.HOME.cMin; col < OM.HOME.cMin + OM.HOME.cols; col++) OM.cell(ctx, OM.HOME, col, H0.row, dpr);

        // Sprinkle, horizon pulse: each pause kick sends a pair of lit swells running out along the horizon.
        for (const h of PAUSEK) {
          const age = T - h;
          if (age < 0 || age > 0.36) continue;
          const reach = 80 + age * 2600, g = 1 - age / 0.36;
          ctx.fillStyle = V.rgba(ink.lit, g);
          for (let col = OM.HOME.cMin; col < OM.HOME.cMin + OM.HOME.cols; col++) {
            const x = OM.HOME.x0 + (col + 0.5) * OM.HOME.cw;
            if (Math.abs(Math.abs(x - 960) - reach) < 70) OM.cell(ctx, OM.HOME, col, H0.row + 1, dpr);
          }
        }

        // Overhead signs: dark until the headlights catch them on their onset, then sweeping overhead.
        for (let k = N - (N % 2 ? 1 : 2); k >= 0; k -= 2) {
          const z = zOf(k, T);
          if (z < 2.2 || z > 70 || road <= 0.02) continue;
          const text = sung[k].text, n = Math.max(1, text.length);
          const cap = 1.45, tw = (n * M.adv * cap) / M.cap;
          const pw = tw + 1.4, y0 = 3.7, y1 = 6.2;
          const sxA = X(-pw / 2, z), sxB = X(pw / 2, z), syA = Y(y1, z), syB = Y(y0, z);
          const lit = T >= on[k];
          const age = T - on[k];
          const fade = OM.clamp((70 - z) / 25) * OM.clamp((z - 2.2) / 1.2) * road;
          ctx.globalAlpha = fade;
          // Posts.
          ctx.fillStyle = th['border-subtle'];
          const pwid = Math.max(1, (FL * 0.05) / z);
          for (const px of [-pw / 2 - 0.3, pw / 2 + 0.3]) ctx.fillRect(X(px, z) - pwid / 2, Y(y0 + 0.6, z), pwid, Y(0, z) - Y(y0 + 0.6, z));
          ctx.fillRect(X(-pw / 2 - 0.3, z), Y(y0 + 0.9, z) - pwid / 2, X(pw / 2 + 0.3, z) - X(-pw / 2 - 0.3, z), pwid);
          // Panel.
          ctx.fillStyle = lit ? OM.mix(ink.crest, ink.lit, OM.clamp(age / 0.25)) : th['border-strong'];
          ctx.fillRect(sxA - 3, syA - 3, sxB - sxA + 6, syB - syA + 6);
          ctx.fillStyle = lit ? th.bg : th.surface;
          ctx.fillRect(sxA, syA, sxB - sxA, syB - syA);
          if (lit) {
            const size = (FL * cap) / z / M.cap;
            ctx.font = V.fontOf(size);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = OM.mix(ink.crest, th.text, OM.clamp(age / 0.4));
            ctx.fillText(text, X(0, z), (syA + syB) / 2 + (size * M.cap) / 2);
            if (age < 0.2) V.pool(ctx, X(0, z), (syA + syB) / 2, (sxB - sxA) * 0.7, (syB - syA), ink.crest, 0.5 * (1 - age / 0.2));
          }
          ctx.globalAlpha = 1;
        }
        // The skyline: each passed word rises on the horizon; at sunrise they sink back into it.
        ctx.font = F.font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        sung.forEach((w, k) => {
          const age = T - passAt(k);
          if (age < 0) return;
          const a = F.at[k];
          const up = OM.ease.outBack(OM.clamp(age / 0.22), 1.6) * (1 - set);
          if (up <= 0.01) return;
          const baseY = YH - OM.HOME.ch / 2 - 4;
          ctx.save();
          ctx.translate(a.x, baseY);
          ctx.scale(1, up);
          ctx.fillStyle = OM.mix(ink.crest, th.text, OM.clamp(age / 0.5));
          ctx.fillText(w.text, 0, a.base - baseY);
          ctx.restore();
        });

        // Light streaks rushing past along both shoulders.
        for (let i = 0; i < 10; i++) {
          const z0 = ((i * 3.7 - dist * 1.6) % 37 + 37) % 37 + 1.2, z1 = z0 + 2.2;
          for (const sx of [-1, 1]) {
            const xw = sx * (ROAD + 1.6 + OM.hash(i, sx, 88) * 2);
            ctx.strokeStyle = V.rgba(i % 2 ? ink.hover : ink.lit, OM.clamp(1 - z0 / 30) * road * 0.8);
            ctx.lineWidth = Math.max(1, 30 / z0);
            ctx.beginPath();
            ctx.moveTo(X(xw, z0), Y(1.2, z0));
            ctx.lineTo(X(xw, z1), Y(1.2, z1));
            ctx.stroke();
          }
        }
        const ce = V.camEnv(T, start, END);
        fx.apply(T, {
          amount: V.env(T, start, END),
          cam: { zoom: 1 + ce * 0.03, rot: ce * 0.014 * Math.sin((beat.clock(T) - start) * 0.9), y: ce * (2 * Math.sin(T * 53) + 1.4 * Math.sin(T * 77) + 3 * kick) },
          p0: [0.4 + 0.6 * dawn + 0.8 * flare, 1 - YH / 1080, 0, 0],
        });
      },
      release: () => { fx.release(); c.release(); },
    };
  },
});
