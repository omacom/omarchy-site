// i-02 · Dawn behind the name. It opens on i-01's horizon: the console's slot,
// stretched bright across the frame, the cursor on it. Within the first beat
// light rises off it and the stars come out; the cursor glides out to stand
// after the last letter as a text cursor, rising as a bar on the 9.27
// downbeat. The wordmark (75% of the frame) is a crisp silhouette with a dark
// keyline and a rim on the sun side; the dawn builds behind it through the
// perc roll; on the 12.99 hit and the 13.52 downbeat the letters ignite and
// the sky steps back, so the name blazes alone, breathing on the snares and
// shimmering on the hats, until the riser swells everything.
// The dawn holds from 19.96, the frame i-03 opens on (OM.intro.dawn).
// Camera: a crane, low and close on the range by the kick, then lifting out
// and settling at rest for the cut. Shader: crepuscular rays, the lit cells
// smeared back along the line to the sun so shafts stream between the
// letters. Extras: the brightest stars glint out one by one as the sky
// fills, and one long flare runs along the horizon on the kick.

// Edit camera: the section's defaults fit. The crane is slow and nothing of the scene's own
// camera moves on the drums except one punch on the 12.99 hit (below), where the camera's
// jolt on that beat (the strongest of the intro so far) shakes it: the ignition is the big hit.
OM.edit.plan('i-02', {});

OM.scene({
  id: 'i-02',
  build(el, { start, duration }) {
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: `
vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec4 c = src(p);
  if (uAmount <= 0.0) return c;
  vec2 d = (p - uP0.xy) * uP0.z / 32.0;
  vec2 q = p;
  float w = 1.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 32; i++) {
    q -= d;
    acc += max(src(q).rgb - 0.28, 0.0) * w;
    w *= 0.94;
  }
  acc /= 14.0;
  return vec4(c.rgb + acc * uAmount * uP0.w * vec3(0.78, 1.0, 0.62), 1.0);
}` });
    const { LD: L, HY, ink, HR, R0, C0, C1, sunRow, DAWN0, KICK, dawn, FREEZE } = OM.intro;
    const END = start + duration;
    const horizonY = HY;
    // The ignition hit: one 3% zoom punch of the scene's own camera, the edit kit's punch shape (a 16 ms rise, then a
    // smooth settle to exactly 0 in 0.2 s) peaking on the hit's attack, KICK. Written out here rather than through
    // OM.edit.scene, whose kick list puts this hit 24 ms early (see OM.intro.KICK).
    const punch = (T) => {
      const d = T - KICK;
      if (d < -0.016 || d >= 0.2) return 0;
      if (d < 0) return 0.5 - 0.5 * Math.cos((Math.PI * (d + 0.016)) / 0.016);
      const u = d / 0.2;
      return (1 - u) ** 3 * (1 + 3 * u);
    };
    // The brightest stars, the same cells the dawn paints, each with its own moment to go out.
    const GLINTS = [];
    for (let row = R0; row < HR - 3; row++)
      for (let col = C0; col < C1; col++) {
        const inW = row >= 0 && row < OM.WORDMARK.h && col >= 0 && col < OM.WORDMARK.w && OM.WORDMARK.rows[row][col] === '1';
        if (!inW && OM.hash(col, row, 7) < 0.016 && OM.hash(col, row, 8) > 0.7)
          GLINTS.push({ x: L.x0 + (col + 0.5) * L.cw, y: L.y0 + (row + 0.5) * L.ch, at: 9.4 + 3.4 * OM.hash(col, row, 11) });
      }
    return {
      render(t, T) {
        const ctx = c.ensure();
        dawn(ctx, T, c.dpr);
        const Tc = Math.min(T, FREEZE);

        // Glints: a four-point star flares and dies where each bright star goes out.
        for (const g of GLINTS) {
          const age = Tc - g.at;
          if (age < 0 || age > 0.5) continue;
          const k = Math.sin((Math.PI * age) / 0.5), len = 8 + 20 * k;
          ctx.globalAlpha = 0.9 * k;
          ctx.fillStyle = ink.crest;
          ctx.fillRect(g.x - len, g.y - 1, 2 * len, 2);
          ctx.fillRect(g.x - 1, g.y - len, 2, 2 * len);
        }
        ctx.globalAlpha = 1;

        // The dawn flare: one long thin line of light along the horizon from the kick.
        const fa = T >= KICK ? Math.exp(-(Tc - KICK) / 1.6) * OM.smooth(OM.prog(Tc, KICK, KICK + 0.06)) * (1 - OM.smooth(OM.prog(Tc, 16, 18))) : 0;
        if (fa > 0.01) {
          const reach = 1100 * OM.ease.outCubic(OM.prog(Tc, KICK, KICK + 0.7));
          for (const [h, a] of [[18, 0.12], [6, 0.3], [2, 0.8]]) {
            const gr = ctx.createLinearGradient(960 - reach, 0, 960 + reach, 0);
            gr.addColorStop(0, 'rgba(218,236,198,0)');
            gr.addColorStop(0.5, `rgba(218,236,198,${a * fa})`);
            gr.addColorStop(1, 'rgba(218,236,198,0)');
            ctx.fillStyle = gr;
            ctx.fillRect(960 - reach, horizonY - h / 2, 2 * reach, h);
          }
        }

        // Camera: a crane, low and close on the range by the kick, lifting out and settling at rest by the hold.
        const down = OM.ease.inOutSine(OM.prog(T, start + 0.1, KICK));
        const up = OM.ease.inOutSine(OM.prog(T, KICK + 0.3, 19.6));
        const lift = down * (1 - up);
        const sunY = L.y0 + (sunRow(T) + 0.5) * L.ch;
        fx.apply(T, {
          // Rays ease back while the lit name holds the frame, and surge again on the riser.
          amount: OM.post.envelope(T, start, END, { ramp: 0.6, hold: 0.12 }) * OM.smooth(OM.prog(T, DAWN0, DAWN0 + 2.5))
            * (1 - 0.55 * OM.smooth(OM.prog(T, 13.6, 14.0)) * (1 - OM.smooth(OM.prog(T, 17.9, 19.3)))),
          cam: { zoom: (1 + 0.075 * lift) * (1 + 0.03 * punch(T)), y: -55 * lift },
          p0: [0.5, 1 - sunY / 1080, 0.55, 1.2 + 1.6 * (T >= KICK ? Math.exp(-(T - KICK) / 0.6) : 0)],
        });
      },
      release: () => {
        fx.release();
        c.release();
      },
    };
  },
});
