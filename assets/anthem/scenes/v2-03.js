// Lattice type (OM.v2lat), shared with v2-04: words in JetBrains Mono 800
// rasterized into square cells on a 9 px pitch (8 px cell, 1 px gap), banded
// crest / hover / lit from the top of each row.
//
// v2-03 · Shatter and scrub. The desk from v2-02 fades to a bare lattice and
// the first words stamp onto it in lattice type. The third word cracks the
// frame like glass from where it lands; on the snare the whole picture bursts
// into shards that spin away through the accelerating roll. Then a snapshot
// timeline comes up, its playhead scrubs back in steps on the hits, a reversed
// clock counting down, and every shard flies back along its own path, trailing
// the way it came. The last word lands as the last shard locks in: the
// restore, the biggest hit. The line reads whole, then dissolves to night.

// Edit camera: the restore on the last word (126.621) is the scene's own biggest hit, its camera
// snapping in 3% with the ring of light, so the backbeat jolt 25 ms before it (126.596) is skipped
// rather than stacked on it. Elsewhere the defaults fit: the burst (124.738 snare) and the scrub steps
// fall between the camera's beats, and the line sits well inside the frame.
OM.edit.plan('v2-03', { skip: [126.596] });

OM.ownWords.add('v2-03');
(() => {
  const P = 9, CELL = 8;
  /** Rasterize words laid out by OM.v2.layout into cells on the 9 px grid: [{ cells: [[x, y]], top, bot }]. */
  const raster = (words, L) => {
    const S = 2;
    return words.map((w, k) => {
      const a = L.at[k];
      if (!w.text) return { cells: [], top: 0, bot: 0 };
      const x0 = Math.floor(a.x / P) * P - P, y0 = Math.floor((a.base - L.capPx * 1.2) / P) * P;
      const cols = Math.ceil((a.w + 3 * P) / P), rows = Math.ceil((L.capPx * 1.55) / P);
      const cnv = document.createElement('canvas');
      cnv.width = cols * P * S;
      cnv.height = rows * P * S;
      const x = cnv.getContext('2d', { willReadFrequently: true });
      x.scale(S, S);
      x.font = L.font;
      x.fillStyle = '#fff';
      x.textBaseline = 'alphabetic';
      x.fillText(w.text, a.x - x0, a.base - y0);
      const px = x.getImageData(0, 0, cnv.width, cnv.height).data;
      const cells = [];
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          let sum = 0, n = 0;
          for (let yy = j * P * S + 2; yy < (j + 1) * P * S - 2; yy += 2)
            for (let xx = i * P * S + 2; xx < (i + 1) * P * S - 2; xx += 2) { sum += px[(yy * cnv.width + xx) * 4 + 3]; n++; }
          if (sum / n > 110) cells.push([x0 + i * P, y0 + j * P]);
        }
      const top = cells.length ? Math.min(...cells.map((c) => c[1])) : 0, bot = cells.length ? Math.max(...cells.map((c) => c[1])) : 0;
      return { cells, top, bot };
    });
  };
  /** Band ink for a cell at y in a word spanning [top, bot]. */
  const band = (ink, y, top, bot) => {
    const f = (y - top) / Math.max(1, bot - top);
    return f < 0.34 ? ink.crest : f < 0.64 ? ink.hover : ink.lit;
  };
  /** Draw a rasterized word: crest on its landing, cooling to its bands; `keep(x, y)` may drop cells. */
  const draw = (ctx, ink, R, age, { alpha = 1, keep = null, dx = 0, dy = 0 } = {}) => {
    if (!R.cells.length || alpha <= 0) return;
    ctx.globalAlpha = alpha;
    const hot = Math.exp(-age / 0.12);
    for (const [x, y] of R.cells) {
      if (keep && !keep(x, y)) continue;
      ctx.fillStyle = hot > 0.5 ? ink.crest : OM.mix(band(ink, y, R.top, R.bot), ink.crest, hot * 2);
      ctx.fillRect(x + dx, y + dy, CELL, CELL);
    }
    ctx.globalAlpha = 1;
  };
  /** The bare lattice: faint lines every 6th cell of the 9 px pitch. */
  const grid = (x, a) => {
    if (a <= 0) return;
    const [r, g, b] = OM.rgb(OM.theme('tokyo-night')['border-subtle']);
    x.fillStyle = `rgba(${r},${g},${b},${a})`;
    for (let gx = 0; gx <= 1920; gx += P * 6) x.fillRect(gx, 0, 1, 1080);
    for (let gy = 0; gy <= 1080; gy += P * 6) x.fillRect(0, gy, 1920, 1);
  };
  OM.v2lat = { P, CELL, raster, band, draw, grid };
  // The two boot panes the v2-03 > v2-04 match cut lands on: v2-03's words become their frames.
  const PANES = [{ x: 60, y: 100, w: 820, h: 880 }, { x: 1040, y: 100, w: 820, h: 880 }];
  const paneFrame = (x, r, alpha = 1) => {
    if (r.w < 4 || r.h < 4) return;
    const th = OM.theme('tokyo-night');
    x.globalAlpha = alpha;
    x.fillStyle = th['border-strong'];
    x.fillRect(r.x, r.y, r.w, r.h);
    x.fillStyle = th['bg-deep'];
    x.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    x.globalAlpha = 1;
  };
  /** The shared cut frame at 127.562: night, the full lattice, two empty boot panes. */
  const bootCut = (x) => {
    x.fillStyle = OM.fieldInks('tokyo-night').bg;
    x.fillRect(0, 0, 1920, 1080);
    grid(x, 1);
    PANES.forEach((r) => paneFrame(x, r));
  };
  OM.v2boot = { PANES, paneFrame, bootCut };
})();

OM.scene({
  id: 'v2-03',
  build(el, { start, duration }) {
    const V = OM.v2, LT = OM.v2lat;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    // Rewind: tracking bands that shear sideways, a scrub blur along x, a green cast; held off the line's band (uP1.xy).
    const FX = `vec4 effect(vec2 uv) {
      vec2 q = cam(uv);
      vec4 base = src(q);
      float rw = uP0.x * uAmount;
      if (q.y > uP1.x && q.y < uP1.y) rw *= 0.12;
      if (rw <= 0.0) return base;
      float band = floor(q.y * 18.0 + uTime * 30.0);
      float sh = step(0.72, hash(vec2(band, 3.0))) * (hash(vec2(band, 7.0)) - 0.5) * 0.03;
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 6; i++) acc += src(q + vec2(sh + (float(i) - 2.5) * 0.0025, 0.0)).rgb;
      acc /= 6.0;
      float l = dot(acc, vec3(0.3, 0.59, 0.11));
      vec3 g = mix(acc, vec3(l * 0.78, l * 1.02, l * 0.62), 0.45);
      float line = smoothstep(0.96, 1.0, fract(q.y * 18.0 + uTime * 30.0)) * 0.12;
      return vec4(mix(base.rgb, g + vec3(0.52, 0.66, 0.35) * line, rw), 1.0);
    }`;
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: FX });
    const off = document.createElement('canvas'); // the intact picture, printed onto the shards
    const oc = OM.canvas(off, { alpha: false });
    const ink = V.ink(), th = V.th();
    const sung = OM.sung('v2-03');
    const N = sung.length;
    const on = sung.map((w) => w.t0);
    const END = start + duration;
    const NB = Math.min(6, N); // words that are in the picture when it breaks
    const KB = Math.min(2, N - 1); // the word that cracks it
    // Drum times on the measured hits (OM.T.drums).
    const SH = Math.max(on[NB - 1] + 0.015, V.drum('snare', 124.761)); // the snare: the burst
    const GLINT = V.drum('kick', 125.16); // the kick inside the burst
    // The scrub back: a step on each hit, the last word the lock.
    const RW = [on[Math.min(6, N - 1)], V.drum('kick', 125.945), V.drum('kick', 126.224), on[Math.min(7, N - 1)], on[N - 1]].filter((x, i, a) => i === 0 || x > a[i - 1]);
    const LOCK = on[N - 1];
    const ARR = RW.slice(1); // each scrub step lands on a hit
    const STEP = ARR.map((_, i) => 1 - (i + 1) / ARR.length);
    const MC0 = END - 0.47, MC1 = END - 0.09; // the match cut: the line's cells build the two boot panes
    let groups = null;
    const TM = 1.1;

    let F = null, mesh = null, printed = false, pat = null;
    const plan = () => {
      const L = V.layout(sung, { cap: 92, maxW: 1700, cx: 960, cy: 450, lead: 1.42 });
      F = { L, R: LT.raster(sung, L) };
      // The glass: rings of jittered points around the impact, quads between them split into shards.
      const a = L.at[KB], ix = a.cx, iy = a.cy;
      const rng = OM.rng(2333);
      const RAD = [0, 80, 190, 340, 560, 850, 1250, 1900], NA = 16;
      const pt = RAD.map((r, i) => Array.from({ length: NA }, (_, j) => {
        const t = ((j + (i ? (rng() - 0.5) * 0.7 : 0)) / NA) * Math.PI * 2;
        const rr = r * (i ? 0.88 + rng() * 0.24 : 0);
        return [ix + Math.cos(t) * rr, iy + Math.sin(t) * rr];
      }));
      const shards = [];
      for (let i = 0; i < RAD.length - 1; i++)
        for (let j = 0; j < NA; j++) {
          const A = pt[i][j], B = pt[i][(j + 1) % NA], Cc = pt[i + 1][(j + 1) % NA], D = pt[i + 1][j];
          const polys = i === 0 ? [[A, Cc, D]] : [[A, B, Cc], [A, Cc, D]];
          for (const poly of polys) {
            const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
            const dx = cx - ix, dy = cy - iy, d = Math.hypot(dx, dy) || 1;
            const sp = (1100 - i * 110) * (0.55 + 0.45 * rng());
            shards.push({ poly, cx, cy, r: Math.hypot(...[0, 1].map((k) => Math.max(...poly.map((p) => Math.abs(p[k] - [cx, cy][k]))))),
              vx: (dx / d) * sp + (rng() - 0.5) * 160, vy: (dy / d) * sp + (rng() - 0.5) * 160 - 120, w: (rng() - 0.5) * 7, ring: i });
          }
        }
      // Crack edges for the foreshadowing, with the radius each reaches.
      const edges = [];
      for (let i = 0; i < RAD.length - 1; i++)
        for (let j = 0; j < NA; j++) {
          edges.push([pt[i][j], pt[i + 1][j], RAD[i + 1]]);
          if (i) edges.push([pt[i][j], pt[i][(j + 1) % NA], RAD[i]]);
        }
      mesh = { shards, edges, ix, iy };
      printed = false;
    };
    /** Fraction of the burst still to undo: 1 until the scrub, stepping to 0 on the hits. */
    const remain = (T) => {
      let f = 1;
      ARR.forEach((h, i) => {
        const from = Math.max(i ? ARR[i - 1] : RW[0], h - 0.2);
        if (T < from) return;
        f = OM.lerp(i ? STEP[i - 1] : 1, STEP[i], OM.ease.inOutCubic(OM.prog(T, from, h)));
      });
      return f;
    };
    const tau0 = TM * (1 - Math.exp(-(RW[0] - SH) / 0.45));
    /** Shard time: running out from the burst, then scrubbed back along the same path. */
    const tau = (T) => (T < SH ? 0 : T < RW[0] ? TM * (1 - Math.exp(-(T - SH) / 0.45)) : tau0 * remain(T));
    const pose = (s, ta) => ({ x: s.vx * ta, y: s.vy * ta + 260 * ta * ta, r: s.w * ta });

    /** The lattice behind the words: faint lines on the 9 px pitch, every 6th, so the glass has something to break. */
    const lattice = LT.grid;
    /** The picture as it is just before the burst: lattice and the first words. */
    const picture = (x, T, { desk = 0 } = {}) => {
      if (desk > 0) {
        V.still(x, 7);
        x.fillStyle = V.rgba(ink.bg, 1 - desk);
        x.fillRect(0, 0, 1920, 1080);
      } else {
        x.fillStyle = ink.bg;
        x.fillRect(0, 0, 1920, 1080);
      }
      lattice(x, 1 - desk);
      for (let k = 0; k < NB; k++) if (T >= on[k]) LT.draw(x, ink, F.R[k], T - on[k]);
    };

    return {
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (T < start + V.HOLD_IN) return fx.apply(T), V.still(ctx, 7);
        if (T >= END - V.HOLD_OUT) return fx.apply(T), OM.v2boot.bootCut(ctx);
        if (!F || !V.met().ok) plan();
        const desk = 1 - OM.ease.inOutCubic(OM.prog(T, start + V.HOLD_IN, on[0] + 0.3));
        const ta = tau(T);
        const lockA = T >= LOCK ? Math.exp(-(T - LOCK) / 0.22) : 0;
        const mc = OM.ease.inOutCubic(OM.prog(T, MC0, MC1));

        if (T < SH || (T >= LOCK && ta === 0)) {
          // Whole: before the burst, and again once restored.
          if (T < SH) picture(ctx, T, { desk });
          if (T >= LOCK) {
            // Restored. Then the match cut: two frames grow out of the line's left and right halves into
            // the boot panes, every cell of the words flying out to the frame edge it becomes.
            ctx.fillStyle = ink.bg;
            ctx.fillRect(0, 0, 1920, 1080);
            lattice(ctx, 1);
            if (!groups) {
              groups = [0, 1].map((side) => {
                const cs = [];
                F.R.forEach((R, k) => { if ((F.L.at[k].cx >= 960 ? 1 : 0) === side) cs.push(...R.cells); });
                const xs = cs.map((q) => q[0]), ys = cs.map((q) => q[1]);
                const box = cs.length ? { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) + LT.CELL, h: Math.max(...ys) - Math.min(...ys) + LT.CELL } : { x: 960, y: 540, w: 0, h: 0 };
                return { box, side };
              });
            }
            const rects = groups.map((g) => V.lerpRect(g.box, OM.v2boot.PANES[g.side], mc));
            if (mc > 0) rects.forEach((r) => OM.v2boot.paneFrame(ctx, r, 1));
            if (mc <= 0) {
              for (let k = 0; k < N; k++) LT.draw(ctx, ink, F.R[k], k >= NB ? T - on[k] : 9);
              if (lockA > 0.02) for (let k = 0; k < N; k++) LT.draw(ctx, { crest: ink.crest, hover: ink.crest, lit: ink.crest }, F.R[k], 9, { alpha: lockA * 0.8 });
            } else {
              F.R.forEach((R, k) => {
                const side = F.L.at[k].cx >= 960 ? 1 : 0, r = rects[side];
                R.cells.forEach(([x, y], i) => {
                  const h = OM.hash(i, k, 77), d = OM.hash(i, k, 78);
                  const u = OM.ease.inOutCubic(OM.clamp((mc - d * 0.45) / 0.55));
                  if (u >= 1) return;
                  // A point on the growing frame's perimeter.
                  const per = 2 * (r.w + r.h), q = h * per;
                  const px = q < r.w ? r.x + q : q < r.w + r.h ? r.x + r.w : q < 2 * r.w + r.h ? r.x + r.w - (q - r.w - r.h) : r.x;
                  const py = q < r.w ? r.y : q < r.w + r.h ? r.y + (q - r.w) : q < 2 * r.w + r.h ? r.y + r.h : r.y + r.h - (q - 2 * r.w - r.h);
                  ctx.fillStyle = u > 0 ? ink.crest : LT.band(ink, y, R.top, R.bot);
                  const sz = LT.CELL * (1 - u * 0.7);
                  ctx.fillRect(OM.lerp(x, px, u) - sz / 2 + LT.CELL / 2, OM.lerp(y, py, u) - sz / 2 + LT.CELL / 2, sz, sz);
                });
              });
            }
          }
          // The crack: hairlines running out from the breaking word, all the way at the burst.
          if (T >= on[KB] && T < SH) {
            const cr = OM.lerp(0, 380, OM.ease.outExpo(OM.prog(T, on[KB], on[KB] + 0.2))) + 260 * OM.prog(T, on[KB] + 0.2, SH);
            ctx.strokeStyle = V.rgba(ink.crest, 0.75);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (const [A, B, r] of mesh.edges) if (r <= cr) { ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
            ctx.stroke();
          }
        } else {
          // Broken: the intact picture printed once, then carried on every shard.
          if (!printed) {
            const x = oc.ensure();
            picture(x, SH - 0.001);
            pat = ctx.createPattern(off, 'no-repeat');
            pat.setTransform(new DOMMatrix().scale(1920 / off.width, 1080 / off.height));
            printed = true;
          }
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const scrub = T >= RW[0];
          const glint = T >= GLINT && T < RW[0] ? Math.exp(-(T - GLINT) / 0.12) : 0; // sprinkle: shard glint on the kick
          for (const s of mesh.shards) {
            const p = pose(s, ta);
            if (s.cx + p.x < -s.r * 2 - 200 || s.cx + p.x > 2120 + s.r * 2 || s.cy + p.y > 1280 + s.r * 2 || s.cy + p.y < -200 - s.r * 2) continue;
            // Its trail: where it came from, shown while it flies back.
            if (scrub && ta > 0.02) {
              const q = pose(s, Math.min(tau0, ta + 0.22));
              ctx.strokeStyle = V.rgba(ink.lit, 0.28);
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(s.cx + p.x, s.cy + p.y);
              ctx.lineTo(s.cx + q.x, s.cy + q.y);
              ctx.stroke();
            }
            ctx.save();
            ctx.translate(s.cx + p.x, s.cy + p.y);
            ctx.rotate(p.r);
            ctx.translate(-s.cx, -s.cy);
            ctx.beginPath();
            s.poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.closePath();
            ctx.fillStyle = pat;
            ctx.fill();
            ctx.strokeStyle = V.rgba(ink.crest, OM.clamp(0.25 + 0.6 * glint + ta * 0.4));
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
          }
          // Small glass chips riding the same clock.
          for (let i = 0; i < 40; i++) {
            const hx = OM.hash(i, 3, 41), hy = OM.hash(i, 3, 42), hz = OM.hash(i, 3, 43);
            const a = hx * Math.PI * 2, v = 600 + 900 * hy;
            const x = mesh.ix + Math.cos(a) * v * ta, y = mesh.iy + Math.sin(a) * v * ta + 300 * ta * ta;
            ctx.fillStyle = V.rgba(i % 2 ? ink.hover : ink.crest, OM.clamp(ta * 3) * 0.8);
            ctx.fillRect(x - 2, y - 2, 3 + 3 * hz, 3 + 3 * hz);
          }
        }

        // The words after the break land on the scrubbing picture.
        if (T < LOCK || ta > 0) for (let k = NB; k < N; k++) if (T >= on[k]) LT.draw(ctx, ink, F.R[k], T - on[k]);

        // The snapshot timeline: up with the burst, its playhead scrubbing back in steps to the snapshot before the break.
        const ui = OM.ease.inOutCubic(OM.prog(T, SH, SH + 0.3)) * (1 - OM.ease.inOutCubic(OM.prog(T, LOCK + 0.1, LOCK + 0.5)));
        if (ui > 0.01) {
          const x0 = 300, x1 = 1620, y = 980;
          ctx.globalAlpha = ui;
          ctx.fillStyle = th['border-strong'];
          ctx.fillRect(x0, y, x1 - x0, 3);
          const ticks = [0, 0.18, 0.36, 0.55, 0.74, 0.86];
          ticks.forEach((f, i) => {
            ctx.fillStyle = i === 4 ? ink.lit : th['text-muted'];
            ctx.fillRect(x0 + f * (x1 - x0) - 4, y - 8, 8, 19);
          });
          const live = T < RW[0] ? OM.prog(T, SH, RW[0]) : 1;
          const ph = OM.lerp(0.74, 0.86 + 0.1 * live, T < RW[0] ? 1 : remain(T));
          const hx = x0 + ph * (x1 - x0);
          ctx.fillStyle = ink.crest;
          ctx.fillRect(hx - 3, y - 26, 6, 55);
          ctx.font = "600 26px 'JetBrains Mono'";
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = th['text-secondary'];
          const secs = T < RW[0] ? ta : ta;
          ctx.fillText((scrubbing(T) ? '-' : '+') + secs.toFixed(2) + 's', hx + 16, y - 14);
          if (scrubbing(T)) {
            ctx.fillStyle = ink.crest;
            for (let i = 0; i < 2; i++) {
              ctx.beginPath();
              ctx.moveTo(x0 - 40 - i * 34, y - 18);
              ctx.lineTo(x0 - 74 - i * 34, y + 2);
              ctx.lineTo(x0 - 40 - i * 34, y + 22);
              ctx.closePath();
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
        }
        // The restore: a ring of light out of the impact as the last shard locks.
        if (lockA > 0.02) {
          ctx.strokeStyle = V.rgba(ink.crest, lockA);
          ctx.lineWidth = 6 * lockA + 1;
          ctx.beginPath();
          ctx.arc(mesh.ix, mesh.iy, 40 + 900 * (1 - lockA), 0, Math.PI * 2);
          ctx.stroke();
        }

        const ce = V.camEnv(T, start, END);
        const roll = (ta / TM) * (T < RW[0] ? 1 : 1);
        const band0 = 1 - (Math.max(...F.R.map((r) => r.bot)) + 20) / 1080, band1 = 1 - (Math.min(...F.R.map((r) => r.top)) - 20) / 1080;
        fx.apply(T, {
          amount: V.env(T, start, END),
          cam: { zoom: 1 + ce * (0.015 + 0.03 * roll + 0.03 * lockA), rot: ce * 0.03 * roll },
          p0: [Math.sin(Math.PI * OM.prog(T, RW[0], LOCK + 0.1)), 0, 0, 0],
          p1: [band0, band1, 0, 0],
        });
      },
      release: () => { fx.release(); c.release(); oc.release(); },
    };
    function scrubbing(T) { return T >= RW[0] && T < LOCK + 0.05; }
  },
});
