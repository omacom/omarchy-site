// p2-01 · Jukebox. The handoff's crest line is the jukebox's record rail. A
// jukebox arch rises around it, and on each word's onset an arm slams a record
// onto the rail: the word is the record's title strip. The key word's record
// is the biggest; on the downbeat every record starts to spin. Then the rail
// swallows them, one after another, and only the line is left for p2-02.
OM.ownWords.add('p2-01');
// Edit camera: the key word lands on the downbeat (150.562) with its slam, the tonearm and the spin,
// and the scene's own camera is a slow orbit with no drum hits, so that downbeat punches harder.
OM.edit.plan('p2-01', { down: 2 });
(() => {
  // Shared by the pre-chorus 2 scenes (p2-01 to p2-04).
  const FONT = "800 100px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['p2-type'] = document.fonts.load(FONT);
  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  const meter = document.createElement('canvas').getContext('2d');
  OM.p2 = {
    FONT,
    font: (s) => `800 ${s.toFixed(2)}px 'JetBrains Mono'`,
    ready: () => document.fonts.check(FONT),
    rgba,
    /** A line's words, upper-cased, measured at 100px: { text, space, t0, t1, w100 }. */
    words: (id) => {
      meter.font = FONT;
      return OM.sung(id).map((w) => {
        const text = (w.text || '').toUpperCase();
        return { ...w, text, w100: meter.measureText(text).width };
      });
    },
    /** The measured drum onset (OM.T.drums) of the `kind` hit within 40 ms of t, or t itself. */
    drum: (kind, t) => {
      const v = OM.edit.hits(kind, t - 0.04, t + 0.04).reduce((m, h) => (Math.abs(h[0] - t) < Math.abs(m - t) ? h[0] : m), Infinity);
      return Number.isFinite(v) ? v : t;
    },
    /** Cap height and advance per px of font size. */
    CAP: 0.73,
    /** A soft round pool of light. */
    pool: (ctx, x, y, r, color, a) => {
      if (a <= 0 || r <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(color, a));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    },
    /** Exact handoff on the first and last couple of frames; true when it painted. */
    cut: (ctx, T, dpr, start, end, a, b) => {
      const paint = (x) => (typeof x === 'function' ? x(ctx, T, dpr) : OM.handoff(x, ctx, T, dpr));
      if (T < start + 0.05) return paint(a), true;
      if (T >= end - 0.07) return paint(b), true;
      return false;
    },
    /** The city's empty lots: dim blocks by hash on the home lattice, off the avenue row. */
    lot: (col, row) => Math.abs(row - OM.cellAt(OM.HOME, 960, 540).row) >= 1 && OM.hash(col, row, 7) >= 0.74,
    block: (ctx, col, row) => {
      const L = OM.HOME;
      ctx.fillRect(L.x0 + col * L.cw + 1.5, L.y0 + row * L.ch + 1.5, L.cw - 3, L.ch - 3);
    },
    /**
     * The p2-02 > p2-03 cut, "plan to map": the plan's grid, its rail, and the
     * lots its walls spread into, which are the city's blocks.
     */
    planMap: (ctx, T, dpr) => {
      const L = OM.HOME, ink = OM.fieldInks('tokyo-night'), row0 = OM.cellAt(L, 960, 540).row;
      OM.handoff('grid', ctx, T, dpr);
      ctx.fillStyle = ink.dim;
      for (let row = L.rMin; row < L.rMin + L.rows; row++)
        for (let col = L.cMin; col < L.cMin + L.cols; col++) if (OM.p2.lot(col, row)) OM.p2.block(ctx, col, row);
      ctx.fillStyle = ink.crest;
      for (let col = L.cMin; col < L.cMin + L.cols; col++) OM.cell(ctx, L, col, row0, dpr);
    },
  };

  OM.scene({
    id: 'p2-01',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Neon jukebox glow: bright greens bloom, and sheen arcs sweep round the key record's grooves.
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec3 c = src(q).rgb;
  if (uAmount <= 0.0) return vec4(c, 1.0);
  vec2 px = 1.0 / uRes * (uRes.y / 1080.0);
  vec3 g = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236;
    for (int r = 1; r <= 3; r++) g += max(src(q + vec2(cos(a), sin(a)) * float(r) * 7.0 * px).rgb - 0.42, 0.0);
  }
  g /= 36.0;
  vec2 d = (q - uP0.xy) * vec2(uRes.x / uRes.y, 1.0);
  float r = length(d) / uP0.z, ang = atan(d.y, d.x);
  float band = pow(max(0.0, cos(2.0 * (ang + uP0.w))), 18.0);
  float ring = smoothstep(0.4, 0.48, r) * (1.0 - smoothstep(0.94, 1.0, r));
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
  vec3 sheen = vec3(0.62, 0.81, 0.42) * band * ring * (1.0 - smoothstep(0.25, 0.5, lum)) * 0.32 * uP1.x;
  return vec4(c + uAmount * (g * vec3(0.8, 1.0, 0.62) * 1.7 + sheen), 1.0);
}`,
      });
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const L = OM.HOME, P = OM.p2;
      const END = start + duration;
      const h = OM.cellAt(L, 960, 540);
      const YC = L.y0 + (h.row + 0.5) * L.ch; // the rail: the handoff line's centre
      const DB = OM.beatOnset(150.605), EXIT = 151.2;
      const ed = OM.edit.scene(start, END); // its clock surges the orbit through each beat

      let lay = null;
      const layout = () => {
        const ws = P.words('p2-01');
        const wg = ws.map((_, k) => (k === ws.length - 1 ? 1.22 : 1)); // the key word, a bigger record
        const GAP = 30;
        let s = 132, D = [];
        for (; s > 40; s -= 2) {
          D = ws.map((w, k) => Math.max(300 * wg[k], ((w.w100 * s * wg[k]) / 100 + 48) / 0.82));
          if (D.reduce((a, b) => a + b, 0) + GAP * (ws.length - 1) <= 1820 && Math.max(...D) <= 900) break;
        }
        const total = D.reduce((a, b) => a + b, 0) + GAP * (ws.length - 1);
        let x = 960 - total / 2;
        const recs = ws.map((w, k) => {
          const r = { ...w, D, R: D[k] / 2, x: x + D[k] / 2, s: s * wg[k], fall: Math.min(0.16, w.t0 - start - 0.05) };
          x += D[k] + GAP;
          return r;
        });
        return { ok: P.ready(), recs };
      };

      const arch = (ctx, a) => {
        if (a <= 0) return;
        ctx.globalAlpha = a;
        ctx.lineWidth = 2;
        for (const [inset, col] of [[0, th['border-strong']], [34, ink.dim]]) {
          ctx.strokeStyle = col;
          ctx.beginPath();
          ctx.moveTo(150 + inset, 1100);
          ctx.lineTo(150 + inset, 560);
          ctx.ellipse(960, 560, 810 - inset, 470 - inset, 0, Math.PI, 0);
          ctx.lineTo(1770 - inset, 1100);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };

      const record = (ctx, dpr, r, T) => {
        const age = T - r.t0;
        const fallP = OM.prog(T, r.t0 - r.fall, r.t0);
        const k = r.i;
        const out = OM.ease.inCubic(OM.prog(T, EXIT + k * 0.045, EXIT + k * 0.045 + 0.22));
        let cy = OM.lerp(-r.R - 30, YC, OM.ease.inCubic(fallP)) + out * (1080 - YC + r.R + 60);
        if (age < 0 && r.fall <= 0.001) return; // not yet
        if (T < r.t0 - r.fall) return;
        const hit = age >= 0 ? Math.exp(-age / 0.07) : 0;
        const R = r.R * (1 + 0.05 * hit);
        const cx = r.x;
        const spun = T > DB ? 7 * (T - DB) + 2 * Math.pow(T - DB, 2) : 0;

        // The arm: a rod from the top holds the record, lets go on the onset and retracts.
        if (age < 0.3) {
          const ret = OM.ease.outCubic(OM.prog(age, 0, 0.3));
          const tip = OM.lerp(cy - R - 6, -20, ret);
          ctx.fillStyle = th['border-strong'];
          ctx.fillRect(cx - 3, -20, 6, tip + 20);
          const open = OM.ease.outExpo(OM.prog(age, 0, 0.12)) * 26;
          ctx.fillStyle = ink.crest;
          ctx.fillRect(cx - 34 - open, tip - 6, 68 + 2 * open, 8);
          ctx.fillRect(cx - 34 - open, tip - 6, 8, 26);
          ctx.fillRect(cx + 26 + open, tip - 6, 8, 26);
        }

        // The disc, its grooves, and on the downbeat a sheen that spins.
        ctx.fillStyle = th.surface;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, 2 * Math.PI);
        ctx.fill();
        ctx.lineWidth = 1.5;
        for (let g = 0; g < 9; g++) {
          const rr = R * (0.44 + g * 0.065);
          ctx.strokeStyle = ink.dim;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, 2 * Math.PI);
          ctx.stroke();
          if (spun > 0) {
            const a0 = spun + g * 0.21;
            ctx.strokeStyle = g % 2 ? ink.mid : ink.lit;
            ctx.lineWidth = 2.5;
            for (const off of [0, Math.PI]) {
              ctx.beginPath();
              ctx.arc(cx, cy, rr, a0 + off, a0 + off + 0.45);
              ctx.stroke();
            }
            ctx.lineWidth = 1.5;
          }
        }
        const dbHit = T >= DB ? Math.exp(-(T - DB) / 0.12) : 0;
        ctx.lineWidth = 3;
        ctx.strokeStyle = hit > 0.3 || dbHit > 0.4 ? ink.crest : th['border-strong'];
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, 2 * Math.PI);
        ctx.stroke();

        // The title strip: the word.
        const font = P.font(r.s), cap = r.s * P.CAP, tw = (r.w100 * r.s) / 100;
        const sw = tw + 44, sh = cap * 1.9;
        ctx.fillStyle = ink.bg;
        ctx.fillRect(cx - sw / 2, cy - sh / 2, sw, sh);
        ctx.lineWidth = 2;
        ctx.strokeStyle = hit > 0.3 ? ink.crest : ink.lit;
        ctx.strokeRect(cx - sw / 2 + 1, cy - sh / 2 + 1, sw - 2, sh - 2);
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.fillStyle = age < 0 ? ink.hover : ink.crest;
        ctx.fillText(r.text, cx, cy + cap / 2);

        // The impact: a ring thrown off the rim and dust kicked along the rail.
        if (age >= 0 && age < 0.32) {
          const u = age / 0.32;
          ctx.globalAlpha = 1 - u;
          ctx.strokeStyle = ink.crest;
          ctx.lineWidth = 4 * (1 - u) + 1;
          ctx.beginPath();
          ctx.arc(cx, cy, R * (1 + 0.32 * OM.ease.outExpo(u)), 0, 2 * Math.PI);
          ctx.stroke();
          ctx.globalAlpha = 1;
          const c0 = OM.cellAt(L, cx - R * (1.1 + u), 0).col, c1 = OM.cellAt(L, cx + R * (1.1 + u), 0).col;
          const spread = Math.ceil(1 + 4 * OM.ease.outExpo(u));
          for (let col = c0; col <= c1; col++)
            for (let dr = 1; dr <= spread; dr++)
              for (const sg of [-1, 1]) {
                const row = h.row + sg * dr;
                if (OM.hash(col, row, k) < 0.5 * (1 - u) * (1 - dr / (spread + 1))) {
                  ctx.fillStyle = dr < 2 ? ink.crest : ink.hover;
                  OM.cell(ctx, L, col, row, dpr);
                }
              }
        }
        return { cx, cy, R };
      };

      return {
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (P.cut(ctx, T, dpr, start, END, 'line', 'line')) return void fx.apply(T, {});
          if (!lay || (!lay.ok && P.ready())) lay = layout();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);

          // The cabinet's arch, up around the rail, gone as the records go.
          arch(ctx, OM.ease.outCubic(OM.prog(T, start + 0.05, start + 0.32)) * (1 - OM.prog(T, EXIT + 0.1, END - 0.1)));

          // The key record glows on the downbeat and through its held note.
          const key = lay.recs[lay.recs.length - 1];
          if (key && T >= key.t0) {
            const gl = (0.2 + 0.3 * Math.exp(-Math.max(0, T - DB) / 0.25)) * (1 - OM.prog(T, EXIT, EXIT + 0.3));
            P.pool(ctx, key.x, YC, key.R * 1.6, ink.lit, gl);
          }

          // The rail: the handoff's line, always there.
          ctx.fillStyle = ink.crest;
          for (let col = L.cMin; col < L.cMin + L.cols; col++) OM.cell(ctx, L, col, h.row, dpr);

          lay.recs.forEach((r, i) => record(ctx, dpr, Object.assign(r, { i }), T));

          // Needle sparkles: a tonearm swings onto the key record on the downbeat and throws sparks.
          const spun = T > DB ? 7 * (T - DB) + 2 * Math.pow(T - DB, 2) : 0;
          const armIn = OM.ease.outBack(OM.prog(T, DB - 0.05, DB + 0.15)) * (1 - OM.ease.inCubic(OM.prog(T, EXIT - 0.1, EXIT + 0.05)));
          if (key && armIn > 0) {
            const na = -0.75, nx = key.x + Math.cos(na) * key.R * 0.78, ny = YC + Math.sin(na) * key.R * 0.78;
            const px = key.x + key.R * 1.05, py = YC - key.R * 1.02;
            ctx.globalAlpha = OM.clamp(armIn);
            ctx.strokeStyle = th['border-strong'];
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(OM.lerp(px, nx, armIn), OM.lerp(py, ny, armIn));
            ctx.stroke();
            ctx.fillStyle = ink.crest;
            ctx.fillRect(OM.lerp(px, nx, armIn) - 5, OM.lerp(py, ny, armIn) - 5, 10, 10);
            for (let i = 0; i < 40; i++) {
              const born = DB + i * 0.022, age = T - born;
              if (age < 0 || age > 0.45) continue;
              const a = OM.hash(i, 1, 9) * 6.283, v = 140 + 260 * OM.hash(i, 2, 9);
              const x = nx + Math.cos(a) * v * age, y = ny + Math.sin(a) * v * age + 300 * age * age;
              const s = (1 - age / 0.45) * 7;
              ctx.fillStyle = i % 3 ? ink.hover : ink.crest;
              ctx.fillRect(x - s / 2, y - 1, s, 2);
              ctx.fillRect(x - 1, y - s / 2, 2, s);
            }
            ctx.globalAlpha = 1;
          }

          // Camera: a slow orbit round the turntable; the glow eases in and out of the cuts.
          const env = OM.post.envelope(T, start, END, { ramp: 0.35 });
          const ph = (ed.clock(T) - start) * 2.2;
          fx.apply(T, {
            amount: env * (0.55 + 0.45 * (T > DB ? Math.exp(-(T - DB) / 0.5) : 0)),
            cam: { zoom: 1 + 0.05 * env, rot: 0.022 * env * Math.sin(ph), x: 20 * env * Math.cos(ph), y: 12 * env * Math.sin(ph) },
            p0: key ? [key.x / 1920, 1 - YC / 1080, key.R / 1080, spun] : [0, 0, 1, 0],
            p1: [T > DB ? 1 : 0.35, 0, 0, 0],
          });
        },
        release: () => { fx.release(); c.release(); },
      };
    },
  });
})();
