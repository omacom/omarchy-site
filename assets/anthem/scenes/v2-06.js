// v2-06 · The wingman. The spark from v2-05 is the agent, a small light. A
// paper plane swoops in behind it and the two fly in formation through the
// night, the stars streaming past, carrying the line strung between them: on
// each onset the light darts ahead and the next word ignites in its wake, the
// plane holding the other end. When the line has been read the plane puts its
// nose down the centre row and dashes through, gathering the words into its
// trail, the light shooting ahead, and the trail is the line handoff for v2-07.

// Edit camera: on the fourth word (138.873, beat 3) the light darts down to the second row and the
// formation slides back, carrying the end of the first row to within 54 px of the right edge, so the
// camera's beat-3 punch and the off-beat kick after it (138.854, 138.962) are skipped: the dart is the
// hit there. The rest keeps the defaults, the downbeat kick at 137.788 (the verse's strongest) on top.
OM.edit.plan('v2-06', { skip: [138.854, 138.962] });

OM.ownWords.add('v2-06');
OM.scene({
  id: 'v2-06',
  build(el, { start, duration }) {
    const V = OM.v2;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    // Wind: a radial blur pulling toward the frame centre that leaves the centre (the words) crisp,
    // and speed lines streaking across the outer rows.
    const FX = `vec4 effect(vec2 uv) {
      vec2 q = cam(uv);
      vec4 base = src(q);
      vec2 d = q - vec2(0.5);
      float edge = smoothstep(0.16, 0.42, abs(d.y));
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 8; i++) acc += src(q - d * float(i) * 0.005 * uAmount * edge).rgb;
      acc /= 8.0;
      float row = floor(q.y * uRes.y / 4.0);
      float h = hash(vec2(row, 11.0));
      float sl = step(0.965, h) * step(fract(q.x * 0.8 + uTime * (1.6 + 2.0 * h) + h * 7.0), 0.16) * smoothstep(0.14, 0.3, abs(q.y - 0.5));
      return vec4(mix(base.rgb, acc + vec3(0.73, 0.87, 0.59) * sl * 0.35, uAmount), 1.0);
    }`;
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: FX });
    const beat = OM.edit.scene(start, start + duration); // the chase cam's roll and lift run on the beat clock
    const ink = V.ink(), th = V.th();
    const sung = OM.sung('v2-06');
    const N = sung.length;
    const on = sung.map((w) => w.t0);
    const END = start + duration;
    const H0 = OM.cellAt(OM.HOME, 960, 540);
    const ROWY = OM.HOME.y0 + (H0.row + 0.5) * OM.HOME.ch;
    const SPX = OM.HOME.x0 + (H0.col + 0.5) * OM.HOME.cw;
    const PLEN = 210, PGAP = 70;
    const srng = OM.rng(2606);
    const STARS = [0, 1, 2].map(() => Array.from({ length: 46 }, () => [srng(), srng()]));
    const D0 = END - 0.31, D1 = END - V.HOLD_OUT; // the dash
    let F = null, G = null;
    const plan = () => {
      F = V.layout(sung, { cap: 112, maxW: 1480, cx: 0, cy: ROWY, lead: 1.45 });
      const minX = Math.min(...F.at.map((a) => a.x)), maxX = Math.max(...F.at.map((a) => a.x + a.w));
      const plane = minX - PGAP; // the plane's nose, in formation space
      G = { minX, maxX, plane, cam0: F.at[0].x - (SPX - 960), camF: (plane - PLEN + maxX + 40) / 2 };
    };
    /** Formation-space to screen x. */
    const camAt = (T) => OM.lerp(G.cam0, G.camF, OM.ease.inOutCubic(OM.prog(T, start + V.HOLD_IN, on[N - 1] + 0.25)));
    /** The light: hovering at the end of the last lit word, darting across each new one on its onset. */
    const light = (T) => {
      let x = G.cam0 + (SPX - 960), y = ROWY;
      for (let k = 0; k < N; k++) {
        if (T < on[k]) break;
        const a = F.at[k];
        const e = OM.ease.outExpo(OM.prog(T, on[k], on[k] + 0.14));
        const fromX = k ? F.at[k - 1].x + F.at[k - 1].w + 26 : x, fromY = k ? F.at[k - 1].cy : y;
        x = OM.lerp(fromX, a.x + a.w + 26, e);
        y = OM.lerp(fromY, a.cy, e);
      }
      return { x, y };
    };

    const paperPlane = (ctx, x, y, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = th['text-secondary'];
      ctx.beginPath(); // the keel fold, underneath
      ctx.moveTo(0, 0); ctx.lineTo(-PLEN * 0.8, 2); ctx.lineTo(-PLEN * 0.96, 46); ctx.lineTo(-PLEN * 0.62, 12); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = th.text;
      ctx.beginPath(); // the near wing
      ctx.moveTo(0, 0); ctx.lineTo(-PLEN, -70); ctx.lineTo(-PLEN * 0.86, -8); ctx.lineTo(-PLEN * 0.8, 2); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = ink.crest;
      ctx.beginPath(); // the crease catching light
      ctx.moveTo(0, 0); ctx.lineTo(-PLEN * 0.9, -20); ctx.lineTo(-PLEN * 0.86, -8); ctx.lineTo(-PLEN * 0.8, 2); ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    return {
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T < start + V.HOLD_IN) return fx.apply(T), OM.v2plane.cut(ctx, T, dpr); // match cut: v2-05's line folded into this plane
        if (T >= D1) return fx.apply(T), OM.handoff('line', ctx, T, dpr);
        if (!F || !V.met().ok) plan();
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const d = T - start;
        const cam = Math.max(camAt(T), light(T).x - 740); // the light never leaves the frame
        const sx = (fx) => fx - cam + 960;
        const dash = OM.ease.inCubic(OM.prog(T, D0, D1));
        const fadeIn = OM.ease.outCubic(OM.prog(T, start + V.HOLD_IN, start + 0.35));

        // Stars streaming past: three depths of lattice cells.
        for (let layer = 0; layer < 3; layer++) {
          const sp = [260, 520, 980][layer], sz = [2, 3, 4][layer];
          const a = [0.35, 0.55, 0.8][layer] * fadeIn * (1 - dash * 0.6);
          ctx.fillStyle = V.rgba(layer === 2 ? ink.mid : ink.dim, a);
          for (let i = 0; i < 46; i++) {
            const [hx, hy] = STARS[layer][i];
            const x = (((hx * 2200 - d * sp - (cam - G.cam0) * (0.2 + layer * 0.3)) % 2200) + 2200) % 2200 - 140;
            ctx.fillRect(x, hy * 1080, sz * (layer === 2 ? 6 : 1), sz);
          }
        }

        // The plane: swooping in from below left, then holding the line's left end.
        // From where it was folded (beside the spark) it glides down into the formation.
        const P0 = OM.v2plane.P0;
        const inE = OM.ease.inOutCubic(OM.prog(T, start + V.HOLD_IN, start + 0.6));
        const bob = (1 - dash) * Math.min(1, inE);
        let px = OM.lerp(P0.x, sx(G.plane), inE), py = OM.lerp(P0.y, ROWY, inE) + 9 * Math.sin(d * 3.1) * bob;
        let prot = OM.lerp(P0.rot, 0, inE) + 0.04 * Math.cos(d * 3.1) * bob;
        const dashX = OM.lerp(px, 1920 + PLEN + 40, dash);
        if (dash > 0) { px = dashX; py = OM.lerp(py, ROWY, OM.clamp(dash * 4)); prot *= 1 - OM.clamp(dash * 4); }

        // Its light trail: soft behind it in flight; on the dash, the crest row itself.
        const tail = px - PLEN * 0.85;
        if (dash > 0) {
          ctx.fillStyle = ink.crest;
          const cTail = Math.floor((tail - OM.HOME.x0) / OM.HOME.cw);
          for (let col = OM.HOME.cMin; col < Math.min(cTail, OM.HOME.cMin + OM.HOME.cols); col++) OM.cell(ctx, OM.HOME, col, H0.row, dpr);
        }
        const tg = ctx.createLinearGradient(tail - 640, 0, tail, 0);
        tg.addColorStop(0, V.rgba(ink.lit, 0));
        tg.addColorStop(1, V.rgba(ink.crest, 0.75 * fadeIn));
        ctx.fillStyle = tg;
        ctx.fillRect(tail - 640, py - 3, 640, 6);

        // The words, strung between plane and light: each letter ignites as the light passes it.
        const L = light(T);
        const lx = dash > 0 ? OM.lerp(sx(L.x), 2300, dash) : sx(L.x), ly = L.y + 6 * Math.sin(d * 4.3);
        ctx.font = F.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        sung.forEach((w, k) => {
          if (T < w.t0) return;
          const a = F.at[k];
          [...w.text].forEach((ch, j) => {
            const fx = a.x + (j + 0.5) * F.A;
            // Lit as the light's dash (outExpo over 0.14 s) covers its share of the word: the first letter
            // on the onset, the whole word within about two frames.
            const lit = on[k] + (0.14 * -Math.log2(1 - j / w.text.length)) / 10;
            if (T < lit) return;
            const x = sx(fx);
            if (dash > 0 && x < px) return; // gathered into the trail
            const age = T - lit;
            const y = a.cy + 6 * Math.sin(d * 4 - fx * 0.012);
            const s = 1 + 0.35 * Math.exp(-age / 0.07);
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(s, s);
            ctx.fillStyle = OM.mix(ink.crest, th.text, OM.clamp(age / 0.35));
            ctx.fillText(ch, 0, F.capPx / 2);
            ctx.restore();
          });
        });
        // The tow lines: plane to the first word, last lit word to the light.
        if (T >= on[0] && dash === 0) {
          ctx.strokeStyle = V.rgba(ink.lit, 0.45);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - PLEN * 0.2, py - 6);
          ctx.lineTo(sx(G.minX) - 12, F.at[0].cy + F.capPx * 0.55);
          const k = OM.hitCount(on, T) - 1, a = F.at[k];
          ctx.moveTo(sx(a.x + a.w) + 6, a.cy + F.capPx * 0.55);
          ctx.lineTo(lx, ly);
          ctx.stroke();
        }
        OM.v2plane.draw(ctx, px, py, prot);
        // The agent: a crest cell in its halo, a short sparkle wake.
        const hit = OM.wordAt('v2-06', T).hit;
        V.pool(ctx, lx, ly, 72 + 40 * hit, 72 + 40 * hit, ink.lit, 0.4 + 0.3 * hit);
        ctx.fillStyle = ink.crest;
        ctx.fillRect(lx - OM.HOME.cw / 2, ly - OM.HOME.ch / 2, OM.HOME.cw, OM.HOME.ch);
        // Cloud wisps sliding past, and sparkles shed off the wingtip.
        for (let i = 0; i < 4; i++) {
          const hx = OM.hash(i, 6, 71), hy = OM.hash(i, 6, 72);
          const x = ((hx * 3200 - d * (900 + 500 * hy)) % 3200 + 3200) % 3200 - 600;
          const y = hy < 0.5 ? 120 + hy * 300 : 760 + (hy - 0.5) * 400;
          V.pool(ctx, x, y, 420, 70, th['border-strong'], 0.18 * fadeIn * (1 - dash));
        }
        for (let i = 0; i < 12; i++) {
          const age = ((d * 14 + i * 0.37) % 1) * 0.6;
          const x = px - PLEN * 0.95 - age * 420, y = py - 66 + age * 40 + 8 * Math.sin(i * 2.1 + d * 9);
          ctx.fillStyle = V.rgba(ink.crest, (1 - age / 0.6) * fadeIn * (1 - dash));
          ctx.fillRect(x - 2, y - 2, 4, 4);
        }
        const ce = V.camEnv(T, start, END), C = beat.clock(T) - start;
        fx.apply(T, {
          amount: V.env(T, start, END) * 0.85,
          cam: { zoom: 1 + ce * 0.055, rot: ce * 0.028 * Math.sin(C * 1.4), y: ce * 12 * Math.sin(C * 2.2) },
        });
      },
      release: () => { fx.release(); c.release(); },
    };
  },
});
