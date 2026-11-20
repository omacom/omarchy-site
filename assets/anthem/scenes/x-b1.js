// x-b1 · Gathering. The homepage field starts to turn and is drawn into a
// vortex around the spark's cell. On the five strong kicks the film's motifs
// form out of the field one by one (a bowl, a paper plane, a ship's bow, a
// candle, a horse) and orbit the eye, faster on every downbeat, spiralling in
// until each is swallowed on the half-beats of the last bar. On the closing
// snare the eye flashes and opens into the mouth of x-b2's tunnel.
//
// Shared section code lives on OM.xb (file scope, so x-b2 can use it): the
// vanishing point, the motif bitmaps, the tunnel's camera and its rings.
//
// Edit camera: x-b1's own camera only builds smoothly (tilt and rush), so the camera's beats fit as
// they are and land with the in-picture hits (the crest rings on the two downbeats, the motifs on
// the kicks). The one exception is the drumless 233.216 beat right before the closing snare: the
// scene's own punch on that snare (POP) is its biggest moment, so that beat is skipped.
OM.edit.plan('x-b1', { skip: [233.216] });
(() => {
  const L = OM.HOME;
  const ink = OM.fieldInks('tokyo-night');
  const h = OM.cellAt(L, 960, 540);
  const C = { x: L.x0 + (h.col + 0.5) * L.cw, y: L.y0 + (h.row + 0.5) * L.ch }; // the spark cell's centre

  // ---------- motifs: simple original silhouettes on an 18x14 cell grid ----------
  const MW = 18, MH = 14, S = 8;
  const DRAW = {
    bowl: (x) => {
      x.fillRect(1, 4, 16, 1.3);
      x.beginPath(); x.ellipse(9, 5.3, 7.4, 6, 0, 0, Math.PI); x.fill();
      x.fillRect(6.5, 10.6, 5, 2);
    },
    plane: (x) => {
      x.beginPath(); x.moveTo(17.5, 2.5); x.lineTo(0.5, 7); x.lineTo(6.5, 8.6); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(17.5, 2.5); x.lineTo(6.5, 8.6); x.lineTo(5, 13); x.closePath(); x.fill();
      x.globalCompositeOperation = 'destination-out';
      x.lineWidth = 0.9; x.beginPath(); x.moveTo(17.5, 2.5); x.lineTo(5.2, 9.2); x.stroke();
    },
    bow: (x) => {
      x.beginPath(); x.moveTo(0.5, 8); x.lineTo(14.5, 8); x.lineTo(17.5, 5); x.lineTo(15.5, 10.5); x.lineTo(12.5, 13.5); x.lineTo(1.5, 13.5); x.closePath(); x.fill();
      x.fillRect(4.4, 0.5, 1.1, 7.5);
      x.beginPath(); x.moveTo(6, 1); x.lineTo(6, 7.2); x.lineTo(12, 7.2); x.closePath(); x.fill();
      x.lineWidth = 0.9; x.beginPath(); x.moveTo(14, 7); x.lineTo(17.8, 2.6); x.stroke();
    },
    candle: (x) => {
      x.fillRect(6.5, 6.2, 5, 7.8);
      x.fillRect(5.5, 13, 7, 1);
      x.fillRect(8.6, 4.6, 0.8, 1.6);
      x.beginPath(); x.moveTo(9, 0.2); x.quadraticCurveTo(12.2, 3.6, 9, 4.8); x.quadraticCurveTo(5.8, 3.6, 9, 0.2); x.fill();
    },
    horse: (x) => {
      x.beginPath();
      [[10, 0.3], [11.2, 2.4], [12.3, 0.6], [12.9, 3], [15.2, 5.6], [16.6, 9], [17, 13.8], [8.2, 13.8], [8.6, 10.2], [6, 9.4], [2.4, 9.8], [1, 8.4], [1.6, 6.6], [5.6, 3.6], [8.8, 2.4]]
        .forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
      x.closePath(); x.fill();
      x.globalCompositeOperation = 'destination-out';
      x.fillRect(7.6, 4.6, 1.2, 1.2);
      x.lineWidth = 0.7; x.beginPath(); x.moveTo(13.6, 4.4); x.lineTo(16, 12.4); x.stroke();
    },
  };
  const NAMES = ['bowl', 'plane', 'bow', 'candle', 'horse'];
  let MOTIFS = null;
  /** [{ name, m: Uint8Array(MW*MH) }] where m is 0 empty, 1 body, 2 hot (the candle's flame). */
  const motifs = () => {
    if (MOTIFS) return MOTIFS;
    MOTIFS = NAMES.map((name) => {
      const cv = document.createElement('canvas');
      cv.width = MW * S; cv.height = MH * S;
      const x = cv.getContext('2d', { willReadFrequently: true });
      x.scale(S, S);
      x.fillStyle = '#fff'; x.strokeStyle = '#fff';
      DRAW[name](x);
      const px = x.getImageData(0, 0, cv.width, cv.height).data;
      const m = new Uint8Array(MW * MH);
      for (let j = 0; j < MH; j++)
        for (let i = 0; i < MW; i++) {
          let sum = 0;
          for (let yy = j * S; yy < (j + 1) * S; yy++) for (let xx = i * S; xx < (i + 1) * S; xx++) sum += px[(yy * cv.width + xx) * 4 + 3];
          if (sum / (S * S) > 110) m[j * MW + i] = name === 'candle' && j < 5 ? 2 : 1;
        }
      return { name, m };
    });
    return MOTIFS;
  };

  // ---------- the tunnel: camera depth Z(T), closed form ----------
  const T0 = 233.802; // x-b2's first downbeat: the tunnel starts moving here
  const V0 = 1.2, K = Math.log(2) / 2.136; // speed doubles every bar
  // x-b2's downbeats on their drum onsets, except the first: the lunge that lands the 233.80 cut
  // stays on the cut itself (the seam frames are drawn from it).
  const DOWN = [233.802, ...[235.915, 238.051, 240.187, 242.323].map(OM.beatOnset)];
  // Hits on the drum as measured on the song (OM.T.drums): the nearest of `kind` within 50 ms of t, else t.
  const onDrum = (t, kind) => {
    let best = t, d = 0.05;
    for (const [x] of OM.edit.hits(kind, t - 0.05, t + 0.05)) if (Math.abs(x - t) < d) (d = Math.abs(x - t)), (best = x);
    return best;
  };
  const KICKS = [234.289, 235.636, 236.124, 236.286, 237.354, 237.703, 239.351, 239.862, 240.025, 240.419, 240.930, 241.093, 241.464, 241.604, 241.998, 242.416, 242.695, 242.811].map((t) => onDrum(t, 'kick'));
  const Zc = (T) => {
    const tau = Math.max(0, T - T0);
    let z = (V0 / K) * (Math.exp(K * tau) - 1);
    DOWN.forEach((d, j) => (z += (0.3 + 0.15 * j) * OM.ease.outExpo(OM.prog(T, d, d + 0.18)))); // a lunge on each downbeat
    return z;
  };
  /** Focal length in px: the frame's half-width at depth 1, with a punch on each kick. */
  const focal = (T) => 900 * (1 + 0.035 * OM.pulse(KICKS.filter((k) => k <= T), T, 0.06));
  const SPB = OM.SPB;
  /**
   * The tunnel's rings: rectangles of lattice cells at whole-unit depths,
   * projected toward C. open scales the mouth (0 closed, 1 full); squeeze
   * collapses everything onto C; flash pushes the inks toward crest.
   */
  const rings = (ctx, dpr, T, { open = 1, squeeze = 0, flash = 0 } = {}) => {
    const z = Zc(T), F = focal(T) * open * (1 - squeeze);
    const tick = Math.floor((T - 227.55) / (SPB / 4)); // the hi-hat roll: a 16th-note shimmer
    const first = Math.floor(z) + 1;
    for (let k = first + 9; k >= first; k--) {
      const d = k - z;
      if (d < 0.35 || d > 9.5) continue;
      const hw = (1.06 * F) / d, hh = (0.6 * F) / d;
      if (hw < L.cw * 0.5) continue;
      const fade = OM.clamp((9.5 - d) / 3.5);
      const heat = OM.clamp(flash + squeeze * 0.8 + (d < 1.3 ? 0.6 : 0));
      ctx.fillStyle = heat > 0.55 ? ink.crest : d < 2.6 || heat > 0.3 ? ink.lit : d < 5 ? ink.mid : ink.dim;
      const c0 = Math.floor((C.x - hw - L.x0) / L.cw), c1 = Math.floor((C.x + hw - L.x0) / L.cw);
      const r0 = Math.floor((C.y - hh - L.y0) / L.ch), r1 = Math.floor((C.y + hh - L.y0) / L.ch);
      const on = (col, row) => OM.threshold(col, row) < fade * (0.9 - 0.25 * OM.hash(col, row, tick + k));
      const cA = Math.max(c0, L.cMin), cB = Math.min(c1, L.cMin + L.cols - 1);
      const rA = Math.max(r0, L.rMin), rB = Math.min(r1, L.rMin + L.rows - 1);
      for (let col = cA; col <= cB; col++) {
        if (r0 >= L.rMin && on(col, r0)) OM.cell(ctx, L, col, r0, dpr);
        if (r1 < L.rMin + L.rows && on(col, r1)) OM.cell(ctx, L, col, r1, dpr);
      }
      for (let row = rA + 1; row < rB; row++) {
        if (c0 >= L.cMin && on(c0, row)) OM.cell(ctx, L, c0, row, dpr);
        if (c1 < L.cMin + L.cols && on(c1, row)) OM.cell(ctx, L, c1, row, dpr);
      }
    }
  };
  /** The seam picture both scenes draw around 233.80: the open tunnel, nothing else. */
  const frame = (ctx, T, dpr) => {
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    rings(ctx, dpr, T);
  };
  // ---------- the section's camera: one function of T for both scenes ----------
  // x-b1 spins and zooms in with the vortex; it carries through the 233.80 cut,
  // punches on every x-b2 downbeat (the first one on the cut itself, as a lunge
  // forward), banks down the tunnel and comes to rest exactly as the spark lands.
  const BEGIN = 227.65, STOP = 243.153; // rest before x-b1's field cut and from x-b2's spark cut
  const punch = (t) => (t < 0 ? 0 : t < 0.05 ? OM.smooth(t / 0.05) : Math.exp(-(t - 0.05) / 0.25));
  const camAt = (T) => {
    const out = 1 - OM.smooth(OM.prog(T, 242.32, STOP));
    if (T <= BEGIN || out <= 0) return { zoom: 1, rot: 0, x: 0, y: 0 };
    const tilt = 0.09 * OM.smooth(OM.prog(T, BEGIN, 233.3)) - 0.06 * OM.smooth(OM.prog(T, 233.3, 235.6));
    const bank = 0.024 * Math.sin((2 * Math.PI * (T - 233.3)) / 4.272) * OM.smooth(OM.prog(T, 233.3, 234.4));
    const rot = (tilt + bank) * out;
    let rush = 0.07 * OM.smooth(OM.prog(T, BEGIN, 233.8));
    for (const d of DOWN) rush += (d === DOWN[4] ? 0.06 : 0.035) * punch(T - d);
    return { zoom: 1 + 1.9 * Math.abs(rot) + rush * out, rot, x: 0, y: 0 }; // 1.9|rot| covers the corners
  };
  OM.xb = { C, MW, MH, motifs, Zc, focal, rings, frame, KICKS, DOWN, camAt, onDrum };

  // ---------- x-b1 ----------
  OM.scene({
    id: 'x-b1',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Gravitational lensing: an Einstein ring around the eye, the vortex bent into it.
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
          vec2 R = vec2(1920.0, 1080.0), px = uv * R, d = px - uP0.xy;
          float r = max(length(d), 1.0), Re = uP0.z;
          float bend = min(Re * Re / r, 1.6 * r) * uAmount;
          vec4 c = src(cam((px - d / r * bend) / R));
          float ring = exp(-pow((r - Re) / (8.0 + 0.1 * Re), 2.0)) * uAmount * uP0.w;
          c.rgb += ring * vec3(0.733, 0.867, 0.592) * 0.45;
          c.rgb *= 1.0 - 0.55 * uAmount * smoothstep(0.42 * Re, 0.12 * Re, r);
          return c;
        }`,
      });
      const END = start + duration;
      // Every hit on the drum as measured: the downbeats at their onsets, the kicks and snares as hit.
      const BARS = [229.529, 231.665].map(OM.beatOnset); // downbeats: the vortex doubles its speed
      const SNARES = [227.904, 229.227, 231.224, 231.712, 233.361].map((t) => onDrum(t, 'snare'));
      const FORM = [228.252, 228.438, 228.786, 229.320, 229.901].map((t) => onDrum(t, 'kick')); // the five strong kicks: a motif forms on each
      // Swallowed on the beats and half-beats of the last bar (beats 2, 2.5, 3, 3.5 and 4, at their drum onsets).
      const B2 = OM.beatOnset(232.2), B3 = OM.beatOnset(232.734), B4 = OM.beatOnset(233.268);
      const EAT = [B2, (B2 + B3) / 2, B3, (B3 + B4) / 2, B4];
      const POP = SNARES[4], OPEN = 233.7;
      // The closing snare's camera punch: a quick push in on POP, exactly 0 again 0.25 s later (well before the cut).
      const popPunch = (T) => {
        const d = T - POP;
        if (d < -0.016 || d >= 0.25) return 0;
        if (d < 0) return 0.5 - 0.5 * Math.cos((Math.PI * (d + 0.016)) / 0.016);
        return (1 - d / 0.25) ** 3 * (1 + (3 * d) / 0.25);
      };
      // The field's swirl angle: speed doubling on each downbeat, integrated exactly.
      const swirl = (T) => {
        let a = 0, v = 0.5, t0 = start;
        for (const b of BARS) {
          if (T <= b) break;
          a += v * (b - t0); t0 = b; v *= 2;
        }
        return a + v * Math.max(0, T - t0);
      };
      const ramp = (T) => OM.smooth(OM.prog(T, start + 0.1, start + 0.9)); // the field starts to turn
      const drain = (T) => Math.pow(OM.prog(T, start + 0.1, POP), 7); // 0 the full field, 1 gone into the eye
      const R0 = 640, SQ = 0.52;
      // A motif's orbit radius (px) and angle, integrated numerically from its forming kick: pure in T.
      const orbit = (i, T) => {
        const u = OM.prog(T, FORM[i], EAT[i]);
        const R = R0 * (1 - OM.ease.inCubic(u));
        let a = (i / 5) * 2 * Math.PI + 0.8 * (FORM[i] - start);
        const dt = 1 / 240;
        for (let t = FORM[i]; t < T; t += dt) {
          const uu = OM.prog(t, FORM[i], EAT[i]);
          const rr = 1 - OM.ease.inCubic(uu);
          const bars = t >= BARS[1] ? 4 : t >= BARS[0] ? 2 : 1;
          a += Math.min(dt, T - t) * 0.8 * bars / (0.35 + rr);
        }
        return { R, a, u };
      };
      const memo = new Map(); // this frame's positions, so sorting and drawing integrate the orbit once
      const motifAt = (i, T) => {
        const key = i + ':' + T;
        if (memo.has(key)) return memo.get(key);
        const v = motifPos(i, T);
        memo.set(key, v);
        return v;
      };
      const motifPos = (i, T) => {
        const { R, a, u } = orbit(i, T);
        const x = C.x + R * Math.cos(a), y = C.y + R * SQ * Math.sin(a);
        const depth = Math.sin(a); // + toward camera
        const s = 1.85 * (0.5 + 0.5 * (R / R0)) * (1 + 0.1 * depth);
        return { x, y, s, rot: 0.18 * Math.sin(a * 1.3 + i) + u * u * u * 5 * (i % 2 ? -1 : 1), depth, u };
      };
      const drawMotif = (ctx, dpr, i, T) => {
        const age = T - FORM[i];
        if (age < 0 || T >= EAT[i]) return;
        const { x, y, s, rot } = motifAt(i, T);
        const mo = motifs()[i];
        const sz = s * L.cw, cr = Math.cos(-rot), sr = Math.sin(-rot);
        const rad = Math.hypot(MW, MH) * 0.5 * sz;
        const form = OM.prog(age, 0, 0.14), cool = (1.25 * age) / 0.7;
        const c0 = Math.floor((x - rad - L.x0) / L.cw), c1 = Math.floor((x + rad - L.x0) / L.cw);
        const r0 = Math.floor((y - rad - L.y0) / L.ch), r1 = Math.floor((y + rad - L.y0) / L.ch);
        for (let row = r0; row <= r1; row++)
          for (let col = c0; col <= c1; col++) {
            const dx = L.x0 + (col + 0.5) * L.cw - x, dy = L.y0 + (row + 0.5) * L.ch - y;
            const uu = (dx * cr - dy * sr) / sz + MW / 2, vv = (dx * sr + dy * cr) / sz + MH / 2;
            if (uu < 0 || vv < 0 || uu >= MW || vv >= MH) continue;
            const v = mo.m[(vv | 0) * MW + (uu | 0)];
            if (!v) continue;
            const th = OM.threshold((uu | 0) + i * 23, vv | 0);
            if (th > form) continue;
            ctx.fillStyle = v === 2 ? ink.crest : th > cool ? ink.crest : th > cool - 0.3 ? ink.hover : ink.lit;
            OM.cell(ctx, L, col, row, dpr);
          }
      };
      // A motif's trail: cells along the arc it just travelled.
      const drawTrail = (ctx, dpr, i, T) => {
        if (T - FORM[i] < 0.05 || T >= EAT[i]) return;
        for (let j = 1; j <= 14; j++) {
          const tt = T - j * 0.022;
          if (tt < FORM[i]) break;
          const p = motifAt(i, tt);
          const q = OM.cellAt(L, p.x, p.y);
          ctx.fillStyle = j < 5 ? ink.mid : ink.dim;
          for (const [dc, dr] of [[0, 0], [0, 1], [1, 0], [0, -1], [-1, 0]]) if (OM.hash(q.col + dc, q.row + dr, j) < 0.7 - j * 0.04) OM.cell(ctx, L, q.col + dc, q.row + dr, dpr);
        }
      };

      // Debris: shards spiralling in on accelerating log spirals, pure in T.
      const debris = (ctx, dpr, T, S0) => {
        const age = T - (start + 0.3);
        if (age <= 0) return;
        for (let n = 0; n < 48; n++) {
          const life = 1.1 + 0.9 * OM.hash(n, 5, 3), u = ((age / life + OM.hash(n, 6, 3)) % 1);
          const r = 1250 * Math.pow(1 - u, 1.8);
          if (r < 20) continue;
          const a = OM.hash(n, 7, 3) * 6.283 + S0 * 1.3 + 4 * u;
          const q = OM.cellAt(L, C.x + r * Math.cos(a), C.y + r * Math.sin(a) * 0.62);
          ctx.fillStyle = u > 0.7 ? ink.crest : n % 3 ? ink.lit : ink.hover;
          const big = n % 4 === 0 ? 1 : 0;
          for (let dr = 0; dr <= big; dr++) for (let dc = 0; dc <= big; dc++) OM.cell(ctx, L, q.col + dc, q.row + dr, dpr);
        }
      };
      const lensHits = [...FORM, ...BARS, ...EAT, POP];
      const draw = (t, T) => {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.1) return OM.handoff('field', ctx, T, dpr);
          if (T >= OPEN) return frame(ctx, T, dpr);
          memo.clear();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const D = drain(T), S0 = swirl(T) * ramp(T);
          const snare = OM.pulse(SNARES.filter((s) => s <= T), T, 0.13);
          const bar = OM.pulse(BARS.filter((b) => b <= T), T, 0.2);
          const kick = OM.pulse(FORM.filter((k) => k <= T), T, 0.08);

          // Motifs on the far half of their orbit go behind the field's disc.
          const order = NAMES.map((_, i) => i).filter((i) => T >= FORM[i] && T < EAT[i]);
          const far = order.filter((i) => motifAt(i, T).depth < 0), near = order.filter((i) => motifAt(i, T).depth >= 0);
          for (const i of order) drawTrail(ctx, dpr, i, T);
          for (const i of far) drawMotif(ctx, dpr, i, T);

          // The field, turned and drawn in: differential rotation winds it into spiral arms.
          if (D < 1) {
            const cells = OM.heroLit(T, L, { gain: 0.8 + 0.7 * ramp(T) }); // the field wakes as it turns
            for (const { col, row } of cells) {
              const x = L.x0 + (col + 0.5) * L.cw - C.x, y = L.y0 + (row + 0.5) * L.ch - C.y;
              const r = Math.hypot(x, y), phi = Math.atan2(y, x);
              const rr = r * (1 - D);
              if (rr < 10 && D > 0) continue;
              const ph = phi + S0 * (0.25 + 160 / (rr + 80));
              const q = OM.cellAt(L, C.x + rr * Math.cos(ph), C.y + rr * Math.sin(ph) * (1 - 0.12 * ramp(T)));
              const arm = (((3 * phi) / (2 * Math.PI) + r / 320) % 1 + 1) % 1;
              const hot = rr < 70 + 60 * D;
              ctx.fillStyle = hot && ramp(T) > 0.5 ? ink.lit : arm < 0.24 && snare > 0.35 ? ink.lit : arm < 0.07 * ramp(T) ? ink.lit : arm < 0.24 * ramp(T) ? ink.mid : ink.dim;
              OM.cell(ctx, L, q.col, q.row, dpr);
            }
          }
          // Dust riding the inflow, flickering on the hi-hat's 16ths.
          const tick = Math.floor((T - start) / (SPB / 4));
          ctx.fillStyle = ink.mid;
          for (let n = 0; n < 160; n++) {
            const life = 1.6, ph0 = OM.hash(n, 1, 7) * life;
            const u = (((T - start + ph0) / life) % 1);
            const r = (1 - u * u) * (600 + 500 * OM.hash(n, 2, 7)) * ramp(T);
            const a = OM.hash(n, 3, 7) * 6.283 + S0 * (1 + 2 * u);
            if (r < 8 || OM.hash(n, tick, 9) < 0.3) continue;
            const q = OM.cellAt(L, C.x + r * Math.cos(a), C.y + r * Math.sin(a) * SQ);
            OM.cell(ctx, L, q.col, q.row, dpr);
          }

          // Each downbeat: a crest ring implodes from the frame's edge onto the eye.
          for (const b of BARS) {
            const u = OM.prog(T, b, b + 0.42);
            if (u <= 0 || u >= 1) continue;
            const R = 1150 * Math.pow(1 - u, 1.6);
            ctx.fillStyle = ink.crest;
            const n = Math.ceil((2 * Math.PI * R) / (L.cw * 0.8));
            for (let k = 0; k < n; k++) {
              const a = (k / n) * 2 * Math.PI;
              const q = OM.cellAt(L, C.x + R * Math.cos(a), C.y + R * Math.sin(a) * 0.62);
              if (OM.threshold(q.col, q.row) < 1 - u * 0.6) OM.cell(ctx, L, q.col, q.row, dpr);
            }
          }

          debris(ctx, dpr, T, S0);
          for (const i of near) drawMotif(ctx, dpr, i, T);

          // The eye: a hot core that grows with what it has swallowed, flaring on every hit.
          const eaten = OM.pulse(EAT.filter((e) => e <= T), T, 0.1);
          const out = 1 - OM.prog(T, POP, OPEN);
          const glowA = out * OM.clamp(0.12 + 0.3 * D + 0.35 * Math.max(eaten, kick * 0.6, bar));
          const g = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, 90 + 120 * Math.max(eaten, bar));
          const [lr, lg, lb] = OM.rgb(ink.lit);
          g.addColorStop(0, `rgba(${lr},${lg},${lb},${glowA})`);
          g.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(C.x - 220, C.y - 220, 440, 440);
          ctx.fillStyle = ink.crest;
          const e = Math.round(eaten * 3 + bar * 2);
          if (T < POP) for (let dr = -e; dr <= e; dr++) for (let dc = -e; dc <= e; dc++) if (Math.abs(dc) + Math.abs(dr) <= e) OM.cell(ctx, L, h.col + dc, h.row + dr, dpr);

          // The closing snare: the eye flashes and opens into the tunnel's mouth.
          if (T >= POP) {
            const u = OM.prog(T, POP, OPEN);
            const flash = 1 - u;
            const fg = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, 700);
            fg.addColorStop(0, `rgba(${lr},${lg},${lb},${0.6 * flash})`);
            fg.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
            ctx.fillStyle = fg;
            ctx.fillRect(0, 0, 1920, 1080);
            rings(ctx, dpr, T, { open: OM.ease.outExpo(u), flash: flash * 0.8 });
          }
      };
      return {
        render(t, T) {
          draw(t, T);
          const hit = OM.pulse(lensHits.filter((x) => x <= T), T, 0.12);
          const grow = OM.prog(T, start, POP);
          const amount = OM.post.envelope(T, start, END, { ramp: 0.4, hold: 0.07 }) * (0.45 + 0.55 * grow);
          const cam = OM.edit.apply(camAt(T), { zoom: 0.04 * popPunch(T), x: 0, y: 0, rot: 0 });
          fx.apply(T, { amount, cam, p0: [C.x, 1080 - C.y, 55 + 150 * grow * grow + 70 * hit, 0.5 + 1.2 * hit] });
        },
        release: () => { fx.release(); c.release(); },
      };
    },
  });
})();
