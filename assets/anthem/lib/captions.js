// Caption layer: the words you supply in lyrics.txt (built into window.OM_LYRICS
// by scripts/build-lyrics.mjs), revealed on their aligned onsets. Each word rises
// in on the site's hero curve as it is sung; the word being sung is brand green
// with a crest underline, sung words rest in text ink, and the line clears once
// it is done. Pure function of composition time, drawn after the scenes.
(() => {
  const LYRICS = window.OM_LYRICS;
  if (!LYRICS) return;
  const LINES = OM.T.lines.filter((l) => LYRICS[l.id]);
  // Lines whose scene keeps its own text low in the frame get their caption at the top.
  const TOP = new Set(['v1-08', 'c1-06', 'c1-07', 'c3-06', 'b-08', 'x-o1']);
  const rise = OM.bezier(0.21, 0.47, 0.32, 0.98);
  const css = document.createElement('style');
  css.textContent = `
    #om-captions { position: absolute; inset: 0; z-index: 50; pointer-events: none; }
    #om-captions .om-cap { position: absolute; left: 50%; transform: translateX(-50%); max-width: 1640px; padding: 12px 26px 14px;
      background: rgba(14, 14, 20, 0.8); font: 600 44px/1.25 'JetBrains Mono', monospace; color: #c0caf5; text-align: center; white-space: pre-wrap; }
    #om-captions .om-cap.bottom { bottom: 58px; }
    #om-captions .om-cap.top { top: 52px; }
    #om-captions .om-capw { display: inline-block; position: relative; }
    #om-captions .om-capw i { position: absolute; left: 0; right: 0; bottom: -6px; height: 4px; background: #daecc6; transform-origin: left; }`;
  document.head.appendChild(css);
  let box = null, shown = null, spans = [];
  const ensure = () => {
    if (box) return box;
    box = document.createElement('div');
    box.id = 'om-captions';
    (document.getElementById('root') || document.body).appendChild(box);
    return box;
  };
  const build = (l) => {
    const el = document.createElement('div');
    el.className = `om-cap ${TOP.has(l.id) ? 'top' : 'bottom'}`;
    spans = LYRICS[l.id].map(([text, space], i) => {
      if (i > 0 && space && text) el.appendChild(document.createTextNode(' ')); // a blank timed word adds no space
      const s = document.createElement('span');
      s.className = 'om-capw';
      s.textContent = text;
      const bar = document.createElement('i');
      s.appendChild(bar);
      el.appendChild(s);
      return { s, bar };
    });
    box.replaceChildren(el);
    return el;
  };
  // The line on screen at t: from just before its first word until shortly after it ends (or the next one starts).
  const lineAt = (t) => {
    for (let i = 0; i < LINES.length; i++) {
      const l = LINES[i], next = LINES[i + 1];
      if (OM.ownWords && OM.ownWords.has(l.id)) continue; // that scene draws its own words
      // A held last word keeps the line up for at most 2.5s (b-08's is aligned 18s long).
      const done = Math.min(l.end, l.words[l.words.length - 1][0] + 2.5);
      const out = Math.min(done + 0.7, next ? next.start - 0.12 : Infinity);
      if (t >= l.start - 0.2 && t < out) return { l, out };
    }
    return null;
  };
  const render = (t) => {
    ensure();
    const hit = lineAt(t);
    if (!hit) {
      if (shown) { box.replaceChildren(); shown = null; }
      return;
    }
    const { l, out } = hit;
    if (shown !== l.id) { build(l); shown = l.id; }
    box.firstChild.style.opacity = String(OM.clamp((out - t) / 0.25));
    l.words.forEach(([ws, we], i) => {
      const { s, bar } = spans[i];
      const a = rise(OM.clamp((t - ws + 0.03) / 0.2));
      s.style.opacity = String(a);
      s.style.transform = `translateY(${((1 - a) * 12).toFixed(2)}px)`;
      const singing = t >= ws - 0.03 && t < Math.max(we, ws + 0.12) + 0.06;
      s.style.color = singing ? '#9ece6a' : '#c0caf5';
      bar.style.transform = `scaleX(${singing ? 1 : OM.clamp(1 - (t - we - 0.06) / 0.2).toFixed(3)})`;
      bar.style.opacity = t >= ws - 0.03 ? '1' : '0';
    });
  };
  const tick = OM.tick;
  OM.tick = (t) => {
    tick(t);
    render(t);
  };
})();
