// Per-scene post-processing. A scene draws into its own 2D canvas as usual, and
// OM.post runs that canvas through the scene's OWN fragment shader on a WebGL
// canvas laid over it, with a whole-frame camera move. There is no shared
// overlay: every scene writes its own `vec4 effect(vec2 uv)`.
//
// At rest (amount 0 and the camera at identity) the GL canvas hides and the 2D
// canvas shows directly, so handoff frames at the cuts stay pixel exact. Use
// OM.post.envelope to make sure both are at rest at the window's ends.
//
//   const fx = OM.post(el, c, { effect: `vec4 effect(vec2 uv) { return src(cam(uv)); }` });
//   render(t, T) { ...draw...; fx.apply(T, { amount, cam: { zoom, rot, x, y }, p0: [a, b, c, d] }); }
//   release: () => { fx.release(); c.release(); }
//
// GLSL available to effect(): src(uv) samples the scene (uv origin bottom-left),
// cam(uv) applies the camera, uTime (song time), uAmount (0..1), uRes (device
// pixels), uP0 and uP1 (vec4 scene parameters), hash(vec2) and vnoise(vec2).
(() => {
  const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
  const HEAD = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uTime, uAmount;
uniform mat3 uCam;
uniform vec4 uP0, uP1;
vec4 src(vec2 uv) { return texture(uSrc, uv); }
vec2 cam(vec2 uv) { return (uCam * vec3(uv, 1.0)).xy; }
float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
`;
  const DEFAULT = `vec4 effect(vec2 uv) { return src(cam(uv)); }`;
  const W = 1920, H = 1080;

  /** Output uv (y up) -> source uv, as a column-major mat3: zoom about the centre, rotate (radians, clockwise on screen), shift in CSS px. */
  const camMatrix = ({ zoom = 1, rot = 0, x = 0, y = 0 } = {}) => {
    const c = Math.cos(-rot), s = Math.sin(-rot);
    const f = (u, v) => {
      const px = u * W - W / 2 - x, py = (1 - v) * H - H / 2 - y;
      return [((c * px - s * py) / zoom + W / 2) / W, 1 - ((s * px + c * py) / zoom + H / 2) / H];
    };
    const o = f(0, 0), a = f(1, 0), b = f(0, 1);
    return new Float32Array([a[0] - o[0], a[1] - o[1], 0, b[0] - o[0], b[1] - o[1], 0, o[0], o[1], 1]);
  };
  const atRest = (cam) => !cam || ((cam.zoom ?? 1) === 1 && !cam.rot && !cam.x && !cam.y);

  OM.post = (host, c, { effect = DEFAULT } = {}) => {
    let gl = null, cv = null, prog = null, tex = null, loc = null;
    const init = () => {
      cv = document.createElement('canvas');
      cv.className = 'om-fill';
      host.appendChild(cv);
      gl = cv.getContext('webgl2', { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('[post] WebGL2 unavailable');
      const sh = (type, srcText) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, srcText);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('[post] shader: ' + gl.getShaderInfoLog(s));
        return s;
      };
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, HEAD + effect + '\nvoid main() { outColor = vec4(effect(vUv).rgb, 1.0); }'));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('[post] link: ' + gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      loc = Object.fromEntries(['uSrc', 'uRes', 'uTime', 'uAmount', 'uCam', 'uP0', 'uP1'].map((n) => [n, gl.getUniformLocation(prog, n)]));
    };
    return {
      /** Draw the scene's canvas through its effect at song time T. Returns true when the effect pass ran. */
      apply(T, { amount = 0, cam = null, p0 = [0, 0, 0, 0], p1 = [0, 0, 0, 0] } = {}) {
        if (amount <= 0 && atRest(cam)) {
          if (cv) cv.style.display = 'none';
          return false;
        }
        if (!gl) init();
        const src = c.el;
        if (cv.width !== src.width || cv.height !== src.height) {
          cv.width = src.width;
          cv.height = src.height;
        }
        cv.style.display = '';
        gl.viewport(0, 0, cv.width, cv.height);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        gl.uniform1i(loc.uSrc, 0);
        gl.uniform2f(loc.uRes, cv.width, cv.height);
        gl.uniform1f(loc.uTime, T);
        gl.uniform1f(loc.uAmount, Math.max(0, amount));
        gl.uniformMatrix3fv(loc.uCam, false, camMatrix(cam || {}));
        gl.uniform4fv(loc.uP0, p0);
        gl.uniform4fv(loc.uP1, p1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        return true;
      },
      release() {
        if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();
        if (cv) cv.remove();
        gl = cv = prog = tex = loc = null;
      },
    };
  };
  OM.post.cam = camMatrix;
  /**
   * 0 at both ends of a window, 1 in the middle: exactly 0 for `hold` seconds at
   * each end (so the cut frames are the raw handoff), easing over `ramp` seconds.
   */
  OM.post.envelope = (T, start, end, { ramp = 0.45, hold = 0.07 } = {}) => {
    const a = OM.smooth(OM.clamp((T - start - hold) / ramp)), b = OM.smooth(OM.clamp((end - hold - T) / ramp));
    return Math.min(a, b);
  };
})();
