// Frame effects: a page-wide layer above the scenes and below the captions that
// draws only in a 40px band along the frame's edges, all the way round, in every
// sentence that leaves a margin empty (assets/lib/frame-need.js, measured by
// scripts/edge-need.mjs), and subtler where only some margins are empty. One
// idea per section, synced to the kicks, snares and beats measured on the song,
// each with its own way in and out. Every pixel is a pure function of song time
// T: the on/off schedule is fixed at load, and the envelope is 0 at every edge
// of an on stretch, so nothing steps at a cut.
(() => {
  const N = window.OM_FRAME_NEED;
  if (!N || !OM.T) return;
  /** The beat grid runs 46 ms late against the drums: used only if the measured beats are missing. */
  const BEAT_FIX = 0.046;
  const W = 1920, H = 1080, C = 10, DEPTH = 4, B = C * DEPTH, P = 2 * (W + H);
  const SPB = OM.SPB;
  const clamp = OM.clamp, E = OM.ease;
  // Beats and downbeats on the drum, as measured on the song (OM.T.beatsOn, analysis/refine_events.py).
  const beats = OM.T.beatsOn || OM.T.beats.map((b) => b - BEAT_FIX), downs = OM.T.downbeatsOn || OM.T.downbeats.map((b) => b - BEAT_FIX);
  const KICK = N.kick.map((e) => e[0]), KICK_E = N.kick.map((e) => e[1]);
  const SNARE = N.snare.map((e) => e[0]), HAT = N.hihat.map((e) => e[0]);

  // ---------- music ----------
  /** Index of the last x <= t, or -1. */
  const last = (xs, t) => {
    let lo = 0, hi = xs.length - 1, r = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (xs[m] <= t) { r = m; lo = m + 1; } else hi = m - 1;
    }
    return r;
  };
  const pulse = (xs, t, half = 0.12) => {
    const i = last(xs, t);
    return i < 0 ? 0 : Math.pow(0.5, (t - xs[i]) / half);
  };
  /** Continuous beat number on the corrected grid. */
  const beatPos = (t) => {
    const i = last(beats, t);
    if (i < 0) return (t - beats[0]) / SPB;
    const a = beats[i], b = i + 1 < beats.length ? beats[i + 1] : a + SPB;
    return i + (t - a) / (b - a);
  };
  const first = (xs, t) => { const i = last(xs, t - 1e-6) + 1; return i < xs.length ? xs[i] : null; }; // first x >= t
  const lastAt = (xs, t) => { const i = last(xs, t); return i >= 0 ? xs[i] : null; }; // last x <= t

  // ---------- band geometry ----------
  // Perimeter columns clockwise from the top-left corner; each holds DEPTH cells, d 0 outermost.
  const COLS = [];
  const col = (side, cx, cy, nx, ny, tx, ty, s, u) => {
    const top = side % 2 === 0;
    const c = { side, s, u, nx, ny, tx, ty, i: COLS.length, dc: top ? Math.min(cx, W - cx) : Math.min(cy, H - cy), dm: top ? Math.abs(cx - W / 2) : Math.abs(cy - H / 2), cells: [] };
    for (let d = 0; d < DEPTH; d++) {
      const x = cx - nx * d * C, y = cy - ny * d * C;
      c.cells.push({ cx: x, cy: y, d, side, s, u, nx, ny, tx, ty, h: OM.hash(x | 0, y | 0, 7), h2: OM.hash(x | 0, y | 0, 11), r: Math.hypot(x - W / 2, y - H / 2) });
    }
    COLS.push(c);
  };
  const NT = W / C, NS = (H - 2 * B) / C; // 192 and 100
  for (let i = 0; i < NT; i++) { const x = i * C + C / 2; col(0, x, C / 2, 0, -1, 1, 0, x, x / W); }
  for (let j = 0; j < NS; j++) { const y = B + j * C + C / 2; col(1, W - C / 2, y, 1, 0, 0, 1, W + y, y / H); }
  for (let i = NT - 1; i >= 0; i--) { const x = i * C + C / 2; col(2, x, H - C / 2, 0, 1, -1, 0, W + H + W - x, (W - x) / W); }
  for (let j = NS - 1; j >= 0; j--) { const y = B + j * C + C / 2; col(3, C / 2, y, -1, 0, 0, -1, 2 * W + H + H - y, (H - y) / H); }
  const NC = COLS.length; // 584
  { // iris radius 0..1 from the nearest band cell to the farthest, so an iris opens from a point
    let lo = Infinity, hi = 0;
    for (const c of COLS) for (const x of c.cells) { lo = Math.min(lo, x.r); hi = Math.max(hi, x.r); }
    for (const c of COLS) for (const x of c.cells) x.r = (x.r - lo) / (hi - lo);
  }
  const BOTTOM0 = NT + NS; // first bottom column (at the right end)

  // ---------- inks ----------
  const F = OM.fieldInks('tokyo-night'), TH = OM.theme('tokyo-night');
  const DIM = 0, MID = 1, LIT = 2, HOVER = 3, CREST = 4, LAV = 5, GRAD = 6, NG = 16;
  const COLORS = [F.dim, F.mid, F.lit, F.hover, F.crest, TH.text];
  // A Hyprland-style active border gradient, in Tokyo Night inks, periodic around the frame.
  for (let g = 0; g < NG; g++) COLORS.push(g < NG / 2 ? OM.mix(TH.text, F.lit, g / (NG / 2)) : OM.mix(F.lit, TH.text, (g - NG / 2) / (NG / 2)));
  const LV = 16; // alpha levels: fine enough that motion, not quantisation, is what changes frame to frame
  const FILL = [], BUCKET = [];
  COLORS.forEach((hex) => {
    const [r, g, b] = OM.rgb(hex);
    for (let l = 0; l < LV; l++) { FILL.push(`rgba(${r},${g},${b},${((l + 1) / LV).toFixed(3)})`); BUCKET.push([]); }
  });

  // ---------- drawing ----------
  // put() runs a cell through the current transition mask (M) into an ink/alpha bucket.
  const M = { a: 1, s: 1, x: 0, y: 0, k: -1 };
  let gain = 1, peak = 0;
  // Subtle rims: inks sit a step softer and 40% dimmer, except in each beat's brief peak flash.
  const soft = (ink) => (peak > 0.5 || ink > CREST ? ink : ink === DIM ? DIM : ink - 1);
  const put = (c, ink, alpha, sc = 1, dx = 0, dy = 0) => {
    const k = c.side;
    if (!S_ON[k]) return; // only sides that are on for this sentence
    M.a = 1; M.s = 1; M.x = 0; M.y = 0; M.k = -1;
    const f = S_F[k];
    if (pass === 1) { // the old idea, carried on along the edge and off its end by the morph front
      if (f < 0) return;
      const e = f * (c.side % 2 ? H - 2 * B : W);
      M.x = c.tx * e; M.y = c.ty * e;
    } else if (f >= 0 && c.u > f) return; // the new idea fills in behind the front
    else if (S_MASK[k]) S_MASK[k](c, S_P[k]);
    const a = alpha * M.a * gain;
    if (a < 0.06) return;
    const z = (C - 2) * sc * M.s;
    if (z < 0.6) return;
    BUCKET[soft((M.k >= 0 ? M.k : ink)) * LV + Math.min(LV - 1, Math.max(0, Math.ceil(a * LV) - 1))].push(c.cx + dx + M.x - z / 2, c.cy + dy + M.y - z / 2, z);
  };

  // ---------- the ideas, one per section ----------
  // Each: draw(T, sec), and mask.in / mask.out (cell, p) with p 0..1 the side's visibility: pure motion,
  // exactly nothing at p = 0, never an opacity ramp.
  const kickStep = new Set(KICK.map((t) => Math.floor(beatPos(t) * 4)));
  const snareStep = new Set(SNARE.map((t) => Math.floor(beatPos(t) * 4)));
  const sideOf = (side, i) => [0, NT, BOTTOM0, BOTTOM0 + NT][side] + i;

  // Music layers shared by the ideas: smoothed vocal and energy, hats as ticks, the age of the last snare.
  const vocal = (T) => { let v = 0; for (let k = 0; k < 4; k++) v += OM.audio(T - k * 0.05).vocal / 4; return clamp(v * 1.3); };
  const energy = (T) => { let e = 0; for (let k = 0; k < 3; k++) { const b = OM.audio(T - k * 0.06).bands; for (let i = 0; i < 16; i++) e += b[i]; } return clamp((e / 48) * 2.2); };
  const age = (xs, T) => { const i = last(xs, T); return i < 0 ? 1e9 : T - xs[i]; };
  const hat = (T) => ({ hp: pulse(HAT, T, 0.05), hi: last(HAT, T) });

  // The mist is painted into a small offscreen image (10 CSS px per pixel) and drawn scaled up with
  // smoothing, so it has no hard edges. Only the outer MIST_D px of each open side carry any density.
  const MW = W / 10, MH = H / 10, MIST_D = 44;
  let mistCv = null, mistCtx = null, mistImg = null, mistOn = false;
  const MIST_A = OM.rgb(F.mid), MIST_B = OM.rgb(TH['text-muted']);
  const slowEnergy = (T) => { let e = 0; for (let k = 0; k < 8; k++) { const b = OM.audio(T - k * 0.12).bands; for (let i = 0; i < 16; i++) e += b[i]; } return clamp((e / 128) * 2.2); };
  function mist(T) {
    if (!mistCv) {
      mistCv = document.createElement('canvas'); mistCv.width = MW; mistCv.height = MH;
      mistCtx = mistCv.getContext('2d'); mistImg = mistCtx.createImageData(MW, MH);
    }
    const px = mistImg.data, gainM = 0.12 + 0.16 * slowEnergy(T);
    px.fill(0);
    const deep = Math.ceil(MIST_D / 10) + 1;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const cx = (x + 0.5) * 10, cy = (y + 0.5) * 10;
      const k = cy < B ? 0 : cy > H - B ? 2 : cx < B ? 3 : cx > W - B ? 1 : -1;
      if (k < 0) { if (x >= deep && x < MW - deep) x = MW - deep - 1; continue; }
      if (!S_ON[k]) continue;
      const d = k === 0 ? cy : k === 2 ? H - cy : k === 3 ? cx : W - cx;
      const u = k === 0 ? cx / W : k === 1 ? cy / H : k === 2 ? (W - cx) / W : (H - cy) / H;
      let shift = 0, thin = 1;
      if (pass === 1) thin = clamp((u - S_F[k]) / 0.15); // hands over: thins along the edge ahead of the cursor
      else if (S_F[k] >= 0) continue;
      else if (S_MASK[k]) shift = (1 - OM.smooth(S_P[k])) * (MIST_D + 20); // rolls in from, and back out to, off-frame
      const prof = clamp(1 - (d + shift) / MIST_D);
      if (prof <= 0 || thin <= 0) continue;
      const n = OM.heroNoise(cx * 0.0045 + T * 0.07, cy * 0.0045 - T * 0.04);
      const m = OM.heroNoise(cx * 0.002 - T * 0.03 + 40, cy * 0.002 + 17);
      const dens = OM.smooth(clamp((n - 0.3) / 0.5)) * prof * prof * thin;
      const i = (y * MW + x) * 4;
      px[i] = MIST_A[0] + (MIST_B[0] - MIST_A[0]) * m; px[i + 1] = MIST_A[1] + (MIST_B[1] - MIST_A[1]) * m; px[i + 2] = MIST_A[2] + (MIST_B[2] - MIST_A[2]) * m;
      px[i + 3] = 255 * gainM * dens;
    }
    mistCtx.putImageData(mistImg, 0, 0);
    mistOn = true;
  }

  const IDEAS = {
    // Edge mist: a slow volumetric haze of low-frequency noise hugging the open sides, in faint field green
    // and blue-grey, swelling only with the slow energy envelope. No beats, no cells, no edges: it is drawn
    // soft (see mist below). It rolls in from off-frame and back out, and at verse 1 it thins along the
    // edge ahead of the typing cursor.
    intro: {
      mask: { in: () => {}, out: () => {} }, // markers: the mist reads its side's phase itself
      draw(T) { mist(T); },
    },
    // Terminal cursor: a block cursor types round the frame a cell per 16th; kicks and snares type bright glyphs.
    // The vocal makes the glyphs taller, a snare runs a carriage-return flash down the line, hats blink the cursor.
    v1: {
      mask: {
        in: (c, p) => { M.a = c.u < OM.smooth(p) ? 1 : 0; }, // typed on along the edge
        out: (c, q) => { M.a = c.u < OM.smooth(q) ? 1 : 0; }, // backspaced off
      },
      draw(T, sec) {
        const L = 72, st = Math.floor(beatPos(T) * 4), st0 = Math.floor(beatPos(sec.a) * 4);
        const back = 0, reach = L;
        const vx = vocal(T), sa = age(SNARE, T), cr = sa < 0.3 ? (sa / 0.3) * L : -9;
        for (let k = Math.floor(back); k < reach; k++) {
          const abs = st - k;
          if (abs < st0) break;
          if (OM.hash(abs, 1, 3) < 0.17) continue; // a space
          const c = COLS[(((abs - st0) % NC) + NC) % NC], tall = Math.min(3, 1 + Math.floor(OM.hash(abs, 2, 3) * 2 + vx * 1.5));
          const flash = Math.abs(k - cr) < 3;
          const ink = flash || kickStep.has(abs) ? CREST : snareStep.has(abs) ? HOVER : k < 4 ? LIT : MID;
          const a = flash ? 1 : 1 - (k / L) * 0.8;
          for (let d = DEPTH - 1; d >= DEPTH - tall; d--) put(c.cells[d], ink, a);
        }
        const head = COLS[(((st - Math.round(back) - st0) % NC) + NC) % NC], hp = hat(T).hp;
        const blink = 0.55 + 0.45 * Math.max(pulse(KICK, T, 0.15), hp);
        for (let d = 0; d < DEPTH; d++) put(head.cells[d], LAV, blink);
      },
    },
    // Tiling guides: rulers on every edge split one level finer every second kick, like a dwindle layout subdividing.
    // Snares sweep out along the rulers from each edge's middle, hats tick the ruler, energy brightens it.
    p1: {
      mask: {
        in: (c, p) => { const e = 1 - E.outCubic(p); M.x = c.nx * e * B * 1.6; M.y = c.ny * e * B * 1.6; }, // slides in from off-frame
        out: (c, q) => { const e = E.inCubic(1 - q) * ((c.side % 2 ? H - 2 * B : W) + 40); M.x = c.tx * e; M.y = c.ty * e; }, // slides off along the edge, clockwise
      },
      draw(T, sec) {
        const ki = last(KICK, T), kc = Math.max(0, ki - last(KICK, sec.a));
        const lvl = Math.min(6, 1 + Math.floor(kc / 2)), fresh = kc > 0 && kc % 2 === 0;
        const pop = ki >= 0 ? E.outBack(clamp((T - KICK[ki]) / 0.16)) : 1, kp = pulse(KICK, T, 0.1);
        const sa = age(SNARE, T), front = sa < 0.4 ? sa * 2400 : -1e4, { hp, hi } = hat(T), base = 0.45 + 0.4 * energy(T);
        for (let side = 0; side < 4; side++) {
          const n = side % 2 ? NS : NT;
          for (let i = 0; i < n; i++) {
            const c = COLS[sideOf(side, i)], sw = Math.abs(c.dm - front) < 40;
            put(c.cells[0], sw ? HOVER : kp > 0.3 ? LIT : DIM, sw ? 1 - sa * 2 : base);
          }
          if (hp > 0.1) put(COLS[sideOf(side, Math.floor(OM.hash(hi, side, 43) * n))].cells[0], CREST, hp);
          for (let l = 1; l <= lvl; l++) {
            const len = Math.max(1, 5 - l), newest = l === lvl;
            for (let k = 1; k < 1 << l; k += 2) {
              const c = COLS[sideOf(side, Math.min(n - 1, Math.round((k / (1 << l)) * n - 0.5)))];
              for (let d = 1; d <= Math.min(DEPTH - 1, len); d++) put(c.cells[d], newest ? (kp > 0.3 ? CREST : LIT) : MID, 1, newest && fresh ? pop : 1);
            }
          }
        }
      },
    },
    // Hyprland active border: a lavender-to-green gradient that turns an eighth of the way round on every beat.
    // Kicks thicken it, a snare races a highlight once round, the vocal glows on its inner edge, hats sparkle inside.
    c1: {
      mask: {
        in: (c, p) => { const dc = c.side % 2 === 0 ? Math.min(c.cx, W - c.cx) / (W / 2) : Math.min(c.cy, H - c.cy) / (H / 2); M.a = dc < OM.smooth(p) ? 1 : 0; }, // grows in from the corners
        out: (c, q) => { const dc = c.side % 2 === 0 ? Math.min(c.cx, W - c.cx) / (W / 2) : Math.min(c.cy, H - c.cy) / (H / 2); M.a = dc < OM.smooth(q) ? 1 : 0; }, // drawn back into the corners
      },
      draw(T) {
        const bp = beatPos(T), fb = bp - Math.floor(bp);
        const rot = (Math.floor(bp) + E.outExpo(clamp(fb / 0.35))) / 8;
        const kp = pulse(KICK, T, 0.11), sa = age(SNARE, T), race = sa < 0.45 ? (sa / 0.45) * P : -1e4;
        const vx = vocal(T), { hp, hi } = hat(T);
        for (const c of COLS) {
          const g = GRAD + Math.floor((((c.s / P + rot) % 1) + 1) % 1 * NG) % NG;
          put(c.cells[1], g, 1, 1.2);
          if (kp > 0.06) { put(c.cells[0], g, kp * 0.85, 1.2); put(c.cells[2], g, kp * 0.5, 1.2); }
          if (vx > 0.15) put(c.cells[2], g, vx * 0.45, 1.2);
          if (Math.abs(c.s - race) < 110) put(c.cells[1], CREST, 1 - sa * 1.8, 1.2);
          if (hp > 0.1 && OM.hash(c.i, hi, 47) < 0.025) put(c.cells[3], LAV, hp);
        }
      },
    },
    // Edge equalizer: the song's 16 bands as lattice bars growing in from all four edges, mirrored, with peak caps.
    // Kicks flare the bass bars and flash the caps, a snare sweeps out from the middles, hats sparkle the treble tips.
    v2: {
      mask: {
        in: (c, p) => { M.a = Math.abs(c.u - 0.5) * 2 < OM.smooth(p) ? 1 : 0; }, // unfolds from the middle of the edge
        out: (c, q) => { M.a = Math.abs(c.u - 0.5) * 2 < OM.smooth(q) ? 1 : 0; }, // folds back into the middle of the edge
      },
      draw(T) {
        const now = OM.audio(T).bands, pk = new Float32Array(16), kp = pulse(KICK, T, 0.1);
        for (let k = 1; k <= 6; k++) { const b = OM.audio(T - k * 0.07).bands; for (let i = 0; i < 16; i++) pk[i] = Math.max(pk[i], b[i] * (1 - k * 0.05)); }
        const sa = age(SNARE, T), sw = sa < 0.3 ? sa / 0.3 : -9, { hp } = hat(T);
        for (const c of COLS) {
          const f = Math.abs(c.u - 0.5) * 32;
          if (f % 1 > 0.8) continue; // gap between bars
          const b = Math.min(15, Math.floor(f));
          const h = clamp(now[b] * 1.2 + (b < 3 ? kp * 0.3 : 0) + (Math.abs(f / 32 - sw) < 0.06 ? 0.35 : 0)) * DEPTH;
          for (let d = 0; d < Math.ceil(h); d++) put(c.cells[d], [MID, LIT, HOVER, CREST][d], Math.min(1, h - d));
          const pd = Math.min(DEPTH - 1, Math.floor(clamp(pk[b] * 1.2) * DEPTH));
          if (pd >= Math.ceil(h)) put(c.cells[pd], CREST, 0.5 + 0.5 * kp);
          if (b >= 12 && hp > 0.1 && h > 0.5) put(c.cells[Math.min(DEPTH - 1, Math.floor(h))], CREST, hp);
        }
      },
    },
    // Install progress: a package-manager bar fills round the frame a step per beat, a packet running down it each beat.
    // Kicks pump the fill, a snare shoots a spark back from the head, hats tick the empty track, energy brightens it.
    p2: {
      mask: {
        in: (c, p) => { M.a = c.h < Math.floor(p * 8) / 8 ? 1 : 0; }, // assembles cell by cell in eight rhythmic batches
        out: (c, q) => { const v = Math.floor(q * 8) / 8 - c.h2; M.a = v > 0 ? 1 : 0; if (v > 0 && v <= 0.125) M.k = CREST; }, // comes apart in batches, each flashing as it goes
      },
      draw(T, sec) {
        const b0 = beatPos(sec.a), nb = Math.max(1, Math.round(beatPos(sec.e) - b0)), bp = beatPos(T) - b0;
        const k = Math.floor(bp), fill = (NC * (k + E.outExpo(clamp((bp - k) / 0.3)))) / nb;
        const pk = (bp - k) * fill, kp = pulse(KICK, T, 0.12), bt = pulse(beats, T, 0.15);
        const sa = age(SNARE, T), spark = sa < 0.35 ? fill - (sa / 0.35) * 90 : -1e4, { hp, hi } = hat(T), al = 0.55 + 0.3 * energy(T) + 0.15 * kp;
        for (let i = 0; i < NC; i++) {
          const c = COLS[i];
          if (i < fill) {
            const hot = Math.abs(i - pk) < 6 || Math.abs(i - spark) < 3;
            put(c.cells[1], hot ? HOVER : LIT, hot ? 1 : al); put(c.cells[2], hot ? HOVER : LIT, hot ? 1 : al);
          } else if (i % 2 === 0) put(c.cells[2], hp > 0.1 && OM.hash(i, hi, 53) < 0.12 ? MID : DIM, 0.8);
        }
        const head = COLS[Math.min(NC - 1, Math.floor(fill))];
        for (let d = 0; d < DEPTH; d++) put(head.cells[d], CREST, 0.6 + 0.4 * bt);
      },
    },
    // Lattice marquee: theatre bulbs chasing round on 16ths, reversing every bar; kicks light every bulb.
    // A snare runs a flash both ways along the rails, hats twinkle stray bulbs, the vocal doubles the lit bulbs.
    c2: {
      mask: {
        in: (c, p) => { M.a = c.r < OM.smooth(p) ? 1 : 0; }, // iris opens from the middle of the edges
        out: (c, q) => { M.a = c.r > 1 - OM.smooth(q) ? 1 : 0; }, // iris closes; the corners hold last
      },
      draw(T) {
        const bp = beatPos(T), step = Math.floor(bp * 4), dir = Math.floor(bp / 4) % 2 ? -1 : 1;
        const kp = pulse(KICK, T, 0.12), si = last(SNARE, T), sa = age(SNARE, T), o = OM.hash(si, 7, 59) * P, f = sa * 3000;
        const { hp, hi } = hat(T), lit = vocal(T) > 0.5 ? 2 : 1;
        for (let i = 0; i < NC; i++) {
          const c = COLS[i];
          let dd = Math.abs(c.s - o); dd = Math.min(dd, P - dd);
          const run = sa < 0.4 && Math.abs(dd - f) < 70 ? 1 - sa * 2.5 : 0;
          put(c.cells[0], run ? HOVER : MID, 0.35 + run * 0.65); put(c.cells[3], run ? HOVER : MID, 0.35 + run * 0.65);
          const j = i >> 1, on = ((((j + dir * step) % 4) + 4) % 4) < lit; // 292 bulbs, so a period of 4 has no seam
          const tw = !on && hp > 0.1 && OM.hash(j, hi, 61) < 0.08;
          const a = on || tw ? 1 : Math.max(0.8, kp), ink = on ? CREST : tw ? LIT : kp > 0.4 ? LIT : DIM;
          put(c.cells[1], ink, tw ? hp : a); put(c.cells[2], ink, tw ? hp : a);
        }
      },
    },
    // Voice wave: a line that rides round the frame half a cycle per beat, its height the vocal; snares send ripples.
    // Kicks thicken the line, hats glint on it, the energy lifts the slow under-wave.
    b: {
      mask: {
        in: (c, p) => { M.a = c.u > 1 - OM.smooth(p) ? 1 : 0; }, // rolls in round the far corner, travelling back along the edge
        out: (c, q) => { M.a = c.u > 1 - OM.smooth(q) ? 1 : 0; }, // rolls back out round that corner
      },
      draw(T) {
        const bp = beatPos(T);
        const amp = 0.3 + 0.7 * vocal(T), al = 1;
        const si = last(SNARE, T), rip = [], kp = pulse(KICK, T, 0.12), { hp, hi } = hat(T), amp2 = amp * (0.3 + 0.5 * energy(T));
        for (let j = si; j > si - 2 && j >= 0; j--) { const a = T - SNARE[j]; if (a < 1.2) rip.push([OM.hash(j, 5, 9) * P, a * 1500, (1 - a / 1.2) * amp]); }
        for (const c of COLS) {
          const phi = (c.s / 480) * 2 * Math.PI - bp * Math.PI;
          let y = Math.sin(phi) * amp;
          for (const [o, f, a] of rip) { let dd = Math.abs(c.s - o); dd = Math.min(dd, P - dd); y += a * Math.exp(-(((dd - f) / 90) ** 2)); }
          const lv = 1.5 + 1.5 * clamp(y, -1, 1), lv2 = 1.5 + 1.5 * Math.sin(phi * 0.5 + bp * 0.5 + 1.3) * amp2;
          const glint = hp > 0.1 && OM.hash(c.i, hi, 67) < 0.03;
          for (let d = 0; d < DEPTH; d++) {
            const w = 1 - Math.abs(d - lv) / (1 + kp * 0.8), w2 = 1 - Math.abs(d - lv2);
            if (w > 0) put(c.cells[d], glint && w > 0.5 ? CREST : w > 0.5 ? HOVER : LIT, (glint && w > 0.5 ? Math.max(w, hp) : w) * al);
            else if (w2 > 0) put(c.cells[d], MID, w2 * 0.55 * al);
          }
        }
      },
    },
    // Tile shuffle: little Hyprland windows tiled round the edge re-tile on every kick; a snare moves the focus.
    // Hats tick the focused window's title dots, the energy rising through the build brightens every tile.
    x: {
      mask: {
        in: (c, p) => { const l = clamp(p * 1.6 - c.u * 0.6), e = 1 - E.outBack(l); M.s = l > 0 ? 1 : 0; M.x = c.nx * e * B * 1.6; M.y = c.ny * e * B * 1.6; }, // windows drop in from off-frame one after another
        out: (c, q) => { const l = clamp(q * 1.6 - (1 - c.u) * 0.6), e = E.inCubic(1 - l) * ((c.side % 2 ? H - 2 * B : W) + 40) * (c.u < 0.5 ? -1 : 1); M.s = l > 0 ? 1 : 0; M.x = c.tx * e; M.y = c.ty * e; }, // scatter off both ends
      },
      draw(T, sec) {
        const n = 6 + Math.floor(clamp((T - sec.a) / (sec.e - sec.a)) * 8), ki = last(KICK, T);
        const blend = ki >= 0 ? E.outCubic(clamp((T - KICK[ki]) / 0.18)) : 1, focus = ((last(SNARE, T) % n) + n) % n;
        const kp = pulse(KICK, T, 0.1), { hp } = hat(T), lift = 0.65 + 0.35 * energy(T);
        const at = (k, i) => ({ s: OM.hash(k, 3, 17) * NC + i * (NC / n) + OM.hash(i, k, 19) * (NC / n - 13), len: 4 + Math.floor(OM.hash(i, k, 21) * 7) });
        for (let i = 0; i < n; i++) {
          const a = at(ki - 1, i), b = at(ki, i);
          const ds = (((b.s - a.s) % NC) + NC * 1.5) % NC - NC / 2; // shortest way round
          const s0 = a.s + ds * blend, len = Math.round(a.len + (b.len - a.len) * blend);
          const pi = 1, dx = 0, dy = 0;
          for (let k = 0; k < len; k++) {
            const c = COLS[((Math.round(s0) + k) % NC + NC) % NC];
            const edge = k === 0 || k === len - 1, ink = i === focus ? CREST : edge ? HOVER : LIT;
            const al = (i === focus ? 1 : edge ? 0.9 : 0.7) * (0.8 + 0.2 * kp) * lift;
            put(c.cells[1], ink, al, 1, dx, dy); put(c.cells[2], ink, al, 1, dx, dy);
            if (i === focus && k >= 1 && k <= 3) put(c.cells[0], CREST, 0.3 + 0.7 * hp, 1, dx, dy);
          }
        }
      },
    },
    // Shockwave crown (the biggest): kicks fire waves from the corners, snares from the middle of each edge,
    // hats sparkle, the whole band breathes on downbeats and swells with the vocal.
    c3: {
      mask: {
        in: (c, p) => { const j = Math.min(3, Math.floor(c.u * 4)); M.a = E.inCubic(clamp(p * 4 - j)) > c.u * 4 - j ? 1 : 0; }, // builds along the edge, one quarter accelerating in per beat
        out: (c, q) => { const j = Math.min(3, Math.floor(c.u * 4)); M.a = E.inCubic(clamp(q * 4 - (3 - j))) > c.u * 4 - j ? 1 : 0; }, // pulls back a quarter per beat, last quarter first
      },
      draw(T) {
        const base = 0.3 + 0.3 * pulse(downs, T, 0.25) + 0.15 * vocal(T), kp = pulse(KICK, T, 0.1), waves = [];
        const ki = last(KICK, T), si = last(SNARE, T);
        for (let j = ki; j > ki - 3 && j >= 0; j--) { const a = T - KICK[j]; if (a < 0.9) waves.push([0, a * 2600, (0.6 + KICK_E[j]) * (1 - a / 0.9)]); }
        for (let j = si; j > si - 2 && j >= 0; j--) { const a = T - SNARE[j]; if (a < 0.7) waves.push([1, a * 2200, 0.9 * (1 - a / 0.7)]); }
        const { hp, hi } = hat(T);
        for (const c of COLS) {
          let I = 0;
          for (const [mid, f, a] of waves) I += a * Math.exp(-((((mid ? c.dm : c.dc) - f) / 110) ** 2));
          if (hp > 0.1 && OM.hash(c.i, hi, 5) < 0.05) I += hp * 0.8;
          I = clamp(I + kp * 0.3);
          const fill = I * DEPTH, ink = I > 0.75 ? CREST : I > 0.5 ? HOVER : I > 0.25 ? LIT : MID;
          for (let d = 0; d < DEPTH; d++) put(c.cells[d], d < fill ? ink : d === 0 ? MID : DIM, d < fill ? Math.max(base, Math.min(1, fill - d)) : base);
        }
      },
    },
    // Corner brackets: four L brackets whose arms reach a little further every downbeat; a power light blinks the beat.
    // Kicks notch the arm tips, a snare runs a flash out along every arm, hats flicker the light, energy deepens the breath.
    o: {
      mask: {
        in: (c, p) => { const e = 1 - E.outBack(p); M.x = c.nx * e * B * 1.6; M.y = c.ny * e * B * 1.6; }, // drops in from off-frame with a bounce
        out: (c, q) => { M.a = (c.side % 2 ? Math.abs(c.cy - H / 2) / (H / 2 - B) : Math.abs(c.cx - W / 2) / (W / 2)) < OM.smooth(q) ? 1 : 0; }, // CRT power-off: squeezes to the edge's centre
      },
      draw(T, sec) {
        const di = last(downs, T), dn = Math.max(0, di - last(downs, sec.a)), dt = di >= 0 ? T - downs[di] : 0;
        const arm = Math.min(34, 6 + 4 * Math.max(0, dn - 1) + 4 * E.outBack(clamp(dt / 0.25)));
        const bp = beatPos(T), en = energy(T), breath = 1 - (0.25 + 0.25 * en) * (0.5 - 0.5 * Math.cos((2 * Math.PI * (bp % 4)) / 4)), kp = pulse(KICK, T, 0.12);
        const sa = age(SNARE, T), run = sa < 0.3 ? (sa / 0.3) * arm : -9, { hp } = hat(T);
        for (const c of COLS) {
          const k = c.dc / C;
          if (k >= arm) continue;
          const fl = Math.abs(k - run) < 2;
          put(c.cells[0], CREST, fl ? 1 : breath); put(c.cells[1], fl ? CREST : LIT, fl ? 1 : breath * 0.8);
          if (k > arm - 1.5 && kp > 0.1) { put(c.cells[2], CREST, kp); put(c.cells[3], HOVER, kp * 0.7); }
        }
        const on = Math.max(bp - Math.floor(bp) < 0.5 ? 1 : 0.25, hp * 0.7);
        for (const i of [BOTTOM0 + NT / 2 - 1, BOTTOM0 + NT / 2]) { put(COLS[i].cells[1], CREST, on); put(COLS[i].cells[2], CREST, on); }
      },
    },
  };
  const SECTIONS = [
    ['intro', 0, 36.711], ['v1', 36.711, 72.95], ['p1', 72.95, 81.178], ['c1', 81.178, 115.33], ['v2', 115.33, 149.943], ['p2', 149.943, 157.971],
    ['c2', 157.971, 193.285], ['b', 193.285, 227.55], ['x', 227.55, 243.253], ['c3', 243.253, 280.8], ['o', 280.8, 299.947],
  ];

  // ---------- when: per side, whole sentences only ----------
  // A side is on for a whole scene or not at all (frame-need.js). Neighbouring scenes that both have it
  // on make one run, so it stays on through their cut. A run grows in from exactly nothing starting on
  // its first cut and lands on a corrected downbeat; it starts leaving on a downbeat and is gone exactly
  // on its last cut. A section change inside a run morphs: the old idea travels off along the edge while
  // the new one follows in behind it, arriving on the next downbeat.
  const sectionAt = (t) => { let i = 0; while (i < SECTIONS.length - 1 && t >= SECTIONS[i + 1][1]) i++; return i; };
  const landing = (t, lim, lead = 0.3) => {
    let d = first(downs, t + lead);
    if (d === null || d > lim) d = first(beats, t + 0.3);
    if (d === null || d > lim) d = lim;
    return d;
  };
  // A frame on only one to three sides reads as stray pieces (the owner's call), so a sentence with any
  // empty margin gets the whole frame, all four sides, at SUBTLE strength unless every margin is empty.
  const SUBTLE = 0.45;
  let RUNS = null, SC = null;
  function schedule() {
    const scenes = (SC = [...document.querySelectorAll('#root > section.scene')].map((el) => {
      const id = el.id.slice(2), a = +el.dataset.start, m = N.overrides[id] ?? N.sides[id] ?? 0;
      return { a, e: a + +el.dataset.duration, m: m ? 15 : 0, s: m === 15 ? 1 : SUBTLE };
    }));
    const runs = [[], [], [], []];
    for (let k = 0; k < 4; k++) {
      let cur = null;
      for (const sc of scenes) {
        if (!((sc.m >> k) & 1)) { cur = null; continue; }
        if (cur && Math.abs(cur.e - sc.a) < 0.01) cur.e = sc.e;
        else runs[k].push((cur = { side: k, a: sc.a, e: sc.e }));
      }
      for (const r of runs[k]) {
        const mid = (r.a + r.e) / 2;
        r.dIn = landing(r.a, mid);
        let d = lastAt(downs, r.e - 0.3);
        if (d === null || d < r.dIn) d = lastAt(beats, r.e - 0.3);
        r.dOut = d === null || d < r.dIn ? Math.max(r.dIn, mid) : d;
        r.morphs = SECTIONS.map((x) => x[1]).filter((t) => t > r.a + 0.01 && t < r.e - 0.01).map((t) => [t, landing(t, r.e, 1.2)]); // a morph takes at least 1.2 s
      }
    }
    return runs;
  }
  /** The frame's strength at T: its sentence's, eased from the previous sentence's from the cut to the next beat. */
  const strength = (T) => {
    let i = SC.length - 1;
    while (i > 0 && T < SC[i].a) i--;
    const c = SC[i], p = SC[i - 1];
    if (!p || !p.m || p.s === c.s) return c.s;
    const end = first(beats, c.a + 0.25) ?? c.a + 0.5;
    return p.s + (c.s - p.s) * OM.smooth(clamp((T - c.a) / (end - c.a)));
  };
  // Per side, this frame: on?, the mask and its p, and the morph front (-1 when none).
  const S_ON = [0, 0, 0, 0], S_MASK = [null, null, null, null], S_P = [1, 1, 1, 1], S_F = [-1, -1, -1, -1];
  let pass = 0; // 0: the current idea; 1: the previous idea travelling out during a morph

  // ---------- the rim fog: always on, beneath the section effects ----------
  // A pixelated haze round the whole film: low-frequency noise drifting slowly, quantized into 20 px
  // cells, densest at the edge and gone by about 170 px in, peaking near 0.16 opacity. It breathes
  // ±15% on every corrected beat and a little more on kicks (smooth attack, no flash). Its colour is
  // the theme green, merging into the picture's own edge colour (scripts/edge-need.mjs samples it
  // every 0.25 s) wherever that isn't the dark Tokyo Night ground: pale mist on white, the hue of a
  // coloured wallpaper. It never switches on or off, so it is continuous across every cut.
  const FC = 20, FW = W / FC, FH = H / FC, FDEP = 170, FCLEAR = 180;
  const FG_A = OM.rgb(F.mid), FG_B = OM.rgb(F.lit), GROUND = OM.rgb(F.bg);
  const EDGE = N.edge || null;
  let fogCv = null, fogCtx = null, fogImg = null;
  const edgeAt = (T) => {
    if (!EDGE) return GROUND;
    const n = EDGE.rgb.length / 3, x = clamp(T / EDGE.dt - 0.5, 0, n - 1), i = Math.floor(x), f = x - i, j = Math.min(n - 1, i + 1);
    return [0, 1, 2].map((c) => EDGE.rgb[i * 3 + c] * (1 - f) + EDGE.rgb[j * 3 + c] * f);
  };
  const kickSwell = (T) => {
    const i = last(KICK, T);
    if (i < 0) return 0;
    const a = T - KICK[i];
    return a < 0.05 ? a / 0.05 : Math.exp(-(a - 0.05) / 0.18);
  };
  function fog(ctx, T) {
    if (!fogCv) {
      fogCv = document.createElement('canvas'); fogCv.width = FW; fogCv.height = FH;
      fogCtx = fogCv.getContext('2d'); fogImg = fogCtx.createImageData(FW, FH);
    }
    const bp = beatPos(T), breath = 1 + 0.15 * Math.cos(2 * Math.PI * (bp - Math.floor(bp))) + 0.12 * kickSwell(T);
    const e = edgeAt(T), lum = 0.2126 * e[0] + 0.7152 * e[1] + 0.0722 * e[2];
    const away = clamp((Math.hypot(e[0] - GROUND[0], e[1] - GROUND[1], e[2] - GROUND[2]) - 14) / 45);
    const tint = e.map((v) => clamp(lum > 140 ? v * 0.8 : v * 1.6 + 12, 0, 255)); // readable on its own ground
    const px = fogImg.data, deep = Math.ceil(FDEP / FC);
    px.fill(0);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      if (y >= deep && y < FH - deep && x === deep) x = FW - deep; // skip the open middle
      const cx = (x + 0.5) * FC, cy = (y + 0.5) * FC;
      const d = Math.min(cx, W - cx, cy, H - cy), prof = 1 - d / FDEP;
      if (prof <= 0) continue;
      const n = OM.heroNoise(cx * 0.006 + T * 0.05, cy * 0.006 - T * 0.03);
      const m = OM.heroNoise(cx * 0.0025 - T * 0.02 + 61, cy * 0.0025 + 23);
      const a = 0.16 * Math.pow(prof, 1.6) * (0.35 + 0.65 * OM.smooth(clamp((n - 0.25) / 0.6))) * breath;
      const i = (y * FW + x) * 4;
      for (let c = 0; c < 3; c++) {
        const g = FG_A[c] + (FG_B[c] - FG_A[c]) * m;
        px[i + c] = g + (tint[c] - g) * away;
      }
      px[i + 3] = 255 * Math.min(1, a);
    }
    fogCtx.putImageData(fogImg, 0, 0);
    ctx.imageSmoothingEnabled = false; // square fog cells, not a blur
    ctx.drawImage(fogCv, 0, 0, W, H);
  }

  // ---------- the layer ----------
  let cv = null, cnv = null;
  const render = (T) => {
    if (!RUNS) RUNS = OM.frames.runs = schedule();
    const si = sectionAt(T), I = IDEAS[SECTIONS[si][0]];
    let any = 0, morph = 0;
    for (let k = 0; k < 4; k++) {
      S_ON[k] = 0; S_MASK[k] = null; S_P[k] = 1; S_F[k] = -1;
      const r = RUNS[k].find((x) => T >= x.a && T < x.e);
      if (!r) continue;
      S_ON[k] = 1; any |= 1 << k;
      if (T < r.dIn) { S_MASK[k] = I.mask && I.mask.in; S_P[k] = (T - r.a) / (r.dIn - r.a); }
      else if (T >= r.dOut) { S_MASK[k] = I.mask && I.mask.out; S_P[k] = (r.e - T) / (r.e - r.dOut); }
      for (const [t, d] of r.morphs) if (T >= t && T < d) { S_F[k] = OM.smooth((T - t) / (d - t)); morph = 1; } // starts at rest on the cut
    }
    if (!cv) {
      cv = document.createElement('canvas');
      cv.id = 'om-frames';
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:40;pointer-events:none;';
      (document.getElementById('root') || document.body).appendChild(cv);
      cnv = OM.canvas(cv);
    }
    const ctx = cnv.ensure();
    const Q = FCLEAR;
    ctx.clearRect(0, 0, W, Q); ctx.clearRect(0, H - Q, W, Q); ctx.clearRect(0, Q, Q, H - 2 * Q); ctx.clearRect(W - Q, Q, Q, H - 2 * Q);
    fog(ctx, T); // always there, beneath everything else
    if (!any) return;
    peak = Math.max(pulse(beats, T, 0.05), pulse(KICK, T, 0.05));
    gain = (0.6 + 0.5 * peak) * strength(T); // a touch more vivid on the beat
    for (const b of BUCKET) b.length = 0;
    pass = 0;
    I.draw(T, { a: SECTIONS[si][1], e: SECTIONS[si][2] });
    if (morph && si > 0) {
      pass = 1;
      IDEAS[SECTIONS[si - 1][0]].draw(T, { a: SECTIONS[si - 1][1], e: SECTIONS[si - 1][2] });
      pass = 0;
    }
    ctx.save();
    ctx.beginPath(); // only the open sides, and nothing moved past them
    if (any & 1) ctx.rect(0, 0, W, B);
    if (any & 4) ctx.rect(0, H - B, W, B);
    if (any & 8) ctx.rect(0, B, B, H - 2 * B);
    if (any & 2) ctx.rect(W - B, B, B, H - 2 * B);
    ctx.clip();
    if (mistOn) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(mistCv, 0, 0, W, H); mistOn = false; }
    for (let k = 0; k < BUCKET.length; k++) {
      const q = BUCKET[k];
      if (!q.length) continue;
      ctx.fillStyle = FILL[k];
      ctx.beginPath();
      for (let j = 0; j < q.length; j += 3) ctx.rect(q[j], q[j + 1], q[j + 2], q[j + 2]);
      ctx.fill();
    }
    ctx.restore();
  };
  OM.frames = { render, runs: null }; // for timing and inspection
  const tick = OM.tick;
  OM.tick = (t) => {
    tick(t);
    render(t);
  };
})();
