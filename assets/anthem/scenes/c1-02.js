OM.ownWords.add('c1-02'); // this scene draws its own words, so the caption bar stays out
// c1-02 · Exploded view. A laptop hangs [line] as a technical
// illustration: lid, panel, bezel, deck, board and case pulled apart along
// their assembly axes, leader lines between them and phantom lines in the
// deck where parts are missing. It condenses out of the glow it cuts in on.
// Every sung word is one of the missing parts: a key row whose keycaps carry
// the word's letters drops down its assembly axis and locks into the deck on
// the onset, a crest flash running out from the seam through the deck's
// lattice. Each lock ratchets the machine a notch tighter while the camera
// cranes in with the roll. On the held key word the last row lands, the halves
// slam shut and it powers on: the panel's lattice wakes, the homepage field
// sweeps up it from the backlight in dither order, and the camera swings round
// into the screen until the field is the frame.
// Edit camera: the key word's slam is the scene's own crash zoom and shake, so the camera's
// backbeat jolt 95 ms after it (87.118, a bare hat) is skipped; the rest runs at the defaults.
OM.edit.plan('c1-02', { skip: [87.12] });
(() => {
  const TYPE = "'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['c1-02-type'] = document.fonts.load(`800 64px ${TYPE}`);

  const DEG = Math.PI / 180;
  const { clamp, lerp, prog, smooth, ease } = OM;
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const unit = (a) => scl(a, 1 / Math.hypot(a[0], a[1], a[2]));
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };

  // ---- the machine, in world units: x right, y up, z toward the viewer, the base centred on the origin ----
  const W = 1008, D = 700, X0 = -W / 2, Z0 = -D / 2;
  const Y_DECK = 22, Y_TOP = 32; // the case is 0..22, the deck 22..32
  const TH = 110 * DEG; // lid opening: leaned back so the screen faces the reading camera, near 16:9 on the frame
  const UP = [0, Math.sin(TH), Math.cos(TH)]; // up the lid
  const OUT = [0, -Math.cos(TH), Math.sin(TH)]; // out of the screen
  const LID = 640; // the 960 x 540 panel sits at t 56..596: at scale 2, seen square on, it is the frame
  const lidPt = (x, t, n) => [x, Y_TOP + t * UP[1] + n * OUT[1], Z0 + t * UP[2] + n * OUT[2]];
  const DISP_TL = lidPt(-480, 596, -3); // the panel's top-left corner: the frame's (0, 0) at the end
  const DISP_C = lidPt(0, 326, -3);
  const READ_PITCH = 45; // the camera's elevation while the whole line reads: screen and deck both in true proportion
  const STRETCH = 1 / Math.sin(READ_PITCH * DEG); // legends are cut tall on the deck so they read upright from the reading elevation

  /** Orthographic camera: the machine turned by yaw, seen from `pitch` above, `s` px per unit, `tg` at the frame centre. */
  const camera = (s, pitch, yaw, tg, dy) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const tx = tg[0] * cy + tg[2] * sy, tu = tg[1] * cp - (-tg[0] * sy + tg[2] * cy) * sp;
    return {
      s, sy, cp,
      x: (p) => 960 + s * (p[0] * cy + p[2] * sy - tx),
      y: (p) => 540 + dy - s * (p[1] * cp - (-p[0] * sy + p[2] * cy) * sp - tu),
      lin: (v) => [s * (v[0] * cy + v[2] * sy), -s * (v[1] * cp - (-v[0] * sy + v[2] * cy) * sp)],
      faces: (n) => n[1] * sp + (-n[0] * sy + n[2] * cy) * cp > 1e-4,
    };
  };
  /** Set the canvas transform to a plane: local x along U, local y along V (world vectors per local unit), origin O. */
  const plane = (ctx, K, dpr, O, U, V) => {
    const u = K.lin(U), v = K.lin(V);
    ctx.setTransform(dpr * u[0], dpr * u[1], dpr * v[0], dpr * v[1], dpr * K.x(O), dpr * K.y(O));
  };

  // Box faces as corner indices (corner k = o + (k & 1) a + (k >> 1 & 1) b + (k >> 2) c): -a, +a, -b, +b, -c, +c.
  const FACES = [[0, 4, 6, 2], [1, 3, 7, 5], [0, 1, 5, 4], [2, 6, 7, 3], [0, 2, 3, 1], [4, 5, 7, 6]];
  const TOP = 3, FRONT = 5;
  const LIGHT = unit([-0.4, 0.85, 0.35]);

  /** The homepage glow, as handoff.js paints it, at any strength. */
  const glow = (ctx, lit, a) => {
    const [r, g, b] = OM.rgb(lit);
    const gr = ctx.createRadialGradient(960, 540, 0, 960, 540, 620);
    gr.addColorStop(0, `rgba(${r},${g},${b},${a})`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(340, -80, 1240, 1240);
  };

  OM.scene({
    id: 'c1-02',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // The X-ray: a technical view in the theme's blues (faces translucent, edges drawn as light, a faint
      // drafting grid), the green light of the keys and seams kept as it is; at power-on a scan bar runs up
      // the frame and flips it to the real render.
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 b = src(q);
  if (uAmount <= 0.0) return b;
  vec2 px = 1.6 / uRes;
  vec3 w = vec3(0.333);
  float gx = dot(src(q + vec2(px.x, 0.0)).rgb - src(q - vec2(px.x, 0.0)).rgb, w);
  float gy = dot(src(q + vec2(0.0, px.y)).rgb - src(q - vec2(0.0, px.y)).rgb, w);
  float edge = clamp(length(vec2(gx, gy)) * 7.0, 0.0, 1.0);
  float l = dot(b.rgb, vec3(0.3, 0.59, 0.11));
  vec2 g = fract(q * uRes / (uRes.y / 1080.0 * 48.0));
  float grid = max(step(g.x, 0.03), step(g.y, 0.03));
  vec3 xr = vec3(0.075, 0.078, 0.110) + vec3(0.255, 0.282, 0.408) * (0.9 * smoothstep(0.03, 0.2, l) + 0.18 * grid)
          + vec3(0.753, 0.792, 0.961) * edge * 0.85;
  float keep = smoothstep(0.38, 0.55, b.g) * step(b.b + 0.06, b.g);
  xr = mix(xr, b.rgb, keep);
  float above = smoothstep(uP0.x - 0.004, uP0.x + 0.004, uv.y);
  vec3 c = mix(b.rgb, xr, above * uAmount);
  float bar = exp(-pow((uv.y - uP0.x) / 0.006, 2.0)) * uP0.y;
  return vec4(mix(c, vec3(0.855, 0.925, 0.776), clamp(bar, 0.0, 0.9)), 1.0);
}`,
      });
      const ink = OM.fieldInks('tokyo-night');
      const END = start + duration;
      const IN_END = start + 0.07, OUT_AT = END - 0.075; // a couple of 30 fps frames on each handoff

      // ---- the music ----
      const sung = OM.sung('c1-02');
      const on = sung.map((w) => w.t0);
      const N = on.length, KEY = N - 1, SLAM = on[KEY];
      // A hit on the drum as measured on the song (OM.T.drums), the nearest within 50 ms.
      const onDrum = (t, kind) => OM.edit.hits(kind, t - 0.05, t + 0.05).reduce((m, h) => (m === null || Math.abs(h[0] - t) < Math.abs(m - t) ? h[0] : m), null) ?? t;
      const KICKS = [85.52, 85.91, 86.59].map((t) => onDrum(t, 'kick'));
      const [LIT_ON, LIT_FULL, GO] = [87.4, 87.8, 88.19].map((t) => onDrum(t, 'snare')); // snares: the field sweeps up, it is full, the push
      const RIPPLE = onDrum(88.47, 'kick');
      const ed = OM.edit.scene(start, END); // its clock: the slow float and sway surge through each beat

      // ---- inks ----
      // Clean dark bodies in the theme's surfaces (no green wash), their edges lit green.
      const TK = OM.theme('tokyo-night');
      const FACE_LO = TK['bg-deep'], FACE_HI = TK['surface-2'];
      const EDGE = OM.mix(ink.mid, ink.lit, 0.5), KEY_EDGE = ink.mid, GLASS = OM.mix(ink.bg, '#000000', 0.25);
      const RANK = [ink.mid, ink.lit, ink.hover, ink.crest];
      const rank = (I) => RANK[I > 0.62 ? 3 : I > 0.4 ? 2 : I > 0.22 ? 1 : 0];

      const mkBox = (o, a, b, cc) => {
        const na = unit(a), nb = unit(b), nc = unit(cc);
        const fn = [scl(na, -1), na, scl(nb, -1), nb, scl(nc, -1), nc];
        return { o, a, b, c: cc, fn, tone: fn.map((n) => OM.mix(FACE_LO, FACE_HI, Math.max(0, dot(n, LIGHT)))) };
      };
      const aabb = (x0, y0, z0, x1, y1, z1) => mkBox([x0, y0, z0], [x1 - x0, 0, 0], [0, y1 - y0, 0], [0, 0, z1 - z0]);
      const lidBox = (x0, x1, t0, t1, n0, n1) => mkBox(lidPt(x0, t0, n0), [x1 - x0, 0, 0], scl(UP, t1 - t0), scl(OUT, n1 - n0));

      // ---- parts ----
      const CASE = aabb(X0, 0, Z0, X0 + W, Y_DECK, Z0 + D);
      const BOARD = aabb(X0 + 44, 8, Z0 + 40, X0 + W - 44, 12, Z0 + D - 40);
      const DECK = aabb(X0, Y_DECK, Z0, X0 + W, Y_TOP, Z0 + D);
      DECK.tone[TOP] = OM.mix(FACE_LO, FACE_HI, 0.6);
      const COVER = lidBox(X0, X0 + W, 0, LID, -14, -7);
      const PANEL = lidBox(-480, 480, 56, 596, -7, -3);
      PANEL.tone[FRONT] = GLASS;
      const BEZEL = [lidBox(X0, -480, 0, LID, -3, 0), lidBox(480, X0 + W, 0, LID, -3, 0), lidBox(-480, 480, 0, 56, -3, 0), lidBox(-480, 480, 596, LID, -3, 0)];

      // The board's chips and traces, as lattice cells on its top face (24-unit grid).
      const GB = 24, chips = [];
      {
        const rng = OM.rng(1202);
        const blk = (i0, j0, w, h, k) => { for (let j = j0; j < j0 + h; j++) for (let i = i0; i < i0 + w; i++) chips.push([i, j, k]); };
        blk(17, 4, 5, 5, 1); blk(18, 5, 3, 3, 2); // the processor
        blk(25, 3, 10, 1, 0); blk(25, 5, 10, 1, 0); // memory
        blk(5, 14, 27, 1, 0); blk(5, 22, 27, 1, 0); blk(5, 15, 1, 7, 0); blk(31, 15, 1, 7, 0); // the battery's outline
        blk(8, 17, 3, 3, 1); blk(12, 17, 3, 3, 1); blk(16, 17, 3, 3, 1); // its cells
        for (let n = 0; n < 6; n++) { // traces walking out of the processor
          let i = 17 + Math.floor(rng() * 5), j = rng() < 0.5 ? 3 : 9;
          const dj = j === 3 ? -1 : 1;
          for (let s = 0; s < 4 + Math.floor(rng() * 6); s++) {
            chips.push([i, j, 0]);
            if (rng() < 0.4) i += rng() < 0.5 ? -1 : 1; else j += dj;
            if (j < 0 || j > 25) break;
          }
        }
      }

      // ---- the keyboard: one row per sung word, its letters on tight keycap tiles so each row reads as the word ----
      const glyphs = sung.map((w) => [...w.text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toUpperCase()]);
      const maxLen = glyphs.reduce((m, g) => Math.max(m, g.length), 1);
      const fk = Math.min(1, 940 / (maxLen * 72), 650 / (N * (76 * STRETCH + 20))); // shrinks only for very long words or many rows
      const TP = 72 * fk, GX = 5 * fk; // tile pitch along a row: about one letter's advance
      const CAP_W = 76 * fk; // cap height on the deck, before the stretch
      const TD = CAP_W * STRETCH + 14 * fk, RP = TD + 6 * fk; // tile depth, row pitch
      const HK = 11 * fk, BW = maxLen * TP, bx0 = -BW / 2, kz0 = Z0 + 24; // the block is centred, its rows ranged left
      const KEYCAP = aabb(0, 0, 0, TP - GX, HK, TD);
      const FONT_PX = Math.round(CAP_W / 0.73), FONT = `800 ${FONT_PX}px ${TYPE}`;
      const mc = document.createElement('canvas').getContext('2d');
      mc.font = FONT;
      const capH = (document.fonts.check(FONT) && mc.measureText('H').actualBoundingBoxAscent) || 0.73 * FONT_PX;

      // ---- the camera: the whole machine stays in frame, wide while exploded, square on to it for the read, then into the screen ----
      const RPH = READ_PITCH * DEG;
      const upAt = (p) => p[1] * Math.cos(RPH) - p[2] * Math.sin(RPH);
      const upTop = upAt(lidPt(0, LID, -14)), upBot = upAt([0, 0, Z0 + D]);
      const READ_S = Math.min(1, 990 / (upTop - upBot)); // the assembled laptop, lid to front edge, fills the frame's height
      const READ_T = [0, Y_TOP, (Y_TOP * Math.cos(RPH) - (upTop + upBot) / 2) / Math.sin(RPH)];
      const KEYS = [
        // [time, scale, pitch, yaw, target]
        [IN_END, 0.5, 35, -20, [0, 195, -40]],
        [IN_END + 0.45, 0.58, 37, -18, [0, 185, -40]],
        [SLAM, 0.64, 46, -8, [0, 175, -60]],
        [SLAM + 0.36, READ_S, READ_PITCH, 0, READ_T],
        [GO, READ_S * 1.015, READ_PITCH, 0, add(READ_T, [0, 8, 0])],
        [OUT_AT, 2, TH / DEG - 90, 0, DISP_C], // square on to the panel: it is the frame
      ];
      const SEG = [ease.outCubic, ease.inOutSine, ease.outExpo, ease.inOutSine, ease.inOutCubic];
      const camAt = (T, dy = 0) => {
        let i = 0;
        while (i < KEYS.length - 2 && T >= KEYS[i + 1][0]) i++;
        const A = KEYS[i], B = KEYS[i + 1], q = SEG[i](prog(T, A[0], B[0]));
        const drift = 1 - smooth(prog(T, SLAM - 0.2, SLAM + 0.25)); // the slow float stops once it is assembled: the rows read straight
        const s = Math.exp(lerp(Math.log(A[1]), Math.log(B[1]), q));
        const tc = ed.clock(T) - start;
        const pitch = lerp(A[2], B[2], q) + 0.8 * drift * Math.sin(0.55 * tc + 1);
        const yaw = lerp(A[3], B[3], q) + 1.4 * drift * Math.sin(0.7 * tc);
        return camera(s, pitch * DEG, yaw * DEG, [0, 1, 2].map((j) => lerp(A[4][j], B[4][j], q)), dy);
      };

      // ---- the rows' flights: each drops from above the frame and lands on its onset ----
      const rows = glyphs.map((g, k) => {
        const fall = k === 0 ? 0.12 : k === KEY ? 0.13 : clamp(0.5 * (on[k] - on[k - 1]), 0.1, 0.15);
        const z0 = kz0 + k * RP, w = g.length * TP;
        const K = camAt(on[k] - fall);
        const low = Math.max(K.y([bx0, Y_TOP, z0 + RP]), K.y([bx0 + Math.max(w, TP), Y_TOP, z0 + RP]));
        return { k, z0, w, fall, H: (low + 40) / (K.s * K.cp) + HK, keys: g.map((ch, i) => ({ x0: bx0 + i * TP + GX / 2, ch })) };
      });

      /** The machine pulled apart: 1 fully exploded, 0 assembled. */
      const explodeAt = (T) => {
        let e = 0.8 + 0.2 * ease.outCubic(prog(T, IN_END, IN_END + 0.4));
        for (let k = 0; k < KEY; k++) e -= 0.065 * ease.outExpo(prog(T, on[k], on[k] + 0.14)); // each lock ratchets it tighter
        e += 0.07 * smooth(prog(T, SLAM - 0.36, SLAM - 0.13)); // wind-up
        e *= 1 + 0.045 * OM.pulse(KICKS, T, 0.09); // the loose parts jolt on the kicks
        return e * (1 - ease.inCubic(prog(T, SLAM - 0.13, SLAM))); // the halves slam shut
      };
      const shakeAt = (T) => {
        let y = 0;
        for (let k = 0; k < KEY; k++) if (T >= on[k]) y += 4 * Math.exp(-(T - on[k]) / 0.08);
        if (T >= SLAM) y += 11 * Math.exp(-(T - SLAM) / 0.1) * Math.cos((T - SLAM) * 38);
        return y;
      };

      // ---- the panel's power-on: the field sweeps up from the backlight, dithered, behind a crest front ----
      const H0 = OM.HOME, HC = H0.cols, HR = H0.rows;
      const sweepKey = new Float32Array(HC * HR), cellTh = new Float32Array(HC * HR);
      for (let r = 0; r < HR; r++)
        for (let q = 0; q < HC; q++) {
          const col = H0.cMin + q, row = H0.rMin + r;
          const y = H0.y0 + (row + 0.5) * H0.ch;
          cellTh[r * HC + q] = OM.threshold(col, row);
          sweepKey[r * HC + q] = 0.8 * clamp(1 - y / 1080) + 0.2 * cellTh[r * HC + q];
        }
      let sweep = 0;
      const mask = (col, row) => (sweepKey[(row - H0.rMin) * HC + (col - H0.cMin)] < sweep ? 1 : 0);

      const drawScreen = (ctx, K, dpr, off, T) => {
        if (T < SLAM) return;
        ctx.save();
        plane(ctx, K, dpr, add(DISP_TL, off), [0.5, 0, 0], scl(UP, -0.5));
        ctx.beginPath();
        ctx.rect(0, 0, 1920, 1080);
        ctx.clip();
        const warm = smooth(prog(T, SLAM + 0.03, LIT_ON));
        ctx.fillStyle = OM.mix(GLASS, ink.bg, warm);
        ctx.fillRect(0, 0, 1920, 1080);
        sweep = 1.25 * ease.inOutSine(prog(T, LIT_ON, LIT_FULL));
        if (T >= LIT_ON) OM.hero(ctx, T, dpr, { inks: ink, L: H0, word: false, gain: 0.8, bg: false, mask: T < LIT_FULL ? mask : null });
        const on2 = T >= LIT_FULL ? 0.45 * Math.exp(-(T - LIT_FULL) / 0.1) : 0;
        if (T < LIT_FULL + 0.35) {
          // Ahead of the sweep the panel's lattice wakes in sparse dim cells; behind its front the light cools,
          // crest to mid, in dither order; when it is through, the whole panel flashes on.
          for (let r = 0; r < HR; r++)
            for (let q = 0; q < HC; q++) {
              const i = r * HC + q, th = cellTh[i], f = sweep - sweepKey[i];
              let fill = null;
              if (f < 0) {
                if (th < 0.09 * warm) fill = ink.dim;
              } else {
                const I = Math.max(Math.exp(-f / 0.16), on2);
                if (I > th) fill = rank(I);
              }
              if (!fill) continue;
              ctx.fillStyle = fill;
              OM.cell(ctx, H0, H0.cMin + q, H0.rMin + r, dpr);
            }
        }
        ctx.restore();
      };

      // ---- the deck's surface: the keyboard well, phantom lines for missing rows, and the seams' crest light in its lattice ----
      const G = 24, GC = Math.ceil(W / G), GR = Math.ceil(D / G);
      const light = new Float32Array(GC * GR);
      const halo = (a, life, i0, j0, i1, j1, reach, ring) => {
        if (a < 0 || a >= life) return;
        const fade = Math.pow(1 - a / life, 2), R = 1 + reach * ease.outExpo(a / (life * 0.8)), flash = a < 0.2 ? Math.exp(-a / 0.07) : 0;
        for (let j = Math.max(0, Math.floor(j0 - R)); j < Math.min(GR, Math.ceil(j1 + R)); j++)
          for (let i = Math.max(0, Math.floor(i0 - R)); i < Math.min(GC, Math.ceil(i1 + R)); i++) {
            const d = Math.max(i0 - i - 1, i - i1, j0 - j - 1, j - j1, 0);
            const I = ring ? (d === 0 ? flash : fade * clamp(1 - Math.abs(d - R) / 2.5)) : fade * clamp(1 - d / R);
            if (I > light[j * GC + i]) light[j * GC + i] = I;
          }
      };
      const deckSurface = (ctx, K, dpr, off, T, m) => {
        ctx.save();
        plane(ctx, K, dpr, [0, Y_TOP + off[1], 0], [1, 0, 0], [0, 0, 1]);
        const px = 1 / K.s;
        // Seam light: each lock spills crest out of its row's seam through the deck's lattice; the slam floods it.
        light.fill(0);
        const gi = (x) => (x - X0) / G, gj = (z) => (z - Z0) / G;
        for (let k = 0; k < N; k++) {
          const a = T - on[k];
          if (k === KEY) halo(a, 0.5, gi(bx0), gj(kz0), gi(bx0 + BW), gj(kz0 + N * RP), 16, true);
          else if (rows[k].w) halo(a, 0.45, gi(bx0), gj(rows[k].z0), gi(bx0 + rows[k].w), gj(rows[k].z0 + RP), 7, false);
        }
        const gap = 0.12 * G;
        for (let j = 0; j < GR; j++)
          for (let i = 0; i < GC; i++) {
            const I = light[j * GC + i];
            if (I <= 0 || I <= OM.threshold(i, j)) continue;
            ctx.fillStyle = rank(I);
            ctx.fillRect(X0 + i * G + gap, Z0 + j * G + gap, G - 2 * gap, G - 2 * gap);
          }
        // The keyboard well the rows drop into.
        ctx.globalAlpha = m;
        ctx.strokeStyle = KEY_EDGE;
        ctx.lineWidth = 1.2 * px;
        ctx.strokeRect(bx0 - 14, kz0 - 10, BW + 28, N * RP + 16);
        // Phantom lines (long, short, short) where rows are still missing; they brighten as a row drops.
        ctx.setLineDash([16 * px, 5 * px, 3 * px, 5 * px, 3 * px, 5 * px]);
        ctx.lineWidth = 1.3 * px;
        for (const r of rows) {
          if (T >= on[r.k]) continue;
          ctx.strokeStyle = T >= on[r.k] - r.fall ? ink.lit : ink.mid;
          ctx.strokeRect(bx0 + 3, r.z0 + 3, BW - 6, RP - 6);
        }
        ctx.setLineDash([]);
        // The seam itself flashes crest on the lock.
        ctx.strokeStyle = ink.crest;
        ctx.lineWidth = 2.4 * px;
        for (const r of rows) {
          const a = T - on[r.k];
          if (a < 0 || a > 0.4 || !r.w) continue;
          ctx.globalAlpha = Math.exp(-a / 0.1);
          ctx.strokeRect(bx0, r.z0, r.w, RP);
        }
        ctx.restore();
      };

      /** Paint a box's visible faces: fill, surface detail (`face(f)`), then edges. hb scales the b edge (a keycap's travel). */
      const SX = new Float64Array(8), SY = new Float64Array(8);
      const trace = (ctx, q) => {
        ctx.beginPath();
        ctx.moveTo(SX[q[0]], SY[q[0]]);
        ctx.lineTo(SX[q[1]], SY[q[1]]);
        ctx.lineTo(SX[q[2]], SY[q[2]]);
        ctx.lineTo(SX[q[3]], SY[q[3]]);
        ctx.closePath();
      };
      const drawBox = (ctx, K, bx, off, st, face = null, hb = 1) => {
        const { o, a, b, c: cc } = bx;
        for (let k = 0; k < 8; k++) {
          const i = k & 1, j = ((k >> 1) & 1) * hb, l = k >> 2;
          const p = [o[0] + off[0] + i * a[0] + j * b[0] + l * cc[0], o[1] + off[1] + i * a[1] + j * b[1] + l * cc[1], o[2] + off[2] + i * a[2] + j * b[2] + l * cc[2]];
          SX[k] = K.x(p);
          SY[k] = K.y(p);
        }
        for (let f = 0; f < 6; f++) {
          if (!K.faces(bx.fn[f])) continue;
          const q = FACES[f];
          if (st.fa > 0) {
            trace(ctx, q);
            ctx.globalAlpha = st.fa;
            ctx.fillStyle = st.top && f === TOP ? st.top : bx.tone[f];
            ctx.fill();
            ctx.globalAlpha = 1;
            if (face) face(f);
          }
          if (st.ea > 0) {
            trace(ctx, q);
            ctx.globalAlpha = st.ea;
            ctx.strokeStyle = st.edge;
            ctx.lineWidth = st.lw;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      };
      /** A part condensing out of the glow: edges of light first, then its body; every edge rings crest on the slam. */
      const style = (m, fl) => ({
        fa: smooth(prog(m, 0.3, 1)),
        ea: clamp(m * 3),
        edge: m < 1 ? OM.mix(ink.crest, EDGE, smooth(m)) : fl > 0.01 ? OM.mix(EDGE, ink.crest, fl) : EDGE,
        lw: 1.5,
      });

      /** One key row: keycaps (pressed down a little on the lock) and their legends. */
      const drawRow = (ctx, K, dpr, r, yo, T, m) => {
        const a = T - on[r.k];
        // Pause sprinkle, keyboard ripple: the 88.486 kick runs a press down the rows, back to front.
        const rk = T - RIPPLE - 0.035 * r.k, rip = rk >= 0 && rk < 0.3 ? Math.exp(-rk / 0.07) : 0;
        const hb = (a >= 0 ? 1 - 0.4 * Math.exp(-a / 0.06) : 1) - 0.3 * rip;
        const flash = a >= 0 ? Math.exp(-a / 0.12) : 0;
        const legend = a < 0 ? ink.lit : a < 0.1 || r.k === KEY || rip > 0.3 ? ink.crest : OM.mix(ink.crest, ink.hover, smooth(prog(a, 0.1, 0.6)));
        const lit = { fa: m, ea: m, edge: flash > 0.01 ? OM.mix(KEY_EDGE, ink.crest, flash) : KEY_EDGE, lw: 1, top: flash > 0.01 ? OM.mix(KEYCAP.tone[TOP], ink.mid, 0.8 * flash) : null };
        const u = [1, 0, 0], v = [0, 0, 1];
        const keys = K.sy < 0 ? r.keys : [...r.keys].reverse(); // far side first
        for (const key of keys) {
          const y = Y_TOP + yo;
          drawBox(ctx, K, KEYCAP, [key.x0, y, r.z0 + 3 * fk], lit, null, hb);
          plane(ctx, K, dpr, [key.x0 + (TP - GX) / 2, y + HK * hb, r.z0 + 3 * fk + TD / 2], u, v);
          ctx.scale(1, STRETCH);
          ctx.globalAlpha = m;
          ctx.fillStyle = legend;
          ctx.fillText(key.ch, 0, capH / 2);
          ctx.globalAlpha = 1;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
      };

      // ---- camera and effect: a slow turntable sway while it is apart, a crash zoom on the slam ----
      const FLIP = 0.12; // the scan bar's run up the frame, from the slam
      const look = (T) => {
        const e = OM.post.envelope(T, start, END, { ramp: 0.45, hold: 0.07 });
        const sway = e * (1 - smooth(prog(T, SLAM - 0.5, SLAM - 0.05)));
        const tc = ed.clock(T) - start;
        const rot = -1.6 * DEG * sway * Math.sin(0.8 * tc + 0.6);
        const x = 36 * sway * Math.sin(0.55 * tc - 0.4);
        const a = T - SLAM;
        const crash = a < 0 ? 0 : 0.1 * ease.outCubic(clamp(a / 0.05)) * Math.exp(-Math.max(0, a - 0.05) / 0.3);
        const zoom = (1 + crash * e) * OM.c1.cover(rot, x, 0);
        const scan = -0.1 + 1.2 * prog(T, SLAM, SLAM + FLIP);
        const amount = e * (T < SLAM + FLIP ? 1 : 0);
        return { amount, cam: { zoom, rot, x, y: 0 }, p0: [scan, T >= SLAM ? 1 : 0, 0, 0] };
      };
      // ---- extras: assembly sparks off each row's seam as it locks, a ring of them on the slam ----
      const sparks = (ctx, T) => {
        for (let k = 0; k < N; k++) {
          const a = T - on[k];
          if (a < 0 || a > 0.6 || !rows[k].w) continue;
          const K = camAt(on[k]);
          const big = k === KEY, z = big ? kz0 + N * RP : rows[k].z0 + RP;
          for (const side of [0, 1]) {
            const p = [side ? bx0 + (big ? BW : rows[k].w) : bx0, Y_TOP, z];
            OM.c1.burst(T, on[k], big ? 26 : 12, 0xc102 + k * 2 + side, { x: K.x(p), y: K.y(p), speed: big ? 700 : 420, spread: 2.2, dir: side ? -0.6 : -Math.PI + 0.6, g: 1400, life: big ? 0.6 : 0.4 }, (x, y, u) => {
              ctx.globalAlpha = 1 - u * u;
              ctx.fillStyle = u < 0.35 ? ink.crest : u < 0.7 ? ink.hover : ink.lit;
              ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
            });
          }
        }
        ctx.globalAlpha = 1;
      };

      return OM.c1.post({
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < IN_END) return OM.handoff('glow', ctx, T, dpr);
          if (T >= OUT_AT) return OM.handoff('field', ctx, T, dpr);
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          // The glow the machine condenses out of.
          const g = 1 - smooth(prog(T, IN_END, IN_END + 0.55));
          if (g > 0.003) glow(ctx, ink.lit, 0.5 * g);

          const K = camAt(T, shakeAt(T));
          const E = explodeAt(T);
          const em = (d) => prog(T, IN_END + d, IN_END + d + 0.2);
          const fl = T >= SLAM ? Math.exp(-(T - SLAM) / 0.14) : 0;
          const bob = (ph) => E * 6 * Math.sin(T * 2.3 + ph);
          const lift = scl(UP, 60 * E);
          const offBezel = add(lift, [0, bob(0.4), 0]);
          const offPanel = add(add(lift, OUT, -85 * E), [0, bob(1.7), 0]);
          const offCover = add(add(lift, OUT, -170 * E), [0, bob(2.9), 0]);
          const offDeck = [0, bob(0), 0];
          const offBoard = [0, -200 * E + bob(2.2), 0];
          const offCase = [0, -400 * E + bob(3.3), 0];

          // Leader lines along the assembly axes, behind everything: they show in the gaps.
          if (E > 0.01) {
            ctx.setLineDash([9, 6]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = rgba(ink.mid, 0.6 * clamp(E * 2.5) * em(0.05));
            ctx.beginPath();
            for (const [x, z] of [[X0, Z0], [X0 + W, Z0], [X0, Z0 + D], [X0 + W, Z0 + D]]) {
              const a = [x, Y_DECK + offDeck[1], z], b = [x, Y_DECK + offCase[1], z];
              ctx.moveTo(K.x(a), K.y(a));
              ctx.lineTo(K.x(b), K.y(b));
            }
            for (const [x, tt] of [[X0, 0], [X0 + W, 0], [X0, LID], [X0 + W, LID]]) {
              const a = add(lidPt(x, tt, 0), offBezel), b = add(lidPt(x, tt, -14), offCover);
              ctx.moveTo(K.x(a), K.y(a));
              ctx.lineTo(K.x(b), K.y(b));
            }
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // The lid: cover, panel, bezel, back to front.
          drawBox(ctx, K, COVER, offCover, style(em(0.07), fl));
          drawBox(ctx, K, PANEL, offPanel, style(em(0.05), fl), (f) => f === FRONT && drawScreen(ctx, K, dpr, offPanel, T));
          const sb = style(em(0.03), fl);
          for (const b of BEZEL) drawBox(ctx, K, b, offBezel, sb);
          // The power light on the chin.
          {
            const q = [[-9, 22], [9, 22], [9, 32], [-9, 32]].map(([x, tt]) => add(lidPt(x, tt, 0.5), offBezel));
            ctx.beginPath();
            q.forEach((p, i) => (i ? ctx.lineTo(K.x(p), K.y(p)) : ctx.moveTo(K.x(p), K.y(p))));
            ctx.closePath();
            ctx.globalAlpha = em(0.03);
            ctx.fillStyle = T >= SLAM ? ink.crest : ink.dim;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // The base: case, board (only while it is out in the air), deck with its surface.
          drawBox(ctx, K, CASE, offCase, style(em(0.08), fl));
          if (E > 0.03) {
            const mb = em(0.05);
            drawBox(ctx, K, BOARD, offBoard, style(mb, fl), (f) => {
              if (f !== TOP) return;
              ctx.save();
              plane(ctx, K, dpr, add(BOARD.o, add(offBoard, [0, 4, 0])), [1, 0, 0], [0, 0, 1]);
              ctx.globalAlpha = smooth(mb);
              for (const [i, j, k] of chips) {
                ctx.fillStyle = k === 2 ? ink.lit : k === 1 ? ink.mid : ink.dim;
                ctx.fillRect(i * GB + 3, j * GB + 3, GB - 6, GB - 6);
              }
              ctx.restore();
            });
          }
          const md = em(0);
          drawBox(ctx, K, DECK, offDeck, style(md, fl), (f) => f === TOP && deckSurface(ctx, K, dpr, offDeck, T, md));

          // Key rows: landed ones back to front, then the one in the air.
          ctx.font = FONT;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          let falling = null;
          for (const r of rows) {
            if (T >= on[r.k]) drawRow(ctx, K, dpr, r, offDeck[1], T, md);
            else if (T >= on[r.k] - r.fall) falling = r;
          }
          if (falling) {
            const q = prog(T, on[falling.k] - falling.fall, on[falling.k]);
            drawRow(ctx, K, dpr, falling, offDeck[1] + falling.H * (1 - Math.pow(q, 2.2)), T, 1);
          }
          ctx.textAlign = 'left';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          sparks(ctx, T);
        },
        release: () => c.release(),
      }, fx, look);
    },
  });
})();
