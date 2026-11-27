// c2-06 · Wild horses. The field from the cut is the plain at night. For each
// word a small herd of light gallops in along the word's row, hooves on the
// beat, kicking up loose dust; the dust settles behind them into the word,
// starting at its first letter on its onset, every letter laid down in tidy
// horizontal lines. With the line read, the letters' lines drop and pile onto
// one row; on the last downbeat a final herd runs that row end to end and
// leaves it a single crest line, and the plain goes dark behind it.

// Edit camera: the defaults fit. The key word's own punch (177.93) sits 270 ms
// after the cut's beat and 260 ms before the downbeat, so nothing stacks, and at
// the camera's peak (4.7% on the 180.32 kick) the words keep about 110 px off the band.
OM.edit.plan('c2-06', {});
OM.ownWords.add('c2-06');
(() => {
  const W = 800;
  OM.c2.ready('c2-06', W);
  const { sm, decay } = OM.c2;
  const A = [
    '...............##...', '..............####..', '.............######.', '............###..##.',
    '..##########.###....', '.##############.....', '################....', '#.##############....',
    '#..############.....', '...##........##.....', '..##..........##....', '.##............##...',
  ];
  const B = A.slice(0, 9).concat(['....##......##......', '....#.#....#.#......', '...#...#..#...#.....']);
  const HC = 7; // horse cell px: a horse is 140 x 84

  const FX = `vec4 effect(vec2 uv) {
    vec2 p = cam(uv);
    if (uAmount <= 0.0) return src(p);
    // Dust-haze motion blur: the plain and the dust smear with the gallop; the bright letters and the herd stay crisp.
    vec4 c0 = src(p);
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 9; i++) acc += min(src(p - vec2(float(i) * 0.0016 * uAmount, 0.0)).rgb, vec3(0.3)); // bright letters never smear
    acc /= 9.0;
    float keep = smoothstep(0.45, 0.7, dot(c0.rgb, vec3(0.3, 0.59, 0.11)));
    vec3 col = mix(acc, c0.rgb, keep);
    col += vec3(0.404, 0.522, 0.286) * vnoise(vec2(p.x * 4.0 - uTime * 1.2, p.y * 3.0)) * 0.07 * uAmount * smoothstep(0.65, 0.0, p.y);
    return vec4(col, 1.0);
  }`;

  OM.scene({
    id: 'c2-06',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const END = start + duration;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const words = OM.sung('c2-06');
      const on = words.map((w) => w.t0);
      const HM = OM.HOME, cR = OM.cellAt(HM, 960, 540).row, lineY = HM.y0 + cR * HM.ch;
      const CS = 9, V = 4200; // letter cells: 8px on a 9px pitch; V: the herds' gallop, quick enough that each word is laid within a few frames
      const DROP = 180.95, HERD = OM.beatOnset(OM.downbeatsIn(182.3, 182.7)[0] || 182.486), HV = 2900;
      const HERD0 = HERD - 2050 / HV; // the final herd's lead reaches the right edge on the downbeat
      const FRAME = OM.SPB / 4;

      const get = OM.c2.lazy(W, () => {
        const L = OM.c2.layout(words, { weight: W, cap: 150, maxW: 1700, cy: 500, rows: 3, lead: 1.75, minCap: 90 });
        return words.map((wd, k) => {
          const p = L.place[k];
          if (!p) return null;
          const v = k === 0 ? Math.max(V, (p.x + 330) / Math.max(0.05, on[0] - start)) : V;
          const cells = OM.c2.raster(wd.text, p.x, p.base, L.px, W, CS).map((cl) => ({ ...cl, ts: on[k] + (cl.x - p.x) / v, h: OM.hash(cl.i, cl.j, 11) }));
          return { k, p, v, cells, foot: p.base + 40 };
        });
      });

      const horse = (ctx, x, foot, T, ph, a = 1) => {
        const fr = Math.floor((T + ph) / FRAME) % 2 ? B : A;
        ctx.fillStyle = OM.c2.rgba(ink.hover, a);
        const y0 = foot - fr.length * HC;
        fr.forEach((r, j) => {
          for (let i = 0; i < r.length; i++) if (r[i] === '#') ctx.fillRect(x + i * HC, y0 + j * HC, HC, HC);
        });
      };
      /** Wild dust kicked up behind a runner whose nose is at xh(T): puffs emitted every 1/30 s, each drifting and fading. */
      const dust = (ctx, xh, foot, T, seed, n = 10) => {
        const now = Math.floor(T * 30);
        for (let e = 0; e < n; e++) {
          const te = (now - e) / 30, age = T - te, x0 = xh(te) - 40;
          for (let q = 0; q < 3; q++) {
            const h1 = OM.hash(now - e, q, seed), h2 = OM.hash(q, now - e, seed + 1);
            const x = x0 - 90 * h1 * age * 6, y = foot - 4 - (60 + 140 * h2) * age * 4;
            if (age * 3 > 1 - h1 * 0.5) continue;
            ctx.fillStyle = h2 > 0.6 ? ink.lit : ink.mid;
            ctx.fillRect(x, y, 5, 5);
          }
        }
      };

      return {
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.05) return OM.handoff('field', ctx, T, dpr);
          if (T > END - 0.07) return OM.handoff('line', ctx, T, dpr);
          const rows = get();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const gain = OM.lerp(0.8, 0.42, sm(T, start, start + 0.6)) * (1 - sm(T, 181.6, HERD + 0.1));
          if (gain > 0.01) OM.hero(ctx, T, dpr, { inks: ink, L: HM, word: false, gain, bg: false });

          // The words: dust snapping into tidy lines behind each herd, then dropping onto the one row.
          for (const r of rows) {
            if (!r) continue;
            for (const cl of r.cells) {
              const a = T - cl.ts;
              if (a < -0.14) continue;
              let x = cl.x, y = cl.y;
              if (a < 0) {
                const e = OM.ease.outExpo(1 + a / 0.14);
                x += (1 - e) * (-70 - 60 * cl.h);
                y += (1 - e) * (110 * (OM.hash(cl.j, cl.i, 2) - 0.3));
              }
              const tf = DROP + 0.55 * cl.h;
              let land = false;
              if (T > tf) {
                const f = OM.ease.inCubic(OM.prog(T, tf, tf + 0.3));
                y = OM.lerp(cl.y, lineY + 2, f);
                land = f >= 1;
              }
              ctx.fillStyle = a < 0 ? ink.mid : a < 0.1 || land ? ink.crest : r.k === 0 ? ink.crest : ink.hover;
              if (land) {
                const col = Math.floor((cl.x + CS / 2 - HM.x0) / HM.cw);
                OM.cell(ctx, HM, col, cR, dpr);
              } else ctx.fillRect(x, y, CS - 1, CS - 1);
            }
          }

          // The herds for each word, in from the left along its row.
          for (const r of rows) {
            if (!r) continue;
            const xh = (TT) => r.p.x + (TT - on[r.k]) * r.v + 50;
            const lead = xh(T);
            if (lead < -150 || lead > 2200) continue;
            dust(ctx, xh, r.foot, T, 7 + r.k);
            [[0, 0, 0], [-170, -20, 0.07], [-320, 14, 0.03]].forEach(([dx, dy, ph]) => horse(ctx, lead + dx - 140, r.foot + dy, T, ph + r.k * 0.05));
          }
          // On the last downbeat the final herd runs the row and leaves it unbroken.
          const lead = (TT) => (TT - HERD0) * HV - 40;
          if (T > HERD0 - 0.1) {
            const xl = lead(T);
            for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
              const x = HM.x0 + col * HM.cw;
              if (x < xl - 160) { ctx.fillStyle = ink.crest; OM.cell(ctx, HM, col, cR, dpr); }
            }
            if (xl < 2200) {
              dust(ctx, lead, lineY, T, 31, 8);
              [[0, 0, 0], [-155, -18, 0.06], [-290, 12, 0.02], [-430, -8, 0.09], [-560, 10, 0.04]].forEach(([dx, dy, ph]) => horse(ctx, xl + dx - 140, lineY + dy, T, ph));
            }
          }
        },
        render(t, T) {
          this.draw(t, T);
          const ctx = c.ensure();
          if (OM.c2.live(T, start, END)) {
            // Settling puffs (s180.72, measured) and hat glitter: the snare knocks dust up off every word's baseline, and the hats glint single dashes in the letters until they drop.
            {
              const rows6 = get().filter(Boolean);
              const a = T - 180.716;
              if (a >= 0 && a < 0.6)
                for (const r of rows6)
                  for (let n = 0; n < 16; n++) {
                    const x = r.p.x + r.p.w * OM.hash(n, r.k, 101), y = r.foot - 30 - 160 * a * (0.4 + OM.hash(r.k, n, 102)) + 200 * a * a;
                    ctx.fillStyle = OM.c2.rgba(n % 2 ? ink.mid : ink.lit, 1 - a / 0.6);
                    ctx.fillRect(x, y, 5, 5);
                  }
              if (T > 180.5 && T < DROP) {
                const hat = OM.audio(T).bands[13] || 0, slot = Math.floor(T / (OM.SPB / 4));
                for (const r of rows6)
                  for (const cl of r.cells) if (OM.hash(cl.i, cl.j, slot) < 0.03 * hat) { ctx.fillStyle = ink.crest; ctx.fillRect(cl.x, cl.y, CS - 1, CS - 1); }
              }
            }
          // Grass flying up off the hooves of each herd.
          const herds = get().filter(Boolean).map((r) => [r.p.x + (T - on[r.k]) * r.v + 50, r.foot]);
          if (T > HERD0) herds.push([(T - HERD0) * HV - 40, lineY]);
          for (const [xh, foot] of herds) {
            if (xh < -100 || xh > 2400) continue;
            for (let n = 0; n < 14; n++) {
              const slot = Math.floor(T * 20) - (n % 5), a = T - slot / 20, h = OM.hash(slot, n, 61);
              const x = xh - 60 - 300 * h * a * 3 - 40 * n, y = foot - 300 * a * (0.5 + h) + 900 * a * a;
              ctx.fillStyle = OM.c2.rgba(n % 2 ? ink.mid : ink.lit, 1 - a * 3);
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(h * 6);
              ctx.fillRect(-1, -5, 2, 10);
              ctx.restore();
            }
          }
          }
          // Fast lateral tracking alongside the herd, with the gallop's bob, punching in as the key word's herd lands it.
          OM.c2.apply(fx, T, start, END, { amount: 0.85, x: 30 - 60 * OM.prog(T, start, END), y: 3 * Math.abs(Math.sin((Math.PI * T) / (OM.SPB / 2))), punch: 0.05 * OM.c2.punch(T, on[0]) });
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
