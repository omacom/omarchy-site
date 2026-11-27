// The kit: shared materials every scene paints with. The hero renderer is a
// port of omarchy-site's HeroPixelField draw(). These are materials, not moves:
// each scene animates them in its own way.
(function () {
  const OM = window.OM;
  const T = OM.T;

  // ---------- timing ----------
  const lineById = {};
  if (T) for (const l of T.lines) lineById[l.id] = l;
  /** A lyric line's timing (global seconds): { start, end, words: [[s,e]...] }. */
  OM.line = (id) => lineById[id];
  /** Global start of word k (0-based) of a line; falls back to the line start. */
  OM.word = (id, k) => {
    const l = lineById[id];
    const w = l && l.words[Math.min(k, l.words.length - 1)];
    return w ? w[0] : l.start;
  };
  /** Every sung word's onset (global seconds) for a line: the hits a scene must land. */
  OM.words = (id) => lineById[id].words.map((w, k) => (w ? w[0] : OM.word(id, k)));
  /**
   * Word-sync state at global time T: which word is sounding (index, -1 before
   * the first), seconds since its onset, and a 0..1 hit that peaks on each
   * onset and decays (half-life seconds). Scenes key their beats to this.
   */
  OM.wordAt = (id, T, half = 0.14) => {
    const on = OM.words(id);
    let k = -1;
    for (let i = 0; i < on.length; i++) if (on[i] <= T) k = i;
    const since = k < 0 ? Infinity : T - on[k];
    return { index: k, count: on.length, since, hit: k < 0 ? 0 : Math.pow(0.5, since / half), onsets: on };
  };
  /** Beat times (global) within [a, b). */
  OM.beatsIn = (a, b) => T.beats.filter((x) => x >= a && x < b);
  OM.downbeatsIn = (a, b) => T.downbeats.filter((x) => x >= a && x < b);
  /** Seconds per beat. */
  OM.SPB = 60 / (T ? T.bpm : 112.3);
  /** Most recent hit at or before t, or null. */
  OM.lastHit = (hits, t) => {
    let h = null;
    for (const x of hits) if (x <= t) h = x;
    return h;
  };
  /** 1 on a hit, decaying exponentially after it (seconds half-life). */
  OM.pulse = (hits, t, half = 0.12) => {
    const h = OM.lastHit(hits, t);
    return h === null ? 0 : Math.pow(0.5, (t - h) / half);
  };
  /** Count of hits at or before t. */
  OM.hitCount = (hits, t) => hits.reduce((n, x) => n + (x <= t ? 1 : 0), 0);

  // ---------- audio features (analysis/features.py) ----------
  const A = window.OM_AUDIO;
  const unpack = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const SPEC = A ? unpack(A.spectrum) : null, VOX = A ? unpack(A.vocal) : null, KICK = A ? unpack(A.kick) : null;
  /** The song at global time t: { bands: Float32Array(16), vocal, kick }, all 0..1, linearly interpolated. */
  OM.audio = (t) => {
    const out = { bands: new Float32Array(16), vocal: 0, kick: 0 };
    if (!A) return out;
    const f = OM.clamp(t * A.fps, 0, A.frames - 1.001);
    const i = Math.floor(f), m = f - i;
    for (let b = 0; b < 16; b++) out.bands[b] = (SPEC[i * 16 + b] * (1 - m) + SPEC[(i + 1) * 16 + b] * m) / 255;
    out.vocal = (VOX[i] * (1 - m) + VOX[i + 1] * m) / 255;
    out.kick = (KICK[i] * (1 - m) + KICK[i + 1] * m) / 255;
    return out;
  };

  // ---------- the beat jiggle ----------
  // One small bump per beat while the drums play, for scenes that opt in by
  // feeding it into their own camera or one element. The analysis grid runs
  // about 44 ms late against the drums, so each bump peaks on the beat's attack
  // as measured on the song (OM.T.beatsOn, from analysis/refine_events.py), or,
  // without it, on the grid smoothed over 7 beats and moved 46 ms early. Its size follows the beat's drum hit,
  // and it is 0 wherever the drums are out. No bump comes within two frames of
  // a cut, so cut frames stay exact.
  const JIG = { RISE: 0.024, FALL: 0.17, GUARD: 0.034, LATE: 0.046 };
  let onsets = null, bumps = null;
  /** Each grid beat's drum onset: the grid smoothed into an even pulse and moved 46 ms early. */
  const beatOnsets = () => onsets || (onsets = T && T.beatsOn ? T.beatsOn.slice() : (T ? T.beats : []).map((b, i, B) => {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let j = Math.max(0, i - 3); j <= Math.min(B.length - 1, i + 3); j++, n++) {
      sx += j; sy += B[j]; sxx += j * j; sxy += j * B[j];
    }
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return sy / n + slope * (i - sx / n) - JIG.LATE;
  }));
  /**
   * Where the drums really hit for a time taken from the beat grid (OM.T.beats,
   * OM.T.downbeats, OM.beatsIn, or a number copied from them): that beat's
   * onset, as the jiggle uses it. Any other time comes back unchanged.
   */
  OM.beatOnset = (t) => {
    if (!T) return t;
    const B = T.beats;
    let lo = 0, hi = B.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (B[m] < t) lo = m + 1; else hi = m;
    }
    const i = lo > 0 && Math.abs(B[lo - 1] - t) < Math.abs(B[lo] - t) ? lo - 1 : lo;
    return Math.abs(B[i] - t) < 0.002 ? beatOnsets()[i] : t;
  };
  /** The bumps, built on first use: frame-need.js and the scene sections load after this file. */
  function jigBumps() {
    const N = window.OM_FRAME_NEED;
    if (!T || !KICK) return [];
    const B = T.beats, ev = [...N.kick, ...N.snare], onset = beatOnsets();
    // Beat strength: the low-band onset strength at the hit, or the loudest kick or snare event on it.
    const s = onset.map((t) => {
      let m = 0;
      for (let f = Math.round((t - 0.03) * A.fps); f <= Math.round((t + 0.08) * A.fps); f++) m = Math.max(m, KICK[OM.clamp(f, 0, A.frames - 1)] / 255);
      for (const e of ev) if (Math.abs(e[0] - t) <= 0.035) m = Math.max(m, OM.clamp(e[1] / 0.45));
      return m;
    });
    const median = (xs) => xs.slice().sort((a, b) => a - b)[xs.length >> 1];
    const cuts = [...document.querySelectorAll('section.scene[data-start]')].map((el) => parseFloat(el.dataset.start)).filter((c) => c > 0);
    const downs = new Set(T.downbeats.map((d) => Math.round(d * 1000)));
    const out = [];
    for (let i = 0; i < B.length; i++) {
      const t = onset[i], down = downs.has(Math.round(B[i] * 1000));
      // Drums in play: the median beat strength around this beat.
      const g = median(s.slice(Math.max(0, i - 3), i + 4));
      const w = OM.smooth(OM.clamp((g - 0.2) / 0.12)) * (0.55 + 0.45 * OM.clamp((s[i] - 0.2) / 0.4)) * (down ? 1 : 0.85);
      if (w < 0.05 || t + JIG.FALL > T.duration) continue;
      if (cuts.some((c) => c > t - JIG.RISE - JIG.GUARD && c < t + JIG.FALL + JIG.GUARD)) continue;
      out.push({ t, w, k: i, down });
    }
    return out;
  }
  /** The bumps, or none while frame-need.js is absent (NO_FRAMES drafts leave it out). */
  const allBumps = () => bumps || (window.OM_FRAME_NEED ? (bumps = jigBumps()) : []);
  /** The bump around global time `time`, or null. */
  const bumpAt = (time) => {
    const bs = allBumps();
    let lo = 0, hi = bs.length - 1, r = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (bs[m].t - JIG.RISE <= time) { r = m; lo = m + 1; } else hi = m - 1;
    }
    return r >= 0 && time < bs[r].t + JIG.FALL ? bs[r] : null;
  };
  /** A bump's shape at d seconds from its onset: a raised-cosine rise to 1 on the onset, then a smooth settle to exactly 0. */
  const bumpShape = (d) => {
    if (d < -JIG.RISE || d >= JIG.FALL) return 0;
    if (d < 0) return 0.5 - 0.5 * Math.cos((Math.PI * (d + JIG.RISE)) / JIG.RISE);
    const u = d / JIG.FALL;
    return (1 - u) ** 4 * (1 + 4 * u);
  };
  /** True when a bump falls within 0.15 s of one of the scene's own hits, so it is left out whole. */
  const taken = (b, own) => !!own && own.some((h) => Math.abs(h - b.t) < 0.15);
  /**
   * The beat jiggle at global time `time`, 0..1: 1 on a strong downbeat's drum
   * onset, settled within about 0.12 s. `own` (optional) lists the scene's own
   * hit times; a bump on one of them is dropped whole so the two never stack.
   */
  OM.jiggle = (time, own) => {
    const b = bumpAt(time);
    return b && !taken(b, own) ? b.w * bumpShape(time - b.t) : 0;
  };
  /** The same jiggle with its beat: { v, k (beat index, for alternating sides), down (on a downbeat) }. */
  OM.jiggle.beat = (time, own) => {
    const b = bumpAt(time);
    return b && !taken(b, own) ? { v: b.w * bumpShape(time - b.t), k: b.k, down: b.down } : { v: 0, k: -1, down: false };
  };
  /** Every bump { t, w, k, down }, for checks. */
  OM.jiggle.bumps = () => allBumps().slice();
  OM.jiggle.SHAPE = JIG;

  // ---------- the edit layer ----------
  // Music-video edit moves keyed to the drums measured on the song (OM.T.drums):
  // a zoom punch on kicks, a jolt and roll on snares, a build through drum fills
  // that snaps off on the fill's last hit, a flash on chosen accents, and a
  // camera clock that surges through each beat. Every move is exactly 0 within
  // `hold` of the scene's cuts (whole bumps are dropped, never cut short), so cut
  // frames stay exact. A scene adds the result to its own camera (rule 9).
  const ED = { RISE: 0.016, PUNCH: 0.2, JOLT: 0.16, TICK: 0.07, FLASH: 0.14 };
  /** Hits of one kind ('kick', 'snare', 'hat', 'perc') in [a, b) with strength at least `min`: [[t, s], ...]. */
  const hitsOf = (kind, a, b, min = 0) => (T && T.drums && T.drums[kind] ? T.drums[kind].filter((h) => h[0] >= a && h[0] < b && h[1] >= min) : []);
  /** A punch: a raised-cosine rise to 1 on the onset, then a smooth settle to exactly 0. */
  const punchShape = (d, fall) => {
    if (d < -ED.RISE || d >= fall) return 0;
    if (d < 0) return 0.5 - 0.5 * Math.cos((Math.PI * (d + ED.RISE)) / ED.RISE);
    const u = d / fall;
    return (1 - u) ** 3 * (1 + 3 * u);
  };
  /** A jolt: 0 on the onset, a sharp throw, one and a half swings, then exactly 0. */
  const joltShape = (d, fall) => (d < 0 || d >= fall ? 0 : (1 - d / fall) ** 2 * Math.sin(3 * Math.PI * (d / fall)));
  /** A flash: full on the onset, then a quick fade to exactly 0. */
  const flashShape = (d, fall) => (d < 0 || d >= fall ? 0 : (1 - d / fall) ** 2);
  const weight = (s) => Math.pow(OM.clamp(s / 0.45), 0.6);
  OM.edit = {
    hits: hitsOf,
    /**
     * The edit layer for one scene window [start, end): call once in build(), then
     * ed.at(T) in render() for { zoom, x, y, rot, flash, build } (all 0 at rest).
     * Options (0 turns a move off):
     *   kick  zoom punch for a full-strength kick (0.03); downbeat kicks get x1.4
     *   snare jolt in px for a full-strength snare (12), with a roll of snareRot rad (0.006)
     *   hat   jitter in px on hi-hats (0)
     *   fill  zoom creep through each drum fill (0.04), shaking up to fillShake px (5),
     *         snapping back on the fill's end (or at the cut's hold, if it runs into it)
     *   flash 0..1 flash on each time in flashAt ([]), e.g. the key word's hit
     *   min   weakest hit kept (0.12); skip: the scene's own hit times, bumps within 0.12 s dropped whole
     *   hold  seconds at each cut where everything is exactly 0 (0.07); from/to: limit the window
     */
    scene(start, end, o = {}) {
      const opt = { kick: 0.03, snare: 12, snareRot: 0.006, hat: 0, fill: 0.04, fillShake: 5, flash: 0.6, flashAt: [], min: 0.12, skip: [], hold: 0.07, ...o };
      const a = Math.max(start, opt.from ?? start) + opt.hold, b = Math.min(end, opt.to ?? end) - opt.hold;
      const downs = new Set(((T && T.downbeatsOn) || []).map((t) => Math.round(t * 50)));
      const free = (t, lead, fall) => t - lead >= a && t + fall <= b && !opt.skip.some((h) => Math.abs(h - t) < 0.12);
      const kicks = opt.kick ? hitsOf('kick', start, end, opt.min).filter((h) => free(h[0], ED.RISE, ED.PUNCH))
        .map((h, i) => ({ t: h[0], w: opt.kick * weight(h[1]) * ([-1, 0, 1].some((k) => downs.has(Math.round(h[0] * 50) + k)) ? 1.4 : 1) })) : [];
      const snares = opt.snare ? hitsOf('snare', start, end, opt.min).filter((h) => free(h[0], 0, ED.JOLT))
        .map((h, i) => { const th = OM.hash(i, Math.round(h[0] * 100), 31) * 0.9 - 0.45; return { t: h[0], w: weight(h[1]), dx: (i % 2 ? 1 : -1) * Math.cos(th), dy: Math.sin(th), r: i % 2 ? 1 : -1 }; }) : [];
      const hats = opt.hat ? hitsOf('hat', start, end, opt.min).filter((h) => free(h[0], 0, ED.TICK))
        .map((h, i) => ({ t: h[0], w: weight(h[1]), dx: OM.hash(i, 3, 37) - 0.5, dy: OM.hash(i, 5, 41) - 0.5 })) : [];
      const fills = opt.fill ? ((T && T.fills) || []).filter((f) => f[1] > a && f[0] < b).map((f) => ({ t0: Math.max(f[0], a), t1: Math.min(f[1], b) })) : [];
      const flashes = opt.flash ? opt.flashAt.filter((t) => free(t, 0, ED.FLASH)) : [];
      const near = (list, T, lead, fall) => list.filter((h) => T >= h.t - lead && T < h.t + fall);
      return {
        kicks, snares, fills, flashes,
        at(T) {
          const e = { zoom: 0, x: 0, y: 0, rot: 0, flash: 0, build: 0 };
          if (T < a || T >= b) return e;
          for (const k of near(kicks, T, ED.RISE, ED.PUNCH)) e.zoom += k.w * punchShape(T - k.t, ED.PUNCH);
          e.zoom = Math.min(e.zoom, opt.kick * 1.6);
          for (const sn of near(snares, T, 0, ED.JOLT)) {
            const j = sn.w * joltShape(T - sn.t, ED.JOLT);
            e.x += opt.snare * sn.dx * j; e.y += opt.snare * 0.6 * sn.dy * j; e.rot += opt.snareRot * sn.r * j;
          }
          for (const h of near(hats, T, 0, ED.TICK)) {
            const j = h.w * joltShape(T - h.t, ED.TICK);
            e.x += opt.hat * h.dx * j; e.y += opt.hat * h.dy * j;
          }
          for (const f of fills) {
            if (T < f.t0 || T >= f.t1) continue;
            const g = OM.smooth(OM.clamp((T - f.t0) / Math.max(0.2, f.t1 - f.t0)));
            e.build = Math.max(e.build, g);
          }
          if (e.build > 0) {
            e.zoom += opt.fill * e.build;
            const s = opt.fillShake * e.build;
            e.x += s * (0.6 * Math.sin(2 * Math.PI * 17.3 * T + 1.1) + 0.4 * Math.sin(2 * Math.PI * 29.7 * T + 2.3));
            e.y += s * (0.6 * Math.sin(2 * Math.PI * 21.1 * T + 0.4) + 0.4 * Math.sin(2 * Math.PI * 33.9 * T + 1.7));
          }
          for (const t of near(flashes.map((t) => ({ t })), T, 0, ED.FLASH)) e.flash = Math.max(e.flash, opt.flash * flashShape(T - t.t, ED.FLASH));
          return e;
        },
        /**
         * The scene's camera clock: time that surges through each beat (speed 1+amount
         * on the beat, 1-amount between) and equals T at the window's ends and on
         * every beat. Feed it to the camera's own motion, never to word timing.
         */
        clock(T, amount = 0.35) {
          if (T <= start || T >= end) return T;
          const B = beatOnsets();
          let lo = start, hi = end;
          for (const t of B) { if (t <= T && t > lo) lo = t; if (t > T && t < hi) { hi = t; break; } }
          const u = (T - lo) / (hi - lo);
          return lo + (hi - lo) * (u + (amount / (2 * Math.PI)) * Math.sin(2 * Math.PI * u));
        },
      };
    },
    /**
     * A camera with an edit result added: zoom multiplied, shift and roll added,
     * and the zoom raised just enough that the extra shift or roll never shows
     * the canvas edge. With nothing to add, the camera comes back unchanged.
     */
    apply(cam, e) {
      if (!e.zoom && !e.x && !e.y && !e.rot) return cam;
      const c = cam || {}, z0 = c.zoom ?? 1, r0 = c.rot || 0, x0 = c.x || 0, y0 = c.y || 0;
      const W = 1920, H = 1080;
      const need = (r, x, y) => {
        const cr = Math.abs(Math.cos(r)), sr = Math.abs(Math.sin(r));
        return Math.max((cr * (W + 2 * Math.abs(x)) + sr * (H + 2 * Math.abs(y))) / W, (sr * (W + 2 * Math.abs(x)) + cr * (H + 2 * Math.abs(y))) / H);
      };
      const out = { ...c, zoom: z0 * (1 + e.zoom), rot: r0 + e.rot, x: x0 + e.x, y: y0 + e.y };
      const grow = need(out.rot, out.x, out.y) / need(r0, x0, y0);
      if (grow > 1) out.zoom *= grow;
      return out;
    },
    /** Paint a flash over the scene's 2D frame (before its post pass): `ink` at up to `a` opacity. */
    flash(ctx, f, ink, a = 0.35) {
      if (f <= 0) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * f;
      ctx.fillStyle = ink;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    },
  };

  // ---------- the edit camera ----------
  // The film cut to the drums: one camera move over the whole picture (every live
  // scene's <section> gets the same CSS transform), so it runs straight through the
  // cuts without breaking them: both sides of a cut show the same handoff frame
  // under the same camera. The beat grid carries the pulse, at the measured drum
  // onsets (OM.T.beatsOn): a zoom punch on beats 1 and 3 (bigger on the downbeat)
  // and a jolt and roll on the backbeats 2 and 4, each as strong as the drums
  // measured there and only while the drums play. Strong off-beat kicks punch
  // lighter, the beat that lands a cut hits harder, and each drum fill into a
  // downbeat, and the bar into each chorus, builds (zoom creep and shake) and
  // snaps off on that downbeat, which hits hardest of all (the drop). Each section has its own
  // strength (SECTION); a scene tunes or mutes it inside its own window with
  // OM.edit.plan(id, { ... }) at the top of its file (keys as in STAGE, times in
  // `skip` drop the beat within 0.1 s, `off: true` mutes the window).
  // Add ?edit=0 to the page URL to switch it off (seam checks on the raw scenes).
  const STAGE = { punch: 0.032, down: 1.5, offbeat: 0.55, back: 12, roll: 0.008, fill: 0.045, shake: 6, cut: 1.35, drop: 1.6, max: 0.085, skip: [] };
  const SECTION = { i: 0.6, v1: 0.6, p1: 0.85, c1: 1, v2: 0.65, p2: 0.9, c2: 1.1, b: 0.5, x: 0.9, c3: 1.3, o: 0.7 };
  const plans = {};
  let stage = null;
  OM.edit.STAGE = STAGE;
  OM.edit.SECTION = SECTION;
  /** Tune the edit camera inside one scene's window: { punch, down, offbeat, back, roll, fill, shake, cut, drop, max, skip, off }. */
  OM.edit.plan = (id, o) => {
    plans[id] = o;
    stage = null;
  };
  OM.edit.off = typeof location !== 'undefined' && /[?&]edit=0(&|$)/.test(location.search);
  const buildStage = () => {
    const wins = [...document.querySelectorAll('section.scene')].map((el) => {
      const from = parseFloat(el.dataset.start), enter = parseFloat(el.dataset.enter || 0);
      return { el, id: el.id.slice(2), from, start: from + enter, end: from + parseFloat(el.dataset.duration) };
    });
    // A beat's onset sits up to ~60 ms before the cut it lands, so it takes the incoming scene's plan.
    const planAt = (t) => {
      const w = wins.find((w) => t + 0.07 >= w.start && t + 0.07 < w.end);
      if (!w) return null;
      const o = plans[w.id] || {};
      if (o.off) return null;
      const k = SECTION[w.id.split('-')[0]] ?? 1;
      const p = { ...STAGE, punch: STAGE.punch * k, back: STAGE.back * k, roll: STAGE.roll * k, fill: STAGE.fill * k, shake: STAGE.shake * k, ...o };
      p.skip = o.skip || [];
      return p;
    };
    const D = (T && T.drums) || { kick: [], snare: [], hat: [] };
    const all = [...D.kick, ...D.snare, ...D.hat].map((h) => h[0]).sort((a, b) => a - b);
    const playing = (t) => all.filter((x) => Math.abs(x - t) < 1.6).length >= 4;
    const at = (kind, t, r = 0.035) => D[kind].reduce((m, h) => (Math.abs(h[0] - t) < r ? Math.max(m, h[1]) : m), 0);
    const B = beatOnsets(), downs = new Set(((T && T.downbeatsOn) || []).map((t) => Math.round(t * 1000)));
    const cuts = wins.map((w) => w.start).filter((t) => t > 0.5);
    // Builds: the measured drum fills that run into a downbeat, snapping off on it
    // (the rest, and the hat patterns, are grooves inside the bar; a hat roll counts
    // only into a section's opening downbeat), and one bar into each chorus's first
    // beat. Each snap is a drop: that beat hits hardest.
    const DB = (T && T.downbeatsOn) || [];
    const builds = [];
    const entries = wins.filter((w) => /-01$/.test(w.id) || /^x-/.test(w.id)).map((w) => w.start);
    for (const [t0, t1, kind, drum] of (T && T.fills) || []) {
      const db = DB.find((d) => t1 - d > -0.25 && t1 - d < 0.12);
      if (db && db - t0 > 0.3 && drum !== 'hihat') builds.push({ t0, t1: db, k: 1 });
      // A hat roll counts only when it runs into the downbeat that opens a section.
      const de = drum === 'hihat' && kind === 'accel-roll' && DB.find((d) => d - t1 > -0.12 && d - t1 < 0.35 && entries.some((c) => Math.abs(c - d) < 0.15));
      if (de && de - t0 > 0.8) builds.push({ t0, t1: de, k: 0.7 });
    }
    for (const w of wins) {
      if (!/^c\d-01$/.test(w.id)) continue;
      const on = B.reduce((m, b) => (Math.abs(b - w.start) < Math.abs(m - w.start) ? b : m), Infinity);
      if (Math.abs(on - w.start) < 0.15 && !builds.some((f) => Math.abs(f.t1 - on) < 0.2)) builds.push({ t0: on - 4 * (60 / ((T && T.bpm) || 112.3)), t1: on, k: 1 });
    }
    const drops = builds.map((f) => f.t1);
    const ev = [];
    // A jolt's side and angle belong to its beat (index k in the song), so a skip
    // anywhere never changes another beat's throw; backbeats alternate sides.
    let pos = -1, k = -1;
    for (const t of B) {
      k++;
      if (downs.has(Math.round(t * 1000))) pos = 0;
      else if (pos >= 0) pos++;
      if (pos < 0 || !playing(t)) continue;
      const p = planAt(t);
      if (!p || p.skip.some((h) => Math.abs(h - t) < 0.1)) continue;
      const s = weight(Math.max(at('kick', t), at('snare', t), 0.2));
      const boost = (cuts.some((c) => Math.abs(c - t) < 0.1) ? p.cut : 1) * (drops.some((d) => Math.abs(d - t) < 0.03) ? p.drop : 1);
      const th = OM.hash(k, 7, 53) * 0.9 - 0.45, side = (k >> 1) % 2 ? 1 : -1;
      if (pos % 2 === 0) ev.push({ t, punch: p.punch * (pos % 4 === 0 ? p.down : 1) * s * boost, max: p.max });
      else {
        ev.push({ t, jolt: s * boost, dx: p.back * side * Math.cos(th), dy: p.back * 0.6 * Math.sin(th), r: p.roll * side });
        if (boost > 1) ev.push({ t, punch: p.punch * s * (boost - 1) * 2, max: p.max });
      }
    }
    for (const [t, e] of D.kick) {
      if (e < 0.35 || B.some((b) => Math.abs(b - t) < 0.07) || !playing(t)) continue;
      const p = planAt(t);
      if (p && !p.skip.some((h) => Math.abs(h - t) < 0.1)) ev.push({ t, punch: p.punch * p.offbeat * weight(e), max: p.max });
    }
    ev.sort((a, b) => a.t - b.t);
    // A build whose snap a scene skips (its own designed hit lands there) is dropped whole.
    const fills = builds.map(({ t0, t1, k }) => {
      const p = planAt(t1 - 0.08);
      return p && !p.skip.some((h) => Math.abs(h - t1) < 0.1) && { t0, t1, zoom: p.fill * k, shake: p.shake * k, max: p.max };
    }).filter(Boolean);
    return { wins, ev, fills };
  };
  /** The edit camera at song time t: { zoom, x, y, rot, build } (zoom 0 at rest; zoom is the extra, as in OM.edit.scene). */
  OM.edit.stageAt = (t) => {
    if (!stage) stage = buildStage();
    const e = { zoom: 0, x: 0, y: 0, rot: 0, build: 0 };
    let cap = STAGE.max;
    const L = stage.ev;
    let lo = 0, hi = L.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (L[m].t < t - ED.PUNCH) lo = m + 1; else hi = m; }
    for (let i = lo; i < L.length && L[i].t <= t + ED.RISE; i++) {
      const h = L[i], d = t - h.t;
      if (h.punch) { e.zoom += h.punch * punchShape(d, ED.PUNCH); cap = h.max; }
      if (h.jolt) {
        const j = h.jolt * joltShape(d, ED.JOLT);
        e.x += h.dx * j; e.y += h.dy * j; e.rot += h.r * j;
      }
    }
    for (const f of stage.fills) {
      if (t < f.t0 || t >= f.t1) continue;
      const g = OM.smooth(OM.clamp((t - f.t0) / Math.max(0.2, f.t1 - f.t0)));
      if (g <= e.build) continue;
      e.build = g;
      e.zoom += f.zoom * g;
      cap = f.max;
      const s = f.shake * g * g;
      e.x += s * (0.6 * Math.sin(2 * Math.PI * 17.3 * t + 1.1) + 0.4 * Math.sin(2 * Math.PI * 29.7 * t + 2.3));
      e.y += s * (0.6 * Math.sin(2 * Math.PI * 21.1 * t + 0.4) + 0.4 * Math.sin(2 * Math.PI * 33.9 * t + 1.7));
    }
    e.zoom = Math.min(e.zoom, cap);
    return e;
  };
  /** The edit camera's schedule, for inspection: { ev: [{ t, punch | jolt, ... }], fills: [{ t0, t1, ... }] }. */
  OM.edit.schedule = () => {
    if (!stage) stage = buildStage();
    return { ev: stage.ev, fills: stage.fills };
  };
  const shown = new Map();
  const tick0 = OM.tick;
  OM.tick = (t) => {
    tick0(t);
    if (OM.edit.off || !T) return;
    const e = OM.edit.stageAt(t);
    const c = OM.edit.apply(null, e);
    const css = c ? `translate(${c.x.toFixed(2)}px,${c.y.toFixed(2)}px) rotate(${c.rot.toFixed(5)}rad) scale(${c.zoom.toFixed(5)})` : '';
    for (const w of stage.wins) {
      const v = t >= w.from && t <= w.end ? css : '';
      if ((shown.get(w.el) || '') !== v) {
        w.el.style.transform = v;
        shown.set(w.el, v);
      }
    }
  };

  // ---------- placeholder slate for scenes not built yet ----------
  OM.slate = ({ id, device, theme, line }) =>
    OM.scene({
      id,
      build(el) {
        const d = document.createElement('div');
        d.className = 'om-slate';
        const b = document.createElement('b');
        b.textContent = id + (line ? '' : '  (instrumental)');
        const s1 = document.createElement('span');
        s1.textContent = device;
        const s2 = document.createElement('span');
        s2.textContent = 'theme: ' + theme;
        d.append(b, s1, s2);
        el.appendChild(d);
        return {};
      },
    });

  // ---------- the home lattice ----------
  /** The film's shared lattice: the wordmark 1180px wide, centered (cells ~14.6 x 14.3 px). */
  OM.HOME = OM.lattice({ wordWidth: 1180, wordX: 370, wordY: 404 });
  /** Lattice cell under a CSS-px point. */
  OM.cellAt = (L, x, y) => ({ col: Math.floor((x - L.x0) / L.cw), row: Math.floor((y - L.y0) / L.ch) });

  // ---------- the hero field ----------
  const rampCache = new Map();
  /** The hero's radial clearing around the word, per cell (HeroPixelField measure()). */
  function heroRamp(L, mode) {
    const key = `${L.x0},${L.y0},${L.cw},${L.cols},${L.rows},${mode}`;
    if (rampCache.has(key)) return rampCache.get(key);
    const ramp = new Float32Array(L.cols * L.rows);
    for (let r = 0; r < L.rows; r++) {
      const y = L.y0 + (L.rMin + r + 0.5) * L.ch;
      const ny = (y / L.height) * 2 - 1;
      const clear = mode === 'hero' ? OM.clamp((y - 24) / 130, 0.16, 1) : 0.3;
      for (let c = 0; c < L.cols; c++) {
        const x = L.x0 + (L.cMin + c + 0.5) * L.cw;
        const nx = (x / L.width) * 2 - 1;
        const rr = Math.sqrt(nx * nx + ny * ny * 0.82);
        const eased = OM.clamp((rr - 0.42) / 0.85);
        ramp[r * L.cols + c] = (mode === 'hero' ? eased * eased : 1) * clear;
      }
    }
    rampCache.set(key, ramp);
    return ramp;
  }
  OM.heroRamp = heroRamp;

  /** Field inks of a theme as an object (bg, dim, mid, lit, hover, crest). */
  OM.fieldInks = (id) => {
    const t = OM.theme(id);
    return { bg: t['field-bg'], dim: t['field-dim'], mid: t['field-mid'], lit: t['field-lit'], hover: t['field-hover'], crest: t['field-crest'] };
  };

  /** Logo-stamp coverage at a point (HeroPixelField stampAt). */
  OM.stampAt = (stamps, cx, cy) => {
    let amp = 0;
    for (const s of stamps) {
      const lx = Math.floor((cx - s.x) / s.cellPx + 7.5);
      const ly = Math.floor((cy - s.y) / s.cellPx + 7.5);
      if (lx < 0 || ly < 0 || lx >= 15 || ly >= 15) continue;
      if (OM.LOGO.rows[ly][lx] === '1' && s.amp > amp) amp = s.amp;
    }
    return amp;
  };
  /**
   * A click stamp `age` seconds after release (HeroPixelField launch/ping):
   * grows from `from` to `to` cells per logo pixel and fades as it blooms.
   */
  OM.stamp = (x, y, age, L, { charge = 0.2, life, scale = 1 } = {}) => {
    const from = 0.45 + 1.6 * charge;
    const to = (from + 1.0 + 3.2 * charge) * scale;
    const span = life ?? 0.65 + 0.55 * charge;
    const a = age / span;
    if (a < 0 || a >= 1) return null;
    const grow = 1 - Math.pow(1 - a, 3);
    return { x, y, cellPx: L.cw * (from + (to - from) * grow), amp: Math.pow(1 - a, 1.7) };
  };
  /** The hero sprite's roaming path (HeroPixelField draw(), in CSS px). */
  OM.spritePath = (t, w = 1920, h = 1080, phase = 0) => {
    const ts = t + phase;
    const rx = 0.44 * (1 + 0.1 * Math.sin(ts * 0.11));
    const ry = 0.38 * (1 + 0.1 * Math.sin(ts * 0.09 + 2));
    return { x: w * (0.5 + rx * Math.sin(ts * 0.65)), y: h * (0.48 + ry * Math.sin(ts * 0.39 + 1.1)) };
  };

  /**
   * Paint the homepage hero field at time t (seconds of drift).
   * opts:
   *   inks       field inks (OM.fieldInks)
   *   L          lattice (OM.lattice)
   *   mode       'hero' (cleared around the word) | 'flat' (even density)
   *   word       true draws the banded wordmark, 'void' keeps its cells dark, false ignores it
   *   gain       luminance multiplier (1 = the site)
   *   mask(col,row) optional 0..1 multiplier per cell
   *   glows      [{x, y, strength, reach}] in CSS px
   *   stamps     [OM.stamp(...)] live click stamps
   *   bands      Float32Array of 16 spectrum levels 0..1 (mirrored from center)
   *   wordInk(row, col, base) optional override for wordmark cell ink
   *   bg         false to skip clearing
   *   levels     >0 lets bright cells climb the inks by how far they clear the threshold
   */
  OM.hero = (ctx, t, dpr, opts) => {
    const { inks, L } = opts;
    const mode = opts.mode || 'hero';
    const gain = opts.gain ?? 1;
    const ramp = heroRamp(L, mode);
    const word = OM.WORDMARK;
    const glows = opts.glows || [];
    const stamps = opts.stamps || [];
    const bands = opts.bands;
    if (opts.bg !== false) {
      ctx.fillStyle = inks.bg;
      ctx.fillRect(0, 0, L.width, L.height);
    }
    for (let r = 0; r < L.rows; r++) {
      const row = L.rMin + r;
      const cy = L.y0 + (row + 0.5) * L.ch;
      for (let c = 0; c < L.cols; c++) {
        const col = L.cMin + c;
        const inWord = row >= 0 && row < word.h && col >= 0 && col < word.w && word.rows[row][col] === '1';
        if (inWord && opts.word !== false) continue;
        const shade = ramp[r * L.cols + c] * (opts.mask ? opts.mask(col, row) : 1);
        const cx = L.x0 + (col + 0.5) * L.cw;
        let lum = 0;
        if (shade > 0.002) {
          const u = col / 9, v = row / 9;
          const base = 0.6 * OM.heroNoise(u + t * 0.14, v - t * 0.055) + 0.4 * OM.heroNoise(u * 0.55 - t * 0.08, v * 0.55 + t * 0.06);
          const twinkle = 0.5 + 0.5 * Math.sin(t * 1.1 + OM.heroJitter[(row * 37 + col * 11) & 4095] * 6.283);
          lum = shade * (0.3 + 0.52 * base * base + 0.18 * twinkle) * 0.62 * gain;
        }
        let glow = 0;
        for (const g of glows) {
          const dx = cx - g.x, dy = cy - g.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < g.reach) {
            const f = 1 - d / g.reach;
            const a = f * f * g.strength;
            if (a > glow) glow = a;
          }
        }
        lum += glow * 0.6;
        let wave = 0;
        if (stamps.length) {
          wave = OM.stampAt(stamps, cx, cy);
          lum += wave * 1.15;
        }
        let spec = 0;
        if (bands && shade > 0.002) {
          const across = (c + 0.5) / L.cols;
          const side = Math.abs(across - 0.5) * 2;
          const pos = (1 - side) * bands.length - 0.5;
          const b0 = OM.clamp(Math.floor(pos), 0, bands.length - 1), b1 = Math.min(bands.length - 1, b0 + 1);
          const m = OM.clamp(pos - b0);
          const raw = bands[b0] * (1 - m) + bands[b1] * m;
          const level = Math.max(0, (raw - 0.08) / 0.92);
          const fromBottom = L.rows - 1 - r;
          const tall = level * L.rows * 0.92;
          if (level > 0 && fromBottom < tall) {
            spec = level * Math.pow(1 - fromBottom / tall, 0.85);
            lum += spec * 0.7 * Math.min(1, shade * 3);
          }
        }
        const th = OM.threshold(col, row);
        if (lum <= th) continue;
        let heat = Math.max(glow, wave, spec * 0.5);
        if (opts.levels) heat = Math.max(heat, (lum - th) * opts.levels);
        ctx.fillStyle = heat > 0.34 ? inks.lit : heat > 0.1 ? inks.mid : inks.dim;
        OM.cell(ctx, L, col, row, dpr);
      }
    }
    if (opts.word === true) OM.paintWord(ctx, L, dpr, inks, { stamps, glows, wordInk: opts.wordInk });
  };

  /**
   * The hero's lit field cells at time T, without drawing: [{ col, row, heat }]
   * with heat 0..1 by how far each clears its threshold. For scenes that lift
   * the exact field into 3D or particles.
   */
  OM.heroLit = (T, L, { mode = 'hero', gain = 1 } = {}) => {
    const ramp = heroRamp(L, mode);
    const word = OM.WORDMARK;
    const out = [];
    for (let r = 0; r < L.rows; r++) {
      const row = L.rMin + r;
      for (let c = 0; c < L.cols; c++) {
        const col = L.cMin + c;
        if (row >= 0 && row < word.h && col >= 0 && col < word.w && word.rows[row][col] === '1') continue;
        const shade = ramp[r * L.cols + c];
        if (shade <= 0.002) continue;
        const u = col / 9, v = row / 9;
        const base = 0.6 * OM.heroNoise(u + T * 0.14, v - T * 0.055) + 0.4 * OM.heroNoise(u * 0.55 - T * 0.08, v * 0.55 + T * 0.06);
        const twinkle = 0.5 + 0.5 * Math.sin(T * 1.1 + OM.heroJitter[(row * 37 + col * 11) & 4095] * 6.283);
        const lum = shade * (0.3 + 0.52 * base * base + 0.18 * twinkle) * 0.62 * gain;
        const th = OM.threshold(col, row);
        if (lum > th) out.push({ col, row, heat: OM.clamp((lum - th) * 3) });
      }
    }
    return out;
  };

  /** The resting wordmark in its band inks, lifted by stamps and glows like the site. */
  OM.paintWord = (ctx, L, dpr, inks, { stamps = [], glows = [], wordInk = null, rows = null } = {}) => {
    const word = OM.WORDMARK;
    for (let row = 0; row < word.h; row++) {
      if (rows && !rows(row)) continue;
      for (let col = 0; col < word.w; col++) {
        if (word.rows[row][col] !== '1') continue;
        const cx = L.x0 + (col + 0.5) * L.cw, cy = L.y0 + (row + 0.5) * L.ch;
        let crest = stamps.length ? OM.stampAt(stamps, cx, cy) : 0;
        for (const g of glows) {
          const dx = cx - g.x, dy = cy - g.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < g.reach) {
            const f = 1 - d / g.reach;
            crest = Math.max(crest, f * f * g.strength);
          }
        }
        const base = inks[OM.BANDS[row]];
        let ink = crest > 0.45 ? inks.crest : crest > 0.12 ? inks.hover : base;
        if (wordInk) ink = wordInk(row, col, ink) || ink;
        ctx.fillStyle = ink;
        OM.cell(ctx, L, col, row, dpr);
      }
    }
  };

  // ---------- the Omarchy desktop ----------
  /** Dwindle layout: each new window splits the previous one along its longer side. */
  OM.dwindle = (n, x, y, w, h, gap) => {
    const out = [];
    let rx = x, ry = y, rw = w, rh = h;
    for (let i = 0; i < n; i++) {
      if (i === n - 1) { out.push({ x: rx, y: ry, w: rw, h: rh }); break; }
      if (rw >= rh) {
        const half = (rw - gap) / 2;
        out.push({ x: rx, y: ry, w: half, h: rh });
        rx += half + gap; rw = half;
      } else {
        const half = (rh - gap) / 2;
        out.push({ x: rx, y: ry, w: rw, h: half });
        ry += half + gap; rh = half;
      }
    }
    return out;
  };

  /**
   * Paint an Omarchy-style desktop into a rect: theme ground, a waybar along
   * the top, dwindle-tiled windows with 2px borders (the active one in the
   * theme brand) and stylised content (terminal, editor, browser, monitor).
   * s scales every measurement (1 = a 1920x1080 desktop).
   */
  OM.desktop = (ctx, x, y, w, h, themeId, { windows = 3, active = 0, s = w / 1920, seed = 3, contents = null, bar = true } = {}) => {
    const th = OM.theme(themeId);
    const inks = OM.fieldInks(themeId);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = th['bg-deep'];
    ctx.fillRect(x, y, w, h);
    const barH = bar ? 26 * s : 0;
    if (bar) {
      ctx.fillStyle = th.bg;
      ctx.fillRect(x, y, w, barH);
      ctx.font = `${Math.max(1, 13 * s)}px 'JetBrains Mono'`;
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i === active ? th.text : th['text-muted'];
        ctx.fillText(String(i + 1), x + (14 + i * 22) * s, y + barH / 2);
      }
      ctx.fillStyle = th.text;
      ctx.textAlign = 'center';
      ctx.fillText('20:41', x + w / 2, y + barH / 2);
      ctx.textAlign = 'left';
      ctx.fillStyle = th['text-secondary'];
      for (let i = 0; i < 4; i++) ctx.fillRect(x + w - (28 + i * 22) * s, y + barH / 2 - 5 * s, 10 * s, 10 * s);
    }
    const gapOut = 10 * s, gapIn = 10 * s, border = Math.max(1, 2 * s);
    const tiles = OM.dwindle(windows, x + gapOut, y + barH + gapOut * 0.6, w - gapOut * 2, h - barH - gapOut * 1.6, gapIn);
    const rng = OM.rng(seed);
    const kinds = contents || ['term', 'code', 'web', 'top', 'term', 'code'];
    tiles.forEach((r, i) => {
      ctx.fillStyle = i === active ? th.brand : th['border-strong'];
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = th.bg;
      ctx.fillRect(r.x + border, r.y + border, r.w - border * 2, r.h - border * 2);
      paintContent(ctx, kinds[i % kinds.length], r.x + border, r.y + border, r.w - border * 2, r.h - border * 2, th, inks, s, rng);
    });
    ctx.restore();
    return tiles;
  };

  function paintContent(ctx, kind, x, y, w, h, th, inks, s, rng) {
    const pad = 14 * s, lh = 22 * s;
    const rows = Math.floor((h - pad * 2) / lh);
    const palette = [th.text, th['text-secondary'], th.brand, inks.hover, th['text-muted']];
    if (kind === 'web') {
      ctx.fillStyle = th['surface-2'];
      ctx.fillRect(x, y, w, 34 * s);
      ctx.fillStyle = th.surface;
      ctx.fillRect(x + pad, y + 48 * s, w - pad * 2, Math.min(h * 0.32, 220 * s));
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i === 0 ? th.text : th['text-muted'];
        const yy = y + 48 * s + Math.min(h * 0.32, 220 * s) + (18 + i * 20) * s;
        if (yy > y + h - pad) break;
        ctx.fillRect(x + pad, yy, (w - pad * 2) * (i === 0 ? 0.55 : 0.4 + rng() * 0.5), (i === 0 ? 10 : 6) * s);
      }
      return;
    }
    if (kind === 'top') {
      const bars = Math.max(4, Math.floor((w - pad * 2) / (14 * s)));
      for (let i = 0; i < bars; i++) {
        const v = 0.15 + 0.85 * rng();
        ctx.fillStyle = v > 0.8 ? th.brand : inks.mid;
        const bh = (h - pad * 2) * 0.45 * v;
        ctx.fillRect(x + pad + i * 14 * s, y + h - pad - bh, 9 * s, bh);
      }
      for (let i = 0; i < Math.min(rows - 1, 4); i++) {
        ctx.fillStyle = palette[i % 3];
        ctx.fillRect(x + pad, y + pad + i * lh, (w - pad * 2) * (0.3 + 0.4 * rng()), 8 * s);
      }
      return;
    }
    for (let i = 0; i < rows; i++) {
      const yy = y + pad + i * lh;
      const indent = kind === 'code' ? Math.floor(rng() * 4) * 18 * s : 0;
      if (kind === 'term' && i % 4 === 0) {
        ctx.fillStyle = th.brand;
        ctx.fillRect(x + pad, yy, 10 * s, 10 * s);
      }
      let cx = x + pad + indent + (kind === 'term' ? 18 * s : 0);
      const words = 1 + Math.floor(rng() * 5);
      for (let k = 0; k < words; k++) {
        const ww = (24 + rng() * 80) * s;
        if (cx + ww > x + w - pad) break;
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
        ctx.fillRect(cx, yy, ww, 8 * s);
        cx += ww + 10 * s;
      }
    }
  }
})();
