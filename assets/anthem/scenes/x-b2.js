// x-b2 · Time tunnel. The camera flies down the lattice tunnel that opened out
// of x-b1's vortex, and every line sung so far streams past it in order, set
// in JetBrains Mono, with the film's motifs riding among them. The speed
// doubles every bar and lunges on each downbeat; the kicks punch the lens and
// the hi-hat roll shimmers the rings. On the last downbeat everything goes
// crest, and on the snare roll the whole tunnel, words and all, is squeezed
// step by step into one point: the spark the final chorus drops from.
//
// Edit camera: the scene's own camera lunges on every downbeat (3.5%, 6% on the last) and its lens
// punches on every strong kick (focal), so the camera's downbeat punches (235.876, 238.008, 240.142,
// 242.274) and its off-beat kick punches (the rest of the list) would stack on those and are skipped.
// Its beat-3 punches and backbeat jolts stay, and the 233.748 punch lands the cut on the drum ahead
// of the scene's cut-locked lunge. The build into chorus 3 (241.207 -> 243.344, c3-01's) runs over the
// squeeze. The lines keep their own layout (a function of T alone): under both cameras every line that
// reads stays at least 58 px inside the frame, clear of the border band, so the plan needs no cap.
OM.edit.plan('x-b2', { skip: [235.876, 238.008, 240.142, 242.274, 235.614, 239.34, 240.014, 240.416, 241.086, 242.67] });
(() => {
  const FONT = "700 100px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['x-b2-type'] = document.fonts.load(FONT);

  OM.scene({
    id: 'x-b2',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Light speed: radial streaks toward the vanishing point, max-blended so the
      // lines stay crisp, and a polar twist that only bends the far centre.
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
          vec2 R = vec2(1920.0, 1080.0), px = uv * R, d = px - uP0.xy;
          float r = length(d), a = uAmount * uP0.z * exp(-r / 260.0);
          d = mat2(cos(a), -sin(a), sin(a), cos(a)) * d;
          vec2 q = (uP0.xy + d) / R;
          vec4 base = src(cam(q));
          vec2 sp = cam(uv) * R; // ease the streaks off the front line's box (uP1, px, y up)
          float clear = clamp(max(max(uP1.x - sp.x, sp.x - uP1.z), max(uP1.y - sp.y, sp.y - uP1.w)) / 30.0, 0.0, 1.0);
          vec3 s = vec3(0.0);
          for (int i = 1; i <= 10; i++) s += src(cam((uP0.xy + d * (1.0 - uP0.w * float(i) / 10.0)) / R)).rgb;
          s /= 10.0;
          return vec4(max(base.rgb, s * 0.75 * uAmount * clear), 1.0); // ghosts stay dimmer than the crisp lines
        }`,
      });
      // Star streaks: points in the tunnel volume, each drawn from where it was a moment ago.
      const STARS = Array.from({ length: 140 }, (_, n) => ({ x: (OM.hash(n, 1, 11) - 0.5) * 2.6, y: (OM.hash(n, 2, 11) - 0.5) * 1.5, z: OM.hash(n, 3, 11) * 10 }));
      const stars = (ctx, T, F, k, sq) => {
        const z = Zc(T), z0 = Zc(T - 0.035);
        ctx.lineCap = 'square';
        for (const s of STARS) {
          if (Math.abs(s.x) < 0.25 && Math.abs(s.y) < 0.15) continue;
          const d = ((s.z - z * 1.4) % 10 + 10) % 10 + 0.2;
          const dp = d + (z - z0) * 1.4;
          if (dp > 10.2) continue;
          const x1 = C.x + ((s.x * F) / d) * k, y1 = C.y + ((s.y * F) / d) * k;
          const x0 = C.x + ((s.x * F) / dp) * k, y0 = C.y + ((s.y * F) / dp) * k;
          const f = OM.clamp((10 - d) / 5) * Math.pow(1 - sq, 2); // gone before the spark
          if (f <= 0.01) continue;
          ctx.strokeStyle = OM.mix(ink.bg, d < 2.5 || sq > 0.3 ? ink.crest : ink.mid, f);
          ctx.lineWidth = Math.max(1, 3.2 / d);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
      };
      const L = OM.HOME;
      const ink = OM.fieldInks('tokyo-night');
      const { C, MW, MH, motifs, Zc, focal, rings, frame, DOWN, camAt, onDrum } = OM.xb;
      const END = start + duration;
      const SNARES = [233.895, 235.357, 236.402, 237.610, 238.097, 239.746, 240.094, 240.234, 240.628, 240.768, 242.091].map((t) => onDrum(t, 'snare'));
      // The squeeze: nothing until the last downbeat, then a step on each snare of the roll.
      // Tunnel collapse: steps in on the 242.486 snare, then from the 242.881 snare
      // the whole tunnel implodes, accelerating, onto the point by the 243.020
      // snare (the strongest hit before the drop), where it bursts out once.
      // Each on the snare as measured on the song (the first is struck at 242.524).
      const [S1, S2, HIT] = [242.486, 242.881, 243.020].map((t) => onDrum(t, 'snare'));
      const SQ = [[DOWN[4], 0], [S1, 0.3], [S2, 0.55]];
      const squeeze = (T) => {
        if (T >= S2) return OM.lerp(0.55, 1, OM.ease.inCubic(OM.prog(T, S2, HIT)));
        for (let i = SQ.length - 1; i >= 0; i--) if (T >= SQ[i][0]) {
          const n = SQ[i + 1];
          return n ? OM.lerp(SQ[i][1], n[1], OM.ease.outExpo(OM.prog(T, SQ[i][0], SQ[i][0] + Math.min(0.12, n[0] - SQ[i][0])))) : 1;
        }
        return 0;
      };
      // Every line sung before the build, in order, each at its own depth along the tunnel.
      const ids = OM.T.lines.filter((l) => l.end <= start).map((l) => l.id);
      const Z0 = 9, GAP = 1; // one ring per line; the first enters the far plane (8) after the seam
      const items = ids.map((id, i) => {
        return { id, z: Z0 + i * GAP, x: 0, y: i % 2 ? 0.42 : -0.42 };
      });
      // The motifs ride between the lines, wide of the axis.
      const props = [0, 1, 2, 3, 4].map((i) => {
        const a = i * 2.6 + 2.2;
        return { i, z: Z0 + (4 + i * 8.5) * GAP + GAP / 2, x: 0.72 * Math.cos(a), y: 0.42 * Math.sin(a) };
      });
      let texts = null, front = null; // front: the nearest readable line's box, kept clear of the streaks
      const measure = () => {
        const m = document.createElement('canvas').getContext('2d');
        m.font = FONT;
        return {
          ok: document.fonts.check(FONT),
          list: ids.map((id) => {
            const s = OM.sung(id).map((w) => (w.space ? ' ' : '') + w.text).join('').toUpperCase();
            return { s, w: m.measureText(s).width / 100 };
          }),
        };
      };

      // The burst: the spark already sits at the centre while the tunnel's ring
      // fragments blow back out past the frame, tumbling, gone before the cut.
      const FRAGS = Array.from({ length: 260 }, (_, n) => {
        const ring = n % 6, u = OM.hash(n, 1, 21), side = Math.floor(u * 4), v = (u * 4) % 1;
        const ex = side < 2 ? v * 2 - 1 : side === 2 ? 1 : -1, ey = side < 2 ? (side ? 1 : -1) : v * 2 - 1;
        return { x: ex * 1.06, y: ey * 0.6, sp: (0.55 + 0.9 * OM.hash(n, 2, 21)) * (1 + 0.35 * ring), len: 0.04 + 0.08 * OM.hash(n, 3, 21), spin: (OM.hash(n, 4, 21) - 0.5) * 9, horiz: side < 2 };
      });
      const burst = (ctx, T, dpr) => {
        OM.handoff('spark', ctx, T, dpr);
        const age = T - HIT, u = OM.prog(age, 0, END - 0.1 - HIT);
        const [r, g, b] = OM.rgb(ink.lit);
        const fl = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, 900);
        fl.addColorStop(0, `rgba(${r},${g},${b},${0.55 * (1 - u)})`);
        fl.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = fl;
        ctx.fillRect(0, 0, 1920, 1080);
        const R = 1500 * OM.ease.outExpo(OM.prog(age, 0, 0.12)) + 600 * age;
        ctx.globalAlpha = Math.pow(1 - u, 1.5);
        ctx.lineCap = 'square';
        for (const f of FRAGS) {
          const x = C.x + f.x * R * f.sp * 0.6, y = C.y + f.y * R * f.sp * 0.6;
          const a = f.spin * age + (f.horiz ? 0 : Math.PI / 2), l = f.len * 900 * (1 - 0.5 * u);
          ctx.strokeStyle = f.sp > 1.3 ? ink.crest : f.sp > 0.9 ? ink.hover : ink.lit;
          ctx.lineWidth = L.ch * (f.sp > 1.3 ? 1 : 0.6);
          ctx.beginPath();
          ctx.moveTo(x - (Math.cos(a) * l) / 2, y - (Math.sin(a) * l) / 2);
          ctx.lineTo(x + (Math.cos(a) * l) / 2, y + (Math.sin(a) * l) / 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };
      const draw = (t, T) => {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + 0.1) return frame(ctx, T, dpr);
          if (T >= END - 0.1) return OM.handoff('spark', ctx, T, dpr);
          if (T >= HIT) return burst(ctx, T, dpr);
          if (!texts || (!texts.ok && document.fonts.check(FONT))) texts = measure();
          const sq = squeeze(T), k = 1 - sq;
          const drop = OM.pulse(DOWN.filter((d) => d <= T), T, 0.18) * (T >= DOWN[4] ? 1.6 : 0.6);
          const snare = OM.pulse(SNARES.filter((s) => s <= T), T, 0.1);
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          rings(ctx, dpr, T, { squeeze: sq, flash: OM.clamp(drop + 0.35 * snare) });

          const z = Zc(T), F = focal(T);
          stars(ctx, T, F, k, sq);
          // The camera's crop, so a line held "in frame" stays in the shown frame.
          const cm = camAt(T), mx = 40 + (cm.zoom - 1) * 960 + Math.abs(cm.rot) * 560, my = 40 + (cm.zoom - 1) * 540 + Math.abs(cm.rot) * 980;
          const P = (x, y, d) => [C.x + ((x * F) / d) * k, C.y + ((y * F) / d) * k];
          // The motifs, as lattice blocks scaled by depth.
          for (const p of props) {
            const d = p.z - z;
            if (d < 0.3 || d > 9) continue;
            const mo = motifs()[p.i], cs = ((0.075 * F) / d) * k;
            if (cs < 1) continue;
            const [px, py] = P(p.x, p.y, d);
            const fade = OM.clamp((9 - d) / 4);
            ctx.globalAlpha = fade;
            for (let j = 0; j < MH; j++)
              for (let i = 0; i < MW; i++) {
                const v = mo.m[j * MW + i];
                if (!v) continue;
                ctx.fillStyle = v === 2 || d < 1.4 || sq > 0.3 ? ink.crest : d < 3 ? ink.hover : ink.lit;
                ctx.fillRect(px + (i - MW / 2) * cs, py + (j - MH / 2) * cs, Math.ceil(cs * 0.9), Math.ceil(cs * 0.9));
              }
            ctx.globalAlpha = 1;
          }
          // The lines: each rides its own ring, alternately just inside its top and
          // bottom edge. Laid out near to far, a line is dropped if it would touch
          // one nearer to the camera, so no two ever overlap; then drawn far to near
          // on a dark plate, so nothing else reads over a line.
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const shown = [];
          for (let n = 0; n < items.length; n++) {
            const it = items[n], tx = texts.list[n];
            const d = it.z - z;
            if (d < 0.22 || d > 8 || !tx.s) continue;
            // Grows with nearness up to the frame's width (or 170px), then dissolves rather than clip.
            const raw = ((190 * F) / 900 / d) * k;
            const cap = Math.min(170, (1880 - 2 * mx) / Math.max(1, tx.w));
            const size = Math.min(raw, cap);
            if (size < 3) continue;
            const gone = OM.clamp((raw / cap - 1) * 1.6);
            if (gone >= 1) continue;
            let [px, py] = P(it.x, it.y, d);
            const half = (tx.w * size) / 2;
            px = OM.clamp(px, half + mx, 1920 - mx - half); // the whole line stays in frame while it reads
            py = OM.clamp(py, size * 0.6 + my, 1080 - my - size * 0.6);
            const pad = 0.25 * size;
            const box = [px - half - pad, py - 0.6 * size - pad, px + half + pad, py + 0.6 * size + pad];
            if (shown.some((o) => box[0] < o.box[2] && box[2] > o.box[0] && box[1] < o.box[3] && box[3] > o.box[1])) continue;
            shown.push({ n, d, size, px, py, box, f: OM.clamp((8 - d) / 3) * (1 - gone), near: OM.clamp((2.2 - d) / 1.4) });
          }
          front = null;
          for (let j = shown.length - 1; j >= 0; j--) {
            const l = shown[j];
            ctx.fillStyle = ink.bg;
            ctx.globalAlpha = 0.92 * l.f;
            ctx.fillRect(l.box[0], l.box[1], l.box[2] - l.box[0], l.box[3] - l.box[1]);
            ctx.globalAlpha = 1;
            ctx.font = `700 ${l.size.toFixed(1)}px 'JetBrains Mono'`;
            ctx.fillStyle = OM.mix(ink.bg, sq > 0.2 || drop > 0.5 ? ink.crest : l.near > 0.5 ? ink.crest : ink.hover, l.f);
            ctx.fillText(texts.list[l.n].s, l.px, l.py);
            if (l.f > 0.5 && sq < 0.2) front = l.box;
          }
          // The point everything collapses into, growing into the spark's halo.
          if (sq > 0) {
            const [r, g, b] = OM.rgb(ink.lit);
            const rad = 72 + 500 * k;
            const gr = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, rad);
            gr.addColorStop(0, `rgba(${r},${g},${b},${0.4 * sq})`);
            gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = gr;
            ctx.fillRect(C.x - rad, C.y - rad, 2 * rad, 2 * rad);
            ctx.fillStyle = ink.crest;
            const h = OM.cellAt(L, C.x, C.y);
            OM.cell(ctx, L, h.col, h.row, dpr);
          }
      };
      return {
        render(t, T) {
          draw(t, T);
          const tau = Math.max(0, T - DOWN[0]);
          const speed = OM.clamp(Math.exp(0.3245 * tau) / 16); // the camera's speed, 1/16 .. 1
          const amount = OM.post.envelope(T, start, END, { ramp: 0.4, hold: 0.07 }) * (0.35 + 0.65 * speed);
          fx.apply(T, { amount, cam: camAt(T), p0: [C.x, 1080 - C.y, 0.5, 0.03 + 0.13 * speed], p1: front ? [front[0], 1080 - front[3], front[2], 1080 - front[1]] : [-1e5, -1e5, -1e5, -1e5] });
        },
        release: () => { fx.release(); c.release(); },
      };
    },
  });
})();
