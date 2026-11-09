// v1-04 · Tear it out (keep). The white page v1-03 left is the rented world,
// and the line prints onto it in black, word by word, each stamped in on its
// onset. From the fourth word a crack runs down a seam stepped on the lattice
// and leaning 10 degrees, straight through the printed words. On the 52.268
// kick into the downbeat the page tears open along it: the halves peel away
// and fall, and underneath, in exactly the same cells, the same words were
// already there in Tokyo Night's green. The last words are new: they build
// cell by cell in the gap's world, the key word on the snare fill. Then the
// letters let go cell by cell and fall as v1-05's rain (V.letterRain, the
// shared cut frame).

// Edit camera: the rip on the 52.268 kick is the scene's own big hit (its camera punches 5% as the
// page tears), so the camera's downbeat punch there is skipped rather than stacked on it.
OM.edit.plan('v1-04', { skip: [52.256] });

OM.ownWords.add('v1-04');
(() => {
  const V = OM.v1;
  const WEIGHT = 800;
  const PROBE = V.ready('v1-04-type', WEIGHT);
  const GLSL = V.TEXTMASK + `
vec4 effect(vec2 uv) {
  vec2 u = cam(uv);
  vec4 c = src(u);
  if (uAmount <= 0.0) return c;
  float X = u.x * 1920.0, Y = (1.0 - u.y) * 1080.0;
  float d = abs(X - (960.0 + (540.0 - Y) * 0.1763));
  float near = exp(-max(d - uP0.x - 30.0, 0.0) / 40.0);
  vec2 px = 1.6 / vec2(1920.0, 1080.0);
  float relief = dot(src(u + px).rgb - src(u - px).rgb, vec3(0.333)) * 1.8 * near; // the torn edge in relief
  float g = exp(-abs(d - uP0.x) / 22.0) * uP0.y; // green bleeding out along the torn edges
  return vec4(c.rgb + relief * uAmount * 0.6 + vec3(0.62, 0.81, 0.42) * g * 0.32 * uAmount, 1.0);
}`;
  OM.scene({
    id: 'v1-04',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = V.post(el, c, GLSL);
      const END = start + duration, H = V.HOLD;
      const W = OM.theme('white');
      const ink = OM.fieldInks('tokyo-night');
      const on = OM.sung('v1-04').map((w) => w.t0);
      const N = on.length;
      const HM = OM.HOME, G = { x0: HM.x0, y0: HM.y0, cw: HM.cw / 2, ch: HM.ch / 2 };
      const RIP = 52.268, PEEL = 52.42, GONE = 52.95, DRAIN0 = 54.24, DRAIN1 = END - H - 0.01;
      // Words printed on the page before the rip; the rest are built new underneath.
      const PRINTED = Math.max(1, on.filter((t0) => t0 < RIP - 0.1).length);
      const CRACK0 = on[Math.min(3, PRINTED - 1)];

      // The seam: one vertex per lattice row, x on cell edges, jittered a cell or two.
      const lean = Math.tan((10 * Math.PI) / 180);
      const rng = OM.rng(404);
      const seam = [];
      for (let r = HM.rMin - 1; r <= HM.rMin + HM.rows + 1; r++) {
        const y = HM.y0 + r * HM.ch;
        const col = Math.round((960 + (540 - y) * lean - HM.x0) / HM.cw) + Math.round((rng() - 0.5) * 3);
        seam.push([HM.x0 + col * HM.cw, y]);
      }
      const halfPath = (side) => {
        const p = new Path2D(), edge = side < 0 ? -60 : 1980;
        p.moveTo(edge, seam[0][1]);
        for (const [x, y] of seam) p.lineTo(x, y);
        p.lineTo(edge, seam[seam.length - 1][1]);
        p.closePath();
        return p;
      };
      const SEAM = new Path2D();
      seam.forEach(([x, y], i) => (i ? SEAM.lineTo(x, y) : SEAM.moveTo(x, y)));
      const HALVES = [[halfPath(-1), -1], [halfPath(1), 1]];

      const get = V.lazy(PROBE, () => {
        const L = V.layout('v1-04', { weight: WEIGHT, cap: 124, maxW: 1760 });
        const lh = L.cap * 1.6;
        return L.words.map((wd) => {
          const base = 540 + (wd.row - (L.rows - 1) / 2) * lh + L.cap / 2;
          return { ...wd, base, cap: L.cap, cells: V.raster(wd.text, L.font, L.size, wd.x, base, G, L.A), cx: wd.x + wd.w / 2, cy: base - L.cap / 2 };
        });
      });
      // The page as it stands at the rip, painted once per resolution: white, the printed words in black.
      let snap = null, snapDpr = 0, snapOf = null;
      const page = (words, dpr) => {
        if (snap && snapDpr === dpr && snapOf === words) return snap;
        snap = document.createElement('canvas');
        snap.width = Math.round(1920 * dpr);
        snap.height = Math.round(1080 * dpr);
        const g = snap.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = W.bg;
        g.fillRect(0, 0, 1920, 1080);
        g.fillStyle = W.text;
        for (const wd of words.slice(0, PRINTED)) for (const [q, r] of wd.cells) OM.cell(g, G, q, r, dpr);
        g.strokeStyle = W['field-crest'];
        g.lineWidth = 3;
        g.stroke(SEAM);
        snapDpr = dpr;
        snapOf = words;
        return snap;
      };
      const band = (wd, r) => {
        const f = (G.y0 + (r + 0.5) * G.ch - (wd.base - wd.cap)) / wd.cap;
        return f < 0.34 ? ink.crest : f < 0.67 ? ink.hover : ink.lit;
      };
      const spread = (T) => 70 * OM.ease.outExpo(OM.prog(T, RIP, RIP + 0.14)) + 1500 * OM.ease.inCubic(OM.prog(T, PEEL, GONE));

      // Camera: handheld tension building to the rip, a punch on it, then released. Scraps fly off the seam.
      // The handheld runs on the beat clock, so it surges through each beat.
      const beat = OM.edit.scene(start, END);
      const FXP = (ctx, dpr, T) => {
        const e = V.env(T, start, END);
        const tense = 1.5 + 9 * OM.prog(T, CRACK0, RIP) * (T < RIP ? 1 : Math.exp(-(T - RIP) / 0.3));
        const punch = T >= RIP ? 0.05 * Math.exp(-(T - RIP) / 0.12) : 0;
        const C = beat.clock(T);
        const x = tense * (Math.sin(C * 13.1) + 0.6 * Math.sin(C * 29.7)), y = tense * (Math.cos(C * 11.3) + 0.5 * Math.sin(C * 23.9));
        const s = T >= RIP - 0.02 ? spread(T) : 0;
        const bleed = OM.smooth(OM.prog(T, CRACK0, RIP)) * (1 - OM.prog(T, GONE, GONE + 0.5));
        if (T >= RIP && T < RIP + 1.3 && e > 0) {
          const age = T - RIP;
          for (let i = 0; i < 46; i++) {
            const h1 = OM.hash(i, 1, 41), h2 = OM.hash(i, 2, 41), h3 = OM.hash(i, 3, 41);
            const y0 = 80 + h1 * 920, x0 = 960 + (540 - y0) * lean, dir = h2 < 0.5 ? -1 : 1;
            const px = x0 + dir * (260 + 700 * h3) * age, py = y0 - (220 + 300 * h2) * age + 1100 * age * age;
            const sz = 5 + 12 * h3;
            ctx.save();
            ctx.globalAlpha = (1 - age / 1.3) * e;
            ctx.translate(px, py);
            ctx.rotate(age * (6 + 10 * h1) * dir);
            ctx.fillStyle = h1 > 0.3 ? W.bg : W['border-strong'];
            ctx.fillRect(-sz / 2, -sz / 3, sz, (sz * 2) / 3);
            ctx.restore();
          }
        }
        return { amount: e, cam: { zoom: 1 + (0.035 + punch) * e, x: x * e, y: y * e, rot: tense * 0.0005 * Math.sin(C * 7.3) * e }, p0: [s, bleed, 0, 0] };
      };
      return {
        render(t, T) {
          this.draw(t, T);
          fx.apply(T, FXP(c.ensure(), c.dpr, T));
        },
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + H) return OM.handoff('white', ctx, T, dpr);
          if (T >= END - H) {
            ctx.fillStyle = ink.bg;
            ctx.fillRect(0, 0, 1920, 1080);
            return V.letterRain(ctx, T, dpr); // the cut frame v1-05 opens on
          }
          const words = get();
          // Beneath: Tokyo Night's field, quiet, and the line in green in the same cells.
          if (T >= RIP - 0.02) {
            const drain = OM.prog(T, DRAIN0, DRAIN1);
            const flood = OM.ease.outCubic(OM.prog(T, PEEL, GONE + 0.3));
            OM.hero(ctx, T, dpr, { inks: ink, L: HM, mode: 'flat', word: false, gain: (0.9 + 0.6 * flood) * (1 - OM.smooth(drain)) });
            if (T >= V.RAIN0) V.letterRain(ctx, T, dpr); // letter rain: the line lets go, cell by cell
            for (const wd of words) {
              if (T >= V.RAIN0) break;
              const age = T - on[wd.k];
              if (wd.k >= PRINTED && age < 0) continue;
              const built = wd.k < PRINTED ? 9 : OM.ease.outExpo(OM.clamp(age / 0.18));
              for (const [q, r] of wd.cells) {
                const th = OM.threshold(q, r);
                if (th > built || th < drain) continue;
                const fresh = wd.k >= PRINTED && age < 0.35 && th > age / 0.35;
                ctx.fillStyle = fresh ? ink.crest : band(wd, r);
                OM.cell(ctx, G, q, r, dpr);
              }
              // New cells build out from the word on its onset: a ring of crest cells around it.
              if (wd.k >= PRINTED && age < 0.3) {
                const a = age / 0.3, rx = wd.w / 2 + 30 + 260 * OM.ease.outExpo(a), ry = 50 + 120 * OM.ease.outExpo(a);
                ctx.fillStyle = ink.mid;
                for (let i = 0; i < 64; i++) {
                  if (OM.hash(i, wd.k, 9) < a) continue;
                  const th2 = (i / 64) * Math.PI * 2;
                  const x = wd.cx + Math.cos(th2) * rx, y = wd.cy + Math.sin(th2) * ry;
                  const cl = OM.cellAt(HM, x, y);
                  OM.cell(ctx, HM, cl.col, cl.row, dpr);
                }
              }
            }
          }
          // Seam ember: on the 53.06 snare the old seam glows once in crest cells and cools, around the words.
          const EMBER = 53.06;
          if (T >= EMBER && T < EMBER + 0.4) {
            ctx.fillStyle = ink.crest;
            ctx.globalAlpha = Math.exp(-(T - EMBER) / 0.12);
            for (const [x, y] of seam) {
              const cl = OM.cellAt(HM, x, y + HM.ch / 2);
              const px = HM.x0 + (cl.col + 0.5) * HM.cw, py = HM.y0 + (cl.row + 0.5) * HM.ch;
              if (words.some((wd) => px > wd.x - 20 && px < wd.x + wd.w + 20 && py > wd.base - wd.cap - 20 && py < wd.base + 20)) continue;
              OM.cell(ctx, HM, cl.col, cl.row, dpr);
            }
            ctx.globalAlpha = 1;
          }
          if (T >= GONE) return;
          // The page: printed live until the rip, then the frozen sheet in two halves.
          if (T < RIP - 0.02) {
            ctx.fillStyle = W.bg;
            ctx.fillRect(0, 0, 1920, 1080);
            ctx.fillStyle = W.text;
            for (const wd of words.slice(0, PRINTED)) {
              const age = T - on[wd.k];
              if (age < 0) continue;
              const k = 1 + 0.22 * Math.exp(-age / 0.05); // stamped in, settling
              ctx.save();
              ctx.translate(wd.cx, wd.cy);
              ctx.scale(k, k);
              ctx.translate(-wd.cx, -wd.cy);
              if (age < 0.06) ctx.fillStyle = W['field-lit'];
              for (const [q, r] of wd.cells) OM.cell(ctx, G, q, r, dpr);
              ctx.fillStyle = W.text;
              ctx.restore();
            }
            // The crack, running down the seam from the fourth word to the rip.
            const run = OM.prog(T, CRACK0, RIP - 0.04);
            if (run > 0) {
              const upto = Math.floor(run * (seam.length - 1));
              ctx.strokeStyle = W['field-crest'];
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(seam[0][0], seam[0][1]);
              for (let i = 1; i <= upto; i++) ctx.lineTo(seam[i][0], seam[i][1]);
              ctx.stroke();
            }
            return;
          }
          const s = spread(T), img = page(words, dpr);
          for (const [path, dir] of HALVES) {
            const fall = s > 200 ? (s - 200) * 0.6 : 0;
            ctx.save();
            ctx.translate(960 + dir * s, 540 + fall);
            ctx.rotate(dir * s * 0.0005);
            ctx.translate(-960, -540);
            ctx.clip(path);
            ctx.drawImage(img, 0, 0, 1920, 1080);
            ctx.strokeStyle = W['border-strong'];
            ctx.lineWidth = 8;
            ctx.stroke(SEAM); // the torn edge's thickness
            ctx.restore();
          }
        },
        release: () => {
          snap = null;
          fx.release();
          c.release();
        },
      };
    },
  });
})();
