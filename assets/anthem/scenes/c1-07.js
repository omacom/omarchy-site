// c1-07 · Heartbeat. The flat crest row the cut lands on is a flatline on a
// patient monitor. On the kick the screen opens around it, CRT-style, into a
// lattice grid with a small HR readout. Each sung word is a defibrillator thump:
// the frame jolts, the trace spikes, and the sweep writes that word as a
// one-cell monoline (JetBrains Mono skeletonized onto third-size lattice cells),
// fresh phosphor cooling from crest. The first three beats are weak and broken:
// dim ink, dropouts, a fluttering baseline. The key word is the full beat: an
// atrial bump on the kick before it, a tall spike on its onset, solid crest
// letters, and a glow wave running back along the whole trace that mends every
// broken cell. Then the rhythm holds, one complex per kick, the line pulsing on
// each, until the monitor dims and its light drains, cell by cell in dither
// order, into the pool of the stage spotlight the next scene opens on.
OM.ownWords.add('c1-07');
// Edit camera: each word's defibrillator thump is the scene's own punch, roll and jolt, so the camera's
// backbeat on the third word (107.400) is skipped, and so is its punch on the second kick of the restored
// rhythm (109.016), which the scene's heartbeat swell carries. The downbeat kick before the key word
// (107.936) stays as the small atrial beat, lighter than the key word's thump (down 0.9, not 1.5);
// down is window-wide, so the 110.070 downbeat under the falling light punches at 0.9 too.
OM.edit.plan('c1-07', { down: 0.9, skip: [107.4, 109.02] });
(() => {
  const TYPE = "500 100px 'JetBrains Mono'";
  const NUM = "800 84px 'JetBrains Mono'";
  const LABEL = "500 22px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['c1-07-type'] = Promise.all([TYPE, NUM, LABEL].map((f) => document.fonts.load(f)));

  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  /** A soft elliptical pool of light, drawn exactly as handoff.js draws one. */
  const pool = (ctx, x, y, rx, ry, color, a) => {
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
  /** The `spot` handoff's cone (strength mc) and pool (strength mp); both 1 is the handoff exactly. */
  const spot = (ctx, ink, mc, mp) => {
    const g = ctx.createLinearGradient(0, 0, 0, 880);
    g.addColorStop(0, rgba(ink.lit, 0.1 * mc));
    g.addColorStop(1, rgba(ink.lit, 0.03 * mc));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(900, 0);
    ctx.lineTo(1020, 0);
    ctx.lineTo(1400, 880);
    ctx.lineTo(520, 880);
    ctx.closePath();
    ctx.fill();
    pool(ctx, 960, 880, 440, 110, ink.lit, 0.42 * mp);
  };

  /** Zhang-Suen thinning: a binary grid (zero border) down to a one-cell skeleton, in place. */
  const thin = (g, w, h) => {
    const n = new Uint8Array(8);
    for (let changed = true; changed; ) {
      changed = false;
      for (let pass = 0; pass < 2; pass++) {
        const del = [];
        for (let y = 1; y < h - 1; y++)
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            if (!g[i]) continue;
            n[0] = g[i - w]; n[1] = g[i - w + 1]; n[2] = g[i + 1]; n[3] = g[i + w + 1];
            n[4] = g[i + w]; n[5] = g[i + w - 1]; n[6] = g[i - 1]; n[7] = g[i - w - 1];
            let b = 0, a = 0;
            for (let k = 0; k < 8; k++) {
              b += n[k];
              if (!n[k] && n[(k + 1) & 7]) a++;
            }
            if (b < 2 || b > 6 || a !== 1) continue;
            if (pass ? (n[0] && n[2] && n[6]) || (n[0] && n[4] && n[6]) : (n[0] && n[2] && n[4]) || (n[2] && n[4] && n[6])) continue;
            del.push(i);
          }
        for (const i of del) g[i] = 0;
        if (del.length) changed = true;
      }
    }
  };

  /** A word as a one-cell monoline on lattice L: cells { dc, dr }, dr counted from the caps' centre row. */
  const monoline = (txt, F, L) => {
    const S = 4;
    const font = `500 ${F.toFixed(2)}px 'JetBrains Mono'`;
    const m = document.createElement('canvas').getContext('2d');
    m.font = font;
    const adv = m.measureText(txt).width;
    const cap = m.measureText('H').actualBoundingBoxAscent;
    const rc = Math.ceil(F / L.ch) + 1;
    const W = Math.ceil(adv / L.cw) + 3, H = 2 * rc + 2;
    const cnv = document.createElement('canvas');
    cnv.width = W * S;
    cnv.height = H * S;
    const x = cnv.getContext('2d', { willReadFrequently: true });
    x.scale(S / L.cw, S / L.ch);
    x.font = font;
    x.fillStyle = '#fff';
    x.fillText(txt, L.cw, (rc + 0.5) * L.ch + cap / 2);
    const px = x.getImageData(0, 0, cnv.width, cnv.height).data;
    const g = new Uint8Array(W * H);
    for (let r = 1; r < H - 1; r++)
      for (let q = 1; q < W - 1; q++) {
        let s = 0;
        for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) s += px[((r * S + j) * W * S + q * S + i) * 4 + 3];
        g[r * W + q] = s > 0.32 * 255 * S * S ? 1 : 0;
      }
    thin(g, W, H);
    const cells = [];
    for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) if (g[r * W + q]) cells.push({ dc: q - 1, dr: r - rc });
    return { cells, cols: Math.max(2, Math.ceil(adv / L.cw)) };
  };

  OM.scene({
    id: 'c1-07',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Phosphor persistence: when the frame jolts, the green light lingers where the trace just was, as
      // fading afterglow copies, and the lit phosphor glows faintly into its neighbours. The trace itself
      // stays exactly as drawn: the afterglow only shows on the dark beside it.
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 b = src(q);
  if (uAmount <= 0.0) return b;
  vec4 s1 = src(q + uP0.xy), s2 = src(q + uP0.zw), s3 = src(q + uP1.xy);
  float g1 = smoothstep(0.35, 0.8, s1.g) * step(s1.b + 0.05, s1.g);
  float g2 = smoothstep(0.35, 0.8, s2.g) * step(s2.b + 0.05, s2.g);
  float g3 = smoothstep(0.35, 0.8, s3.g) * step(s3.b + 0.05, s3.g);
  vec2 px = (uRes.y / 1080.0) / uRes;
  float halo = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = 0.7854 * float(i);
    vec4 s = src(q + vec2(cos(a), sin(a)) * 5.0 * px);
    halo += smoothstep(0.5, 0.85, s.g) * step(s.b + 0.05, s.g);
  }
  float glow = max(max(0.6 * g1, 0.38 * g2), max(0.22 * g3, 0.06 * halo)) * uAmount;
  vec3 after = mix(vec3(0.055, 0.055, 0.078), vec3(0.620, 0.808, 0.416), glow);
  return vec4(max(b.rgb, after), 1.0);
}`,
      });
      const ink = OM.fieldInks('tokyo-night');
      const th = OM.theme('tokyo-night');
      const end = start + duration;
      const HL = OM.HOME;
      const L = OM.lattice({ wordWidth: 1180 / 3, wordX: 370, wordY: 404 }); // third-size cells on the home lattice's lines
      const C0 = L.cMin, C1 = L.cMin + L.cols - 1;
      const R0 = 3 * OM.cellAt(HL, 960, 540).row + 1; // the trace: the middle third of the handoff's crest row
      const yLine = L.y0 + (R0 + 0.5) * L.ch;
      const sung = OM.sung('c1-07');
      const on = sung.map((w) => w.t0);

      // ---- hits, on the drum as measured on the song (OM.T.drums): the nearest within 50 ms ----
      const onDrum = (t, kind) => OM.edit.hits(kind, t - 0.05, t + 0.05).reduce((m, h) => (m === null || Math.abs(h[0] - t) < Math.abs(m - t) ? h[0] : m), null) ?? t;
      const HOLD = 0.07; // the first and last two frames are the handoffs exactly
      const POWER = start + HOLD; // first frame after the 106.42 kick: the screen opens
      const P_WAVE = 107.95; // kick + downbeat: the atrial bump before the key beat
      const KICKS = [108.55, 109.02, 109.62].map((t) => onDrum(t, 'kick')); // the rhythm the key word restores: 108.514, 109.016, 109.580
      const BLINKS = [109.37, 109.55].map((t) => onDrum(t, 'snare'));
      const THROBS = [onDrum(109.76, 'kick'), onDrum(110.06, 'kick'), onDrum(110.16, 'snare')];
      const TAIL_END = 109.8; // the sweep leaves the screen
      const DRAIN = 109.8, FALL = 0.34; // light falls to the floor, landing from the 110.11 downbeat
      const LAND = end - HOLD - 0.1;
      const D = [0.08, 0.08, 0.1, 0.12]; // seconds to write each word: quick, so each word reads right on its onset
      const JOLT = [5, 6, 8, 16]; // px of thump per word
      const AMP = [9, 11, 13, 42], DIP = [3, 3, 4, 10]; // spike height and dip, in cells
      const WEAK = [ink.mid, ink.mid, ink.lit], DROP = [0.34, 0.26, 0.18];

      // ---- layout, in third cells ----
      const SPIKE = 4, PRE = 5, POST = 3, FLAT = [0, 8, 8, 20], MARGIN = 12, TAILGAP = 12;
      const N = Math.floor(1920 / L.cw);
      const capF = (cells) => (cells * L.ch) / 0.73; // font size whose caps are this many cells tall
      const meas = document.createElement('canvas').getContext('2d');

      const make = () => {
        const txt = sung.map((w) => (w.text || '').toUpperCase());
        meas.font = TYPE;
        const per = txt.reduce((s, w) => s + meas.measureText(w).width, 0) / 100 / L.cw; // letter cols per px of font
        const room = (tail) => N - MARGIN - 4 * (SPIKE + PRE + POST) - FLAT[1] - FLAT[2] - FLAT[3] - tail;
        // Caps 20 cells down to 13; past that the rhythm's tail gives way, then the caps again.
        let tail = 60;
        let F = OM.clamp(room(tail) / per, capF(13), capF(20));
        if (per * F > room(tail)) {
          tail = Math.max(40, tail - Math.ceil(per * F - room(tail)));
          F = Math.max(capF(8), Math.min(F, room(tail) / per));
        }
        const spare = Math.max(0, Math.floor(room(tail) - per * F));
        let q = C0 + 1 + MARGIN + Math.floor(spare * 0.4);
        const words = txt.map((s, k) => {
          if (k) q += FLAT[k];
          const m = monoline(s, F, L);
          const w = { s: q, l0: q + SPIKE + PRE, l1: q + SPIKE + PRE + m.cols, m };
          q = w.l1 + POST;
          return w;
        });

        // The sweep: the head's column over time, piecewise linear, rushing through each word.
        const keys = [[start + HOLD, C0 - 6]]; // from off-screen, so the erase gap slides in rather than pops
        words.forEach((w, k) => {
          const d = Math.min(D[k], (k < 3 ? on[k + 1] : TAIL_END) - on[k] - 0.08);
          keys.push([on[k] - 0.012, w.s], [on[k] + 0.024, w.l0], [on[k] + 0.024 + d, w.l1]);
        });
        // After the key word the beam lunges clear of it, so the first complex never reads as a letter.
        const k3 = keys[keys.length - 1];
        keys.push([k3[0] + 0.05, k3[1] + TAILGAP], [TAIL_END, Math.max(C1 + 3, k3[1] + TAILGAP + 1)]);
        const colAt = (T) => {
          if (T <= keys[0][0]) return keys[0][1];
          for (let i = 1; i < keys.length; i++) {
            if (T > keys[i][0]) continue;
            const [ta, qa] = keys[i - 1], [tb, qb] = keys[i];
            return qa + ((qb - qa) * (T - ta)) / (tb - ta);
          }
          return keys[keys.length - 1][1];
        };
        const timeAt = (col) => {
          for (let i = 1; i < keys.length; i++) {
            if (col > keys[i][1]) continue;
            const [ta, qa] = keys[i - 1], [tb, qb] = keys[i];
            return ta + ((tb - ta) * (col - qa)) / (qb - qa || 1);
          }
          return Infinity;
        };

        // The trace's cells. Rows are relative to the baseline while building (up is negative).
        const cells = [], used = new Set(), blank = new Set();
        const add = (col, r, kind, k) => cells.push({ q: col, r: R0 + r, kind, k });
        const poly = (pts, kind, k) => {
          const seen = new Set();
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            const n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))));
            for (let j = 0; j <= n; j++) {
              const cq = Math.round(a[0] + ((b[0] - a[0]) * j) / n), cr = Math.round(a[1] + ((b[1] - a[1]) * j) / n);
              if (seen.has(cq * 1000 + cr)) continue;
              seen.add(cq * 1000 + cr);
              used.add(cq);
              add(cq, cr, kind, k);
            }
          }
        };
        const free = (a, b) => {
          for (let col = a; col <= b; col++) if (used.has(col) || blank.has(col) || col > C1) return false;
          return true;
        };
        const bump = (tc, half, amp, kind, k) => {
          const a = Math.round(colAt(tc - half)), b = Math.round(colAt(tc + half));
          if (b - a < 2 || !free(a, b)) return;
          const pts = [];
          for (let col = a; col <= b; col++) pts.push([col, -amp * Math.sin((Math.PI * (col - a)) / (b - a))]);
          poly(pts, kind, k);
        };
        words.forEach((w, k) => {
          const s = w.s, wide = k === 3 ? 1.5 : 1;
          poly([[s, 0], [s + wide, -AMP[k]], [s + 2 * wide, DIP[k]], [s + 2 * wide + 1, 0]], 'spike', k);
          for (let col = s + SPIKE; col < w.l0; col++) blank.add(col);
          for (let col = w.l1; col < w.l1 + POST; col++) blank.add(col);
          for (let col = w.l0; col < w.l1; col++) used.add(col);
          for (const { dc, dr } of w.m.cells) add(w.l0 + dc, dr, 'let', k);
        });
        bump(P_WAVE, 0.07, 3, 'p', 3);
        for (const kt of KICKS) {
          const qc = Math.round(colAt(kt));
          if (!free(qc - 1, qc + 2)) continue;
          bump(kt - 0.11, 0.04, 2, 'cplx', 4);
          poly([[qc - 1, 0], [qc - 0.5, 2], [qc, -16], [qc + 1, 4], [qc + 2, 0]], 'cplx', 4);
          bump(kt + 0.22, 0.09, 4, 'cplx', 4);
        }
        for (let col = C0; col <= C1; col++) if (!used.has(col) && !blank.has(col)) add(col, 0, 'flat', -1);

        // Per cell: when the sweep writes it, when the key word's glow wave mends it, and its inks.
        const s3 = words[3].s;
        for (const cl of cells) {
          const early = cl.q < s3;
          cl.at = timeAt(cl.q);
          cl.thr = OM.threshold(cl.q, cl.r);
          cl.h = OM.hash(cl.q, cl.r, 71);
          cl.heal = early ? on[3] + 0.03 + (0.42 * (s3 - cl.q)) / (s3 - C0) : -Infinity;
          cl.drop = !early ? 0 : cl.kind === 'flat' ? 0.12 : cl.k < 3 ? DROP[cl.k] : 0;
          cl.fl = early && cl.kind === 'flat' && OM.hash(cl.q, 5, 9) > 0.78 ? (OM.hash(cl.q, 6, 9) > 0.5 ? -1 : 1) * (OM.hash(cl.q, 7, 9) > 0.6 ? 2 : 1) : 0;
          cl.weak = cl.kind === 'let' && cl.k < 3 ? WEAK[cl.k] : ink.mid;
          cl.rest = cl.kind === 'let' ? (cl.k === 3 ? ink.crest : ink.hover) : cl.kind === 'flat' ? ink.lit : ink.hover;
        }
        // Where the beam sits in each column: spike and complex tops, else the stroke nearest the last.
        const byCol = new Map();
        for (const cl of cells) {
          if (!byCol.has(cl.q)) byCol.set(cl.q, []);
          byCol.get(cl.q).push(cl);
        }
        const rowAt = new Int16Array(C1 - C0 + 1);
        let prev = R0;
        for (let col = C0; col <= C1; col++) {
          const list = byCol.get(col);
          if (list) {
            const peak = list[0].kind === 'spike' || list[0].kind === 'cplx' || list[0].kind === 'p';
            let best = list[0].r + list[0].fl;
            for (const cl of list) {
              const r = cl.r + cl.fl;
              if (peak ? r < best : Math.abs(r - prev) < Math.abs(best - prev)) best = r;
            }
            prev = best;
          }
          rowAt[col - C0] = prev;
        }
        return { ok: document.fonts.check(TYPE), cells, colAt, rowAt, words };
      };

      // ---- glow: the trace redrawn small, blurred, and added back over itself ----
      const BS = 0.25, BY = 180, BH = 540;
      const g0 = document.createElement('canvas'), g1 = document.createElement('canvas');
      g0.width = g1.width = 1920 * BS;
      g0.height = g1.height = BH * BS;
      const b0 = g0.getContext('2d'), b1 = g1.getContext('2d');

      /** Defibrillator thump: the frame jolts on each word, softly on each kick after. [x, y, flash] */
      const joltAt = (T) => {
        let jx = 0, jy = 0, flash = 0;
        const jolt = (t0, amp) => {
          const a = T - t0;
          if (a < 0 || a > 0.5) return;
          const e = Math.exp(-a / 0.07);
          jy += amp * e * Math.cos(a * 57);
          jx += amp * 0.4 * e * Math.sin(a * 83);
          flash = Math.max(flash, (amp / 16) * Math.pow(0.5, a / 0.08));
        };
        on.forEach((t0, k) => jolt(t0, JOLT[k]));
        KICKS.forEach((t0) => jolt(t0, 2.5));
        return [jx, jy, flash];
      };

      // ---- camera: a punch and a kick of roll on every thump, a heartbeat swell on every kick after the
      // key word; then it cranes up off the monitor as the light drains, held high for c1-08 to crane down from ----
      const CR = OM.c1.crane78;
      const camAt = (T) => {
        let zoom = 0, rot = 0;
        on.forEach((t0, k) => {
          const a = T - t0;
          if (a < 0) return;
          const e = (1 - Math.exp(-a / 0.012)) * Math.exp(-a / 0.11);
          zoom += 0.0028 * JOLT[k] * e;
          rot += ((0.05 * JOLT[k] * Math.PI) / 180) * e * Math.cos(a * 41) * (k % 2 ? -1 : 1);
        });
        for (const t0 of KICKS) {
          const a = T - t0;
          if (a >= 0) zoom += 0.014 * Math.sin(Math.PI * Math.min(1, a / 0.16)) * Math.exp(-a / 0.2);
        }
        const up = OM.smooth(OM.prog(T, DRAIN, end - HOLD));
        const e = OM.post.envelope(T, start, end + 9, { ramp: 0.3, hold: HOLD }) * (1 - up);
        const y = CR.Y * up;
        return { zoom: (1 + zoom * e) * OM.c1.cover(rot * e, 0, y), rot: rot * e, x: 0, y };
      };
      const look = (T) => {
        const cam = camAt(T);
        const J = joltAt(T), uvOf = (d) => {
          const P = joltAt(T - d);
          return [(J[0] - P[0]) / 1920, -(J[1] - P[1]) / 1080];
        };
        const amount = OM.post.envelope(T, start, end, { ramp: 0.3, hold: HOLD }) * Math.min(1, 0.35 + 1.2 * J[2]) * (1 - OM.smooth(OM.prog(T, DRAIN, DRAIN + 0.3)));
        return { amount, cam, p0: [...uvOf(0.03), ...uvOf(0.07)], p1: [...uvOf(0.12), 0, 0] };
      };

      let M = null;
      return OM.c1.post({
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          // Frames render in any order: never inherit state from the last one.
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          if (T < start + HOLD) return OM.handoff('line', ctx, T, dpr);
          if (T > end - HOLD) return OM.handoff('spot', ctx, T, dpr);
          if (!M || (!M.ok && document.fonts.check(TYPE))) M = make();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          // The stage light arriving under the drain.
          const mc = OM.smooth(OM.prog(T, DRAIN, LAND)), mp = OM.smooth(OM.prog(T, DRAIN + FALL * 0.9, LAND));
          if (mc > 0) spot(ctx, ink, mc, mp);
          // Pause sprinkles. Monitor blink: the snares at 109.334 and 109.534 blink the HR lamp and flare the grid.
          // Drain throb: the 109.738 and 110.022 kicks and the 110.192 snare pulse the falling trace.
          const blink = OM.pulse(BLINKS, T, 0.06) * (T < 109.75 ? 1 : 0);
          // Defibrillator thump: the frame jolts on each word, softly on each kick after.
          const [jx, jy, flash] = joltAt(T);
          ctx.save();
          ctx.translate(Math.round(jx * dpr) / dpr, Math.round(jy * dpr) / dpr);

          // The monitor: the grid opens out of the line like a CRT warming up, flares on each thump.
          const dim = 1 - OM.smooth(OM.prog(T, 109.7, 110.08));
          const reach = 620 * OM.ease.outCubic(OM.prog(T, POWER, POWER + 0.36));
          if (dim > 0 && reach > 1) {
            const snap = (v) => Math.round(v * dpr) / dpr;
            const ga = dim * (1 + 1.4 * flash + 0.9 * blink);
            ctx.fillStyle = ink.dim;
            for (let r = HL.rMin; r <= HL.rMin + HL.rows; r++) {
              const y = HL.y0 + r * HL.ch;
              if (Math.abs(y - yLine) > reach) continue;
              ctx.globalAlpha = Math.min(1, (r % 5 === 0 ? 0.8 : 0.32) * ga);
              ctx.fillRect(-40, snap(y), 2000, 1);
            }
            for (let col = HL.cMin; col <= HL.cMin + HL.cols; col++) {
              ctx.globalAlpha = Math.min(1, (col % 5 === 0 ? 0.8 : 0.32) * ga);
              ctx.fillRect(snap(HL.x0 + col * HL.cw), yLine - reach, 1, 2 * reach);
            }
            ctx.globalAlpha = 1;
          }

          // The old flatline ahead of the beam, thinning to one cell and cooling, an erase gap before the head.
          const head = M.colAt(T);
          const m = OM.prog(T, start + HOLD, start + 0.34);
          for (let col = Math.max(C0, Math.floor(head) + 4); col <= C1; col++) {
            const a = OM.threshold(col, R0);
            ctx.fillStyle = a > m ? ink.crest : ink.mid;
            OM.cell(ctx, L, col, R0, dpr);
            ctx.fillStyle = ink.crest;
            for (const r of [R0 - 1, R0 + 1]) if (OM.threshold(col, r) > m) OM.cell(ctx, L, col, r, dpr);
          }
          const hq = Math.floor(head);
          const headOn = hq >= C0 && hq <= C1 && T < TAIL_END;
          const hr = headOn ? M.rowAt[hq - C0] : 0;
          if (headOn) pool(ctx, L.x0 + (hq + 0.5) * L.cw, L.y0 + (hr + 0.5) * L.ch, 44, 44, ink.lit, T < on[3] ? 0.3 : 0.5);

          // The trace: written by the sweep, cooling from crest; broken until the key word mends it.
          const beat = OM.pulse([...KICKS, ...THROBS], T, 0.11);
          const drawn = [];
          for (const cl of M.cells) {
            if (cl.at > T) continue;
            const healed = T >= cl.heal;
            if (!healed && cl.h < cl.drop) continue;
            const cool = (T - (healed && cl.heal > cl.at ? cl.heal : cl.at)) / 0.35;
            let fill = cl.thr > cool ? ink.crest : cl.thr > cool * 0.6 ? ink.hover : healed ? cl.rest : cl.weak;
            if (beat * 0.85 > cl.thr) fill = ink.crest;
            const r = cl.r + (healed ? 0 : cl.fl);
            const p = T < DRAIN ? 0 : (T - DRAIN - 0.28 * cl.thr) / FALL;
            if (p >= 1) continue;
            if (p <= 0) {
              ctx.fillStyle = fill;
              OM.cell(ctx, L, cl.q, r, dpr);
              drawn.push(L.x0 + cl.q * L.cw, L.y0 + r * L.ch, fill);
              continue;
            }
            // Draining: the cell drops toward the pool, gathering in, its streak lengthening as it falls.
            const x = L.x0 + cl.q * L.cw, y = L.y0 + r * L.ch;
            const xx = x + (960 + (x - 960) * 0.45 - x) * OM.smooth(p);
            const yy = y + (868 + 24 * (cl.h - 0.5) - y) * p * p;
            const hh = L.ch * (1 + 4 * p);
            ctx.globalAlpha = 1 - p * p;
            ctx.fillStyle = fill;
            ctx.fillRect(xx, yy - hh + L.ch, L.cw, hh);
            ctx.globalAlpha = 1;
          }
          if (headOn) {
            ctx.fillStyle = ink.crest;
            OM.cell(ctx, L, hq, hr, dpr);
            drawn.push(L.x0 + hq * L.cw, L.y0 + hr * L.ch, ink.crest);
          }

          // Vitals: no rate through the weak beats; the key word brings it back, and it settles at the song's tempo.
          const ro = OM.smooth(OM.prog(T, 106.5, 106.64)) * dim;
          if (ro > 0) {
            const alive = T >= on[3];
            const lamp = OM.pulse([on[3], ...KICKS], T, 0.11);
            ctx.globalAlpha = ro;
            ctx.font = LABEL;
            ctx.fillStyle = th['text-muted'];
            ctx.fillText('HR', 1640, 124);
            ctx.textAlign = 'right';
            ctx.fillText('bpm', 1836, 252);
            ctx.font = NUM;
            ctx.fillStyle = alive ? (lamp > 0.5 ? ink.crest : ink.lit) : flash > 0.2 ? th.text : th['text-muted'];
            ctx.fillText(alive ? String(T >= KICKS[1] ? 112 : T >= KICKS[0] ? 88 : 60) : '---', 1836, 216);
            ctx.textAlign = 'left';
            ctx.fillStyle = (alive && lamp > 0.3) || blink > 0.3 ? ink.crest : flash > 0.2 ? ink.mid : ink.dim;
            ctx.fillRect(1640, 196, 20, 20);
            ctx.globalAlpha = 1;
          }

          // Glow along the trace, brighter once the heart is back and on every beat.
          const bl = Math.min(1, (T < on[3] ? 0.45 : 0.8) + 0.5 * beat + 0.5 * OM.pulse([on[3]], T, 0.3)) * (1 - OM.prog(T, DRAIN, DRAIN + 0.25));
          if (bl > 0.01 && drawn.length) {
            b0.clearRect(0, 0, g0.width, g0.height);
            let x0 = 1920, x1 = 0, y0 = 1080, y1 = 0;
            for (let i = 0; i < drawn.length; i += 3) {
              const x = drawn[i], y = drawn[i + 1];
              b0.fillStyle = drawn[i + 2];
              b0.fillRect(x * BS, (y - BY) * BS, L.cw * BS, L.ch * BS);
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
            b1.clearRect(0, 0, g1.width, g1.height);
            b1.filter = 'blur(2.5px)';
            b1.drawImage(g0, 0, 0);
            b1.filter = 'none';
            // Composite only around the lit cells: the upscaled add is the frame's dearest step.
            const pad = 32;
            x0 = Math.max(0, x0 - pad);
            x1 = Math.min(1920, x1 + L.cw + pad);
            y0 = Math.max(BY, y0 - pad);
            y1 = Math.min(BY + BH, y1 + L.ch + pad);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = bl;
            if (x1 > x0 && y1 > y0) ctx.drawImage(g1, x0 * BS, (y0 - BY) * BS, (x1 - x0) * BS, (y1 - y0) * BS, x0, y0, x1 - x0, y1 - y0);
          }
          ctx.restore();
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';

          // Blip sparks thrown off the top of each spike as the beam writes it.
          M.words.forEach((w, k) => {
            const x = L.x0 + (w.s + (k === 3 ? 1.5 : 1) + 0.5) * L.cw + jx, y = L.y0 + (R0 - AMP[k] + 0.5) * L.ch + jy;
            OM.c1.burst(T, on[k], k === 3 ? 22 : 10, 0xc107 + k, { x, y, speed: k === 3 ? 560 : 320, spread: Math.PI * 1.2, g: 700, life: k === 3 ? 0.5 : 0.34 }, (px, py, u, i) => {
              ctx.globalAlpha = 1 - u;
              ctx.fillStyle = u < 0.3 ? ink.crest : i % 2 ? ink.hover : ink.lit;
              ctx.fillRect(px - L.cw / 2, py - L.ch / 2, L.cw, L.ch);
            });
          });
          ctx.globalAlpha = 1;
        },
        release: () => {
          c.release();
          g0.width = g1.width = 0;
        },
      }, fx, look);
    },
  });
})();
