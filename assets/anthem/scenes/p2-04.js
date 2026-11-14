// p2-04 · Jet contrail climb. The city's spark from p2-03 is a wingtip's nav
// light: the frame banks into a climb and a jet's wing slides in behind it
// while lattice cloud rushes past in parallax. Each word bursts out of the
// wingtip on its onset and streams back as a contrail, twin vortex trails
// either side, so the line reads as the jet's own trail. The camera kicks up
// on every word, the light strobes on the kicks, and on the downbeat surge we
// whip up through the cloud tops: wing and trail fall away into the glow.
OM.ownWords.add('p2-04');
// Edit camera: the scene's own camera already shakes on every kick and on the key word's blast, so
// the off-beat kick punches (155.962, 157.080, 157.608) go lighter; the downbeat punch (156.936)
// stays full as the surge the climb whips up on, and the build into chorus 2 runs through.
OM.edit.plan('p2-04', { offbeat: 0.35 });
OM.scene({
  id: 'p2-04',
  build(el, { start, duration }) {
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    // Light scattering through the cloud layers: rays from the sun above the tops, through the gaps in the cloud.
    const fx = OM.post(el, c, {
      effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec3 c = src(q).rgb;
  if (uAmount <= 0.0) return vec4(c, 1.0);
  vec2 dir = uP0.xy - q;
  vec3 acc = vec3(0.0);
  float w = 1.0, j = hash(uv * uRes) * 0.5;
  for (int i = 0; i < 24; i++) {
    vec3 v = src(q + dir * (float(i) + j) / 24.0 * 0.42).rgb;
    acc += v * smoothstep(0.18, 0.5, dot(v, vec3(0.3, 0.59, 0.11))) * w;
    w *= 0.92;
  }
  acc /= 11.0;
  float b = exp(-length((q - uP0.xy) * vec2(1.78, 1.0)) * 2.2);
  return vec4(c + uAmount * (acc * vec3(0.72, 1.0, 0.55) * 0.9 + vec3(0.36, 0.5, 0.24) * b * 0.35 * uP0.z), 1.0);
}`,
    });
    const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
    const L = OM.HOME, P = OM.p2;
    const end = start + duration;
    const h = OM.cellAt(L, 960, 540);
    const SX = L.x0 + (h.col + 0.5) * L.cw, SY = L.y0 + (h.row + 0.5) * L.ch; // the spark
    const on = OM.words('p2-04');
    // The kicks, the downbeat, the snare and the sunbreak hits on their measured drum onsets.
    const KICKS = [155.945, 156.294, 156.804, 156.944, 157.083, 157.617].map((t) => P.drum('kick', t));
    const DB = OM.beatOnset(156.99), WHIP = 157.05, SETTLE = on[0] + 0.4;
    const BEAD = P.drum('snare', 157.29), SUN = [P.drum('kick', 157.62), P.drum('snare', 157.83)];
    const TIP = { x: 1400, y: 600 }, BANK = -0.15;

    // Cloud planes, far to near: depth, noise scale, coverage bias, inks (edge, core).
    const PLANES = [
      { z: 4.4, sx: 12, sy: 5, bias: 0.0, edge: ink.dim, core: ink.dim, seed: 17 },
      { z: 2.4, sx: 9, sy: 4, bias: 0.0, edge: ink.dim, core: ink.dim, seed: 29 },
      { z: 1.3, sx: 6, sy: 3, bias: 0.0, edge: ink.dim, core: ink.mid, seed: 53 },
    ];
    for (const pl of PLANES) {
      pl.cell = 64 / pl.z;
      pl.gap = pl.cell > 20 ? pl.cell * 0.08 : 0;
    }
    const Y = (T) =>
      260 * (T - start) +
      on.reduce((a, w, k) => a + (520 + 220 * k) * OM.ease.outExpo(OM.prog(T, w, w + 0.42)), 0) +
      6400 * OM.ease.inCubic(OM.prog(T, WHIP, end));
    const TOP = Y(157.5) - 300; // the cloud tops: we break through them on the whip

    let lay = null;
    const layout = () => {
      const ws = P.words('p2-04');
      const m = document.createElement('canvas').getContext('2d');
      m.font = P.FONT;
      const sp = m.measureText(' ').width;
      const total = ws.reduce((a, w) => a + w.w100 + (w.space ? sp : 0), 0);
      const s = Math.min(112, (1080 / Math.max(1, total)) * 100);
      let o = 0;
      const items = ws.map((w) => {
        const lead = w.space ? (sp * s) / 100 : 0;
        const it = { ...w, lead, o: o + lead, tw: (w.w100 * s) / 100 };
        o += lead + it.tw;
        return it;
      });
      return { ok: P.ready(), items, s, cap: s * P.CAP };
    };

    return {
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (P.cut(ctx, T, dpr, start, end, P.cityCut || 'spark', 'glow')) return void fx.apply(T, {});
        if (!lay || (!lay.ok && P.ready())) lay = layout();
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        // The city from p2-03 keeps falling away below us, under the cloud.
        if (P.city) P.city(ctx, dpr, T);

        // The frame banks into the climb as the spark becomes the wingtip.
        const set = OM.ease.inOutCubic(OM.prog(T, start + 0.05, SETTLE));
        const rot = BANK * set;
        const cr = Math.cos(rot), sr = Math.sin(rot);
        // Rotate about the frame's centre.
        ctx.setTransform(dpr * cr, dpr * sr, -dpr * sr, dpr * cr, dpr * (960 - cr * 960 + sr * 540), dpr * (540 - sr * 960 - cr * 540));
        const tip = { x: OM.lerp(SX, TIP.x, set), y: OM.lerp(SY, TIP.y, set) };
        const fall = 1100 * OM.ease.inCubic(OM.prog(T, WHIP + 0.1, end - 0.12)); // wing and trail drop away on the whip

        // Clouds rush down past us; above the tops, open sky.
        const y = Y(T);
        const sun = OM.pulse(SUN, T, 0.06); // sunbreak cells: cloud tops catch the light
        const cloudIn = OM.prog(T, start + 0.05, start + 0.35) * (1 - OM.prog(T, end - 0.3, end - 0.1));
        if (cloudIn > 0)
          for (const pl of PLANES) {
            const { cell, z, gap } = pl;
            const off = y / z;
            const sway = (60 * Math.sin(T * 0.9 + pl.seed)) / z;
            const row0 = Math.floor((-off - 240) / cell) - 1, col0 = Math.floor((-sway - 240) / cell) - 1;
            const rows = Math.ceil(1560 / cell) + 2, cols = Math.ceil(2400 / cell) + 2;
            const topY = (y - TOP) / z;
            for (let r = 0; r < rows; r++) {
              const R = row0 + r;
              const sy = R * cell + off;
              const clear = OM.clamp((sy - topY) / (140 / z)) * cloudIn;
              if (clear <= 0) continue;
              for (let q = 0; q < cols; q++) {
                const C = col0 + q;
                const n = 0.62 * OM.heroNoise(C / pl.sx + pl.seed * 7.1, R / pl.sy + pl.seed) + 0.38 * OM.heroNoise(C / (pl.sx * 0.45) - pl.seed, R / (pl.sy * 0.45) + T * 0.2);
                const lum = OM.clamp((n - 0.53 + pl.bias) / 0.3) * clear;
                const thr = OM.threshold(C + 4096, R + 4096);
                if (lum <= thr) continue;
                ctx.fillStyle = sun > 0.25 && lum - thr > 0.3 && OM.hash(C, R, pl.seed) < 0.35 * sun ? ink.lit : lum - thr > 0.38 ? pl.core : pl.edge;
                ctx.fillRect(Math.round((C * cell + sway + gap / 2) * dpr) / dpr, Math.round((sy + gap / 2) * dpr) / dpr, cell - gap, cell - gap);
              }
            }
          }

        // The contrail: the words stream back out of the wingtip, a ticker of the line.
        const it = lay.items;
        const E = it.reduce((a, w) => a + (w.lead + w.tw) * OM.ease.outExpo(OM.prog(T, w.t0, w.t0 + 0.2)), 0);
        const drift = T > on[0] ? 70 * (T - on[0]) : 0;
        const ox = tip.x - 46 - E - drift, base = tip.y + lay.cap / 2 + fall;
        const out = 1 - OM.prog(T, WHIP + 0.15, end - 0.2);
        if (E > 0 && out > 0) {
          ctx.globalAlpha = out;
          // Twin vortex trails, tight at the tip, spreading behind it.
          const cs = 10;
          for (let x = tip.x - 30; x > ox - 40; x -= cs) {
            const d = tip.x - x, xi = Math.floor((x - ox) / cs);
            const spread = lay.cap * 0.62 + 14 + d * 0.035;
            const dens = OM.clamp(1 - d / 1500) * 0.85;
            for (const sg of [-1, 1])
              for (let j = 0; j < 3; j++) {
                if (OM.hash(xi, j * sg, 5) > dens * (1 - j * 0.28)) continue;
                const bead = T >= BEAD && Math.abs(d - (T - BEAD) * 2600) < 60; // trail bead: a pulse runs out the vortex trails
                ctx.fillStyle = d < 120 || bead ? ink.crest : j ? ink.mid : ink.lit;
                ctx.fillRect(x, tip.y + fall + sg * (spread + j * cs) - cs / 2, cs - 2, cs - 2);
              }
          }
          ctx.save();
          ctx.beginPath();
          ctx.rect(-400, -400, tip.x - 40 + 400, 2000);
          ctx.clip();
          ctx.font = P.font(lay.s);
          ctx.textAlign = 'left';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 12;
          ctx.strokeStyle = ink.bg;
          for (const w of it) {
            if (T < w.t0) continue;
            ctx.strokeText(w.text, ox + w.o, base);
          }
          for (const w of it) {
            if (T < w.t0) continue;
            const age = T - w.t0;
            ctx.fillStyle = age < 0.18 ? ink.crest : OM.mix(ink.crest, ink.hover, OM.prog(age, 0.18, 0.6) * 0.6);
            ctx.fillText(w.text, ox + w.o, base);
          }
          ctx.restore();
          ctx.globalAlpha = 1;
        }

        // The wing, a clean silhouette behind its tip, with a lit leading edge.
        const wa = OM.prog(T, start + 0.05, start + 0.3);
        if (wa > 0) {
          const X = tip.x, Yt = tip.y + fall;
          ctx.globalAlpha = wa;
          ctx.fillStyle = th.surface;
          ctx.beginPath();
          ctx.moveTo(X + 6, Yt - 8);
          ctx.lineTo(X + 900, Yt + 150);
          ctx.lineTo(X + 900, Yt + 560);
          ctx.lineTo(X - 6, Yt + 22);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath(); // winglet
          ctx.moveTo(X + 6, Yt - 8);
          ctx.lineTo(X - 24, Yt - 104);
          ctx.lineTo(X, Yt - 108);
          ctx.lineTo(X + 34, Yt - 4);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = th['border-strong'];
          ctx.lineWidth = 2;
          for (const f of [0.35, 0.62]) {
            ctx.beginPath();
            ctx.moveTo(X + 20 + 880 * f * 0.2, Yt + 8 + 300 * f);
            ctx.lineTo(X + 900, Yt + 150 + 410 * f);
            ctx.stroke();
          }
          const flick = OM.pulse(KICKS.slice(2, 5), T, 0.05); // leading-edge flick on the kicks
          ctx.strokeStyle = flick > 0.2 ? OM.mix(ink.lit, ink.crest, flick) : ink.lit;
          ctx.lineWidth = 3 + 3 * flick;
          ctx.beginPath();
          ctx.moveTo(X - 24, Yt - 104);
          ctx.lineTo(X + 6, Yt - 8);
          ctx.lineTo(X + 900, Yt + 150);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // The nav light: the spark itself, strobing on the kicks.
        // Launch blast on the key word: an exhaust plume roars back from the engine under the wing,
        // and a round pressure wave rolls out through the cloud. Kept below the trail so the words read.
        const HIT = on[on.length - 1], bAge = T - HIT;
        if (bAge >= 0 && bAge < 0.9) {
          const ex = tip.x + 240, ey = tip.y + 128 + fall;
          const u = bAge / 0.9;
          for (const [rr, col, wd] of [[1, ink.hover, 9], [0.82, ink.lit, 4]]) {
            const r = rr * 2300 * OM.ease.outExpo(OM.prog(bAge, 0, 0.75));
            ctx.globalAlpha = (1 - u) * 0.85;
            ctx.strokeStyle = col;
            ctx.lineWidth = wd * (1 - u) + 1;
            ctx.beginPath();
            ctx.ellipse(ex, ey, r, r * 0.82, 0, 0, 2 * Math.PI);
            ctx.stroke();
          }
          for (let i = 0; i < 150; i++) {
            const age = bAge - i * 0.0018, life = 0.5 + 0.35 * OM.hash(i, 1, 8);
            if (age < 0 || age > life) continue;
            const a = 0.16 + (OM.hash(i, 2, 8) - 0.5) * 0.36, v0 = 1800 + 1700 * OM.hash(i, 3, 8);
            const d = (v0 * (1 - Math.exp(-4 * age))) / 4;
            const x = ex - 40 - Math.cos(a) * d, y = ey + Math.sin(a) * d + 40 * age * age;
            const q = age / life, sz = 6 + 24 * q;
            ctx.globalAlpha = 1 - q * q;
            ctx.fillStyle = q < 0.12 ? ink.crest : q < 0.3 ? ink.hover : q < 0.55 ? ink.lit : q < 0.8 ? ink.mid : ink.dim;
            ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
          }
          ctx.globalAlpha = 1;
        }

        const lightA = 1 - OM.prog(T, WHIP + 0.1, end - 0.3);
        if (lightA > 0) {
          const k = OM.pulse(KICKS, T, 0.06);
          P.pool(ctx, tip.x, tip.y + fall, 72 + 90 * k, ink.lit, (0.4 + 0.45 * k) * lightA);
          ctx.globalAlpha = lightA;
          ctx.fillStyle = ink.crest;
          ctx.fillRect(tip.x - L.cw / 2, tip.y + fall - L.ch / 2, L.cw, L.ch);
          ctx.globalAlpha = 1;
        }

        // Condensation: vapour streaks rushing past the lens as we climb through the cloud.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (cloudIn > 0) {
          ctx.strokeStyle = ink.hover;
          ctx.lineWidth = 2;
          for (let i = 0; i < 34; i++) {
            const rate = 1.4 + 1.6 * OM.hash(i, 1, 6) + 2 * OM.prog(T, WHIP, end);
            const p = (OM.hash(i, 2, 6) + (T - start) * rate) % 1;
            const x0 = OM.hash(i, 3, 6) * 2200 - 140, y0 = -120 + p * 1320;
            const len = 40 + 90 * OM.hash(i, 4, 6);
            ctx.globalAlpha = 0.28 * cloudIn * Math.sin(Math.PI * p);
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x0 - len * 0.32, y0 + len);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        // Through the tops into the light: the chorus's glow.
        const g = OM.ease.inOutSine(OM.prog(T, DB, end - 0.08));
        if (g > 0) P.pool(ctx, 960, 540, 620, ink.lit, 0.5 * g);

        // Camera: a steep climb with turbulence, bumped on the kicks, calm again at the glow.
        const env = OM.post.envelope(T, start, end, { ramp: 0.35 });
        const k = OM.pulse(KICKS, T, 0.07);
        const tb = env * (1 + 1.6 * k + 2.4 * OM.pulse([on[on.length - 1]], T, 0.09));
        fx.apply(T, {
          amount: env * (0.4 + 0.6 * OM.prog(T, DB - 0.2, WHIP + 0.4)),
          cam: {
            zoom: 1 + 0.08 * env,
            rot: tb * 0.006 * Math.sin(T * 29) - 0.01 * env,
            x: tb * (6 * Math.sin(T * 23) + 4 * Math.sin(T * 37 + 1)),
            y: tb * (5 * Math.sin(T * 31 + 2) + 3 * Math.sin(T * 17)) - 14 * env,
          },
          p0: [0.5, 1.15, OM.prog(T, DB, end), 0],
        });
      },
      release: () => { fx.release(); c.release(); },
    };
  },
});
