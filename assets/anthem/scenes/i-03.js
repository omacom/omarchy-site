// i-03 · The spiral. Opens on i-02's held dawn exactly (sampled cell for cell),
// then every lit cell is pulled inward on a spiral and condenses into the
// 15x15 mark at 4x4 cells per logo pixel, landing on the intro's big hit with
// a one-frame crest. Light runs the spiral on the accelerating hi-hat roll;
// then the mark turns in four hard 90-degree steps on the beats and comes home.

// Edit camera: the scene's own camera already hits most of the drums, so the edit camera
// stands aside on those beats: the implosion's thumps (21.08, 21.35, 21.62), the lock on the
// big hit (22.19: the spiral camera snapping off is the intro's biggest moment, and the
// camera's 22.15 punch and 22.22 kick would blur it), and every counter-roll kick (23.23,
// 24.85 and the four quarter turns). It keeps the beats in between, and the cut's downbeat.
OM.edit.plan('i-03', { skip: [21.08, 21.35, 21.617, 22.19, 23.234, 24.853, 26.461, 27.001, 27.535, 28.075] });

OM.scene({
  id: 'i-03',
  build(el, { start }) {
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    const L = OM.HOME;
    const ink = OM.fieldInks('tokyo-night');
    const INKS = [ink.dim, ink.mid, ink.lit, ink.hover, ink.crest];
    const word = OM.WORDMARK;
    const home = OM.cellAt(L, 960, 540);
    const T0 = start;
    // Hits measured from the drums at 3 ms (the beat grid runs 50-85 ms late here): [time, strength].
    const FILL_A = [[20.946, 1.9], [21.08, 1.25], [21.35, 1.23], [21.617, 1.66], [22.16, 1.66]]; // the implosion punches through these
    const FILL_B = [[23.234, 1.35], [23.506, 1.1], [23.771, 1.4], [24.18, 1.07]];
    const FILL_C = [[24.853, 1.04], [25.116, 0.94], [25.384, 1.1], [25.651, 1.22], [25.791, 0.93], [25.927, 1.19], [26.197, 1.04], [26.328, 1.11]];
    const PULSES = [...FILL_B, ...FILL_C];
    const LAND = 22.16 + 0.03; // the mark lands on the last hit of fill A (its step takes one frame)
    const FRAME = 1 / 30;
    const ROLL = [22.245, 24.474]; // the light runs the spiral after the landing
    const TURNS = [26.461, 27.001, 27.535, 28.075]; // the snare pulse: one quarter turn on each
    const TURN = 0.22;
    // The pull's progress: a slow draw-in to the big kick, then one hard step per hit, sized by its strength.
    const G0 = 0.3, SUM = FILL_A.reduce((n, h) => n + h[1], 0);
    const LEVELS = [G0];
    for (const [, st] of FILL_A) LEVELS.push(LEVELS[LEVELS.length - 1] + ((1 - G0) * st) / SUM);
    const pull = (T) => {
      if (T < FILL_A[0][0]) return G0 * OM.ease.inCubic(OM.prog(T, start, FILL_A[0][0]));
      let i = 0;
      while (i + 1 < FILL_A.length && T >= FILL_A[i + 1][0]) i++;
      const h = FILL_A[i][0], dur = i === FILL_A.length - 1 ? 0.03 : 0.06;
      return OM.lerp(LEVELS[i], LEVELS[i + 1], OM.ease.outCubic(OM.prog(T, h, h + dur)));
    };
    /** A decaying flash per hit, sized by strength (0 outside 0.4 s after each). */
    const hitPulse = (hits, T, tau) => {
      let v = 0;
      for (const [h, st] of hits) {
        const x = T - h;
        if (x >= 0 && x < 0.4) v = Math.max(v, st * Math.exp(-x / tau) * (1 - x / 0.4));
      }
      return v;
    };
    const N = 60; // 15 logo pixels x 4 cells
    const H = N / 2;
    const inWord = (col, row) => row >= 0 && row < word.h && col >= 0 && col < word.w && word.rows[row][col] === '1';

    // ---- i-02's final look, rendered with its own parameters and sampled per cell ----
    const off = document.createElement('canvas');
    off.width = 1920;
    off.height = 1080;
    const octx = off.getContext('2d');
    OM.intro.dawn(octx, OM.intro.FREEZE, 1); // i-02's held dawn, the exact frame it cuts on
    const px = octx.getImageData(0, 0, 1920, 1080).data;
    off.width = 0;
    const inkKey = new Map(INKS.map((h, i) => [OM.rgb(h).join(','), i]));

    // ---- the mark: 60x60 cells, lit where the logo is ----
    const lit = new Uint8Array(N * N);
    const targets = [];
    for (let v = 0; v < N; v++)
      for (let u = 0; u < N; u++)
        if (OM.LOGO.rows[v >> 2][u >> 2] === '1') {
          lit[v * N + u] = 1;
          targets.push(v * N + u);
        }
    const nearest = (u, v) => {
      let best = 0, bd = Infinity;
      for (const k of targets) {
        const dx = (k % N) - u, dy = ((k / N) | 0) - v, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = k; }
      }
      return best;
    };

    // ---- particles: every lit field cell, flying a spiral to a cell of the mark ----
    const hx = Math.max(home.col - L.cMin, L.cMin + L.cols - home.col);
    const hy = Math.max(home.row - L.rMin, L.rMin + L.rows - home.row);
    const rMax = Math.hypot(hx, hy);
    const P = [];
    // The dawn is painted on its own, larger lattice (LD): sample its cells and measure them in home cells.
    const LD = OM.intro.LD;
    for (let r = 0; r < LD.rows; r++)
      for (let k = 0; k < LD.cols; k++) {
        const col = LD.cMin + k, row = LD.rMin + r;
        const x = Math.floor(LD.x0 + (col + 0.5) * LD.cw), y = Math.floor(LD.y0 + (row + 0.5) * LD.ch);
        if (x < 0 || y < 0 || x >= 1920 || y >= 1080) continue;
        const i = (y * 1920 + x) * 4;
        const id = inkKey.get(`${px[i]},${px[i + 1]},${px[i + 2]}`);
        if (id === undefined) continue;
        const sx = (LD.x0 + (col + 0.5) * LD.cw - L.x0) / L.cw - home.col, sy = (LD.y0 + (row + 0.5) * LD.ch - L.y0) / L.ch - home.row;
        const ju = (OM.hash(col, row, 5) - 0.5) * 3, jv = (OM.hash(col, row, 6) - 0.5) * 3;
        const tu = OM.clamp(H + (sx / hx) * H + ju, 0, N - 1), tv = OM.clamp(H + (sy / hy) * H + jv, 0, N - 1);
        const t = nearest(Math.round(tu), Math.round(tv));
        const gx = (t % N) + 0.5 - H, gy = ((t / N) | 0) + 0.5 - H;
        const as = Math.atan2(sy, sx);
        let da = Math.atan2(gy, gx) - as;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        // A vortex, not a rigid spin: the inner field turns further than the rim.
        const rs = Math.hypot(sx, sy);
        P.push({ ink: id, rs, rg: Math.hypot(gx, gy), as, da: da + 1.9 * (1 - 0.75 * rs / rMax), delay: 0.06 + 0.22 * OM.hash(col, row, 9) });
      }

    // ---- the light run: cell distance along the mark from the bottom gap ----
    const dist = new Int16Array(N * N).fill(-1);
    const queue = [];
    for (let v = 56; v < 60; v++) for (let u = 36; u < 40; u++) { dist[v * N + u] = 0; queue.push(v * N + u); }
    for (let q = 0; q < queue.length; q++) {
      const k = queue[q], u = k % N, v = (k / N) | 0;
      for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = u + du, b = v + dv, j = b * N + a;
        if (a < 0 || b < 0 || a >= N || b >= N || !lit[j] || dist[j] >= 0) continue;
        dist[j] = dist[k] + 1;
        queue.push(j);
      }
    }
    let maxD = 0;
    for (const k of targets) maxD = Math.max(maxD, dist[k]);

    const cellInk = new Uint8Array(N * N);
    const Cx = L.x0 + home.col * L.cw, Cy = L.y0 + home.row * L.ch;

    /** Ink of mark cell (u, v) in the mark's own frame (it turns with the mark). */
    function markInks(T) {
      const k = OM.prog(T, LAND + FRAME, LAND + 0.5); // dithered cooling after the one-frame crest
      const head = (maxD + 24) * Math.pow(OM.prog(T, ROLL[0], ROLL[1]), 1.5);
      const running = T >= ROLL[0] && T < ROLL[1] + 0.6;
      const pf = 0.55 * hitPulse(PULSES, T, 0.12) / 1.4;
      for (const j of targets) {
        const u = j % N, v = (j / N) | 0;
        if (T < LAND + FRAME) { cellInk[j] = 4; continue; }
        const th = OM.threshold(u, v);
        const n = OM.heroNoise(u / 9 + T * 0.14, v / 9 - T * 0.055);
        const val = 0.3 + 0.7 * n * n + 0.12 * Math.sin(T * 1.1 + OM.heroJitter[(v * 37 + u * 11) & 4095] * 6.283);
        let id = val > 0.62 + 0.3 * th ? 3 : val > 0.2 + 0.25 * th ? 2 : 1;
        if (th > k) id = 3;
        if (running) {
          const behind = head - dist[j];
          if (behind >= 0 && behind < 3) id = 4;
          else if (behind >= 3 && behind < 14 && th < 1 - (behind - 3) / 11) id = Math.max(id, 3);
        }
        if (pf > 0.05 && th < pf) id = 4; // the fill's thump flashes the cells
        cellInk[j] = id;
      }
    }

    /** Clockwise rotation in degrees: four quarter turns with a wind-up and a firm settle. */
    function angle(T) {
      let a = 0;
      for (const b of TURNS) {
        if (T < b) a -= 4 * OM.smooth(OM.prog(T, b - 0.1, b));
        else {
          a += 90 * OM.ease.outBack(OM.prog(T, b, b + TURN), 1.25);
          a -= 4 * (1 - OM.ease.outCubic(OM.prog(T, b, b + 0.05)));
        }
      }
      return a;
    }

    // Twist: the frame wrung round the mark's centre, tighter as the field closes on it.
    const fx = OM.post(el, c, { effect: `
vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  if (uAmount <= 0.0) return src(p);
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 d = (p - uP0.zw) * asp;
  float k = uAmount * uP0.x * pow(max(0.0, 1.0 - length(d) / uP0.y), 2.0);
  float cs = cos(k), sn = sin(k);
  return src(mat2(cs, -sn, sn, cs) * d / asp + uP0.zw);
}` });
    // Sparks spiralling in with the field, each on its own clock, gone on the hit.
    const SPARKS = Array.from({ length: 72 }, (_, i) => ({
      a: 6.283 * OM.hash(i, 1, 71), r: 520 + 520 * OM.hash(i, 2, 71), t0: T0 + 0.15 + 0.5 * OM.hash(i, 3, 71), spin: 2.6 + 1.6 * OM.hash(i, 4, 71),
    }));
    const cX = Cx, cY = Cy;
    const KICKS = [23.234, 24.853, ...TURNS]; // the fills' first hits, then the four quarter turns
    const SNARES = [23.771, 25.651, 25.927];
    const sparks = (ctx, T) => {
      if (T >= LAND) return;
      const show = OM.smooth(OM.prog(T, T0 + 0.1, T0 + 0.7));
      for (const sp of SPARKS) {
        for (let k = 0; k < 5; k++) {
          const e = Math.pow(OM.prog(T - k * 0.025, sp.t0, LAND), 2.4);
          const r = sp.r * (1 - e), a = sp.a + sp.spin * e;
          ctx.globalAlpha = show * (1 - k / 5) * (r < 12 ? 0 : 1);
          ctx.fillStyle = k ? ink.hover : ink.crest;
          const z = k ? 2 : 4;
          ctx.fillRect(cX + r * Math.cos(a) - z / 2, cY + r * Math.sin(a) - z / 2, z, z);
        }
      }
      ctx.globalAlpha = 1;
    };
    const draw = (ctx, dpr, T) => {
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);

        if (T < LAND) {
          // The pull: slow at first, then a rush into the hit, swirling as it closes.
          const ids = [[], [], [], [], []];
          const G = pull(T);
          const flash = hitPulse(FILL_A, T, 0.09) / 1.9; // the light flashes on each hit
          let pi = 0;
          for (const p of P) {
            pi++;
            const dd = (p.delay - 0.06) * 1.1, e = OM.clamp((G - dd) / (1 - dd));
            const r = p.rs + (p.rg - p.rs) * e;
            const a = p.as + p.da * e;
            // Each cell flies as a square, shrinking from the dawn's cell size to the home lattice's;
            // at e = 0 it is exactly its dawn cell, at e = 1 exactly its cell of the mark.
            const w = OM.lerp(LD.cw, L.cw, e), h = OM.lerp(LD.ch, L.ch, e);
            const x = L.x0 + (home.col + r * Math.cos(a)) * L.cw - w / 2, y = L.y0 + (home.row + r * Math.sin(a)) * L.ch - h / 2;
            const lit = flash > 0.05 && OM.hash(pi, 3, 17) < flash ? 4 : e > 0.82 ? 4 : e > 0.45 ? Math.max(p.ink, 3) : p.ink;
            ids[lit].push(x, y, w, h);
          }
          const sn = (v) => Math.round(v * dpr) / dpr;
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = INKS[i];
            const a = ids[i];
            for (let k = 0; k < a.length; k += 4) {
              const x = sn(a[k]), y = sn(a[k + 1]);
              ctx.fillRect(x, y, sn(a[k] + a[k + 2]) - x, sn(a[k + 1] + a[k + 3]) - y);
            }
          }
          return;
        }

        markInks(T);
        const deg = angle(T);
        const q = Math.round(deg / 90);
        const sc = 1 + 0.035 * hitPulse(PULSES, T, 0.12); // the scale punch on each thump
        if (Math.abs(deg - q * 90) < 0.02 && sc === 1) {
          // At rest: exactly on the lattice, the turned bitmap indexed cell for cell.
          const turns = ((q % 4) + 4) % 4;
          for (let i = 1; i < 5; i++) {
            ctx.fillStyle = INKS[i];
            for (const j of targets) {
              if (cellInk[j] !== i) continue;
              let u = j % N, v = (j / N) | 0;
              for (let s = 0; s < turns; s++) [u, v] = [N - 1 - v, u];
              OM.cell(ctx, L, home.col - H + u, home.row - H + v, dpr);
            }
          }
          return;
        }
        // Mid-turn: rotate in cell space, then scale by the lattice's cell size,
        // so a quarter turn lands each cell exactly on a lattice cell.
        const rad = (deg * Math.PI) / 180, cs = Math.cos(rad), sn = Math.sin(rad);
        ctx.save();
        ctx.setTransform(dpr * sc * L.cw * cs, dpr * sc * L.ch * sn, -dpr * sc * L.cw * sn, dpr * sc * L.ch * cs, dpr * Cx, dpr * Cy);
        for (let i = 1; i < 5; i++) {
          ctx.fillStyle = INKS[i];
          for (const j of targets) if (cellInk[j] === i) ctx.fillRect((j % N) - H - 0.02, ((j / N) | 0) - H - 0.02, 1.04, 1.04);
        }
        ctx.restore();
    };

    return {
      render(t, T) {
        const ctx = c.ensure();
        draw(ctx, c.dpr, T);
        sparks(ctx, T);
        // Camera: a spiral zoom turning against the implosion, locking on the hit with a punch, then at rest.
        const g = pull(T);
        const pre = T < LAND;
        const thump = pre ? 0.022 * hitPulse(FILL_A, T, 0.08) : 0; // the camera punches with each hit of the implosion
        const punch = pre ? 0 : 0.035 * Math.exp(-(T - LAND) / 0.1) * (1 - OM.prog(T, LAND, LAND + 0.6));
        // After the lock: a counter-roll kick (about 1.5 degrees, against the mark's clockwise turns) on each
        // downbeat and quarter turn, settling firmly; a slow push that swells and returns to rest for the cut,
        // with a small accent on the snares; zoomed enough to cover the corners while rolled.
        let rot = 0, accent = 0;
        for (const b of KICKS) {
          const x = T - b;
          if (x < 0 || x > 0.5) continue;
          rot -= 0.026 * Math.sin(Math.min(x / 0.07, 1) * Math.PI / 2) * Math.exp(-Math.max(0, x - 0.07) / 0.1) * (1 - OM.prog(x, 0, 0.5));
        }
        for (const b of SNARES) {
          const x = T - b;
          if (x >= 0 && x < 0.4) accent += 0.012 * Math.exp(-x / 0.1) * (1 - x / 0.4);
        }
        accent *= 1 - OM.smooth(OM.prog(T, 28.5, 28.6)); // the last snare's accent is spent before the cut
        const push = 0.045 * Math.sin(Math.PI * OM.smooth(OM.prog(T, LAND + 0.6, 28.5)));
        const zoom = Math.max(1 + punch + push + accent, 1 + 1.85 * Math.abs(rot));
        fx.apply(T, {
          amount: pre ? Math.pow(g, 1.5) : 0,
          cam: pre ? { zoom: 1 + 0.12 * g + thump, rot: -0.05 * g } : { zoom, rot },
          p0: [2.4, 0.95 - 0.5 * g, cX / 1920, 1 - cY / 1080],
        });
      },
      release: () => {
        fx.release();
        c.release();
      },
    };
  },
});
