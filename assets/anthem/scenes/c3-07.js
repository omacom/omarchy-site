// c3-07 · The storm clears. The flock has come down as the rain, falling past
// the sun; a storm deck rolls over it. On the first onset the rain stops dead
// in mid-air.
// Then the light breaks through: each word is a break in the cloud the shape
// of its letters, torn open on its onset with a silver lining round it and rays
// slanting down out of it through the hanging drops. The key word is the
// biggest break, and on its onset a nova of words: every letter erupts out of
// its place as a streak of light flung away from the key word, and snaps back
// home within a fifth of a second. On the kick inside it the whole deck
// parts from the sun outward, the drops flash and burn off, and light floods
// the frame: the glow.
OM.ownWords.add('c3-07');
// Edit camera: the 269.996 downbeat has no kick or snare under it and falls 94 ms before the snare
// thunder (the scene's own flash shake) and 200 ms before the key word's nova; its punch would blur
// both, so it is skipped and the key word's own camera pop (fxAt) is raised to carry the bar. The
// 270.526 kick, the strongest in the scene, keeps its jolt: the deck parts and light floods on it.
OM.edit.plan('c3-07', { skip: [269.996] });
OM.scene({
  id: 'c3-07',
  build(el, { start, duration }) {
    const C = OM.c3;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const END = start + duration;
    const ink = C.ink, th = C.th;
    const HL = OM.HOME, hc = OM.cellAt(HL, 960, 540);
    const SX = HL.x0 + (hc.col + 0.5) * HL.cw, SY = HL.y0 + (hc.row + 0.5) * HL.ch;
    const words = OM.sung('c3-07');
    const on = words.map((w) => w.t0);
    const n = words.length;
    // PART: the deck parts on the kick inside the key word (measured). TEAR: seconds a break takes to
    // tear across its word, quick so each word is whole within a few frames of its onset (was 0.12).
    const K = n - 1, PART = C.onDrum(270.536, 'kick'), CELL = 6, TEAR = 0.06;
    const CL = [th['bg-deep'] || '#16161e', th.surface || '#1f2335', th['surface-2'] || '#292e42', th['border-strong'] || '#3b4261'].map(C.pack);
    const P = { crest: C.pack(ink.crest), hover: C.pack(ink.hover), lit: C.pack(ink.lit), mid: C.pack(ink.mid) };
    const RN = OM.c3cut.rain, rain = RN.drops; // the rain the flock came down as
    const NOVA = 0.16; // the nova of words: out and back home inside this

    const type = C.lazy(() => {
      const place = C.layout(words, [{ ks: [...Array(K).keys()], cap: 96, cy: 300 }, { ks: [K], cap: 190, cy: 690 }]);
      const M = C.mask(words, place, 800, CELL);
      const { GW, GH, of } = M;
      // Distance (in cells, up to 3) from each cloud cell to the nearest letter, and which word: the silver lining.
      const near = new Uint8Array(GW * GH).fill(9), nk = new Int8Array(GW * GH).fill(-1);
      for (let idx = 0; idx < of.length; idx++) {
        if (of[idx] < 0) continue;
        const i = idx % GW, j = (idx / GW) | 0;
        for (let b = -3; b <= 3; b++)
          for (let a = -3; a <= 3; a++) {
            const ii = i + a, jj = j + b;
            if (ii < 0 || jj < 0 || ii >= GW || jj >= GH) continue;
            const q = jj * GW + ii, d = Math.max(Math.abs(a), Math.abs(b));
            if (d < near[q]) { near[q] = d; nk[q] = of[idx]; }
          }
      }
      // Ray sources: a sparse set of each word's cells.
      const rays = words.map(() => []);
      for (let idx = 0; idx < of.length; idx++) if (of[idx] >= 0 && OM.hash(idx, 7, 3) < 0.09) rays[of[idx]].push([(idx % GW + 0.5) * CELL, (((idx / GW) | 0) + 0.5) * CELL]);
      // Each word's letter cells, for the nova: [x, y, dirX, dirY, reach] flung away from the key word's centre.
      const kc = place[K] || { cx: 960, cy: 690 };
      const cells = words.map(() => []);
      for (let idx = 0; idx < of.length; idx++) {
        if (of[idx] < 0) continue;
        const x = (idx % GW + 0.5) * CELL, y = (((idx / GW) | 0) + 0.5) * CELL;
        const dx = x - kc.cx, dy = (y - kc.cy) * 1.6, l = Math.hypot(dx, dy) || 1;
        cells[of[idx]].push([x, y, dx / l, dy / (1.6 * l), (of[idx] === K ? 1 : 0.5) * (140 + 0.85 * l + 320 * OM.hash(idx, 6, 0x707))]);
      }
      return { place, M, near, nk, rays, cells, B: C.buffer(GW, GH) };
    });
    const tearAt = (place, k, x) => on[k] + TEAR * OM.clamp((x - place[k].x) / place[k].w);

    // Camera: a tilt up as the clouds part, with flash shakes on the thunder. Effect: lightning exposure
    // flashes and cloud shadows sweeping over the deck; the lit letters are masked out of both.
    const FL = [C.onDrum(269.746, 'kick'), C.onDrum(270.095, 'snare'), PART]; // the thunder, on the drums as measured
    const flashAt = (T) => FL.reduce((m, f) => Math.max(m, C.decay(T, f, 0.06)), 0);
    const FX = C.GLSL_LUM + `vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec3 c = src(p).rgb;
  float keep = smoothstep(0.35, 0.55, lum(c));
  float sh = vnoise(vec2(p.x * 5.0 - uTime * 0.6, p.y * 3.0 + uTime * 0.15));
  c *= 1.0 - 0.35 * uAmount * smoothstep(0.4, 0.8, sh) * (1.0 - keep);
  c += uAmount * uP0.x * (1.0 - keep) * (vec3(0.75, 0.79, 0.96) * 0.09 + c * 0.3);
  return vec4(c, 1.0);
}`;
    const fxAt = (T) => {
      const f = flashAt(T);
      return {
        amount: 1, p0: [f, 0, 0, 0],
        cam: { zoom: 1.06 + 0.05 * C.decay(T, on[K], 0.07), y: -30 + 60 * OM.ease.inOutCubic(OM.prog(T, start, END)), x: 9 * f * Math.sin(T * 91), rot: 0.004 * f * Math.cos(T * 73) },
      };
    };
    return OM.c3.withFx(el, c, start, END, FX, fxAt)({
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T < start + 0.05) return RN.paint(ctx, T, dpr);
        if (C.seam(ctx, T, dpr, start, END, 'spark', 'glow', start)) return;
        const { place, M, near, nk, rays, cells, B } = type();
        const nAge = T - on[K], nova = nAge >= 0 && nAge < NOVA; // the letters are out of their places
        const { GW, GH, of } = M, buf = B.buf;
        const roll = OM.ease.inOutCubic(OM.prog(T, start + 0.03, start + 0.45)); // the deck rolls in over the sun
        const part = OM.ease.inOutCubic(OM.prog(T, PART, END - 0.12)); // and parts from the sun outward
        const flood = C.sm(T, PART, END - 0.08);
        const wordsA = 1 - C.sm(T, 271.0, END - 0.12);

        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        // The sun behind it all, swelling into the glow.
        C.pool(ctx, SX, SY, OM.lerp(72, 620, flood), ink.lit, OM.lerp(0.4, 0.5, flood) + 0.15 * C.decay(T, on[K], 0.2));

        if (roll < 1) {
          ctx.globalAlpha = 1 - roll;
          ctx.fillStyle = ink.crest;
          OM.cell(ctx, HL, hc.col, hc.row, dpr);
          ctx.globalAlpha = 1;
        }
        const drift = T * 14;
        // ponytail: two heroNoise samples per 6px cell per frame (~58k cells); sample noise at half res if this blows the 12ms budget
        for (let j = 0; j < GH; j++) {
          const y = (j + 0.5) * CELL;
          for (let i = 0; i < GW; i++) {
            const idx = j * GW + i, x = (i + 0.5) * CELL;
            const k = of[idx];
            buf[idx] = 0;
            // The deck rolls in cell by cell; the parting opens from the sun.
            const h = OM.hash(i, j, 0x77);
            if (k >= 0 && nova && T >= on[k]) continue; // flung out in the nova: the break shows through
            // A torn letter is whole from its tear, even while the deck is still rolling in round the first word.
            if (k >= 0 && T >= tearAt(place, k, x) && h < wordsA) {
              const age = T - tearAt(place, k, x);
              const v = (age < 0.08 ? 1.3 : 0.7) + 0.4 * C.decay(T, on[k], 0.16) - 0.5 * (1 - wordsA) + (h > 0.8 ? 0.2 : 0);
              buf[idx] = v > 1 ? P.crest : v > 0.45 ? P.hover : P.lit;
              continue;
            }
            if (h > roll * 1.1) continue;
            // The parting clears the cloud round the letters; the letters themselves hold until they fade.
            const dist = Math.hypot(x - SX, (y - SY) * 1.5) / 1150;
            if (dist < part * 1.25 - 0.12 * h) continue;
            const nd = near[idx], q = nk[idx];
            if (q >= 0 && nd <= 2 && T >= on[q] && wordsA > 0.3) {
              buf[idx] = nd === 1 ? P.lit : P.mid; // the silver lining
              continue;
            }
            const nz = 0.6 * OM.heroNoise(i * 0.05 + drift * 0.01, j * 0.07) + 0.4 * OM.heroNoise(i * 0.13 - drift * 0.02, j * 0.15 + 3);
            const lvl = nz * 3.2 + (h - 0.5) * 0.7 + 0.5 * (y / 1080) - 0.3 + (part > 0 && dist < part * 1.25 + 0.1 ? 1 : 0);
            buf[idx] = CL[OM.clamp(Math.floor(lvl), 0, 3)];
          }
        }
        B.draw(ctx, 0, 0, GW * CELL, GH * CELL);

        // Lightning: a jagged bolt down the sky's edge on each thunder hit.
        FL.forEach((f, b) => {
          const age = T - f;
          if (age < 0 || age > 0.13) return;
          const a = 1 - age / 0.13;
          let x = b % 2 ? 1700 : 230, y = 0;
          ctx.beginPath();
          ctx.moveTo(x, y);
          for (let s = 1; s <= 12; s++) {
            x += (OM.hash(b, s, 77) - 0.5) * 90;
            y = s * 46;
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = C.rgba(ink.hover, 0.3 * a);
          ctx.lineWidth = 10;
          ctx.stroke();
          ctx.strokeStyle = C.rgba(ink.crest, a);
          ctx.lineWidth = 3;
          ctx.stroke();
        });
        // The nova of words: each letter cell out along its streak (out in a frame, slamming home by NOVA).
        if (nova) {
          const f = (a) => (a <= 0 ? 0 : a < 0.045 ? OM.ease.outExpo(a / 0.045) : 1 - OM.ease.inCubic(OM.clamp((a - 0.045) / (NOVA - 0.045))));
          const f0 = f(nAge), f1 = f(nAge - 0.03);
          C.pool(ctx, place[K].cx, place[K].cy, 420, ink.lit, 0.3 * C.decay(T, on[K], 0.04));
          ctx.save();
          for (const [col, wd, a] of [[ink.lit, 3, 0.35], [ink.crest, 1, 0.6]]) {
            ctx.strokeStyle = C.rgba(col, a);
            ctx.lineWidth = wd;
            ctx.beginPath();
            for (let k = 0; k < n; k++) {
              if (T < on[k]) continue;
              for (const [x, y, ux, uy, r] of cells[k]) {
                ctx.moveTo(x + ux * r * f1, y + uy * r * f1);
                ctx.lineTo(x + ux * r * f0, y + uy * r * f0);
              }
            }
            ctx.stroke();
          }
          ctx.fillStyle = nAge < 0.045 ? ink.crest : ink.hover; // the heads: bright going out, letter ink coming home
          for (let k = 0; k < n; k++) {
            if (T < on[k]) continue;
            for (const [x, y, ux, uy, r] of cells[k]) ctx.fillRect(Math.round(x + ux * r * f0 - 3), Math.round(y + uy * r * f0 - 3), CELL, CELL);
          }
          ctx.restore();
        }
        // Rays down out of each break, slanting away from the sun.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = CELL * 1.2;
        for (let k = 0; k < n; k++) {
          if (T < on[k] || wordsA <= 0) continue;
          const grow = OM.ease.outExpo(OM.clamp((T - on[k]) / 0.25));
          const a = (0.05 + 0.08 * C.decay(T, on[k], 0.2)) * wordsA * (k === K ? 1.3 : 1);
          ctx.strokeStyle = C.rgba(ink.hover, a);
          ctx.beginPath();
          for (const [x, y] of rays[k]) {
            let dx = x - SX, dy = Math.abs(y - SY) + 500;
            const l = Math.hypot(dx, dy), len = (240 + 260 * OM.hash(x, y, 1)) * grow;
            ctx.moveTo(x, y);
            ctx.lineTo(x + (dx / l) * len, y + (dy / l) * len);
          }
          ctx.stroke();
        }
        ctx.restore();

        // The rain: falling, then frozen in mid-air on the first onset, glinting in the light and burning off.
        const Tr = Math.min(T, on[0]);
        const rainA = 1 - C.sm(T, PART + 0.1, END - 0.15); // full from the cut: it is the flock come down
        if (rainA > 0.01) {
          ctx.globalAlpha = rainA;
          for (const d of rain) {
            const [x, y] = RN.at(d, Tr);
            const frozen = T > on[0];
            const glint = frozen && Math.hypot(x - SX, y - SY) < 300 + 900 * flood;
            ctx.fillStyle = glint && d.r > 0.4 ? ink.hover : frozen ? ink.mid : th['text-muted'] || ink.mid;
            const len = frozen ? d.len * 0.45 : d.len;
            ctx.fillRect(Math.round(x), Math.round(y), 2, Math.round(len));
          }
          ctx.globalAlpha = 1;
        }
      },
      release: () => c.release(),
    });
  },
});
