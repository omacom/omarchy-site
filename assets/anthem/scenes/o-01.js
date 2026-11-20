// o-01 · Drain into the core. Home: the field and the wordmark, as x-o1
// leaves them. The wordmark fires each sung word out of itself in lattice type,
// the cells slamming into a line beneath it on the word's onset and lighting the
// field where they land; the key word storms in from every edge and flashes the
// whole line. On the hard stop a vortex grabs everything, field cells, wordmark
// and words, spiralling them clockwise into the frame centre, accelerating, the
// three snares kicking the spin, until all of it is a dense glowing core still
// turning, specks falling into it: the shared state x-end carries on from.
OM.ownWords.add('o-01');
// Edit camera: the key word's own camera kick (on its onset) is the scene's biggest move; the drumless
// 291.344 downbeat 155 ms before it would punch first and blunt it, so that beat is skipped. The rest
// fit as they are (the 290.812 jolt lands with the third word on its snare).
OM.edit.plan('o-01', { skip: [291.344] });
(() => {
  const TYPE = "800 100px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['o-01-type'] = document.fonts.load(TYPE);

  const CX = 960, CY = 540;
  /** The finale, shared with x-end: the cut frame and the vortex's turning sense. */
  OM.finale = {
    /**
     * The cut state both scenes draw (o-01 into it, x-end out of it): a dense, glowing core still spinning
     * at the frame centre, specks spiralling into it, charging tighter and brighter on the hi-hat roll until
     * the snare at 295.079. A pure function of T; it fades in over the vortex from 292.95. bg: clear to night.
     */
    core(ctx, T, dpr, bg = true) {
      const ink = OM.fieldInks('tokyo-night');
      const C0 = 293.2, END = 295.079, SPIN = OM.finale.SPIN;
      if (bg) {
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
      }
      const a = OM.smooth(OM.prog(T, 292.95, 293.4));
      if (a <= 0) return;
      const p = OM.prog(T, C0, END), tau = T - C0;
      const turn = 7 * tau + 1.6 * tau * Math.abs(tau); // the spin, speeding up as it charges
      // Flicker on the hats: an ever faster seeded strobe through the inks.
      const ph = 5 * tau + 0.5 * ((30 - 5) / (END - C0)) * tau * Math.abs(tau);
      const f = OM.hash(Math.floor(ph), 0, 517), lvl = tau < 0 ? 1 : f > 0.82 ? 2 : f > 0.3 ? 1 : 0;
      const Rc = 64 - 38 * p;
      const sn = (v) => Math.round(v * dpr) / dpr;
      ctx.globalAlpha = a;
      // The last specks falling in: no new ones set off in the final 0.35 s, so the core draws the last of them in.
      for (let i = 0; i < 140; i++) {
        const h1 = OM.hash(i, 1, 523), h2 = OM.hash(i, 2, 523), h3 = OM.hash(i, 3, 523);
        const per = 0.5 + 0.55 * h2, x = (T - C0) / per + h3, n = Math.floor(x), u = x - n;
        if (C0 + (n - h3) * per > END - 0.35) continue;
        const r = Rc * 0.8 + (110 + 420 * h1) * Math.pow(1 - u, 2);
        const th = h1 * 6.283 + n * 2.1 + SPIN * (0.5 * turn + 3.5 * u * u);
        ctx.fillStyle = u > 0.75 ? ink.crest : h2 > 0.5 ? ink.lit : ink.mid;
        const s = u > 0.6 ? 3 : 4;
        ctx.fillRect(sn(960 + r * Math.cos(th)), sn(540 + r * Math.sin(th)), s, s);
      }
      // The glow, swelling and strobing.
      const glow = (0.5 + 0.4 * p) * (lvl === 0 ? 0.55 : lvl === 2 ? 1.25 : 1);
      const rad = Rc * 3.8;
      const [r0, g0, b0] = OM.rgb(ink.lit);
      const gr = ctx.createRadialGradient(960, 540, 0, 960, 540, rad);
      gr.addColorStop(0, `rgba(${r0},${g0},${b0},${Math.min(0.9, glow)})`);
      gr.addColorStop(1, `rgba(${r0},${g0},${b0},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(960 - rad, 540 - rad, 2 * rad, 2 * rad);
      // The disc: specks on orbits, the inner ones faster, brighter toward the middle.
      for (let i = 0; i < 260; i++) {
        const h1 = OM.hash(i, 1, 529), h2 = OM.hash(i, 2, 529);
        const rn = Math.sqrt(h1), r = Rc * rn;
        const th = h2 * 6.283 + SPIN * turn * (1.4 - 0.6 * rn);
        ctx.fillStyle = rn < 0.35 ? ink.crest : rn < 0.7 ? ink.hover : ink.lit;
        const s = rn < 0.5 ? 4 : 3;
        ctx.fillRect(sn(960 + r * Math.cos(th) - s / 2), sn(540 + r * Math.sin(th) - s / 2), s, s);
      }
      const k = sn(4 + 6 * p);
      ctx.fillStyle = lvl === 2 ? ink.crest : ink.hover;
      ctx.fillRect(sn(960 - k / 2), sn(540 - k / 2), k, k);
      ctx.globalAlpha = 1;
    },
    /** +1: the vortex turns clockwise on screen (x-end unwinds it the other way). */
    SPIN: 1,
  };

  // The drain's smear: each pixel gathers light from further round its orbit and further out
  // along its radius, so the spiral reads as motion (uP0.x arc length, uP0.y inward pull).
  const FX = `
vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec3 c = src(p).rgb;
  if (uAmount <= 0.0) return vec4(c, 1.0);
  float a = uRes.x / uRes.y;
  vec2 d = (p - 0.5) * vec2(a, 1.0);
  float r = length(d) + 1e-4;
  float th = atan(d.y, d.x);
  vec3 acc = c;
  float wsum = 1.0;
  for (int i = 1; i <= 10; i++) {
    float f = float(i) / 10.0;
    float t2 = th + uP0.x * f * uAmount / (0.12 + r);
    float r2 = r * (1.0 + uP0.y * f * uAmount);
    vec2 q = vec2(cos(t2), sin(t2)) * r2 / vec2(a, 1.0) + 0.5;
    float w = 1.0 - 0.7 * f;
    acc += src(q).rgb * w;
    wsum += w;
  }
  vec3 s = acc / wsum;
  return vec4(max(c, mix(c, s * 1.15, uAmount)), 1.0);
}`;

  OM.scene({
    id: 'o-01',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const ink = OM.fieldInks('tokyo-night');
      const L = OM.HOME;
      const end = start + duration;
      const on = OM.words('o-01');
      const last = on.length - 1;
      const STOP = 292.107; // the hard stop: the line has read, the vortex grabs
      const COLL = 293.5; // the last snare snaps the vortex into the core: from here to the cut, the core alone
      // The three snares, on the drum as measured on the song.
      const SNARES = [293.2, 293.38, 293.5].map((t) => {
        let best = t, d = 0.05;
        for (const [x] of OM.edit.hits('snare', t - 0.05, t + 0.05)) if (Math.abs(x - t) < d) (d = Math.abs(x - t)), (best = x);
        return best;
      });
      // Each word's flight: fired out of the wordmark DUR before its onset, its cells accelerate and slam
      // into the line ON the onset (the first frame with the word whole is the onset's); the key word
      // storms in from the edges over a longer flight and lands on its onset the same way.
      const DUR = (w) => (w === last ? 0.1 : 0.05);
      const FIRE = (w) => on[w] - DUR(w);
      const LAND = (w) => on[w];
      const P = 9; // lattice type pitch

      // ---- the line in lattice type, laid out once the face is in ----
      let LAY = null;
      const layout = () => {
        if (LAY && (LAY.ok || !document.fonts.check(TYPE))) return LAY;
        const ok = document.fonts.check(TYPE);
        const sung = OM.sung('o-01');
        const words = sung.map((w) => w.text || '###');
        const m = document.createElement('canvas').getContext('2d');
        m.font = TYPE;
        const capR = m.measureText('H').actualBoundingBoxAscent / 100 || 0.73;
        const widths = (cap, a, b) => {
          m.font = `800 ${(cap / capR).toFixed(2)}px 'JetBrains Mono'`;
          const sp = m.measureText(' ').width;
          const xs = [];
          let w = 0;
          for (let i = a; i < b; i++) {
            if (i > a && sung[i].space !== false) w += sp;
            xs.push(w);
            w += m.measureText(words[i]).width;
          }
          return { xs, w };
        };
        const MAXW = 1720;
        let lines;
        let cap = 72;
        const one = widths(72, 0, words.length);
        if (one.w <= MAXW || (72 * MAXW) / one.w >= 60) {
          cap = Math.min(72, Math.floor((72 * MAXW) / one.w));
          lines = [[0, words.length]];
        } else {
          let best = null;
          for (let s = 1; s < words.length; s++) {
            const w = Math.max(widths(72, 0, s).w, widths(72, s, words.length).w);
            if (!best || w < best.w) best = { w, s };
          }
          cap = Math.min(72, Math.floor((72 * MAXW) / best.w));
          lines = [[0, best.s], [best.s, words.length]];
        }
        const cells = [];
        const centre = words.map(() => ({ x: CX, y: 800 }));
        lines.forEach(([a, b], li) => {
          const base = lines.length === 1 ? 818 : 740 + cap + li * (cap + 34);
          const lw = widths(cap, a, b);
          const x0 = CX - lw.w / 2;
          for (let i = a; i < b; i++) {
            const t = OM.c1.type(words[i], x0 + lw.xs[i - a], base, cap);
            let sx = 0, sy = 0;
            for (const [x, y, f] of t.cells) {
              cells.push({ x, y, f, w: i, k: cells.length });
              sx += x;
              sy += y;
            }
            const n = t.cells.length || 1;
            centre[i] = { x: sx / n + 4, y: sy / n + 4 };
          }
        });
        LAY = { ok, cells, centre };
        VX = null;
        return LAY;
      };

      // ---- the vortex material: field (frozen at the stop), wordmark and words ----
      const INKS = [ink.dim, ink.mid, ink.lit, ink.hover, ink.crest, ink.bg];
      const inkIx = (hex) => Math.max(0, INKS.indexOf(hex));
      let VX = null;
      const vortexItems = () => {
        const lay = layout();
        if (VX) return VX;
        const list = [];
        for (const { col, row } of OM.heroLit(STOP, L, { gain: 0.8 })) list.push([L.x0 + col * L.cw, L.y0 + row * L.ch, L.cw, L.ch, 0]);
        for (const [col, row] of OM.cells(OM.WORDMARK)) list.push([L.x0 + col * L.cw, L.y0 + row * L.ch, L.cw, L.ch, inkIx(ink[OM.BANDS[row]])]);
        for (const k of lay.cells) list.push([k.x, k.y, 8, 8, inkIx(OM.c1.typeInk(k.f, ink))]);
        const n = list.length;
        const R = new Float32Array(n), TH = new Float32Array(n), W = new Float32Array(n), H = new Float32Array(n), PW = new Float32Array(n), I = new Uint8Array(n);
        let rMax = 1;
        list.forEach(([x, y, w, h], i) => (rMax = Math.max(rMax, Math.hypot(x + w / 2 - CX, y + h / 2 - CY))));
        list.forEach(([x, y, w, h, ix], i) => {
          const dx = x + w / 2 - CX, dy = y + h / 2 - CY;
          R[i] = Math.hypot(dx, dy);
          TH[i] = Math.atan2(dy, dx);
          W[i] = w;
          H[i] = h;
          // Inner material falls first; the edges hang on and then rush in.
          PW[i] = 1.5 + 1.8 * (R[i] / rMax) + 0.5 * OM.hash(i, 3, 91);
          I[i] = ix;
        });
        VX = { n, RMAX: rMax, R, TH, W, H, PW, I, X: new Float32Array(n), Y: new Float32Array(n), S: new Float32Array(n), O: new Uint8Array(n) };
        return VX;
      };
      /** Total turn of the vortex at T: a slow grab, a steep acceleration, a kick on each snare. */
      const spin = (T) => {
        const u = OM.prog(T, STOP, COLL);
        let s = 2 * Math.PI * 1.3 * Math.pow(u, 2.4);
        for (const h of SNARES) if (T > h) s += 0.9 * (1 - Math.exp(-(T - h) / 0.05));
        return s;
      };
      /** Radius left (0..1) for an object with fall power pw. */
      const left = (T, pw) => {
        const u = OM.prog(T, STOP, COLL);
        let k = 1 - Math.pow(u, pw);
        for (const h of SNARES) if (T > h) k *= 1 - 0.2 * (1 - Math.exp(-(T - h) / 0.03));
        return k;
      };

      const vortex = (ctx, T, dpr) => {
        const v = vortexItems();
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const S = spin(T) * OM.finale.SPIN;
        const px = 1 / dpr;
        for (let i = 0; i < v.n; i++) {
          const k = left(T, v.PW[i]);
          // Differential turn: the nearer the drain, the faster the orbit, so the frame winds into arms.
          const r = v.R[i] * k;
          const th = v.TH[i] + S / (0.22 + 1.6 * (r / v.RMAX));
          v.X[i] = CX + r * Math.cos(th);
          v.Y[i] = CY + r * Math.sin(th);
          v.S[i] = Math.max(px, Math.pow(k, 0.6));
          // Heating as it nears the drain: everything burns down to lit green.
          v.O[i] = k < 0.14 ? 2 : k < 0.3 ? Math.max(v.I[i], 2) : k < 0.55 && v.I[i] === 0 ? 1 : v.I[i];
        }
        for (let ix = 0; ix < 5; ix++) {
          ctx.fillStyle = INKS[ix];
          for (let i = 0; i < v.n; i++) {
            if (v.O[i] !== ix) continue;
            const w = Math.max(px, v.W[i] * v.S[i]), h = Math.max(px, v.H[i] * v.S[i]);
            const x = Math.round((v.X[i] - w / 2) * dpr) / dpr, y = Math.round((v.Y[i] - h / 2) * dpr) / dpr;
            ctx.fillRect(x, y, Math.max(px, Math.round(w * dpr) / dpr), Math.max(px, Math.round(h * dpr) / dpr));
          }
        }
      };

      const home = (ctx, T, dpr) => {
        const lay = layout();
        // Impacts: each word lights the field and wordmark where it lands, the wordmark kicks as it fires.
        const fade = 1 - OM.smooth(OM.prog(T, STOP - 0.3, STOP));
        const glows = [];
        on.forEach((t0, i) => {
          const big = i === last;
          const a = T - LAND(i), f = T - t0;
          if (f >= 0 && f < 0.4 && !big) glows.push({ x: CX, y: CY, strength: 0.55 * Math.exp(-f / 0.07) * fade, reach: 420 });
          if (a < 0 || a > 1.6) return;
          glows.push({ x: lay.centre[i].x, y: lay.centre[i].y, strength: (big ? 1.35 : 0.95) * Math.exp(-a / (big ? 0.26 : 0.16)) * fade, reach: big ? 820 : 320 });
        });
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        OM.hero(ctx, T, dpr, { inks: ink, L, word: false, gain: 0.8, bg: false, glows });
        OM.paintWord(ctx, L, dpr, ink, { glows });
        // The line: each word's cells fired out of the wordmark (the key word storms in from every edge).
        const flash = T - LAND(last);
        const vis = [];
        for (const k of lay.cells) {
          const t0 = FIRE(k.w);
          if (T < t0) continue;
          const a = T - t0, dur = DUR(k.w), big = k.w === last;
          const e = OM.clamp(a / dur) ** 2;
          const h1 = OM.hash(k.k, 1, 211), h2 = OM.hash(k.k, 2, 211);
          let fx0, fy0;
          if (big) {
            const ctr = lay.centre[k.w];
            const ang = Math.atan2(k.y - ctr.y, k.x - ctr.x) + (h1 - 0.5) * 0.9, d = 1100 + 500 * h2;
            fx0 = ctr.x + Math.cos(ang) * d;
            fy0 = ctr.y + Math.sin(ang) * d;
          } else {
            const [col, row] = WM[Math.floor(h1 * WM.length)];
            fx0 = L.x0 + (col + 0.5) * L.cw - 4;
            fy0 = L.y0 + (row + 0.5) * L.ch - 4;
          }
          let col = a < dur + 0.05 ? ink.crest : a < dur + 0.3 ? ink.hover : OM.c1.typeInk(k.f, ink);
          if (flash >= 0 && flash < 0.5) col = flash < 0.08 ? ink.crest : flash < 0.3 ? ink.hover : col;
          vis.push([fx0 + (k.x - fx0) * e, fy0 + (k.y - fy0) * e, col, e >= 1]);
        }
        const sn = (v) => Math.round(v * dpr) / dpr;
        ctx.fillStyle = ink.bg;
        for (const [x, y, , landed] of vis) if (landed) ctx.fillRect(sn(x - 3), sn(y - 3), 14, 14);
        for (const [x, y, col] of vis) {
          ctx.fillStyle = col;
          ctx.fillRect(sn(x), sn(y), sn(x + 8) - sn(x), sn(y + 8) - sn(y));
        }
      };
      const WM = OM.cells(OM.WORDMARK);

      return {
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          ctx.globalAlpha = 1;
          if (T < Math.min(on[0], start + 0.07)) OM.handoff('word', ctx, T, dpr);
          else if (T >= COLL) OM.finale.core(ctx, T, dpr);
          else if (T >= STOP) {
            vortex(ctx, T, dpr);
            OM.finale.core(ctx, T, dpr, false);
          }
          else home(ctx, T, dpr);
          // Camera: a slow push home with a kick on the key word, then a roll that follows the spin; at rest on both cuts.
          const env = OM.post.envelope(T, start, end, { ramp: 0.4 });
          const kick = T >= on[last] ? 0.025 * Math.exp(-(T - on[last]) / 0.12) : 0;
          const rot = 0.045 * Math.sin(Math.PI * OM.prog(T, STOP, end - 0.07));
          const z = 1 + 0.02 * OM.smooth(OM.prog(T, on[0], STOP)) + kick + 1.25 * rot;
          // The smear rides the spin's speed: building through the drain, peaking on the snares, gone before the cut.
          const amt = OM.smooth(OM.prog(T, STOP + 0.15, 293.1)) * (1 - OM.smooth(OM.prog(T, 293.4, end - 0.07)));
          const w = (spin(Math.min(T + 0.02, COLL)) - spin(T)) / 0.02;
          fx.apply(T, {
            amount: env > 0 ? amt : 0,
            cam: { zoom: 1 + env * (z - 1), rot: env * rot },
            p0: [OM.finale.SPIN * Math.min(0.3, 0.012 * w), 0.25, 0, 0],
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
