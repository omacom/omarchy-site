// Public live player for play.html: the film drawn in real time against the song,
// full window, no rendering. Click or Space play/pause · ←/→ 5s · F fullscreen ·
// M mute. Add ?stats to the URL for frame times, ?scale=0.5 for half resolution.
(function () {
  const $ = (s) => document.querySelector(s);
  // No WebGL2, no film: the page falls back to the link to the rendered cut.
  if (!document.createElement('canvas').getContext('webgl2')) return document.body.classList.add('nogl');
  const OM = window.OM;
  const audio = $('#song'), root = $('#root'), view = $('#view'), bar = $('#scrub'), head = $('#scrub b');
  // Film time of the audio file's first sample: a copy of the song with its lead-in
  // trimmed sets data-offset, and the film then starts from there.
  // ponytail: the film's first OFFSET seconds are skipped, not played in silence.
  const OFFSET = +audio.dataset.offset || 0;
  const songEnd = () => audio.duration + OFFSET;
  const scenes = [...root.querySelectorAll('section.scene')].map((el) => ({ el, start: +el.dataset.start, end: +el.dataset.start + +el.dataset.duration }));
  const D = Math.max(window.OM_TIMING.duration, ...scenes.map((s) => s.end)); // the film can outrun the song
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

  function fit() {
    const b = view.getBoundingClientRect();
    const s = Math.min(b.width / 1920, b.height / 1080);
    root.style.transform = `translate(${(b.width - 1920 * s) / 2}px, ${(b.height - 1080 * s) / 2}px) scale(${s})`;
  }
  new ResizeObserver(fit).observe(view);

  let t = OFFSET, shown = -1;
  function show(time) {
    for (const s of scenes) s.el.style.display = time >= s.start && time < s.end ? '' : 'none';
    OM.tick(time);
    shown = stats.t = time;
    head.style.width = `${(time / D) * 100}%`;
    $('#time').textContent = `${fmt(time)} / ${fmt(D)}`;
  }
  function seek(time) {
    tailFrom = null;
    t = Math.min(D - 0.001, Math.max(OFFSET, time));
    audio.currentTime = Math.min(t - OFFSET, audio.duration - 0.05); // never seek onto the end: that fires `ended`
    show(t);
  }

  // Frame times: the gap between frames and the cost of drawing one. Shown with
  // ?stats; slow playback drops the resolution, then offers the rendered cut.
  const stats = (window.OM_STATS = { gaps: [], draws: [] });
  const statsEl = new URLSearchParams(location.search).has('stats') ? $('#stats') : null;
  if (statsEl) document.body.classList.add('stats');
  const pct = (a, p) => [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) * p)] || 0;
  let last = 0, slow = 0;
  function measure(now, draw) {
    const gap = now - last;
    last = now;
    if (gap > 250) return; // a seek, a hidden tab
    stats.gaps.push(gap); stats.draws.push(draw);
    if (stats.gaps.length > 600) { stats.gaps.shift(); stats.draws.shift(); }
    // Under about 30 fps: first drop to half resolution, then offer the rendered cut.
    if (++slow % 300 === 0 && pct(stats.gaps, 0.5) > 30) {
      if (!window.OM_LIVE.scale) { window.OM_LIVE.scale = 0.5; stats.gaps.length = stats.draws.length = 0; }
      else document.body.classList.add('slow');
    }
    if (statsEl) statsEl.textContent = `${(1000 / pct(stats.gaps, 0.5)).toFixed(0)} fps · draw ${pct(stats.draws, 0.5).toFixed(1)} ms, p95 ${pct(stats.draws, 0.95).toFixed(1)} ms`;
  }

  // When the audio ends the film keeps going on wall time (scenes.json `tail`).
  let tailFrom = null;
  audio.addEventListener('ended', () => { if (t < D - 0.01) tailFrom = performance.now() - (t - songEnd()) * 1000; });
  function frame(now) {
    const playing = tailFrom !== null || !audio.paused;
    if (tailFrom !== null) {
      t = Math.min(D - 0.001, songEnd() + (now - tailFrom) / 1000);
      if (t >= D - 0.001) tailFrom = null;
    } else if (playing) t = audio.currentTime + OFFSET;
    if (playing || t !== shown) {
      const a = performance.now();
      show(t);
      if (playing) measure(now, performance.now() - a);
    }
    document.body.classList.toggle('playing', playing);
    requestAnimationFrame(frame);
  }

  const toggle = () => {
    if (tailFrom !== null) tailFrom = null;
    else if (!audio.paused) audio.pause();
    else {
      if (t >= D - 0.05) seek(OFFSET); // at the end: play again from the top
      if (t >= songEnd() - 0.05) tailFrom = performance.now() - (t - songEnd()) * 1000; // past the song: only the tail is left
      else audio.play().catch(() => {}); // refused without a gesture: the play card stays up
    }
  };
  view.onclick = toggle;
  const seekFromBar = (e) => seek(((e.clientX - bar.getBoundingClientRect().left) / bar.clientWidth) * D);
  bar.addEventListener('pointerdown', (e) => { bar.setPointerCapture(e.pointerId); seekFromBar(e); });
  bar.addEventListener('pointermove', (e) => e.buttons && seekFromBar(e));
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') toggle();
    else if (e.key === 'ArrowRight') seek(t + 5);
    else if (e.key === 'ArrowLeft') seek(t - 5);
    else if (e.key === 'f' || e.key === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    else if (e.key === 'm' || e.key === 'M') audio.muted = !audio.muted;
    else return;
    e.preventDefault();
  });
  // While the film plays the controls show only when the pointer moves (always with ?stats).
  let idle;
  addEventListener('pointermove', () => {
    document.body.classList.add('active');
    clearTimeout(idle);
    idle = setTimeout(() => document.body.classList.remove('active'), 2000);
  });

  // The song is loaded whole into a blob so it seeks anywhere, whatever serves the
  // page. The deploy ships a compressed copy; a local checkout falls back to the wav.
  const load = (srcs) =>
    fetch(srcs[0]).then((r) => (r.ok ? r.blob() : Promise.reject(r.status))).catch((err) => (srcs.length > 1 ? load(srcs.slice(1)) : Promise.reject(err)));
  const song = load(audio.dataset.src.split(',')).then((b) => {
    audio.src = URL.createObjectURL(b);
    return new Promise((r) => audio.addEventListener('loadedmetadata', r, { once: true }));
  });
  // OM_THREE: set by a page that loads three.js as a module, which arrives after this script.
  Promise.all([document.fonts.ready, song, window.OM_THREE]).then(() => {
    fit();
    OM.prebuild(); // about a second and a half, here rather than on the cut frames
    show(t);
    document.body.classList.add('ready');
    requestAnimationFrame(frame);
  }, (err) => { $('#time').textContent = 'the song did not load'; console.error('[play]', err); });
})();
