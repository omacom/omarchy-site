// c1-03 · The name, set in letterpress. The line's first two words are real
// type, JetBrains Mono sorts locked up above the name: the first bites into the
// paper on its onset, the second comes down out of the camera, its shadow
// sharpening on the field. Then the name itself, the wordmark, is pressed
// syllable by syllable across its held note: O, MAR, and CHY on the kick into
// the downbeat, the biggest press, which kisses the whole name again and dents
// the whole sheet. Around every block the paper dents and refills in the
// field's dither order, and the fresh ink cools from crest into its band inks.
// On the snare where the chorus lifts, the small type is distributed: sort by
// sort it pops back off the paper, leaving only the name, at home.
OM.ownWords.add('c1-03');
// Edit camera: the big press on the 90.856 kick is the scene's own punch (with its overshoot),
// so the camera's downbeat there is skipped; every other beat keeps the defaults.
OM.edit.plan('c1-03', { skip: [90.86] });
(() => {
  const FONT = "800 100px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['c1-03-type'] = document.fonts.load(FONT);

  OM.scene({
    id: 'c1-03',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Ink bleed under the presses: fresh ink feathers out into the paper (never into the letters).
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 b = src(q);
  if (uAmount <= 0.0) return b;
  float css = uRes.y / 1080.0;
  vec2 px = css / uRes;
  vec2 sp = q * uRes / css;
  float n = vnoise(sp * 0.09);
  float r = (2.5 + 5.5 * n) * (0.4 + 0.6 * uP0.x);
  float h = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = 0.7854 * float(i) + 2.0 * n;
    vec4 s = src(q + vec2(cos(a), sin(a)) * r * px);
    h = max(h, smoothstep(0.32, 0.62, s.g) * step(s.b + 0.05, s.g));
  }
  float l = dot(b.rgb, vec3(0.3, 0.59, 0.11));
  float paper = 1.0 - smoothstep(0.2, 0.4, l);
  vec3 c = mix(b.rgb, mix(vec3(0.224, 0.282, 0.180), vec3(0.404, 0.522, 0.286), n), h * paper * 0.75 * uAmount);
  return vec4(c, 1.0);
}`,
      });
      const L = OM.HOME;
      const H = { x0: L.x0, y0: L.y0, cw: L.cw / 2, ch: L.ch / 2 }; // the type's half lattice, on HOME's origin
      const ink = OM.fieldInks('tokyo-night');
      const on = OM.words('c1-03');
      const END = start + duration;
      // The name's syllables: O on its onset, MAR on the half-beat before the
      // downbeat (a small kick there), CHY on the 90.856 kick on the downbeat.
      // The small type lifts off from the 92.05 snare, where energy goes high.
      // Every hit is on the drum as measured on the song (OM.T.drums, OM.T.beatsOn).
      const onDrum = (t, kind) => OM.edit.hits(kind, t - 0.05, t + 0.05).reduce((m, h) => (m === null || Math.abs(h[0] - t) < Math.abs(m - t) ? h[0] : m), null) ?? t;
      const BO = (OM.T && OM.T.beatsOn) || [], bi = BO.findIndex((b) => b > 90.7);
      const MAR = bi > 0 && BO[bi] - BO[bi - 1] < 0.7 ? (BO[bi - 1] + BO[bi]) / 2 : 90.592;
      const KICK = onDrum(90.86, 'kick'), LIFT = onDrum(92.07, 'snare'), LIFTED = 0.32;
      const SHADOW = 0.5, FALL = 0.24, BITE = 0.18, COOL = 0.8;

      /** A block pressed at `hit`: cells [col, row, letter] on lattice G, its HOME-cell box and centre. */
      const press = (G, cells, hit, o) => {
        let q0 = Infinity, q1 = -Infinity, r0 = Infinity, r1 = -Infinity;
        for (const [q, r] of cells) { q0 = Math.min(q0, q); q1 = Math.max(q1, q); r0 = Math.min(r0, r); r1 = Math.max(r1, r); }
        const hc = (v) => Math.floor(((v + 0.5) * G.cw) / L.cw), hr = (v) => Math.floor(((v + 0.5) * G.ch) / L.ch);
        return {
          G, cells, hit,
          box: { c0: hc(q0), c1: hc(q1), r0: hr(r0), r1: hr(r1) },
          cx: G.x0 + ((q0 + q1 + 1) / 2) * G.cw, cy: G.y0 + ((r0 + r1 + 1) / 2) * G.ch,
          lead: SHADOW, fall: FALL, from: 2.6, reach: 9, dent: 0.55, bite: BITE, cool: COOL,
          ...o,
        };
      };
      // Chebyshev distance in HOME cells from a block's box, for the dent and the bite.
      const away = (b, col, row) => Math.max(b.c0 - col, col - b.c1, b.r0 - row, row - b.r1, 0);

      // The name: the wordmark's three syllables by column, O | MAR | CHY.
      const all = OM.cells(OM.WORDMARK);
      const name = [[0, 8, on[2]], [11, 47, MAR], [50, 80, KICK]].map(([a, b, hit]) =>
        press(L, all.filter(([col]) => col >= a && col <= b), hit, { name: true, band: (row) => ink[OM.BANDS[row]] }));
      Object.assign(name[2], { from: 3.4, fall: 0.3, reach: 34, dent: 0.9, bite: 0.3, cool: 1, big: true });

      // The small type: words 1 and 2 set in JetBrains Mono ExtraBold on the half
      // lattice, one line centred over the name, its baseline four HOME rows above it.
      let type = null;
      const rasterize = () => {
        const sung = OM.sung('c1-03');
        const words = [0, 1].map((k) => (sung[k] ? sung[k].text : '').toUpperCase());
        const m = document.createElement('canvas').getContext('2d');
        m.font = FONT;
        const adv = m.measureText('M').width / 100, cap = m.measureText('H').actualBoundingBoxAscent / 100;
        const gap = sung[1] && sung[1].space ? 1 : 0;
        const n = Math.max(1, words[0].length + gap + words[1].length);
        const size = Math.min(84 / cap, 1180 / (n * adv)); // cap height 84px, the line no wider than the name
        const font = `800 ${size.toFixed(2)}px 'JetBrains Mono'`;
        const A = adv * size, base = -8, yB = H.y0 + base * H.ch;
        const xs = [960 - (n * A) / 2];
        xs.push(xs[0] + (words[0].length + gap) * A);
        const S = 4;
        const raster = (str, xW) => {
          if (!str) return [];
          const qA = Math.floor((xW - H.x0) / H.cw) - 1, rA = base - Math.ceil((size * 1.05) / H.ch);
          const cols = Math.ceil((str.length * A) / H.cw) + 3, rows = base - rA + Math.ceil((size * 0.3) / H.ch);
          const cnv = document.createElement('canvas');
          cnv.width = Math.ceil(cols * H.cw * S);
          cnv.height = Math.ceil(rows * H.ch * S);
          const x = cnv.getContext('2d', { willReadFrequently: true });
          x.scale(S, S);
          x.font = font;
          x.fillStyle = '#fff';
          x.fillText(str, xW - (H.x0 + qA * H.cw), yB - (H.y0 + rA * H.ch));
          const px = x.getImageData(0, 0, cnv.width, cnv.height).data;
          const out = [];
          for (let j = 0; j < rows; j++)
            for (let i = 0; i < cols; i++) {
              let sum = 0, cnt = 0;
              for (let yy = Math.floor(j * H.ch * S); yy < Math.min(cnv.height, Math.floor((j + 1) * H.ch * S)); yy++)
                for (let xx = Math.floor(i * H.cw * S); xx < Math.min(cnv.width, Math.floor((i + 1) * H.cw * S)); xx++) { sum += px[(yy * cnv.width + xx) * 4 + 3]; cnt++; }
              if (cnt && sum / cnt > 120) out.push([qA + i, rA + j, OM.clamp(Math.floor((H.x0 + (qA + i + 0.5) * H.cw - xW) / A), 0, str.length - 1)]);
            }
          return out;
        };
        const letters = [];
        const cellsOf = words.map((str, k) => {
          const cells = raster(str, xs[k]).map(([q, r, j]) => [q, r, letters.length + j]);
          for (let j = 0; j < str.length; j++) letters.push({ cells: cells.filter((cl) => cl[2] === letters.length), cx: xs[k] + (j + 0.5) * A });
          return cells;
        });
        // Banded like the wordmark, crest on top, but no darker than lit so it reads.
        const rTop = Math.min(...cellsOf.flat().map((cl) => cl[1]), base - 1);
        const band = (r) => { const f = (r - rTop) / Math.max(1, base - 1 - rTop); return f < 0.34 ? ink.crest : f < 0.62 ? ink.hover : ink.lit; };
        const cy = H.y0 + ((rTop + base) / 2) * H.ch;
        // Distribution: sort by sort, left to right, every letter lifted inside half a second.
        const stag = letters.length > 1 ? Math.min(0.07, 0.45 / (letters.length - 1)) : 0;
        letters.forEach((l, i) => Object.assign(l, { cy, at: LIFT + i * stag }));
        const presses = cellsOf.map((cells, k) =>
          cells.length ? press(H, cells, on[k], { lead: k ? SHADOW : 0, fall: k ? FALL : 0, reach: 6, dent: 0.5, band }) : null).filter(Boolean);
        return { ok: document.fonts.check(FONT), letters, presses };
      };

      /** A falling or lifting block: p 0 = up at the camera, 1 = on the paper. */
      const block = (ctx, G, cells, cx, cy, p, from) => {
        const k = OM.lerp(from, 1, p);
        ctx.globalAlpha = OM.clamp(p * 3);
        ctx.fillStyle = p > 0.7 ? ink.lit : ink.mid;
        for (const [q, r] of cells) {
          const x = cx + (G.x0 + q * G.cw - cx) * k, y = cy + (G.y0 + r * G.ch - cy) * k;
          ctx.fillRect(x, y, G.cw * k, G.ch * k);
        }
        ctx.globalAlpha = 1;
      };
      /** A block's shadow on the paper, dithered and offset, sharpening as it nears (near 0..1). */
      const shadow = (ctx, dpr, G, cells, near) => {
        const off = Math.round((1 - near) * 7 * (L.cw / G.cw));
        ctx.fillStyle = ink.bg;
        for (const [q, r] of cells) if (OM.threshold(q + off, r + off) < 0.2 + 0.8 * near) OM.cell(ctx, G, q + off, r + off, dpr);
      };

      const NB = { c0: Math.min(...name.map((p) => p.box.c0)), c1: Math.max(...name.map((p) => p.box.c1)), r0: Math.min(...name.map((p) => p.box.r0)), r1: Math.max(...name.map((p) => p.box.r1)) };
      // ---- camera: a punch in on every press, overshooting back; then a slow push carried through the cut ----
      const th = OM.theme('tokyo-night');
      const PUSH = OM.c1.push34, T0 = END - (2 * (PUSH.ZOOM - 1)) / PUSH.SPEED;
      const PUNCH = [[on[0], 0.022], [on[1], 0.018], [on[2], 0.026], [MAR, 0.026], [KICK, 0.07]];
      const KISSES = [91.88, 92.16, 93.0].map((t) => onDrum(t, 'kick')), SHIMMERS = [91.39, 92.07, 92.62, 93.09].map((t) => onDrum(t, 'snare'));
      const punch = (a) => (a < 0 ? 0 : (1 - Math.exp(-a / 0.018)) * Math.exp(-a / 0.16) * Math.cos((2 * Math.PI * a) / 0.42));
      const look = (T) => {
        let zoom = 1 + 0.022 * OM.smooth(OM.prog(T, on[0] - 0.15, on[0])) * (1 - OM.smooth(OM.prog(T, 91.6, 92.4)));
        for (const [hit, A] of PUNCH) zoom += A * punch(T - hit);
        if (T > T0) zoom += (PUSH.SPEED * (T - T0) ** 2) / (2 * (END - T0));
        const amount = OM.post.envelope(T, on[0] - 0.02, END - 0.1, { ramp: 0.3, hold: 0.02 });
        let fresh = 0;
        for (const [hit] of PUNCH) if (T >= hit) fresh = Math.max(fresh, Math.pow(0.5, (T - hit) / 0.3));
        return { amount, cam: { zoom: Math.max(1, zoom) }, p0: [fresh, 0, 0, 0] };
      };
      // ---- extras: ink droplets thrown off every block's edges, a puff of paper dust along its foot ----
      const splash = (ctx, T, p) => {
        const big = !!p.big, hw = ((p.box.c1 - p.box.c0 + 1) * L.cw) / 2, foot = L.y0 + (p.box.r1 + 1) * L.ch;
        for (const side of [-1, 1]) {
          OM.c1.burst(T, p.hit, big ? 22 : 9, Math.round(p.hit * 1000) + side, { x: p.cx + side * hw, y: p.cy, speed: big ? 620 : 380, spread: 1.3, dir: side > 0 ? -0.5 : -Math.PI + 0.5, g: 2200, life: 0.45 }, (x, y, u, i) => {
            ctx.globalAlpha = 1 - u;
            ctx.fillStyle = u < 0.3 ? ink.crest : i % 2 ? ink.lit : ink.hover;
            const d = i % 3 ? 3 : 4;
            ctx.fillRect(x - d / 2, y - d / 2, d, d);
          });
          OM.c1.burst(T, p.hit, big ? 18 : 8, Math.round(p.hit * 1000) + 7 + side, { x: p.cx + side * hw * 0.8, y: foot, speed: big ? 260 : 150, spread: 0.6, dir: side > 0 ? -0.15 : -Math.PI + 0.15, g: -60, life: 0.7 }, (x, y, u, i) => {
            ctx.globalAlpha = 0.5 * (1 - u) * Math.min(1, u * 8);
            ctx.fillStyle = i % 2 ? th['border-strong'] : ink.dim;
            const d = 2 + 5 * u;
            ctx.fillRect(x - d / 2, y - d / 2, d, d);
          });
        }
        ctx.globalAlpha = 1;
      };

      return OM.c1.post({
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (!type || (!type.ok && document.fonts.check(FONT))) type = rasterize();
          // The cuts: nothing but the field until the first bite, nothing but the name at home at the end.
          if (T < on[0] || T >= END - 0.1) return OM.handoff(T < on[0] ? 'field' : 'word', ctx, T, dpr);
          const presses = [...type.presses, ...name];

          // The paper: the field at the handoff's gain, dented where a block bit.
          const dents = presses.filter((p) => T >= p.hit && T - p.hit < p.dent);
          OM.hero(ctx, T, dpr, {
            inks: ink, L, word: false, gain: 0.8,
            mask: dents.length
              ? (col, row) => {
                  for (const p of dents) {
                    const a = (T - p.hit) / p.dent;
                    if (away(p.box, col, row) < 1 + p.reach * OM.ease.outExpo(a) && OM.threshold(col, row) > 0.5 * a * a) return 0;
                  }
                  return 1;
                }
              : null,
          });

          // Shadows of the blocks on their way down, and of the sorts on their way up.
          for (const p of presses) {
            const age = T - p.hit;
            if (p.lead && age >= -p.lead && age < 0) shadow(ctx, dpr, p.G, p.cells, 1 + age / p.lead);
          }
          for (const l of type.letters) {
            const u = OM.prog(T, l.at, l.at + LIFTED);
            if (u > 0 && u < 1) shadow(ctx, dpr, H, l.cells, 1 - u);
          }

          // The bite: an impact line runs out above and below the block; the big press spans the sheet.
          for (const p of presses) {
            const age = T - p.hit;
            if (age < 0 || age >= p.bite) continue;
            const reach = Math.round(1 + p.reach * OM.ease.outExpo(age / p.dent));
            const a = p.big ? L.cMin : p.box.c0 - reach, b = p.big ? L.cMin + L.cols - 1 : p.box.c1 + reach;
            ctx.fillStyle = ink.crest;
            for (let col = a; col <= b; col++)
              for (const row of [p.box.r0 - reach, p.box.r1 + reach]) if (OM.threshold(col, row) > age / p.bite) OM.cell(ctx, L, col, row, dpr);
          }

          // Fresh ink cools from crest to its band, each cell at its own dither threshold.
          // The big press kisses the whole name again, so O and MAR cool from it too.
          for (const p of presses) {
            const age = T - p.hit;
            if (age < 0) continue;
            const kissed = p.name && T >= KICK;
            const k = (1.25 * (kissed ? T - KICK : age)) / (kissed ? name[2].cool : p.cool);
            for (const [q, r, j] of p.cells) {
              if (j !== undefined && T >= type.letters[j].at) continue; // lifted
              const th = OM.threshold(q, r);
              ctx.fillStyle = th > k ? ink.crest : th > k - 0.25 ? ink.hover : p.band(r);
              OM.cell(ctx, p.G, q, r, dpr);
            }
          }

          // On top, nearest the camera: blocks falling onto the paper, sorts lifting off it.
          for (const p of presses) {
            const age = T - p.hit;
            if (age >= -p.fall && age < 0) block(ctx, p.G, p.cells, p.cx, p.cy, OM.ease.inCubic(1 + age / p.fall), p.from);
          }
          for (const l of type.letters) {
            const u = OM.prog(T, l.at, l.at + LIFTED);
            if (u > 0 && u < 1) block(ctx, H, l.cells, l.cx, l.cy, OM.ease.inCubic(1 - u), 2.6);
          }
          for (const p of presses) splash(ctx, T, p);

          // Pause sprinkles. Platen kiss: on each kick the platen comes down lightly on the name again and an
          // impact line runs out above and below it (kept tight while the small type still sits above).
          // Fresh-ink shimmer: on each snare a band of the name's cells re-wets to hover in dither order.
          for (const k0 of KISSES) {
            const age = T - k0;
            if (age < 0 || age >= 0.2) continue;
            const reach = Math.round(1 + (k0 < LIFT + 0.4 ? 1 : 4) * OM.ease.outExpo(age / 0.2));
            ctx.fillStyle = ink.hover;
            for (let col = NB.c0 - reach; col <= NB.c1 + reach; col++)
              for (const row of [NB.r0 - reach, NB.r1 + reach]) if (OM.threshold(col, row) > 0.25 + age / 0.2) OM.cell(ctx, L, col, row, dpr);
          }
          for (const s0 of SHIMMERS) {
            const a = (T - s0) / 0.22;
            if (a < 0 || a >= 1) continue;
            ctx.fillStyle = ink.hover;
            for (const p of name) for (const [q, r] of p.cells) {
              const d = OM.threshold(q, r) - a;
              if (d > 0 && d < 0.12) OM.cell(ctx, L, q, r, dpr);
            }
          }
        },
        release: () => c.release(),
      }, fx, look);
    },
  });
})();
