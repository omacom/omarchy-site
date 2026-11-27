// v1-06 · The forge. The glow v1-05 handed over settles into the fire light
// on an anvil [line]. The words are the metal: a hammer swings down onto
// the anvil face on each onset and forges the word there, white hot and
// squashed by the blow, sparks flying off its letters as cells; the metal
// cools crest to hover to lit. The four strong kicks are extra blows that
// reheat the word under the hammer, the key word at the end is the heaviest
// strike, and on the 63.042 downbeat the whole line flares. Then the metal is
// drawn out into one bar of crest cells across the frame: the line v1-07's
// copier lamp starts from.

// Edit camera: the scene's own camera already punches and jolts on every hammer blow, and the blows
// are the drums here (the words and the four kicks), so every camera beat that lands on a blow is
// skipped, and so is the 62.466 backbeat that would shake the frame just before the key word's
// heavy blow (62.580). The camera keeps the cut beat, the 61.398 backbeat between blows and the
// 63.000 downbeat where the whole line flares.
OM.edit.plan('v1-06', { skip: [59.24, 59.774, 60.32, 60.854, 61.926, 62.466] });

OM.ownWords.add('v1-06');
(() => {
  const V = OM.v1;
  const WEIGHT = 800;
  const PROBE = V.ready('v1-06-type', WEIGHT);
  const GLSL = V.TEXTMASK + `
vec4 effect(vec2 uv) {
  vec2 u = cam(uv);
  float m = smoothstep(0.26, 0.34, uv.y) * (1.0 - smoothstep(0.6, 0.9, uv.y)) * uAmount * offText(uv); // heat rising off the anvil
  vec2 n = vec2(vnoise(uv * vec2(28.0, 9.0) - vec2(0.0, uTime * 2.2)), vnoise(uv * vec2(19.0, 7.0) - vec2(3.0, uTime * 1.7))) - 0.5;
  return src(u + n * 0.007 * m);
}`;
  OM.scene({
    id: 'v1-06',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = V.post(el, c, GLSL);
      const END = start + duration, H = V.HOLD;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const on = OM.sung('v1-06').map((w) => w.t0);
      const N = on.length;
      const HM = OM.HOME, G = { x0: HM.x0, y0: HM.y0, cw: HM.cw / 2, ch: HM.ch / 2 };
      const KICKS = [59.786, 60.32, 60.86, 61.902], FLARE = OM.beatOnset(63.042); // the measured kicks
      const DRAW0 = 63.12, DRAW1 = 63.3, FILL1 = END - H - 0.01;
      const FACE = 770; // the anvil's top face
      const hrow = OM.cellAt(HM, 960, 540).row;
      // Strikes: one per word, plus the kicks that fall between words, which re-hit the last word.
      const strikes = on.map((t, k) => ({ t, k, p: k === N - 1 ? 2 : 1 }));
      for (const t of KICKS) {
        if (on.some((o) => Math.abs(o - t) < 0.1)) continue;
        const k = OM.hitCount(on, t) - 1;
        if (k >= 0) strikes.push({ t, k, p: 0.55 });
      }
      strikes.sort((a, b) => a.t - b.t);
      // Per blow: wind-up angle, drop time, contact hold, camera weight. The key word is the heavy one.
      for (const s of strikes) {
        const key = s.p >= 2, light = s.p < 1;
        s.W = key ? 0.44 : light ? 0.23 : 0.3;
        s.D = key ? 0.13 : 0.1;
        s.hold = key ? 0.05 : 0.03;
        s.cw = key ? 3 : light ? 0.6 : 1;
      }

      // The cross-peen hammer, drawn with its striking face centred on the origin, face down, the
      // handle running out along +x. It swings rigidly about a shoulder off-frame at the upper right.
      const SC = 1.2, REST = 0.17, PIV = [1100, -700];
      const HEAD = new Path2D('M-56 0L56 0L64-8L64-34L48-48L43-132L20-177L-20-177L-43-132L-48-48L-64-34L-64-8Z');
      const HANDLE = new Path2D('M30-119Q120-114 200-116L430-122L604-126Q632-128 640-114L640-96Q632-82 604-84L430-88L200-94Q120-96 30-91Z');
      const part = (ctx, path, body, rim, rx, ry) => {
        ctx.fillStyle = rim;
        ctx.fill(path);
        ctx.save();
        ctx.clip(path);
        ctx.translate(rx, ry);
        ctx.fillStyle = body;
        ctx.fill(path);
        ctx.restore();
      };

      const get = V.lazy(PROBE, () => {
        const L = V.layout('v1-06', { weight: WEIGHT, cap: 112, maxW: 1740 });
        const lh = L.cap * 1.5;
        return L.words.map((wd) => {
          const base = FACE - 22 - (L.rows - 1 - wd.row) * lh;
          const cells = V.raster(wd.text, L.font, L.size, wd.x, base, G, L.A);
          return { ...wd, base, top: base - L.cap, cx: wd.x + wd.w / 2, cells, cap: L.cap };
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
      const heat = (k, T) => {
        let h = T >= FLARE ? 0.9 * Math.exp(-(T - FLARE) / 0.5) : 0;
        for (const s of strikes) if (s.k === k && T >= s.t) h += s.p * Math.exp(-(T - s.t) / 0.8);
        return h;
      };
      const ANVIL = (() => {
        const p = new Path2D();
        p.moveTo(119, FACE + 20);
        p.quadraticCurveTo(270, FACE - 7, 438, FACE);
        p.lineTo(1656, FACE);
        p.lineTo(1656, FACE + 44);
        p.lineTo(1330, FACE + 55);
        p.bezierCurveTo(1240, FACE + 69, 1210, FACE + 116, 1210, FACE + 164);
        p.lineTo(1350, FACE + 208);
        p.lineTo(1350, FACE + 230);
        p.lineTo(570, FACE + 230);
        p.lineTo(570, FACE + 208);
        p.lineTo(710, FACE + 164);
        p.bezierCurveTo(710, FACE + 113, 674, FACE + 65, 598, FACE + 59);
        p.lineTo(438, FACE + 52);
        p.quadraticCurveTo(266, FACE + 44, 119, FACE + 20);
        p.closePath();
        return p;
      })();

      // Camera: a slow push, punched on every hammer strike. Embers drift up off the fire.
      const FXP = (ctx, dpr, T) => {
        const e = V.env(T, start, END);
        const words = get();
        let x0 = 1920, x1 = 0, y0 = 1080, y1 = 0;
        for (const wd of words) { x0 = Math.min(x0, wd.x); x1 = Math.max(x1, wd.x + wd.w); y0 = Math.min(y0, wd.top); y1 = Math.max(y1, wd.base); }
        let punch = 0, jolt = 0;
        for (const s of strikes) {
          const age = T - s.t;
          if (age < 0) continue;
          punch += 0.03 * s.cw * Math.exp(-age / 0.09);
          jolt += 9 * s.cw * Math.exp(-age / 0.07) * Math.cos(age * 60);
        }
        const world = OM.smooth(OM.prog(T, start + H, start + 0.3)) * (1 - OM.prog(T, FLARE + 0.05, DRAW1));
        if (world > 0) {
          for (let i = 0; i < 36; i++) {
            const h = OM.hash(i, 1, 66), h2 = OM.hash(i, 2, 66);
            const rise = (T * (35 + 45 * h) + h2 * 640) % 640;
            const x = 520 + OM.hash(i, 3, 66) * 880 + 22 * Math.sin(T * 1.3 + i), y = FACE - 10 - rise;
            ctx.globalAlpha = world * (1 - rise / 640) * (0.5 + 0.5 * Math.sin(T * 9 + i));
            ctx.fillStyle = h > 0.6 ? ink.hover : ink.lit;
            ctx.fillRect(x, y, 4, 4);
          }
          ctx.globalAlpha = 1;
        }
        return { amount: e, cam: { zoom: 1 + (0.012 + 0.04 * OM.smooth(OM.prog(T, start, END)) + punch) * e, y: jolt * e }, p1: V.rect(x0 - 40, y0 - 50, x1 + 40, y1 + 40) };
      };
      return {
        render(t, T) {
          this.draw(t, T);
          fx.apply(T, FXP(c.ensure(), c.dpr, T));
        },
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + H) return OM.handoff('glow', ctx, T, dpr);
          if (T >= END - H) return OM.handoff('line', ctx, T, dpr);
          const words = get();
          const settle = OM.smooth(OM.prog(T, start + H, start + 0.3));
          const draw = OM.smooth(OM.prog(T, DRAW0, DRAW1));
          const world = settle * (1 - OM.prog(T, FLARE + 0.05, DRAW1));
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          // The handoff glow settles into the fire light over the anvil.
          const hot = Math.max(...words.map((wd) => heat(wd.k, T)), 0);
          pool(ctx, 960, OM.lerp(540, FACE - 40, settle), OM.lerp(620, 760, settle), OM.lerp(620, 300, settle), ink.lit,
            OM.lerp(0.5, 0.16 + 0.12 * Math.min(1.5, hot), settle) * (1 - draw));
          // The anvil.
          ctx.globalAlpha = world;
          ctx.fillStyle = th.surface;
          ctx.fill(ANVIL);
          ctx.strokeStyle = th['border-strong'];
          ctx.lineWidth = 2;
          ctx.stroke(ANVIL);
          ctx.fillStyle = th['surface-2'];
          ctx.beginPath();
          ctx.moveTo(438, FACE + 4);
          ctx.lineTo(1652, FACE + 4);
          ctx.lineTo(1622, FACE + 22);
          ctx.lineTo(458, FACE + 22);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = th['border-strong'];
          ctx.fillRect(582, FACE + 211, 756, 4);
          ctx.fillRect(1308, FACE + 7, 34, 10);
          ctx.fillStyle = ink.mid;
          ctx.fillRect(438, FACE, 1218, 3);
          // Anvil ring: the face rings on the kicks in the mid-line gap, its rim shivering crest.
          const ring = OM.pulse([60.32, 60.86], T, 0.08);
          if (ring > 0.02 && T >= 60.32) {
            ctx.fillStyle = ink.crest;
            ctx.globalAlpha = world * ring;
            for (let x = 438; x < 1656; x += 24) ctx.fillRect(x, FACE - 2 + 4 * ring * Math.sin(x * 0.05 + T * 90), 24, 3 + 3 * ring);
            ctx.globalAlpha = 1;
          }
          // Heat rings: each blow rings a bright ellipse of heat out across the anvil face.
          for (const s of strikes) {
            const age = T - s.t, life = s.p >= 2 ? 0.6 : 0.4;
            if (age < 0 || age > life) continue;
            const f = age / life, r = (50 + (s.p >= 2 ? 520 : 260 * Math.min(1, s.p)) * OM.ease.outCubic(f));
            ctx.globalAlpha = world * (1 - f) * Math.min(1, 0.5 + 0.5 * s.p);
            ctx.strokeStyle = f < 0.3 ? ink.crest : ink.hover;
            ctx.lineWidth = (s.p >= 2 ? 10 : 6) * (1 - f) + 1;
            ctx.beginPath();
            ctx.ellipse(words[s.k].cx, FACE + 2, r, r * 0.07 + 3, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          // The hammer. Between blows it recoils and hangs raised; before each blow it rises and cocks
          // back, then whips down an accelerating arc about the off-frame shoulder and stops dead on the
          // onset, its face driven into the squashed metal. It is drawn behind the words, so a blow on the
          // lower row never covers the row above.
          const sqOf = (k, t) => {
            let sq = 0;
            for (const s of strikes) if (s.k === k && t >= s.t) sq = Math.max(sq, s.p * Math.exp(-(t - s.t) / 0.07));
            return Math.min(1, sq);
          };
          const tgt = (s, t) => {
            const wd = words[s.k];
            return [wd.cx, wd.base - wd.cap * (1 - 0.32 * sqOf(s.k, t))];
          };
          const pose = (t) => {
            let i = strikes.findIndex((s) => s.t > t);
            if (i < 0) i = strikes.length;
            const prev = strikes[i - 1], next = strikes[i];
            const lift = (tt) => {
              let a;
              if (prev) {
                const u = tt - prev.t;
                const rest = prev.p >= 2 ? REST + 0.07 : REST;
                a = u < prev.hold ? 0 : rest * OM.ease.outBack(OM.prog(u, prev.hold, prev.hold + 0.17), 2.6);
              } else a = OM.lerp(0.62, REST, OM.smooth(OM.prog(tt, start + H, next.t - next.D - 0.12)));
              if (next) {
                const gap = next.t - (prev ? prev.t : start + H);
                const A = Math.max(0.04, Math.min(next.p >= 2 ? 0.38 : 0.28, gap - next.D - 0.17));
                const w = REST + (next.W - REST) * Math.min(1, gap / 0.45);
                a += (w - REST) * OM.ease.inOutCubic(OM.prog(tt, next.t - next.D - A, next.t - next.D));
              } else a += 0.5 * OM.ease.inCubic(OM.prog(tt, prev.t + 0.32, FLARE + 0.03));
              return a;
            };
            let ang, x, y, smear = 0;
            if (next && t > next.t - next.D) {
              const f = 1 - (next.t - t) / next.D;
              ang = lift(next.t - next.D) * (1 - f * f * f);
              smear = f;
              [x, y] = tgt(next, t);
            } else {
              ang = lift(t);
              const a = prev ? tgt(prev, t) : tgt(next, t), b = next ? tgt(next, t) : a;
              const mv = prev && next ? OM.smooth(OM.prog(t, prev.t + 0.06, next.t - next.D)) : 0;
              x = OM.lerp(a[0], b[0], mv);
              y = OM.lerp(a[1], b[1], mv);
            }
            // The shudder of the stop.
            const u = prev ? t - prev.t : 9;
            const shake = u < 0.25 ? 0.02 * Math.min(prev.p, 1.6) * Math.exp(-u / 0.05) * Math.sin(u * 120) : 0;
            const px = x + PIV[0], py = y + PIV[1], cs = Math.cos(ang), sn = Math.sin(ang);
            return { x: px + (x - px) * cs - (y - py) * sn, y: py + (x - px) * sn + (y - py) * cs, ang: ang + shake, smear, prev, u };
          };
          if (world > 0.01) {
            const P = pose(T);
            const hot = P.prev ? Math.exp(-P.u / (P.prev.p >= 2 ? 0.35 : 0.2)) * Math.min(1, P.prev.p) : 0;
            // Motion smear: the head's own silhouette trailing up the arc on the fastest frames.
            if (P.smear > 0.45) {
              for (let j = 5; j >= 1; j--) {
                const G2 = pose(T - j * 0.006);
                ctx.save();
                ctx.globalAlpha = world * 0.42 * (P.smear - 0.35) * (6 - j) / 5;
                ctx.translate(G2.x, G2.y);
                ctx.rotate(G2.ang);
                ctx.scale(SC, SC);
                ctx.fillStyle = j < 3 ? ink.mid : th['border-strong'];
                ctx.fill(HEAD);
                ctx.restore();
              }
            }
            ctx.save();
            ctx.globalAlpha = world;
            ctx.translate(P.x, P.y);
            ctx.rotate(P.ang);
            ctx.scale(SC, SC);
            // Rim light from the forge below: the body is shifted away from the light inside its own outline.
            const r = 4 + 3 * hot, rx = -r * Math.sin(P.ang), ry = -r * Math.cos(P.ang);
            const rim = hot > 0.5 ? ink.crest : hot > 0.15 ? ink.hover : ink.lit;
            part(ctx, HANDLE, th['surface-2'], ink.mid, rx * 0.6, ry * 0.6);
            ctx.fillStyle = th['border-strong'];
            for (let gx = 440; gx < 596; gx += 15) { // the grip wrap
              ctx.beginPath();
              ctx.moveTo(gx, -122 - (gx - 430) * 0.024);
              ctx.lineTo(gx + 7, -122 - (gx - 430) * 0.024);
              ctx.lineTo(gx + 1, -88 + (gx - 430) * 0.024);
              ctx.lineTo(gx - 6, -88 + (gx - 430) * 0.024);
              ctx.fill();
            }
            part(ctx, HEAD, th['border-strong'], rim, rx, ry);
            ctx.fillStyle = th['surface-2'];
            ctx.beginPath();
            ctx.moveTo(24, -131); ctx.lineTo(42, -131);
            ctx.lineTo(48, -48); ctx.lineTo(62, -34);
            ctx.lineTo(40, -34); ctx.closePath(); ctx.fill();
            ctx.fillRect(-42, -133, 84, 3);
            ctx.fillRect(-58, -33, 116, 3);
            ctx.fillStyle = th['text-muted'];
            ctx.fillRect(-39, -126, 5, 75);
            ctx.fillRect(-18, -177, 36, 3);
            // The striking face glows with the blow.
            if (hot > 0.01) {
              ctx.globalAlpha = world * hot;
              ctx.fillStyle = ink.crest;
              ctx.fillRect(-56, -7, 112, 7);
            }
            ctx.restore();
            // The flash at the contact point.
            if (P.prev && P.u < 0.2) {
              const s = P.prev, [cx, cy] = tgt(s, T), k = Math.exp(-P.u / (s.p >= 2 ? 0.09 : 0.05));
              pool(ctx, cx, cy, 120 + 110 * s.p, 46 + 40 * s.p, ink.crest, world * k * (s.p >= 2 ? 0.95 : 0.45 + 0.3 * s.p));
            }
          }
          // The words: forged on their strike, squashed by it, cooling.
          for (const wd of words) {
            if (T < on[wd.k]) continue;
            const h = heat(wd.k, T);
            pool(ctx, wd.cx, wd.base - wd.cap / 2, wd.w / 2 + 90, 120, ink.lit, Math.min(0.35, 0.22 * h) * (1 - draw));
            let sq = 0;
            for (const s of strikes) if (s.k === wd.k && T >= s.t) sq = Math.max(sq, s.p * Math.exp(-(T - s.t) / 0.07));
            const sy = 1 - 0.32 * Math.min(1, sq), sx = 1 + 0.1 * Math.min(1, sq);
            for (const [q, r] of wd.cells) {
              const v = h + (OM.threshold(q, r) - 0.5) * 0.35;
              let x = G.x0 + q * G.cw, y = G.y0 + r * G.ch;
              x = wd.cx + (x - wd.cx) * sx;
              y = wd.base + (y - wd.base) * sy;
              let w = G.cw * sx, hh = G.ch * sy;
              if (draw > 0) {
                // Drawn out: every cell runs to the centre row.
                const ty = HM.y0 + (hrow + (r & 1) * 0.5) * HM.ch;
                y = OM.lerp(y, ty, draw);
                hh = OM.lerp(hh, G.ch, draw);
              }
              ctx.fillStyle = draw > 0.5 || v > 0.8 ? ink.crest : v > 0.45 ? ink.hover : ink.lit;
              ctx.fillRect(x, y, w, hh);
            }
          }
          // The bar runs out to the frame's edges.
          if (T >= DRAW1 - 0.02) {
            const span = words.reduce((s, wd) => [Math.min(s[0], wd.x), Math.max(s[1], wd.x + wd.w)], [1920, 0]);
            const f = OM.ease.inOutCubic(OM.prog(T, DRAW1 - 0.02, FILL1));
            const a = OM.lerp(span[0], -20, f), b = OM.lerp(span[1], 1940, f);
            ctx.fillStyle = ink.crest;
            for (let col = HM.cMin; col < HM.cMin + HM.cols; col++) {
              const x = HM.x0 + (col + 0.5) * HM.cw;
              if (x >= a && x <= b) OM.cell(ctx, HM, col, hrow, dpr);
            }
          }
          // Sparks: cells bursting off the contact point, flung up and out, falling, cooling.
          ctx.globalAlpha = world;
          for (const s of strikes) {
            const age = T - s.t;
            if (age < 0 || age > 1.2) continue;
            const wd = words[s.k];
            const key = s.p >= 2, n = key ? 130 : Math.round(44 * s.p);
            const ox = wd.cx, oy = wd.base - wd.cap * (1 - 0.32 * Math.min(1, s.p));
            const seed = Math.round(s.t * 1000);
            for (let i = 0; i < n; i++) {
              const h1 = OM.hash(i, seed, 61), h2 = OM.hash(i, seed, 62), h3 = OM.hash(i, seed, 63);
              const life = (key ? 0.5 : 0.35) + 0.6 * h3;
              if (age > life) continue;
              const a = -Math.PI / 2 + (h2 - 0.5) * 3.0, v = (420 + 900 * h3) * (key ? 1.35 : 0.75 + 0.25 * s.p);
              const x0 = ox + (h1 - 0.5) * 104;
              const x = x0 + Math.cos(a) * v * age, y = oy + Math.sin(a) * v * age + 1300 * age * age;
              const f = age / life, sz = key && f < 0.4 ? 8 : 6;
              ctx.fillStyle = f < 0.25 ? ink.crest : f < 0.55 ? ink.hover : f < 0.8 ? ink.lit : ink.mid;
              ctx.fillRect(x, y, sz, sz);
              if (age < 0.1) ctx.fillRect(x - Math.cos(a) * v * 0.016, y - Math.sin(a) * v * 0.016, sz - 2, sz - 2); // streak
            }
          }
          ctx.globalAlpha = 1;
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
