// c2-02 · Assembly line. The healed screen from the cut pulls back and lands as
// the first machine on a conveyor, its word lighting on its onset. Down the
// line an overhead gantry lowers one machine per word, each slammed onto the
// belt on its onset with its word powering on in its screen, until the fleet
// spells the line; the key word's machine lands hardest and the entire fleet
// flashes with it. The fleet pulses on the kicks, then the belt runs and
// carries it off; on the downbeat the empty belt flares and settles into the
// single crest line of the next cut.

// Edit camera: the fleet's kick flashes are elements, not camera moves. The key
// word's machine slams down with the scene's own punch (163.757); the camera's
// snare jolt 80 ms later (163.837) would stack a second hit on it while the punch
// is still at half strength, so that beat is skipped.
OM.edit.plan('c2-02', { skip: [163.837] });
OM.ownWords.add('c2-02');
(() => {
  const W = 800;
  OM.c2.ready('c2-02', W);
  const { pool, sm, decay, rgba } = OM.c2;

  const FX = `vec4 effect(vec2 uv) {
    vec2 p = cam(uv);
    if (uAmount <= 0.0) return src(p);
    // Factory haze: drifting smoke, with shafts of light slanting down from high windows.
    vec4 c = src(p);
    float s = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float x = p.x + (1.0 - p.y) * 0.35 - (0.18 + 0.3 * fi) - 0.02 * sin(uTime * 0.5 + fi);
      s += smoothstep(0.045, 0.0, abs(x)) * (0.6 + 0.4 * vnoise(vec2(p.y * 6.0 + fi, uTime * 0.3)));
    }
    float haze = vnoise(p * vec2(6.0, 3.0) + vec2(uTime * 0.08, 0.0));
    c.rgb += (vec3(0.62, 0.81, 0.42) * s * 0.09 * smoothstep(0.15, 1.0, p.y) + vec3(0.14, 0.16, 0.23) * haze * 0.22) * uAmount;
    return c;
  }`;

  OM.scene({
    id: 'c2-02',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const END = start + duration;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const words = OM.sung('c2-02');
      const on = words.map((w) => w.t0);
      const K = words.length - 1;
      const KICKS = [164.392, 164.662, 164.784, 164.834]; // measured kick onsets
      const RUN = 164.98, DB2 = OM.beatOnset(OM.downbeatsIn(165.3, 165.7)[0] || 165.489);
      const HM = OM.HOME, cR = OM.cellAt(HM, 960, 540).row;
      const CS = 9, PADX = 30, PADY = 30, GAP = 36, NECK = 22, MAXW = 1840;
      const rowY = (r) => HM.y0 + r * HM.ch;
      const DROP = 0.26;

      const get = OM.c2.lazy(W, () => {
        const mm = document.createElement('canvas').getContext('2d');
        mm.font = OM.c2.FONT(W, 100);
        const cap100 = mm.measureText('H').actualBoundingBoxAscent || 73;
        const raw = words.map((w) => mm.measureText(w.text || 'MMM').width);
        const n = words.length;
        // Rows of machines (up to three): the biggest type that fits, fewer rows on a tie, then the most even rows.
        const want = (112 / cap100) * 100, floor = (72 / cap100) * 100;
        const splits = [[]];
        for (let i = 1; i < n; i++) splits.push([i]);
        for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) splits.push([i, j]);
        let best = null;
        for (const cuts of splits) {
          const groups = [];
          let a0 = 0;
          for (const b0 of [...cuts, n]) { groups.push([a0, b0]); a0 = b0; }
          const rowW = (px) => Math.max(...groups.map(([a, b]) => { let s = 0; for (let i = a; i < b; i++) s += (raw[i] * px) / 100 + 2 * PADX + (i > a ? GAP : 0); return s; }));
          let px = want;
          while (px > floor && rowW(px) > MAXW) px *= 0.98;
          const score = Math.round(px) * 100 - groups.length * 10 - rowW(px) / 1e3;
          if (!best || score > best.score) best = { score, px, groups };
        }
        const { px, groups } = best;
        const cap = (cap100 * px) / 100, sh = cap + 2 * PADY;
        const pitch = Math.ceil((sh + NECK + 8 + 26) / HM.ch), R = groups.length;
        const low = cR + Math.round(((R - 1) * pitch) / 2 + (sh + NECK) / 2 / HM.ch);
        const belts = groups.map((_, r) => low - (R - 1 - r) * pitch);
        const ms = [];
        groups.forEach(([a, b], r) => {
          let full = 0;
          for (let i = a; i < b; i++) full += (raw[i] * px) / 100 + 2 * PADX + (i > a ? GAP : 0);
          let x = 960 - full / 2;
          const by = rowY(belts[r]);
          for (let i = a; i < b; i++) {
            if (i > a) x += GAP;
            const ww = (raw[i] * px) / 100, sw = ww + 2 * PADX, sy = by - NECK - 8 - sh;
            const base = sy + PADY + cap;
            ms[i] = { r, sx: x, sy, sw, sh, by, cells: OM.c2.raster(words[i].text, x + PADX, base, px, W, CS) };
            x += sw;
          }
        });
        return { ms, belts };
      });

      const machine = (ctx, mc, k, T, dx, dy) => {
        const { sx, sy, sw, sh } = mc;
        const x = sx + dx, y = sy + dy;
        // stand
        ctx.fillStyle = th['surface-2'];
        ctx.fillRect(x + sw / 2 - 9, y + sh, 18, NECK);
        ctx.fillRect(x + sw / 2 - Math.min(80, sw * 0.3), y + sh + NECK, 2 * Math.min(80, sw * 0.3), 8);
        // face and bezel
        ctx.fillStyle = th.bg;
        ctx.fillRect(x, y, sw, sh);
        const age = T - on[k];
        const pw = age >= 0 ? decay(T, on[k], 0.12) : 0;
        ctx.strokeStyle = pw > 0.3 ? ink.crest : ink.mid;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, sw - 2, sh - 2);
        if (age < 0) return;
        pool(ctx, x + sw / 2, y + sh / 2, sw * 0.55, sh * 0.6, ink.lit, 0.1 + 0.25 * pw);
        const kick = KICKS.reduce((a, t0) => Math.max(a, decay(T, t0, 0.08)), 0);
        const big = decay(T, on[K], 0.14);
        ctx.fillStyle = age < 0.1 || big > 0.35 || kick > 0.5 ? ink.crest : k === K ? ink.crest : ink.hover;
        for (const cl of mc.cells) ctx.fillRect(cl.x + dx, cl.y + dy, CS - 1, CS - 1);
      };

      return {
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.05) return OM.handoff('screen', ctx, T, dpr);
          if (T > END - 0.07) return OM.handoff('line', ctx, T, dpr);
          const { ms, belts } = get();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);

          const run = OM.ease.inCubic(OM.prog(T, RUN, DB2)) * 2300; // the belt carries the fleet off
          const settle = OM.ease.outCubic(OM.prog(T, DB2, DB2 + 0.32));
          const flare = T >= DB2;
          const pull = OM.prog(T, start, on[0]); // the screen from the cut pulls back onto the line

          // The gantry rail the machines come down from.
          const rail = sm(T, start, start + 0.3) * (1 - sm(T, RUN, DB2));
          if (rail > 0) {
            ctx.fillStyle = rgba(th['border-strong'], rail);
            ctx.fillRect(0, 70, 1920, 6);
          }

          // The belts: a row of cells each, rollers ticking as the line runs; on the downbeat, one crest line.
          const beltA = sm(T, start, on[0]);
          belts.forEach((r0, bi) => {
            const r = Math.round(OM.lerp(r0, cR, settle));
            if (flare && bi > 0 && r === Math.round(OM.lerp(belts[0], cR, settle)) && settle >= 1) return;
            for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
              if (flare) ctx.fillStyle = ink.crest;
              else {
                const roll = ((col - Math.floor(run / HM.cw)) % 4 + 4) % 4 === 0;
                ctx.fillStyle = roll ? ink.lit : ink.mid;
                if (beltA < 1 && OM.threshold(col, r) > beltA) continue;
              }
              OM.cell(ctx, HM, col, r, dpr);
            }
          });
          if (flare) pool(ctx, 960, 540, 900, 60, ink.lit, 0.25 * decay(T, DB2, 0.12));

          ms.forEach((mc, k) => {
            if (!mc) return;
            if (k === 0 && T < on[0]) {
              // Pulling back: the full-frame screen shrinks onto machine 0's face.
              const e = OM.ease.inOutCubic(pull);
              const x = OM.lerp(320, mc.sx, e), y = OM.lerp(140, mc.sy, e), w = OM.lerp(1280, mc.sw, e), h = OM.lerp(800, mc.sh, e);
              ctx.fillStyle = th.bg;
              ctx.fillRect(x, y, w, h);
              ctx.strokeStyle = ink.mid;
              ctx.lineWidth = 2;
              ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
              return;
            }
            const u = k === 0 ? 1 : OM.prog(T, on[k] - DROP, on[k]);
            if (u <= 0) return;
            const dy = -(mc.sy + mc.sh + 60) * (1 - OM.ease.inCubic(u));
            const dx = run;
            if (mc.sx + dx > 1920) return;
            // The cable and claw, lowering it and then winding back up.
            const lift = k === 0 ? 1 : OM.prog(T, on[k] + 0.04, on[k] + 0.3);
            if (lift < 1 && rail > 0) {
              const cx = mc.sx + mc.sw / 2, top = mc.sy + dy - (mc.sy + dy - 76) * OM.ease.inCubic(lift);
              ctx.fillStyle = th['text-muted'];
              ctx.fillRect(cx - 1, 76, 2, Math.max(0, top - 76));
              ctx.fillRect(cx - 34, top - 8, 68, 8);
              ctx.fillRect(cx - 34, top - 8, 6, 18);
              ctx.fillRect(cx + 28, top - 8, 6, 18);
            }
            machine(ctx, mc, k, T, dx, dy);
            // The slam: sparks off the belt either side of the stand.
            const a = T - on[k];
            if (k > 0 && a >= 0 && a < 0.3) {
              const by = mc.by, n = k === K ? 18 : 8;
              ctx.fillStyle = ink.crest;
              for (let s = 0; s < n; s++) {
                const side = s % 2 ? 1 : -1, sp = 120 + 380 * OM.hash(k, s, 3);
                const x = mc.sx + mc.sw / 2 + dx + side * (40 + sp * a), y = by - 4 - 260 * a * OM.hash(s, k, 5) + 900 * a * a;
                if (OM.hash(s, k, 8) > a / 0.3) ctx.fillRect(x, y, 5, 5);
              }
            }
          });
        },
        render(t, T) {
          this.draw(t, T);
          const ctx = c.ensure();
          if (OM.c2.live(T, start, END)) {
            // Roll call (k164.66, k164.78, k164.83, measured): each machine's status lamp, in its bezel corner clear of the word, lights in turn down the fleet, a third of the fleet per kick, and rides off with it.
            {
              const list = get().ms.filter(Boolean), n = list.length;
              const run = OM.ease.inCubic(OM.prog(T, RUN, DB2)) * 2300;
              list.forEach((mc, i) => {
                const h = KICKS[1 + Math.min(2, Math.floor((i * 3) / n))];
                const a = T - h;
                if (a < 0) return;
                const x = mc.sx + mc.sw - 20 + run, y = mc.sy + mc.sh - 18;
                if (x > 1940) return;
                const fl = decay(T, h, 0.12);
                if (fl > 0.02) {
                  // The machine answers: its face glows and its bezel lights crest.
                  pool(ctx, mc.sx + mc.sw / 2 + run, mc.sy + mc.sh / 2, mc.sw * 0.75, mc.sh * 0.9, ink.lit, 0.4 * fl);
                  ctx.strokeStyle = OM.c2.rgba(ink.crest, fl);
                  ctx.lineWidth = 6;
                  ctx.strokeRect(mc.sx + run - 3, mc.sy - 3, mc.sw + 6, mc.sh + 6);
                }
                pool(ctx, x + 6, y + 6, 60, 60, ink.lit, 0.3 + 0.5 * fl);
                ctx.fillStyle = a < 0.08 ? ink.crest : ink.hover;
                ctx.fillRect(x, y, 12, 12);
              });
            }
          const { ms } = get();
          // High windows along the top, where the shafts come from.
          ctx.fillStyle = OM.c2.rgba(th['surface-2'], 0.9 * OM.post.envelope(T, start, END, { ramp: 0.4 }));
          for (let x = 140; x < 1920; x += 380) ctx.fillRect(x, 16, 120, 40);
          // Welding flashes at each landing.
          ms.forEach((mc, k) => {
            const a = T - on[k];
            if (!mc || k === 0 || a < 0 || a > 0.4) return;
            const fl = (0.5 + 0.5 * OM.hash(Math.floor(T * 40), k, 9)) * (1 - a / 0.4);
            pool(ctx, mc.sx + mc.sw / 2 + OM.ease.inCubic(OM.prog(T, RUN, DB2)) * 2300, mc.by, 120, 50, ink.crest, 0.4 * fl);
          });
          }
          // Steady industrial tracking along the line, a push as the belt runs that lands on the downbeat, and a punch as the key word's machine slams down.
          OM.c2.apply(fx, T, start, END, { amount: 0.9, x: -34 + 68 * OM.prog(T, start, END), zoom: 1 + 0.06 * sm(T, 164.9, DB2), ramp: 0.45, punch: 0.042 * OM.c2.punch(T, on[K]) });
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
