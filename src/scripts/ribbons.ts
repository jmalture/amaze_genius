/**
 * Amaze Genius "string-art" ribbons, v2: a ribbon of a hundred-plus thin lines that morphs through a sequence of
 * shapes ("poses") taken from the 2023 network motifs: the spectrum wave of the hero mockup, the yellow curl, the green
 * arc, the magenta twist, the rainbow S and the vertical spiral. Plain WebGL 1, no Three.js (a few KB).
 *
 * How a ribbon is described: 7 control points along its length, each with
 *   x, y   position (design space: -1 … 1 is the visible width/height)
 *   z      depth (-1 far … 0.6 near; perspective makes near parts bigger)
 *   w      half width of the band
 *   twist  rotation of the band around its centre line (radians). Where cos(twist) passes 0 the band pinches
 *          to a single line, that is the "string art" twist of the motifs.
 *   hue    colour at that point (0 red, .17 yellow, .33 green, .5 cyan, .63 blue, .75 violet, .83 magenta;
 *          values may run past 1, only the fraction counts)
 * The vertex shader runs a Catmull-Rom spline through the points and spreads the lines across the band.
 *
 * Morphing: the poses are keyframes on one smooth, closed curve through time. The ribbon glides through them at a
 * steady pace without stopping, each point a little behind the previous one, so a new shape flows along the ribbon
 * instead of snapping in. On top, every point wobbles,
 * the twist follows the pointer and the scroll position.
 *
 * Without a GPU (software rendering, e.g. headless Chrome in PageSpeed) or with reduced motion: one still frame of the
 * first pose. A watchdog freezes the animation on devices that can't keep up.
 */

/** [x, y, z, w, twist, hue] */
export type Point = [number, number, number, number, number, number];
export type Pose = Point[]; // exactly 7 points

export interface RibbonSpec {
  poses: Pose[];
  /** start this many poses into the sequence */
  offset?: number;
  /** mirror horizontally / vertically */
  flipX?: boolean;
  flipY?: boolean;
  /** brightness and line count */
  gain?: number;
  lines?: number;
  /** width multiplier */
  width?: number;
  /** lines fan out slightly against each other (string-art crossing), radians across the band */
  fan?: number;
}

export interface RibbonOptions {
  ribbons: RibbonSpec[];
  /** seconds the ribbon takes to travel from one pose to the next (it never stops) */
  duration?: number;
  /** delay of the shape wave along the ribbon, in poses from the first to the last point */
  lag?: number;
  /** pace of the ambient wobble, twist and sparkles (1 = default) */
  motion?: number;
  segments?: number;
  sparkles?: number;
  alpha?: number;
  /** horizontal overscan: 1 = design x ±1 is the screen edge */
  span?: number;
  pointerTarget?: HTMLElement | Window;
  intro?: boolean;
  still?: boolean;
  /** show one pose without animation (debugging / screenshots) */
  pose?: number;
}

const MAX_RIBBONS = 2;
const N = 7; // control points per ribbon

const COMMON = /* glsl */ `
precision highp float;
uniform vec4 uP[${MAX_RIBBONS * N}]; // x, y, z, w
uniform vec4 uQ[${MAX_RIBBONS * N}]; // twist, hue, gain, fan
uniform float uSX;    // design x → world x
uniform float uSY;    // design y → world y
uniform float uAspect;
uniform float uIntro;

vec3 hsv(float h, float s, float v) {
  vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(vec3(1.0), k, s);
}

vec4 cr(vec4 a, vec4 b, vec4 c, vec4 d, float t) {
  float t2 = t * t;
  float t3 = t2 * t;
  return 0.5 * (2.0 * b + (c - a) * t + (2.0 * a - 5.0 * b + 4.0 * c - d) * t2 + (3.0 * b - a - 3.0 * c + d) * t3);
}

void spline(int r, float u, out vec4 P, out vec4 Q) {
  float f = clamp(u, 0.0, 1.0) * 6.0;
  float fi = min(floor(f), 5.0);
  float t = f - fi;
  int b = r * ${N};
  int i0 = b + int(max(fi - 1.0, 0.0));
  int i1 = b + int(fi);
  int i2 = b + int(fi + 1.0);
  int i3 = b + int(min(fi + 2.0, 6.0));
  P = cr(uP[i0], uP[i1], uP[i2], uP[i3], t);
  Q = cr(uQ[i0], uQ[i1], uQ[i2], uQ[i3], t);
}

// World position of line v (0…1 across the band) at u (0…1 along it). s = perspective scale, hue out.
vec3 ribbon(int r, float u, float v, out float s, out float hue, out float gain) {
  vec4 P; vec4 Q; vec4 Pa; vec4 Qa; vec4 Pb; vec4 Qb;
  spline(r, u, P, Q);
  spline(r, u - 0.004, Pa, Qa);
  spline(r, u + 0.004, Pb, Qb);
  vec2 T = vec2((Pb.x - Pa.x) * uSX, (Pb.y - Pa.y) * uSY);
  vec2 Nn = normalize(vec2(-T.y, T.x) + vec2(0.0, 1e-5));
  vec3 C = vec3(P.x * uSX, P.y * uSY, P.z);
  float th = Q.x + (v - 0.5) * Q.w;
  float off = (v - 0.5) * 2.0 * max(P.w, 0.0) * uSY;
  vec3 p = C + off * (cos(th) * vec3(Nn, 0.0) + sin(th) * vec3(0.0, 0.0, 1.0));
  s = 2.6 / (2.6 - p.z);
  hue = Q.y;
  gain = Q.z;
  return p;
}

float reveal(float u) {
  return smoothstep(u - 0.16, u, uIntro * 1.18);
}
`;

const LINE_VS = /* glsl */ `${COMMON}
attribute vec3 a; // u, v, ribbon
uniform float uAlpha;
varying vec3 vCol;
varying float vA;
void main() {
  int r = int(a.z + 0.5);
  float s; float hue; float gain;
  vec3 p = ribbon(r, a.x, a.y, s, hue, gain);
  gl_Position = vec4(p.x * s / uAspect, p.y * s, 0.0, 1.0);
  vCol = hsv(fract(hue + (a.y - 0.5) * 0.03), 0.84, 1.0);
  float edge = smoothstep(0.0, 0.07, a.x) * smoothstep(1.0, 0.93, a.x);
  float rim = 0.78 + 0.22 * smoothstep(0.3, 0.5, abs(a.y - 0.5));
  vA = uAlpha * gain * edge * rim * reveal(a.x) * (0.5 + 0.5 * s);
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
uniform float uT;
uniform float uDpr;
varying vec3 vCol;
varying float vA;
void main() {
  int r = int(b.z + 0.5);
  float u = fract(b.x + uT * (0.01 + 0.014 * b.w));
  float s; float hue; float gain;
  vec3 p = ribbon(r, u, b.y, s, hue, gain);
  gl_Position = vec4(p.x * s / uAspect, p.y * s, 0.0, 1.0);
  float tw = 0.5 + 0.5 * sin(uT * (0.7 + b.w) + b.w * 40.0);
  tw = tw * tw * tw;
  vCol = mix(hsv(fract(hue), 0.7, 1.0), vec3(1.0), 0.45);
  float edge = smoothstep(0.05, 0.16, u) * smoothstep(0.95, 0.84, u);
  vA = tw * edge * reveal(u) * min(1.0, gain * 1.5);
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

/** Catmull-Rom through four values: passes through b at f=0 and c at f=1, with matching speed on both sides. */
const crv = (a: number, b: number, c: number, d: number, f: number) =>
  0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f);

export function createRibbons(canvas: HTMLCanvasElement, opts: RibbonOptions) {
  opts = { ...opts };
  const gl = canvas.getContext('webgl', {
    antialias: true,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  // No GPU: drawing ~100k line vertices per frame on the CPU would block the main thread. One lighter still frame.
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  const software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  if (software) opts.still = true;
  if (opts.pose != null) opts.still = true;

  let lineProg: WebGLProgram;
  let sparkProg: WebGLProgram;
  try {
    lineProg = compile(gl, LINE_VS, LINE_FS);
    sparkProg = compile(gl, SPARK_VS, SPARK_FS);
  } catch (e) {
    console.warn('[ribbons]', e);
    return null;
  }

  const specs = opts.ribbons.slice(0, MAX_RIBBONS);
  const small = Math.min(innerWidth, innerHeight) < 700;
  const SEGS = Math.round((opts.segments ?? 240) * (small ? 0.7 : 1) * (software ? 0.5 : 1));
  const SPARKS = opts.sparkles ?? 8;

  // Static line buffer: (u, v, ribbon) per vertex, every segment as a pair for gl.LINES (one draw call).
  const counts = specs.map((r) => Math.round((r.lines ?? 110) * (small ? 0.65 : 1) * (software ? 0.6 : 1)));
  const total = counts.reduce((a, c) => a + c * SEGS * 2, 0);
  const verts = new Float32Array(total * 3);
  let k = 0;
  specs.forEach((_, r) => {
    const L = counts[r];
    for (let l = 0; l < L; l++) {
      const v = l / (L - 1);
      for (let s = 0; s < SEGS; s++) {
        verts[k++] = s / SEGS;
        verts[k++] = v;
        verts[k++] = r;
        verts[k++] = (s + 1) / SEGS;
        verts[k++] = v;
        verts[k++] = r;
      }
    }
  });
  const lineBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  const lineCount = total;

  // Sparkles ride the edges of the first ribbon (seeded, same composition on every load).
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const sp = new Float32Array(SPARKS * 4);
  for (let i = 0; i < SPARKS; i++) sp.set([rnd(), rnd() < 0.5 ? 0 : 1, 0, rnd()], i * 4);
  const sparkBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf);
  gl.bufferData(gl.ARRAY_BUFFER, sp, gl.STATIC_DRAW);

  const uP = new Float32Array(MAX_RIBBONS * N * 4);
  const uQ = new Float32Array(MAX_RIBBONS * N * 4);

  const loc = (p: WebGLProgram) => ({
    uP: gl.getUniformLocation(p, 'uP'),
    uQ: gl.getUniformLocation(p, 'uQ'),
    uSX: gl.getUniformLocation(p, 'uSX'),
    uSY: gl.getUniformLocation(p, 'uSY'),
    uAspect: gl.getUniformLocation(p, 'uAspect'),
    uIntro: gl.getUniformLocation(p, 'uIntro'),
    uAlpha: gl.getUniformLocation(p, 'uAlpha'),
    uT: gl.getUniformLocation(p, 'uT'),
    uDpr: gl.getUniformLocation(p, 'uDpr'),
  });
  const LU = loc(lineProg);
  const SU = loc(sparkProg);
  const aLine = gl.getAttribLocation(lineProg, 'a');
  const aSpark = gl.getAttribLocation(sparkProg, 'b');

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // additive: crossings and pinches glow
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

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  (opts.pointerTarget ?? window).addEventListener('pointermove', (e: Event) => {
    const p = e as PointerEvent;
    mouse.tx = (p.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((p.clientY / innerHeight) * 2 - 1);
  });

  let scroll = 0;
  const readScroll = () => {
    const r = canvas.getBoundingClientRect();
    scroll = Math.max(0, Math.min(1.5, -r.top / Math.max(1, r.height)));
  };

  const duration = opts.duration ?? 7;
  const lag = opts.lag ?? 0.35;
  const motion = opts.motion ?? 1;
  const span = opts.span ?? 1.12;
  const baseAlpha = opts.alpha ?? 0.5;
  const intro = opts.intro !== false && !opts.still;
  const t0 = performance.now();
  let time = 0;
  let last = t0;
  let running = false;
  let raf = 0;

  /**
   * Even speed: the poses are not equally far apart, so stepping through them at a fixed rate would make some
   * transitions twice as fast as others. Measure the shape change along the whole loop once (positions, width and
   * twist of all control points) and map time to "distance travelled", so the ribbon changes at the same pace
   * everywhere. The loop still takes poses × duration seconds.
   */
  const RES = 120; // samples per pose
  const sampleAt = (rb: RibbonSpec, si: number, out: number[]) => {
    const P = rb.poses;
    const n = P.length;
    for (let i = 0; i < N; i++) {
      const sj = si - lag * (i / (N - 1)); // same per-point delay as when drawing
      const k = Math.floor(sj);
      const f = sj - k;
      const q0 = P[(((k - 1) % n) + n) % n][i];
      const q1 = P[((k % n) + n) % n][i];
      const q2 = P[(((k + 1) % n) + n) % n][i];
      const q3 = P[(((k + 2) % n) + n) % n][i];
      for (let j = 0; j < 5; j++) out[i * 5 + j] = crv(q0[j], q1[j], q2[j], q3[j], f);
    }
  };
  const W = [1, 1, 0.5, 1.5, 0.12]; // weight of x, y, z, width, twist in "how much the shape changed"
  const tables = specs.map((rb) => {
    const n = rb.poses.length;
    const M = n * RES;
    const cum = new Float64Array(M + 1);
    const a: number[] = [];
    const b: number[] = [];
    sampleAt(rb, 0, a);
    for (let m = 1; m <= M; m++) {
      sampleAt(rb, m / RES, b);
      let d = 0;
      for (let q = 0; q < N * 5; q++) d += W[q % 5] * Math.abs(b[q] - a[q]);
      cum[m] = cum[m - 1] + d;
      for (let q = 0; q < N * 5; q++) a[q] = b[q];
    }
    return { cum, M, n };
  });
  const warp = (r: number, t: number) => {
    const { cum, M, n } = tables[r];
    const loop = n * duration;
    const laps = Math.floor(t / loop);
    const target = ((t - laps * loop) / loop) * cum[M];
    let lo = 0;
    let hi = M;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= target) lo = mid;
      else hi = mid;
    }
    const span = cum[hi] - cum[lo] || 1;
    return laps * n + (lo + (target - cum[lo]) / span) / RES;
  };

  /**
   * Current control points of every ribbon. The poses are keyframes on one closed, smooth curve through time
   * (Catmull-Rom): the ribbon passes through each pose without stopping and keeps its speed, so there is no hold and
   * no sudden change. Each control point runs a little behind the previous one (lag), so a new shape flows along
   * the ribbon like a wave. On top: a gentle wobble, the pointer and the scroll position.
   */
  const pose = (time: number) => {
    const t = time * motion; // ambient wobble pace
    const portrait = aspect < 1;
    specs.forEach((rb, r) => {
      const n = rb.poses.length;
      const P = rb.poses;
      const live = opts.still ? 0 : 1;
      const sx = rb.flipX ? -1 : 1;
      const sy = (rb.flipY ? -1 : 1) * (portrait ? 0.62 : 1);
      const wMul = (rb.width ?? 1) * (portrait ? 0.75 : 1);
      const base = opts.pose != null ? opts.pose : warp(r, time);
      for (let i = 0; i < N; i++) {
        const si = base + (rb.offset ?? 0) - (opts.pose != null ? 0 : lag * (i / (N - 1)));
        const k = Math.floor(si);
        const f = si - k;
        const q0 = P[(((k - 1) % n) + n) % n][i];
        const q1 = P[((k % n) + n) % n][i];
        const q2 = P[(((k + 1) % n) + n) % n][i];
        const q3 = P[(((k + 2) % n) + n) % n][i];
        const v = (j: number) => crv(q0[j], q1[j], q2[j], q3[j], f);

        const ph = i * 1.7 + r * 2.3;
        const x = v(0) + live * 0.03 * Math.sin(t * 0.6 + ph);
        const y = v(1) + live * (0.06 * Math.sin(t * 0.9 + ph) + mouse.y * 0.05) - scroll * 0.35;
        const z = v(2) + live * 0.16 * Math.sin(t * 0.5 + ph * 0.7);
        const w = Math.max(0.02, v(3)) * wMul * (1 + live * 0.18 * Math.sin(t * 0.8 + ph * 1.3));
        const tw =
          v(4) + live * (0.4 * Math.sin(t * 0.45 + ph * 0.6) + mouse.x * 1.1 * (i / (N - 1) - 0.5)) + scroll * 2.4;
        const hue = v(5); // numeric blend; the pose data is numbered so this never wraps (see ribbon-poses.ts)
        const o = (r * N + i) * 4;
        uP[o] = x * sx;
        uP[o + 1] = y * sy;
        uP[o + 2] = z;
        uP[o + 3] = w;
        uQ[o] = tw;
        uQ[o + 1] = hue;
        uQ[o + 2] = rb.gain ?? 1;
        uQ[o + 3] = rb.fan ?? 0.25;
      }
    });
  };

  const setCommon = (U: ReturnType<typeof loc>, introP: number) => {
    gl.uniform4fv(U.uP, uP);
    gl.uniform4fv(U.uQ, uQ);
    gl.uniform1f(U.uSX, span * aspect);
    gl.uniform1f(U.uSY, 1);
    gl.uniform1f(U.uAspect, aspect);
    gl.uniform1f(U.uIntro, introP);
  };

  const draw = (now: number) => {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); // rAF stamps can precede `last`
    last = now;
    if (!opts.still) time += dt;
    mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 2);
    mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 2);
    const p = intro ? Math.min(1, (now - t0) / 2600) : 1;
    const introP = 1 - Math.pow(1 - p, 3);
    pose(time);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(lineProg);
    setCommon(LU, introP);
    gl.uniform1f(LU.uAlpha, baseAlpha * (small ? 1.2 : 1));
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.enableVertexAttribArray(aLine);
    gl.vertexAttribPointer(aLine, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, lineCount);
    gl.disableVertexAttribArray(aLine);

    if (SPARKS) {
      gl.useProgram(sparkProg);
      setCommon(SU, introP);
      gl.uniform1f(SU.uT, time * motion);
      gl.uniform1f(SU.uDpr, dpr);
      gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf);
      gl.enableVertexAttribArray(aSpark);
      gl.vertexAttribPointer(aSpark, 4, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, SPARKS);
      gl.disableVertexAttribArray(aSpark);
    }
  };

  // Watchdog: a device that can't keep up (slow frames for a few seconds) freezes on the current frame.
  let slow = 0;
  let frames = 0;
  const loop = (now: number) => {
    const t1 = performance.now();
    draw(now);
    if (++frames > 30) slow = performance.now() - t1 > 24 ? slow + 1 : Math.max(0, slow - 1);
    if (slow > 90) {
      opts.still = true;
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

  let onScreen = true;
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    onScreen && !document.hidden ? start() : stop();
  }).observe(canvas);
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
