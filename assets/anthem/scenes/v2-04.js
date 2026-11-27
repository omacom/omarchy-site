// v2-04 · Two boots, one self. Out of the night two machines boot side by
// side, each scrolling its own, different boot log, ticking forward on the
// snares. On every onset both logs print a lit line and its cells fly out of
// both panes together into the centre, where the word lands in lattice type:
// two different boots spelling the same line. The panes slide together as the
// line fills, and on the last word, the key word, both boots implode into it:
// the logs, the frames, everything, leaving only the self that survived the
// reboot. In the pause, echo lines from both sides are absorbed into it on the
// kicks, it blinks through a reboot on the snare and holds, the tube browns
// out, and on the last kicks it powers off, CRT style, into the night.

// Edit camera: the defaults fit. The key word (131.125) falls between beats and is the scene's own
// biggest hit (its camera punches 5% as both boots implode into it), so nothing stacks on it; the
// downbeat after it (131.394) lands with the second echo line's absorb flash, the reboot blink rides
// the backbeat jolt (131.909), and the line sits well inside the frame.
OM.edit.plan('v2-04', {});

OM.ownWords.add('v2-04');
// The v2-05 keyboard, shared so v2-04 can land its match cut on the board's key tops exactly as
// v2-05's camera first sees them: layout, camera pose, the projected top faces.
OM.v2keys = (() => {
  const ROWS = [
    [['Esc', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['Back', 2]],
    [['Tab', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1], ['\\', 1.5]],
    [['Caps', 1.75], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], [';', 1], ["'", 1], ['Return', 2.25]],
    [['Shift', 2.25], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['Shift', 2.75]],
    [['Ctrl', 1.25], ['Super', 1.25], ['Alt', 1.25], ['Space', 6.25], ['Alt', 1.25], ['Fn', 1.25], ['Menu', 1.25], ['Ctrl', 1.25]],
  ];
  const U = 64, GAP = 6, TOPY = 30;
  const keys = [];
  ROWS.forEach((row, r) => {
    let x = -7.5 * U;
    row.forEach(([label, w]) => { keys.push({ label, w, x: x + (w * U) / 2, z: (r - 2) * U, kw: w * U - GAP, kd: U - GAP }); x += w * U; });
  });
  const camera = () => {
    const c = new THREE.PerspectiveCamera(30, 1920 / 1080, 10, 4000);
    c.setViewOffset(1920, 1080, 0, -250, 1920, 1080); // the board sits low, the line above it
    return c;
  };
  const pose = (cam, p) => {
    cam.position.set(OM.lerp(-380, 340, p), 430, 760);
    cam.lookAt(OM.lerp(-160, 140, p), 0, -20);
    cam.updateMatrixWorld();
  };
  let Q = null;
  /** Each key's top face as seen by the camera at the start of v2-05: four screen points and a centre. */
  const quads = () => {
    if (Q) return Q;
    const cam = camera();
    pose(cam, 0);
    const v = new THREE.Vector3();
    Q = keys.map((k) => {
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
        v.set(k.x + (a * k.kw) / 2, TOPY, k.z + (b * k.kd) / 2).project(cam);
        return [(v.x + 1) * 960, (1 - v.y) * 540];
      });
      return { pts, cx: pts.reduce((s, p) => s + p[0], 0) / 4, cy: pts.reduce((s, p) => s + p[1], 0) / 4 };
    });
    return Q;
  };
  /** A key top in 2D, scaled about its centre. */
  const top = (ctx, q, s = 1) => {
    if (s <= 0) return;
    const th = OM.theme('tokyo-night');
    ctx.beginPath();
    q.pts.forEach(([x, y], i) => {
      const px = q.cx + (x - q.cx) * s, py = q.cy + (y - q.cy) * s;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = th['surface-2'];
    ctx.fill();
    ctx.strokeStyle = th['border-strong'];
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  /** The shared cut frame at 133.027: night and every key top. */
  const cut = (ctx) => {
    ctx.fillStyle = OM.fieldInks('tokyo-night').bg;
    ctx.fillRect(0, 0, 1920, 1080);
    quads().forEach((q) => top(ctx, q));
  };
  return { ROWS, U, GAP, TOPY, keys, camera, pose, quads, top, cut };
})();
OM.scene({
  id: 'v2-04',
  build(el, { start, duration }) {
    const V = OM.v2, LT = OM.v2lat;
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    // A second print of the frame, screen-blended at the two boots' separation, converging to nothing at the key word.
    const FX = `vec4 effect(vec2 uv) {
      vec2 q = cam(uv);
      vec3 a = src(q).rgb, b = src(q + uP0.xy).rgb;
      vec3 scr = 1.0 - (1.0 - a) * (1.0 - b * vec3(0.8, 1.0, 0.75));
      return vec4(mix(a, scr, uP0.z * uAmount), 1.0);
    }`;
    const c = OM.canvas(cv, { alpha: false });
    const fx = OM.post(el, c, { effect: FX });
    const beat = OM.edit.scene(start, start + duration); // the parallax sway runs on the beat clock
    const off = document.createElement('canvas'); // the frame, drawn once, printed or powered off
    const oc = OM.canvas(off, { alpha: false });
    const ink = V.ink(), th = V.th();
    const sung = OM.sung('v2-04');
    const N = sung.length;
    const on = sung.map((w) => w.t0);
    const END = start + duration;
    const KEY = N - 1, LOCK = on[KEY];
    // Every drum time on the measured hit (OM.T.drums).
    const SNARES = [127.896, 128.174, 128.29, 128.708, 128.964, 130.287].map((t) => V.drum('snare', t));
    const MERGE0 = SNARES[SNARES.length - 1]; // the panes start sliding together on this snare
    // Each echo line is absorbed (its flash at 0.18 s into its flight) on a pause kick.
    const ECHO = [131.26, 131.402, 131.54].map((t) => V.drum('kick', t) - 0.18), BLINK = V.drum('snare', 131.913), DIP = V.drum('kick', 132.075);
    const K1 = V.drum('kick', 132.331), K2 = V.drum('kick', 132.47); // power-off: to a line, to a dot
    const FLY = 0.14;
    // Two boots, two different logs.
    const LOGA = ['Linux version 6.17.9-arch1-1', 'Command line: root=UUID quiet splash', 'Booting paravirtualized kernel', 'ACPI: 12 ACPI AML tables loaded', 'nvme0n1: p1 p2', 'Run /init as init process',
      'Starting Load Kernel Modules', 'Mounted /boot', 'Reached target Local File Systems', 'Started Network Manager', 'Reached target Graphical Interface', 'Starting Hyprland session'];
    const LOGB = ['limine: booting snapshot 2', 'BTRFS: device fsid mounted', 'Finished Remount Root', 'Started Journal Service', 'Listening on udev Control Socket', 'Started iwd wireless daemon',
      'Starting Bluetooth service', 'Reached target Sound Card', 'Started Power Profiles', 'Reached target Multi-User System', 'Starting uwsm session', 'Started waybar'];
    const PW = 820, PH = 880, PY = 100;
    let F = null;
    const plan = () => {
      const L = V.layout(sung, { cap: 88, maxW: 1560, cx: 960, cy: 520, lead: 1.45 });
      const R = LT.raster(sung, L);
      const box = (k) => {
        const cs = R[k].cells;
        if (!cs.length) return { x: L.at[k].cx, y: L.at[k].cy, w: 0, h: 0 };
        const x0 = Math.min(...cs.map((q) => q[0])), x1 = Math.max(...cs.map((q) => q[0])) + LT.CELL;
        return { x: x0, y: R[k].top, w: x1 - x0, h: R[k].bot + LT.CELL - R[k].top };
      };
      F = { L, R, box: sung.map((_, k) => box(k)), top: Math.min(...R.map((r) => r.top)) - 30, bot: Math.max(...R.map((r) => r.bot)) + 40 };
    };
    /** The two boots slide together as the line fills: 1 apart, 0 one on the other. */
    const sep = (T) => 1 - OM.ease.inOutCubic(OM.prog(T, MERGE0, LOCK));
    const implode = (T) => OM.ease.inExpo(OM.prog(T, LOCK - 0.12, LOCK));
    const paneRect = (side, T) => {
      const cx = 960 + side * 490 * sep(T); // at the cut: exactly OM.v2boot.PANES
      const r = { x: cx - PW / 2, y: PY, w: PW, h: PH };
      const b = F.box[KEY];
      return V.lerpRect(r, { x: b.x + b.w / 2, y: b.y + b.h / 2, w: 0, h: 0 }, implode(T));
    };
    /** Lines printed by a boot at T: a steady crawl, a burst on every snare, racing into the merge. */
    const printed = (T) => {
      let n = 9 * Math.max(0, T - start);
      for (const s of SNARES) n += 3 * OM.ease.outCubic(OM.prog(T, s, s + 0.1));
      n += 22 * Math.pow(OM.prog(T, MERGE0, LOCK), 2);
      return n;
    };
    const LH = 30;
    const pane = (x, side, T) => {
      const r = paneRect(side, T);
      if (r.w < 4) return;
      const fade = 1 - implode(T);
      x.save();
      x.globalAlpha = fade * (side > 0 && sep(T) < 1 ? OM.lerp(0.55, 1, sep(T)) : 1);
      OM.v2boot.paneFrame(x, r, x.globalAlpha);
      x.globalAlpha = fade * (side > 0 && sep(T) < 1 ? OM.lerp(0.55, 1, sep(T)) : 1);
      x.beginPath();
      x.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      x.clip();
      const log = side < 0 ? LOGA : LOGB, n = printed(T), whole = Math.floor(n), frac = n - whole;
      x.font = "500 21px 'JetBrains Mono'";
      x.textBaseline = 'alphabetic';
      x.textAlign = 'left';
      const rows = Math.ceil(r.h / LH) + 1;
      for (let i = 0; i < rows; i++) {
        const k = whole - 1 - i; // only lines fully printed: none at the cut
        if (k < 0) break;
        const y = r.y + r.h - 22 - (i - frac) * LH;
        const lit = sung.some((w) => T >= w.t0 && T - w.t0 < 0.25 && k === Math.floor(printed(w.t0)) - 1);
        x.fillStyle = lit ? ink.crest : ink.lit;
        x.fillText('[  OK  ]', r.x + 24, y);
        x.fillStyle = lit ? ink.crest : th['text-muted'];
        x.fillText(log[(k * 7 + (side < 0 ? 0 : 3)) % log.length], r.x + 150, y);
      }
      x.restore();
    };
    /** The frame up to the power-off. */
    const frame = (x, T) => {
      x.fillStyle = ink.bg;
      x.fillRect(0, 0, 1920, 1080);
      LT.grid(x, 1 - OM.ease.inOutCubic(OM.prog(T, start + 0.3, start + 1.2))); // v2-03's lattice, settling away
      if (T < LOCK + 0.01) { pane(x, -1, T); pane(x, 1, T); }
      // A dark band behind the line so it reads over the logs.
      const band = OM.clamp((T - on[0]) / 0.2) * (1 - implode(T));
      if (band > 0) {
        x.fillStyle = V.rgba(ink.bg, 0.82 * band);
        x.fillRect(0, F.top, 1920, F.bot - F.top);
      }
      const lockA = T >= LOCK ? Math.exp(-(T - LOCK) / 0.25) : 0;
      const blink = T >= BLINK && T < BLINK + 0.12 ? OM.prog(T, BLINK, BLINK + 0.12) : 1; // sprinkle: reboot blink
      const keep = blink < 1 ? (cx, cy) => OM.threshold(cx / LT.P, cy / LT.P) < Math.abs(blink * 2 - 1) : null;
      for (let k = 0; k < N; k++) {
        if (T < on[k]) {
          // Its cells in flight, out of both boots' newest lines.
          const p = OM.prog(T, on[k] - FLY, on[k]);
          if (p <= 0 || on[k] - FLY < start + 0.1) continue;
          const e = OM.ease.inCubic(p);
          const n = printed(on[k] - FLY);
          x.fillStyle = V.rgba(ink.crest, 0.4 + 0.6 * p);
          F.R[k].cells.forEach(([cx, cy], i) => {
            const side = i % 2 ? 1 : -1, r = paneRect(side, on[k] - FLY);
            const fx0 = r.x + 150 + ((i * 37) % 400), fy0 = r.y + r.h - 22 - (n % 1) * 0;
            x.fillRect(OM.lerp(fx0, cx, e), OM.lerp(fy0, cy, e), LT.CELL, LT.CELL);
          });
          continue;
        }
        if (T < K1) LT.draw(x, ink, F.R[k], T - on[k], { keep });
      }
      // The key word: both boots gone into it; it holds the light.
      if (T >= LOCK) {
        const b = F.box[KEY];
        V.pool(x, b.x + b.w / 2, b.y + b.h / 2, b.w * 0.9 + 60, b.h, ink.lit, (0.25 + 0.35 * lockA) * (1 - OM.prog(T, K1, K1 + 0.3)));
        if (T < K1) LT.draw(x, ink, F.R[KEY], T - LOCK, { keep });

        // Sprinkle, echo lines: on each pause kick a last log line from each side is absorbed into the key word.
        ECHO.forEach((h, i) => {
          const a = T - h;
          if (a < 0 || a > 0.22) return;
          const e = OM.ease.inCubic(a / 0.22), y = F.bot + 30 + i * 26;
          x.font = "500 21px 'JetBrains Mono'";
          x.textBaseline = 'alphabetic';
          x.fillStyle = V.rgba(ink.lit, 1 - e * 0.7);
          x.textAlign = 'right';
          x.fillText(LOGA[(i * 5) % LOGA.length], OM.lerp(-20, b.x, e) + 0, OM.lerp(y, b.y + b.h, e));
          x.textAlign = 'left';
          x.fillText(LOGB[(i * 5 + 2) % LOGB.length], OM.lerp(1940, b.x + b.w, e), OM.lerp(y, b.y + b.h, e));
          if (a > 0.18) V.pool(x, b.x + b.w / 2, b.y + b.h / 2, b.w, b.h * 0.8, ink.crest, 0.3);
        });
      }
    };

    // The rain: every cell of the line assigned to a key, leaving on the kick, landing through the next.
    let RAIN = null;
    const rain = () => {
      const Q = OM.v2keys.quads(), cells = [], first = Q.map(() => Infinity);
      let i = 0;
      F.R.forEach((R) => R.cells.forEach(([x, y]) => {
        const key = i % Q.length, d = OM.hash(i, 4, 91);
        const t0 = K1 + d * 0.22, t1 = t0 + 0.26;
        const q = Q[key], sx = (q.pts[1][0] - q.pts[0][0]) * 0.32, sy = (q.pts[3][1] - q.pts[0][1]) * 0.32;
        cells.push({ x, y, key, t0, t1, ox: (OM.hash(i, 5, 92) - 0.5) * sx, oy: (OM.hash(i, 6, 93) - 0.5) * sy, ink: LT.band(ink, y, R.top, R.bot) });
        first[key] = Math.min(first[key], t1 - 0.04);
        i++;
      }));
      RAIN = { cells, first };
    };
    const ROCKET = 0.3;
    const firework = (ctx, T) => {
      if (T < LOCK - ROCKET || T > LOCK + 1.4) return;
      const b = F.box[KEY], bx = b.x + b.w / 2, by = b.y - 70;
      if (T < LOCK) {
        const u = OM.ease.outCubic(OM.prog(T, LOCK - ROCKET, LOCK));
        const y = OM.lerp(1100, by, u);
        for (let i = 0; i < 9; i++) {
          ctx.fillStyle = V.rgba(i < 2 ? ink.crest : ink.lit, 1 - i / 9);
          ctx.fillRect(bx - 4 + 3 * Math.sin(i * 1.7 + T * 40), y + i * 16, 8, 8);
        }
        return;
      }
      const a = T - LOCK;
      for (let i = 0; i < 120; i++) {
        const h1 = OM.hash(i, 1, 2404), h2 = OM.hash(i, 2, 2404), h3 = OM.hash(i, 3, 2404);
        const ang = h1 * Math.PI * 2, sp = 260 + 520 * h2, life = 0.8 + 0.6 * h3;
        if (a > life) continue;
        const drag = (1 - Math.exp(-a * 3)) / 3; // speed bleeds off, gravity takes over
        const x = bx + Math.cos(ang) * sp * drag, y = by + Math.sin(ang) * sp * drag + 320 * a * a;
        const tw = OM.hash(i, Math.floor(T * 24), 7) > 0.35 ? 1 : 0.35; // glitter twinkle
        ctx.fillStyle = V.rgba(i % 3 === 0 ? ink.crest : i % 3 === 1 ? ink.hover : ink.lit, tw * (1 - a / life));
        const sz = a < 0.06 ? 8 : 5;
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
      if (a < 0.1) V.pool(ctx, bx, by, 160, 160, ink.crest, 0.6 * (1 - a / 0.1));
    };
    return {
      render(t, T) {
        const ctx = c.ensure();
        if (T < start + V.HOLD_IN) return fx.apply(T), OM.v2boot.bootCut(ctx);
        if (T >= END - V.HOLD_OUT) return fx.apply(T), OM.v2keys.cut(ctx);
        if (!F || !V.met().ok) plan();
        if (!RAIN) rain();
        if (T < K1) {
          const x = oc.ensure();
          frame(x, T);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(off, 0, 0, cv.width, cv.height);
          ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0);
        } else {
          // Match cut: the line's cells rain down onto the keyboard and each key top forms where they land.
          ctx.fillStyle = ink.bg;
          ctx.fillRect(0, 0, 1920, 1080);
          const Q = OM.v2keys.quads();
          Q.forEach((q, j) => OM.v2keys.top(ctx, q, OM.ease.outBack(OM.clamp((T - RAIN.first[j]) / 0.12), 1.4)));
          for (const r of RAIN.cells) {
            const u = OM.ease.inOutCubic(OM.prog(T, r.t0, r.t1));
            if (u >= 1) continue;
            const q = Q[r.key];
            const x = OM.lerp(r.x, q.cx + r.ox, u), y = OM.lerp(r.y, q.cy + r.oy, u) - 120 * Math.sin(Math.PI * u);
            ctx.fillStyle = u > 0 ? ink.crest : r.ink;
            const sz = LT.CELL * (1 - 0.5 * u);
            ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
          }
        }
        // Pixel firework on the key word: a rocket of cells climbs to it and bursts into falling glitter.
        firework(ctx, T);
        // Sprinkle, brownout: the screen sags on the kick before the rain.
        const dip = T >= DIP && T < K1 ? Math.exp(-(T - DIP) / 0.06) : 0;
        if (dip > 0.02) { ctx.fillStyle = V.rgba(ink.bg, 0.4 * dip); ctx.fillRect(0, 0, 1920, 1080); }
        const ce = V.camEnv(T, start, END), s = T < LOCK ? sep(T) : 0;
        const punch = T >= LOCK ? Math.exp(-(T - LOCK) / 0.12) : 0;
        const grow = OM.ease.inOutCubic(OM.prog(T, start + V.HOLD_IN, start + 0.45));
        fx.apply(T, {
          amount: V.env(T, start, END),
          cam: { zoom: 1 + ce * (0.04 + 0.05 * punch), x: ce * 22 * s * Math.sin((beat.clock(T) - start) * 1.2) },
          p0: [(36 * s) / 1920, (10 * s) / 1080, 0.16 * s * grow, 0],
        });
      },
      release: () => { fx.release(); c.release(); oc.release(); },
    };
  },
});
