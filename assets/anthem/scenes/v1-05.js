// v1-05 · Rain on the window. Late, black glass: rain streaks down it, the
// city is soft bokeh behind, code from the screen is faintly reflected in it,
// and the one glow [line] is the monitor below. The words are
// condensation: on each onset a drop runs down every letter of the word at
// once, tracing it in beads on the glass, and the written words slowly weep
// trails. The downbeat on the key word makes the glow breathe and the beads
// catch it. Then the words run off the glass and the monitor's glow rises to
// fill the frame: the glow the forge in v1-06 opens on.

// Edit camera: nothing of the scene's own camera moves on the drums (a slow drift), so the camera
// carries the beat. The key word lands just after the 56.502 downbeat (its onset 56.594), where the glow
// breathes and the beads catch it: that downbeat punches harder (down 2, about 2.4%), and the cut beat (54.402) keeps its
// strength (cut 1 with the higher down), so the two are level and nothing tops the key word's hit.
OM.edit.plan('v1-05', { down: 2, cut: 1 });

OM.ownWords.add('v1-05');
(() => {
  const V = OM.v1;
  const WEIGHT = 800;
  const PROBE = V.ready('v1-05-type', WEIGHT);
  const GLSL = V.TEXTMASK + `
vec4 effect(vec2 uv) {
  vec2 u = cam(uv);
  if (uAmount <= 0.0) return src(u);
  float k = uAmount * offText(uv);
  vec2 P = uv * vec2(1920.0, 1080.0);
  vec2 g = floor(P / 46.0), f = P / 46.0 - g;
  float h = hash(g);
  vec2 d = f - vec2(0.25 + 0.5 * hash(g + 3.1), 0.25 + 0.5 * hash(g + 7.7));
  float r = 0.1 + 0.2 * h;
  float m = step(length(d), r) * step(0.5, h) * k; // a droplet lens: the world flipped inside it
  vec2 off = -d * 46.0 * 0.9 / vec2(1920.0, 1080.0) * m;
  float sv = hash(vec2(floor(P.x / 5.0), 9.0));
  float sy = fract(uv.y * 0.7 + uTime * (0.25 + sv) + sv * 7.0);
  float streak = step(0.94, sv) * smoothstep(0.0, 0.12, sy) * (1.0 - smoothstep(0.12, 0.45, sy)) * k; // a running streak
  off.x += streak * 0.0025;
  vec4 s = src(u + off);
  s.rgb += vec3(0.75, 0.79, 0.96) * (m * 0.1 * smoothstep(r * 0.4, r, length(d)) + streak * 0.06);
  return s;
}`;
  OM.scene({
    id: 'v1-05',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = V.post(el, c, GLSL);
      const END = start + duration, H = V.HOLD;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const on = OM.sung('v1-05').map((w) => w.t0);
      const HM = OM.HOME, G = { x0: HM.x0, y0: HM.y0, cw: HM.cw / 2, ch: HM.ch / 2 };
      // The downbeat's and the kick's drum hits; each word's trace is quick enough to read on its onset.
      const BEAT = OM.beatOnset(56.564), KICK = 55.736, TRACE = 0.14;
      const RUN0 = 58.3, RUN1 = 58.56, RISE0 = 58.26, RISE1 = END - H - 0.01;

      const get = V.lazy(PROBE, () => {
        const L = V.layout('v1-05', { weight: 800, cap: 116, maxW: 1740 });
        const lh = L.cap * 1.6;
        return L.words.map((wd) => {
          const base = 520 + (wd.row - (L.rows - 1) / 2) * lh + L.cap / 2;
          const cells = V.raster(wd.text, L.font, L.size, wd.x, base, G, L.A);
          // Each letter traced by its own drop, top to bottom.
          const letters = [];
          for (const cl of cells) (letters[cl[2]] = letters[cl[2]] || []).push(cl);
          for (const l of letters) if (l) l.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
          return { ...wd, base, letters: letters.filter(Boolean), cap: L.cap };
        });
      });
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
      const BOKEH = Array.from({ length: 18 }, (_, i) => ({
        x: OM.hash(i, 1, 51) * 1920, y: 120 + OM.hash(i, 2, 51) * 640, r: 50 + OM.hash(i, 3, 51) * 140,
        hex: [th['border-strong'], th['text-muted'], th.brand, th['text-secondary']][Math.floor(OM.hash(i, 4, 51) * 4)], a: 0.07 + 0.12 * OM.hash(i, 5, 51),
      }));
      const RAIN = Array.from({ length: 150 }, (_, i) => ({
        x: OM.hash(i, 1, 52) * 1920, v: 900 + 700 * OM.hash(i, 2, 52), len: 40 + 90 * OM.hash(i, 3, 52), ph: OM.hash(i, 4, 52) * 1400, a: 0.08 + 0.2 * OM.hash(i, 5, 52),
      }));

      // Camera: a slow diagonal drift with the focus breathing, both on the beat clock so they surge through
      // each beat. Condensation on the glass fades as the night goes on.
      const beat = OM.edit.scene(start, END);
      const FXP = (ctx, dpr, T) => {
        const e = V.env(T, start, END);
        const C = beat.clock(T);
        const p = OM.smooth(OM.prog(C, start, END));
        const words = get();
        let x0 = 1920, x1 = 0, y0 = 1080, y1 = 0;
        for (const wd of words) { x0 = Math.min(x0, wd.x); x1 = Math.max(x1, wd.x + wd.w); y0 = Math.min(y0, wd.base - wd.cap); y1 = Math.max(y1, wd.base); }
        if (e > 0) {
          ctx.fillStyle = th['text-muted'];
          const fog = 0.16 * (1 - OM.prog(T, start, END - 0.4)) * e;
          for (let i = 0; i < 420; i++) {
            ctx.globalAlpha = fog * (0.4 + 0.6 * OM.hash(i, 2, 57));
            ctx.fillRect(OM.hash(i, 1, 57) * 1920, OM.hash(i, 3, 57) * 1080, 3, 3);
          }
          ctx.globalAlpha = 1;
        }
        return {
          amount: e,
          cam: { zoom: 1 + (0.045 + 0.012 * Math.sin(C * 1.6)) * e, x: OM.lerp(-26, 26, p) * e, y: OM.lerp(16, -16, p) * e },
          p1: V.rect(x0 - 30, y0 - 30, x1 + 30, y1 + 40),
        };
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
            return V.letterRain(ctx, T, dpr); // v1-04's letters, falling as rain
          }
          if (T >= END - H) return OM.handoff('glow', ctx, T, dpr);
          const words = get();
          const rise = OM.smooth(OM.prog(T, RISE0, RISE1));
          const scene = OM.prog(T, start + H, start + 0.3) * (1 - rise); // everything but the glow
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          // The city behind the glass.
          for (const b of BOKEH) pool(ctx, b.x + Math.sin(T * 0.3 + b.r) * 20, b.y, b.r, b.r, b.hex, b.a * scene);
          // The one glow: the monitor below, breathing on the kick and the downbeat, rising to the handoff at the end.
          const breath = 0.12 * OM.pulse([KICK], T, 0.25) + 0.22 * OM.pulse([BEAT], T, 0.35);
          pool(ctx, 960, OM.lerp(1010, 540, rise), OM.lerp(760, 620, rise), OM.lerp(240, 620, rise), ink.lit,
            OM.lerp(0.2 + breath, 0.5, rise) * OM.prog(T, start + H, start + 0.35));
          // The screen's code, reflected faintly in the glass.
          ctx.fillStyle = V.rgba(th['text-muted'], 0.07 * scene);
          for (let i = 0; i < 26; i++) {
            const y = 150 + ((i * 34 - T * 18) % 884 + 884) % 884;
            const ind = Math.floor(OM.hash(i, 7, 53) * 4) * 36, len = 120 + OM.hash(i, 8, 53) * 380;
            ctx.fillRect(1260 + ind, y, len, 10);
          }
          // The rain.
          ctx.lineWidth = 1.5;
          for (const r of RAIN) {
            const y = ((T * r.v + r.ph) % 1400) - 200;
            ctx.strokeStyle = V.rgba(th.text, r.a * scene);
            ctx.beginPath();
            ctx.moveTo(r.x, y);
            ctx.lineTo(r.x - r.len * 0.06, y + r.len);
            ctx.stroke();
          }
          if (T < 55.5) V.letterRain(ctx, T, dpr);
          // The words, traced in beads on the glass.
          const flash = OM.pulse([BEAT], T, 0.12);
          const run = OM.prog(T, RUN0, RUN1);
          for (const wd of words) {
            const t0 = on[wd.k];
            if (T < t0) continue;
            const u = OM.ease.outCubic(OM.prog(T, t0, t0 + TRACE));
            for (let j = 0; j < wd.letters.length; j++) {
              const l = wd.letters[j];
              const n = Math.ceil(u * l.length);
              // The weep: a thin trail running down from the letter's foot.
              const foot = l[l.length - 1];
              const weep = OM.prog(T, t0 + 0.3 + OM.hash(j, wd.k, 54) * 0.6, t0 + 2.2);
              if (weep > 0 && OM.hash(j, wd.k, 55) < 0.6) {
                const x = G.x0 + (foot[0] + 0.5) * G.cw, y = G.y0 + (foot[1] + 1) * G.ch;
                ctx.fillStyle = V.rgba(th.text, 0.35 * scene);
                ctx.fillRect(x - 1, y, 2, 260 * weep);
                ctx.fillRect(x - 3, y + 260 * weep - 4, 6, 6);
              }
              for (let i = 0; i < n; i++) {
                const [q, r] = l[i];
                const fall = run > 0 ? 900 * Math.pow(OM.clamp(run * 1.4 - OM.hash(q, 3, 56) * 0.4), 2) : 0;
                const a = 1 - OM.clamp(fall / 500);
                if (a <= 0) continue;
                const x = G.x0 + q * G.cw, y = G.y0 + r * G.ch + fall;
                const hot = flash > 0.2 && OM.threshold(q, r) < flash;
                ctx.globalAlpha = a;
                ctx.fillStyle = hot ? ink.crest : th.text;
                ctx.fillRect(x + 0.6, y + 0.6, G.cw - 1.2, G.ch - 1.2);
                ctx.fillStyle = ink.crest;
                if (OM.threshold(q, r) > 0.7) ctx.fillRect(x + 1, y + 1, 2, 2);
              }
              // The drop at the head of the trace.
              if (u < 1 && n > 0) {
                const [q, r] = l[n - 1];
                ctx.globalAlpha = 1;
                ctx.fillStyle = ink.crest;
                ctx.beginPath();
                ctx.roundRect(G.x0 + (q + 0.5) * G.cw - 8, G.y0 + (r + 0.5) * G.ch - 8, 16, 18, 8);
                ctx.fill();
              }
            }
            ctx.globalAlpha = 1;
          }
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
