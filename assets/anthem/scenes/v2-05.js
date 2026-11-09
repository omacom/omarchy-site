// v2-05 · Keycap typing. Out of the dark a 3D board comes up under a low
// gliding camera, and the line is typed on it: each word's letters press their
// caps in a quick run starting exactly on the word's onset, every press firing a
// beam from the cap up to its slot in the line above, where the letter lands in
// crest and cools. The space bar thumps between words. On the last word the
// whole line is pulled down into one point of light, the board goes dark, and
// the spark is the cut into v2-06.

// Edit camera: the defaults fit. The scene's own camera is a slow glide (now on the beat clock) with
// nothing on the drums, so its old beat jiggle is gone and the edit camera carries the beat: the
// downbeat punch lands with the sixth word on 135.660, and the line sits well inside the frame.
OM.edit.plan('v2-05', {});

OM.ownWords.add('v2-05');
// The paper plane, shared with v2-06: the v2-05 > v2-06 match cut folds the typed line into it,
// beside the spark that becomes the agent light.
OM.v2plane = (() => {
  const PLEN = 210, P0 = { x: 560, y: 330, rot: 0.22 };
  const draw = (ctx, x, y, rot, s = 1) => {
    if (s <= 0) return;
    const th = OM.theme('tokyo-night'), ink = OM.fieldInks('tokyo-night');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (s !== 1) { ctx.translate(-PLEN / 2, 0); ctx.scale(s, s); ctx.translate(PLEN / 2, 0); }
    ctx.fillStyle = th['text-secondary'];
    ctx.beginPath(); // the keel fold, underneath
    ctx.moveTo(0, 0); ctx.lineTo(-PLEN * 0.8, 2); ctx.lineTo(-PLEN * 0.96, 46); ctx.lineTo(-PLEN * 0.62, 12); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = th.text;
    ctx.beginPath(); // the near wing
    ctx.moveTo(0, 0); ctx.lineTo(-PLEN, -70); ctx.lineTo(-PLEN * 0.86, -8); ctx.lineTo(-PLEN * 0.8, 2); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ink.crest;
    ctx.beginPath(); // the crease catching light
    ctx.moveTo(0, 0); ctx.lineTo(-PLEN * 0.9, -20); ctx.lineTo(-PLEN * 0.86, -8); ctx.lineTo(-PLEN * 0.8, 2); ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  /** A point inside the folded plane at P0, from two 0..1 numbers. */
  const inside = (a, b) => {
    if (a + b > 1) { a = 1 - a; b = 1 - b; }
    const lx = -PLEN * a - PLEN * 0.8 * b, ly = -70 * a + 2 * b;
    const c = Math.cos(P0.rot), s = Math.sin(P0.rot);
    return [P0.x + lx * c - ly * s, P0.y + lx * s + ly * c];
  };
  /** The shared cut frame at 137.011: the spark and the plane beside it. */
  const cut = (ctx, T, dpr) => {
    OM.handoff('spark', ctx, T, dpr);
    draw(ctx, P0.x, P0.y, P0.rot);
  };
  return { PLEN, P0, draw, inside, cut };
})();
OM.scene({
  id: 'v2-05',
  build(el, { start, duration }) {
    const V = OM.v2;
    const gl = OM.three(el, { alpha: false });
    const ink = V.ink(), th = V.th();
    const sung = OM.sung('v2-05');
    const END = start + duration;
    // A 60% board: [legend, width in units] per row.
    const ROWS = [
      [['Esc', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['Back', 2]],
      [['Tab', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1], ['\\', 1.5]],
      [['Caps', 1.75], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], [';', 1], ["'", 1], ['Return', 2.25]],
      [['Shift', 2.25], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['Shift', 2.75]],
      [['Ctrl', 1.25], ['Super', 1.25], ['Alt', 1.25], ['Space', 6.25], ['Alt', 1.25], ['Fn', 1.25], ['Menu', 1.25], ['Ctrl', 1.25]],
    ];
    const U = 64, GAP = 6;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(ink.bg);
    scene.fog = new THREE.Fog(ink.bg, 900, 2200);
    scene.add(new THREE.HemisphereLight(th.text, ink.bg, 1.3));
    const sun = new THREE.DirectionalLight('#ffffff', 1.5);
    sun.position.set(-300, 900, 500);
    scene.add(sun);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(15.6 * U, 20, 5.6 * U), new THREE.MeshStandardMaterial({ color: th.surface, roughness: 0.8 }));
    plate.position.y = -10;
    scene.add(plate);
    const keys = [];
    const disposables = [plate.geometry, plate.material];
    ROWS.forEach((row, r) => {
      let x = -7.5 * U;
      row.forEach(([label, w]) => {
        const kw = w * U - GAP, kd = U - GAP;
        const kc = document.createElement('canvas');
        kc.width = Math.round(kw * 2);
        kc.height = Math.round(kd * 2);
        const g = kc.getContext('2d');
        const tex = new THREE.CanvasTexture(kc);
        tex.colorSpace = THREE.SRGBColorSpace;
        const paint = (lit) => {
          g.fillStyle = lit ? th.brand : th['surface-2'];
          g.fillRect(0, 0, kc.width, kc.height);
          g.fillStyle = lit ? th['brand-ink'] : th['text-secondary'];
          g.font = `600 ${label.length > 2 ? 22 : 34}px 'JetBrains Mono'`;
          g.textBaseline = 'top';
          g.fillText(label, 14, 12);
          tex.needsUpdate = true;
        };
        paint(false);
        const side = new THREE.MeshStandardMaterial({ color: th['border-strong'], roughness: 0.6 });
        const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
        const geo = new THREE.BoxGeometry(kw, 30, kd);
        const mesh = new THREE.Mesh(geo, [side, side, top, side, side, side]);
        mesh.position.set(x + (w * U) / 2, 15, (r - 2) * U);
        scene.add(mesh);
        keys.push({ label, mesh, paint, lit: false });
        disposables.push(geo, side, top, tex);
        x += w * U;
      });
    });
    const keyFor = (ch) => {
      const u = ch.toUpperCase();
      return keys.find((k) => k.label === u) || null;
    };
    const space = keys.find((k) => k.label === 'Space');
    const camera = new THREE.PerspectiveCamera(30, 1920 / 1080, 10, 4000);
    camera.setViewOffset(1920, 1080, 0, -250, 1920, 1080); // the board sits low, the line above it
    const beat = OM.edit.scene(start, END); // the glide runs on the beat clock, surging through each beat

    // The overlay: typed letters, beams, the fade [line] closing spark.
    const ov = document.createElement('canvas');
    ov.className = 'om-fill';
    ov.style.position = 'absolute';
    ov.style.inset = '0';
    el.appendChild(ov);
    // Macro depth of field across the keys: a disc blur growing away from a focus band that racks
    // along the board; the typed line above the board is always outside it, crisp.
    const FX = `vec4 effect(vec2 uv) {
      vec2 q = cam(uv);
      vec4 base = src(q);
      float crisp = smoothstep(0.4, 0.48, q.y);
      float r = uAmount * (1.0 - crisp) * clamp(abs(q.y - uP0.x) * 3.2, 0.0, 1.0) * 9.0;
      if (r < 0.05) return base;
      vec2 px = r / uRes * (uRes.x / 1920.0) * 2.0;
      vec3 acc = base.rgb;
      for (int i = 0; i < 12; i++) {
        float a = float(i) * 0.5236;
        acc += src(q + vec2(cos(a), sin(a)) * px).rgb + src(q + vec2(cos(a + 0.26), sin(a + 0.26)) * px * 0.5).rgb;
      }
      return vec4(acc / 25.0, 1.0);
    }`;
    const oc = OM.canvas(ov, { alpha: true });
    const fx = OM.post(el, oc, { effect: FX });

    // Every letter's press time: a run from its word's onset, quick enough to finish inside the word.
    let F = null, P = null;
    const plan = () => {
      const probe = V.layout(sung, { cap: 92, maxW: 1680, cx: 960, cy: 0, lead: 1.4 });
      const block = (probe.rows - 1) * probe.lh + probe.capPx; // the line, its top kept clear of the frame edge
      F = V.layout(sung, { cap: 92, maxW: 1680, cx: 960, cy: 180 + block / 2, lead: 1.4 });
      P = [];
      sung.forEach((w, k) => {
        const n = Math.max(1, w.text.length);
        const dt = k === sung.length - 1 ? 0 : OM.clamp((w.t1 - w.t0) / n, 0.028, 0.065); // the last word lands as one chord
        [...w.text].forEach((ch, j) => P.push({ k, j, ch, at: w.t0 + j * dt, key: keyFor(ch), x: F.at[k].x + (j + 0.5) * F.A, cy: F.at[k].cy }));
      });
    };
    const LAST = sung[sung.length - 1].t0;
    // The collapse: the board streams into the spark first while the line still reads (0.3 s whole),
    // then the line follows; the spark is alone two frames before the cut.
    const KB0 = LAST + 0.13, SUCK = LAST + 0.3, GONE = END - 0.085;
    const SPK = { x: OM.HOME.x0 + (OM.cellAt(OM.HOME, 960, 540).col + 0.5) * OM.HOME.cw, y: OM.HOME.y0 + (OM.cellAt(OM.HOME, 960, 540).row + 0.5) * OM.HOME.ch };
    const v = new THREE.Vector3();

    return {
      render(t, T) {
        const o = oc.ensure();
        o.clearRect(0, 0, 1920, 1080);
        if (T < start + V.HOLD_IN) return fx.apply(T), OM.v2keys.cut(o);
        if (T >= END - V.HOLD_OUT) return fx.apply(T), OM.v2plane.cut(o, T, oc.dpr);
        if (!P || !V.met().ok) plan();
        // Keys: down for 0.11 s from each press; the space bar on every word after the first.
        const down = new Set();
        for (const p of P) if (p.key && T >= p.at && T < p.at + 0.11) down.add(p.key);
        sung.forEach((w, k) => { if (k && T >= w.t0 - 0.06 && T < w.t0 + 0.04) down.add(space); });
        keys.forEach((k) => {
          const pressed = down.has(k);
          k.mesh.position.y = pressed ? 5 : 15;
          if (pressed !== k.lit) { k.paint(pressed); k.lit = pressed; }
        });
        // A low glide along the board across the line, on the beat clock (T at both ends).
        const p = OM.ease.inOutSine(OM.clamp((beat.clock(T) - start) / duration));
        camera.position.set(OM.lerp(-380, 340, p), 430, 760);
        camera.lookAt(OM.lerp(-160, 140, p), 0, -20);
        camera.updateMatrixWorld();
        gl.renderer.render(scene, camera);
        o.drawImage(gl.canvas, 0, 0, 1920, 1080); // the board into the overlay, so the post pass sees the whole frame

        const suck = OM.ease.inOutCubic(OM.prog(T, SUCK, GONE));
        const kb = OM.ease.inOutSine(OM.prog(T, KB0, GONE));
        // Match cut in: v2-04's flat key tops gain their depth as the 3D board rises under them.
        const flat = 1 - OM.ease.inOutCubic(OM.prog(T, start + V.HOLD_IN, start + 0.4));
        if (flat > 0) {
          o.globalAlpha = flat;
          OM.v2keys.cut(o);
          o.globalAlpha = 1;
        }
        // The board giving itself up into the spark as motes, at the end.
        const dark = kb;
        if (dark > 0) {
          o.fillStyle = V.rgba(ink.bg, dark);
          o.fillRect(0, 0, 1920, 1080);
        }
        // Beams from each pressed cap to its letter's slot.
        for (const q of P) {
          const age = T - q.at;
          if (!q.key || age < 0 || age > 0.16 || suck > 0) continue;
          v.set(q.key.mesh.position.x, 30, q.key.mesh.position.z).project(camera);
          const kx = (v.x + 1) * 960, ky = (1 - v.y) * 540;
          const a = 1 - age / 0.16;
          const g = o.createLinearGradient(kx, ky, q.x, q.cy);
          g.addColorStop(0, V.rgba(ink.lit, 0.9 * a));
          g.addColorStop(1, V.rgba(ink.crest, 0.15 * a));
          o.strokeStyle = g;
          o.lineWidth = 3;
          o.beginPath();
          o.moveTo(kx, ky);
          o.lineTo(q.x, q.cy + F.capPx / 2);
          o.stroke();
          V.pool(o, kx, ky, 60, 30, ink.lit, 0.5 * a);
        }
        // The typed line: each letter lands in crest on its press and cools to text.
        o.font = F.font;
        o.textAlign = 'center';
        o.textBaseline = 'alphabetic';
        for (const q of P) {
          const age = T - q.at;
          if (age < 0) continue;
          const s = 1 + 0.3 * Math.exp(-age / 0.06);
          // Match cut out: each letter folds into the paper plane beside the spark.
          const [tx, ty] = OM.v2plane.inside(OM.hash(q.k, q.j, 51), OM.hash(q.k, q.j, 52));
          const u = OM.ease.inOutCubic(OM.clamp((suck - OM.hash(q.k, q.j, 53) * 0.3) / 0.7));
          if (u >= 1) continue;
          const x = OM.lerp(q.x, tx, u), y = OM.lerp(q.cy, ty, u);
          o.save();
          o.translate(x, y);
          o.scale(s * (1 - 0.8 * u), s * (1 - 0.8 * u));
          o.fillStyle = OM.mix(ink.crest, th.text, OM.clamp(age / 0.3));
          o.fillText(q.ch, 0, F.capPx / 2);
          o.restore();
        }
        // The spark gathering as the line is pulled in.
        // The board streaming into the spark: motes lifted off the caps, each on its own delay.
        if (kb > 0 && kb < 1) {
          for (let i = 0; i < 70; i++) {
            const hx = OM.hash(i, 9, 61), hy = OM.hash(i, 9, 62), hd = OM.hash(i, 9, 63);
            const u = OM.ease.inCubic(OM.clamp((kb - hd * 0.5) / 0.5));
            if (u <= 0 || u >= 1) continue;
            const x0 = 160 + hx * 1600, y0 = 560 + hy * 440;
            o.fillStyle = V.rgba(i % 3 ? ink.lit : ink.crest, 0.9 * (1 - u * 0.6));
            o.fillRect(OM.lerp(x0, SPK.x, u) - 3, OM.lerp(y0, SPK.y, u) - 3, 6, 6);
          }
        }
        if (kb > 0) {
          V.pool(o, SPK.x, SPK.y, 72, 72, ink.lit, 0.4 * kb);
          o.fillStyle = V.rgba(ink.crest, kb);
          OM.cell(o, OM.HOME, OM.cellAt(OM.HOME, 960, 540).col, OM.cellAt(OM.HOME, 960, 540).row, oc.dpr);
        }
        if (suck > 0) OM.v2plane.draw(o, OM.v2plane.P0.x, OM.v2plane.P0.y, OM.v2plane.P0.rot, OM.ease.inOutCubic(suck)); // the plane folding together
        // Backlight bloom under every pressed cap, and dust hanging in the light over the board.
        if (suck === 0) {
          for (const k of down) {
            v.set(k.mesh.position.x, 8, k.mesh.position.z).project(camera);
            V.pool(o, (v.x + 1) * 960, (1 - v.y) * 540, 90, 46, ink.lit, 0.45);
          }
          for (let i = 0; i < 40; i++) {
            const hx = OM.hash(i, 5, 51), hy = OM.hash(i, 5, 52), hz = OM.hash(i, 5, 53);
            const x = ((hx * 2000 + (T - start) * (12 + 30 * hz)) % 2000) - 40, y = 430 + hy * 600 + 12 * Math.sin(T * 0.8 + i);
            o.fillStyle = V.rgba(ink.hover, (0.15 + 0.35 * hz) * (1 - dark));
            o.fillRect(x, y, 2 + 2 * hz, 2 + 2 * hz);
          }
        }
        const ce = V.camEnv(T, start, END);
        // The beat is the edit camera's now (OM.edit.plan above): no jiggle of its own.
        fx.apply(T, {
          amount: V.env(T, start, END) * (1 - suck),
          cam: { zoom: 1 + ce * (0.012 + 0.025 * p), x: ce * -10 * Math.sin(p * 3.1) },
          p0: [OM.lerp(0.5, 0.18, p), 0, 0, 0],
        });
      },
      release: () => { disposables.forEach((x) => x.dispose()); gl.release(); fx.release(); oc.release(); },
    };
  },
});
