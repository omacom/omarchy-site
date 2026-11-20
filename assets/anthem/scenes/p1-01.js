// p1-01 · Crate digging. The stage spotlight from the cut falls on a record
// crate. Each sung word is a sleeve: on its onset that sleeve is yanked up
// out of the crate and slaps into a row above it, title out, so the line is
// pulled record by record. The key word is the lit sleeve, pulled on the
// downbeat with the spot flaring and its vinyl sliding out. Then the sleeves
// drop back into the crate and the spotlight closes down to a single point
// of light on the floor: the pen p1-02 starts with.
// Edit camera: the key sleeve is pulled on the downbeat (73.734), so that punch is
// raised to the scene's biggest; the scene's own camera only steps 10 px per pull,
// so nothing stacks, and the words stay 100+ px clear of the band at the peak.
OM.edit.plan('p1-01', { down: 2 });
OM.ownWords.add('p1-01');
(() => {
  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  /** handoff.js's elliptical pool of light. */
  const pool = (ctx, x, y, rx, ry, hex, a) => {
    if (a <= 0.002 || rx <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba(hex, a));
    g.addColorStop(1, rgba(hex, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx);
    ctx.restore();
  };
  const font = (w, px) => `${w} ${px}px 'JetBrains Mono'`;
  const PEN = { x: 960, y: 880, s: 16 };
  // Shared by the whole pre-chorus (scene files load in timeline order).
  OM.p1 = {
    rgba, pool, font,
    sm: (T, a, b) => OM.smooth(OM.prog(T, a, b)),
    decay: (T, t0, half) => (T < t0 ? 0 : Math.pow(0.5, (T - t0) / half)),
    PEN,
    /** The pen dot on the night: the p1-01 -> p1-02 seam, drawn by both scenes. */
    pen: (ctx, dpr, k = 1) => {
      const ink = OM.fieldInks('tokyo-night');
      pool(ctx, PEN.x, PEN.y, 64, 64, ink.lit, 0.45 * k);
      const s = PEN.s * k, snap = (v) => Math.round(v * dpr) / dpr;
      ctx.fillStyle = ink.crest;
      ctx.fillRect(snap(PEN.x - s / 2), snap(PEN.y - s / 2), snap(s), snap(s));
    },
    DISC: { x: 960, y: 560, r: 330 },
    /** Where the glint on the record's outer groove is at T (it becomes p1-02's pen). */
    glintAt: (T) => [960 + Math.cos(T * 3.7) * 297, 560 + Math.sin(T * 3.7) * 297],
    /** A record at (x, y), radius r: e=0 the dark vinyl from a sleeve, e=1 its grooves lit, with the glint. */
    discBody: (ctx, T, dpr, x, y, r, e, glint = true) => {
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      ctx.fillStyle = '#08080c';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = OM.mix(th['border-strong'], OM.mix(ink.bg, ink.lit, 0.5), e);
      ctx.lineWidth = 1.5;
      for (let f = 0.34; f < 0.99; f += 0.075) {
        ctx.beginPath();
        ctx.arc(x, y, r * f, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = OM.mix(ink.crest, ink.mid, e);
      ctx.beginPath();
      ctx.arc(x, y, r * OM.lerp(0.3, 0.17, e), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink.bg;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.02, 0, Math.PI * 2);
      ctx.fill();
      if (e > 0 && glint) {
        const gx = x + Math.cos(T * 3.7) * r * 0.9, gy = y + Math.sin(T * 3.7) * r * 0.9;
        pool(ctx, gx, gy, 64, 64, ink.lit, 0.45 * e);
        const sz = PEN.s * e, snap = (v) => Math.round(v * dpr) / dpr;
        ctx.fillStyle = ink.crest;
        ctx.fillRect(snap(gx - sz / 2), snap(gy - sz / 2), snap(sz), snap(sz));
      }
    },
    /** The p1-01 -> p1-02 seam: the key record, centred, its grooves lit and a glint riding the rim. */
    disc: (ctx, T, dpr) => {
      ctx.fillStyle = OM.fieldInks('tokyo-night').bg;
      ctx.fillRect(0, 0, 1920, 1080);
      const D = OM.p1.DISC;
      OM.p1.discBody(ctx, T, dpr, D.x, D.y, D.r, 1);
    },
    /** Widest font px (<= max) at which words idx fit in maxW, set as one run. */
    fit: (ctx, words, idx, weight, maxW, max, min = 40) => {
      let px = max;
      for (; px > min; px *= 0.97) {
        ctx.font = font(weight, px);
        let w = 0;
        idx.forEach((k, n) => (w += (n && words[k].space ? ctx.measureText(' ').width : 0) + ctx.measureText(words[k].text).width));
        if (w <= maxW) break;
      }
      return px;
    },
  };
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['p1-type'] = Promise.all([800, 700, 500].map((w) => document.fonts.load(font(w, 100))));

  OM.scene({
    id: 'p1-01',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const END = start + duration;
      const ink = OM.fieldInks('tokyo-night');
      const th = OM.theme('tokyo-night');
      const words = OM.sung('p1-01');
      const on = words.map((w) => w.t0);
      const K = words.length - 1;
      const { sm, decay } = OM.p1;
      const KICK = 73.607, DOWN = on[K];
      const DROP = 74.42, SINK = END - 0.083; // sleeves shrink and stream into the spot, arriving two frames before the cut
      const CLOSE = [74.5, SINK]; // the spot closes to the pen

      // Crate: front face 660..1260 x 770..950, sitting in the spot's floor pool.
      const CX0 = 640, CX1 = 1280, CY0 = 770, CY1 = 950;
      const SH = 300; // sleeve height
      const ROW_Y = 330; // row centre
      const layout = (ctx) => {
        const pad = 64, gap = 26;
        const big = 1.22; // the key sleeve is bigger
        let px = 120;
        for (; px > 70; px *= 0.97) {
          let tot = 0;
          words.forEach((w, k) => {
            const f = k === K ? px * big : px;
            ctx.font = font(800, f);
            tot += Math.max(k === K ? SH * big : SH, ctx.measureText(w.text).width + pad * 2) + gap;
          });
          if (tot - gap <= 1700) break;
        }
        const out = [];
        let tot = 0;
        words.forEach((w, k) => {
          const f = k === K ? px * big : px;
          ctx.font = font(800, f);
          const tw = ctx.measureText(w.text).width;
          const h = k === K ? SH * big : SH;
          out.push({ f, tw, w: Math.max(h, tw + pad * 2), h });
          tot += out[k].w + gap;
        });
        let x = 960 - (tot - gap) / 2;
        out.forEach((s) => ((s.x = x + s.w / 2), (x += s.w + gap)));
        return out;
      };

      /** One sleeve, centred at (x, y), face w x h. */
      const sleeve = (ctx, s, k, x, y, sc, glow, vinyl) => {
        const w = s.w * sc, h = s.h * sc, key = k === K;
        ctx.save();
        ctx.translate(x, y);
        // The record peeking out of the top: a dark disc with a lit label.
        const vr = h * 0.42, vy = -h / 2 + vr * 0.35 - vinyl * h * 0.42;
        const disc = [x + w * 0.18, y + vy, vr];
        if (key) return drawFace();
        ctx.fillStyle = '#08080c';
        ctx.beginPath();
        ctx.arc(w * 0.18, vy, vr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = th['border-strong'];
        ctx.lineWidth = 1.5;
        for (let r = 0.55; r < 1; r += 0.15) {
          ctx.beginPath();
          ctx.arc(w * 0.18, vy, vr * r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = key ? ink.crest : ink.mid;
        ctx.beginPath();
        ctx.arc(w * 0.18, vy, vr * 0.3, 0, Math.PI * 2);
        ctx.fill();
        return drawFace();
        function drawFace() {
        // The sleeve face.
        ctx.fillStyle = key ? OM.mix(ink.lit, ink.crest, glow) : OM.mix(th['surface-2'], th['border-strong'], glow * 0.6);
        ctx.fillRect(-w / 2, -h / 2, w, h);
        // Cover art: a dither of lattice cells across the top band.
        const cs = 14 * sc;
        ctx.fillStyle = key ? ink.mid : ink.dim;
        for (let j = 0; j < 7; j++)
          for (let i = 0; i * cs < w - cs; i++)
            if (OM.hash(i + k * 31, j, 7) < 0.62 - j * 0.08) ctx.fillRect(-w / 2 + cs * 0.5 + i * cs, -h / 2 + cs * 0.5 + j * cs, cs - 2, cs - 2);
        ctx.strokeStyle = key ? ink.crest : OM.mix(th['border-strong'], ink.crest, glow);
        ctx.lineWidth = 3;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        // Title: the sung word, big, low on the sleeve.
        if (words[k].text) {
          ctx.font = font(800, s.f * sc);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = key ? th['brand-ink'] : OM.mix(th.text, ink.crest, glow);
          ctx.fillText(words[k].text, 0, h / 2 - h * 0.14);
        }
        ctx.restore();
        return disc;
        }
      };
      // Groove sheen: a radial highlight sweeping round the key record's vinyl (dark grooves only, never the label or type).
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
  vec2 s = cam(uv);
  vec4 c = src(s);
  vec2 d = (s - uP0.xy) * vec2(uRes.x / uRes.y, 1.0);
  float r = length(d) / uP0.z;
  if (r < 1.0 && r > 0.33) {
    float a = atan(d.y, d.x);
    float band = pow(max(0.0, cos(a - uP0.w)), 18.0) + pow(max(0.0, cos(a - uP0.w - 3.14159)), 18.0);
    float groove = 0.55 + 0.45 * sin(r * 150.0);
    float lum = dot(c.rgb, vec3(0.3, 0.59, 0.11));
    float m = (1.0 - smoothstep(0.12, 0.3, lum)) * smoothstep(1.0, 0.92, r);
    c.rgb += vec3(0.733, 0.867, 0.592) * band * groove * m * uAmount * 0.6;
  }
  return c;
}`,
      });

      return {
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < Math.max(start + 0.045, on[0])) return fx.apply(T), OM.handoff('spot', ctx, T, dpr);
          if (T > END - 0.07) return fx.apply(T), OM.p1.disc(ctx, T, dpr);
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const S = layout(ctx);
          const cl = OM.ease.inOutCubic(OM.prog(T, CLOSE[0], CLOSE[1]));
          const flare = decay(T, DOWN, 0.18), kick = decay(T, KICK, 0.1);
          // The spotlight: handoff's cone and floor pool, flaring on the key pull, closing to the pen.
          const coneA = (1 + 1.2 * flare + 0.4 * kick) * (1 - cl);
          if (coneA > 0.003) {
            const g = ctx.createLinearGradient(0, 0, 0, 880);
            g.addColorStop(0, rgba(ink.lit, Math.min(0.4, 0.1 * coneA)));
            g.addColorStop(1, rgba(ink.lit, Math.min(0.2, 0.03 * coneA)));
            ctx.fillStyle = g;
            const k = 1 - cl;
            ctx.beginPath();
            ctx.moveTo(960 - 60 * k, 0);
            ctx.lineTo(960 + 60 * k, 0);
            ctx.lineTo(960 + 440 * k, 880);
            ctx.lineTo(960 - 440 * k, 880);
            ctx.closePath();
            ctx.fill();
          }
          pool(ctx, 960, 880, OM.lerp(440, 120, cl), OM.lerp(110, 40, cl), ink.lit, (0.42 + 0.25 * flare) * (1 - cl));

          const crateA = 1 - sm(T, DROP, DROP + 0.2);
          const rise = OM.ease.outExpo(OM.prog(T, on[0], on[0] + 0.12)); // the crate is pushed into the light on w0
          const cy = (1 - rise) * 260;
          if (crateA > 0.01) {
            ctx.save();
            ctx.globalAlpha = crateA;
            ctx.translate(0, cy);
            // The records still in the crate: tops riffling on the hi-hat fill.
            const step = Math.floor(T / (OM.SPB / 4));
            for (let i = 0; i < 9; i++) {
              const jig = T < 73.166 ? 10 * OM.hash(i, step, 3) : 0;
              const top = CY0 - 120 + i * 13 + jig - 18 * kick * (i % 2);
              ctx.fillStyle = [th['surface-2'], ink.dim, th['border-strong'], th.surface][i % 4];
              ctx.fillRect(CX0 + 30 + i * 3, top, CX1 - CX0 - 60 - i * 6, CY0 - top + 10);
              ctx.fillStyle = rgba(ink.hover, 0.5);
              ctx.fillRect(CX0 + 30 + i * 3, top, CX1 - CX0 - 60 - i * 6, 2);
            }
            ctx.restore();
          }
          // Dust turning in the beam.
          if (coneA > 0.003) {
            for (let i = 0; i < 46; i++) {
              const y = ((OM.hash(i, 2, 11) + T * (0.03 + 0.05 * OM.hash(i, 3, 11))) % 1) * 870;
              const half = (60 + (380 * y) / 880) * (1 - cl);
              const x = 960 + (OM.hash(i, 1, 11) * 2 - 1) * half * 0.92 + 14 * Math.sin(T * 1.3 + i);
              const a = (0.2 + 0.45 * OM.hash(i, Math.floor(T * 6), 12)) * Math.min(1, coneA) * (0.6 + flare);
              ctx.fillStyle = rgba(ink.hover, Math.min(0.9, a));
              const sz = 2 + 2 * OM.hash(i, 4, 11);
              ctx.fillRect(x, y, sz, sz);
            }
          }
          const D = OM.p1.DISC;
          // Each sleeve's pose: pulled into the row, then shrinking into the record's label.
          const poseOf = (k) => {
            const s = S[k];
            const up = OM.prog(T, on[k], on[k] + (k === K ? 0.16 : 0.13));
            const back = OM.ease.inOutCubic(OM.prog(T, DROP + (K - k) * 0.035, SINK));
            const p = OM.ease.outBack(up, 1.4);
            const x = OM.lerp(OM.lerp(960, s.x, OM.ease.outExpo(up)), D.x, back);
            const y = OM.lerp(OM.lerp(CY0 + 120, ROW_Y - 10 * kick, p), D.y, back);
            const sc = OM.lerp(OM.lerp(0.6, 1, OM.ease.outExpo(up)) * (k === K ? 1 + 0.08 * flare : 1), 0.03, back);
            // The key record, where it sits in its sleeve before the exit.
            const s0 = OM.lerp(0.6, 1, OM.ease.outExpo(up)) * (k === K ? 1 + 0.08 * flare : 1);
            const h0 = s.h * s0, vr = h0 * 0.42, vin = k === K ? 0.5 * OM.ease.outBack(OM.prog(T, DOWN + 0.05, DOWN + 0.3), 1.6) : 0;
            const x0 = OM.lerp(960, s.x, OM.ease.outExpo(up)), y0 = OM.lerp(CY0 + 120, ROW_Y - 10 * kick, p);
            return { s, x, y, sc, back, vin, rec: [x0 + s.w * s0 * 0.18, y0 - h0 / 2 + vr * 0.35 - vin * h0 * 0.42, vr] };
          };
          // The key record slides out, swings to centre and grows, its grooves lighting: the record p1-02 plays.
          let keyDisc = null;
          if (T >= on[K] && S[K]) {
            const P = poseOf(K), e = OM.ease.inOutCubic(OM.prog(T, DROP, SINK));
            keyDisc = [OM.lerp(P.rec[0], D.x, e), OM.lerp(P.rec[1], D.y, e), OM.lerp(P.rec[2], D.r, e)];
            OM.p1.discBody(ctx, T, dpr, keyDisc[0], keyDisc[1], keyDisc[2], e);
          }
          // Pulled sleeves: up out of the crate on the onset, into the row.
          for (let k = 0; k <= K; k++) {
            if (T < on[k] || !S[k]) continue;
            const P = poseOf(k);
            const glow = decay(T, on[k], 0.12) + (k === K ? 0 : 0.5 * flare) + P.back;
            ctx.globalAlpha = 1 - sm(P.back, 0.85, 1);
            sleeve(ctx, P.s, k, P.x, P.y, P.sc, Math.min(1, glow), P.vin);
            ctx.globalAlpha = 1;
          }
          // The crate front, over everything that is still inside it.
          if (crateA > 0.01) {
            ctx.save();
            ctx.globalAlpha = crateA;
            ctx.translate(0, cy);
            ctx.fillStyle = th.surface;
            ctx.fillRect(CX0, CY0, CX1 - CX0, CY1 - CY0);
            ctx.fillStyle = th['border-strong'];
            for (let r = 1; r < 3; r++) ctx.fillRect(CX0, CY0 + r * 60, CX1 - CX0, 3);
            ctx.fillStyle = OM.mix(ink.lit, ink.crest, flare);
            ctx.fillRect(CX0, CY0, CX1 - CX0, 4); // the rim, catching the spot
            ctx.fillStyle = '#08080c';
            ctx.fillRect(900, CY0 + 30, 120, 22); // hand hole
            ctx.restore();
          }
          // Camera: a flip-through pan stepping right on each pull, home again as the spot closes.
          const home = 1 - OM.ease.inOutCubic(OM.prog(T, 74.42, 74.76));
          let x = 0;
          for (const o of on) x -= 10 * OM.ease.outBack(OM.prog(T, o, o + 0.2), 1.8);
          x *= home;
          const zoom = 1 + 0.0011 * Math.abs(x) + 0.02 * sm(T, on[0], on[0] + 0.3) * home;
          const sheen = OM.post.envelope(T, start, END, { ramp: 0.3 }) * sm(T, DOWN + 0.05, DOWN + 0.2);
          const vd = keyDisc || [0, 0, 1];
          fx.apply(T, { amount: sheen, cam: T < on[0] || home === 0 ? null : { zoom, x }, p0: [vd[0] / 1920, 1 - vd[1] / 1080, vd[2] / 1080, T * 7] });
        },
        release: () => (fx.release(), c.release()),
      };
    },
  });
})();
