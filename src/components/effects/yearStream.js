// The Hero year as a tidal disruption stream: a star torn apart by the black hole leaves
// one continuous band of debris that writes 2, 0, 2, 6 in a single stroke and spirals into
// the O. Knots of debris flow toward the hole and heat from starlight white to amber as
// they fall. Drawn into a small WebGL2 canvas laid over the year's SVG, which stays in the
// DOM as geometry (dust, trails, opening raster) and as the no-WebGL fallback.

// The stream is a ribbon along its spine: each vertex carries how far along the stream it is,
// its signed distance across it and the strand's weight. Strands add up where they cross.
const RIBBON_VERT = `#version 300 es
in vec2 aPosition;
in vec3 aStream;
uniform vec2 uRes;
out vec3 vStream;
void main() {
  vStream = aStream;
  gl_Position = vec4(aPosition.x / uRes.x * 2.0 - 1.0, 1.0 - aPosition.y / uRes.y * 2.0, 0.0, 1.0);
}`;

const RIBBON_FRAG = `#version 300 es
precision highp float;
in vec3 vStream;
out vec4 o;
uniform float uTime, uFs, uLength, uDirect;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
vec3 tonemap(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  float fs = uFs, along = vStream.x, d = abs(vStream.y), weight = vStream.z;
  float halfWidth = fs * 0.16;
  float body = exp(-pow(d / halfWidth, 2.0) * 2.2);
  float spine = exp(-pow(d / (fs * 0.025), 2.0));
  // Distance along the stream in em, so knots keep their size at every viewport.
  float s = along * uLength / fs;
  float flow = 0.6 + 0.4 * sin(s * 4.0 - uTime * 1.5);
  float clump = fbm(vec2(s * 2.5 - uTime * 0.8, vStream.y / halfWidth * 1.4));
  float heat = smoothstep(0.55, 1.0, along);
  vec3 tint = mix(vec3(0.78, 0.85, 1.0), vec3(1.0, 0.7, 0.36), heat);
  float light = (body * (0.3 + 0.7 * clump) * flow * 0.85 + spine * 0.8) * mix(0.25, 1.0, weight) * (1.0 + heat * 0.6);
  vec2 cell = vec2(s * 14.0 - uTime * 2.2, vStream.y / halfWidth * 2.5);
  float spark = step(0.965, hash(floor(cell))) * exp(-pow(length(fract(cell) - 0.5) * 3.0, 2.0)) * body;
  float glow = exp(-d / (fs * 0.4)) * 0.07 * weight * (1.0 - smoothstep(fs * 0.16, fs * 0.32, d));
  vec3 rgb = tint * (light + glow) + vec3(1.0, 0.95, 0.9) * spark * 0.6;
  rgb *= smoothstep(0.0, 0.04, along);
  // Without a float target each strand is tone mapped on its own and added on the canvas.
  if (uDirect > 0.5) { rgb = tonemap(rgb); o = vec4(rgb, max(rgb.r, max(rgb.g, rgb.b))); }
  else o = vec4(rgb, 0.0);
}`;

const RESOLVE_VERT = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const RESOLVE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uLight;
out vec4 o;
void main() {
  vec3 x = texelFetch(uLight, ivec2(gl_FragCoord.xy), 0).rgb;
  vec3 rgb = clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  // Premultiplied light over the sky.
  o = vec4(rgb, max(rgb.r, max(rgb.g, rgb.b)));
}`;

// The ribbon reaches past the visible band so the glow fades out before its edge.
const RIBBON_HALF_WIDTH = 0.32;
// Corners are rounded to about this radius (em) so the ribbon never folds over itself.
const CORNER = 0.48;
// Bridges between digits stay faint so each numeral still reads on its own.
const BRIDGE = 0.3;
// The black hole's disk plane on screen: major axis 55° up from the x-axis, seen nearly edge-on.
const DISK_ANGLE = 55 * Math.PI / 180, DISK_FLATTEN = 0.28;

export function createYearStream(canvas, svg, { frozen = false } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: true });
  if (!gl) return null;
  const shaders = [];
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader); shaders.push(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const link = (vertexSource, fragmentSource) => {
    const vertex = compile(gl.VERTEX_SHADER, vertexSource), fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertex); gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition'); gl.bindAttribLocation(program, 1, 'aStream'); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    const uniforms = {};
    for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
      const name = gl.getActiveUniform(program, i).name;
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    return { program, uniforms };
  };
  const ribbon = link(RIBBON_VERT, RIBBON_FRAG), resolve = link(RESOLVE_VERT, RESOLVE_FRAG);
  if (!ribbon || !resolve) return null;
  // Strands are summed in a float target and tone mapped once, so crossings glow, not clip.
  const direct = !gl.getExtension('EXT_color_buffer_float');
  const ribbonArray = gl.createVertexArray(), ribbonBuffer = gl.createBuffer();
  gl.bindVertexArray(ribbonArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, ribbonBuffer);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
  const resolveArray = gl.createVertexArray(), resolveBuffer = gl.createBuffer();
  gl.bindVertexArray(resolveArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, resolveBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const light = gl.createTexture(), target = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, light);
  for (const [key, value] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, key, value);
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  let vertexCount = 0;

  let layout = null, raf = 0, playing = false, lost = false;
  const start = performance.now();
  const onLost = event => { event.preventDefault(); lost = true; canvas.dataset.ready = 'false'; canvas.dispatchEvent(new Event('streamlost')); };
  canvas.addEventListener('webglcontextlost', onLost);

  // The stream's spine in canvas CSS px: each digit's centreline in reading order, faint
  // bridges between them, then a shrinking spiral in the disk plane that ends in the hole.
  const spine = (box, anchor, fs) => {
    const points = [];
    const strokes = [...svg.querySelectorAll('.hero-year-stream')];
    strokes.forEach((node, index) => {
      const m = node.getScreenCTM();
      if (!m) return;
      const length = node.getTotalLength(), count = Math.max(12, Math.round(length * Math.hypot(m.a, m.b) / 5));
      const at = step => { const q = node.getPointAtLength(length * step / count); return [m.a * q.x + m.c * q.y + m.e - box.left, m.b * q.x + m.d * q.y + m.f - box.top]; };
      if (index && points.length) {
        const [ax, ay] = points[points.length - 1], [bx, by] = at(0), lift = Math.hypot(bx - ax, by - ay) * 0.35;
        for (let i = 1; i < 24; i++) {
          const t = i / 24, u = 1 - t;
          // A gentle arc below the line joining the two digits.
          points.push([u * u * u * ax + 3 * u * u * t * (ax + lift) + 3 * u * t * t * (bx - lift * 0.2) + t * t * t * bx,
            u * u * u * ay + 3 * u * u * t * (ay + lift) + 3 * u * t * t * (by + lift) + t * t * t * by, BRIDGE]);
        }
      }
      for (let i = 0; i <= count; i++) points.push([...at(i), 1]);
    });
    if (!points.length || !anchor) return points;
    const [ex, ey] = points[points.length - 1];
    const ox = anchor.left + anchor.width / 2 - box.left, oy = anchor.top + anchor.height / 2 - box.top;
    const cos = Math.cos(DISK_ANGLE), sin = Math.sin(DISK_ANGLE);
    // Screen (y down) to the disk frame (y up, major axis along u) and back. The orbit starts
    // round where the stream leaves the 6 and flattens into the disk plane as it falls.
    const vx = ex - ox, vy = oy - ey;
    const u0 = cos * vx + sin * vy, w0 = -sin * vx + cos * vy;
    const r0 = Math.hypot(u0, w0), a0 = Math.atan2(w0, u0), r1 = anchor.height * 0.62;
    for (let i = 1; i <= 120; i++) {
      const t = i / 120, fall = 1 - (1 - t) * (1 - t), r = r0 + (r1 - r0) * fall, a = a0 - t * Math.PI * 2.4;
      const u = r * Math.cos(a), w = r * Math.sin(a) * (1 + (DISK_FLATTEN - 1) * fall);
      points.push([ox + cos * u - sin * w, oy - (sin * u + cos * w), 1 - t * 0.5]);
    }
    return rounded(points, fs);
  };

  // Resample the spine evenly, then average each point with its neighbours within the corner
  // radius: glyph corners and bridge joins become arcs, long curves keep their shape.
  const rounded = (points, fs) => {
    const step = fs * 0.04, even = [points[0]];
    let carry = 0;
    for (let i = 1; i < points.length; i++) {
      const [ax, ay, aw] = points[i - 1], [bx, by, bw] = points[i], span = Math.hypot(bx - ax, by - ay);
      for (let at = step - carry; at <= span; at += step) {
        const t = at / span;
        even.push([ax + (bx - ax) * t, ay + (by - ay) * t, aw + (bw - aw) * t]);
      }
      carry = span ? (carry + span) % step : carry;
    }
    const reach = Math.max(1, Math.round(CORNER / 0.04 / 2));
    let current = even;
    for (let pass = 0; pass < 3; pass++) {
      current = current.map((point, i) => {
        const from = Math.max(0, i - reach), to = Math.min(current.length - 1, i + reach), sum = [0, 0, 0];
        for (let j = from; j <= to; j++) { sum[0] += current[j][0]; sum[1] += current[j][1]; sum[2] += current[j][2]; }
        const n = to - from + 1;
        // Ends keep their place so the stream still starts and finishes where it should.
        return i === 0 || i === current.length - 1 ? point : [sum[0] / n, sum[1] / n, sum[2] / n];
      });
    }
    return current;
  };

  const resize = () => {
    if (lost) return false;
    const box = canvas.getBoundingClientRect(), year = svg.getBoundingClientRect();
    if (!box.width || !box.height || !year.width) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.5);
    canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
    const fs = year.height / 2.177 * dpr, half = fs * RIBBON_HALF_WIDTH;
    const anchor = document.querySelector('[data-story-anchor="portal"]')?.getBoundingClientRect();
    const points = spine(box, anchor, year.height / 2.177).map(([x, y, w]) => [x * dpr, y * dpr, w]);
    const travelled = [0];
    for (let i = 1; i < points.length; i++) travelled.push(travelled[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    const total = travelled[travelled.length - 1] || 1;
    const vertices = new Float32Array(points.length * 10);
    points.forEach(([x, y, w], i) => {
      const [ax, ay] = points[Math.max(0, i - 1)], [bx, by] = points[Math.min(points.length - 1, i + 1)];
      const length = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / length, ny = (bx - ax) / length;
      vertices.set([x + nx * half, y + ny * half, travelled[i] / total, half, w, x - nx * half, y - ny * half, travelled[i] / total, -half, w], i * 10);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, ribbonBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    vertexCount = points.length * 2;
    if (!direct) {
      gl.bindTexture(gl.TEXTURE_2D, light);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, light, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    layout = { fs, length: total };
    render();
    return true;
  };

  function render(now = performance.now()) {
    if (!layout || lost) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, direct ? null : target);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(ribbon.program);
    gl.uniform2f(ribbon.uniforms.uRes, canvas.width, canvas.height);
    gl.uniform1f(ribbon.uniforms.uTime, frozen ? 6.5 : (now - start) / 1000);
    gl.uniform1f(ribbon.uniforms.uFs, layout.fs);
    gl.uniform1f(ribbon.uniforms.uLength, layout.length);
    gl.uniform1f(ribbon.uniforms.uDirect, direct ? 1 : 0);
    gl.bindVertexArray(ribbonArray);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
    if (!direct) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendFunc(gl.ONE, gl.ZERO);
      gl.useProgram(resolve.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, light);
      gl.uniform1i(resolve.uniforms.uLight, 0);
      gl.bindVertexArray(resolveArray);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindVertexArray(null);
    canvas.dataset.ready = 'true';
  }
  const tick = now => { raf = 0; render(now); if (playing) raf = requestAnimationFrame(tick); };

  return {
    resize,
    render: () => render(),
    play() { if (frozen || playing) return; playing = true; raf ||= requestAnimationFrame(tick); },
    pause() { playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    dispose() {
      playing = false; if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteTexture(light); gl.deleteFramebuffer(target);
      gl.deleteBuffer(ribbonBuffer); gl.deleteBuffer(resolveBuffer); gl.deleteVertexArray(ribbonArray); gl.deleteVertexArray(resolveArray);
      gl.deleteProgram(ribbon.program); gl.deleteProgram(resolve.program); shaders.forEach(shader => gl.deleteShader(shader));
      delete canvas.dataset.ready;
    },
  };
}
