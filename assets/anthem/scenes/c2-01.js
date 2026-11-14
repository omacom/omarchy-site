// c2-01 · Reverse shatter. Out of the glow, a smashed pane of glass flies back
// together. The pane is engraved with the line's words, and the shards that
// carry each word slam home on its onset with a chime ring, so every word is
// rebuilt as it is sung; the plain glass converges between them, and the key
// word's shards, the biggest, close the pane on the downbeat. Then the cracks
// seal ring by ring on the snares, the engraving fades, the glow behind goes
// out on the next downbeat, and the healed pane is the screen handoff.
//
// Also defines OM.c2, the helpers chorus 2's scenes share (layout and
// rasterizing the sung words into cells, pools, easing shorthands).

// Edit camera: the downbeat at 159.05 has no kick and lands 142 ms before the key
// word, whose shards slam the pane shut with the scene's own (bigger) punch, so
// that beat is skipped rather than flamming into it. The drop at 158.00 stays.
OM.edit.plan('c2-01', { skip: [159.05] });
OM.ownWords.add('c2-01');
(() => {
  const FONT = (w, px) => `${w} ${px}px 'JetBrains Mono'`;
  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  const m = document.createElement('canvas').getContext('2d');

  OM.c2 = {
    FONT,
    rgba,
    /** Register a font load the renderer waits on before the first frame. */
    ready(id, w) {
      window.__hf = window.__hf || {};
      window.__hf.buildReady = window.__hf.buildReady || {};
      window.__hf.buildReady[id + '-type'] = document.fonts.load(FONT(w, 100));
    },
    ok: (w) => document.fonts.check(FONT(w, 100)),
    /** Memoize make() until the font has loaded, then keep it. */
    lazy(w, make) {
      let v = null;
      return () => {
        if (!v || (!v.ok && OM.c2.ok(w))) {
          v = make();
          v.ok = OM.c2.ok(w);
        }
        return v;
      };
    },
    /** handoff.js's soft elliptical pool of light. */
    pool(ctx, x, y, rx, ry, hex, a) {
      if (a <= 0.002) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, rgba(hex, a));
      g.addColorStop(1, rgba(hex, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx);
      ctx.restore();
    },
    /** The section camera: a slow drift shared by every chorus 2 scene, so it carries straight through the inner cuts; at rest at the section's two ends. `d` adds a scene's own move. Zoom rises as needed to cover the corners. */
    camAt(T, d = {}) {
      const A = OM.smooth(OM.prog(T, 157.971 + 0.07, 158.8)) * (1 - OM.smooth(OM.prog(T, 192.35, 193.285 - 0.08)));
      const x = A * 22 * Math.sin(0.6 * T) + (d.x || 0), y = A * 12 * Math.sin(0.45 * T + 1) + (d.y || 0);
      const rot = A * 0.004 * Math.sin(0.37 * T) + (d.rot || 0);
      const zoom = (1 + A * 0.02) * (d.zoom || 1);
      const zmin = 1 + (2 * Math.abs(x)) / 1920 + (2 * Math.abs(y)) / 1080 + 1.8 * Math.abs(rot);
      return { zoom: Math.max(zoom, zmin), rot, x, y };
    },
    /**
     * Run a scene's post pass: its own move and effect amount eased to 0 at its window's ends, over the section camera.
     * `punch` is extra zoom for the scene's own hits (OM.c2.punch), applied unramped but exactly 0 in the cut holds.
     */
    apply(fx, T, start, end, { amount = 0, zoom = 1, rot = 0, x = 0, y = 0, p0, p1, ramp = 0.4, punch = 0 } = {}) {
      const e = OM.post.envelope(T, start, end, { ramp, hold: 0.07 });
      const hit = OM.c2.live(T, start, end) ? punch : 0;
      const cam = OM.c2.camAt(T, { zoom: (1 + (zoom - 1) * e) * (1 + hit), rot: rot * e, x: x * e, y: y * e });
      return fx.apply(T, { amount: amount * e, cam, p0, p1 });
    },
    /** True away from the cut frames, where extras may draw. */
    live: (T, start, end) => T > start + 0.07 && T < end - 0.07,
    /** The last measured beat at or before T (OM.T.beatsOn, on the drum): { i, t }, i = -1 before the first. */
    beat(T) {
      const B = (OM.T && OM.T.beatsOn) || [];
      let lo = 0, hi = B.length;
      while (lo < hi) {
        const m = (lo + hi) >> 1;
        if (B[m] <= T) lo = m + 1; else hi = m;
      }
      return { i: lo - 1, t: lo > 0 ? B[lo - 1] : -Infinity };
    },
    /** A camera punch on a scene's own hit at t0, the edit camera's shape: a 16 ms rise to 1 on t0, then a smooth settle to exactly 0 over `fall`. */
    punch(T, t0, fall = 0.22) {
      const d = T - t0;
      if (d < -0.016 || d >= fall) return 0;
      if (d < 0) return 0.5 - 0.5 * Math.cos((Math.PI * (d + 0.016)) / 0.016);
      const u = d / fall;
      return (1 - u) ** 3 * (1 + 3 * u);
    },
    sm: (T, a, b) => OM.smooth(OM.prog(T, a, b)),
    decay: (T, t0, half) => (T < t0 ? 0 : Math.pow(0.5, (T - t0) / half)),
    /**
     * Lay words `ks` (indices into OM.sung words) centred on (cx, cy): one row, or
     * split into up to `rows` balanced rows, at `cap` px cap height, shrunk to fit
     * `maxW` but never under `minCap`. Fewer rows win when they reach the full cap.
     * Returns { cap, px, place: { [k]: { x, base, w, row } }, rowsUsed }.
     */
    layout(words, { ks = null, weight = 800, cap = 100, maxW = 1600, cx = 960, cy = 540, rows = 2, lead = 1.7, minCap = 60 } = {}) {
      ks = ks || words.map((_, k) => k);
      m.font = FONT(weight, 100);
      const cap100 = m.measureText('H').actualBoundingBoxAscent || 73;
      const sp = m.measureText(' ').width;
      const wd = ks.map((k) => m.measureText(words[k].text || 'MMM').width);
      const want = (cap / cap100) * 100;
      let best = null;
      const consider = (cuts) => {
        const groups = [];
        let a = 0;
        for (const b of [...cuts, ks.length]) { groups.push([a, b]); a = b; }
        const widths = groups.map(([a, b]) => {
          let s = 0;
          for (let i = a; i < b; i++) s += wd[i] + (i > a && words[ks[i]].space ? sp : 0);
          return s;
        });
        const px = Math.min(want, (maxW / Math.max(...widths)) * 100);
        const score = Math.min(px, want) - groups.length * 0.01;
        if (!best || score > best.score) best = { score, px, groups };
      };
      const n = ks.length;
      consider([]);
      if (rows >= 2) for (let i = 1; i < n; i++) consider([i]);
      if (rows >= 3) for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) consider([i, j]);
      const px = Math.max(best.px, (minCap / cap100) * 100);
      const f = px / 100, capPx = cap100 * f, pitch = lead * capPx, R = best.groups.length;
      const place = {};
      best.groups.forEach(([a, b], r) => {
        let full = 0;
        for (let i = a; i < b; i++) full += (wd[i] + (i > a && words[ks[i]].space ? sp : 0)) * f;
        let x = cx - full / 2;
        const base = cy - ((R - 1) * pitch) / 2 + r * pitch + capPx / 2;
        for (let i = a; i < b; i++) {
          if (i > a && words[ks[i]].space) x += sp * f;
          place[ks[i]] = { x, base, w: wd[i] * f, row: r };
          x += wd[i] * f;
        }
      });
      return { cap: capPx, px, place, rowsUsed: R, weight };
    },
    /**
     * Rasterize `text` set at (x, base) in `px` JetBrains Mono into cells of
     * cw x ch on a grid anchored at (ox, oy): [{ i, j, x, y, l }] with x, y the
     * cell's top-left and l the letter index.
     */
    raster(text, x, base, px, weight, cw, ch = cw, ox = 0, oy = 0, cover = 0.45) {
      if (!text) return [];
      m.font = FONT(weight, px);
      const adv = m.measureText(text).width / text.length;
      const i0 = Math.floor((x - px * 0.1 - ox) / cw), i1 = Math.ceil((x + adv * text.length + px * 0.1 - ox) / cw);
      const j0 = Math.floor((base - px * 0.95 - oy) / ch), j1 = Math.ceil((base + px * 0.3 - oy) / ch);
      const S = 4, W = (i1 - i0) * S, H = (j1 - j0) * S;
      const cnv = document.createElement('canvas');
      cnv.width = W;
      cnv.height = H;
      const g = cnv.getContext('2d', { willReadFrequently: true });
      g.setTransform(S / cw, 0, 0, S / ch, -((ox + i0 * cw) * S) / cw, -((oy + j0 * ch) * S) / ch);
      g.font = FONT(weight, px);
      g.fillStyle = '#fff';
      g.fillText(text, x, base);
      const d = g.getImageData(0, 0, W, H).data;
      const out = [];
      for (let j = 0; j < j1 - j0; j++)
        for (let i = 0; i < i1 - i0; i++) {
          let s = 0;
          for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) s += d[((j * S + yy) * W + i * S + xx) * 4 + 3];
          if (s < cover * S * S * 255) continue;
          const cx = ox + (i0 + i) * cw, cy = oy + (j0 + j) * ch;
          out.push({ i: i0 + i, j: j0 + j, x: cx, y: cy, l: OM.clamp(Math.floor((cx + cw / 2 - x) / adv), 0, text.length - 1) });
        }
      return out;
    },
  };

  const W = 800;
  OM.c2.ready('c2-01', W);
  const { pool, sm, decay } = OM.c2;

  const FX = `vec4 effect(vec2 uv) {
    vec2 p = cam(uv);
    if (uAmount <= 0.0) return src(p);
    // Glass refraction: the picture bends along the shard edges, with caustic sparkle riding them.
    vec2 px = 2.0 / uRes;
    vec3 L = vec3(0.3, 0.59, 0.11);
    vec2 g = vec2(dot(src(p + vec2(px.x, 0.0)).rgb - src(p - vec2(px.x, 0.0)).rgb, L), dot(src(p + vec2(0.0, px.y)).rgb - src(p - vec2(0.0, px.y)).rgb, L));
    float edge = clamp(length(g) * 4.0, 0.0, 1.0);
    vec4 c = src(p + g * uAmount * 0.0025);
    float sp = step(0.993, hash(floor(p * uRes / 6.0) + floor(uTime * 10.0)));
    c.rgb += vec3(0.855, 0.925, 0.776) * sp * edge * uAmount;
    return c;
  }`;

  OM.scene({
    id: 'c2-01',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const END = start + duration;
      const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
      const words = OM.sung('c2-01');
      const on = words.map((w) => w.t0);
      const K = words.length - 1; // the key word: the biggest shards, closing the pane
      const SNARES = [159.596, 160.226, 160.786]; // measured snare onsets
      const DB2 = OM.beatOnset(OM.downbeatsIn(161, 161.5)[0] || 161.239); // the downbeat's drum onset
      const LATE = [160.226, 160.786, 160.886, 161.258]; // the late slivers' hits, measured
      const PX = 320, PY = 140, PW = 1280, PH = 800, CS = 9; // the film's letter cells: 8px on a 9px pitch

      // ---- the shards: a jittered 16x10 mesh over the pane, each quad cut on a random diagonal ----
      const NX = 16, NY = 10, rng = OM.rng(0xc201);
      const V = [];
      for (let b = 0; b <= NY; b++)
        for (let a = 0; a <= NX; a++) {
          const edge = a === 0 || b === 0 || a === NX || b === NY;
          const jx = edge && (a === 0 || a === NX) ? 0 : (rng() - 0.5) * 0.7 * (PW / NX);
          const jy = edge && (b === 0 || b === NY) ? 0 : (rng() - 0.5) * 0.7 * (PH / NY);
          V.push([PX + (a * PW) / NX + jx, PY + (b * PH) / NY + jy]);
        }
      const v = (a, b) => V[b * (NX + 1) + a];
      const tris = [];
      for (let b = 0; b < NY; b++)
        for (let a = 0; a < NX; a++) {
          const [p, q, r, s] = [v(a, b), v(a + 1, b), v(a + 1, b + 1), v(a, b + 1)];
          const pair = rng() < 0.5 ? [[p, q, r], [p, r, s]] : [[p, q, s], [q, r, s]];
          for (const pts of pair) {
            const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
            const ang = Math.atan2(cy - 540, cx - 960) + (rng() - 0.5) * 0.9;
            tris.push({ pts, cx, cy, qa: a, qb: b, dx: Math.cos(ang), dy: Math.sin(ang), D: 700 + 700 * rng(), rot: (rng() - 0.5) * 6, S0: 1.6 + 1.6 * rng(), cells: [], d: Math.hypot((cx - 960) / 640, (cy - 540) / 400) });
          }
        }
      const inTri = (x, y, [[ax, ay], [bx, by], [cx, cy]]) => {
        const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by);
        const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy);
        const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
        return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
      };

      // ---- engrave: the words rasterized into CS cells, each cell riding the shard it falls in ----
      const get = OM.c2.lazy(W, () => {
        tris.forEach((t) => (t.cells = []));
        const row = OM.c2.layout(words, { ks: words.map((_, k) => k).filter((k) => k !== K), weight: W, cap: 80, maxW: 1100, cy: 360, rows: 2, lead: 1.5 });
        const key = OM.c2.layout(words, { ks: [K], weight: W, cap: 150, maxW: 1120, cy: row.rowsUsed > 1 ? 690 : 640, rows: 1 });
        const counts = tris.map(() => new Map());
        words.forEach((wd, k) => {
          const L = k === K ? key : row, p = L.place[k];
          if (!p) return;
          for (const cl of OM.c2.raster(wd.text, p.x, p.base, L.px, W, CS)) {
            const x = cl.x + CS / 2, y = cl.y + CS / 2;
            const qa = Math.floor(((x - PX) / PW) * NX), qb = Math.floor(((y - PY) / PH) * NY);
            const t = tris.find((t) => Math.abs(t.qa - qa) <= 1 && Math.abs(t.qb - qb) <= 1 && inTri(x, y, t.pts));
            if (!t) continue;
            const n = tris.indexOf(t);
            t.cells.push([cl.x, cl.y, k, OM.hash(cl.i, cl.j, 7)]);
            counts[n].set(k, (counts[n].get(k) || 0) + 1);
          }
        });
        // Landing times: a word's shards on its onset; plain glass from the rim inward, the last of it with the key word.
        const t0 = start + 0.2, t1 = on[K] - 0.08;
        tris.forEach((t, n) => {
          let kBest = -1, nBest = 0;
          for (const [k, cnt] of counts[n]) if (cnt > nBest) { nBest = cnt; kBest = k; }
          t.k = kBest;
          t.land = kBest >= 0 ? on[kBest] : OM.lerp(t0, t1, OM.clamp(1 - t.d / 1.2) * 0.85 + 0.15 * OM.hash(n, 3, 9));
          t.fly = Math.max(0.001, Math.min(t.k === K ? 0.38 : 0.3, t.land - start));
          t.seal = SNARES[t.d < 0.45 ? 0 : t.d < 0.8 ? 1 : 2];
        });
        return { centers: words.map((_, k) => { const L = k === K ? key : row, p = L.place[k]; return p ? [p.x + p.w / 2, p.base - L.cap / 2] : [960, 540]; }) };
      });

      return {
        draw(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.05) return OM.handoff('glow', ctx, T, dpr);
          if (T > END - 0.07) return OM.handoff('screen', ctx, T, dpr);
          const lay = get();

          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const glowA = 0.5 * (1 - sm(T, DB2, DB2 + 0.36)) + 0.12 * decay(T, on[K], 0.15);
          pool(ctx, 960, 540, 620, 620, ink.lit, glowA);

          const heal = sm(T, SNARES[2], DB2 + 0.3); // glass to the screen's dark face
          const fade = OM.prog(T, SNARES[2], DB2); // the engraving clears in dither order
          const slam = decay(T, on[K], 0.09);
          const glass = OM.mix(th.surface, th.bg, heal);
          for (const s of tris) {
            const u = OM.prog(T, s.land - s.fly, s.land);
            if (u <= 0) continue;
            const e = 1 - OM.ease.inCubic(u); // shards accelerate into place and stop dead
            const land = decay(T, s.land, 0.1);
            ctx.save();
            ctx.globalAlpha = OM.clamp(u * 3);
            ctx.translate(s.cx + s.dx * s.D * e, s.cy + s.dy * s.D * e);
            ctx.rotate(s.rot * e);
            const sc = 1 + (s.S0 - 1) * e;
            ctx.scale(sc, sc);
            ctx.translate(-s.cx, -s.cy);
            ctx.beginPath();
            ctx.moveTo(s.pts[0][0], s.pts[0][1]);
            ctx.lineTo(s.pts[1][0], s.pts[1][1]);
            ctx.lineTo(s.pts[2][0], s.pts[2][1]);
            ctx.closePath();
            ctx.fillStyle = OM.c2.rgba(glass, 0.86 + 0.14 * heal);
            ctx.fill();
            if (land > 0.02 || slam > 0.02) {
              ctx.fillStyle = OM.c2.rgba(ink.hover, 0.3 * Math.max(land, slam * 0.6));
              ctx.fill();
            }
            // The crack along its edges: bright in flight, a hairline once home, sealed on its snare.
            const sealP = OM.prog(T, s.seal, s.seal + 0.14);
            const crack = u < 1 ? 0.8 : (0.45 + 0.5 * Math.max(land, slam)) * (1 - sealP) + 0.9 * decay(T, s.seal, 0.08) * (T >= s.seal ? 1 : 0);
            if (crack > 0.02) {
              ctx.strokeStyle = OM.c2.rgba(sealP > 0 && sealP < 1 ? ink.crest : ink.hover, Math.min(1, crack));
              ctx.lineWidth = 1.2 / sc;
              ctx.stroke();
            }
            // The engraving it carries.
            for (const [x, y, k, h] of s.cells) {
              if (T < on[k] || h < fade) continue;
              const age = T - on[k];
              ctx.fillStyle = age < 0.08 || (k === K && slam > 0.4) ? ink.crest : k === K ? (age < 0.3 ? ink.hover : ink.crest) : age < 0.25 ? ink.crest : ink.hover;
              ctx.fillRect(x, y, CS - 1, CS - 1);
            }
            ctx.restore();
          }
          // The chime: a ring out of each word as its shards slam home.
          words.forEach((_, k) => {
            const a = T - on[k];
            if (a < 0 || a > 0.45) return;
            const [x, y] = lay.centers[k];
            ctx.strokeStyle = OM.c2.rgba(ink.crest, 0.7 * (1 - a / 0.45));
            ctx.lineWidth = k === K ? 3 : 2;
            ctx.beginPath();
            ctx.arc(x, y, (k === K ? 120 : 50) + a * (k === K ? 1500 : 700), 0, 6.283);
            ctx.stroke();
          });
          // On the downbeat the healed pane's frame comes on: the screen.
          const rim = sm(T, DB2, DB2 + 0.2);
          if (rim > 0) {
            ctx.strokeStyle = OM.c2.rgba(ink.mid, rim);
            ctx.lineWidth = 2;
            ctx.strokeRect(321, 141, 1278, 798);
          }
        },
        render(t, T) {
          this.draw(t, T);
          const ctx = c.ensure();
          if (OM.c2.live(T, start, END)) {
            // Late slivers (s160.23, s160.79, k160.89, s161.26, measured): the last crumbs of glass fly home onto the pane's rim, outside the words, and the rim glows where each lands.
            // Rim ring: as the slivers land, the pane's whole rim rings in light, a band around the words, never over them.
            {
              let ring = 0;
              for (const h of LATE) if (T >= h && T < h + 0.3) ring = Math.max(ring, 1 - (T - h) / 0.3);
              if (ring > 0) {
                ctx.strokeStyle = OM.c2.rgba(ink.lit, 0.4 * ring);
                ctx.lineWidth = 40;
                ctx.strokeRect(320 - 12, 140 - 12, 1280 + 24, 800 + 24);
                ctx.strokeStyle = OM.c2.rgba(ink.crest, ring);
                ctx.lineWidth = 8;
                ctx.strokeRect(320 - 4, 140 - 4, 1280 + 8, 800 + 8);
              }
            }
            LATE.forEach((h, hi) => {
              const u = OM.prog(T, h - 0.2, h), a = T - h;
              if (u <= 0 || a > 0.25) return;
              for (let n = 0; n < 6; n++) {
                const side = (n + hi) % 4, f = OM.hash(n, hi, 81);
                const tx = side === 0 ? 320 + 1280 * f : side === 2 ? 320 + 1280 * f : side === 1 ? 1600 : 320;
                const ty = side === 1 || side === 3 ? 140 + 800 * f : side === 0 ? 140 : 940;
                const ox = tx + (tx - 960) * 0.9 * (1 - OM.ease.inCubic(u)), oy = ty + (ty - 540) * 0.9 * (1 - OM.ease.inCubic(u));
                const al = a < 0 ? OM.clamp(u * 3) : 1 - a / 0.25;
                ctx.fillStyle = OM.c2.rgba(a < 0 ? ink.hover : ink.crest, al);
                ctx.beginPath();
                ctx.moveTo(ox, oy - 26);
                ctx.lineTo(ox + 24, oy + 18);
                ctx.lineTo(ox - 21, oy + 15);
                ctx.fill();
                if (a >= 0) pool(ctx, tx, ty, 140, 140, ink.lit, 0.45 * (1 - a / 0.25));
              }
            });
          // Glass glints: four-point stars flaring on the mesh's joints once the pane is whole.
          if (T > on[0] + 0.1 && T < DB2) {
            for (let n = 0; n < 22; n++) {
              const slot = Math.floor(T * 5 + n * 0.37), vi = Math.floor(OM.hash(n, slot, 21) * V.length), [x, y] = V[vi];
              const f = (T * 5 + n * 0.37) % 1, a = Math.sin(Math.PI * f) * (1 - sm(T, SNARES[2], DB2));
              if (OM.hash(slot, n, 22) < 0.5 || a < 0.05) continue;
              const r = 4 + 9 * a;
              ctx.fillStyle = OM.c2.rgba(ink.crest, a);
              ctx.fillRect(x - r, y - 1, 2 * r, 2);
              ctx.fillRect(x - 1, y - r, 2, 2 * r);
            }
          }
          }
          // Slow-motion pull-out as the shards fly home, locking with a punch on the key word: the scene's biggest hit.
          const amount = 0.12 + 0.5 * (1 - sm(T, on[K] + 0.1, on[K] + 0.6));
          const zoom = 1 + 0.07 * (1 - OM.smooth(OM.prog(T, start, on[K])));
          OM.c2.apply(fx, T, start, END, { amount, zoom, punch: 0.05 * OM.c2.punch(T, on[K], 0.26) });
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
