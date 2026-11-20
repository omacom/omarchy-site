// v1-02 · The pretty screen, and its rules. The laptop v1-01 rose into (thin
// silver unibody, black bezel and notch, black keys, wide trackpad; no marks,
// no names) hangs from strings. Its display is the line: each word comes out
// from under the notch on its onset, falls into its place and bounces off a
// gate that slams shut round it, a padlock on its corner. The gates rattle on
// the snares, and on the 44.748 kick they all clamp tighter. After the line
// has read, the camera tilts up the strings (into the 45.836 downbeat) to the
// hand on the control bar that owns them; it yanks every string and hauls
// them up, and what rises on them is v1-03's fare meter (V.rig, the shared cut).

// Edit camera: the section's defaults fit. The scene's own camera only nods a few px as each word
// hits its gate; the gates' rattle on the 44.196 snare and their clamp on the 44.748 kick are props,
// so the camera's jolt and punch on those beats drive them home, and the punch on the 45.806
// downbeat lands the hand's yank.
OM.edit.plan('v1-02', {});

OM.ownWords.add('v1-02');
(() => {
  const V = OM.v1;
  const WEIGHT = 800;
  const PROBE = V.ready('v1-02-type', WEIGHT);
  const GLSL = V.TEXTMASK + `
vec4 effect(vec2 uv) {
  float top = smoothstep(0.55, 1.0, uv.y) * uAmount * offText(uv); // the strings sway most near the top
  vec2 u = cam(uv);
  u.x += (sin(uv.y * 9.0 + uTime * 1.7) * 0.006 + sin(uv.y * 23.0 - uTime * 2.3) * 0.002) * top;
  return src(u);
}`;
  OM.scene({
    id: 'v1-02',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = V.post(el, c, GLSL);
      const END = start + duration, H = V.HOLD, H0 = 0.045; // the first word lands 0.06s in
      const W = OM.theme('white'), WI = OM.fieldInks('white');
      const on = OM.sung('v1-02').map((w) => w.t0);
      const LAP = V.LAP, LID = V.LID, DK = V.DECK, LCY = V.LCY;
      const TILT0 = 45.25, YANK = V.YANK;
      const RATTLE = [42.306, 44.196, 44.748], CLAMP = 44.748; // the measured snares and kick
      const BAR = -720; // the control bar's height in world px
      const FLY = 0.13; // a word's fall from the notch

      const lay = V.lazy(PROBE, () => {
        const L = V.layout('v1-02', { weight: WEIGHT, cap: 80, maxW: 860 });
        const lh = L.cap * 1.95;
        return {
          ...L,
          words: L.words.map((wd) => {
            const base = LCY + 16 + (wd.row - (L.rows - 1) / 2) * lh + L.cap / 2;
            return { ...wd, base, cx: wd.x + wd.w / 2, cy: base - L.cap / 2 };
          }),
        };
      });
      // The camera: holds on the laptop through the line, then the tilt to the hand, then out past it.
      const camY = (T) => 1000 * OM.ease.inOutCubic(OM.prog(T, TILT0, YANK));
      const yank = V.yank; // the jerk starts on the drum hit, ahead of the grid downbeat
      // String pluck: on the 45.494 kick in the pause every string twangs, bowing and settling.
      const PLUCK = 45.494;
      let pluck = 0;
      const string = (ctx, x0, y0, x1, y1) => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo((x0 + x1) / 2 + pluck, (y0 + y1) / 2, x1, y1);
        ctx.stroke();
      };
      const barX = (x) => 960 + (x - 960) * 0.42;
      const SH = ['..###..', '.#...#.', '.#...#.'], BD = ['#######', '###.###', '###.###', '#######'];
      const lock = (ctx, x, y, shut, s) => {
        const lift = shut ? 0 : 2;
        SH.forEach((row, r) => { for (let q = 0; q < 7; q++) if (row[q] === '#') ctx.fillRect(x + (q - 3.5) * s, y + (r - 7 - lift) * s, s, s); });
        BD.forEach((row, r) => { for (let q = 0; q < 7; q++) if (row[q] === '#') ctx.fillRect(x + (q - 3.5) * s, y + (r - 4) * s, s, s); });
      };

      // Camera: a small nod down as each word hits its gate, at 1.03; dust falling through the light.
      const FXP = (ctx, dpr, T) => {
        const e = V.env(T, start, END);
        const L = lay(), cy = camY(T);
        // The sway stays off the laptop (and the words on it): only the strings move.
        const x0 = LID.x - 30, x1 = LID.x + LID.w + 30, y0 = LID.y + cy - 30, y1 = DK.front + cy + 30;
        let nod = 0;
        for (const t0 of on) if (T >= t0) nod += 12 * Math.exp(-(T - t0) / 0.12) * Math.sin(Math.min(Math.PI, ((T - t0) / 0.1) * Math.PI));
        if (e > 0) {
          ctx.fillStyle = WI.dim;
          for (let i = 0; i < 70; i++) {
            const h = OM.hash(i, 1, 21), s = 2 + 2 * OM.hash(i, 2, 21);
            const y = ((OM.hash(i, 3, 21) * 1080 + T * (30 + 50 * h)) % 1100) - 10, x = OM.hash(i, 4, 21) * 1920 + 14 * Math.sin(T * 0.8 + i);
            ctx.globalAlpha = 0.7 * e;
            ctx.fillRect(x, y, s, s);
          }
          ctx.globalAlpha = 1;
        }
        return { amount: e, cam: { zoom: 1 + 0.03 * e, y: nod * e }, p1: V.rect(x0, y0, x1, y1) };
      };
      return {
        render(t, T) {
          this.draw(t, T);
          fx.apply(T, FXP(c.ensure(), c.dpr, T));
        },
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + H0) return V.laptopFrame(ctx);
          if (T >= V.RIG0) return V.rig(ctx, T); // the hand hauls the meter up: the cut frame v1-03 opens on
          pluck = T >= PLUCK ? 26 * Math.exp(-(T - PLUCK) / 0.18) * Math.sin((T - PLUCK) * 38) : 0;
          const L = lay();
          const cy = camY(T), yk = yank(T), dy = cy - yk;
          ctx.fillStyle = W.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          // The strings: from the lid's top corners and the deck's front corners up to the bar.
          ctx.strokeStyle = WI.mid;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = OM.prog(T, start + H0, start + 0.3);
          const by = BAR + cy - yk;
          for (const [x, y] of [[LID.x + 40, LID.y], [LID.x + LID.w - 40, LID.y], [960 - DK.half1, DK.front], [960 + DK.half1, DK.front]])
            string(ctx, x, y + dy, barX(x), by);
          ctx.globalAlpha = 1;
          if (dy < 1080) {
            V.laptop(ctx, dy);
            V.desk(ctx, dy);
            // The display: each word out from under the notch, into its gate.
            ctx.save();
            ctx.beginPath();
            ctx.rect(LAP.x, LAP.y + dy, LAP.w, LAP.h);
            ctx.clip();
            ctx.translate(0, dy);
            ctx.font = L.font;
            ctx.textBaseline = 'alphabetic';
            const clamp = T >= CLAMP ? Math.exp(-(T - CLAMP) / 0.12) : 0;
            const rattle = OM.pulse(RATTLE, T, 0.05);
            for (const wd of L.words) {
              const t0 = on[wd.k], a = T - t0;
              if (a < -FLY) continue;
              // The word: falls from the notch, lands on its onset, bounces off the gate's floor.
              let x = wd.cx, y = wd.cy, k = 1, sy = 1;
              if (a < 0) {
                const f = OM.ease.inCubic(1 + a / FLY);
                x = OM.lerp(960, wd.cx, f);
                y = OM.lerp(LAP.y + 10, wd.cy, f);
                k = OM.lerp(0.15, 1, f);
              } else {
                y -= 26 * Math.exp(-a / 0.1) * Math.abs(Math.sin(a * 26));
                sy = 1 - 0.16 * Math.exp(-a / 0.05);
              }
              // The gate: slams shut round the word as it lands, squeezes on the kick.
              if (a >= 0) {
                const g = (1 + 0.3 * Math.exp(-a / 0.05)) * (1 - 0.04 * clamp);
                const gw = (wd.w + 30) * g, gh = (L.cap + 40) * g;
                ctx.strokeStyle = a < 0.08 || rattle > 0.5 ? W.text : WI.lit;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.roundRect(wd.cx - gw / 2, wd.cy - gh / 2, gw, gh, 16);
                ctx.stroke();
                ctx.fillStyle = W.text;
                lock(ctx, wd.cx + gw / 2 - 14, wd.cy - gh / 2 + 10 - 9 * rattle, a > 0.05, 4);
              }
              ctx.save();
              ctx.translate(x, y + (L.cap / 2) * k);
              ctx.scale(k, k * sy);
              ctx.fillStyle = W['border-subtle'];
              ctx.fillText(wd.text, -wd.w / 2 + 4, 6);
              ctx.fillStyle = W.text;
              ctx.fillText(wd.text, -wd.w / 2, 0);
              ctx.restore();
            }
            ctx.restore();
            V.notch(ctx, dy);
          }
          // The control bar and the hand that holds it.
          if (by > -400) V.hand(ctx, by, V.barTip(T));
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
