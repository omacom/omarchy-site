// p2-02 · Lines become walls. The crest line from p2-01 opens into a floor
// plan's grid, and on each onset a pen draws a word onto the plan as outline
// lines. On the key word the floor tilts into a 3D view and, on the downbeat,
// every line (the words and the rail) rises into walls, overshooting on the
// kick. Then the walls sink, the floor flattens, and the plan's grid is left.
OM.ownWords.add('p2-02');
// Edit camera: the defaults fit. The downbeat punch (152.684) lands with the key word as the floor
// tilts and the walls rise, the 153.216 snare's jolt with the rail's flash, and the scene's own
// camera follows the tilt with no drum hits of its own to stack on.
OM.edit.plan('p2-02', {});
OM.scene({
  id: 'p2-02',
  build(el, { start, duration }) {
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    // Ambient occlusion: wall feet darken where they meet the floor, and the floor darkens at the walls.
    const fx = OM.post(el, c, {
      effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec3 c = src(q).rgb;
  if (uAmount <= 0.0) return vec4(c, 1.0);
  vec2 px = 1.0 / uRes * (uRes.y / 1080.0);
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  float below = 0.0, near = 0.0;
  for (int i = 1; i <= 6; i++) {
    float f = float(i) * 6.0;
    below += step(dot(src(q - vec2(0.0, f) * px).rgb, vec3(0.3, 0.59, 0.11)), 0.12);
    near += dot(src(q + vec2(0.0, f) * px).rgb, vec3(0.3, 0.59, 0.11)) + dot(src(q + vec2(f, 0.0) * px).rgb, vec3(0.3, 0.59, 0.11)) * 0.5;
  }
  below /= 6.0; near /= 9.0;
  float wall = step(0.12, l) * (1.0 - smoothstep(0.62, 0.75, l));
  float ao = wall * below * 0.45 + (1.0 - wall) * clamp(near * 1.4, 0.0, 1.0) * 0.6;
  return vec4(c * (1.0 - uAmount * uP0.x * ao), 1.0);
}`,
    });
    const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
    const L = OM.HOME, P = OM.p2;
    const END = start + duration;
    const h = OM.cellAt(L, 960, 540);
    const YL = L.y0 + h.row * L.ch, YC = YL + L.ch / 2;
    // The downbeat's drum onset (the grid runs late), and the kick and snare on their measured onsets.
    const DB = OM.beatOnset(152.741), KICK = P.drum('kick', 152.834), SNARE = P.drum('snare', 153.228), SINK = 153.5, FLAT = 153.86;
    // The walls rise with the key word, which the voice lands on the downbeat's drum (22 ms after it).
    const keyOn = OM.words('p2-02').slice(-1)[0];
    const RISE = Math.max(DB, keyOn ?? DB);
    // The reading moment: after the kick the floor turns to face front with a short extrusion.
    const FRONT = 152.9, FACED = 153.02;
    const faceAt = (T) => OM.ease.inOutCubic(OM.prog(T, FRONT, FACED));
    const S = 2; // offscreen outline resolution (crisp at 4K)

    let lay = null;
    const layout = () => {
      const ws = P.words('p2-02');
      const half = Math.ceil(ws.length / 2);
      const rows = [ws.slice(0, half), ws.slice(half)];
      const gapE = 0.55; // word gap, in ems
      const rowW = (r) => r.reduce((a, w) => a + w.w100 / 100, 0) + gapE * Math.max(0, r.length - 1);
      const s = Math.min(170, 1700 / Math.max(0.01, ...rows.map(rowW)));
      const cap = s * P.CAP;
      const base = [YL - 46, YL + L.ch + 46 + cap];
      const items = [];
      rows.forEach((r, ri) => {
        let x = 960 - (rowW(r) * s) / 2;
        for (const w of r) {
          const tw = (w.w100 * s) / 100;
          if (w.text) items.push({ ...w, x, y: base[ri], tw, cap, s });
          x += tw + gapE * s;
        }
      });
      // Each word's outline, pre-stroked in the inks the walls are built from.
      for (const it of items) {
        const pad = 16, W = it.tw + 2 * pad, H = it.cap * 1.45 + 2 * pad;
        it.ox = it.x - pad;
        it.oy = it.y - it.cap - pad;
        it.ow = W;
        it.oh = H;
        it.img = {};
        for (const [key, col] of [['dim', ink.dim], ['mid', ink.mid], ['lit', ink.lit], ['crest', ink.crest]]) {
          const o = document.createElement('canvas');
          o.width = Math.ceil(W * S);
          o.height = Math.ceil(H * S);
          const x = o.getContext('2d');
          x.scale(S, S);
          x.font = P.font(it.s);
          x.lineJoin = 'miter';
          x.lineWidth = Math.max(3, it.s * 0.032);
          x.strokeStyle = col;
          x.strokeText(it.text, pad, pad + it.cap);
          it.img[key] = o;
        }
      }
      return { ok: P.ready(), items };
    };

    const tiltAt = (T) => OM.ease.outExpo(OM.prog(T, lay.items.length ? lay.items[lay.items.length - 1].t0 : RISE, RISE + 0.12)) * (1 - OM.ease.inOutCubic(OM.prog(T, SINK + 0.06, FLAT)));
    const wallAt = (T) =>
      (78 * OM.ease.outBack(OM.prog(T, RISE, KICK), 2.2) + 14 * Math.exp(-Math.max(0, T - KICK) / 0.08) * (T >= KICK ? 1 : 0)) *
      (1 - OM.ease.inOutCubic(OM.prog(T, SINK, FLAT - 0.08)));

    return {
      render(t, T) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (P.cut(ctx, T, dpr, start, END, 'line', P.planMap)) return void fx.apply(T, {});
        if (!lay || (!lay.ok && P.ready())) lay = layout();
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);

        const fr = faceAt(T);
        const u = tiltAt(T) * (1 - 0.82 * fr);
        const Hw = Math.max(0, wallAt(T)) * (1 - 0.72 * fr);
        const cyk = 1 - 0.4 * u, ks = -(0.3 + 0.05 * Math.sin((T - DB) * 1.4)) * u;
        const lift = 0.5 * Hw * u + 30 * u;
        // Plan -> screen: x' = x + ks (y - YC), y' = YC + cyk (y - YC) - height + lift.
        const at = (height) => ctx.setTransform(dpr, 0, dpr * ks, dpr * cyk, dpr * -ks * YC, dpr * (YC - cyk * YC - height + lift));
        const fade = 1 - OM.prog(T, SINK + 0.1, FLAT - 0.04);

        // The plan's grid, opening out of the line before the first word.
        at(0);
        const spread = 100 * OM.ease.outCubic(OM.prog(T, start + 0.05, lay.items.length ? lay.items[0].t0 + 0.05 : start + 0.3));
        const glow = OM.prog(T, start + 0.05, start + 0.3) * (1 - OM.prog(T, SINK, FLAT - 0.05));
        ctx.fillStyle = OM.mix(th['border-subtle'], th['border-strong'], 0.6 * glow);
        const snap = (v) => Math.round(v * dpr) / dpr;
        const yTop = L.y0 + (h.row - spread) * L.ch, yBot = L.y0 + (h.row + 1 + spread) * L.ch;
        for (let col = L.cMin - 40; col <= L.cMin + L.cols + 40; col++) ctx.fillRect(snap(L.x0 + col * L.cw), yTop, 1, yBot - yTop);
        for (let row = Math.floor(h.row - spread); row <= h.row + 1 + spread; row++) ctx.fillRect(-900, snap(L.y0 + row * L.ch), 3720, 1);

        // Plan to map: as the walls sink, they spread out over the plan as the city's lots, row by row from the rail.
        if (T >= 153.68) {
          for (let row = L.rMin; row < L.rMin + L.rows; row++) {
            const ar = 153.68 + (Math.abs(row - h.row) / 40) * 0.24;
            if (T < ar) continue;
            for (let col = L.cMin; col < L.cMin + L.cols; col++) {
              if (!P.lot(col, row)) continue;
              const age = T - ar - OM.hash(col, row, 13) * 0.05;
              if (age < 0) continue;
              ctx.fillStyle = age < 0.05 ? ink.mid : ink.dim;
              P.block(ctx, col, row);
            }
          }
        }

        // The walls: every line stacked up in layers, dim at the floor, mid up the face, crest on top.
        const step = 1.5;
        const n = Math.ceil(Hw / step);
        const pen = (it, hh, key, a) => {
          at(hh);
          ctx.globalAlpha = a;
          ctx.drawImage(it.img[key], it.ox, it.oy, it.ow, it.oh);
        };
        const snapHit = T >= SNARE ? Math.exp(-(T - SNARE) / 0.12) : 0;
        for (let i = 0; i <= n; i++) {
          const hh = Math.min(Hw, i * step), top = i === n;
          const key = top ? 'crest' : hh < Hw * 0.45 ? 'dim' : 'mid';
          at(hh);
          ctx.globalAlpha = 1; // the rail stays: it becomes the city's avenue
          ctx.fillStyle = top ? ink.crest : snapHit > 0.3 && key === 'mid' ? ink.lit : ink[key]; // the rail flashes on the snare
          // The rail line rises with the words.
          ctx.fillRect(-900, YL, 3720, L.ch);
          ctx.globalAlpha = fade;
          for (const it of lay.items) {
            const age = T - it.t0;
            if (age < 0) continue;
            if (n === 0) {
              // Flat: the pen draws the word, left to right, on its onset.
              const p = OM.ease.outExpo(OM.prog(age, 0, 0.2));
              ctx.save();
              ctx.beginPath();
              ctx.rect(it.ox - 4, it.oy - 4, 8 + it.ow * p, it.oh + 8);
              ctx.clip();
              pen(it, 0, 'lit', fade);
              pen(it, 0, 'crest', Math.exp(-age / 0.18) * fade);
              ctx.restore();
              if (p < 0.995) {
                at(0);
                ctx.globalAlpha = fade;
                ctx.fillStyle = ink.crest;
                ctx.fillRect(it.ox + it.ow * p - 7, it.y - it.cap / 2 - 7, 14, 14);
              }
            } else pen(it, hh, key, fade);
          }
        }
        ctx.globalAlpha = 1;

        // Construction dust: puffs kicked up off the wall feet as they rise, settling as they sink.
        const scr = (x, y) => [x + ks * (y - YC), YC + cyk * (y - YC) + lift];
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const bases = [[0, 1920, YL + L.ch], ...lay.items.map((it) => [it.x, it.x + it.tw, it.y])];
        for (let i = 0; i < 90; i++) {
          const born = RISE + OM.hash(i, 3, 2) * 0.25 + (i % 2 ? 0 : SINK - RISE), age = T - born;
          if (age < 0 || age > 0.8) continue;
          const b = bases[i % bases.length];
          const [x, y] = scr(OM.lerp(b[0], b[1], OM.hash(i, 4, 2)), b[2]);
          const dx = (OM.hash(i, 5, 2) - 0.5) * 160 * age, dy = -(40 + 90 * OM.hash(i, 6, 2)) * age + 60 * age * age;
          const s = 3 + 6 * OM.hash(i, 7, 2);
          ctx.globalAlpha = (1 - age / 0.8) * 0.8 * fade;
          ctx.fillStyle = i % 4 ? ink.mid : ink.hover;
          ctx.fillRect(x + dx - s / 2, y + dy - s / 2, s, s);
        }
        ctx.globalAlpha = 1;

        // Camera: rises with the walls, from plan view into a perspective push.
        const env = OM.post.envelope(T, start, END, { ramp: 0.35 });
        const e2 = env * (0.25 + 0.75 * u);
        fx.apply(T, {
          amount: env * OM.clamp(0.3 + Hw / 78) * (1 - 0.7 * fr),
          cam: { zoom: 1 + 0.07 * e2, rot: -0.012 * e2, y: 26 * e2 },
          p0: [OM.clamp(Hw / 78), 0, 0, 0],
        });
      },
      release: () => { fx.release(); c.release(); },
    };
  },
});
