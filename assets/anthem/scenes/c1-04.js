// c1-04 · The first viewer. It opens inside the homepage, on the wordmark, and
// the first two sung words light up in the field above it. Through the snare
// roll the camera pulls back: the field is a laptop screen at night, angled
// toward its owner, a friend's shoulder in the foreground. Off the downbeat the
// owner reaches over and turns the laptop to the friend; the homepage dithers
// away and the rest of the line lands on the screen, one word per onset. The
// words are the only light in the room: each one that lands brightens the rim
// light on both faces, and on the key word the friend leans in and the words
// flare. On the last kick the camera pushes past the friend into the screen
// while the words dither off and the room goes dark, leaving the empty screen.
OM.ownWords.add('c1-04');
// Edit camera: the first two words land with the scene's own camera punch on the beats at 93.518 and
// 94.074, and the last kick (97.284) starts its own push into the screen, so those beats are skipped.
// The snare roll's build and drop (95.130) land the pull-back; the key word adds its own punch to the
// camera's jolt on its beat (96.734).
OM.edit.plan('c1-04', { skip: [93.52, 94.07, 97.27] });
(() => {
  const FONT = "800 200px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['c1-04-type'] = document.fonts.load(FONT);

  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${OM.clamp(a)})`;
  };
  /** A soft elliptical pool of light. */
  const pool = (ctx, x, y, rx, ry, color, a) => {
    if (a <= 0.003 || rx < 1) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx);
    ctx.restore();
  };
  /** Cells of a union of polygons (flat [x, y, ...] in local units, scaled by s), sampled at cell centres. */
  const grid = (polys, g, x0, y0, x1, y1, s = 1) => {
    const cols = Math.ceil((x1 - x0) / g), rows = Math.ceil((y1 - y0) / g);
    const m = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++)
      for (let q = 0; q < cols; q++) {
        const px = (x0 + (q + 0.5) * g) / s, py = (y0 + (r + 0.5) * g) / s;
        for (const p of polys) {
          let inside = false;
          for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2)
            if (p[i + 1] > py !== p[j + 1] > py && px < ((p[j] - p[i]) * (py - p[i + 1])) / (p[j + 1] - p[i + 1]) + p[i]) inside = !inside;
          if (inside) {
            m[r * cols + q] = 1;
            break;
          }
        }
      }
    return { m, cols, rows, g, x0, y0 };
  };
  /** Mark the cells within r of segment a-b (local units). */
  const segment = (P, m, ax, ay, bx, by, r) => {
    const { cols, rows, g, x0, y0 } = P;
    const q0 = Math.max(0, Math.floor((Math.min(ax, bx) - r - x0) / g)), q1 = Math.min(cols - 1, Math.ceil((Math.max(ax, bx) + r - x0) / g));
    const r0 = Math.max(0, Math.floor((Math.min(ay, by) - r - y0) / g)), r1 = Math.min(rows - 1, Math.ceil((Math.max(ay, by) + r - y0) / g));
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    for (let j = r0; j <= r1; j++)
      for (let q = q0; q <= q1; q++) {
        const px = x0 + (q + 0.5) * g - ax, py = y0 + (j + 0.5) * g - ay;
        const t = OM.clamp((px * dx + py * dy) / l2);
        const ex = px - t * dx, ey = py - t * dy;
        if (ex * ex + ey * ey <= r * r) m[j * cols + q] = 1;
      }
  };

  // The owner, in profile facing the screen (head ~760 units, origin at its centre).
  const OWNER = [
    -60, -400, 120, -385, 230, -315, 285, -200, 300, -95, 272, -55, 282, 0, 345, 115, 345, 145, 292, 165, 300, 212,
    284, 236, 300, 262, 280, 300, 292, 348, 250, 398, 120, 420, 70, 450, 80, 640, 250, 770, 330, 1500, -540, 1500,
    -540, 830, -390, 700, -175, 560, -200, 380, -300, 230, -348, 40, -322, -180, -242, -320, -140, -385,
  ];
  // The friend from behind, a lost profile turned toward the screen: head and shoulders apart, so the head can lean.
  const FRIEND_HEAD = [
    0, -400, 170, -372, 272, -272, 312, -100, 302, 120, 245, 290, 170, 390, 110, 470, -150, 470, -168, 400, -248, 336,
    -276, 262, -292, 130, -302, 40, -288, -60, -306, -118, -282, -232, -200, -342, -100, -392,
  ];
  const FRIEND_BODY = [-140, 380, 150, 380, 165, 520, 330, 600, 690, 690, 830, 820, 880, 1600, -880, 1600, -840, 820, -660, 680, -310, 600, -165, 510];

  OM.scene({
    id: 'c1-04',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Shallow depth of field: sharp on the screen and its words, the room and the shoulders falling soft.
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 b = src(q);
  if (uAmount <= 0.0) return b;
  vec2 d = (uv - uP0.zw) * vec2(uRes.x / uRes.y, 1.0);
  float k = smoothstep(1.0, 1.8, length(d / uP0.xy)) * uAmount;
  if (k < 0.002) return b;
  vec2 px = (uRes.y / 1080.0) / uRes;
  float R = 10.0 * k;
  vec3 acc = b.rgb;
  for (int i = 0; i < 16; i++) {
    float a = 2.39996 * float(i), rr = sqrt((float(i) + 0.5) / 16.0) * R;
    acc += src(q + vec2(cos(a), sin(a)) * rr * px).rgb;
  }
  return vec4(acc / 17.0, 1.0);
}`,
      });
      const off = document.createElement('canvas');
      let ox = null;
      const L = OM.HOME;
      // The home lattice with rows above and below the frame: the laptop screen is 16:10.
      const LX = { ...L, rMin: L.rMin - 4, rows: L.rows + 8 };
      // The words in Omarchy lattice type: squares on a 9 px frame pitch at the reading distance (kc = F / mean(DW, DS)).
      const HW = 9 / ((2 * 0.3625) / 1.86), HH = HW, GAP = 8 / 9;
      const ink = OM.fieldInks('tokyo-night');
      const th = OM.theme('tokyo-night');
      const WM = OM.cells(OM.WORDMARK);
      const END = start + duration;
      const ON = OM.words('c1-04');
      const SUNG = OM.sung('c1-04');
      const KEY = ON.length - 1;
      // Rows on the screen: the words before the long gap, the rest, then the key word alone.
      let cut = 0;
      for (let i = 1; i < KEY - 1; i++) if (ON[i + 1] - ON[i] > ON[cut + 1] - ON[cut]) cut = i;
      const ROWS = [[], [], [KEY]];
      for (let k = 0; k < KEY; k++) ROWS[k <= cut ? 0 : 1].push(k);
      const W2 = ON[cut + 1];

      // ---- the screen, in content px: at the cut the homepage frame is the screen, 1:1 ----
      const Z = 1.52; // content px per out-handoff screen px
      const SW = 1280 * Z, SH = 800 * Z;
      const SX = 960 - SW / 2, SY = 540 - SH / 2;
      const DECK = 1300;

      // ---- timing (snare fill 93.81, kick 94.06, roll into the 95.18 downbeat, hats into w2, kick 97.27) ----
      const PULL0 = OM.line('c1-04').words[cut][1];
      // A hit on the drum as measured on the song (OM.T.drums), the nearest within 50 ms.
      const onDrum = (t, kind) => OM.edit.hits(kind, t - 0.05, t + 0.05).reduce((m, h) => (m === null || Math.abs(h[0] - t) < Math.abs(m - t) ? h[0] : m), null) ?? t;
      const DROP = OM.beatOnset(OM.downbeatsIn(95, 95.4)[0] || 95.179); // on the drum: the roll lands at 95.130
      const TURN0 = DROP + 0.22, TURN1 = W2 - 0.03;
      const DIS0 = DROP + 0.12, DIS1 = TURN1 - 0.05;
      const KICK2 = onDrum(97.27, 'kick');
      const DB2 = OM.beatOnset(OM.downbeatsIn(97.2, 97.5)[0] || 97.315); // on the drum, with KICK2
      const FADE0 = END - 0.4, FADE1 = END - 0.05;
      const SEAM = 0.05;

      // ---- camera: a pinhole on the screen's axis; the laptop yaws about its centre ----
      const F = 2400;
      const D0 = F, DW = F / 0.3625, DS = DW * 0.86, D1 = F * Z;
      const EX = 300, YAW = (-35 * Math.PI) / 180;
      const lnW = Math.log(DW / D0);
      const dolly = (T) => {
        if (T < PULL0) return D0;
        if (T < DROP) return D0 * Math.pow((DW * 1.05) / D0, Math.pow(OM.prog(T, PULL0, DROP), 2.2));
        if (T < W2) return DW * (1 + 0.05 * (1 - OM.ease.outCubic(OM.prog(T, DROP, DROP + 0.45))));
        if (T < KICK2) return DW * Math.pow(DS / DW, OM.smooth(OM.prog(T, W2, KICK2)));
        return DS * Math.pow(D1 / DS, OM.ease.outCubic(OM.prog(T, KICK2, END - SEAM)));
      };
      /** A word's camera punch: 1 on the onset, gone after 0.6 s, so the push lands exactly on the handoff. */
      const kick = (hits, T) => {
        const h = OM.lastHit(hits, T);
        return h === null || T - h > 0.6 ? 0 : Math.pow(0.5, (T - h) / 0.09);
      };
      const camAt = (T) => {
        const Db = dolly(T);
        const q = OM.clamp(Math.log(Db / D0) / lnW);
        const punch = 1 + 0.03 * kick(ON.slice(0, cut + 1), T) + 0.012 * kick(ON.slice(cut + 1, KEY), T) + 0.045 * kick([ON[KEY]], T);
        const home = T >= KICK2 ? 1 - OM.ease.outCubic(OM.prog(T, KICK2, END - SEAM)) : 1;
        return {
          D: Db / punch,
          ex: (T < DROP ? EX * OM.smooth(q) : EX) * home,
          psi: T < DROP ? YAW * OM.smooth(OM.prog(q, 0.55, 1)) : YAW * (1 - OM.ease.inOutCubic(OM.prog(T, TURN0, TURN1))),
        };
      };
      let cam = null;
      /** World (content px about the screen centre, z toward the far wall) to frame: [x, y, scale, depth]. */
      const proj = (x, y, z) => {
        const d = cam.D + z, k = F / d;
        return [960 + k * (x - cam.ex), 540 + k * y, k, d];
      };

      // ---- the light: the words are the only source in the room ----
      const dissolve = (T) => OM.smooth(OM.prog(T, DIS0, DIS1));
      const light = (T) => {
        let g = 0.3 * (1 - dissolve(T));
        ON.forEach((t0, k) => {
          if (T >= t0) g += (k === KEY ? 0.3 : 0.16) * (1 + 1.7 * Math.exp(-(T - t0) / 0.28));
        });
        if (T >= ON[KEY]) g += 0.55 * Math.exp(-(T - ON[KEY]) / 0.6);
        if (T >= DB2) g += 0.3 * Math.exp(-(T - DB2) / 0.22);
        // Pause sprinkle, rim-light roll: in the gap the two lit words throb on the snare roll and the kick,
        // so the faces' rim light, the keys and the table pool answer each hit.
        if (T > ON[cut] && T < W2 - 0.05) g += 0.14 * OM.pulse(ROLL, T, 0.06) + 0.3 * OM.pulse(ROLL_KICK, T, 0.09);
        return g * (1 + 0.15 * OM.audio(T).kick) * (1 - OM.smooth(OM.prog(T, FADE0, FADE1)));
      };
      const ROLL = [94.3, 94.69, 94.97, 95.22].map((t) => onDrum(t, 'snare')), ROLL_KICK = [onDrum(94.88, 'kick')];
      const leanAt = (T) => OM.ease.outCubic(OM.prog(T, ON[KEY], ON[KEY] + 0.32));

      // ---- the words: JetBrains Mono ExtraBold rasterized onto half-cells ----
      let type = null, typeOk = false;
      const rasterize = () => {
        const S = 3;
        const m = document.createElement('canvas').getContext('2d');
        const font = (px) => `800 ${px}px 'JetBrains Mono'`;
        m.font = font(100);
        const capR = m.measureText('H').actualBoundingBoxAscent / 100;
        const spR = m.measureText(' ').width / 100;
        const CAP = [185, 185, 235], MID = [215, 520, 815]; // caps of 72 px and more on the frame at the reading distance
        const out = [];
        ROWS.forEach((ids, ri) => {
          if (!ids.length) return;
          let px = CAP[ri] / capR;
          m.font = font(px);
          let ws = ids.map((k) => m.measureText(SUNG[k].text).width);
          let total = ws.reduce((a, b) => a + b, 0) + spR * px * (ids.length - 1);
          const fit = Math.min(1, (SW - 220) / Math.max(1, total));
          px *= fit;
          ws = ws.map((v) => v * fit);
          total *= fit;
          m.font = font(px);
          const cap = capR * px, base = MID[ri] + cap / 2;
          let x0 = 960 - total / 2;
          ids.forEach((k, j) => {
            const text = SUNG[k].text;
            const w = { t0: ON[k], key: k === KEY, cells: [], cx: x0 + ws[j] / 2, cy: base - cap / 2, w: ws[j], cap };
            if (text) {
              const met = m.measureText(text);
              const asc = Math.ceil(met.actualBoundingBoxAscent) + 2, h = asc + Math.ceil(met.actualBoundingBoxDescent) + 2;
              const cw = Math.ceil(ws[j]) + 4;
              const cnv = document.createElement('canvas');
              cnv.width = cw * S;
              cnv.height = h * S;
              const g = cnv.getContext('2d', { willReadFrequently: true });
              g.scale(S, S);
              g.font = font(px);
              g.fillStyle = '#fff';
              g.fillText(text, 2, asc);
              const d = g.getImageData(0, 0, cnv.width, cnv.height).data;
              const Q = Math.round((x0 - 2 - L.x0) / HW), R = Math.round((base - asc - L.y0) / HH);
              for (let r = 0; r < Math.ceil(h / HH); r++)
                for (let q = 0; q < Math.ceil(cw / HW); q++) {
                  let sum = 0, n = 0;
                  for (let yy = Math.floor(r * HH * S); yy < Math.min(cnv.height, Math.floor((r + 1) * HH * S)); yy++)
                    for (let xx = Math.floor(q * HW * S); xx < Math.min(cnv.width, Math.floor((q + 1) * HW * S)); xx++) {
                      sum += d[(yy * cnv.width + xx) * 4 + 3];
                      n++;
                    }
                  if (!n || sum / n < 120) continue;
                  const f = (L.y0 + (R + r + 0.5) * HH - (base - cap)) / cap;
                  w.cells.push({ q: Q + q, r: R + r, ink: f < 0.42 ? ink.crest : f < 0.72 ? ink.hover : ink.lit });
                }
            }
            out.push(w);
            x0 += ws[j] + spR * px;
          });
        });
        return out;
      };
      /** Each word lands on its onset: a punch, a crest flash cooling in dither order, a bloom on the glass. */
      const paintWords = (x, px, T) => {
        if (!type) return;
        const fade = OM.prog(T, FADE0, FADE1 - 0.03);
        const flare = T >= ON[KEY] ? OM.clamp((T - ON[KEY]) / 0.9) : 1;
        let hi = 0;
        if (T > ON[KEY] + 0.2) {
          const b = OM.audio(T).bands;
          hi = (b[13] + b[14] + b[15]) / 3;
        }
        const tick = Math.floor(T * 24);
        const snap = (v) => Math.round(v * px) / px;
        for (const w of type) {
          if (T < w.t0) continue;
          const age = T - w.t0;
          const glow = Math.exp(-age / 0.3) + (T >= ON[KEY] ? 0.8 * Math.exp(-(T - ON[KEY]) / 0.5) : 0);
          const swell = w.t0 === ON[0] ? OM.smooth(OM.clamp(age / 0.14)) : 1;
          pool(x, w.cx, w.cy, w.w * 0.62 + w.cap, w.cap * 1.5, ink.lit, 0.2 * glow * swell * (1 - fade));
          // The first word lands two frames after the cut: a softer punch, so the cut stays smooth.
          const k = 1 + (w.key ? 0.32 : w.t0 === ON[0] ? 0.07 : 0.2) * (1 - OM.ease.outCubic(OM.clamp(age / 0.16)));
          const cool = OM.clamp(age / 0.45);
          let row = null, end = 0, fill = null, xa = 0, xb = 0, ya = 0, yb = 0;
          const flush = () => {
            if (row === null) return;
            x.fillStyle = fill;
            x.fillRect(xa, ya, xb - xa, yb - ya);
            row = null;
          };
          for (const cl of w.cells) {
            const t2 = OM.threshold(cl.q, cl.r);
            if (t2 < fade) {
              flush();
              continue;
            }
            let f = t2 > cool || t2 > flare ? ink.crest : cl.ink;
            if (hi > 0.15 && OM.hash(cl.q, cl.r, tick) < 0.16 * hi) f = f === ink.crest ? ink.hover : ink.crest;
            const x1 = snap(w.cx + (L.x0 + (cl.q + GAP) * HW - w.cx) * k);
            flush();
            row = cl.r;
            end = cl.q;
            fill = f;
            xa = snap(w.cx + (L.x0 + cl.q * HW - w.cx) * k);
            xb = x1;
            ya = snap(w.cy + (L.y0 + cl.r * HH - w.cy) * k);
            yb = snap(w.cy + (L.y0 + (cl.r + GAP) * HH - w.cy) * k);
          }
          flush();
        }
      };

      /** The screen's picture in content px: the homepage dithering into the dark page, the words, the border. */
      const content = (x, px, T, lw) => {
        const dis = dissolve(T);
        x.fillStyle = dis > 0 ? OM.mix(ink.bg, th.bg, dis) : ink.bg;
        x.fillRect(SX, SY, SW, SH);
        x.save();
        x.beginPath();
        x.rect(SX, SY, SW, SH);
        x.clip();
        if (dis < 1) {
          const gone = (col, row) => dis > 0 && OM.threshold(col, row) < dis;
          OM.hero(x, T, px, { inks: ink, L: LX, word: false, gain: 0.8, bg: false, mask: dis > 0 ? (col, row) => (gone(col, row) ? 0 : 1) : null });
          for (const [col, row] of WM) {
            if (gone(col, row)) continue;
            x.fillStyle = ink[OM.BANDS[row]];
            OM.cell(x, L, col, row, px);
          }
        }
        paintWords(x, px, T);
        x.restore();
        x.strokeStyle = ink.mid;
        x.lineWidth = lw;
        x.strokeRect(SX + lw / 2, SY + lw / 2, SW - lw, SH - lw);
      };
      /**
       * The yawed screen: the picture rendered flat offscreen, then laid down in
       * vertical strips, each scaled by its own depth (a yaw keeps verticals vertical).
       */
      const strips = (ctx, dpr, T, lw) => {
        const po = dpr * 0.56; // offscreen px per content px: the screen is under ~0.57 of this size while it is turned
        const W = Math.round(SW * po), H = Math.round(SH * po);
        if (off.width !== W || off.height !== H) {
          off.width = W;
          off.height = H;
          ox = off.getContext('2d', { alpha: false });
        }
        ox.setTransform(po, 0, 0, po, -SX * po, -SY * po);
        content(ox, po, T, lw);
        const cs = Math.cos(cam.psi), sn = Math.sin(cam.psi);
        const at = (u) => {
          const xx = (u - 0.5) * SW, k = F / (cam.D + xx * sn);
          return [960 + k * (xx * cs - cam.ex), 540 - (k * SH) / 2, k * SH];
        };
        const N = 96; // ponytail: flat-topped strips, ~1-2px steps on the keystone's top edge
        let a = at(0);
        for (let i = 0; i < N; i++) {
          const b = at((i + 1) / N), m = at((i + 0.5) / N);
          ctx.drawImage(off, (i / N) * W, 0, W / N, H, a[0], m[1], b[0] - a[0] + 0.5, m[2]);
          a = b;
        }
      };

      /** The base under the screen and the pool its light leaves on the table. */
      const deck = (ctx, G) => {
        const cs = Math.cos(cam.psi), sn = Math.sin(cam.psi);
        const pt = (u, w) => proj(u * cs - w * sn, SH / 2, u * sn + w * cs);
        const g = Math.min(G, 1.3);
        const pl = pt(0, -DECK - 420);
        pool(ctx, pl[0], pl[1], SW * pl[2] * 0.8, SW * pl[2] * 0.13, ink.lit, 0.12 * g);
        const a = pt(-SW / 2, 0), b = pt(SW / 2, 0), e = pt(SW / 2, -DECK), d = pt(-SW / 2, -DECK);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.lineTo(d[0], d[1]);
        ctx.closePath();
        ctx.fillStyle = ink.bg;
        ctx.fill();
        if (g < 0.005) return;
        const gr = ctx.createLinearGradient(0, Math.min(a[1], b[1]), 0, Math.max(e[1], d[1]));
        gr.addColorStop(0, rgba(ink.lit, 0.2 * g));
        gr.addColorStop(1, rgba(ink.lit, 0.02 * g));
        ctx.fillStyle = gr;
        ctx.fill();
        // Keys catch the light, the rows nearest the screen most.
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = rgba(ink.mid, 0.5 * g * (1 - i / 6));
          const widths = i === 4 ? [1, 1, 1, 6, 1, 1, 1, 2] : Array(14).fill(1);
          let u0 = -SW * 0.42;
          for (const width of widths) {
            const kw = width * SW * 0.06, w0 = -100 - i * 130;
            const p = [pt(u0, w0), pt(u0 + kw - SW * 0.012, w0), pt(u0 + kw - SW * 0.012, w0 - 100), pt(u0, w0 - 100)];
            ctx.beginPath();
            ctx.moveTo(p[0][0], p[0][1]);
            for (let n = 1; n < 4; n++) ctx.lineTo(p[n][0], p[n][1]);
            ctx.fill();
            u0 += kw;
          }
        }
        const pad = [pt(-SW * 0.17, -820), pt(SW * 0.17, -820), pt(SW * 0.17, -1130), pt(-SW * 0.17, -1130)];
        ctx.beginPath(); ctx.moveTo(pad[0][0], pad[0][1]);
        for (let n = 1; n < 4; n++) ctx.lineTo(pad[n][0], pad[n][1]);
        ctx.closePath();
        ctx.fillStyle = rgba(ink.dim, 0.22 * g); ctx.fill();
        ctx.strokeStyle = rgba(ink.mid, 0.55 * g); ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = rgba(ink.dim, 0.45 * g);
        ctx.beginPath();
        ctx.moveTo(d[0], d[1]); ctx.lineTo(e[0], e[1]);
        ctx.lineTo(e[0], e[1] + 10 * e[2]); ctx.lineTo(d[0], d[1] + 10 * d[2]);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(ink.hover, 0.55 * Math.min(g, 1));
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(d[0], d[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.stroke();
      };

      // ---- the two people: lattice silhouettes, lit only on the side that faces the screen ----
      const owner = { x: -1150, y: 120, z: -2000, P: grid([OWNER], 24, -560, -420, 1350, 1500) };
      const friend = { x: 1043, y: 150, z: -3600, P: grid([FRIEND_BODY], 20, -720, -340, 720, 1300, 0.8) };
      const friendHead = grid([FRIEND_HEAD], 20, -720, -340, 720, 1300, 0.8);
      for (const o of [owner, friend]) {
        o.work = new Uint8Array(o.P.m.length);
        o.top = new Uint16Array(o.P.m.length);
      }
      const SHADOW = th['brand-ink']; // the people: just darker than the room, so they read against the glow
      const SHOULDER = [150, 820], REST = [470, 1300], UPPER = 540, FORE = 500;
      /** The owner's arm, shoulder to hand, as a two-bone reach with the elbow dropped. */
      const arm = (hx, hy) => {
        const [sx, sy] = SHOULDER;
        const d = Math.hypot(hx - sx, hy - sy) || 1, reach = Math.min(d, UPPER + FORE - 2);
        const ux = (hx - sx) / d, uy = (hy - sy) / d;
        const bend = Math.acos(OM.clamp((UPPER * UPPER + reach * reach - FORE * FORE) / (2 * UPPER * reach), -1, 1));
        const base = Math.atan2(uy, ux);
        const exx = sx + UPPER * Math.cos(base + bend), eyy = sy + UPPER * Math.sin(base + bend);
        const hx2 = sx + ux * reach, hy2 = sy + uy * reach;
        segment(owner.P, owner.work, sx, sy, exx, eyy, 66);
        segment(owner.P, owner.work, exx, eyy, hx2, hy2, 54);
        const length = Math.hypot(hx2 - exx, hy2 - eyy), dx = (hx2 - exx) / length, dy = (hy2 - eyy) / length;
        segment(owner.P, owner.work, hx2 - dx * 10, hy2 - dy * 10, hx2 + dx * 60, hy2 + dy * 60, 38);
        segment(owner.P, owner.work, hx2 + dx * 40, hy2 + dy * 40, hx2 + dx * 86, hy2 + dy * 86, 28);
        segment(owner.P, owner.work, hx2 - dy * 24, hy2 + dx * 24, hx2 + dx * 46 - dy * 54, hy2 + dy * 46 + dx * 54, 23);
      };
      /** Paint one person: a body darker than the room, rim light by distance from the edge that faces the screen. */
      const person = (ctx, dpr, o, lit, fromLeft, topK) => {
        const [X0, Y0, k, depth] = proj(o.x + o.P.x0, o.y + o.P.y0, o.z);
        if (depth < 250) return;
        const { cols, rows, g } = o.P, m = o.work, top = o.top, s = g * k;
        if (X0 > 1920 || Y0 > 1080 || X0 + cols * s < 0 || Y0 + rows * s < 0) return;
        const snap = (v) => Math.round(v * dpr) / dpr;
        for (let q = 0; q < cols; q++) {
          let n = 0;
          for (let r = 0; r < rows; r++) {
            const i = r * cols + q;
            n = m[i] ? n + 1 : 0;
            top[i] = n;
          }
        }
        const fall = 0.9 + 1.4 * Math.min(1.5, lit);
        const lits = [];
        ctx.fillStyle = SHADOW;
        for (let r = 0; r < rows; r++) {
          const ya = snap(Y0 + r * s), yb = snap(Y0 + (r + 1) * s);
          if (yb < 0 || ya > 1080) continue;
          let q = 0;
          while (q < cols) {
            if (!m[r * cols + q]) {
              q++;
              continue;
            }
            const q0 = q;
            while (q < cols && m[r * cols + q]) q++;
            const xa = snap(X0 + q0 * s);
            ctx.fillRect(xa, ya, snap(X0 + q * s) - xa, yb - ya);
            if (lit < 0.02) continue;
            for (let i = q0; i < q; i++) {
              const side = fromLeft ? i - q0 : q - 1 - i, up = top[r * cols + i] - 1;
              if (side > 9 && up > 9) continue;
              const lv = 1.4 * lit * Math.max(Math.exp(-side / fall), topK * Math.exp(-up / fall));
              if (lv > 0.1 + 0.5 * OM.threshold(i, r)) lits.push(i, r, lv);
            }
          }
        }
        for (let j = 0; j < lits.length; j += 3) {
          const lv = lits[j + 2];
          ctx.fillStyle = lv > 1 ? ink.crest : lv > 0.72 ? ink.hover : lv > 0.48 ? ink.lit : lv > 0.3 ? ink.mid : ink.dim;
          const xa = snap(X0 + lits[j] * s), ya = snap(Y0 + lits[j + 1] * s);
          ctx.fillRect(xa, ya, snap(X0 + (lits[j] + 1) * s) - xa, snap(Y0 + (lits[j + 1] + 1) * s) - ya);
        }
      };

      // ---- camera: c1-03's push carried through the cut and let go into the pull-back; then a gentle
      // over-the-shoulder dolly, drifting sideways past the friend, home by the last frames ----
      const PUSH = OM.c1.push34, TAU = 0.45;
      const ed = OM.edit.scene(start, END);
      const look = (T) => {
        const s = Math.max(0, T - start);
        const carry = (PUSH.ZOOM - 1 + PUSH.SPEED * TAU * (1 - Math.exp(-s / TAU))) * (1 - OM.smooth(OM.prog(T, PULL0, DROP)));
        const par = OM.smooth(OM.prog(T, PULL0 + 0.2, DROP + 0.3)) * (1 - OM.smooth(OM.prog(T, KICK2, END - SEAM)));
        const tc = ed.clock(T) - PULL0; // the sideways drift surges through each beat
        const x = -30 * par * Math.sin(0.8 * tc + 0.4), rot = ((0.7 * Math.PI) / 180) * par * Math.sin(0.6 * tc - 0.9);
        const zoom = (1 + carry) * OM.c1.cover(rot, x, 0);
        // The sharp zone: the screen, as it is projected now.
        const k = camAt(T), kc = F / k.D;
        const amount = OM.post.envelope(T, start, END - SEAM, { ramp: 0.4, hold: 0.05 }) * OM.smooth(OM.prog(T, PULL0, DROP));
        return { amount, cam: { zoom, rot, x, y: 0 }, p0: [Math.max(0.3, (SW * kc * 0.55) / 1080), Math.max(0.24, (SH * kc * 0.6) / 1080), (960 - kc * k.ex) / 1920, 0.5] };
      };
      // ---- extras: the screen's light flickering on the room, motes drifting through its beam ----
      const beam = (ctx, T, G, scx, scy, kc) => {
        const on2 = OM.smooth(OM.prog(T, PULL0, DROP));
        if (on2 <= 0 || G <= 0.01) return;
        const flick = 0.6 + 0.4 * OM.hash(Math.floor(T * 30), 3, 0xc104);
        pool(ctx, scx, scy, SW * kc * 1.25, SH * kc * 1.1, ink.lit, 0.05 * on2 * Math.min(G, 1.4) * flick);
        const R = SW * kc * 0.9;
        for (let i = 0; i < 46; i++) {
          const h1 = OM.hash(i, 1, 0xc104), h2 = OM.hash(i, 2, 0xc104), h3 = OM.hash(i, 3, 0xc104);
          const x = (((h1 * 2400 + T * (14 + 18 * h3)) % 2400) + 2400) % 2400 - 240;
          const y = 60 + h2 * 960 + 22 * Math.sin(T * (0.4 + 0.5 * h3) + 6.28 * h1) - T * 6;
          const d = Math.hypot((x - scx) / R, (y - scy) / (R * 0.7));
          const a = on2 * Math.min(1, G) * Math.exp(-d * d * 1.6) * (0.5 + 0.5 * Math.sin(T * 3 + 9 * h2));
          if (a < 0.03) continue;
          ctx.globalAlpha = Math.min(0.9, a);
          ctx.fillStyle = h3 > 0.7 ? ink.crest : ink.hover;
          const sz = h3 > 0.85 ? 3 : 2;
          ctx.fillRect(x, ((y % 1080) + 1080) % 1080, sz, sz);
        }
        ctx.globalAlpha = 1;
      };

      return OM.c1.post({
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + SEAM) return OM.handoff('word', ctx, T, dpr);
          if (T > END - SEAM) return OM.handoff('screen', ctx, T, dpr);
          if (!type || (!typeOk && document.fonts.check(FONT))) {
            typeOk = document.fonts.check(FONT);
            type = rasterize();
          }
          cam = camAt(T);
          const G = light(T);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);

          // The room: the screen's glow behind everything, the base and its pool on the table.
          const [scx, scy, kc] = proj(0, 0, 0);
          pool(ctx, scx, scy, SW * kc * 1.6, SW * kc * 1.1, ink.lit, 0.2 * Math.min(G, 1.4));
          deck(ctx, G);

          // The screen: flat while it faces the camera, keystoned in strips while it is turned.
          const lw = Math.max(2 * Z, 1.4 / kc);
          if (Math.abs(cam.psi) < 0.004) {
            ctx.setTransform(dpr * kc, 0, 0, dpr * kc, dpr * (960 - kc * cam.ex - 960 * kc), dpr * 540 * (1 - kc));
            content(ctx, dpr * kc, T, lw);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          } else strips(ctx, dpr, T, lw);

          // The owner reaches over off the downbeat, holds the lid edge through the turn, lets go.
          const turn = OM.clamp(cam.psi / YAW); // 1 = facing the owner, 0 = facing the friend
          owner.work.set(owner.P.m);
          const reach = OM.ease.outCubic(OM.prog(T, DROP - 0.05, TURN0)) * (1 - OM.ease.inOutCubic(OM.prog(T, TURN1 + 0.05, TURN1 + 0.45)));
          if (reach > 0.001) {
            const cs = Math.cos(cam.psi), sn = Math.sin(cam.psi), ex0 = -0.485 * SW;
            const [hx, hy] = proj(ex0 * cs, 0.2 * SH, ex0 * sn);
            const [ax, ay, ak] = proj(owner.x, owner.y, owner.z);
            arm(OM.lerp(REST[0], (hx - ax) / ak, reach), OM.lerp(REST[1], (hy - ay) / ak, reach));
          }
          person(ctx, dpr, owner, G * (0.55 + 0.45 * turn), false, 0.25);

          // The friend leans in on the key word, the head stepping toward the screen a cell at a time.
          const lean = leanAt(T);
          const dq = -Math.round((lean * 120) / friend.P.g), dr = -Math.round((lean * 45) / friend.P.g);
          friend.work.set(friend.P.m);
          const hc = friendHead.cols;
          for (let i = 0; i < friendHead.m.length; i++) {
            if (!friendHead.m[i]) continue;
            const q = (i % hc) + dq, r = ((i / hc) | 0) + dr;
            if (q >= 0 && q < hc && r >= 0 && r < friendHead.rows) friend.work[r * hc + q] = 1;
          }
          person(ctx, dpr, friend, G * (0.3 + 0.7 * (1 - turn)) * (1 + 0.35 * lean), true, 0.45);
          beam(ctx, T, G, scx, scy, kc);
        },
        release: () => {
          c.release();
          off.width = 0;
          off.height = 0;
          ox = null;
        },
      }, fx, look);
    },
  });
})();
