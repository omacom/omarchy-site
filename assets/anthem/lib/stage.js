// The stage: one master clock drives every scene from composition time.
// index.html declares each scene as a timed <section class="clip">; each
// scene script registers OM.scene({ id, build }) and gets render(localT)
// calls only while its window is live. Canvases and WebGL contexts are
// created on activation and released after, so a 5-minute 4K render never
// holds more than the two or three scenes on screen.
(function () {
  const OM = window.OM;
  const defs = {};
  const live = {};
  /** Scenes that have been on screen; only these are torn down, so a prebuilt scene waits for its window. */
  const drawn = {};
  /** Seconds of slack around a window before a scene is torn down. */
  const KEEP = 0.75;

  OM.scene = (def) => {
    defs[def.id] = def;
  };

  /** A scene's window: `from` is when its transition starts, `start` when its line begins. */
  function windowOf(id) {
    const el = document.getElementById('s-' + id);
    const from = parseFloat(el.dataset.start);
    const enter = parseFloat(el.dataset.enter || 0);
    return { el, from, start: from + enter, enter, end: from + parseFloat(el.dataset.duration) };
  }
  /** Reveal the incoming scene through its transition mask while it overlaps the last one. */
  function mask(id, w, t) {
    const tr = (window.OM_TRANS || {})[id];
    const p = tr && w.enter > 0 ? OM.ease.inOutCubic(OM.clamp((t - w.from) / w.enter)) : 1;
    const clip = p < 1 ? OM.transitionClip(tr.type, p, tr.v) : '';
    if (w.el.style.clipPath !== clip) w.el.style.clipPath = clip;
  }

  /** Called with composition time on every seek. */
  OM.tick = (t) => {
    OM.now = t;
    for (const id in defs) {
      const w = windowOf(id);
      const near = t >= w.from - KEEP && t <= w.end + KEEP;
      if (!near) {
        if (live[id] && drawn[id]) {
          live[id].release && live[id].release();
          w.el.replaceChildren();
          delete live[id];
          delete drawn[id];
        }
        continue;
      }
      if (t < w.from || t > w.end) continue;
      mask(id, w, t);
      drawn[id] = true;
      try {
        if (!live[id]) live[id] = defs[id].build(w.el, { duration: w.end - w.start, start: w.start, id }) || {};
        live[id].render && live[id].render(t - w.start, t);
      } catch (err) {
        // A broken scene shows as a labelled error card instead of stalling every other scene.
        if (!live[id] || !live[id].failed) {
          console.error(`[om] scene ${id} failed:`, err);
          w.el.replaceChildren();
          const card = document.createElement('div');
          card.className = 'om-slate';
          card.textContent = `${id}: ${err && err.message}`;
          w.el.appendChild(card);
          live[id] = { failed: true };
        }
      }
    }
  };

  /**
   * Build every scene now. The live player does this while it loads, so no cut
   * frame pays for a build; renders build each scene on its first frame instead.
   */
  OM.prebuild = () => {
    for (const id in defs) {
      if (live[id]) continue;
      const w = windowOf(id);
      try {
        live[id] = defs[id].build(w.el, { duration: w.end - w.start, start: w.start, id }) || {};
      } catch (err) {
        w.el.replaceChildren(); // tick builds it again in its window and shows the error there
      }
    }
  };

  /**
   * Bind the master clock to the root timeline. The proxy's setter runs on
   * every render GSAP does of it, so each seek paints that exact moment.
   */
  OM.mount = (tl, duration) => {
    const proxy = {};
    let current = 0;
    Object.defineProperty(proxy, 't', {
      get: () => current,
      set: (v) => {
        current = v;
        OM.tick(v);
      },
    });
    tl.fromTo(proxy, { t: 0 }, { t: duration, duration, ease: 'none', immediateRender: false }, 0);
  };

  // ---------- WebGL, created per scene and released with it ----------
  /** A Three.js renderer on a fresh canvas at device resolution. */
  OM.three = (host, { width = 1920, height = 1080, alpha = true, antialias = true } = {}) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'om-gl';
    host.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha, antialias, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(OM.drawScale(host, width));
    renderer.setSize(width, height, false);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return {
      renderer,
      canvas,
      release() {
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      },
    };
  };
})();
