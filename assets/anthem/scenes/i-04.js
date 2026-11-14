// i-04 · The title card, as a rack focus. It opens on i-03's last frame: the
// mark, sharp, on the home lattice. Focus pulls toward the camera: the mark
// melts into square bokeh (an out-of-focus cell spreads into the aperture's
// shape, and this aperture is square) while in front of it the song title
// condenses out of a haze. The big kick gives a first glimpse; through the
// pull-back the accelerating roll makes the focus hunt, one step per hit,
// overshooting and undershooting closer each time; on the 32.95 downbeat it
// locks: the title snaps crisp with a crest flash and a small push. The credit
// racks into focus on the ad-lib. The title is set in lattice cells like the
// wordmark, the subtitle and credit in mono, the way the homepage hero is built.
// On the 35.11 downbeat the glow blooms into white: the out-handoff.

// Edit camera: the section's defaults, except on the lock (32.91). There the scene's own hit
// (focus snap, crest flash, streaks and the title's push, at the top of the dolly swell) is
// the designed moment, and a camera punch on top would carry the title's ends to within a few
// px of the border band.
OM.edit.plan('i-04', { skip: [32.914] });

(() => {
  const FONT = "800 132px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['i-04-type'] = document.fonts.load(FONT);

  /** Scale v about k by s, then shift by o: the camera on one plane. */
  const at = (v, s, o, k) => k + o + (v - k) * s;

  /** One line of a fractional box filter (radius r, in grid pixels), in place, via prefix sums. */
  const boxLine = (a, off, stride, n, r, P) => {
    const ri = Math.floor(r), f = r - ri, k = 1 / (1 + 2 * r);
    P[0] = 0;
    for (let i = 0; i < n; i++) P[i + 1] = P[i] + a[off + i * stride];
    for (let i = 0; i < n; i++) {
      let s = P[Math.min(n, i + ri + 1)] - P[Math.max(0, i - ri)];
      if (f > 0) {
        if (i - ri - 1 >= 0) s += f * (P[i - ri] - P[i - ri - 1]);
        if (i + ri + 1 < n) s += f * (P[i + ri + 2] - P[i + ri + 1]);
      }
      a[off + i * stride] = s * k;
    }
  };

  /**
   * Square-aperture defocus for a plane of lattice cells: the cells are splatted
   * into a supersampled float grid, box-filtered at any fractional radius (the
   * box is the aperture), and drawn scaled up smoothly. Float all the way, so a
   * wide blur keeps its light instead of rounding away in 8-bit.
   */
  const bokeh = ({ cols, rows, sub, rMax, cellW, cellH, x0, y0 }) => {
    const pad = Math.ceil(rMax * sub) + 2;
    const W = cols * sub + 2 * pad, H = rows * sub + 2 * pad;
    const ch = [0, 1, 2, 3].map(() => new Float32Array(W * H));
    const P = new Float64Array(Math.max(W, H) + 1);
    const cnv = document.createElement('canvas');
    cnv.width = W;
    cnv.height = H;
    const cx = cnv.getContext('2d');
    const img = cx.createImageData(W, H);
    return (ctx, cells, colorOf, r, alpha, s, ox, oy) => {
      if (alpha <= 0.002) return;
      const [R, G, B, A] = ch;
      for (const a of ch) a.fill(0);
      for (const cl of cells) {
        const [cr, cg, cb] = colorOf(cl);
        const gx = pad + cl.gq * sub, gy = pad + cl.gr * sub;
        for (let j = 0; j < sub; j++)
          for (let i = 0; i < sub; i++) {
            const k = (gy + j) * W + gx + i;
            R[k] = cr; G[k] = cg; B[k] = cb; A[k] = 1;
          }
      }
      const rs = Math.min(r, rMax) * sub;
      for (const a of ch) {
        for (let y = 0; y < H; y++) boxLine(a, y * W, 1, W, rs, P);
        for (let x = 0; x < W; x++) boxLine(a, x, W, H, rs, P);
      }
      const d = img.data;
      for (let k = 0, p = 0; k < W * H; k++, p += 4) {
        const a = A[k];
        if (a < 1e-4) { d[p + 3] = 0; continue; }
        d[p] = R[k] / a; d[p + 1] = G[k] / a; d[p + 2] = B[k] / a; d[p + 3] = Math.min(255, a * 255);
      }
      cx.putImageData(img, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const gx0 = x0 - (pad / sub) * cellW, gy0 = y0 - (pad / sub) * cellH;
      ctx.drawImage(cnv, at(gx0, s, ox, 960), at(gy0, s, oy, 540), (W / sub) * cellW * s, (H / sub) * cellH * s);
      ctx.globalAlpha = 1;
    };
  };

  OM.scene({
    id: 'i-04',
    build(el) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Anamorphic streaks: the brightest light smeared out sideways, cool blue-white, off the title at the lock.
      const fx = OM.post(el, c, { effect: `
vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec4 c = src(p);
  if (uAmount <= 0.0) return c;
  vec3 acc = vec3(0.0);
  for (int i = 1; i <= 28; i++) {
    float o = float(i) * uP0.x / uRes.x, w = 1.0 - float(i) / 29.0;
    vec2 j = vec2(0.0, (hash(vec2(float(i), 3.0)) - 0.5) * 1.5 / uRes.y);
    acc += (max(src(p + vec2(o, 0.0) + j).rgb - 0.62, 0.0) + max(src(p - vec2(o, 0.0) + j).rgb - 0.62, 0.0)) * w;
  }
  acc /= 9.0;
  float l = dot(acc, vec3(0.33));
  return vec4(c.rgb + l * uAmount * vec3(0.48, 0.64, 0.97) * 1.1, 1.0);
}` });
      const L = OM.HOME;
      const ink = OM.fieldInks('tokyo-night');
      const th = OM.theme('tokyo-night');
      const INKS = [ink.dim, ink.mid, ink.lit, ink.hover, ink.crest];
      const RGB = INKS.map(OM.rgb);

      // ---- timing (audiomap: kick 30.79, accelerating roll + risers into the 33.0 surge, ad-lib 34.58) ----
      const OPEN = 28.65;
      // Drum hits as measured on the song (OM.T.drums): the kick, then the roll's hits, one focus step on each.
      const KICK = 30.77;
      const HUNT = [31.302, 31.572, 31.838, 32.108, 32.374, 32.644, 32.778];
      const LOCK = OM.beatOnset(OM.downbeatsIn(32.5, 33.5)[0]); // 32.913, the drum hit on the 32.949 downbeat
      const CREDIT = OM.beatsIn(34.4, 34.8)[0]; // 34.575: on the ad-lib's voice (about 34.59), not a drum hit
      const END = 36.711;
      const BLOOM = OM.beatOnset(OM.downbeatsIn(35, 35.2)[0]); // 35.062, the drum hit on the 35.109 downbeat
      const WHITE = END - 0.08; // the last frames are exactly the white handoff
      const white = OM.theme('white').bg;
      // The assembly: the mark's cells fly into the title's, one word locking in on each hit.
      const HITS = [29.164, 29.292, 29.954]; // the beat, the snare and the kick (measured)
      const LAUNCH = [28.8, 28.86, 29.4];
      const ASSEMBLED = HITS[2] + 0.4;
      // Focus: 1 = the title sharp. Assembled sharp; it slips on the 30.79 kick, hunts on the roll, locks on the downbeat.
      const guess = (j) => 1 + (j % 2 ? -1 : 1) * 0.42 * Math.pow(0.66, j);
      const focus = (T) => {
        if (T < KICK) return 1;
        if (T < HUNT[0]) return OM.lerp(1, 0.55, OM.ease.outCubic(OM.prog(T, KICK, KICK + 0.3)));
        if (T >= LOCK) return 1;
        const k = OM.hitCount(HUNT, T) - 1;
        return OM.lerp(k === 0 ? 0.55 : guess(k - 1), guess(k), OM.ease.outCubic(OM.prog(T, HUNT[k], HUNT[k] + 0.08)));
      };
      const BLUR_TITLE = 6; // cells of defocus per unit of focus distance

      // ---- the mark, exactly as i-03 leaves it: 60x60 cells, inks from the hero's noise ----
      const N = 60, HN = N / 2;
      const home = OM.cellAt(L, 960, 540);
      const markX0 = L.x0 + (home.col - HN) * L.cw, markY0 = L.y0 + (home.row - HN) * L.ch;
      const markCells = [];
      for (let v = 0; v < N; v++) for (let u = 0; u < N; u++) if (OM.LOGO.rows[v >> 2][u >> 2] === '1') markCells.push({ gq: u, gr: v });
      const markInk = (u, v, T) => {
        const t2 = OM.threshold(u, v);
        const n = OM.heroNoise(u / 9 + T * 0.14, v / 9 - T * 0.055);
        const val = 0.3 + 0.7 * n * n + 0.12 * Math.sin(T * 1.1 + OM.heroJitter[(v * 37 + u * 11) & 4095] * 6.283);
        return val > 0.62 + 0.3 * t2 ? 3 : val > 0.2 + 0.25 * t2 ? 2 : 1;
      };

      // ---- the title: JetBrains Mono ExtraBold rasterized onto a half-size lattice ----
      const cw = L.cw / 2, ch = L.ch / 2;
      const TITLE = 'WE CAN FIX EVERYTHING';
      let type = null;
      const rasterize = () => {
        const S = 4;
        const m = document.createElement('canvas').getContext('2d');
        m.font = FONT;
        const met = m.measureText(TITLE);
        const w = Math.ceil(met.width) + 8, asc = Math.ceil(met.actualBoundingBoxAscent) + 4, h = asc + Math.ceil(met.actualBoundingBoxDescent) + 4;
        const cnv = document.createElement('canvas');
        cnv.width = w * S;
        cnv.height = h * S;
        const x = cnv.getContext('2d', { willReadFrequently: true });
        x.scale(S, S);
        x.font = FONT;
        x.fillStyle = '#fff';
        x.fillText(TITLE, 4, asc);
        const px = x.getImageData(0, 0, cnv.width, cnv.height).data;
        const cols = Math.ceil(w / cw), rows = Math.ceil(h / ch);
        const lit = [];
        for (let r = 0; r < rows; r++)
          for (let q = 0; q < cols; q++) {
            let sum = 0, n = 0;
            for (let yy = Math.floor(r * ch * S); yy < Math.min(cnv.height, Math.floor((r + 1) * ch * S)); yy++)
              for (let xx = Math.floor(q * cw * S); xx < Math.min(cnv.width, Math.floor((q + 1) * cw * S)); xx++) { sum += px[(yy * cnv.width + xx) * 4 + 3]; n++; }
            if (n && sum / n > 120) lit.push([q, r]);
          }
        const r0 = Math.min(...lit.map((p) => p[1])), r1 = Math.max(...lit.map((p) => p[1]));
        const q0 = Math.min(...lit.map((p) => p[0])), q1 = Math.max(...lit.map((p) => p[0]));
        const R = r1 - r0 + 1, C = q1 - q0 + 1;
        // Banded like the wordmark, crest at the top; no dim rows, so it reads over the bokeh.
        const band = (r) => { const f = r / Math.max(1, R - 1); return f < 0.3 ? 4 : f < 0.45 ? 3 : f < 0.72 ? 2 : 1; };
        const x0 = 960 - (C * cw) / 2, y0 = 486 - (R * ch) / 2;
        return {
          ok: document.fonts.check(FONT),
          R, x0, y0,
          cells: lit.map(([q, r]) => ({ gq: q - q0, gr: r - r0, ink: band(r - r0) })),
          blur: bokeh({ cols: C, rows: R, sub: 2, rMax: BLUR_TITLE, cellW: cw, cellH: ch, x0, y0 }),
        };
      };

      /** Crisp lattice cells on a plane, edges snapped to device pixels so neighbours butt exactly. */
      const crisp = (ctx, dpr, cells, x0, y0, w, h, fill, alpha, s, ox, oy) => {
        if (alpha <= 0.002) return;
        const snap = (v) => Math.round(v * dpr) / dpr;
        ctx.globalAlpha = alpha;
        for (const cl of cells) {
          ctx.fillStyle = fill(cl);
          const xa = snap(at(x0 + cl.gq * w, s, ox, 960)), ya = snap(at(y0 + cl.gr * h, s, oy, 540));
          const xb = snap(at(x0 + (cl.gq + 1) * w, s, ox, 960)), yb = snap(at(y0 + (cl.gr + 1) * h, s, oy, 540));
          ctx.fillRect(xa, ya, xb - xa, yb - ya);
        }
        ctx.globalAlpha = 1;
      };
      /** A plane at defocus r: crisp cells cross-fading into its square bokeh. */
      const plane = (ctx, dpr, P, r, alpha, s, ox, oy) => {
        const soft = OM.smooth(OM.clamp((r - 0.06) / 0.35));
        if (soft < 1) crisp(ctx, dpr, P.cells, P.x0, P.y0, P.w, P.h, (cl) => INKS[P.ink(cl)], alpha * (1 - soft), s, ox, oy);
        if (soft > 0) P.blur(ctx, P.cells, (cl) => RGB[P.ink(cl)], r, alpha * soft, s, ox, oy);
      };
      /** Mono text on a plane, defocused with the same radius (a Gaussian of matching spread; canvas blur is in device pixels). */
      const text = (ctx, dpr, str, font, color, x, y, spacing, rPx, alpha) => {
        if (alpha <= 0.003) return;
        ctx.font = font;
        ctx.letterSpacing = spacing;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.filter = rPx > 0.3 ? `blur(${(rPx * 0.58 * dpr).toFixed(2)}px)` : 'none';
        ctx.fillText(str, x, y);
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        ctx.letterSpacing = '0px';
        ctx.textAlign = 'left';
      };

      /**
       * Flight pairs: every mark cell splits into four title-size quarters (so at the cut they are the
       * mark exactly), both sides sorted left to right, and each quarter is paired with a title cell
       * (repeating whichever side is shorter). A pair's group is its title cell's word.
       */
      let flights = null;
      const buildFlights = () => {
        const subs = [];
        for (const m of markCells) for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) subs.push({ u: m.gq, v: m.gr, x: markX0 + (m.gq + i / 2) * L.cw, y: markY0 + (m.gr + j / 2) * L.ch });
        subs.sort((a, b) => a.x - b.x || a.y - b.y);
        // Words: runs of title columns separated by wide empty gaps.
        const used = new Set(type.cells.map((cl) => cl.gq));
        const maxQ = Math.max(...used);
        const wordOf = new Int16Array(maxQ + 1);
        let w = 0, gap = 0;
        for (let q = 0; q <= maxQ; q++) {
          if (used.has(q)) { if (gap >= 6 && q > 0) w++; gap = 0; } else gap++;
          wordOf[q] = w;
        }
        const nW = w + 1;
        const tc = type.cells.slice().sort((a, b) => a.gq - b.gq || a.gr - b.gr);
        const M = Math.max(subs.length, tc.length);
        const out = [];
        for (let k = 0; k < M; k++) {
          const sb = subs[Math.floor((k * subs.length) / M)], cl = tc[Math.floor((k * tc.length) / M)];
          const g = Math.min(2, Math.floor((wordOf[cl.gq] * 3) / nW));
          out.push({ sb, cl, g, launch: LAUNCH[g] + 0.08 * OM.hash(k, 1, 13), arc: (OM.hash(k, 2, 13) - 0.5) * 2 * (110 + 170 * OM.hash(k, 3, 13)) });
        }
        return out;
      };
      /** Draw the flights at T (all on screen until the title is assembled). */
      const fly = (ctx, dpr, T, sFar, sNear, dx, dy) => {
        const snap = (v) => Math.round(v * dpr) / dpr;
        const k0 = 1 - 0.035 * OM.smooth(OM.prog(T, 28.66, 28.8)); // the wind-up: the mark draws in before it breaks
        const mcx = markX0 + HN * L.cw, mcy = markY0 + HN * L.ch;
        for (const f of flights) {
          const { sb, cl } = f, H = HITS[f.g];
          const p = OM.prog(T, f.launch, H), o = T - H;
          let e = p * p; // it arrives with momentum...
          if (o > 0) e = 1 + 0.06 * Math.sin((Math.PI * o) / 0.12) * Math.exp(-o / 0.08) * (1 - OM.prog(o, 0, 0.3)); // ...and settles
          const sx = at(mcx + (sb.x - mcx) * k0, sFar, dx * 0.35, 960), sy = at(mcy + (sb.y - mcy) * k0, sFar, dy * 0.35, 540);
          const tx = at(type.x0 + cl.gq * cw, sNear, dx, 960), ty = at(type.y0 + cl.gr * ch, sNear, dy, 540);
          const vx = tx - sx, vy = ty - sy, len = Math.hypot(vx, vy) || 1;
          const bulge = f.arc * Math.sin(Math.PI * p);
          const x = sx + vx * e - (vy / len) * bulge, y = sy + vy * e + (vx / len) * bulge;
          const ee = Math.min(1, e);
          const w = OM.lerp((L.cw / 2) * sFar, cw * sNear, ee), h = OM.lerp((L.ch / 2) * sFar, ch * sNear, ee);
          let id;
          if (p <= 0) id = markInk(sb.u, sb.v, T);
          else if (o < 0) id = 3;
          else id = o < 0.08 || OM.threshold(cl.gq, cl.gr) > (o - 0.08) / 0.3 ? 4 : cl.ink;
          ctx.fillStyle = INKS[id];
          const xa = snap(x), ya = snap(y);
          ctx.fillRect(xa, ya, snap(x + w) - xa, snap(y + h) - ya);
        }
      };

      return {
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T >= WHITE) {
            OM.handoff('white', ctx, T, dpr);
            return fx.apply(T);
          }
          if (!type || (!type.ok && document.fonts.check(FONT))) {
            type = rasterize();
            flights = buildFlights();
          }
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const d = focus(T);
          // Camera: a slow drift (the near plane moves more than the far: parallax) and a push that lands on the lock.
          const age = T - OPEN;
          const dx = 10 * Math.sin(age * 0.6), dy = 6 * Math.sin(age * 0.43);
          // Dolly zoom: the whole frame swells into the lock while the far plane is held back, so the mark stays put and the title comes at us.
          const swell = OM.smooth(OM.prog(T, KICK, LOCK)) * (1 - OM.smooth(OM.prog(T, LOCK + 0.4, 35.0)));
          const zf = 1 + 0.06 * swell;
          const sFar = (1 + 0.06 * OM.smooth(OM.prog(T, OPEN, END))) / zf;
          const punch = T >= LOCK ? 0.018 * Math.exp(-(T - LOCK) / 0.18) : 0;
          const sNear = OM.lerp(0.95, 1, OM.smooth(OM.prog(T, OPEN, LOCK))) + punch + 0.012 * OM.prog(T, LOCK + 0.5, END);

          // The title: assembled out of the mark's own cells, then one sharp plane that hunts focus and locks.
          const rTitle = BLUR_TITLE * Math.abs(1 - d);
          const show = OM.smooth(OM.prog(T, ASSEMBLED - 0.35, ASSEMBLED + 0.25)); // the subtitle follows the assembly
          const flash = T >= LOCK ? (T - LOCK) / 0.1 : -1;
          if (T < ASSEMBLED) fly(ctx, dpr, T, sFar, sNear, dx, dy);
          else plane(ctx, dpr, {
            cells: type.cells, x0: type.x0, y0: type.y0, w: cw, h: ch, blur: type.blur,
            ink: (cl) => {
              if (flash >= 0 && cl.gr <= flash * type.R && OM.threshold(cl.gq, cl.gr) > (T - LOCK - 0.1 - cl.gr * 0.006) / 0.45) return 4;
              return cl.ink;
            },
          }, rTitle, 1, sNear, dx, dy);

          // Subtitle on the near plane; the credit racks in on its own on the ad-lib.
          text(ctx, dpr, 'THE ULTIMATE MACHINE', "500 34px 'JetBrains Mono'", th.text, at(960, sNear, dx, 960), at(598, sNear, dy, 540), '0.34em', rTitle * cw * sNear, show * 0.92);
          if (T >= CREDIT - 0.05) {
            const p = OM.ease.outCubic(OM.prog(T, CREDIT, CREDIT + 0.3));
            text(ctx, dpr, 'Kevin Koontz / REARRANGED', "400 24px 'JetBrains Mono'", th['text-muted'], at(960, sNear, dx, 960), at(660, sNear, dy, 540), '0.08em', 14 * (1 - p), OM.clamp(p * 2));
          }

          // Foreground dust: big soft square bokeh drifting past, well in front of everything.
          const dustA = OM.post.envelope(T, OPEN, BLOOM, { ramp: 0.8, hold: 0.1 });
          if (dustA > 0) {
            for (let i = 0; i < 12; i++) {
              const sz = 40 + 70 * OM.hash(i, 1, 41), sp = 30 + 50 * OM.hash(i, 2, 41);
              const x = ((OM.hash(i, 3, 41) * 2400 + sp * (T - OPEN)) % 2400) - 240, y = 80 + 920 * OM.hash(i, 4, 41) + 20 * Math.sin(T * 0.4 + i);
              const a = dustA * (0.05 + 0.06 * OM.hash(i, 5, 41));
              for (let k = 0; k < 4; k++) {
                const g = sz * (1 - k * 0.18);
                ctx.globalAlpha = a * (0.4 + 0.2 * k);
                ctx.fillStyle = k > 2 ? ink.hover : ink.lit;
                ctx.fillRect(x - g / 2, y - g / 2, g, g);
              }
            }
            ctx.globalAlpha = 1;
          }

          // The ending: on the 35.11 downbeat the mark's glow behind the title swells, warms to
          // white and floods the frame; the screen's light becomes the white world verse 1 opens on.
          if (T >= BLOOM) {
            const w = OM.prog(T, BLOOM, WHITE);
            const core = OM.mix(ink.lit, white, OM.smooth(OM.clamp(w * 1.6)));
            const R = 120 + 1500 * Math.pow(w, 1.6);
            const g = ctx.createRadialGradient(960, 540, 0, 960, 540, R);
            const [r0, g0, b0] = OM.rgb(core), [r1, g1, b1] = OM.rgb(white);
            g.addColorStop(0, `rgba(${r0},${g0},${b0},${OM.clamp(0.25 + w)})`);
            g.addColorStop(0.55, `rgba(${r1},${g1},${b1},${OM.clamp(w * 1.2) * 0.9})`);
            g.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 1920, 1080);
            ctx.globalAlpha = OM.smooth(OM.prog(T, BLOOM + 0.8, WHITE));
            ctx.fillStyle = white;
            ctx.fillRect(0, 0, 1920, 1080);
            ctx.globalAlpha = 1;
          }
          const streak = T >= LOCK ? OM.smooth(OM.prog(T, LOCK, LOCK + 0.05)) * Math.exp(-(T - LOCK) / 0.45) : 0;
          fx.apply(T, {
            amount: streak * OM.post.envelope(T, OPEN, END, { ramp: 0.4, hold: 0.1 }) * (1 - OM.smooth(OM.prog(T, BLOOM - 0.4, BLOOM))),
            cam: { zoom: zf },
            p0: [16 * dpr, 0, 0, 0],
          });
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
