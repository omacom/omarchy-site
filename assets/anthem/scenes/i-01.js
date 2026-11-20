// i-01 · Sleeping machine. A console nearly the frame's width sits in the
// dark, its silhouette rim-lit by its standby LED, which breathes on the
// downbeats and pools its light on the desk. On the 5.06 downbeat it wakes:
// three fans behind their grilles spin up through the hi-hat roll, light leaks
// through the grilles and the vent slot onto the desk, the LED flickers on the
// eighths. On the 7.22 downbeat the LED goes solid and the cursor appears in
// the slot; the console stretches up once, then squashes down into its slot,
// the fans spin down and their light streams out along the slot as beads, and
// the cursor types the slot out to both frame edges, accelerating with the
// roll: the slot, stretched, is the horizon i-02 opens on.

// Edit camera: still while the machine sleeps (the LED's breath is the only pulse in that
// bar), then it wakes with it on the 5.01 downbeat; the two downbeats that turn the scene
// (the wake and the 7.18 hit) punch harder than the section's default.
OM.edit.plan('i-01', { skip: [2.848, 3.388, 3.928, 4.468], down: 2 });

// OM.intro: painters the whole intro shares (scene files load in order).
OM.intro = (() => {
  const L = OM.HOME;
  const ink = OM.fieldInks('tokyo-night');
  const INKS = [ink.dim, ink.mid, ink.lit, ink.hover, ink.crest];
  const home = OM.cellAt(L, 960, 540);
  const word = OM.WORDMARK;
  const HR = word.h; // the horizon row, right under the wordmark
  const HY = L.y0 + (HR + 0.5) * L.ch; // the horizon's centre line: the console's slot sits on it too
  // The dawn lattice: the wordmark 1440px wide (75% of the frame), centred, its horizon row on HY.
  const chD = (1440 / word.w) * (950 / 4131) * (word.w / word.h);
  const LD = OM.lattice({ wordWidth: 1440, wordX: 240, wordY: HY - (HR + 0.5) * chD });
  const C0 = LD.cMin, C1 = LD.cMin + LD.cols, R0 = LD.rMin, R1 = LD.rMin + LD.rows;
  const W = C1 - C0;
  const WM = new Uint8Array(word.w * word.h);
  for (let r = 0; r < word.h; r++) for (let c = 0; c < word.w; c++) WM[r * word.w + c] = word.rows[r][c] === '1' ? 1 : 0;
  const inWord = (c, r) => r >= 0 && r < word.h && c >= 0 && c < word.w && WM[r * word.w + c] === 1;
  const MIDC = Math.floor(word.w / 2); // the frame's centre column, where the cursor is born
  const CUR = { col: word.w + 2, r0: 1 }; // the text cursor after the last letter: a 2-cell bar standing on the horizon
  const inCursorBox = (c, r) => c >= CUR.col && c <= CUR.col + 1 && r >= CUR.r0 && r < HR;

  // The letters: runs of non-empty columns, a run too wide for one letter split at its thinnest column.
  const colN = (c) => { let n = 0; for (let r = 0; r < word.h; r++) n += WM[r * word.w + c]; return n; };
  const LETTERS = [];
  for (let c = 0, s0 = -1; c <= word.w; c++) {
    const e = c === word.w || colN(c) === 0;
    if (!e && s0 < 0) s0 = c;
    if (e && s0 >= 0) {
      if (c - s0 > 18) {
        let m = s0 + 6;
        for (let k = s0 + 6; k < c - 6; k++) if (colN(k) < colN(m)) m = k;
        LETTERS.push([s0, m - 1], [m, c - 1]);
      } else LETTERS.push([s0, c - 1]);
      s0 = -1;
    }
  }
  const letterOf = new Int8Array(word.w).fill(-1);
  LETTERS.forEach(([a, b], i) => { for (let c = a; c <= b; c++) letterOf[c] = i; });
  const TYPED = OM.beatOnset(11.424); // the downbeat the last letter is up on (its drum onset, 11.368)
  // One letter per eighth of the measured beats (each onset and the midpoint to the next), the last on the
  // downbeat; the cursor runs back along the horizon first. (Stepping back by the fixed tempo instead put the
  // first three letters 15 ms behind their beats.)
  const BO = (OM.T && OM.T.beatsOn) || [];
  const E8 = [];
  for (let i = 0; i + 1 < BO.length; i++) E8.push(BO[i], (BO[i] + BO[i + 1]) / 2);
  const k8 = E8.findIndex((x) => Math.abs(x - TYPED) < 0.005);
  const LT = LETTERS.map((_, i) => (k8 >= LETTERS.length ? E8[k8 - (LETTERS.length - 1 - i)] : TYPED - (LETTERS.length - 1 - i) * (OM.SPB / 2)));
  /** Rows a letter still sits below its home at T: the whole height, rising out of the line with an overshoot, then 0. */
  const lift = (i, T) => {
    const q = OM.ease.outBack(OM.prog(T, LT[i] - 0.14, LT[i] + 0.1), 2.2);
    return Math.round((1 - q) * (word.h + 1));
  };
  /** Ink index for light `lum` at a cell, dithered by the field's threshold; -1 is dark. */
  const level = (lum, col, row) => {
    const h = lum - OM.threshold(col, row);
    return h <= 0 ? -1 : h > 1.0 ? 4 : h > 0.62 ? 3 : h > 0.33 ? 2 : h > 0.12 ? 1 : 0;
  };
  const at = (col, row) => (row - R0) * W + (col - C0);
  /** A full dawn-lattice ink index buffer, painted one fillStyle per ink. */
  const buf = new Int8Array(W * LD.rows);
  const PAINT = [...INKS, ink.bg]; // 5: the background, painted over the dawn glow (letter bodies, keyline)
  const flush = (ctx, dpr) => {
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = PAINT[i];
      for (let k = 0; k < buf.length; k++) if (buf[k] === i) OM.cell(ctx, LD, C0 + (k % W), R0 + ((k / W) | 0), dpr);
    }
  };

  // Distance (in cells, Chebyshev) from the letters and the cursor bar: 1 is the dark keyline, 2-3 the halo.
  const DIST = new Uint8Array(W * LD.rows).fill(9);
  for (let row = R0; row < HR; row++)
    for (let col = C0; col < C1; col++) {
      let d = 9;
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++)
          if (inWord(col + dx, row + dy) || inCursorBox(col + dx, row + dy)) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
      DIST[at(col, row)] = d;
    }

  /** The cut between i-01 and i-02: the night and one bright, crisp horizon (the stretched slot), the cursor on it. */
  const wake = (ctx, dpr) => {
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.fillStyle = ink.hover;
    for (let col = C0; col < C1; col++) if (col !== MIDC) OM.cell(ctx, LD, col, HR, dpr);
    ctx.fillStyle = ink.crest;
    OM.cell(ctx, LD, MIDC, HR, dpr);
  };

  // ---- the dawn (i-02, and the frame i-03 opens on) ----
  const DAWN0 = OM.beatOnset(9.265); // the downbeat the sun ignites on (its drum onset, 9.222)
  // The letters ignite on the hit's attack: 12.986, the onset of that beat. (OM.T.drums puts a kick at 12.962, but
  // the song's attack is at 12.984-12.986 in every band; that search stopped 40 ms after the old 12.934 and missed it.)
  const KICK = OM.beatOnset(13.026);
  const DB2 = OM.beatOnset(13.584); // and blaze fully, on that downbeat's drum hit
  const FREEZE = 19.96; // the dawn holds from here, so i-02's last frames and i-03's first are one picture
  const BEATS = OM.downbeatsIn(DAWN0 + 0.5, FREEZE).map((b) => OM.beatOnset(b));
  const BLINK = OM.beatsIn(7.5, DAWN0).map((b) => OM.beatOnset(b)); // the waiting cursor's beats, at their drum onsets
  const SNARES = [9.61, 14.068, 16.03]; // measured (OM.T.drums)
  const HATS = [13.932, 17.81]; // the hi-hat roll, from its first measured hat
  // The hats the standing cursor blinks on through the roll (a sixteenth either side of each beat), measured on
  // the song at 2 ms; the fixed tempo drifted up to 42 ms behind them by the roll's end.
  const BLINKS = [14.204, 14.47, 14.74, 15.01, 15.282, 15.552, 15.824, 16.092, 16.366, 16.634, 16.902, 17.172, 17.44, 17.712];
  const SC = word.w / 2; // the sun's column: the centre of the frame
  const sunRow = (T) => OM.lerp(HR + 2, 8, OM.ease.outCubic(OM.prog(Math.min(T, FREEZE), DAWN0, KICK + 0.6)));
  /** The cursor at T: a single cell gliding along the horizon to after the last letter, then a bar rising on the downbeat, blinking on the hats. */
  const cursor = (T) => {
    if (T < DAWN0) {
      // Waiting at the centre, blinking on the beats.
      const b = OM.lastHit(BLINK, T);
      return { col: MIDC, top: HR, on: T < 8.0 || b === null || T - b < OM.SPB * 0.55 };
    }
    if (T < TYPED) {
      // Runs back along the horizon to the start, then types: it steps to after each letter as the letter rises.
      if (T < LT[0] - 0.1) return { col: Math.round(OM.lerp(MIDC, LETTERS[0][0] - 3, OM.ease.inOutCubic(OM.prog(T, DAWN0, DAWN0 + 0.3)))), top: HR, on: true };
      let k = 0;
      while (k + 1 < LT.length && T >= LT[k + 1] - 0.1) k++;
      const from = k === 0 ? LETTERS[0][0] - 3 : LETTERS[k - 1][1] + 3;
      return { col: Math.round(OM.lerp(from, LETTERS[k][1] + 3, OM.ease.outCubic(OM.prog(T, LT[k] - 0.1, LT[k])))), top: HR, on: true };
    }
    const top = Math.round(OM.lerp(HR, CUR.r0, OM.clamp(OM.ease.outBack(OM.prog(T, TYPED, TYPED + 0.2)), 0, 1.1)));
    // Through the roll it blinks on the hats: lit round each beat, dark round its off-beat.
    const on = T < HATS[0] || T >= HATS[1] || OM.hitCount(BLINKS, T) % 2 === 0;
    return { col: CUR.col, top: Math.max(0, top), on };
  };

  /**
   * Dawn behind the name at time T. The light rises off the horizon within the
   * first beat; the sun rises behind the word through the perc roll, its light
   * dithered into the field's texture and shafted by the letters; the word is a
   * crisp dark silhouette with a dark keyline the dither never crosses and a
   * bright rim on the sun side. On the kick and the next downbeat the letters
   * ignite into blazing crest and hover while the sky dims behind them; they
   * breathe on the snares and shimmer on the hats, and the riser swells it all.
   */
  const dawn = (ctx, T, dpr) => {
    T = Math.min(T, FREEZE);
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    buf.fill(-1);
    const D = 0.14 * OM.smooth(OM.prog(T, 7.98, 8.7)) + 0.86 * OM.ease.inOutSine(OM.prog(T, DAWN0, KICK));
    const S = Math.pow(D, 0.55);
    const sy = sunRow(T);
    const sr = 4 + 4 * D;
    const ign = T < KICK ? 0 : T < DB2 ? 0.62 * OM.ease.outCubic(OM.prog(T, KICK, KICK + 0.1)) : 0.62 + 0.4 * OM.ease.outCubic(OM.prog(T, DB2, DB2 + 0.1));
    const riser = OM.smooth(OM.prog(T, 18.3, 19.9));
    const dim = 1 - 0.62 * OM.smooth(OM.prog(T, KICK, 13.9)) + 0.7 * riser; // the sky steps back behind the name
    const burst = T >= KICK ? 1.4 * Math.exp(-(T - KICK) / 0.55) : 0;
    const beat = T >= DAWN0 + 0.5 ? 0.35 * OM.pulse(BEATS, T, 0.22) : 0;
    const snare = OM.pulse(SNARES, T, 0.14);
    const hats = T >= HATS[0] && T < HATS[1];
    const reachH = 4 + 16 * D, reachR = 8 + 46 * D, bandH = 1.5 + 30 * D, bandW = 12 + 80 * D;
    const amb = 0.22 * D * D;
    const diffuse = (x, y) => {
      const dx = x - SC, dy = y - sy, d = Math.hypot(dx * 0.8, dy);
      return S * (1.1 * Math.exp(-d / reachH) + 0.9 * Math.exp(-(HR - y) / bandH) * (0.25 + 0.75 * Math.exp(-Math.abs(dx) / bandW)) + amb);
    };
    const tex = (col, row) => 0.6 + 0.55 * OM.heroNoise(col / 9 + T * 0.14, row / 9 - T * 0.055);
    const rimOn = OM.smooth(OM.prog(D, 0.12, 0.45));
    const cur = cursor(T);
    const shimmerTick = Math.floor(T * 15);
    // The letters as shown: each risen by its own amount (all home once typed).
    const lifts = LETTERS.map((_, i) => lift(i, T));
    const rising = lifts.some((o) => o !== 0);
    const barUp = T >= TYPED; // the cursor's bar (and its keyline) only once it stands
    const shown = !rising ? inWord : (c, r) => {
      if (r >= HR || c < 0 || c >= word.w) return false;
      const i = letterOf[c];
      return i >= 0 && lifts[i] <= word.h && inWord(c, r - lifts[i]);
    };
    // Distance to the shown letters (the keyline and halo), recomputed only while they rise.
    const near = !rising ? (c, r) => DIST[at(c, r)] : (c, r) => {
      if (c < -4 || c > word.w + 4 || r < -4) return 9;
      let d = 9;
      for (let dy = -3; dy <= 3 && d > 1; dy++)
        for (let dx = -3; dx <= 3; dx++) if (shown(c + dx, r + dy) || (barUp && inCursorBox(c + dx, r + dy))) d = Math.min(d, Math.max(Math.abs(dx), Math.abs(dy)));
      return d;
    };
    // The dawn glow: a clear gradient rising off the horizon from the cut, building through the perc roll,
    // stepping back as the name ignites (and gone well before the hold, so i-03's sampled frame is unchanged).
    const glow = OM.smooth(OM.prog(T, 7.98, 8.7)) * (0.45 + 0.55 * OM.smooth(OM.prog(T, 10.12, KICK))) * (1 - OM.smooth(OM.prog(T, KICK, 13.9)));
    if (glow > 0) {
      const [r, g, b] = OM.rgb(ink.lit);
      const reach = 260 + 300 * OM.smooth(OM.prog(T, 7.98, KICK));
      const gr = ctx.createLinearGradient(0, HY, 0, HY - reach);
      gr.addColorStop(0, `rgba(${r},${g},${b},${0.42 * glow})`);
      gr.addColorStop(0.35, `rgba(${r},${g},${b},${0.16 * glow})`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(0, HY - reach, 1920, reach);
      const lk = ctx.createLinearGradient(0, HY, 0, HY + 150);
      lk.addColorStop(0, `rgba(${r},${g},${b},${0.18 * glow})`);
      lk.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = lk;
      ctx.fillRect(0, HY, 1920, 150);
    }
    const BG = glow > 0 ? 5 : -1; // over the glow, dark cells must be painted dark

    for (let row = R0; row < R1; row++) {
      const y = row + 0.5;
      for (let col = C0; col < C1; col++) {
        const x = col + 0.5;
        let id = -1;
        if (row < HR) {
          const dist = near(col, row);
          if (shown(col, row)) {
            if (ign > 0 && OM.threshold(col, row) < ign) {
              // Ignited: blazing crest and hover, shimmering on the hats, flaring on the snares.
              let v = OM.heroNoise(col / 6 + T * 0.5, row / 6 - T * 0.2) + 0.3 * (1 - row / 16) + 0.5 * snare + 0.3 * riser;
              if (hats && OM.hash(col, row, shimmerTick) < 0.1) v = 1.1 - v;
              id = v > 0.62 ? 4 : 3;
            } else {
              // Silhouette: dark, its sun-side and top edges rim-lit.
              const nb = col + 0.5 < SC ? col + 1 : col - 1;
              id = BG;
              if (!shown(nb, row) || !shown(col, row - 1)) {
                // A rising letter's edge catches the light hard; then the sun's rim takes over.
                const i = letterOf[col], age = i >= 0 ? T - LT[i] : 9;
                const r = Math.max(1.4 * diffuse(x, y) * rimOn, age < -0.14 ? 0 : age < 0.15 ? 1.2 : age < 2 ? 0.75 - 0.2 * age : 0);
                const rid = r > 1.0 ? 4 : r > 0.6 ? 3 : r > 0.3 ? 2 : r > 0.1 ? 1 : -1;
                if (rid >= 0) id = rid;
              }
            }
          } else if (barUp && inCursorBox(col, row)) {
            id = BG; // drawn below
          } else if (dist === 1) {
            id = BG; // the keyline: the dither (and the glow) never touch the letters
          } else {
            const dx = SC - x, dy = sy - y, d = Math.hypot(dx * 0.8, dy);
            let lum = diffuse(x, y);
            if (S > 0) {
              // Direct light: the disk and its shafts, blocked by the letters.
              let blocked = 0;
              const n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)));
              for (let k = 1; k < n && blocked < 2; k++) if (shown(Math.floor(x + (dx * k) / n), Math.floor(y + (dy * k) / n))) blocked++;
              const vis = blocked ? 0.12 : 1;
              const disk = 1.8 * OM.clamp((sr - d) / 1.5);
              const shaft = (1.1 + burst + beat + 0.25 * snare + 0.8 * riser) * Math.exp(-d / reachR);
              lum = lum * (blocked ? 0.3 : 0.8) + S * vis * (disk + shaft);
            }
            lum *= dim;
            // The halo round the lit name, breathing on the snares.
            if (dist <= 3 && ign > 0) lum += Math.min(1, ign) * (dist === 2 ? 0.55 : 0.28) * (0.6 + 1.2 * snare + 0.6 * riser);
            id = level(lum * tex(col, row), col, row);
            if (row < HR - 3 && OM.hash(col, row, 7) < 0.016) {
              // Stars: out within the first beat, fading as the sky lights.
              const s = (0.35 + 0.65 * OM.hash(col, row, 8)) * (0.7 + 0.3 * Math.sin(T * 2.3 + 40 * OM.hash(col, row, 9)))
                * OM.smooth(OM.prog(T, 7.98, 8.45)) * (1 - OM.smooth(OM.prog(D, 0.35, 0.8))) * (1 + 0.6 * snare);
              const st = s > 0.8 ? 2 : s > 0.5 ? 1 : s > 0.2 ? 0 : -1;
              if (st > id) id = st;
            }
          }
        } else if (row === HR) {
          // The horizon: the console's slot, bright; the ignition flash runs out along it from the cursor.
          id = Math.max(3, level(1.3 * diffuse(x, y), col, row));
          const age = T - (DAWN0 + Math.abs(x - (MIDC + 0.5)) / 90);
          if (age >= 0 && age < 0.08) id = 4;
        } else {
          // The lake: the sky mirrored, fading with depth, broken into ripples.
          const m = 2 * HR + 1 - y;
          const rip = 0.55 + 0.45 * Math.sin(col * 0.9 + row * 2.1 + T * 1.7);
          id = level(0.42 * dim * diffuse(x, m) * Math.exp(-(row - HR - 1) / 6) * rip * tex(col, row), col, row);
        }
        buf[at(col, row)] = id;
      }
    }
    // The cursor.
    if (cur.on) for (let row = cur.top; row <= HR; row++) for (let k = 0; k < (row === HR ? 1 : 2); k++) buf[at(cur.col + k, row)] = 4;
    flush(ctx, dpr);
  };

  return { TYPED, sunRow, DAWN0, KICK, L, LD, HY, ink, INKS, home, HR, MIDC, C0, C1, R0, R1, level, buf, at, flush, wake, dawn, FREEZE };
})();

OM.scene({
  id: 'i-01',
  build(el) {
    const cv = document.createElement('canvas');
    cv.className = 'om-fill';
    el.appendChild(cv);
    const c = OM.canvas(cv, { alpha: false });
    // Dark-room halation: bright light blooms into a soft green haze, strongest round the LED.
    const fx = OM.post(el, c, { effect: `
vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec4 c = src(p);
  if (uAmount <= 0.0) return c;
  vec3 b = vec3(0.0);
  vec2 asp = vec2(uRes.y / uRes.x, 1.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996, r = sqrt(float(i) + 0.5) / 4.5 * uP0.x;
    b += max(src(p + vec2(cos(a), sin(a)) * r * asp).rgb - 0.22, 0.0);
  }
  b = min(b / 20.0, vec3(0.16)); // capped, so the console's shape survives the hit
  vec2 d = (p - uP1.xy) / asp;
  float led = exp(-length(d) / 0.07) * uP1.z;
  vec3 lit = vec3(0.62, 0.81, 0.42);
  return vec4(c.rgb + (b * uP0.y * vec3(0.8, 1.0, 0.65) + lit * led * 0.35) * uAmount, 1.0);
}` });
    const { L, LD, HY, ink, INKS, HR, MIDC, C0, C1, level, buf, at, flush, wake } = OM.intro;
    const END = 7.94;
    const DB = [2.902, 5.062, 7.221].map((b) => OM.beatOnset(b)); // the downbeats at their drum onsets: 2.848, 5.013, 7.178
    const WAKE = DB[1], SOLID = DB[2];
    const BREATH = DB[1] - DB[0];
    // The hats the awake LED flickers on, one per eighth (measured on the song at 2 ms; the fixed tempo drifted
    // up to 27 ms behind them): bright on the beats, dim on the off-beats.
    const FLICK = [5.286, 5.554, 5.822, 6.092, 6.364, 6.634, 6.904];
    const BEATS = OM.beatsIn(0.5, 7.221).map((b) => OM.beatOnset(b)); // the cursor blinks on the drum onsets

    // ---- the console, on a lattice 1.5x the home one, its vent slot on the horizon's line ----
    const LM = OM.lattice({ wordWidth: 1770, wordX: 75, wordY: HY - 19.5 * L.ch * 1.5 });
    const PC1 = 80, PR0 = 6, PR1 = 21, SR = 19, DEPTH = 3; // front face cols 0..80, rows 6..21; the box recedes up-right
    const FANS = [14.5, 31.5, 48.5].map((col) => ({ col, row: 13.5 }));
    const FR = 5.2;
    const LED = { col: 73, row: 10 };
    const CUR = { c0: 39, c1: 41, r0: 10, r1: 14 }; // the big block cursor on the console's face, centred in frame
    const SLOT = [4, 76];
    const solid = (lum) => (lum > 1 ? 3 : lum > 0.6 ? 2 : lum > 0.3 ? 1 : lum > 0.08 ? 0 : -1);
    /** What a lattice cell is: 'F' front face, 'T' top face, 'S' side face, 'E' an edge, or null. */
    const part = (col, row) => {
      if (col >= 0 && col <= PC1 && row >= PR0 && row <= PR1) return col === 0 || col === PC1 || row === PR0 || row === PR1 ? 'E' : 'F';
      const k = PR0 - row; // depth above the front's top edge
      if (k >= 1 && k <= DEPTH && col >= k && col <= PC1 + k) return k === DEPTH || col === k || col === PC1 + k ? 'E' : 'T';
      const j = col - PC1; // depth right of the front's right edge
      if (j >= 1 && j <= DEPTH && row >= PR0 - j && row <= PR1 - j) return j === DEPTH || row === PR1 - j ? 'E' : 'S';
      return null;
    };
    const bins = [[], [], [], [], []];
    const put = (id, col, row) => { if (id >= 0) bins[Math.min(4, id)].push(col, row); };
    const ledX = LM.x0 + (LED.col + 0.5) * LM.cw, ledY = LM.y0 + (LED.row + 0.5) * LM.ch;
    const fanX = FANS.map((f) => LM.x0 + f.col * LM.cw);
    const MOTES = Array.from({ length: 46 }, (_, i) => ({
      x: ledX - 420 + 760 * OM.hash(i, 1, 31), y: ledY - 330 + 560 * OM.hash(i, 2, 31),
      vx: -6 - 10 * OM.hash(i, 3, 31), vy: 4 + 8 * OM.hash(i, 4, 31), ph: 6.283 * OM.hash(i, 5, 31), s: 2 + 2 * OM.hash(i, 6, 31),
    }));

    // Fan speed: still until the wake, spinning up through the roll, spinning down after the hit.
    const P_UP = 7.6 - WAKE;
    const revsUp = (t) => { const p = OM.prog(t, WAKE, 7.6); return 7 * p * p * p; };
    const rateUp = (t) => 21 * Math.pow(OM.prog(t, WAKE, 7.6), 2) / P_UP;
    const R0S = rateUp(SOLID), TAU = 0.18;
    const revs = (t) => (t < SOLID ? revsUp(t) : revsUp(SOLID) + R0S * TAU * (1 - Math.exp(-(t - SOLID) / TAU)));
    const rate = (t) => (t < SOLID ? rateUp(t) : R0S * Math.exp(-(t - SOLID) / TAU)); // rev/s

    /** Squash of the console into its slot after the hit: a stretch of anticipation, then down hard. */
    const squash = (t) => {
      if (t < SOLID) return 1;
      if (t < SOLID + 0.1) return 1 + 0.05 * Math.sin(Math.PI * OM.prog(t, SOLID, SOLID + 0.1));
      return 1 - OM.ease.inCubic(OM.prog(t, SOLID + 0.1, SOLID + 0.4));
    };
    const LAND = SOLID + 0.24; // the cursor lands in the slot
    const TYPE0 = LAND, TYPE1 = END - 0.12;

    return {
      render(t) {
        const ctx = c.ensure();
        const dpr = c.dpr;
        if (t >= END - 0.1) {
          wake(ctx, dpr);
          return fx.apply(t);
        }
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, 1080);
        buf.fill(-1);
        for (const b of bins) b.length = 0;

        // The raking light: sweeps across the console on the perc roll, leaving its rim lit.
        const rakeOn = OM.smooth(OM.prog(t, 1.0, 1.7));
        const sweep = OM.lerp(-25, 115, OM.ease.inOutSine(OM.prog(t, 1.1, 3.4)));
        const rest = 0.3 * OM.smooth(OM.prog(t, 1.8, 3.4));
        const rake = (col, row) => rakeOn * (1.25 * Math.exp(-((((col + 0.6 * (PR0 - row)) - sweep) / 9) ** 2)) + rest);
        // The LED: its first breath on the 2.90 downbeat, then breathing, eighth-note flicker once awake, solid on the hit.
        let B;
        if (t < DB[0]) B = OM.smooth(OM.prog(t, 2.62, DB[0]));
        else if (t < WAKE) B = 0.25 + 0.75 * (0.5 + 0.5 * Math.cos((2 * Math.PI * (t - DB[0])) / BREATH));
        else if (t < SOLID) B = OM.hitCount(FLICK, t) % 2 ? 0.55 : 1;
        else B = 1.15;
        const F = t < WAKE ? 0 : t < SOLID ? 0.3 + 0.9 * OM.ease.inCubic(OM.prog(t, WAKE, SOLID)) : 1.2 * Math.exp(-(t - SOLID) / 0.25);
        const phi = 2 * Math.PI * revs(t);
        const spd = rate(t);
        const trail = Math.min(0.32, spd * 0.03); // radians between trail copies
        const hit = t >= SOLID ? Math.exp(-(t - SOLID) / 0.2) : 0;
        const sq = squash(t);

        for (let row = PR0 - DEPTH - 1; row <= PR1 + 12; row++) {
          for (let col = -3; col <= PC1 + DEPTH + 3; col++) {
            const ldx = col - LED.col, ldy = row - LED.row, ld = Math.hypot(ldx, ldy);
            const rk = rake(col, row);
            const pt = part(col, row);
            let id = -1;
            if (pt === 'E') {
              id = solid(rk + 1.1 * B * Math.exp(-ld / 26) + 0.7 * F);
            } else if (pt === 'T' || pt === 'S') {
              const k = pt === 'T' ? 1.35 : 0.55; // the top catches the light, the side turns away
              id = level(k * (0.6 * rk + 0.5 * B * Math.exp(-ld / 14) + 0.25 * F), col, row);
            } else if (pt === 'F') {
              // The front: a dithered face, with the fans behind their grilles and the vent slot.
              let lum = 0.32 * rk + 0.75 * B * Math.exp(-ld / 9) + 0.18 * F;
              id = level(lum, col, row);
              for (const f of FANS) {
                const dx = col + 0.5 - f.col, dy = row + 0.5 - f.row, d = Math.hypot(dx, dy);
                if (d > FR + 0.4) continue;
                if (d > FR - 0.5) id = solid(0.9 * rk + 0.5 * B * Math.exp(-ld / 30) + 0.8 * F); // the ring
                else if (row % 2 === 0) id = solid(0.35 * rk + 0.25 * F); // grille bars, in front
                else if (d < 1.2) id = solid(0.4 * rk); // the hub
                else {
                  // The blades behind, catching light, with motion trails once they spin.
                  const th = Math.atan2(dy, dx);
                  let bl = 0;
                  for (let k = 0; k < 4; k++) {
                    if (k && trail < 0.02) break;
                    if (Math.cos(5 * (th - phi + k * trail)) > 0.55) { bl = 1 - k / 4; break; }
                  }
                  id = level(bl * (0.55 * rk + F * (1.25 + 0.3 * hit)) + 0.08 * F, col, row);
                }
              }
              if (row === SR && col >= SLOT[0] && col <= SLOT[1]) {
                const flick = 0.7 + 0.3 * Math.sin(col * 0.6 - phi * 5) * OM.clamp(1 - spd / 3);
                id = solid(F * 1.4 * flick + 0.5 * rk + 0.4 * B * Math.exp(-ld / 20) + (t >= SOLID ? 1.2 : 0));
              }
              if (col === LED.col && row === LED.row) id = B > 1.05 ? 4 : B > 0.75 ? 3 : B > 0.45 ? 2 : B > 0.2 ? 1 : B > 0.06 ? 0 : -1;
            } else if (row > PR1) {
              // The desk: the LED's pool, and light from the grilles raking across it toward us.
              const dz = row - PR1 - 1;
              let lum = 1.0 * B * Math.exp(-((ldx / 12) ** 2 + (dz / 3.5) ** 2) * 1.4);
              const across = col >= SLOT[0] && col <= SLOT[1] ? 1 : Math.exp(-Math.min(Math.abs(col - SLOT[0]), Math.abs(col - SLOT[1])) / 3);
              lum += F * 0.7 * across * Math.exp(-dz / 2.4) + 0.25 * rk * Math.exp(-dz / 2);
              for (const f of FANS) {
                const cx = f.col - 1.1 * dz; // the beams rake down and to the left
                lum += F * 1.1 * (0.8 + 0.2 * Math.cos(5 * phi)) * Math.exp(-(((col + 0.5 - cx) / (3 + dz * 0.5)) ** 2)) * Math.exp(-dz / 6);
              }
              id = level(lum, col, row);
            }
            put(id, col, row);
          }
        }

        // Draw the console, squashed toward its slot after the hit (the slot row keeps its height, thinning to the horizon's;
        // in the stretch before it, it grows with its neighbours so their edges still butt).
        const ch = LM.ch, slotH = Math.max(OM.lerp(LD.ch, ch, sq), ch * sq);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = INKS[i];
          const a = bins[i];
          for (let k = 0; k < a.length; k += 2) {
            const col = a[k], row = a[k + 1];
            const x = Math.round((LM.x0 + col * LM.cw) * dpr) / dpr, x2 = Math.round((LM.x0 + (col + 1) * LM.cw) * dpr) / dpr;
            let y, y2;
            if (sq === 1) {
              y = Math.round((LM.y0 + row * ch) * dpr) / dpr;
              y2 = Math.round((LM.y0 + (row + 1) * ch) * dpr) / dpr;
            } else if (row === SR) {
              y = Math.round((HY - slotH / 2) * dpr) / dpr;
              y2 = Math.round((HY + slotH / 2) * dpr) / dpr;
            } else {
              const ya = HY + (LM.y0 + row * ch - HY) * sq, yb = HY + (LM.y0 + (row + 1) * ch - HY) * sq;
              if (Math.abs(yb - ya) < 0.35) continue;
              y = Math.round(ya * dpr) / dpr;
              y2 = Math.round(yb * dpr) / dpr;
            }
            ctx.fillRect(x, y, x2 - x, y2 - y);
          }
        }

        // The cursor: alone in the void from the perc roll, blinking on the beats; solid once awake;
        // on the hit it rises a cell, then drops into the slot and types it out to both edges.
        if (t >= 0.557 && t < LAND) {
          const b = OM.lastHit(BEATS, t);
          const on = t >= WAKE || b === null || t - b < OM.SPB * 0.55;
          if (on) {
            let top = CUR.r0, h = CUR.r1 - CUR.r0 + 1;
            if (t >= SOLID) {
              const up = Math.sin(Math.PI * OM.prog(t, SOLID, SOLID + 0.08));
              const fall = OM.ease.inCubic(OM.prog(t, SOLID + 0.08, LAND));
              top = CUR.r0 - up + (SR - CUR.r0) * fall;
              h = OM.lerp(h + 0.4 * up, 1, fall);
            }
            const y = LM.y0 + top * LM.ch;
            if (t < SOLID) {
              // Its soft glow in the void.
              const [r, g, b2] = OM.rgb(ink.lit);
              const gl = ctx.createRadialGradient(960, y + 55, 0, 960, y + 55, 190);
              gl.addColorStop(0, `rgba(${r},${g},${b2},0.22)`);
              gl.addColorStop(1, `rgba(${r},${g},${b2},0)`);
              ctx.fillStyle = gl;
              ctx.fillRect(770, y - 135, 380, 380);
            }
            ctx.fillStyle = ink.crest;
            const x = Math.round((LM.x0 + CUR.c0 * LM.cw) * dpr) / dpr, x2 = Math.round((LM.x0 + (CUR.c1 + 1) * LM.cw) * dpr) / dpr;
            ctx.fillRect(x, Math.round(y * dpr) / dpr, x2 - x, Math.max(1, Math.round(h * LM.ch * dpr) / dpr));
          }
        }
        if (t >= LAND) {
          const span = Math.max(MIDC - C0, C1 - 1 - MIDC);
          const reach = span * OM.ease.inCubic(OM.prog(t, TYPE0, TYPE1));
          for (let k = 1; k <= Math.floor(reach + 1e-4); k++) {
            const age = t - (TYPE0 + (TYPE1 - TYPE0) * Math.cbrt(k / span));
            const id = age < 0.05 ? 4 : 3;
            for (const col of [MIDC - k, MIDC + k]) if (col >= C0 && col < C1) buf[at(col, HR)] = id;
          }
          buf[at(MIDC, HR)] = 4;
        }
        // Beads: the fans' light streaming out along the slot, accelerating off the frame.
        if (t >= SOLID + 0.08) {
          for (let f = 0; f < 3; f++)
            for (let j = 0; j < 6; j++) {
              const tj = SOLID + 0.08 + j * 0.035 + 0.01 * f, age = t - tj;
              if (age < 0) continue;
              const dir = j % 2 ? 1 : -1;
              for (let k = 0; k < 3; k++) {
                const x = fanX[f] + dir * (20 + 14000 * Math.max(0, age - k * 0.012) ** 2);
                const col = Math.floor((x - LD.x0) / LD.cw);
                if (col >= C0 && col < C1) buf[at(col, HR)] = Math.max(buf[at(col, HR)], k ? 3 : 4);
              }
            }
        }
        flush(ctx, dpr);

        // Motes in the LED's light.
        for (const m of MOTES) {
          const x = m.x + m.vx * t + 14 * Math.sin(t * 0.7 + m.ph), y = m.y + m.vy * t + 9 * Math.sin(t * 0.5 + 2 * m.ph);
          const a = 0.85 * Math.min(B, 1) * sq * Math.exp(-Math.hypot(x - ledX, (y - ledY) * 1.3) / 190);
          if (a < 0.03) continue;
          ctx.globalAlpha = a;
          ctx.fillStyle = ink.hover;
          ctx.fillRect(x, y, m.s, m.s);
        }
        ctx.globalAlpha = 1;

        // Camera: a slow push-in from the cursor's first blink, with a faint breath; released into the transformation, at rest for the cut.
        const settle = 1 - OM.smooth(OM.prog(t, SOLID, END - 0.16));
        const zoom = 1 + (0.07 * OM.smooth(OM.prog(t, 0.557, SOLID)) + 0.004 * (t > DB[0] ? 1 : 0) * (0.5 + 0.5 * Math.sin((2 * Math.PI * (t - DB[0])) / BREATH))) * settle;
        fx.apply(t, {
          amount: OM.post.envelope(t, 0, END, { ramp: 0.6, hold: 0.1 }) * (0.4 + 0.6 * Math.min(B, 1)),
          cam: { zoom },
          p0: [0.045, 1.2, 0, 0],
          p1: [ledX / 1920, 1 - ledY / 1080, Math.min(B, 1.1), 0],
        });
      },
      release: () => {
        fx.release();
        c.release();
      },
    };
  },
});
