// x-o1 · Morning after: the name becomes the logo. From the word handoff the
// field dissolves cell by cell into an Omarchy desktop at dawn (bar, gaps, a
// terminal with the gradient border, nvim and a cpu meter tiled beside it). The
// prompt types fastfetch on the hats; on the kick the wordmark's own cells fly
// into the terminal and pack into the block-art mark, and fastfetch prints the
// credits as system info, a line per kick, then its palette swatches. The hard
// stops stutter the cursor and the last line; the output dims, the mark's cells
// fly back out to the wordmark and the desktop dissolves into the field, landing
// on the word handoff the next scene starts on.
//
// Also defines OM.outro, shared with o-01 and x-end: the homepage on the home
// lattice (field, wordmark, the sung line as hero text in half cells, the two
// buttons) and its drain order, so the cuts between those scenes match by
// construction.
//
// Edit camera: x-o1's own camera is a slow dolly, so the camera's beats fit and land with the
// scene's hits (the cells' flight on 281.738, the OS line on the 282.810 downbeat, the maker line on
// 284.936). The desktop fills the frame and the packed mark sits 58 px from the left edge, so the zoom
// is capped at 3% (on top of the dolly's 2%) to keep the mark whole on the 282.810 punch. Inside the
// hard stops the scene's own camera stutters on every stop, so the camera's two beats there (287.606,
// on a stop, and 288.140) are skipped.
OM.edit.plan('x-o1', { max: 0.03, skip: [287.606, 288.14] });
(() => {
  const HEAD = "800 100px 'JetBrains Mono'", LABEL = "600 100px 'JetBrains Mono'";
  window.__hf = window.__hf || {};
  window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['outro-type'] = Promise.all([HEAD, LABEL].map((f) => document.fonts.load(f)));

  const O = (OM.outro = {});
  const L = OM.HOME;
  /** Half cells of the home lattice: the hero text's grid. */
  const H = { x0: L.x0, y0: L.y0, cw: L.cw / 2, ch: L.ch / 2 };
  const cur = OM.cellAt(L, 960, 540);
  O.cursor = cur;
  O.H = H;

  // Drain order: the dither threshold blended with distance to the cursor, so the page empties
  // cell by cell from the edges in toward the one cell that never drains.
  const KEY = new Float32Array(L.cols * L.rows);
  for (let r = 0; r < L.rows; r++)
    for (let c = 0; c < L.cols; c++) {
      const col = L.cMin + c, row = L.rMin + r;
      const d = Math.hypot((col - cur.col) / (L.cols / 2), (row - cur.row) / (L.rows / 2)) / 1.42;
      KEY[r * L.cols + c] = col === cur.col && row === cur.row ? -1 : 0.5 * OM.threshold(col, row) + 0.5 * Math.min(1, d);
    }
  const key = (col, row) => KEY[(row - L.rMin) * L.cols + (col - L.cMin)];
  O.key = key;

  /** Text rasterized onto a cw x ch grid, cap height capRows cells: { cells: [{ q, r, ci }], cols }, r 0 at the cap top. */
  const raster = (text, weight, capRows, cw, ch) => {
    const m = document.createElement('canvas').getContext('2d');
    m.font = `${weight} 100px 'JetBrains Mono'`;
    const capR = m.measureText('H').actualBoundingBoxAscent / 100 || 0.73;
    const font = `${weight} ${((capRows * ch) / capR).toFixed(2)}px 'JetBrains Mono'`;
    m.font = font;
    const adv = m.measureText('M').width;
    const met = m.measureText(text);
    const up = Math.max(capRows, Math.ceil(met.actualBoundingBoxAscent / ch));
    const R = up + Math.ceil(Math.max(0, met.actualBoundingBoxDescent) / ch);
    const pad = 2 * cw, S = 3;
    const cols = Math.ceil((met.width + 2 * pad) / cw);
    const cnv = document.createElement('canvas');
    cnv.width = Math.ceil(cols * cw * S);
    cnv.height = Math.ceil(R * ch * S);
    const x = cnv.getContext('2d', { willReadFrequently: true });
    x.scale(S, S);
    x.font = font;
    x.fillStyle = '#fff';
    x.fillText(text, pad, up * ch);
    const px = x.getImageData(0, 0, cnv.width, cnv.height).data;
    const out = [];
    for (let r = 0; r < R; r++)
      for (let q = 0; q < cols; q++) {
        const xa = Math.floor(q * cw * S), xb = Math.floor((q + 1) * cw * S), ya = Math.floor(r * ch * S), yb = Math.floor((r + 1) * ch * S);
        let sum = 0;
        for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) sum += px[(yy * cnv.width + xx) * 4 + 3];
        if (sum > 0.45 * 255 * (xb - xa) * (yb - ya)) out.push({ q, r: r - (up - capRows), ci: Math.floor(((q + 0.5) * cw - pad) / adv) });
      }
    if (!out.length) for (let r = 0; r < capRows; r++) for (let q = 0; q < 2 * capRows; q++) out.push({ q, r, ci: 0 });
    const q0 = Math.min(...out.map((k) => k.q));
    let q1 = 0;
    for (const k of out) q1 = Math.max(q1, (k.q -= q0));
    return { cells: out, cols: q1 + 1 };
  };
  O.raster = raster;

  // ---- the homepage layout on the home lattice, built once the faces are in ----
  let LAY = null;
  O.layout = () => {
    if (LAY && (LAY.ok || !document.fonts.check(HEAD))) return LAY;
    const ok = document.fonts.check(HEAD) && document.fonts.check(LABEL);
    const sung = OM.sung('o-01');
    const words = sung.map((w) => (w.text ? w.text : '███'));
    const MAXQ = Math.floor(1640 / H.cw);
    /** One line of words [a, b): its text and, per character, which word it belongs to. */
    const lineOf = (a, b) => {
      let text = '';
      const of = [];
      for (let i = a; i < b; i++) {
        if (i > a && sung[i].space !== false) { text += ' '; of.push(-1); }
        for (const _ of words[i]) of.push(i);
        text += words[i];
      }
      return { text, of };
    };
    let lines = null, rows = 10;
    for (rows = 10; rows >= 9 && !lines; rows--) {
      const one = lineOf(0, words.length);
      if (raster(one.text, 800, rows, H.cw, H.ch).cols <= MAXQ) lines = [one];
    }
    if (!lines) {
      // Two lines, split where the wider half is narrowest.
      rows = 9;
      let best = null;
      for (let s = 1; s < words.length; s++) {
        const a = lineOf(0, s), b = lineOf(s, words.length);
        const w = Math.max(raster(a.text, 800, rows, H.cw, H.ch).cols, raster(b.text, 800, rows, H.cw, H.ch).cols);
        if (!best || w < best.w) best = { w, l: [a, b] };
      }
      lines = best ? best.l : [lineOf(0, words.length)];
    } else rows += 1;
    const head = [];
    let hr = 44; // two full cells under the wordmark
    for (const ln of lines) {
      const R = raster(ln.text, 800, rows, H.cw, H.ch);
      const hq0 = Math.round((960 - L.x0) / H.cw - R.cols / 2);
      for (const k of R.cells) {
        const w = ln.of[OM.clamp(k.ci, 0, ln.of.length - 1)];
        const q = hq0 + k.q, r = hr + k.r;
        head.push({ q, r, w: w < 0 ? 0 : w, key: key(Math.floor(q / 2), Math.floor(r / 2)) + 0.004 * OM.hash(q, r, 7) });
      }
      hr += rows + 5;
    }
    // Word centres, for the impacts.
    const centre = words.map((_, i) => {
      const ks = head.filter((k) => k.w === i);
      const n = ks.length || 1;
      return {
        x: H.x0 + (ks.reduce((s, k) => s + k.q, 0) / n + 0.5) * H.cw,
        y: H.y0 + (ks.reduce((s, k) => s + k.r, 0) / n + 0.5) * H.ch,
      };
    });
    // The two buttons, in half cells: filled brand, then outlined surface, labels on a fine grid.
    const LC = 2.4;
    const labA = raster('Get Omarchy', 600, 8, LC, LC), labB = raster('See it in action', 600, 8, LC, LC);
    const bh = 8, gap = 3, pad = 4;
    const bwA = Math.ceil((labA.cols * LC) / H.cw) + 2 * pad, bwB = Math.ceil((labB.cols * LC) / H.cw) + 2 * pad;
    const by = hr + 2;
    const bx = Math.round((960 - L.x0) / H.cw - (bwA + gap + bwB) / 2);
    const btn = [];
    const block = (x0, w, kind, lab) => {
      for (let r = by; r < by + bh; r++)
        for (let q = x0; q < x0 + w; q++)
          btn.push({ q, r, kind, edge: kind === 'b' ? [r === by, r === by + bh - 1, q === x0, q === x0 + w - 1] : null, key: key(Math.floor(q / 2), Math.floor(r / 2)), th: OM.threshold(q, r) });
      const lx = H.x0 + (x0 + w / 2) * H.cw - (lab.cols * LC) / 2, ly = H.y0 + (by + bh / 2) * H.ch - 4 * LC;
      return lab.cells.map((k) => {
        const x = lx + k.q * LC, y = ly + k.r * LC;
        const q = Math.floor((x - H.x0) / H.cw), r = Math.floor((y - H.y0) / H.ch);
        return { x, y, kind, key: key(Math.floor(q / 2), Math.floor(r / 2)), th: OM.threshold(q, r) };
      });
    };
    const labels = [...block(bx, bwA, 'a', labA), ...block(bx + bwA + gap, bwB, 'b', labB)];
    const bxs = btn.map((k) => H.x0 + k.q * H.cw), bys = btn.map((k) => H.y0 + k.r * H.ch);
    const btnBox = { x0: Math.min(...bxs), x1: Math.max(...bxs) + H.cw, y0: Math.min(...bys), y1: Math.max(...bys) + H.ch };
    LAY = { ok, head, centre, btn, btnBox, labels, LC, count: words.length };
    return LAY;
  };

  /**
   * The homepage at time T on the home lattice, as the word handoff draws it, plus the hero text and buttons.
   * left: cells whose drain key is under it survive (1 = the whole page). glows: field/wordmark light.
   * head(cell): { ink, dx, dy } or null to hide; omitted, every word rests in text ink. buttons: 0..1 built.
   */
  O.page = (ctx, T, dpr, { left = 1, glows = [], head, buttons = 1 } = {}) => {
    const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
    const lay = O.layout();
    const drain = left < 1;
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    OM.hero(ctx, T, dpr, {
      inks: ink, L, word: false, gain: 0.8, bg: false, glows,
      mask: drain ? (col, row) => (key(col, row) < left ? 1 : 0) : undefined,
    });
    OM.paintWord(ctx, L, dpr, ink, { glows, wordInk: drain ? (row, col) => (key(col, row) < left ? null : ink.bg) : null });
    // A half-cell knockout around each letter cell keeps the words clear of any lit field behind them.
    const vis = [];
    for (const k of lay.head) {
      if (drain && k.key >= left) continue;
      const s = head ? head(k) : { ink: th.text, dx: 0, dy: 0 };
      if (s) vis.push([k, s]);
    }
    ctx.fillStyle = ink.bg;
    for (const [k, s] of vis) ctx.fillRect(H.x0 + s.dx + (k.q - 1) * H.cw, H.y0 + s.dy + (k.r - 1) * H.ch, 3 * H.cw, 3 * H.ch);
    for (const [k, s] of vis) {
      ctx.fillStyle = s.ink;
      OM.cell(ctx, { x0: H.x0 + s.dx, y0: H.y0 + s.dy, cw: H.cw, ch: H.ch }, k.q, k.r, dpr);
    }
    if (buttons > 0) {
      const grow = buttons * 1.02;
      const sn = (v) => Math.round(v * dpr) / dpr;
      for (const k of lay.btn) {
        if (k.th >= grow || (drain && k.key >= left)) continue;
        ctx.fillStyle = buttons < 1 && grow - k.th < 0.12 ? ink.crest : k.kind === 'a' ? th.brand : th.surface;
        OM.cell(ctx, H, k.q, k.r, dpr);
        if (k.edge) {
          ctx.fillStyle = th['border-strong'];
          const x = sn(H.x0 + k.q * H.cw), y = sn(H.y0 + k.r * H.ch), x2 = sn(H.x0 + (k.q + 1) * H.cw), y2 = sn(H.y0 + (k.r + 1) * H.ch);
          if (k.edge[0]) ctx.fillRect(x, y, x2 - x, 1);
          if (k.edge[1]) ctx.fillRect(x, y2 - 1, x2 - x, 1);
          if (k.edge[2]) ctx.fillRect(x, y, 1, y2 - y);
          if (k.edge[3]) ctx.fillRect(x2 - 1, y, 1, y2 - y);
        }
      }
      const LC = lay.LC;
      for (const k of lay.labels) {
        if (k.th >= grow - 0.12 || (drain && k.key >= left)) continue;
        ctx.fillStyle = k.kind === 'a' ? th['brand-ink'] : th.text;
        ctx.fillRect(sn(k.x), sn(k.y), sn(k.x + LC) - sn(k.x), sn(k.y + LC) - sn(k.y));
      }
    }
  };

  // ---------------------------------------------------------------- x-o1
  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  // Morning light leak with gentle halation: bright cells bloom softly green, and a soft
  // blue-white band of dawn sweeps down across the desktop (uP0.x 0..1).
  const FX = `
vec4 effect(vec2 uv) {
  vec2 p = cam(uv);
  vec3 c = src(p).rgb;
  if (uAmount <= 0.0) return vec4(c, 1.0);
  vec2 px = 1.0 / uRes * (uRes.x / 1920.0);
  vec3 h = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236;
    vec2 o = vec2(cos(a), sin(a));
    for (int j = 1; j <= 2; j++) {
      vec3 s = src(p + o * px * float(j) * 9.0).rgb;
      h += s * smoothstep(0.38, 0.85, dot(s, vec3(0.3, 0.55, 0.15)));
    }
  }
  h /= 24.0;
  float along = dot(uv, normalize(vec2(1.0, 0.75)));
  float band = exp(-pow((along - mix(1.55, 0.15, uP0.x)) / 0.28, 2.0));
  float corner = smoothstep(1.25, 0.0, length(uv - vec2(1.0, 0.95)));
  vec3 leak = vec3(0.663, 0.694, 0.839) * 0.085 * band + vec3(0.62, 0.81, 0.42) * 0.05 * corner;
  c += uAmount * (h * 0.5 * vec3(0.75, 1.0, 0.7) + leak * (0.7 + 0.3 * vnoise(uv * 3.0 + uTime * 0.1)));
  return vec4(c, 1.0);
}`;
  /** Tokyo Night's terminal palette (its ANSI colours), for the prompt, the keys and the swatches. */
  const TN = { black: '#414868', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68', blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#c0caf5' };
  const F_TERM = "500 32px 'JetBrains Mono'", F_BOLD = "800 32px 'JetBrains Mono'", F_MADE = "800 34px 'JetBrains Mono'";
  const F_BAR = "600 22px 'JetBrains Mono'", F_CODE = "400 21px 'JetBrains Mono'";
  window.__hf.buildReady['x-o1-type'] = Promise.all([F_TERM, F_BOLD, F_MADE, F_BAR, F_CODE].map((f) => document.fonts.load(f)));
  /** The drum hit (kick or snare, as measured on the song) nearest t within 50 ms, else t. */
  const hit = (t) => {
    let best = t, d = 0.05;
    for (const kind of ['kick', 'snare']) for (const [x] of OM.edit.hits(kind, t - 0.05, t + 0.05)) if (Math.abs(x - t) < d) (d = Math.abs(x - t)), (best = x);
    return best;
  };
  /** fastfetch's output: the credits as system info, a line per hit (each on its drum as measured). */
  const INFO = [
    { t: hit(282.006), kind: 'head', row: 0 },
    { t: hit(282.285), kind: 'sep', row: 1 },
    { t: hit(282.819), k: 'OS', v: 'Omarchy', row: 3 },
    { t: OM.beatOnset(283.376), k: 'WM', v: 'Hyprland', row: 4 },
    { t: OM.beatOnset(283.91), k: 'Song', v: 'We Can Fix Everything (The Ultimate Machine)', row: 6 },
    { t: hit(284.537), k: 'Music', v: 'Kevin Koontz / REARRANGED', row: 7 },
    { t: OM.beatOnset(284.979), k: 'Made by', v: 'TripleU613', made: true, row: 8 },
    { t: hit(285.698), k: 'Built with', v: 'HyperFrames, Three.js, GSAP', row: 10 },
    { t: hit(285.954), k: 'Theme', v: 'Tokyo Night', row: 11 },
    { t: hit(286.418), k: 'Font', v: 'JetBrains Mono', row: 12 },
    { t: hit(286.952), k: 'Inspired by', v: 'omarchy.org, by DHH', row: 13 },
    { t: OM.beatOnset(287.115), kind: 'swatch', row: 15 },
  ];
  const KEYINK = [TN.blue, TN.magenta, TN.cyan, TN.green, TN.yellow, TN.red];
  const CODE = [
    [['kw', 'const '], ['id', 'scene'], ['op', ' = '], ['fn', 'OM.scene'], ['op', '({']],
    [['op', '  '], ['id', 'id'], ['op', ': '], ['str', "'x-o1'"], ['op', ',']],
    [['op', '  '], ['fn', 'build'], ['op', '(el, { start }) {']],
    [['op', '    '], ['kw', 'const '], ['id', 'fx'], ['op', ' = '], ['fn', 'OM.post'], ['op', '(el);']],
    [['op', '    '], ['kw', 'return '], ['op', '{ render };']],
    [['op', '  },']],
    [['op', '});']],
    [],
    [['cm', '// morning after.']],
    [['cm', '// ship it.']],
  ];
  const CODEINK = { kw: TN.magenta, id: TN.white, op: '#a9b1d6', fn: TN.blue, str: TN.green, cm: '#565f89' };
  /** Tiny bar icons as pixel bitmaps (drawn, not font glyphs). */
  const ICONS = {
    cpu: ['0101010', '1111111', '0100010', '1101011', '0100010', '1111111', '0101010'],
    wifi: ['0011100', '0100010', '1000001', '0011100', '0100010', '0000000', '0001000'],
    vol: ['0001001', '0011010', '1111001', '1111001', '1111001', '0011010', '0001001'],
    bat: ['0111110', '1100011', '1011101', '1011101', '1011101', '1100011', '0111110'],
  };

  // Desktop geometry (1080p px).
  const BAR = 44, TX0 = 14, TY0 = 56, TX1 = 1528, TY1 = 1066, RX0 = 1540, RX1 = 1906, RMID = 540;
  const LH = 50, TOP = TY0 + 34, PX = TX0 + 40; // 1.56x the 32 px type: room to breathe
  const rowBase = (r) => TOP + r * LH + 32;
  const LX = PX + 4, LY = TOP + 2 * LH + 6, LCELL = 24, LSUB = 8; // the mark, 15x15 cells of 3x3 sub-cells
  const IX = LX + 15 * LCELL + 84; // info column, a clear gap from the mark

  OM.scene({
    id: 'x-o1',
    build(el, { start, duration }) {
      const cv = document.createElement('canvas');
      cv.className = 'om-fill';
      el.appendChild(cv);
      const c = OM.canvas(cv, { alpha: false });
      const fx = OM.post(el, c, { effect: FX });
      const ink = OM.fieldInks('tokyo-night');
      const th = OM.theme('tokyo-night');
      const end = start + duration;
      const IN0 = start + 0.07, IN1 = 281.55; // the field dissolves into the desktop
      const TYPE0 = hit(281.031), ENTER = 281.751, FLY0 = 281.751; // fastfetch typed on the hats from the kick, entered on the kick
      const STOPS = [287.486, 287.602, 287.742, 287.858, 287.974, 288.113, 288.253, 288.369, 288.554];
      const PROMPT2 = 287.3, DIM0 = 288.3, DIM1 = 288.6; // the output dims before the wordmark re-forms over it
      const BACK0 = 288.554, OUT0 = 288.62, OUT1 = 289.26, DONE = 289.3;
      const KICKS = [281.031, 281.751, 282.006, 282.285, 282.819, 285.698, 285.954, 286.418, 286.952, 287.022, 288.369, 289.483].map(hit);
      const CMD = 'fastfetch';

      // The wordmark's cells, paired with the mark's sub-cells left to right, so the name packs into the logo.
      const src = OM.cells(OM.WORDMARK).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const dst = [];
      OM.cells(OM.LOGO).forEach(([q, r]) => {
        for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) dst.push({ x: LX + q * LCELL + sx * LSUB, y: LY + r * LCELL + sy * LSUB, row: r * 3 + sy });
      });
      dst.sort((a, b) => a.x - b.x || a.y - b.y);
      const FLY = dst.map((d, j) => {
        const [col, row] = src[Math.floor((j * src.length) / dst.length)];
        return {
          col, row, x0: L.x0 + col * L.cw, y0: L.y0 + row * L.ch, x1: d.x, y1: d.y,
          a: ink[OM.BANDS[row]], b: ink[OM.BANDS[Math.min(18, Math.floor((d.row * 19) / 45))]], s: col / 80,
        };
      });

      const fieldOver = (ctx, T, dpr, keep) => {
        ctx.save();
        ctx.beginPath();
        const sn = (v) => Math.round(v * dpr) / dpr;
        let n = 0;
        for (let r = L.rMin; r < L.rMin + L.rows; r++)
          for (let col = L.cMin; col < L.cMin + L.cols; col++) {
            if (!keep(col, r)) continue;
            n++;
            const x = sn(L.x0 + col * L.cw), y = sn(L.y0 + r * L.ch);
            ctx.rect(x, y, sn(L.x0 + (col + 1) * L.cw) - x, sn(L.y0 + (r + 1) * L.ch) - y);
          }
        if (n) {
          ctx.clip();
          OM.handoff('field', ctx, T, dpr);
        }
        ctx.restore();
      };

      const icon = (ctx, bm, x, y, px, color) => {
        ctx.fillStyle = color;
        bm.forEach((row, r) => { for (let q = 0; q < row.length; q++) if (row[q] === '1') ctx.fillRect(x + q * px, y + r * px, px, px); });
      };

      const drawDesktop = (ctx, T, textA) => {
        const d = OM.smooth(OM.prog(T, 280.9, 289.3)); // dawn
        // Wallpaper: dawn rising from the bottom, seen in the gaps.
        let g = ctx.createLinearGradient(0, 0, 0, 1080);
        g.addColorStop(0, th['bg-deep']);
        g.addColorStop(0.6, OM.mix(th['bg-deep'], th.surface, 0.5 * d));
        g.addColorStop(1, OM.mix(th['bg-deep'], OM.mix(th['border-strong'], ink.mid, 0.3), 0.9 * d));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1920, 1080);
        // The bar: workspaces, the plane and the clock, status icons.
        ctx.fillStyle = ink.bg;
        ctx.fillRect(0, 0, 1920, BAR);
        ctx.fillStyle = th['border-subtle'];
        ctx.fillRect(0, BAR - 1, 1920, 1);
        ctx.font = F_BAR;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i === 0 ? th.text : th['text-muted'];
          ctx.fillText(String(i + 1), 34 + i * 40, BAR / 2 + 1);
        }
        ctx.fillStyle = TN.green;
        ctx.fillRect(24, BAR - 6, 20, 3);
        ctx.fillStyle = th.text;
        ctx.fillText('07:42', 960, BAR / 2 + 1);
        ctx.fillStyle = th['text-secondary'];
        ctx.beginPath();
        ctx.moveTo(880, 23); ctx.lineTo(906, 13); ctx.lineTo(898, 31); ctx.lineTo(893, 25);
        ctx.closePath();
        ctx.fill();
        ctx.textAlign = 'left';
        icon(ctx, ICONS.cpu, 1704, 12, 3, th['text-secondary']);
        icon(ctx, ICONS.wifi, 1756, 12, 3, th['text-secondary']);
        icon(ctx, ICONS.vol, 1808, 12, 3, th['text-secondary']);
        icon(ctx, ICONS.bat, 1860, 12, 3, TN.green);

        // Windows: the terminal (active, the gradient border turning), nvim and the cpu meter.
        ctx.fillStyle = th.bg;
        ctx.fillRect(TX0, TY0, TX1 - TX0, TY1 - TY0);
        ctx.fillRect(RX0, TY0, RX1 - RX0, RMID - TY0);
        ctx.fillRect(RX0, RMID + 10, RX1 - RX0, TY1 - RMID - 10);
        ctx.strokeStyle = th['border-strong'];
        ctx.lineWidth = 2;
        ctx.strokeRect(RX0 + 1, TY0 + 1, RX1 - RX0 - 2, RMID - TY0 - 2);
        ctx.strokeRect(RX0 + 1, RMID + 11, RX1 - RX0 - 2, TY1 - RMID - 12);
        const a = T * 0.7, cx = (TX0 + TX1) / 2, cy = (TY0 + TY1) / 2, rr = 900;
        g = ctx.createLinearGradient(cx - Math.cos(a) * rr, cy - Math.sin(a) * rr, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        g.addColorStop(0, TN.cyan);
        g.addColorStop(0.5, TN.green);
        g.addColorStop(1, TN.blue);
        ctx.strokeStyle = g;
        ctx.lineWidth = 3;
        ctx.strokeRect(TX0 + 1.5, TY0 + 1.5, TX1 - TX0 - 3, TY1 - TY0 - 3);

        // nvim: a little scene code, line numbers, a statusline. Lines truncate a whole glyph inside
        // the 14 px padding, as a real editor without wrap does, and the pane clips its inner area.
        const PAD = 14;
        ctx.save();
        ctx.beginPath();
        ctx.rect(RX0 + PAD, TY0 + PAD, RX1 - RX0 - 2 * PAD, RMID - TY0 - 2 * PAD + 10);
        ctx.clip();
        ctx.font = F_CODE;
        const CADV = ctx.measureText('M').width, CMAX = RX1 - PAD;
        ctx.textBaseline = 'alphabetic';
        CODE.forEach((line, i) => {
          const y = TY0 + 40 + i * 32;
          ctx.fillStyle = i === 3 ? th.text : '#3b4261';
          ctx.textAlign = 'right';
          ctx.fillText(String(i + 1), RX0 + 40, y);
          ctx.textAlign = 'left';
          let x = RX0 + 54;
          for (const [kind, text] of line) {
            const room = Math.floor((CMAX - x) / CADV + 1e-6);
            if (room <= 0) break;
            const shown = text.slice(0, room);
            ctx.fillStyle = CODEINK[kind];
            ctx.fillText(shown, x, y);
            x += shown.length * CADV;
          }
        });
        ctx.restore();
        ctx.fillStyle = TN.green;
        ctx.fillRect(RX0 + 14, RMID - 50, 104, 34); // the statusline sits inside the padding too
        ctx.fillStyle = th['brand-ink'];
        ctx.fillText('NORMAL', RX0 + 26, RMID - 26);
        ctx.fillStyle = th.surface;
        ctx.fillRect(RX0 + 118, RMID - 50, RX1 - RX0 - 132, 34);
        ctx.font = F_CODE;
        ctx.fillStyle = th['text-secondary'];
        ctx.fillText('x-o1.js', RX0 + 134, RMID - 26);

        // The cpu meter: lattice bars that jump on the kicks, inside the pane's padding.
        ctx.save();
        ctx.beginPath();
        ctx.rect(RX0 + 14, RMID + 24, RX1 - RX0 - 28, TY1 - RMID - 38);
        ctx.clip();
        ctx.fillStyle = th['text-secondary'];
        ctx.fillText('cpu', RX0 + 24, RMID + 50);
        ctx.fillStyle = TN.green;
        ctx.fillText(Math.round(18 + 60 * OM.pulse(KICKS, T, 0.15)) + '%', RX0 + 290, RMID + 50);
        const kick = OM.pulse(KICKS, T, 0.13), kn = OM.hitCount(KICKS, T);
        for (let i = 0; i < 10; i++) {
          const lv = OM.clamp(0.15 + 0.25 * (0.5 + 0.5 * Math.sin(T * 1.3 + i * 1.7)) + 0.6 * kick * (0.4 + 0.6 * OM.hash(i, kn, 9)));
          const n = Math.round(lv * 26);
          for (let k = 0; k < n; k++) {
            const f = k / 26;
            ctx.fillStyle = f > 0.85 ? ink.crest : f > 0.65 ? ink.hover : f > 0.4 ? ink.lit : f > 0.2 ? ink.mid : ink.dim;
            ctx.fillRect(RX0 + 24 + i * 32, TY1 - 30 - k * 16, 26, 13);
          }
        }
        ctx.restore();

        // The terminal, its output clipped to the inner area inside a 14 px padding.
        if (textA > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(TX0 + 14, TY0 + 14, TX1 - TX0 - 28, TY1 - TY0 - 28);
          ctx.clip();
          ctx.globalAlpha = textA;
          ctx.font = F_TERM;
          const ADV = ctx.measureText('M').width;
          const prompt = (y) => {
            ctx.font = F_BOLD;
            ctx.fillStyle = TN.blue;
            ctx.fillText('~', PX, y);
            ctx.fillStyle = TN.green;
            ctx.fillText('❯', PX + 2 * ADV, y);
            ctx.font = F_TERM;
            return PX + 4 * ADV;
          };
          const block = (x, y, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y - 30, ADV, 38);
          };
          // The command, a character per hi-hat.
          let x = prompt(rowBase(0));
          const n = Math.max(0, Math.min(CMD.length, Math.floor((T - TYPE0) / 0.067) + 1));
          ctx.fillStyle = th.text;
          ctx.fillText(CMD.slice(0, n), x, rowBase(0));
          if (T < ENTER) block(x + n * ADV, rowBase(0), th.text);
          // The info, a line per hit; each flashes crest as it prints.
          const stop = OM.lastHit(STOPS, T), sk = OM.hitCount(STOPS, T);
          const jolt = stop !== null && T - stop < 0.07;
          let ki = 0;
          INFO.forEach((ln, i) => {
            if (T < ln.t) return;
            const y = rowBase(2 + ln.row); // blank rows part the header, system, credits, build and swatches
            const fresh = T - ln.t < 0.08;
            if (ln.kind === 'head') {
              ctx.font = F_BOLD;
              ctx.fillStyle = fresh ? ink.crest : TN.blue;
              ctx.fillText('tripleu', IX, y);
              ctx.fillStyle = th.text;
              ctx.fillText('@', IX + 7 * ADV, y);
              ctx.fillStyle = fresh ? ink.crest : TN.blue;
              ctx.fillText('omarchy', IX + 8 * ADV, y);
              ctx.font = F_TERM;
            } else if (ln.kind === 'sep') {
              ctx.fillStyle = th['text-muted'];
              ctx.fillText('-'.repeat(15), IX, y);
            } else if (ln.kind === 'swatch') {
              // fastfetch's palette row; it jumps with the cursor on the hard stops.
              const dx = jolt ? Math.round((OM.hash(sk, 1, 4) - 0.5) * 2) * ADV : 0, dy = jolt ? (OM.hash(sk, 2, 4) - 0.5) * 16 : 0;
              Object.values(TN).forEach((col, q) => {
                if (T < ln.t + q * 0.025) return;
                ctx.fillStyle = jolt && q === sk % 8 ? ink.crest : col;
                ctx.fillRect(IX + dx + q * 3 * ADV, y - 30 + dy, 3 * ADV, 38);
              });
            } else if (ln.made) {
              // The maker: the brightest line, on a lit selection band.
              ctx.font = F_MADE;
              const w = ctx.measureText(ln.k + ': ' + ln.v).width;
              ctx.fillStyle = rgba(ink.lit, 0.16);
              ctx.fillRect(IX - 14, y - 36, w + 28, 46);
              ctx.fillStyle = ink.lit;
              ctx.fillRect(IX - 14, y - 36, 5, 46);
              ctx.fillStyle = ink.crest;
              ctx.fillText(ln.k + ': ' + ln.v, IX, y);
              ctx.font = F_TERM;
              ki++;
            } else {
              ctx.font = F_BOLD;
              ctx.fillStyle = fresh ? ink.crest : KEYINK[ki++ % KEYINK.length];
              ctx.fillText(ln.k, IX, y);
              const kw = ctx.measureText(ln.k).width;
              ctx.font = F_TERM;
              ctx.fillStyle = th.text;
              ctx.fillText(': ' + ln.v, IX + kw, y);
            }
          });
          // A fresh prompt; on each hard stop its cursor jumps to a new column and strikes crest.
          if (T >= PROMPT2) {
            const y = rowBase(2 + INFO[INFO.length - 1].row + 1);
            const px = prompt(y);
            const col = sk ? Math.floor(OM.hash(sk, 3, 4) * 8) : 0;
            block(px + col * ADV, y + (jolt ? (OM.hash(sk, 5, 4) - 0.5) * 12 : 0), jolt ? ink.crest : th.text);
          }
          ctx.restore();
        }
      };

      /** The name's cells: at the wordmark, in flight, or packed into the mark. */
      const drawCells = (ctx, T, dpr) => {
        const sn = (v) => Math.round(v * dpr) / dpr;
        for (const f of FLY) {
          const ei = OM.ease.inOutCubic(OM.prog(T, FLY0 + 0.15 * f.s, FLY0 + 0.15 * f.s + 0.38));
          const eo = OM.ease.inOutCubic(OM.prog(T, BACK0 + 0.15 * (1 - f.s), BACK0 + 0.15 * (1 - f.s) + 0.42));
          const e = ei * (1 - eo);
          ctx.fillStyle = e <= 0 ? f.a : e >= 1 ? f.b : OM.mix(f.a, f.b, e);
          if (e <= 0) { OM.cell(ctx, L, f.col, f.row, dpr); continue; }
          const arc = -70 * Math.sin(Math.PI * e) * (0.5 + f.s);
          const x = OM.lerp(f.x0, f.x1, e), y = OM.lerp(f.y0, f.y1, e) + arc;
          const w = OM.lerp(L.cw, LSUB, e), h = OM.lerp(L.ch, LSUB, e);
          ctx.fillRect(sn(x), sn(y), sn(x + w) - sn(x), sn(y + h) - sn(y));
        }
      };

      return {
        render(t, T) {
          const ctx = c.ensure();
          const dpr = c.dpr;
          ctx.globalAlpha = 1;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          // The whole-frame dolly: out to 1.02 as the desktop arrives, settling back to rest before the exit.
          const dolly = OM.smooth(OM.prog(T, 281.6, 282.9)) * (1 - OM.ease.inOutSine(OM.prog(T, 282.9, 287.6)));
          // The hard stops stutter the whole frame with the cursor: on each stop the camera jumps a few px
          // (alternating sides) and a hair in, settling within the cursor's own 70 ms jolt; 0 elsewhere.
          const stop = OM.lastHit(STOPS, T), sk = OM.hitCount(STOPS, T);
          const sj = stop !== null && T - stop < 0.07 ? (1 - (T - stop) / 0.07) ** 2 : 0;
          const stutter = { zoom: 0.006 * sj, x: (sk % 2 ? 7 : -7) * sj, y: (OM.hash(sk, 6, 4) - 0.5) * 8 * sj, rot: 0 };
          const post = () => fx.apply(T, {
            amount: OM.post.envelope(T, start, end, { ramp: 0.6 }) * (0.35 + 0.65 * OM.smooth(OM.prog(T, 280.9, 289.3))) * (1 - OM.smooth(OM.prog(T, 288.6, 289.3))),
            cam: OM.edit.apply({ zoom: 1 + 0.02 * dolly, x: -4 * dolly, y: 2 * dolly }, stutter),
            p0: [OM.prog(T, 281.4, 289.2), 0, 0, 0],
          });
          if (T < IN0 || T >= DONE || T >= end - 0.07) {
            OM.handoff('word', ctx, T, dpr);
            return post();
          }
          drawDesktop(ctx, T, 1 - OM.smooth(OM.prog(T, DIM0, DIM1)));
          if (T < IN1) {
            const p = OM.smooth(OM.prog(T, IN0, IN1));
            fieldOver(ctx, T, dpr, (col, row) => OM.threshold(col, row) >= p);
          } else if (T >= OUT0) {
            const p = OM.smooth(OM.prog(T, OUT0, OUT1));
            fieldOver(ctx, T, dpr, (col, row) => OM.threshold(col, row) < p);
          }
          drawCells(ctx, T, dpr);
          post();
        },
        release: () => {
          fx.release();
          c.release();
        },
      };
    },
  });
})();
