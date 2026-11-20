// v2-07 · Stop chasing. The crest line from v2-06 is a treadmill: a lattice
// runner rises out of it sprinting left after a glossy, rounded, foreign logo
// that keeps receding. On the first word the runner plants, the logo is gone,
// the old track crumbles and they turn round; the path ahead builds itself out
// of the words, each word slamming up out of the dark on its onset as a slab of
// lit letters under their feet, and the runner walks it. The long key word takes
// the downbeat as a surge of light along the path. Then path and runner fold
// down into the crest row, the line handoff into v2-08.

// Edit camera: the key word's downbeat (142.046, the surge of light along the path) punches hardest:
// down 2.3 takes it to 3%; the cap keeps the bar's other downbeat (144.176, a stronger kick) level
// with it rather than above, and the last word clear of the right-hand border band.
OM.edit.plan('v2-07', { down: 2.3, max: 0.03 });

OM.ownWords.add('v2-07');
OM.scene({
  id: 'v2-07',
  build(el, { start, duration }) {
    const V = OM.v2;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    // Motion blur around the runner while they run (uP0.xy their position, uP0.z the pace); crisp when still.
    const FX = `vec4 effect(vec2 uv) {
      vec2 q = cam(uv);
      vec4 base = src(q);
      vec2 d = (q - uP0.xy) * vec2(uRes.x / uRes.y, 1.0);
      float w = uP0.z * uAmount * exp(-dot(d, d) * 30.0);
      if (w < 0.01) return base;
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 9; i++) acc += src(q + vec2((float(i) - 4.0) * 0.0028 * w, 0.0)).rgb;
      return vec4(mix(base.rgb, acc / 9.0, clamp(w * 1.4, 0.0, 1.0)), 1.0);
    }`;
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: FX });
    const ink = V.ink(), th = V.th();
    const sung = OM.sung('v2-07');
    const N = sung.length;
    const on = sung.map((w) => w.t0);
    const END = start + duration;
    const H0 = OM.cellAt(OM.HOME, 960, 540);
    const TOP = OM.HOME.y0 + H0.row * OM.HOME.ch; // the line's top edge: the ground
    const STOP = on[0];
    const SURGE = OM.beatOnset(V.hitsIn(OM.T && OM.T.downbeats, on[Math.min(3, N - 1)], END, [142.083])[0]);
    const FOLD0 = END - 0.42, FOLD1 = END - 0.12;
    const RX0 = 330; // where the runner plants
    // Beats elapsed at T, on the measured drum onsets (OM.T.beatsOn): the gait's clock.
    const BO = ((OM.T && OM.T.beatsOn) || []).filter((b) => b > start - 2 && b < END + 2);
    const strides = (T) => {
      let i = 0;
      while (i + 2 < BO.length && BO[i + 1] <= T) i++;
      return BO.length > 1 ? i + (T - BO[i]) / (BO[i + 1] - BO[i]) : (T - start) * 3;
    };

    // The runner, 9 x 11 cells facing right: two strides and a stand.
    const SPR = {
      run1: ['.....##..', '.....##..', '.........', '....####.', '...#.##.#', '..#..##..', '.....##..', '....#..#.', '...#....#', '..#......', '.##......'],
      run2: ['.....##..', '.....##..', '.........', '....###..', '....###..', '...#.##..', '.....##..', '.....##..', '....#.#..', '....#..#.', '...##..#.'],
      stand: ['....##...', '....##...', '.........', '...####..', '..#.##.#.', '..#.##.#.', '....##...', '....##...', '...#..#..', '...#..#..', '..##..##.'],
    };
    const PX = 16;
    const sprite = (ctx, rows, x, feet, face, color, cut = 0) => {
      ctx.fillStyle = color;
      const h = rows.length;
      rows.forEach((row, r) => {
        if (r < cut) return;
        for (let i = 0; i < row.length; i++) {
          if (row[i] !== '#') continue;
          const ci = face > 0 ? i : row.length - 1 - i;
          ctx.fillRect(Math.round(x + (ci - row.length / 2) * PX), Math.round(feet - (h - r) * PX), PX, PX);
        }
      });
    };

    let F = null;
    const plan = () => {
      // The path: the words as a stair of rows, each row's letter tops a tread, descending to the right.
      const M = V.met();
      const longest = Math.max(1, ...sung.map((w) => w.text.length));
      let sz = Math.min(112 / M.cap, 1500 / (longest * M.adv)), at, r, A, capPx;
      // Two treads at most, the lower one a runner's height down so the runner never stands in the type.
      for (let tries = 0; tries < 40; tries++, sz *= 0.96) {
        A = M.adv * sz; capPx = M.cap * sz;
        const STEP = capPx + 11 * PX + 40;
        r = 0;
        let x = RX0 - 40;
        at = sung.map((w, k) => {
          const gap = k && w.space !== false ? A : 0;
          const wW = w.text.length * A;
          if (k && x + gap + wW > 1860) { r++; x = RX0 - 40 + r * 90; } else x += gap;
          const o = { x, w: wW, top: TOP + r * STEP, row: r };
          x += wW;
          return o;
        });
        if (r <= 1 || capPx <= 64) break;
      }
      F = { A, capPx, font: V.fontOf(sz), at, end: Math.max(...at.map((o) => o.x + o.w)), rows: r + 1 };
    };
    /** Where the runner stands: walking along the path, hopping down a tread, never past the last landed word. */
    const walk = (T) => {
      let x = RX0, y = TOP;
      for (let k = 0; k < N; k++) {
        if (T < on[k]) break;
        const a = F.at[k];
        const tx = a.x + Math.min(a.w * 0.5, 60 + a.w * 0.2);
        const dur = Math.max(0.3, Math.abs(tx - x) / 700);
        const e = OM.ease.inOutSine(OM.prog(T, on[k] + 0.05, on[k] + 0.05 + dur));
        const hop = k && a.top !== F.at[k - 1].top ? -70 * Math.sin(Math.PI * e) : 0;
        x = OM.lerp(x, tx, e);
        y = OM.lerp(y, a.top, OM.ease.inCubic(e)) + hop;
        if (e >= 1) y = a.top;
      }
      return { x, y };
    };

    const glossy = (ctx, x, y, s, a) => {
      if (s <= 0.01 || a <= 0) return;
      const r = 70 * s;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 30 * s;
      ctx.shadowOffsetY = 14 * s;
      const g = ctx.createLinearGradient(x, y - r, x, y + r);
      g.addColorStop(0, th.text);
      g.addColorStop(1, th['border-strong']);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x - r, y - r, 2 * r, 2 * r, r * 0.45);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      const hl = ctx.createLinearGradient(x, y - r, x, y);
      hl.addColorStop(0, 'rgba(255,255,255,0.85)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl;
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.45, r * 0.75, r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = th['text-secondary'];
      ctx.beginPath();
      ctx.arc(x, y + r * 0.1, r * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    return {
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T < start + V.HOLD_IN || T >= END - V.HOLD_OUT) return fx.apply(T), OM.handoff('line', ctx, T, dpr);
        if (!F || !V.met().ok) plan();
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        const fold = OM.ease.inOutCubic(OM.prog(T, FOLD0, FOLD1));
        const surge = T >= SURGE ? Math.exp(-(T - SURGE) / 0.35) : 0;

        // The old track: the full crest row, scrolling under the chase, crumbling from the stop.
        const crumble = OM.prog(T, STOP, STOP + 0.5);
        for (let col = OM.HOME.cMin; col < OM.HOME.cMin + OM.HOME.cols; col++) {
          const x = OM.HOME.x0 + col * OM.HOME.cw;
          const th0 = OM.threshold(col, H0.row);
          const drop = OM.clamp((crumble - th0 * 0.6) / 0.4);
          const tick = T < STOP && (col + Math.floor((T - start) * 40)) % 6 === 0;
          ctx.globalAlpha = 1 - drop;
          ctx.fillStyle = tick ? ink.lit : ink.crest;
          const y = OM.HOME.y0 + H0.row * OM.HOME.ch + 300 * drop * drop;
          ctx.fillRect(Math.round(x * dpr) / dpr, y, OM.HOME.cw + 0.5, OM.HOME.ch);
        }
        ctx.globalAlpha = 1;
        if (T >= FOLD0) {
          ctx.fillStyle = ink.crest;
          const reach = 1400 * fold;
          for (let col = OM.HOME.cMin; col < OM.HOME.cMin + OM.HOME.cols; col++) {
            const x = OM.HOME.x0 + (col + 0.5) * OM.HOME.cw;
            if (Math.abs(x - (RX0 + F.end) / 2) <= reach) OM.cell(ctx, OM.HOME, col, H0.row, dpr);
          }
        }

        // The glossy logo, always receding ahead of the chase; gone on the stop.
        const chase = OM.prog(T, start, STOP);
        const gone = OM.ease.inCubic(OM.prog(T, STOP, STOP + 0.22));
        glossy(ctx, OM.lerp(160, 100, chase) - 120 * gone, TOP - 170 + 30 * chase, OM.lerp(0.8, 0.4, chase) * (1 - gone), OM.clamp((T - start - V.HOLD_IN) / 0.08) * (1 - gone));

        // The path: each word slams up out of the dark into the ground on its onset. The rise (outBack
        // 2.2 over 0.12 s) first reaches the ground 1/3.2 of the way in, so it starts that much (37.5 ms)
        // early: the impact, and the word whole at full height, land on the onset frame, not two frames after.
        const SLAM = 0.12 / (2.2 + 1);
        ctx.font = F.font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        sung.forEach((w, k) => {
          if (T < w.t0 - SLAM) return;
          const a = F.at[k], age = T - w.t0, u = age + SLAM;
          const rise = OM.ease.outBack(OM.clamp(u / 0.12), 2.2);
          const y = OM.lerp(a.top, TOP, fold) + 150 * (1 - rise);
          const sy = 1 - fold; // folding flat into the row
          const col = OM.mix(OM.mix(ink.crest, ink.hover, OM.clamp(age / 0.4)), ink.crest, surge);
          ctx.save();
          ctx.globalAlpha = OM.clamp(u / 0.04);
          ctx.translate(0, y);
          ctx.scale(1, Math.max(0.02, sy));
          // The capPx glyph box sits with its top on the ground line.
          ctx.fillStyle = col;
          ctx.fillText(w.text, a.x, F.capPx);
          ctx.restore();
          if (age >= 0 && age < 0.25) {
            const g = 1 - age / 0.25;
            V.pool(ctx, a.x + a.w / 2, a.top, a.w * 0.7, 50, ink.lit, 0.6 * g);
          }
        });
        // The surge: a bar of light running the length of the path on the downbeat, as far as the last word landed.
        if (surge > 0.02) {
          const p = OM.ease.outCubic(OM.prog(T, SURGE, SURGE + 0.5));
          const last = Math.max(0, OM.hitCount(on, SURGE) - 1), f = p * last, i0 = Math.floor(f), i1 = Math.min(last, i0 + 1), m = f - i0;
          const A0 = F.at[i0], A1 = F.at[i1];
          V.pool(ctx, OM.lerp(A0.x + A0.w / 2, A1.x + A1.w / 2, m), OM.lerp(A0.top, A1.top, m) + F.capPx / 2, 320, 120, ink.crest, 0.55 * surge);
        }

        // The runner: sprinting left on the treadmill, planting on the stop, turning, then walking the words.
        const rise = OM.ease.outCubic(OM.prog(T, start + V.HOLD_IN, start + 0.14));
        const W = T >= STOP ? walk(T) : { x: RX0, y: TOP };
        const ground = OM.lerp(W.y, TOP, fold);
        const feet = ground + (1 - rise) * 150 + fold * 150; // out of the line, and back down into it
        const runner = OM.mix(ink.hover, ink.crest, fold);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 1920, ground);
        ctx.clip();
        if (T < STOP) {
          sprite(ctx, Math.floor((T - start) * 12) % 2 ? SPR.run1 : SPR.run2, RX0, feet, -1, runner);
        } else {
          const x = W.x;
          const moving = Math.abs(walk(T + 0.03).x - x) > 0.5;
          const rows = moving ? (Math.floor(x / 26) % 2 ? SPR.run1 : SPR.run2) : SPR.stand;
          sprite(ctx, rows, x, feet, T >= STOP + 0.12 ? 1 : -1, runner);
        }
        ctx.restore();
        // Kicked-up dust behind the feet while moving, and sparks off each word as it builds.
        const pace = (T2) => (T2 < STOP ? 1 : OM.clamp((Math.abs(walk(T2 + 0.02).x - walk(T2).x) / 0.02) / 500));
        for (let j = 0; j < 9; j++) {
          const ts = (Math.floor(T / 0.05) - j) * 0.05;
          if (ts < start + V.HOLD_IN || pace(ts) < 0.2) continue;
          const age = T - ts, P = ts >= STOP ? walk(ts) : { x: RX0, y: TOP };
          const hx = OM.hash(j, Math.floor(ts * 20), 91);
          ctx.fillStyle = V.rgba(ink.mid, 0.7 * (1 - age / 0.45) * (1 - fold));
          const dir = ts < STOP ? 1 : -1;
          ctx.fillRect(P.x + dir * (20 + 160 * age * (0.6 + hx)), P.y - 6 - 90 * age + 200 * age * age, 6, 6);
        }
        sung.forEach((w, k) => {
          const age = T - w.t0, a = F.at[k];
          if (age < 0 || age > 0.45) return;
          for (let i = 0; i < 4; i++) V.burst(ctx, a.x + (a.w * (i + 0.5)) / 4, a.top, age, 2707 + k * 9 + i, { n: 6, sp: 320, life: 0.42, up: 260 });
        });
        const ce = V.camEnv(T, start, END), run = pace(T) * (1 - fold);
        // The gait: a footfall on every 8th of the measured beat, the sway changing sides with each.
        const step = 2 * Math.PI * strides(T), gait = Math.abs(Math.sin(step));
        const RW = T >= STOP ? walk(T) : { x: RX0, y: TOP };
        fx.apply(T, {
          amount: V.env(T, start, END),
          cam: { zoom: 1 + ce * 0.03, y: ce * run * 9 * gait, rot: ce * run * 0.006 * Math.sin(step) },
          p0: [RW.x / 1920, 1 - (RW.y - 80) / 1080, run, 0],
        });
      },
      release: () => { fx.release(); c.release(); },
    };
  },
});
