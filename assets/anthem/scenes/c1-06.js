// c1-06 · Wild into clean: a merge sort of the line's own letters. One bar per
// letter and space of the sung line (counted at runtime) stands on a run line
// across the centre row, its letter hung under it. They rise out of the lattice
// in a shuffle, so the letters are gibberish and the bars jump with the song's
// spectrum. A merge sort runs one level per word (extra levels on beats inside
// the held first word): each level slides the bars into longer sorted runs,
// underlined on the run line, the sung word's letters flash, and the jumping
// calms. The last level lands on the last word and the line reads; on the
// downbeat a crest check sweeps it as the lattice fades out. Then the bars
// drain into the run line, the letters fold up into it, and it runs out across
// the frame as the crest line.
OM.ownWords.add('c1-06');
// Edit camera: the check on the downbeat after the last word (103.672) is the payoff, so the scene
// punches it itself with the sweep and the camera's downbeat there is skipped; the rest are defaults.
OM.edit.plan('c1-06', { skip: [103.67] });
(() => {
  const FONT = "800 100px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['c1-06-type'] = document.fonts.load(FONT);
  /** A hit on the drum as measured on the song (OM.T.drums): the nearest within 50 ms, else t. */
  const onDrum = (t, kind) => OM.edit.hits(kind, t - 0.05, t + 0.05).reduce((m, h) => (m === null || Math.abs(h[0] - t) < Math.abs(m - t) ? h[0] : m), null) ?? t;
  const KICKS = [101.54, 102.59, 105.88].map((t) => onDrum(t, 'kick')); // the strong kicks, on the drum

  OM.scene({
    id: 'c1-06',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      // Neon bloom with a horizontal glare: the lit bars and letters bloom into the dark around them, and the
      // check sweep throws an anamorphic streak off everything near its front. The letters stay crisp: the
      // light only falls on the ground between them.
      const fx = OM.post(el, c, {
        effect: `vec4 effect(vec2 uv) {
  vec2 q = cam(uv);
  vec4 b = src(q);
  if (uAmount <= 0.0) return b;
  vec2 px = (uRes.y / 1080.0) / uRes;
  float bl = 0.0;
  for (int i = 0; i < 12; i++) {
    float a = 2.39996 * float(i), r = 5.0 + 28.0 * sqrt(float(i) / 12.0);
    vec4 s = src(q + vec2(cos(a), sin(a)) * r * px);
    bl += smoothstep(0.55, 0.85, s.g) * step(s.b + 0.05, s.g) * (1.0 - float(i) / 14.0);
  }
  bl /= 7.0;
  float gl = 0.0;
  for (int i = 1; i <= 10; i++) {
    float o = 1.8 * float(i * i), w = 1.0 - float(i) / 11.0;
    gl += (smoothstep(0.7, 0.9, src(q + vec2(o * px.x, 0.0)).g) + smoothstep(0.7, 0.9, src(q - vec2(o * px.x, 0.0)).g)) * w;
  }
  gl *= uP0.y * (0.25 + 0.75 * exp(-pow((uv.x - uP0.x) * 4.0, 2.0))) / 8.0;
  float l = dot(b.rgb, vec3(0.3, 0.59, 0.11)), ground = 1.0 - smoothstep(0.2, 0.5, l);
  vec3 c = mix(b.rgb, vec3(0.733, 0.867, 0.592), clamp(bl * 0.4 * ground * uAmount, 0.0, 0.6));
  c = mix(c, vec3(0.855, 0.925, 0.776), clamp(gl * 0.55 * ground * uAmount, 0.0, 0.7));
  return vec4(c, 1.0);
}`,
      });
      const L = OM.HOME;
      const ink = OM.fieldInks('tokyo-night');
      const th = OM.theme('tokyo-night');
      const END = start + duration, HOLD = 0.07; // two frames at 30 fps on each handoff
      const sung = OM.sung('c1-06');
      const on = sung.map((w) => w.t0);
      const last = on[on.length - 1];

      // One bar per character of the line, spaces included; its value is its place in the line.
      const chars = [];
      sung.forEach((w, k) => {
        if (w.space) chars.push({ ch: '', word: k });
        for (const ch of w.text ? [...w.text.toUpperCase()] : ['', '', '']) chars.push({ ch, word: k });
      });
      const N = chars.length;

      // Layout: the run line sits on the out-handoff's row; the bars stand on it, the letters hang under it.
      const UL = OM.cellAt(L, 960, 540).row;
      const PITCH = OM.clamp(Math.floor(120 / N), 3, 7), BW = PITCH - 1;
      const COL0 = Math.round(40.5 - (N * PITCH - 1) / 2), COL1 = COL0 + N * PITCH - 1;
      const m = document.createElement('canvas').getContext('2d');
      m.font = FONT;
      const adv = m.measureText('M').width / 100, capEm = m.measureText('H').actualBoundingBoxAscent / 100;
      const FS = Math.min(130, (PITCH * L.cw - 6) / adv), CAP = FS * capEm;
      // Each letter's lattice glyph, centred on x 0 with its baseline at CAP / 2 (built once the face is in).
      const glyphs = new Map();
      const glyph = (ch) => {
        const ok = document.fonts.check(FONT);
        let g = glyphs.get(ch);
        if (!g || g.ok !== ok) glyphs.set(ch, (g = Object.assign(OM.c1.type(ch, -(adv * FS) / 2, CAP / 2, CAP), { ok })));
        return g;
      };
      const yLine = L.y0 + (UL + 0.5) * L.ch, yClip = L.y0 + (UL + 1) * L.ch;
      const yBase = L.y0 + (UL + 2) * L.ch + CAP;
      const BB = UL - 2; // the bars' bottom row
      const HMAX = BB + 16; // the tallest sorted bar tops out at row -15
      const height = (v) => 2 + Math.round((v / Math.max(1, N - 1)) * (HMAX - 2));
      const RAMP = [ink.dim, ink.mid, ink.lit];
      const delay = chars.map((_, v) => OM.hash(v, 1, 0xc106) * 0.05);

      // The merge tree: halves split top-down, merged level by level from the bottom, so the
      // last merge joins two even halves and the line cannot read before it lands.
      const merges = [];
      const tree = (lo, hi) => {
        if (hi - lo < 2) return 0;
        const h = 1 + Math.max(tree(lo, (lo + hi) >> 1), tree((lo + hi) >> 1, hi));
        (merges[h] = merges[h] || []).push([lo, hi]);
        return h;
      };
      const K = tree(0, N);
      const runsAt = [[...Array(N).keys()].map((i) => [i, i + 1])];
      for (let k = 1; k <= K; k++)
        runsAt.push(runsAt[k - 1].filter(([a, b]) => !merges[k].some(([lo, hi]) => a >= lo && b <= hi)).concat(merges[k]).sort((x, y) => x[0] - y[0]));
      const levelsOf = (o) => {
        const out = [o];
        for (let k = 1; k <= K; k++) {
          const next = out[k - 1].slice();
          for (const [lo, hi] of merges[k]) next.splice(lo, hi - lo, ...next.slice(lo, hi).sort((a, b) => a - b));
          out.push(next);
        }
        return out;
      };
      const slotOf = (arr) => { const s = new Array(N); arr.forEach((v, i) => (s[v] = i)); return s; };
      const mask = (list) => { const h = new Uint8Array(N); for (const v of list) h[v] = 1; return h; };
      // No letter home and no two neighbours together: real gibberish.
      const gibberish = (o) => o.every((v, i) => v !== i && (i === 0 || o[i - 1] + 1 !== v));

      // Wild: a shuffle, re-swapped on the sixteenths before the first word. The first seed whose
      // shuffle is gibberish, moves bars on every level and reshuffles most of the line on the last wins.
      const SIX = OM.SPB / 4, beat0 = OM.beatOnset(OM.beatsIn(start - 0.05, start + 0.05)[0] ?? start);
      let wild, sorted;
      for (let seed = 0xc106; seed < 0xc106 + 400; seed++) {
        const rnd = OM.rng(seed);
        const order = [...Array(N).keys()];
        for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        wild = [{ t: -Infinity, order, hot: mask([]) }];
        for (let t = beat0 + SIX; t < on[0] - 0.03; t += SIX) {
          if (t < start + HOLD) continue;
          const o = wild[wild.length - 1].order.slice(), hot = [];
          for (let k = 0; k < Math.max(2, N >> 3); k++) {
            const a = Math.floor(rnd() * N), b = Math.floor(rnd() * N);
            [o[a], o[b]] = [o[b], o[a]];
            hot.push(o[a], o[b]);
          }
          wild.push({ t, order: o, hot: mask(hot) });
        }
        sorted = levelsOf(wild[wild.length - 1].order);
        const moves = sorted.map((s, k) => (k ? s.filter((v, i) => v !== sorted[k - 1][i]).length : N));
        if (wild.every((w) => gibberish(w.order)) && moves.every((n) => n > 0) && moves[K] >= 0.6 * N) break;
      }
      wild.forEach((w) => (w.at = slotOf(w.order)));
      const pos = sorted.map(slotOf);
      const movedAt = pos.map((p, k) => mask(k ? [...p.keys()].filter((v) => p[v] !== pos[k - 1][v]) : []));
      // Each word carries a level; levels beyond the word count land on beats (their drum onsets) inside the held first word.
      const extra = OM.beatsIn(on[0] + 0.25, on[1] - 0.2).map(OM.beatOnset);
      const LEVELS = [on[0], ...extra.slice(Math.max(0, extra.length - (K - on.length))), ...on.slice(1)].slice(-K);
      const MOVE = 0.12;
      const calmOf = (level) => 0.03 + 0.97 * Math.pow(1 - level / K, 1.3);

      // The check on the downbeat after the last word; out: drain on the beat, fold on the downbeat, run out on the kick.
      // Grid times go through OM.beatOnset, so each lands on the drum.
      const CHECK = OM.beatOnset(OM.downbeatsIn(last + 0.15, last + 2)[0] ?? last + 0.4), SWEEP = 0.7;
      const FOLDG = OM.downbeatsIn(CHECK + 1, END - 0.3)[0], FOLD = FOLDG !== undefined ? OM.beatOnset(FOLDG) : END - 0.55;
      const DRAIN = OM.beatOnset(OM.beatsIn((FOLDG ?? FOLD) - OM.SPB - 0.05, (FOLDG ?? FOLD) - 0.05)[0] ?? FOLD - OM.SPB);
      const SPREAD = KICKS.find((k) => k >= FOLD && k < FOLD + 0.2) ?? FOLD + 0.04;
      const OUT = Math.min(SPREAD + 0.3, END - HOLD);
      const TICKS = [104.35, 104.89, 104.95, 105.42, 105.51].map((t) => onDrum(t, 'snare')), THUMP = onDrum(105.14, 'kick');
      const RISE = start + HOLD, GROW = Math.max(0.28, on[0] + 0.03 - RISE); // the chart grows in, eased, arriving with word 0
      // The check: a front from off-left to off-right, fast off the downbeat; passed(x) is when it crosses x.
      const front = (T) => OM.lerp(-80, 2000, OM.ease.outCubic(OM.prog(T, CHECK, CHECK + SWEEP)));
      const passed = (x) => CHECK + SWEEP * (1 - Math.cbrt(1 - OM.clamp((x + 80) / 2080)));

      /** Fill lattice cells [c0, c1) x [r0, r1) as one rect, edges snapped like OM.cell. */
      const rect = (ctx, dpr, c0, r0, c1, r1) => {
        const x = Math.round((L.x0 + c0 * L.cw) * dpr) / dpr, y = Math.round((L.y0 + r0 * L.ch) * dpr) / dpr;
        ctx.fillRect(x, y, Math.round((L.x0 + c1 * L.cw) * dpr) / dpr - x, Math.round((L.y0 + r1 * L.ch) * dpr) / dpr - y);
      };

      // ---- camera: a step in on every merge level, overshooting and settling; home before the line runs out ----
      const STEP = 0.075 / Math.max(1, K);
      const back = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
      const look = (T) => {
        let z = 0;
        for (const t0 of LEVELS) if (T > t0) z += STEP * back(OM.clamp((T - t0) / 0.26));
        z *= 1 - OM.smooth(OM.prog(T, CHECK + SWEEP, DRAIN));
        // The check's punch: the line reads, and the camera hits the downbeat with the sweep.
        const ca = T - CHECK, cp = ca < 0 ? 0 : (1 - Math.exp(-ca / 0.015)) * Math.exp(-ca / 0.14);
        const zoom = 1 + (z + 0.065 * cp) * OM.post.envelope(T, start, OUT, { ramp: 0.3, hold: HOLD });
        const peak = OM.smooth(OM.prog(T, CHECK - 0.06, CHECK + 0.1)) * (1 - OM.smooth(OM.prog(T, CHECK + SWEEP, CHECK + SWEEP + 0.35)));
        const amount = OM.post.envelope(T, start, OUT, { ramp: 0.4, hold: HOLD }) * (0.45 + 0.55 * peak);
        return { amount, cam: { zoom }, p0: [front(T) / 1920, peak, 0, 0] };
      };

      return OM.c1.post({
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          if (T < start + HOLD) return OM.handoff('grid', ctx, T, dpr);
          if (T >= OUT) return OM.handoff('line', ctx, T, dpr);
          // The lattice stays until the check, then fades out evenly across the whole frame.
          OM.handoff('grid', ctx, T, dpr);
          const sw = OM.prog(T, CHECK, CHECK + SWEEP);
          const xs = front(T);
          if (sw > 0) {
            ctx.globalAlpha = OM.ease.inOutSine(sw);
            ctx.fillStyle = ink.bg;
            ctx.fillRect(0, 0, 1920, 1080);
            ctx.globalAlpha = 1;
          }

          // Where each bar stands: the wild order, or a merge level sliding (cell-snapped) on its hit.
          const level = OM.hitCount(LEVELS, T);
          let at, moved, heat;
          if (level === 0) {
            let w = wild[0];
            for (const x of wild) if (x.t <= T) w = x;
            at = w.at;
            moved = w.hot;
            heat = Math.pow(0.5, (T - w.t) / 0.06);
          } else {
            const t0 = LEVELS[level - 1], p = OM.ease.outExpo(OM.clamp((T - t0) / MOVE));
            at = pos[level].map((s, v) => OM.lerp(pos[level - 1][v], s, p));
            moved = movedAt[level];
            heat = Math.pow(0.5, (T - t0) / 0.08);
          }
          const cols = at.map((s) => COL0 + Math.round(s * PITCH));
          const a = OM.audio(T);
          const calm = calmOf(level);
          const kick = OM.pulse(KICKS, T, 0.09);
          const drain = OM.ease.inCubic(OM.prog(T, DRAIN, FOLD));
          const fold = 1 - OM.ease.inCubic(OM.prog(T, FOLD, FOLD + 0.1));
          const uRise = OM.ease.inOutCubic(OM.prog(T, RISE, RISE + GROW));

          // Pause sprinkles. Checker tick: each snare runs a crest cursor along the sorted bar tops, left to right,
          // re-checking the order. Run-line thump: the 105.154 kick squashes every bar a cell into the run line.
          const tick = (col) => TICKS.some((s0) => {
            const a = (T - s0) / 0.3;
            return a >= 0 && a < 1 && Math.abs(col - OM.lerp(COL0 - 4, COL1 + 4, a)) < PITCH * 4.5;
          });
          const thump = T >= THUMP && T < THUMP + 0.16 ? Math.pow(0.5, (T - THUMP) / 0.05) : 0;
          // Bars: height is the letter's place in the line, jumping with the spectrum while unsorted.
          for (let v = 0; v < N; v++) {
            const rise = OM.ease.inOutCubic(OM.prog(T, RISE + delay[v], RISE + delay[v] + GROW - 0.03));
            const band = a.bands[Math.min(15, Math.floor((at[v] / N) * 16))];
            const jump = 1 + calm * (band * 0.9 - 0.35 + kick * 0.3);
            const h = OM.clamp(Math.round(height(v) * jump * rise * (1 - drain)) - (thump > 0.3 ? 1 : 0), 0, HMAX + 5);
            if (h <= 0) continue;
            const col = cols[v], top = BB - h + 1;
            const lit = T - passed(L.x0 + (col + BW / 2) * L.cw);
            const swept = (sw > 0 && lit >= 0 && lit < 0.12) || tick(col) || thump > 0.35; // each bar flashes as the check crosses it, and on the pause sprinkles
            ctx.fillStyle = swept ? ink.crest : RAMP[Math.min(2, Math.floor((v / N) * 3))];
            rect(ctx, dpr, col, top, col + BW, BB + 1);
            if (swept) continue;
            const hot = (moved[v] && heat > 0.25) || tick(col);
            ctx.fillStyle = hot ? ink.crest : ink.hover;
            rect(ctx, dpr, col, top, col + BW, Math.min(BB + 1, top + (hot ? 2 : 1)));
          }

          // Letters hung under their bars: quiet until their word is sung, then they flash; crest once checked.
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, yClip, 1920, 1080 - yClip); // they unfold out of, and fold back into, the run line
          ctx.clip();
          ctx.font = `800 ${FS.toFixed(2)}px 'JetBrains Mono'`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          for (let v = 0; v < N; v++) {
            const { ch, word } = chars[v];
            if (!ch || fold <= 0) continue;
            const rise = OM.ease.inOutCubic(OM.prog(T, RISE + delay[v], RISE + delay[v] + GROW));
            const since = T - on[word];
            const xc = L.x0 + (cols[v] + BW / 2) * L.cw;
            const band = a.bands[Math.min(15, Math.floor((at[v] / N) * 16))];
            const yMid = yBase - CAP / 2 + calm * (band * 16 + kick * 10) - (1 - rise) * (CAP + 24);
            const checked = sw > 0 && xc < xs, flash = since >= 0 && since < 0.12;
            const tick = checked ? 0.1 * Math.pow(0.5, (T - passed(xc)) / 0.06) : 0;
            const pop = (since >= 0 ? 1 + 0.16 * Math.pow(0.5, since / 0.07) : 1) + tick;
            // Omarchy lattice type: each letter is 8 px squares on a 9 px pitch, inked down its cap.
            const gl = glyph(ch);
            ctx.save();
            ctx.translate(Math.round(xc), yLine);
            ctx.scale(1, fold);
            ctx.translate(0, Math.round(yMid - yLine));
            ctx.scale(pop, pop);
            for (const [x, y, f] of gl.cells) {
              ctx.fillStyle = checked || flash ? ink.crest : since >= 0 ? OM.c1.typeInk(f, ink) : ink.mid;
              ctx.fillRect(x, y, 8, 8);
            }
            ctx.restore();
          }
          ctx.restore();

          // Sorted runs, underlined on the centre row, longer each level until one spans the line. The check turns it crest; then it runs out.
          const sp = OM.ease.outExpo(OM.prog(T, SPREAD, SPREAD + 0.3));
          if (sp > 0) {
            ctx.fillStyle = ink.crest;
            rect(ctx, dpr, Math.round(OM.lerp(COL0, L.cMin, sp)), UL, Math.round(OM.lerp(COL1, L.cMin + L.cols, sp)), UL + 1);
          } else {
            const cS = (xs - L.x0) / L.cw;
            for (const [i, j] of runsAt[level]) {
              const c0 = COL0 + i * PITCH, c1 = COL0 + j * PITCH - 1, run = j - i;
              const half = ((c1 - c0) / 2) * uRise, mid = (c0 + c1) / 2;
              const u0 = Math.round(mid - half), u1 = Math.round(mid + half);
              if (u1 <= u0) continue;
              ctx.fillStyle = level > 0 && heat > 0.3 && run > 1 ? ink.crest : level >= K ? ink.lit : ink.mid;
              rect(ctx, dpr, u0, UL, u1, UL + 1);
              if (sw > 0 && cS > u0) {
                ctx.fillStyle = ink.crest;
                rect(ctx, dpr, u0, UL, Math.min(u1, Math.floor(cS)), UL + 1);
              }
            }
          }

          // The algorithm's own readout under the letters, folding away with them.
          if (fold > 0) {
            ctx.save();
            ctx.translate(0, yLine);
            ctx.scale(1, fold);
            ctx.translate(0, -yLine);
            ctx.globalAlpha = uRise;
            ctx.font = "500 24px 'JetBrains Mono'";
            ctx.textBaseline = 'middle';
            const yLab = yBase + 36;
            ctx.fillStyle = th['text-muted'];
            ctx.textAlign = 'left';
            ctx.fillText(level === 0 ? 'shuffle' : sw >= 1 ? 'sorted' : 'merge sort', L.x0 + COL0 * L.cw, yLab);
            ctx.fillStyle = sw >= 1 ? th.brand : th['text-secondary'];
            ctx.textAlign = 'right';
            ctx.fillText(`runs ${runsAt[level].length}`, L.x0 + COL1 * L.cw, yLab);
            ctx.restore();
          }

          // Bit-sparks: every bar that swaps throws a couple of lattice bits off its top.
          const swaps = level > 0 ? [[LEVELS[level - 1], movedAt[level]]] : wild.filter((w) => w.t > -Infinity && T - w.t < 0.35).map((w) => [w.t, w.hot]);
          const bit = L.cw / 3;
          for (const [t0, mv] of swaps)
            for (let v = 0; v < N; v++) {
              if (!mv[v]) continue;
              const x = L.x0 + (cols[v] + BW / 2) * L.cw, y = L.y0 + (BB - height(v) + 1) * L.ch;
              OM.c1.burst(T, t0, 3, v * 131 + Math.round(t0 * 100), { x, y, speed: 420, spread: 1.6, g: 1500, life: 0.35 }, (px, py, u) => {
                ctx.globalAlpha = 1 - u;
                ctx.fillStyle = u < 0.4 ? ink.crest : ink.lit;
                ctx.fillRect(Math.round(px * dpr) / dpr, Math.round(py * dpr) / dpr, bit, bit);
              });
            }
          ctx.globalAlpha = 1;
        },
        release: () => c.release(),
      }, fx, look);
    },
  });
})();
