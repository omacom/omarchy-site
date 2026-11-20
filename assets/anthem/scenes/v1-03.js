// v1-03 · The meter is running. A fare meter and its receipt printer on the
// white page, hauled up into frame on v1-02's strings (V.rig), which let go
// on the 46.620 snare. Every word costs a coin: the coin drops into the slot on the
// word's onset, the meter's dot-matrix display rolls the word in, the fare
// rolls [line] printer feeds out a fare line with the word and its price.
// The key word lands on the 47.996 downbeat: the display flashes inverted and
// the fare jumps. Then you stop paying (the accel roll from 48.785): the
// display goes dark, the fare lines grey out from the bottom [line] whole
// machine fades back into the white page v1-04 tears.

// Edit camera: the scene's own camera already punches in on every coin (each word's onset), so the
// camera beats that land on a word (46.822, 47.424) are skipped rather than stacked. The one kept is
// the 47.958 downbeat under the key word: with the coin's own punch it is the scene's biggest hit.
OM.edit.plan('v1-03', { skip: [46.822, 47.424] });

OM.ownWords.add('v1-03');
(() => {
  const V = OM.v1;
  const WEIGHT = 800, RW = 700;
  const PROBE = V.ready('v1-03-type', WEIGHT);
  V.ready('v1-03-receipt', RW);
  const GLSL = V.TEXTMASK + `
vec4 effect(vec2 uv) {
  vec4 c = src(cam(uv));
  float f = uAmount * (0.06 * step(0.85, hash(vec2(floor(uTime * 30.0), 3.0))) + 0.012 * sin(uTime * 377.0));
  float band = uAmount * 0.025 * smoothstep(0.3, 1.0, sin(uv.y * 3.0 - uTime * 1.3)); // the tube's slow roll
  return vec4(c.rgb * (1.0 - f - band), 1.0);
}`;
  OM.scene({
    id: 'v1-03',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = V.post(el, c, GLSL);
      const END = start + duration, H = V.HOLD, H0 = 0.012; // the first coin lands 14ms in
      const W = OM.theme('white'), WI = OM.fieldInks('white');
      const sung = OM.sung('v1-03');
      const on = sung.map((w) => w.t0);
      const N = on.length;
      const KEY = on.findIndex((t0, k) => t0 <= 47.996 && (k === N - 1 || on[k + 1] > 47.996));
      const SN = [49.304, 49.704, 49.842, 50.178, 50.378]; // the measured snares of the pause
      const STOP = 49.72, DARK = 49.95, FADE0 = 50.2, FADE1 = END - H - 0.02;
      // The meter, its display window and the receipt printer.
      const { D, SLOT, HEAD } = V.MT, LH = 112;
      const G = { x0: D.x, y0: D.y, cw: 7, ch: 7 };

      const prices = sung.map((w, k) => 0.49 + 0.25 * ((w.text.length * 7 + k * 3) % 9) + (k === KEY ? 4 : 0));
      const totals = prices.map((_, k) => prices.slice(0, k + 1).reduce((a, b) => a + b, 0));
      const get = V.lazy(PROBE, () => {
        const mt = V.metrics(WEIGHT), mr = V.metrics(RW);
        const words = sung.map((w) => w.text.toUpperCase());
        // Display: each word as lit dots, as big as fits (cap 76 at most).
        const dots = words.map((s) => {
          const size = Math.min(76 / mt.cap, (D.w - 50) / (Math.max(1, s.length) * mt.adv));
          const A = mt.adv * size, x = D.x + (D.w - s.length * A) / 2, base = D.y + D.h / 2 + (mt.cap * size) / 2;
          return V.raster(s, V.font(WEIGHT, size), size, x, base, G, A, 0.4);
        });
        const rs = Math.min(62 / mr.cap, 560 / (Math.max(1, ...words.map((s) => s.length)) * mr.adv));
        return { dots, words, rfont: V.font(RW, rs), rA: mr.adv * rs, rcap: mr.cap * rs };
      });

      const roll = (T, t0, d = 0.16) => OM.ease.outExpo(OM.prog(T, t0, t0 + d));
      // Camera: a slow truck along the counter, punching in on each coin. The tubes flicker on at the cut.
      const FXP = (ctx, dpr, T) => {
        const e = V.env(T, start, END);
        const on1 = OM.lerp(40, -40, OM.smooth(OM.prog(T, start, END)));
        let punch = 0;
        for (const t0 of on) if (T >= t0) punch += 0.03 * Math.exp(-(T - t0) / 0.09);
        return { amount: e, cam: { zoom: 1 + (0.045 + punch) * e, x: on1 * e } };
      };
      return {
        render(t, T) {
          this.draw(t, T);
          fx.apply(T, FXP(c.ensure(), c.dpr, T));
        },
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + H0) return V.rig(ctx, T); // v1-02's hand hauling the meter up
          if (T >= END - H) return OM.handoff('white', ctx, T, dpr);
          const S = get();
          ctx.fillStyle = W.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          ctx.save();
          ctx.translate(0, V.meterY(T)); // still swinging on the strings
          const k = OM.hitCount(on, T) - 1; // the word being paid for
          const fade = 1 - OM.smooth(OM.prog(T, FADE0, FADE1));
          ctx.globalAlpha = fade;
          const keyHit = KEY >= 0 && T >= on[KEY] ? Math.exp(-(T - on[KEY]) / 0.1) : 0;
          // Meter creep: after the last fare the meter keeps ticking a cent on every snare of the pause.
          const creep = OM.hitCount(SN, T);
          const bump = 4 * OM.pulse(SN, T, 0.04) + 5 * OM.pulse(on, T, 0.05) + 14 * keyHit * Math.sin((T - on[KEY]) * 70);
          // The meter body, slot, display, label and printer head.
          const inv = keyHit > 0.3;
          V.meterShell(ctx, 0, bump, inv, false);
          ctx.save();
          ctx.translate(0, bump);
          // The display: words roll in from below, the old one rolls up and out.
          ctx.beginPath();
          ctx.roundRect(D.x, D.y, D.w, D.h, 12);
          ctx.save();
          ctx.clip();
          const dark = OM.prog(T, STOP, DARK);
          for (const j of [k - 1, k]) {
            if (j < 0) continue;
            const r = roll(T, on[k]);
            const off = j === k ? (1 - r) * D.h : -r * D.h;
            if (j === k - 1 && r >= 1) continue;
            const fresh = j === k && T - on[k] < 0.12;
            for (const [q, row] of S.dots[j]) {
              if (OM.threshold(q, row) < dark) continue;
              ctx.fillStyle = inv ? W.text : fresh ? W.bg : W['border-subtle'];
              ctx.fillRect(G.x0 + q * G.cw + 0.5, G.y0 + row * G.ch + 0.5 + off, G.cw - 1, G.ch - 1);
            }
          }
          ctx.restore();
          // The fare, rolling up with every coin.
          ctx.save();
          ctx.beginPath();
          ctx.rect(D.x, 610, D.w, 150);
          ctx.clip();
          ctx.font = "800 120px 'JetBrains Mono'";
          ctx.textAlign = 'right';
          ctx.fillStyle = dark >= 1 ? W['border-strong'] : W.text;
          for (const j of [k - 1, k]) {
            const r = k >= 0 ? roll(T, on[k], 0.2) : 1;
            const off = j === k ? (1 - r) * 140 : -r * 140;
            if (j === k - 1 && r >= 1) continue;
            ctx.fillText(j < 0 ? '0.00' : (totals[j] + (j === k ? 0.01 * creep : 0)).toFixed(2), D.x + D.w, 735 + off);
          }
          ctx.restore();
          ctx.restore();
          // The coins: each falls into the slot to land on its word, turning edge-on as it goes in.
          for (let j = 0; j < N; j++) {
            if (on[j] - 0.3 < start + 0.05) continue; // the first word is paid by the meter's arrival
            const a = OM.prog(T, on[j] - 0.3, on[j]);
            if (a <= 0 || a >= 1) continue;
            const y = OM.lerp(-90, SLOT.y + 8, OM.ease.inCubic(a));
            const sx = OM.lerp(1, 0.22, OM.smooth(OM.prog(a, 0.75, 1)));
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, 1920, SLOT.y + 8 + bump);
            ctx.clip();
            ctx.translate(SLOT.x, y);
            ctx.scale(sx, 1);
            ctx.fillStyle = W['border-strong'];
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = WI.mid;
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          // The receipt: a fare line printed per word, the paper feeding up out of the head.
          let feed = 0;
          for (const t0 of on) feed += OM.ease.outExpo(OM.prog(T, t0, t0 + 0.12));
          const base = (j) => HEAD.y - 44 - (feed - 1 - j) * LH;
          if (feed > 0) {
            const top = base(0) - LH + 10;
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, 1920, HEAD.y);
            ctx.clip();
            ctx.fillStyle = W.surface;
            ctx.strokeStyle = W['border-strong'];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(HEAD.x + 40, HEAD.y);
            for (let x = HEAD.x + 40, i = 0; x <= HEAD.x + HEAD.w - 40; x += 24, i++) ctx.lineTo(x, top + (i % 2 ? 0 : 12));
            ctx.lineTo(HEAD.x + HEAD.w - 40, HEAD.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.font = S.rfont;
            for (let j = 0; j <= k; j++) {
              const y = base(j);
              const grey = OM.prog(T, DARK + (N - 1 - j) * 0.045, DARK + (N - 1 - j) * 0.045 + 0.12);
              if (T - on[j] < 0.25) {
                ctx.fillStyle = W['border-subtle'];
                ctx.globalAlpha = fade * (1 - (T - on[j]) / 0.25);
                ctx.fillRect(HEAD.x + 44, y - S.rcap - 22, HEAD.w - 88, S.rcap + 44);
                ctx.globalAlpha = fade;
              }
              ctx.fillStyle = OM.mix(W.text, W['border-subtle'], grey);
              ctx.textAlign = 'left';
              ctx.fillText(S.words[j], HEAD.x + 80, y);
              ctx.textAlign = 'right';
              ctx.fillText(prices[j].toFixed(2), HEAD.x + HEAD.w - 80, y);
              const lead0 = HEAD.x + 80 + S.words[j].length * S.rA + 24, lead1 = HEAD.x + HEAD.w - 80 - 4 * S.rA - 24;
              ctx.fillStyle = OM.mix(WI.dim, W['border-subtle'], grey);
              for (let x = lead0; x < lead1; x += 22) ctx.fillRect(x, y - 8, 8, 8);
              if (grey >= 1) { ctx.fillStyle = W['border-strong']; ctx.fillRect(HEAD.x + 70, y - S.rcap / 2 - 3, HEAD.w - 140, 6); }
            }
            ctx.restore();
          }
          ctx.globalAlpha = 1;
          ctx.restore();
          V.rigTop(ctx, T); // the strings, until they let go
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
