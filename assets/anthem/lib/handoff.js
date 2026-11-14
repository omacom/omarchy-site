// Handoff frames: the agreed states scenes cut on. Scenes are built separately
// and never see their neighbours, so every seam is fixed in advance: a scene's
// first frame is exactly its incoming handoff and its last frame is exactly its
// outgoing one, both drawn by OM.handoff, so the hard cut between two scenes
// built apart is invisible.
//
// Also here: OM.sung, a line's words with their aligned timing (the text comes
// from your lyrics file at runtime, never from code), and OM.ownWords, the lines
// whose scene draws its own words, which the caption bar then leaves alone.
(() => {
  const rgba = (hex, a) => {
    const [r, g, b] = OM.rgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  /** A soft elliptical pool of light (radial gradient, squashed to ry/rx). */
  const pool = (ctx, x, y, rx, ry, color, a) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx);
    ctx.restore();
  };
  const center = () => OM.cellAt(OM.HOME, 960, 540);
  const cx = (col) => OM.HOME.x0 + (col + 0.5) * OM.HOME.cw;
  const cy = (row) => OM.HOME.y0 + (row + 0.5) * OM.HOME.ch;

  const STATES = {
    /** Nothing but the field background. */
    night: () => {},
    /** The rented world's blank page: the White theme's background and nothing else. */
    white: (ctx) => {
      ctx.fillStyle = OM.theme('white').bg;
      ctx.fillRect(0, 0, 1920, 1080);
    },
    /** One crest cell at the centre of the home lattice, with a soft halo. */
    spark: (ctx, T, dpr, ink) => {
      const h = center();
      pool(ctx, cx(h.col), cy(h.row), 72, 72, ink.lit, 0.4);
      ctx.fillStyle = ink.crest;
      OM.cell(ctx, OM.HOME, h.col, h.row, dpr);
    },
    /** A wide soft glow filling the centre of the frame. */
    glow: (ctx, T, dpr, ink) => pool(ctx, 960, 540, 620, 620, ink.lit, 0.5),
    /** The homepage field on the home lattice at 0.8 gain, no word. */
    field: (ctx, T, dpr, ink) => OM.hero(ctx, T, dpr, { inks: ink, L: OM.HOME, word: false, gain: 0.8, bg: false }),
    /** The field with the wordmark at home in its band inks. */
    word: (ctx, T, dpr, ink) => {
      STATES.field(ctx, T, dpr, ink);
      OM.paintWord(ctx, OM.HOME, dpr, ink);
    },
    /** A centred 16:10 screen, 1280x800 at (320, 140): dark face, 2px mid-ink border. */
    screen: (ctx, T, dpr, ink, th) => {
      ctx.fillStyle = th.bg;
      ctx.fillRect(320, 140, 1280, 800);
      ctx.strokeStyle = ink.mid;
      ctx.lineWidth = 2;
      ctx.strokeRect(321, 141, 1278, 798);
    },
    /** The home lattice as faint 1px lines across the whole frame. */
    grid: (ctx, T, dpr, ink, th) => {
      const L = OM.HOME, snap = (v) => Math.round(v * dpr) / dpr;
      ctx.fillStyle = th['border-subtle'];
      for (let c = L.cMin; c <= L.cMin + L.cols; c++) ctx.fillRect(snap(L.x0 + c * L.cw), 0, 1, 1080);
      for (let r = L.rMin; r <= L.rMin + L.rows; r++) ctx.fillRect(0, snap(L.y0 + r * L.ch), 1920, 1);
    },
    /** One crest row of cells straight across the frame through the centre row. */
    line: (ctx, T, dpr, ink) => {
      const h = center();
      ctx.fillStyle = ink.crest;
      for (let c = OM.HOME.cMin; c < OM.HOME.cMin + OM.HOME.cols; c++) OM.cell(ctx, OM.HOME, c, h.row, dpr);
    },
    /** A stage spotlight: a faint cone from above onto a pool of light on the floor. */
    spot: (ctx, T, dpr, ink) => {
      const g = ctx.createLinearGradient(0, 0, 0, 880);
      g.addColorStop(0, rgba(ink.lit, 0.1));
      g.addColorStop(1, rgba(ink.lit, 0.03));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(900, 0);
      ctx.lineTo(1020, 0);
      ctx.lineTo(1400, 880);
      ctx.lineTo(520, 880);
      ctx.closePath();
      ctx.fill();
      pool(ctx, 960, 880, 440, 110, ink.lit, 0.42);
    },
  };

  OM.HANDOFFS = Object.keys(STATES);
  /** Paint handoff `name` as the whole frame at global time T (it draws its own background). */
  OM.handoff = (name, ctx, T, dpr) => {
    const ink = OM.fieldInks('tokyo-night'), th = OM.theme('tokyo-night');
    ctx.fillStyle = ink.bg;
    ctx.fillRect(0, 0, 1920, 1080);
    STATES[name](ctx, T, dpr, ink, th);
  };

  OM.ownWords = OM.ownWords || new Set();
  /**
   * A line's sung words: [{ text, space, t0, t1 }], t0/t1 the aligned onset and
   * end (global seconds), space true when a space precedes the word. The text
   * comes from your lyrics file at runtime ('' when there is none).
   */
  OM.sung = (id) => {
    const ly = (window.OM_LYRICS || {})[id] || [];
    return OM.line(id).words.map(([t0, t1], i) => {
      const w = ly[i];
      return { text: w ? w[0] : '', space: i > 0 && (w ? !!(w[1] && w[0]) : true), t0, t1 };
    });
  };
})();
