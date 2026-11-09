// x-end · The core bursts into the portrait. From o-01's cut state (the whole
// home drained into a glowing core, still spinning) the core charges on the
// hi-hat roll, tighter and brighter, drawing in the last specks. The snare cracks it open
// and the kick blows it apart: tiles of a frame-filling field of specks fly out
// of it on spiral paths that unwind the vortex the other way and land edge to
// edge, settling slowly into an even field that stays to the end. (The released
// film lets a portrait emerge in that field as a soft drift in each speck's
// brightness; its data isn't in this repo, so here the field stays even.)
//
// Edit camera: x-end carries o-01's core across the cut and charges on a quiet hi-hat roll, so it takes
// the outro's strengths (section o: punch 2.24%, jolt 8.4 px, roll 0.0056 rad) rather than the louder
// bridge's, keeping the pulse even through the cut. The snare at 295.102 is the scene's own crack and
// camera punch, its biggest moment, so the camera's backbeat jolt there is skipped.
OM.edit.plan('x-end', { punch: 0.0224, back: 8.4, roll: 0.0056, skip: [295.102] });
(() => {
  // The portrait: 220 x 346 dots, nibble-packed 4-bit shades (0 = no dot).
  const COLS = 220, ROWS = 346;
  // Not in the public repo: load its nibble-packed data as window.OM_PORTRAIT to bring it back.
  const ENCODED = window.OM_PORTRAIT || '';
  // Its own speck geometry, kept from the file: 4 x 3.08 px pitch, 2.65 x 2.25 px dots, centred.
  const PIX_X = 4.0, PIX_Y = 3.08, DOT_W = 2.65, DOT_H = 2.25;
  const OX = Math.round((1920 - COLS * PIX_X) / 2), OY = Math.round((1080 - ROWS * PIX_Y) / 2);
  const decode = () => {
    const raw = atob(ENCODED);
    const shades = new Uint8Array(COLS * ROWS);
    for (let i = 0, j = 0; i < raw.length && j < shades.length; i++) {
      const n = raw.charCodeAt(i);
      shades[j++] = n >> 4;
      if (j < shades.length) shades[j++] = n & 15;
    }
    return shades;
  };
  const TS = 8; // a flying tile: 8 x 8 specks
  // The field: one speck grid over the whole frame on the portrait's own pitch, aligned to its dots.
  const GC = 130, GR = 3; // the portrait's (0, 0) dot sits at grid (130, 3)
  const GX = Math.ceil(1920 / PIX_X), GY = Math.ceil((1080 + GR * PIX_Y - OY) / PIX_Y) + 1, Y0 = OY - GR * PIX_Y;
  const BLUR = 3, CONTRAST = 0.45, BASE = 0.4, GRAIN = 0.14;
  /** Each speck's face offset from the field's mean (blurred shade map, portrait background and outside at the mean). */
  const faceMap = () => {
    if (!ENCODED) return new Float32Array(GX * GY); // no portrait: the field stays even
    const sh = decode();
    let sum = 0, n = 0;
    for (const v of sh) if (v) { sum += v / 15; n++; }
    const m = sum / n;
    let A = new Float32Array(GX * GY).fill(m);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (sh[r * COLS + c]) A[(r + GR) * GX + c + GC] = sh[r * COLS + c] / 15;
    const box = (src, rad, horiz) => {
      const out = new Float32Array(GX * GY);
      for (let y = 0; y < GY; y++)
        for (let x = 0; x < GX; x++) {
          let s = 0, k = 0;
          for (let d = -rad; d <= rad; d++) {
            const xx = horiz ? x + d : x, yy = horiz ? y : y + d;
            if (xx < 0 || yy < 0 || xx >= GX || yy >= GY) continue;
            s += src[yy * GX + xx];
            k++;
          }
          out[y * GX + x] = s / k;
        }
      return out;
    };
    for (let p = 0; p < 2; p++) A = box(box(A, BLUR, true), Math.round(BLUR * 1.3), false);
    for (let i = 0; i < A.length; i++) A[i] -= m;
    return A;
  };
  const CX = 960, CY = 540;
  const FACE = { x: OX + 112 * PIX_X, y: OY + 95 * PIX_Y }; // where the face sits: its tiles land first
  // The crack and the blow-out on the snare and the kick as measured on the song (295.102, 295.386).
  const onDrum = (t, kind) => {
    let best = t, d = 0.05;
    for (const [x] of OM.edit.hits(kind, t - 0.05, t + 0.05)) if (Math.abs(x - t) < d) (d = Math.abs(x - t)), (best = x);
    return best;
  };
  const SNARE = onDrum(295.079, 'snare'), KICK = onDrum(295.381, 'kick'), FORMED = 299.5; // the field has settled by FORMED

  // Phosphor: lit specks bloom green while they fly (uP0.y bloom), and once the field rests a
  // barely visible flicker runs through it (uP0.x shimmer). Off, it is the raw frame.
  const FX = `
vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec3 c = src(p).rgb;
  if (uAmount <= 0.0) return vec4(c, 1.0);
  vec2 px = 1.0 / uRes * (uRes.x / 1920.0);
  vec3 b = vec3(0.0);
  if (uP0.y > 0.0) {
    for (int i = 0; i < 12; i++) {
      float a = float(i) * 0.5236 + 0.26;
      vec2 o = vec2(cos(a), sin(a));
      for (int j = 1; j <= 3; j++) {
        vec3 s = src(p + o * px * float(j) * 6.0).rgb;
        b += s * smoothstep(0.3, 0.8, dot(s, vec3(0.3, 0.55, 0.15))) / float(j);
      }
    }
    b /= 22.0;
  }
  vec2 dp = (p * uRes) / (uRes.x / 1920.0);
  float n = vnoise(vec2(dp.x / 16.0, dp.y / 12.3) + vec2(0.0, uTime * 5.0)) - 0.5;
  vec3 green = vec3(0.62, 0.81, 0.42);
  c = c * (1.0 + uAmount * uP0.x * 0.16 * n) + uAmount * uP0.y * b * green * 1.3;
  return vec4(c, 1.0);
}`;

  OM.scene({
    id: 'x-end',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const ink = OM.fieldInks('tokyo-night');
      const end = start + duration;
      const HOLD0 = start + 0.07;
      const STOPS = [[0, OM.mix(ink.bg, ink.dim, 0.55)], [0.3, ink.dim], [0.6, ink.mid], [0.85, ink.lit], [1, ink.hover]].map(([t, h]) => [t, OM.rgb(h)]);
      const BGP = OM.rgb(ink.bg), CREST = OM.rgb(ink.crest);
      const tone = (L) => {
        L = OM.clamp(L);
        let i = 0;
        while (i < STOPS.length - 2 && L > STOPS[i + 1][0]) i++;
        const [a, ca] = STOPS[i], [b, cb] = STOPS[i + 1], f = (L - a) / (b - a);
        return ca.map((v, k) => v + (cb[k] - v) * f);
      };

      // ---- the field, prepainted once per device scale: with the face, without it, and crest-hot for flight ----
      let PRE = null;
      const prepaint = (dpr) => {
        if (PRE && PRE.dpr === dpr) return PRE;
        const D = faceMap();
        const W = Math.round(1920 * dpr), H = Math.round(1080 * dpr);
        const sheets = [0, 1, 2].map(() => {
          const k = document.createElement('canvas');
          k.width = W;
          k.height = H;
          const g = k.getContext('2d');
          const im = g.createImageData(W, H);
          const px = new Uint32Array(im.data.buffer);
          px.fill((255 << 24) | (BGP[2] << 16) | (BGP[1] << 8) | BGP[0]);
          return { k, g, im, px };
        });
        const dw = Math.max(1, Math.round(DOT_W * dpr));
        const yAt = (gy) => Math.round((Y0 + gy * PIX_Y) * dpr);
        const pack = (r, g, b) => (255 << 24) | (Math.round(b) << 16) | (Math.round(g) << 8) | Math.round(r);
        for (let gy = 0; gy < GY; gy++) {
          // Exact coverage: each device row a dot row touches is shaded by its share of it, so the
          // 3.08 px pitch never beats against the pixel grid as dark lines.
          const top = (Y0 + gy * PIX_Y) * dpr, bot = top + DOT_H * dpr, rows = [];
          for (let y = Math.max(0, Math.floor(top)); y < Math.min(H, Math.ceil(bot)); y++) rows.push([y, Math.min(y + 1, bot) - Math.max(y, top)]);
          for (let gx = 0; gx < GX; gx++) {
            const grain = GRAIN * (OM.hash(gx, gy, 709) - 0.5);
            const face = tone(BASE + CONTRAST * D[gy * GX + gx] + grain), flat = tone(BASE + grain);
            const hot = face.map((v, k) => v + (CREST[k] - v) * 0.65);
            const x0 = Math.round(gx * PIX_X * dpr), x1 = Math.min(W, x0 + dw);
            [face, flat, hot].forEach(([r, g, b], s) => {
              const px = sheets[s].px, dr = r - BGP[0], dg = g - BGP[1], db = b - BGP[2];
              // Added to what is there, so a device row two dot rows share gets both shares.
              for (const [y, a] of rows) {
                const i = y * W + x0, p = px[i];
                px.fill(pack((p & 255) + dr * a, ((p >> 8) & 255) + dg * a, ((p >> 16) & 255) + db * a), i, y * W + x1);
              }
            });
          }
        }
        for (const s of sheets) s.g.putImageData(s.im, 0, 0);
        // The tiles: device-pixel source rects, each flight seeded and timed.
        const tiles = [], ds = [];
        for (let ty = 0; ty * TS < GY; ty++)
          for (let tx = 0; tx * TS < GX; tx++) {
            const sx = Math.round(tx * TS * PIX_X * dpr), sx2 = Math.min(W, Math.round((tx + 1) * TS * PIX_X * dpr));
            const sy = Math.max(0, yAt(ty * TS)), sy2 = Math.min(H, yAt((ty + 1) * TS));
            if (sx2 <= sx || sy2 <= sy) continue;
            const hx = (sx + sx2) / 2 / dpr, hy = (sy + sy2) / 2 / dpr;
            ds.push(Math.hypot(hx - FACE.x, (hy - FACE.y) * 0.85));
            tiles.push({ sx, sy, sw: sx2 - sx, sh: sy2 - sy, hx, hy });
          }
        // Landing order: nearest the face first, with a seeded shuffle so the field resolves as a cloud, not a ring.
        const rank = ds.map((d, i) => [d, i]).sort((a, b) => a[0] - b[0]);
        rank.forEach(([, i], k) => {
          const t = tiles[i], h = OM.hash(i, 1, 613), h2 = OM.hash(i, 2, 613);
          const order = OM.clamp(0.62 * (k / rank.length) + 0.38 * h);
          t.s = order < 0.33 ? SNARE + 0.03 * h2 : KICK + 0.035 * h2; // the inner cloud cracks out on the snare, the rest on the kick
          t.e = 295.9 + (FORMED - 0.05 - 295.9) * Math.pow(order, 0.8);
          t.r = Math.hypot(t.hx - CX, t.hy - CY);
          t.th = Math.atan2(t.hy - CY, t.hx - CX);
          t.turn = 2.4 + 1.8 * h2; // radians of unwinding on the way out
          t.cool = 0.22 + 0.4 * OM.hash(i, 3, 613);
        });
        PRE = { dpr, face: sheets[0].k, flat: sheets[1].k, hot: sheets[2].k, tiles };
        return PRE;
      };

      // ---- the burst: tiles fly out of the core on unwinding spirals and land edge to edge ----
      // The face emerges as the music ends, holds through the silence, then dissolves into the even field,
      // which holds still for the last frames.
      const EM0 = FORMED, EM1 = 301.4, DISS0 = end - 1.95, DISS1 = end - 0.35;
      const burst = (ctx, T, dpr) => {
        const P = prepaint(dpr);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        if (T >= FORMED) {
          const face = OM.ease.inOutSine(OM.prog(T, EM0, EM1)) * (1 - OM.ease.inOutSine(OM.prog(T, DISS0, DISS1)));
          ctx.globalAlpha = 1;
          ctx.drawImage(face < 1 ? P.flat : P.face, 0, 0);
          if (face > 0 && face < 1) {
            ctx.globalAlpha = face;
            ctx.drawImage(P.face, 0, 0);
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920 * dpr, 1080 * dpr);
          const cx = CX * dpr, cy = CY * dpr;
          for (const t of P.tiles) {
            if (T < t.s) continue;
            const u = OM.prog(T, t.s, t.e);
            const src = u < t.cool ? P.hot : P.flat; // landed tiles are the settled plain field, pixel for pixel
            if (u >= 1) {
              ctx.drawImage(src, t.sx, t.sy, t.sw, t.sh, t.sx, t.sy, t.sw, t.sh);
              continue;
            }
            const q = 1 - Math.pow(1 - u, 3.2);
            const r = t.r * q * (1 + 0.1 * Math.sin(Math.PI * q)) * dpr;
            const th = t.th + OM.finale.SPIN * t.turn * Math.pow(1 - q, 1.3);
            const sc = 0.3 + 0.7 * q;
            const w = t.sw * sc, h = t.sh * sc;
            ctx.drawImage(src, t.sx, t.sy, t.sw, t.sh, Math.round(cx + r * Math.cos(th) - w / 2), Math.round(cy + r * Math.sin(th) - h / 2), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
          }
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // What is left of the core after the crack: a crest knot that the kick blows out.
        if (T < KICK + 0.35) {
          const a = T < KICK ? 1 : Math.exp(-(T - KICK) / 0.08);
          const rad = T < KICK ? 90 + 40 * Math.exp(-(T - SNARE) / 0.05) : 90 + 260 * (T - KICK);
          const [r0, g0, b0] = OM.rgb(ink.hover);
          const gr = ctx.createRadialGradient(CX, CY, 0, CX, CY, rad);
          gr.addColorStop(0, `rgba(${r0},${g0},${b0},${0.75 * a})`);
          gr.addColorStop(1, `rgba(${r0},${g0},${b0},0)`);
          ctx.fillStyle = gr;
          ctx.fillRect(CX - rad, CY - rad, 2 * rad, 2 * rad);
          const sz = Math.round((T < KICK ? 6 + 6 * Math.exp(-(T - SNARE) / 0.06) : 6 * a) * dpr) / dpr;
          if (sz > 0) {
            ctx.fillStyle = ink.crest;
            ctx.fillRect(Math.round((CX - sz / 2) * dpr) / dpr, Math.round((CY - sz / 2) * dpr) / dpr, sz, sz);
          }
        }
      };

      return {
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          ctx.globalAlpha = 1;
          if (T < SNARE) OM.finale.core(ctx, T, dpr);
          else burst(ctx, T, dpr);
          // Camera: a slow push on the charging core, a punch on the snare, then the kick throws it back
          // with a counter-roll that unwinds to rest as the field settles. Held still from FORMED.
          let z = 1, rot = 0;
          if (T < SNARE) z = 1 + 0.08 * OM.ease.inCubic(OM.prog(T, start, SNARE));
          else if (T < KICK) z = 1.08 + 0.025 * (1 - Math.exp(-(T - SNARE) / 0.04));
          else {
            const zk = 1.08 + 0.025 * (1 - Math.exp(-(KICK - SNARE) / 0.04));
            const e = 1 - OM.ease.outCubic(OM.prog(T, KICK, FORMED));
            z = 1 + (zk - 1) * e;
            rot = -OM.finale.SPIN * 0.04 * e;
          }
          // Effect: bloom from the late charge through the flight, then only a barely visible shimmer, still before the end.
          const bloom = T < SNARE ? 0.6 * OM.smooth(OM.prog(T, 294.3, SNARE)) : 1 - OM.smooth(OM.prog(T, KICK, FORMED));
          const shim = OM.smooth(OM.prog(T, 298.5, FORMED)) * 0.2 * (1 - OM.smooth(OM.prog(T, DISS0, DISS1)));
          // The pass runs unbroken from the in-cut to the last frame (there is no outgoing cut), so no still frame ever switches it.
          const cut = T < HOLD0;
          fx.apply(T, {
            amount: cut ? 0 : 1,
            cam: cut ? null : { zoom: z, rot },
            p0: [shim, Math.max(0, bloom), 0, 0],
          });
        },
        release: () => {
          fx.release();
          c.release();
          PRE = null;
        },
      };
    },
  });
})();
