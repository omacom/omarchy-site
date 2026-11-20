// c2-03 · Christening. The crest line from the cut is the gunwale of a ship's
// bow; the hull fills in beneath it. The line's first words are painted onto
// the plates in a brush wipe on their onsets, and a bottle swings in on its
// rope and smashes on the name word: from the impact the name, the wordmark,
// floods across the hull in light and cools into its band inks while glass and
// foam spray off. The kicks ripple the name; on the run into the downbeat the
// camera pushes in on it, the hull falls away and the name melts into the glow.

// Edit camera: the snare jolt at 167.04 would rattle the frame for the 164 ms
// right before the bottle smashes on the name, blunting the scene's own smash
// (punch and shake, its biggest hit), so that beat is skipped.
OM.edit.plan('c2-03', { skip: [167.036] });
OM.ownWords.add('c2-03');
(() => {
  const W = 800;
  OM.c2.ready('c2-03', W);
  const { pool, sm, decay, rgba } = OM.c2;

  const FX = `vec4 effect(vec2 uv) {
    vec2 p = cam(uv);
    if (uAmount <= 0.0) return src(p);
    // Water shimmer along the waterline at the foot of the hull.
    float w = smoothstep(0.085, 0.0, p.y);
    float r = sin(p.y * uRes.y * 0.06 + uTime * 7.0 + vnoise(p * vec2(40.0, 8.0)) * 4.0);
    vec4 c = src(p + vec2(r * 0.003 * w * uAmount, 0.0));
    c.rgb += vec3(0.733, 0.867, 0.592) * w * uAmount * 0.1 * smoothstep(0.6, 1.0, r);
    return c;
  }`;

  OM.scene({
    id: 'c2-03',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const END = start + duration;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const words = OM.sung('c2-03');
      const on = words.map((w) => w.t0);
      const K = words.length - 1; // the name
      const KICKS = [168.156, 168.382, 168.636, 168.830, 169.430]; // measured kick onsets
      const DB2 = OM.beatOnset(OM.downbeatsIn(169.5, 170)[0] || 169.738); // the downbeat's drum onset
      const HM = OM.HOME, cR = OM.cellAt(HM, 960, 540).row;
      const yT = HM.y0 + cR * HM.ch; // the gunwale: the cut's line
      const BOW = 1700;
      const NL = OM.lattice({ wordWidth: 1000, wordX: 380, wordY: 744 });
      const NAME = OM.cells(OM.WORDMARK);
      const IMP = [960, 815]; // where the bottle strikes, the middle of the name
      const CS = 5;
      const hullEdge = (y) => BOW - 220 * Math.pow(OM.clamp((y - yT) / 560), 0.8); // the stem raking back to the keel

      // The hull as lattice cells, cached once per dpr.
      let hull = null;
      const hullCanvas = (dpr) => {
        if (hull && hull.dpr === dpr) return hull.cv;
        const cvs = document.createElement('canvas');
        cvs.width = 1920 * dpr;
        cvs.height = 1080 * dpr;
        const g = cvs.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const tones = [th['bg-deep'], th.bg, th.surface, th['surface-2']];
        for (let row = cR + 1; row < HM.rMin + HM.rows; row++)
          for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
            const x = HM.x0 + (col + 0.5) * HM.cw, y = HM.y0 + (row + 0.5) * HM.ch;
            if (x > hullEdge(y)) continue;
            const s = OM.clamp((y - yT) / 560), u = x / BOW;
            const plate = (row - cR) % 9 === 0 ? -1.2 : 0; // plate seams
            const lv = OM.clamp(Math.floor(2.6 - 1.8 * s + 0.6 * u + plate + (OM.threshold(col, row) - 0.5)), 0, 3);
            g.fillStyle = tones[lv];
            OM.cell(g, HM, col, row, dpr);
          }
        hull = { dpr, cv: cvs };
        return cvs;
      };

      const get = OM.c2.lazy(W, () => {
        const ks = words.map((_, k) => k).filter((k) => k !== K);
        const L = OM.c2.layout(words, { ks, weight: W, cap: 66, maxW: 1200, cx: 900, cy: 640, rows: 1 });
        return { cells: ks.map((k) => (L.place[k] ? OM.c2.raster(words[k].text, L.place[k].x, L.place[k].base, L.px, W, CS) : [])), place: L.place, ks };
      });

      // The bottle on its rope: a pendulum that bottoms out on the impact point at the name's onset.
      const LR = 1100, TH1 = 0, PIV = [IMP[0] - LR * Math.sin(TH1), IMP[1] - LR * Math.cos(TH1)];
      const SWING = 0.62;
      const BOTTLE = ['..##..', '..##..', '..##..', '.####.', '######', '######', '######', '######', '######', '######', '######', '.####.'];

      return {
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.05) return OM.handoff('line', ctx, T, dpr);
          if (T > END - 0.07) return OM.handoff('glow', ctx, T, dpr);
          const { cells, ks } = get();
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);

          // Camera: from the run into the downbeat, push in on the name and bring it to frame centre.
          const cam = OM.ease.inOutCubic(OM.prog(T, 168.62, DB2));
          const S = 1 + 0.55 * cam, nx = OM.lerp(960, NL.x0 + 500, cam), ny = NL.y0 + 9.5 * NL.ch;
          const away = sm(T, 169.2, DB2); // the hull and the paint fall away
          const glowA = 0.5 * sm(T, 169.25, DB2 + 0.12);
          pool(ctx, 960, 540, 620, 620, ink.lit, glowA);
          ctx.save();
          ctx.translate(960, OM.lerp(ny, 540, cam));
          ctx.scale(S, S);
          ctx.translate(-nx, -ny);

          // The hull fills in under the line, top down in dither order.
          const fill = OM.prog(T, start + 0.03, start + 0.28);
          if (away < 1) {
            ctx.globalAlpha = 1 - away;
            ctx.save();
            ctx.beginPath();
            ctx.rect(-400, yT, 2800, 1080 * fill + 10);
            ctx.clip();
            ctx.drawImage(hullCanvas(dpr), 0, 0, 1920, 1080);
            ctx.restore();
            // The gunwale: the cut's crest line cooling to deck lights; past the bow it drops away.
            const cool = OM.prog(T, start, start + 0.4);
            for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
              const x = HM.x0 + (col + 0.5) * HM.cw;
              if (x > BOW && OM.threshold(col, cR) < cool * 1.4) continue;
              const th0 = OM.threshold(col, cR);
              ctx.fillStyle = th0 > cool ? ink.crest : col % 6 === 0 ? ink.hover : ink.mid;
              OM.cell(ctx, HM, col, cR, dpr);
            }
            // The painted words: a brush wipe left to right from each onset.
            ks.forEach((k, n) => {
              if (T < on[k]) return;
              const list = cells[n];
              if (!list.length) return;
              let x0 = Infinity, x1 = -Infinity;
              for (const cl of list) { x0 = Math.min(x0, cl.x); x1 = Math.max(x1, cl.x + CS); }
              const dur = Math.min(0.1, Math.max(0.08, words[k].t1 - on[k])); // a quick stroke: the word reads within two frames
              const edge = x0 + (x1 - x0 + 30) * OM.ease.outCubic(OM.prog(T, on[k], on[k] + dur));
              for (const cl of list) {
                if (cl.x > edge) continue;
                ctx.fillStyle = edge - cl.x < 26 ? ink.crest : th.text;
                ctx.fillRect(cl.x, cl.y, CS - 0.4, CS - 0.4);
              }
            });
            ctx.globalAlpha = 1;
          }

          // The name, flooding out of the impact and cooling into its bands; the kicks ripple through it.
          const a = T - on[K];
          if (a >= 0) {
            const reach = 1300 * OM.ease.outExpo(OM.clamp(a / 0.35));
            const cool = OM.clamp((a - 0.2) / 0.8);
            for (const [col, row] of NAME) {
              const x = NL.x0 + (col + 0.5) * NL.cw, y = NL.y0 + (row + 0.5) * NL.ch;
              const d = Math.hypot(x - IMP[0], y - IMP[1]);
              if (d > reach) continue;
              const tq = OM.threshold(col, row);
              if (away > 0 && tq < OM.prog(T, 169.44, DB2 + 0.1)) continue; // melting into the glow
              let p = reach - d < 60 ? ink.crest : tq > cool ? ink.crest : tq > cool - 0.3 ? ink.hover : ink[OM.BANDS[row]];
              if (p === ink.dim || p === ink.mid) p = ink.lit;
              for (const kt of KICKS) {
                const w = (T - kt) * 2600 - Math.abs(x - IMP[0]) * 2;
                if (w > 0 && w < 90) p = ink.crest;
              }
              ctx.fillStyle = p;
              OM.cell(ctx, NL, col, row, dpr);
            }
            pool(ctx, IMP[0], IMP[1], 260, 260, ink.crest, 0.45 * decay(T, on[K], 0.1));
            // Glass and foam off the smash.
            if (a < 0.9) {
              for (let s = 0; s < 70; s++) {
                const ang = -Math.PI * (0.05 + 0.9 * OM.hash(s, 1, 4)) + (s % 3 === 0 ? Math.PI * 0.5 : 0);
                const v = 300 + 900 * OM.hash(s, 2, 4);
                const x = IMP[0] + Math.cos(ang) * v * a - 120 * a, y = IMP[1] + Math.sin(ang) * v * a + 1400 * a * a;
                if (OM.hash(s, 3, 4) < a / 0.9) continue;
                ctx.fillStyle = s % 4 === 0 ? ink.crest : s % 4 === 1 ? th.text : s % 4 === 2 ? ink.lit : ink.hover;
                const sz = s % 4 === 1 ? 6 : 4;
                ctx.fillRect(x, y, sz, sz);
              }
            }
          }

          // The bottle, swinging in on its rope until it bursts.
          const u = OM.prog(T, on[K] - SWING, on[K]);
          if (u > 0 && a < 0) {
            const th1 = OM.lerp(-0.72, TH1, u * u);
            const bx = PIV[0] + LR * Math.sin(th1), by = PIV[1] + LR * Math.cos(th1);
            ctx.strokeStyle = th['text-muted'];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(PIV[0], PIV[1]);
            ctx.lineTo(bx, by);
            ctx.stroke();
            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(-th1);
            BOTTLE.forEach((r, j) => {
              for (let i = 0; i < r.length; i++) {
                if (r[i] !== '#') continue;
                ctx.fillStyle = j < 3 ? th.text : i === 1 ? ink.hover : ink.lit;
                ctx.fillRect((i - 3) * 6, j * 6 - 4, 6, 6);
              }
            });
            ctx.restore();
          }
          ctx.restore();
        },
        render(t, T) {
          this.draw(t, T);
          const ctx = c.ensure();
          if (OM.c2.live(T, start, END)) {
            // Deck lamp chase (k168.38, k168.64, s168.76, k168.83, k169.43, measured): on each hit a run of light races the gunwale from bow to stern, above the words.
            {
              const cam = OM.ease.inOutCubic(OM.prog(T, 168.62, DB2)), S2 = 1 + 0.55 * cam, ny2 = NL.y0 + 9.5 * NL.ch;
              const fade = 1 - sm(T, 169.2, DB2);
              ctx.save();
              ctx.translate(960, OM.lerp(ny2, 540, cam));
              ctx.scale(S2, S2);
              ctx.translate(-OM.lerp(960, NL.x0 + 500, cam), -ny2);
              for (const h of [KICKS[1], KICKS[2], 168.764, KICKS[3], KICKS[4]]) {
                const a = T - h;
                if (a < 0 || a > 0.7 || fade <= 0) continue;
                const head = BOW - a * 3000;
                for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
                  const x = HM.x0 + (col + 0.5) * HM.cw;
                  if (x > BOW || x > head + 140 || x < head) continue;
                  ctx.fillStyle = OM.c2.rgba(x < head + 40 ? ink.crest : ink.hover, fade);
                  OM.cell(ctx, HM, col, cR, c.dpr);
                }
              }
              ctx.restore();
            }
          // Foam drifting at the waterline after the smash.
          if (T > on[K]) {
            const a = T - on[K];
            for (let n = 0; n < 40; n++) {
              const x = (OM.hash(n, 1, 31) * 2100 - 100 + a * (40 + 60 * OM.hash(n, 2, 31))) % 2000, y = 1040 + 36 * OM.hash(n, 3, 31) - 10 * Math.sin(a * 3 + n);
              ctx.fillStyle = OM.c2.rgba(n % 3 ? ink.hover : th.text, 0.6 * OM.clamp(a * 3) * (1 - sm(T, 169.2, DB2)));
              ctx.fillRect(x, y, 5, 5);
            }
          }
          }
          // Low-angle tilt up the hull to the name, a punch and a jolt on the smash.
          const j = decay(T, on[K], 0.08);
          OM.c2.apply(fx, T, start, END, {
            amount: 1, y: 36 * (1 - OM.smooth(OM.prog(T, start, on[K]))) + 10 * j * Math.cos(T * 77), x: 14 * j * Math.sin(T * 90), rot: 0.004 * j,
            punch: 0.045 * OM.c2.punch(T, on[K]),
          });
        },
        release: () => {
          hull = null;
          fx.release();
          c.release();
        },
      };
    },
  });
})();
