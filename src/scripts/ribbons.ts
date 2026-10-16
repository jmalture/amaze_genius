/**
 * Amaze Genius "string-art" ribbons: hundreds of thin lines that form twisting rainbow ribbons, plus lens-flare
 * sparkles that ride along them. Plain WebGL 1 (no Three.js): the whole renderer is a few KB, so the hero stays
 * at 100 in PageSpeed.
 *
 * Every line point is computed on the GPU from (u = along the ribbon, v = across it, r = ribbon index), so the
 * CPU only uploads a static buffer once and then sets a handful of uniforms per frame.
 *
 * Usage: createRibbons(canvas, { ribbons: [...] }). Returns a controller or null when WebGL is unavailable
 * (the caller then keeps its CSS fallback).
 */

export interface Ribbon {
  /** vertical centre (clip units, -1 bottom … 1 top) */
  y: number;
  /** tilt: how much the ribbon rises from left to right */
  slope: number;
  /** wave amplitude and frequency */
  amp: number;
  freq: number;
  /** phase offset so ribbons don't move in sync */
  phase: number;
  /** how many half-turns the ribbon twists along its length */
  twist: number;
  /** ribbon width */
  width: number;
  /** animation speed */
  speed: number;
  /** colour: start hue (0 red … 0.83 magenta) and how far it walks along the ribbon */
  hue: number;
  hueSpan: number;
  /** depth (-1 far … 0.5 near) */
  z: number;
  /** brightness multiplier */
  gain?: number;
}

export interface RibbonOptions {
  ribbons: Ribbon[];
  /** lines per ribbon (desktop) */
  lines?: number;
  /** segments per line */
  segments?: number;
  /** number of lens-flare sparkles */
  sparkles?: number;
  /** base line opacity */
  alpha?: number;
  /** horizontal overscan: 1 = ribbons end at the screen edge */
  span?: number;
  /** element that receives pointer movement (default: window) */
  pointerTarget?: HTMLElement | Window;
  /** play the left-to-right draw-in */
  intro?: boolean;
  /** reduced motion: render one still frame */
  still?: boolean;
}

const MAX_RIBBONS = 4;

const COMMON = /* glsl */ `
precision highp float;
uniform float uT;
uniform float uAspect;
uniform float uIntro;
uniform float uSpan;
uniform float uScroll;
uniform vec2 uMouse;
uniform vec4 uA[${MAX_RIBBONS}]; // y, slope, amp, freq
uniform vec4 uB[${MAX_RIBBONS}]; // phase, twist, width, speed
uniform vec4 uC[${MAX_RIBBONS}]; // hue, hueSpan, z, gain

vec3 hsv(float h, float s, float v) {
  vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(vec3(1.0), k, s);
}

// Point on ribbon r at (u along, v across). Returns world position; s = perspective scale.
vec3 ribbon(float u, float v, int r, out float s) {
  vec4 A = uA[r];
  vec4 B = uB[r];
  vec4 C = uC[r];
  float t = uT * B.w;
  float xu = u * 2.0 - 1.0;
  float x = xu * uSpan * uAspect;
  float cy = A.x + A.y * xu
    + A.z * (0.72 * sin(u * A.w + t + B.x) + 0.28 * sin(u * A.w * 2.3 - t * 1.4 + B.x * 1.7))
    + uMouse.y * 0.06 * (0.6 + C.z)
    - uScroll * (0.25 + 0.15 * C.z);
  float cz = C.z + 0.22 * sin(u * 2.4 + t * 0.8 + B.x);
  float th = B.y * (u - 0.5) * 3.14159 + t * 0.7 + B.x + uMouse.x * 0.9 * (u - 0.5) + uScroll * 1.6;
  float taper = 0.5 + 0.5 * sin(u * 3.14159);
  float w = B.z * (v - 0.5) * (0.35 + 0.65 * taper);
  vec3 p = vec3(x, cy + w * cos(th), cz + w * sin(th));
  s = 2.6 / (2.6 - p.z);
  return p;
}

float reveal(float u) {
  return smoothstep(u - 0.16, u, uIntro * 1.18);
}
`;

const LINE_VS = /* glsl */ `${COMMON}
attribute vec3 a;
varying vec3 vCol;
varying float vA;
uniform float uAlpha;
void main() {
  int r = int(a.z + 0.5);
  float s;
  vec3 p = ribbon(a.x, a.y, r, s);
  gl_Position = vec4(p.x * s / uAspect, p.y * s, 0.0, 1.0);
  vec4 C = uC[r];
  float h = C.x + C.y * a.x + (a.y - 0.5) * 0.04 + uT * 0.004;
  vCol = hsv(fract(h), 0.82, 1.0);
  float edge = smoothstep(0.0, 0.1, a.x) * smoothstep(1.0, 0.88, a.x);
  // the outer lines of a ribbon are a touch brighter, like the 2023 network motif
  float rim = 0.75 + 0.25 * smoothstep(0.3, 0.5, abs(a.y - 0.5));
  vA = uAlpha * C.w * edge * rim * reveal(a.x) * (0.55 + 0.45 * s);
}`;

const LINE_FS = /* glsl */ `
precision highp float;
varying vec3 vCol;
varying float vA;
void main() {
  gl_FragColor = vec4(vCol * vA, vA);
}`;

const SPARK_VS = /* glsl */ `${COMMON}
attribute vec4 b; // u0, v, ribbon, seed
uniform float uDpr;
varying vec3 vCol;
varying float vA;
void main() {
  int r = int(b.z + 0.5);
  float u = fract(b.x + uT * (0.008 + 0.012 * b.w));
  float s;
  vec3 p = ribbon(u, b.y, r, s);
  gl_Position = vec4(p.x * s / uAspect, p.y * s, 0.0, 1.0);
  float tw = 0.5 + 0.5 * sin(uT * (0.7 + b.w) + b.w * 40.0);
  tw = tw * tw * tw;
  vec4 C = uC[r];
  vCol = mix(hsv(fract(C.x + C.y * u), 0.7, 1.0), vec3(1.0), 0.45);
  float edge = smoothstep(0.04, 0.16, u) * smoothstep(0.96, 0.84, u);
  vA = tw * edge * reveal(u);
  gl_PointSize = (18.0 + 46.0 * tw) * uDpr * s;
}`;

const SPARK_FS = /* glsl */ `
precision highp float;
varying vec3 vCol;
varying float vA;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float core = exp(-r * r * 260.0);
  float glow = exp(-r * r * 28.0) * 0.45;
  float rays = max(0.0, 1.0 - abs(d.x) * 30.0) * smoothstep(0.5, 0.0, abs(d.y))
             + max(0.0, 1.0 - abs(d.y) * 30.0) * smoothstep(0.5, 0.0, abs(d.x));
  float a = (core + glow + rays * 0.5) * vA;
  gl_FragColor = vec4(mix(vCol, vec3(1.0), core) * a, a);
}`;

function compile(gl: WebGLRenderingContext, vs: string, fs: string) {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
    return sh;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, make(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, make(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  return p;
}

export function createRibbons(canvas: HTMLCanvasElement, opts: RibbonOptions) {
  opts = { ...opts };
  const gl = canvas.getContext('webgl', {
    antialias: true,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  // No GPU (software rasteriser, e.g. SwiftShader in headless Chrome / PageSpeed, or llvmpipe): animating a
  // hundred thousand line vertices on the CPU would block the main thread, so draw one lighter still frame instead.
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  const software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  if (software) opts = { ...opts, still: true };

  let lineProg: WebGLProgram;
  let sparkProg: WebGLProgram;
  try {
    lineProg = compile(gl, LINE_VS, LINE_FS);
    sparkProg = compile(gl, SPARK_VS, SPARK_FS);
  } catch (e) {
    console.warn('[ribbons]', e);
    return null;
  }

  const ribbons = opts.ribbons.slice(0, MAX_RIBBONS);
  const small = Math.min(innerWidth, innerHeight) < 700;
  const LINES = Math.round((opts.lines ?? 96) * (small ? 0.6 : 1) * (software ? 0.6 : 1));
  const SEGS = Math.round((opts.segments ?? 180) * (small ? 0.7 : 1) * (software ? 0.5 : 1));
  const SPARKS = opts.sparkles ?? 10;

  // Line buffer: every segment as a pair of vertices (gl.LINES) → one draw call for all ribbons.
  const verts = new Float32Array(ribbons.length * LINES * SEGS * 2 * 3);
  let k = 0;
  for (let r = 0; r < ribbons.length; r++)
    for (let l = 0; l < LINES; l++) {
      const v = l / (LINES - 1);
      for (let s = 0; s < SEGS; s++) {
        const u0 = s / SEGS;
        const u1 = (s + 1) / SEGS;
        verts.set([u0, v, r, u1, v, r], k);
        k += 6;
      }
    }
  const lineBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  const lineCount = verts.length / 3;

  // Sparkles: seeded so the composition is the same on every load.
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const sp = new Float32Array(SPARKS * 4);
  for (let i = 0; i < SPARKS; i++) sp.set([rnd(), rnd() < 0.5 ? 0 : 1, i % ribbons.length, rnd()], i * 4);
  const sparkBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf);
  gl.bufferData(gl.ARRAY_BUFFER, sp, gl.STATIC_DRAW);

  // Pack ribbon params into uniform arrays.
  const A = new Float32Array(MAX_RIBBONS * 4);
  const B = new Float32Array(MAX_RIBBONS * 4);
  const C = new Float32Array(MAX_RIBBONS * 4);
  ribbons.forEach((rb, i) => {
    A.set([rb.y, rb.slope, rb.amp, rb.freq], i * 4);
    B.set([rb.phase, rb.twist, rb.width, rb.speed], i * 4);
    C.set([rb.hue, rb.hueSpan, rb.z, rb.gain ?? 1], i * 4);
  });

  const loc = (p: WebGLProgram) => ({
    uT: gl.getUniformLocation(p, 'uT'),
    uAspect: gl.getUniformLocation(p, 'uAspect'),
    uIntro: gl.getUniformLocation(p, 'uIntro'),
    uSpan: gl.getUniformLocation(p, 'uSpan'),
    uScroll: gl.getUniformLocation(p, 'uScroll'),
    uMouse: gl.getUniformLocation(p, 'uMouse'),
    uA: gl.getUniformLocation(p, 'uA'),
    uB: gl.getUniformLocation(p, 'uB'),
    uC: gl.getUniformLocation(p, 'uC'),
    uAlpha: gl.getUniformLocation(p, 'uAlpha'),
    uDpr: gl.getUniformLocation(p, 'uDpr'),
  });
  const L = loc(lineProg);
  const S = loc(sparkProg);
  const aLine = gl.getAttribLocation(lineProg, 'a');
  const aSpark = gl.getAttribLocation(sparkProg, 'b');

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // additive: crossing lines glow
  gl.clearColor(0, 0, 0, 0);

  let dpr = 1;
  let aspect = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, small ? 2 : 1.75);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    aspect = w / h;
    gl.viewport(0, 0, w, h);
  };
  resize();

  // Pointer: eased toward the target so the ribbons lean softly instead of jumping.
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const target = opts.pointerTarget ?? window;
  target.addEventListener('pointermove', (e: Event) => {
    const p = e as PointerEvent;
    mouse.tx = (p.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((p.clientY / innerHeight) * 2 - 1);
  });

  let scroll = 0;
  const readScroll = () => {
    const r = canvas.getBoundingClientRect();
    scroll = Math.max(0, Math.min(1.5, -r.top / Math.max(1, r.height)));
  };

  const span = opts.span ?? 1.2;
  const baseAlpha = opts.alpha ?? 0.42;
  const intro = opts.intro !== false && !opts.still;
  const t0 = performance.now();
  let time = 6; // start mid-motion, not from a flat pose
  let last = t0;
  let running = false;
  let raf = 0;

  const setCommon = (U: ReturnType<typeof loc>, introP: number) => {
    gl.uniform1f(U.uT, time);
    gl.uniform1f(U.uAspect, aspect);
    gl.uniform1f(U.uIntro, introP);
    gl.uniform1f(U.uSpan, span);
    gl.uniform1f(U.uScroll, scroll);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform4fv(U.uA, A);
    gl.uniform4fv(U.uB, B);
    gl.uniform4fv(U.uC, C);
  };

  const draw = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!opts.still) time += dt;
    mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 2.2);
    mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 2.2);
    const p = intro ? Math.min(1, (now - t0) / 2600) : 1;
    const introP = 1 - Math.pow(1 - p, 3);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(lineProg);
    setCommon(L, introP);
    gl.uniform1f(L.uAlpha, baseAlpha * (small ? 1.25 : 1));
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.enableVertexAttribArray(aLine);
    gl.vertexAttribPointer(aLine, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, lineCount);
    gl.disableVertexAttribArray(aLine);

    if (SPARKS) {
      gl.useProgram(sparkProg);
      setCommon(S, introP);
      gl.uniform1f(S.uDpr, dpr);
      gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf);
      gl.enableVertexAttribArray(aSpark);
      gl.vertexAttribPointer(aSpark, 4, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, SPARKS);
      gl.disableVertexAttribArray(aSpark);
    }
  };

  // Watchdog: if a real device can't keep up (slow frames for a couple of seconds), freeze on the current frame.
  let slow = 0;
  let frames = 0;
  const loop = (now: number) => {
    const t1 = performance.now();
    draw(now);
    if (++frames > 30) slow = performance.now() - t1 > 24 ? slow + 1 : Math.max(0, slow - 1);
    if (slow > 90) {
      opts = { ...opts, still: true };
      stop();
      return;
    }
    if (running) raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || opts.still) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  // Only animate while visible on screen and in a visible tab.
  let onScreen = true;
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    onScreen && !document.hidden ? start() : stop();
  });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden || !onScreen ? stop() : start()));
  addEventListener('scroll', readScroll, { passive: true });
  new ResizeObserver(() => {
    resize();
    if (!running) draw(performance.now());
  }).observe(canvas);

  readScroll();
  draw(performance.now());
  start();

  return { start, stop };
}
