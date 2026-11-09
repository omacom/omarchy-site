// v1-08 · Ownership (keep): enrolling a fingerprint, the way Omarchy sets one
// up with fprintd. The lamp ring v1-07 left squares up into the
// square-spiral mark at the print's core. The last word lands with a pressure
// burst: the print is sucked in, then blown out through its ridges. Every sung word is
// one more press: the print's contact sweeps a step further down each time,
// fresh ridges crest then cool, and the ridge the press reaches carries the
// word, written along it in place of the ridge: the first half of the line
// over the top of the whorl, the second under it, like the lettering on a
// coin, so the print reads top to bottom. On the 71.634 downbeat enrollment
// completes: a crest wave runs out along the ridges and the pad lights. Then
// the print lies down into a pool of light on the floor under a spotlight:
// the stage pre-chorus 1 opens on.

// Edit camera: the outer two words ride the print's outermost ring, 479 px from its centre, and the
// scene's own push into the core brings them to the edge of the frame's 40 px band by its peak, so from 68.906 on
// every camera beat is skipped: any extra zoom or jolt there would push them into it. That includes the
// last word's pressure burst on the 71.054 snare, the scene's own big hit (its camera is sucked in, then
// blown out), which nothing should stack on. The camera keeps the cut beat and the first two beats,
// while the push is still small, and the 72.662 punch once the print has lain down.
OM.edit.plan('v1-08', { skip: [68.906, 69.453, 69.98, 70.516, 71.052, 71.59, 72.124] });

OM.ownWords.add('v1-08');
(() => {
  const V = OM.v1;
  const WEIGHT = 800;
  const PROBE = V.ready('v1-08-type', WEIGHT);
  const GLSL = V.TEXTMASK + `
float lum(vec2 uv) { return dot(src(cam(uv)).rgb, vec3(0.333)); }
vec4 effect(vec2 uv) {
  vec4 c = src(cam(uv));
  if (uAmount <= 0.0) return c;
  vec2 px = 1.4 / vec2(1920.0, 1080.0);
  float tl = lum(uv + px * vec2(-1, 1)), t = lum(uv + px * vec2(0, 1)), tr = lum(uv + px * vec2(1, 1));
  float l = lum(uv + px * vec2(-1, 0)), r = lum(uv + px * vec2(1, 0));
  float bl = lum(uv + px * vec2(-1, -1)), b = lum(uv + px * vec2(0, -1)), br = lum(uv + px * vec2(1, -1));
  float gx = tr + 2.0 * r + br - tl - 2.0 * l - bl, gy = tl + 2.0 * t + tr - bl - 2.0 * b - br;
  float edge = clamp(length(vec2(gx, gy)), 0.0, 1.0); // Sobel outline light along the ridges
  return vec4(c.rgb + vec3(0.73, 0.87, 0.59) * edge * (0.35 + 0.5 * uP0.x) * uAmount, 1.0);
}`;
  OM.scene({
    id: 'v1-08',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = V.post(el, c, GLSL);
      const END = start + duration, H = V.HOLD;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const sung = OM.sung('v1-08');
      const on = sung.map((w) => w.t0);
      const N = on.length;
      const HM = OM.HOME, hc = OM.cellAt(HM, 960, 540);
      const PX = HM.x0 + (hc.col + 0.5) * HM.cw, PY = HM.y0 + (hc.row + 0.5) * HM.ch; // the spark's centre
      const S = 8, Gp = { x0: PX - S / 2, y0: PY - S / 2, cw: S, ch: S }; // print cell (0,0) sits on the spark
      const DONE = OM.beatOnset(71.634), SNARES = [68.104, 68.774, 69.442, 70.25, 71.054, 71.458, 71.96]; // pad blink on the measured snares, through the gap and the pause too
      const LIE0 = 72.2, LIE1 = END - H - 0.01, PRESS = 0.22, CAPMAX = 62;
      const TOPS = Math.ceil(N / 2), RINGS = Math.max(TOPS, N - TOPS);
      // Top words run outer to inner, bottom words inner to outer, so the stack reads in order.
      const ring = (k) => (k < TOPS ? TOPS - 1 - k : k - TOPS);
      const ringR = (k) => 172 + ring(k) * Math.min(92, 276 / Math.max(1, RINGS - 1));
      const RMAX = 172 + (RINGS - 1) * Math.min(92, 276 / Math.max(1, RINGS - 1)) + CAPMAX / 2 + 24;
      // Pressure burst on the last word (onset on the 71.053 snare): for 60 ms the print is sucked in to its
      // core, then it snaps back and a round pressure front runs out through the ridges, tearing ridge cells off.
      const BURST = on[N - 1], VAC = 0.06;
      const burstR = (rr, T) => {
        const a = T - BURST;
        if (a < 0 || a > 0.7) return rr;
        if (a < VAC) return rr * (1 - 0.14 * Math.sin((a / VAC) * Math.PI / 2));
        const b = a - VAC, F = 4200 * b, q = (rr - F) / 46;
        return rr * (1 - 0.14 * Math.exp(-b / 0.03)) + 30 * Math.exp(-q * q) * Math.exp(-b / 0.3);
      };
      const atFront = (rr, T) => {
        const b = T - BURST - VAC;
        return b >= 0 && b < 0.25 && Math.abs(rr - 4200 * b) < 22;
      };

      const get = V.lazy(PROBE, () => {
        const mt = V.metrics(WEIGHT);
        // Each word on its ring: top arcs for even words, bottom arcs for odd.
        const rings = sung.map((w, k) => {
          const s = w.text.toUpperCase(), R = ringR(k), n = Math.max(1, s.length);
          const size = Math.min(CAPMAX / mt.cap, (0.8 * Math.PI * R) / (n * mt.adv));
          const A = mt.adv * size, cap = mt.cap * size, span = (n * A) / R;
          return { s, R, size, A, cap, span, top: k < TOPS, font: V.font(WEIGHT, size) };
        });
        // The contact's front (y below the centre) after press k: just past word k's ridge.
        const reach = (k) => (k < 0 ? -RMAX - 1 : k >= N - 1 ? RMAX + 1 : rings[k].top ? -rings[k].R + CAPMAX / 2 + 14 : rings[k].R + CAPMAX / 2 + 14);
        const cells = [];
        const lim = Math.ceil(RMAX / S);
        for (let r = -lim; r <= lim; r++)
          for (let q = -lim; q <= lim; q++) {
            const x = q * S, y = r * S, rr = Math.hypot(x, y);
            if (rr > RMAX) continue;
            const lc = q + 7, lr = r + 7;
            if (lc >= 0 && lc < 15 && lr >= 0 && lr < 15) {
              if (OM.LOGO.rows[lr][lc] === '1') cells.push({ q, r, y, rr, e: rr / RMAX, logo: true });
              continue;
            }
            if (rr < 96) continue;
            const ang = Math.atan2(y, x);
            const ph = rr + 6 * Math.sin(ang * 3 + rr * 0.02) + 4 * Math.sin(ang * 5 - rr * 0.013);
            if (((ph % 22) + 22) % 22 > 9) continue;
            // The words' channels: no ridge where a word is written.
            let cut = false;
            for (const g of rings) {
              if (Math.abs(rr - g.R) > g.cap / 2 + 9) continue;
              const mid = g.top ? -Math.PI / 2 : Math.PI / 2;
              let d = ang - mid;
              d = Math.atan2(Math.sin(d), Math.cos(d));
              if (Math.abs(d) < g.span / 2 + 0.06) { cut = true; break; }
            }
            if (!cut) cells.push({ q, r, y, rr, e: rr / RMAX, logo: false });
          }
        for (const cl of cells) {
          let k = 0;
          while (k < N && cl.y > reach(k)) k++;
          cl.at = (cl.logo ? on[0] - 0.1 : on[Math.min(k, N - 1)]) + PRESS * 0.4;
        }
        return { rings, cells, reach };
      });
      const contact = (P, T) => {
        const k = OM.hitCount(on, T);
        if (k === 0) return P.reach(-1);
        return OM.lerp(P.reach(k - 2), P.reach(k - 1), OM.ease.outExpo(OM.clamp((T - on[k - 1]) / PRESS)));
      };
      const pool = (ctx, x, y, rx, ry, hex, a) => {
        if (a <= 0.002) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, ry / rx);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        g.addColorStop(0, V.rgba(hex, a));
        g.addColorStop(1, V.rgba(hex, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx);
        ctx.restore();
      };
      const spot = (ctx, a) => {
        const g = ctx.createLinearGradient(0, 0, 0, 880);
        g.addColorStop(0, V.rgba(ink.lit, 0.1 * a));
        g.addColorStop(1, V.rgba(ink.lit, 0.03 * a));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(900, 0);
        ctx.lineTo(1020, 0);
        ctx.lineTo(1400, 880);
        ctx.lineTo(520, 880);
        ctx.closePath();
        ctx.fill();
        pool(ctx, 960, 880, 440, 110, ink.lit, 0.42 * a);
      };

      // Camera: a slow push into the core with the scanner's micro-rotation, back to rest for the spot. The push
      // and the rotation run on the beat clock, so they surge through each beat. The outermost words' glyphs
      // reach RMAX - 24 from the print's centre, so the push goes only as deep as keeps them clear of the
      // frame's 40 px border band (EDGE: the furthest a glyph may sit from the frame's centre line, 3 px short of
      // the band; PUSH comes to about 3.7%). Verification particles ride the completion wave.
      const EDGE = 497, PUSH = (EDGE - Math.abs(PY - 540)) / (RMAX - 24) - 1;
      const beat = OM.edit.scene(start, END);
      const camAt = (T) => {
        const e = V.env(T, start, END, 0.5);
        const C = beat.clock(T);
        const push = OM.smooth(OM.prog(C, start, DONE)) * (1 - OM.smooth(OM.prog(T, LIE0 - 0.3, LIE1)));
        const ba = T - BURST;
        const vac = ba >= 0 && ba < VAC ? Math.sin((ba / VAC) * Math.PI / 2) : 0, blast = ba >= VAC ? Math.exp(-(ba - VAC) / 0.12) : 0;
        return { e, zoom: 1 + (PUSH * push - 0.025 * vac + 0.045 * blast) * e, rot: 0.0035 * Math.sin(C * 9) * push * e };
      };
      const FXP = (ctx, dpr, T) => {
        const { e, zoom, rot } = camAt(T);
        const wv = T >= DONE ? OM.prog(T, DONE, DONE + 0.6) : -1;
        if (wv >= 0 && wv < 1) {
          const rr = OM.ease.outCubic(wv) * 1.15 * RMAX;
          ctx.fillStyle = ink.crest;
          for (let i = 0; i < 64; i++) {
            const a = (i / 64) * Math.PI * 2 + OM.hash(i, 1, 81) * 0.1, j = rr + (OM.hash(i, 2, 81) - 0.5) * 30;
            ctx.globalAlpha = (1 - wv) * e;
            ctx.fillRect(PX + Math.cos(a) * j - 3, PY + Math.sin(a) * j - 3, 6, 6);
          }
          ctx.globalAlpha = 1;
        }
        const ba = T - BURST;
        const glow = Math.max(T >= DONE ? Math.exp(-(T - DONE) / 0.5) : 0, ba >= VAC ? Math.exp(-(ba - VAC) / 0.15) : 0);
        return { amount: e * (1 - OM.prog(T, LIE0, LIE1)), cam: { zoom, rot }, p0: [glow, 0, 0, 0] };
      };
      return {
        render(t, T) {
          this.draw(t, T);
          fx.apply(T, FXP(c.ensure(), c.dpr, T));
        },
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + H) {
            ctx.fillStyle = ink.bg;
            ctx.fillRect(0, 0, 1920, 1080);
            return V.lampRing(ctx, T, T >= 66.9 ? 0.3 * Math.exp(-(T - 66.9) / 0.12) : 0);
          }
          if (T >= END - H) return OM.handoff('spot', ctx, T, dpr);
          const P = get();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const lie = OM.smooth(OM.prog(T, LIE0, LIE1));
          if (lie > 0) spot(ctx, lie);
          const wake = OM.smooth(OM.prog(T, start + H, on[0] + 0.1));
          if (T < V.SQ1 + 0.05) V.lampRing(ctx, T, T >= 66.9 ? 0.3 * Math.exp(-(T - 66.9) / 0.12) : 0); // the copier's lamp, squaring up into the mark
          const mark = OM.prog(T, V.SQ1 - 0.06, V.SQ1 + 0.05);
          ctx.save();
          ctx.globalAlpha = 1 - lie;
          ctx.translate(960, OM.lerp(PY, 880, lie));
          ctx.scale(OM.lerp(1, 440 / RMAX, lie), OM.lerp(1, 110 / RMAX, lie));
          ctx.translate(-PX, -PY);
          // The reader pad's corner brackets, lit when enrollment completes, blinking on the snares.
          const done = T >= DONE;
          const B0 = (RMAX + 26) * Math.SQRT2, B = burstR(B0, T) / Math.SQRT2, arm = 120;
          ctx.globalAlpha = (1 - lie) * OM.smooth(wake);
          ctx.fillStyle = done || OM.pulse(SNARES, T, 0.06) > 0.5 ? ink.crest : ink.mid;
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            ctx.fillRect(PX + sx * B - (sx > 0 ? 8 : 0), PY + sy * B - (sy > 0 ? 8 : 0), -sx * arm, 8);
            ctx.fillRect(PX + sx * B - (sx > 0 ? 8 : 0), PY + sy * B - (sy > 0 ? 8 : 0), 8, -sy * arm);
          }
          ctx.globalAlpha = 1 - lie;
          // The print.
          const front = contact(P, T);
          const wave = done ? OM.ease.outCubic(OM.prog(T, DONE, DONE + 0.6)) * 1.15 : -1;
          for (const k of P.cells) {
            const th2 = OM.threshold(k.q + 64, k.r + 64);
            if (k.logo) {
              if (th2 > mark) continue; // the mark fills in where the lamp's square landed
            } else if (k.y > front || OM.clamp((k.y - front + 40) / 40) > th2) continue; // dithered front
            const age = T - k.at;
            let fill = k.logo ? (done ? ink.crest : ink.lit) : k.e < 0.4 ? ink.lit : ink.mid;
            if (age < 0.5) fill = th2 > age / 0.5 ? ink.crest : age < 0.25 ? ink.hover : fill;
            if (wave >= 0 && Math.abs(k.e - wave) < 0.05) fill = ink.crest;
            // Inward echo: on the 71.96 snare a ring runs back from the rim to the core along the ridges.
            if (T >= 71.96 && T < 72.26 && Math.abs(k.e - (1 - (T - 71.96) / 0.3)) < 0.03) fill = ink.hover;
            if (atFront(k.rr, T)) fill = ink.crest; // the pressure front bunching the ridges as it passes
            const f = k.rr > 0 ? burstR(k.rr, T) / k.rr : 1;
            ctx.fillStyle = fill;
            ctx.fillRect(PX + k.q * S * f - S / 2, PY + k.r * S * f - S / 2, S, S);
          }
          // The words, written along their rings, pressed in on their onsets. A press, the pressure front or the
          // cameras (this scene's and the edit camera) never carry a word into the frame's 40 px border band: its
          // radius is held where its outer edge would cross EDGE on screen (rTop, rBot: the furthest an outer glyph
          // edge may sit from the print's centre, through the lie and both cameras).
          const ed = OM.edit.off ? null : OM.edit.apply(null, OM.edit.stageAt(T));
          const reach = (EDGE - (ed ? Math.abs(ed.y) : 0)) / (camAt(T).zoom * (ed ? ed.zoom : 1));
          const Ly = OM.lerp(PY, 880, lie), sy = OM.lerp(1, 110 / RMAX, lie);
          const rTop = (Ly - 540 + reach) / sy, rBot = (540 + reach - Ly) / sy;
          ctx.textBaseline = 'alphabetic';
          P.rings.forEach((g, k) => {
            const age = T - on[k];
            if (age < 0) return;
            const kick = 1 + 0.08 * Math.exp(-age / 0.06);
            const hit = wave >= 0 && Math.abs(g.R / RMAX - wave) < 0.08;
            ctx.fillStyle = age < 0.3 || hit ? ink.crest : ink.hover;
            ctx.font = g.font;
            const n = g.s.length;
            for (let i = 0; i < n; i++) {
              const off = ((i + 0.5 - n / 2) * g.A) / g.R;
              const ang = g.top ? -Math.PI / 2 + off : Math.PI / 2 - off;
              const rb = Math.min(burstR((g.top ? g.R - g.cap / 2 : g.R + g.cap / 2) * kick, T), g.top ? rTop - g.cap : rBot);
              ctx.save();
              ctx.translate(PX + Math.cos(ang) * rb, PY + Math.sin(ang) * rb);
              ctx.rotate(g.top ? ang + Math.PI / 2 : ang - Math.PI / 2);
              ctx.fillText(g.s[i], -g.A / 2, 0);
              ctx.restore();
            }
          });
          // Ridge cells torn off the print's rim by the blast, flung out and dragged to a stop.
          const bb = T - BURST - VAC;
          if (bb >= 0 && bb < 0.9) {
            for (let i = 0; i < 140; i++) {
              const h1 = OM.hash(i, 1, 88), h2 = OM.hash(i, 2, 88), h3 = OM.hash(i, 3, 88), life = 0.45 + 0.45 * h3;
              if (bb > life || 4200 * bb < RMAX * (0.55 + 0.45 * h2)) continue; // leaves its ridge as the front reaches it
              const ang = h1 * Math.PI * 2, r0 = RMAX * (0.55 + 0.45 * h2), b2 = bb - r0 / 4200;
              const r = r0 + (500 + 900 * h3) * 0.25 * (1 - Math.exp(-b2 / 0.25));
              const fz = b2 / life;
              ctx.fillStyle = fz < 0.2 ? ink.crest : fz < 0.5 ? ink.hover : fz < 0.8 ? ink.lit : ink.mid;
              ctx.fillRect(PX + Math.cos(ang) * r - S / 2, PY + Math.sin(ang) * r - S / 2, S, S);
            }
          }
          ctx.restore();
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
