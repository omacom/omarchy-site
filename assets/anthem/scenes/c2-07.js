// c2-07 · The bridge. The crest line from the cut is a bridge deck; its middle
// breaks away and tumbles into a canyon that opens beneath it. The words are
// the new span: letter by letter they fly up out of the canyon and slam into
// the gap on each word's onset, each word's deck section locking under it.
// The key word closes the span, and a train of light runs the deck end to end
// across it, lighting every letter as it passes. Then the canyon and the words
// go dark and the entire deck draws in to one cell at the centre on the
// downbeat: the spark of the next cut.

// Edit camera: the downbeat at 184.56 (hats only) lands 153 ms before the key
// word closes the span with the scene's own punch, its biggest hit, so that
// beat is skipped rather than flamming into it.
OM.edit.plan('c2-07', { skip: [184.564] });
OM.ownWords.add('c2-07');
(() => {
  const W = 800;
  OM.c2.ready('c2-07', W);
  const { pool, sm, decay } = OM.c2;

  const FX = `vec4 effect(vec2 uv) {
    vec2 p = cam(uv);
    if (uAmount <= 0.0) return src(p);
    // Canyon depth haze below the deck, and the train's headlight flare.
    vec4 c = src(p);
    float deep = smoothstep(0.5, 0.0, p.y);
    c.rgb = mix(c.rgb, vec3(0.141, 0.157, 0.231), deep * 0.35 * uAmount * (1.0 - smoothstep(0.3, 0.9, c.g)));
    vec2 d = (p - uP0.xy) * vec2(uRes.x / uRes.y, 1.0);
    float fl = uP0.z * (exp(-abs(d.y) * 90.0) * exp(-abs(d.x) * 2.5) + 0.5 * exp(-length(d) * 14.0));
    c.rgb += vec3(0.855, 0.925, 0.776) * fl * uAmount * 0.6;
    return c;
  }`;

  OM.scene({
    id: 'c2-07',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const END = start + duration;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const words = OM.sung('c2-07');
      const on = words.map((w) => w.t0);
      const K = words.length - 1;
      const HM = OM.HOME, sp = OM.cellAt(HM, 960, 540), cR = sp.row, lineY = HM.y0 + cR * HM.ch;
      const CS = 9, FLY = 0.3; // letter cells: 8px on a 9px pitch
      const TR0 = on[K] + 0.02, TR1 = Math.max(words[K].t1, on[K] + 0.8); // the train crosses the key word's hold
      const DIM = 185.9, DB2 = OM.beatOnset(OM.downbeatsIn(186.6, 186.9)[0] || 186.735), PULL = DB2 - 0.42;

      const get = OM.c2.lazy(W, () => {
        const L = OM.c2.layout(words, { weight: W, cap: 92, maxW: 1480, cy: 400, rows: 2, lead: 1.3, minCap: 72 });
        let bottom = -Infinity;
        for (const k in L.place) bottom = Math.max(bottom, L.place[k].base);
        const shift = lineY - 6 - bottom; // the lowest row stands on the deck
        let gx0 = Infinity, gx1 = -Infinity;
        const spans = [];
        const letters = [];
        words.forEach((wd, k) => {
          const p = L.place[k];
          if (!p) return;
          const base = p.base + shift;
          if (p.base === bottom) { gx0 = Math.min(gx0, p.x - 24); gx1 = Math.max(gx1, p.x + p.w + 24); }
          spans.push({ k, x0: p.x - 12, x1: p.x + p.w + 12 });
          const cells = OM.c2.raster(wd.text, p.x, base, L.px, W, CS);
          const n = Math.max(1, wd.text.length);
          for (let l = 0; l < n; l++) {
            const mine = cells.filter((cl) => cl.l === l);
            if (!mine.length) continue;
            const cx = mine.reduce((s, cl) => s + cl.x, 0) / mine.length, cy = mine.reduce((s, cl) => s + cl.y, 0) / mine.length;
            letters.push({ k, cells: mine, cx, cy, ta: on[k] + l * Math.min(0.016, 0.08 / n), dx: (OM.hash(k, l, 1) - 0.5) * 300, dy: 640 + 360 * OM.hash(k, l, 2), rot: (OM.hash(k, l, 3) - 0.5) * 5 });
          }
        });
        gx0 = OM.clamp(gx0, 160, 900);
        gx1 = OM.clamp(gx1, 1020, 1760);
        // Each word's deck section: from the gap's edge or the last word to its own end.
        spans.sort((a, b) => a.x0 - b.x0);
        return { letters, spans, gx0, gx1 };
      });

      return {
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.05) return OM.handoff('line', ctx, T, dpr);
          if (T > END - 0.07) return OM.c2.chip(ctx, 1);
          // Deck to circuit: once the deck has drawn into the centre on the downbeat, its light runs on out of that cell as the traces of a chip, the board c2-08 opens on.
          if (T >= DB2) return OM.c2.chip(ctx, OM.smooth(OM.prog(T, DB2 - 0.15, 187.15)));
          const { letters, spans, gx0, gx1 } = get();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const dim = OM.prog(T, DIM, PULL); // words and canyon go dark in dither order
          const pull = OM.ease.inExpo(OM.prog(T, PULL, DB2)); // the deck draws in to the centre cell
          const R = 1100 * (1 - pull);

          // The canyon walls, opening under the deck as the middle falls.
          const open = OM.prog(T, start + 0.04, start + 0.35);
          for (let row = cR + 1; row < HM.rMin + HM.rows; row++) {
            const d = (row - cR) * HM.ch;
            const jag = 26 * (OM.heroNoise(row / 3, 5) - 0.5);
            const xl = gx0 + 0.32 * d + jag, xr = gx1 - 0.32 * d - jag;
            for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
              const x = HM.x0 + (col + 0.5) * HM.cw;
              if (x > xl && x < xr) continue;
              const tq = OM.threshold(col, row);
              if (tq > open || tq < dim) continue;
              const edge = Math.min(Math.abs(x - xl), Math.abs(x - xr)) < HM.cw * 1.5;
              ctx.fillStyle = edge ? th['border-strong'] : tq < 0.3 + 0.4 * (d / 540) ? th['bg-deep'] : th.surface;
              OM.cell(ctx, HM, col, row, dpr);
            }
          }

          // The deck: the abutments, the broken middle tumbling away, each word's section locking in.
          const lit = (x) => {
            if (x < gx0 || x > gx1) return true;
            for (const s of spans) if (x >= s.x0 - 30 && x <= s.x1 + 30 && T >= on[s.k]) return true;
            return T >= on[K];
          };
          const lock = spans.reduce((a, s) => Math.max(a, decay(T, on[s.k], 0.1)), 0);
          for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
            const x = HM.x0 + (col + 0.5) * HM.cw;
            if (Math.abs(x - 960) > R) continue;
            if (lit(x)) {
              const cool = OM.prog(T, start, start + 0.35);
              const train = T >= TR0 && T < TR1 + 0.3 && Math.abs(x - (OM.lerp(-200, 2120, OM.prog(T, TR0, TR1)) - 130)) < 150;
              ctx.fillStyle = pull > 0 || train || OM.threshold(col, cR) > cool ? ink.crest : x >= gx0 && x <= gx1 && lock > 0.4 ? ink.crest : ink.lit;
              OM.cell(ctx, HM, col, cR, dpr);
            } else {
              // falling away
              const tb = start + 0.04 + 0.12 * OM.hash(col, 1, 2);
              const a = T - tb;
              if (a < 0) { ctx.fillStyle = ink.crest; OM.cell(ctx, HM, col, cR, dpr); continue; }
              const y = lineY + 1600 * a * a, xo = (x - 960) * 0.3 * a;
              if (y > 1100) continue;
              ctx.fillStyle = a < 0.15 ? ink.hover : ink.mid;
              ctx.fillRect(HM.x0 + col * HM.cw + xo, y, HM.cw, HM.ch);
            }
          }

          // The train of light under the deck, crossing the span on the key word.
          const xh = OM.lerp(-200, 2120, OM.prog(T, TR0, TR1));
          if (T >= TR0 && xh < 2120 && dim < 1) {
            pool(ctx, xh + 60, lineY + HM.ch * 2, 260, 70, ink.lit, 0.35);
            for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
              const x = HM.x0 + (col + 0.5) * HM.cw;
              if (x > xh || x < xh - 300) continue;
              for (const r of [cR + 1, cR + 2]) {
                ctx.fillStyle = x > xh - 30 ? ink.crest : (col + r) % 3 ? ink.hover : ink.lit;
                OM.cell(ctx, HM, col, r, dpr);
              }
            }
          }

          // The letters: flying up out of the canyon into the span, slamming home.
          for (const lt of letters) {
            const u = OM.prog(T, lt.ta - FLY, lt.ta);
            if (u <= 0) continue;
            const e = 1 - OM.ease.inCubic(u);
            ctx.save();
            ctx.translate(lt.cx + lt.dx * e, lt.cy + lt.dy * e);
            ctx.rotate(lt.rot * e);
            ctx.translate(-lt.cx, -lt.cy);
            const a = T - lt.ta;
            const near = T >= TR0 && Math.abs(lt.cx - xh) < 160;
            for (const cl of lt.cells) {
              if (OM.hash(cl.i, cl.j, 5) < dim) continue;
              ctx.fillStyle = u < 1 ? ink.mid : a < 0.1 || near ? ink.crest : lt.k === K ? ink.crest : ink.hover;
              ctx.fillRect(cl.x, cl.y, CS - 1, CS - 1);
            }
            ctx.restore();
          }

          // The traces start running out of the centre as the deck's last length draws in.
          if (T > DB2 - 0.15) OM.c2.chip(ctx, OM.smooth(OM.prog(T, DB2 - 0.15, 187.15)), { bg: false, core: false });
          // The spark the deck draws into.
          const halo = sm(T, PULL + 0.2, DB2 + 0.1);
          if (halo > 0) {
            pool(ctx, HM.x0 + (sp.col + 0.5) * HM.cw, HM.y0 + (sp.row + 0.5) * HM.ch, 72, 72, ink.lit, 0.4 * halo + 0.3 * decay(T, DB2, 0.1));
            ctx.fillStyle = ink.crest;
            OM.cell(ctx, HM, sp.col, sp.row, dpr);
          }
        },
        render(t, T) {
          this.draw(t, T);
          const ctx = c.ensure();
          if (OM.c2.live(T, start, END)) {
            // Rail-end sparks (s186.42, k186.56) and last plank (s186.81), all measured: the drawing-in deck ends throw sparks on the hits, and on the final snare the spark briefly reaches one plank either side before settling.
            {
              const R2 = 1100 * (1 - OM.ease.inExpo(OM.prog(T, PULL, DB2)));
              for (const [h, hi] of [[186.424, 0], [186.556, 1]]) {
                const a = T - h;
                if (a < 0 || a > 0.3) continue;
                ctx.fillStyle = ink.crest;
                for (let n = 0; n < 12; n++) {
                  const side = n % 2 ? 1 : -1, v = 200 + 400 * OM.hash(n, hi, 111);
                  const x = 960 + side * (R2 + 10 + v * a * 0.4), y = lineY - 200 * a * OM.hash(hi, n, 112) + 900 * a * a;
                  if (OM.hash(n, hi, 113) > a / 0.3) ctx.fillRect(x, y, 4, 4);
                }
              }
              // Deck beat: on s186.42 and k186.56 the drawing-in deck swells to three rows of light across its whole span.
              for (const h of [186.424, 186.556]) {
                const a = T - h;
                if (a < 0 || a > 0.22) continue;
                const f = 1 - a / 0.22;
                ctx.fillStyle = OM.c2.rgba(ink.crest, f);
                for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
                  const x = HM.x0 + (col + 0.5) * HM.cw;
                  if (Math.abs(x - 960) > R2) continue;
                  for (const dr of [-2, -1, 1, 2]) if (Math.abs(dr) === 1 || OM.threshold(col, cR + dr) < f) OM.cell(ctx, HM, col, cR + dr, c.dpr);
                }
                pool(ctx, 960, lineY, Math.max(200, R2), 60, ink.lit, 0.35 * f);
              }
              // Deck echo: on s186.81 the vanished deck flashes back out across the frame from the spark and fades.
              {
                const b2 = OM.prog(T, 186.812, 187.05);
                if (b2 > 0 && b2 < 1) {
                  const f = Math.sin(Math.PI * Math.min(1, b2 * 3)) * (1 - b2) + (b2 < 0.33 ? 0 : 0), w = 1100 * OM.ease.outCubic(Math.min(1, b2 * 2));
                  ctx.fillStyle = OM.c2.rgba(ink.hover, Math.max(f, (1 - b2) * 0.8));
                  for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
                    const x = HM.x0 + (col + 0.5) * HM.cw;
                    if (Math.abs(x - 960) > w || Math.abs(x - 960) < HM.cw) continue;
                    for (const dr of [-1, 0, 1]) OM.cell(ctx, HM, col, cR + dr, c.dpr);
                  }
                }
              }
              const b = OM.prog(T, 186.812, 187.12), reach = Math.sin(Math.PI * b);
              if (b > 0 && b < 1) {
                ctx.fillStyle = OM.c2.rgba(ink.hover, reach);
                const sp2 = OM.cellAt(HM, 960, 540);
                OM.cell(ctx, HM, sp2.col - 1, sp2.row, c.dpr);
                OM.cell(ctx, HM, sp2.col + 1, sp2.row, c.dpr);
              }
            }
          const { gx0, gx1 } = get();
          const fade = 1 - sm(T, DIM, PULL);
          // Grit trickling off the broken deck edges into the canyon.
          for (let n = 0; n < 36; n++) {
            const h = OM.hash(n, 1, 71), x = (n % 2 ? gx0 : gx1) + (n % 2 ? 1 : -1) * 40 * OM.hash(n, 2, 71);
            const y = lineY + HM.ch + ((T * (220 + 200 * h) + h * 700) % 600);
            ctx.fillStyle = OM.c2.rgba(ink.mid, 0.7 * fade * OM.clamp((T - start - 0.1) * 4));
            ctx.fillRect(x, y, 3, 3);
          }
          // Sparks off the rails behind the train.
          const xh = OM.lerp(-200, 2120, OM.prog(T, TR0, TR1));
          if (T >= TR0 && T < TR1 + 0.3) {
            for (let n = 0; n < 16; n++) {
              const slot = Math.floor(T * 30) - (n % 6), a = T - slot / 30, h = OM.hash(slot, n, 72);
              const x = OM.lerp(-200, 2120, OM.prog(slot / 30, TR0, TR1)) - 280 - 200 * h * a * 3, y = lineY + HM.ch * 3 + 200 * a * h + 1200 * a * a;
              ctx.fillStyle = OM.c2.rgba(ink.crest, 1 - a * 5);
              ctx.fillRect(x, y, 3, 3);
            }
          }
          }
          // Wide on the canyon, then a punch as the key word closes the span and a push along it riding with the train.
          const xh = OM.lerp(-200, 2120, OM.prog(T, TR0, TR1));
          const push = sm(T, TR0 - 0.2, TR0 + 0.5) * (1 - sm(T, TR1, PULL));
          const flare = sm(T, TR0, TR0 + 0.1) * (1 - sm(T, TR1, TR1 + 0.2));
          OM.c2.apply(fx, T, start, END, { amount: 1, zoom: 1 + 0.07 * push, x: -(xh - 960) * 0.05 * push, p0: [xh / 1920, 1 - (lineY + HM.ch * 1.5) / 1080, flare, 0], punch: 0.05 * OM.c2.punch(T, on[K]) });
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
