// The Hero year as a tidal disruption stream: a star torn apart by the black hole leaves
// one continuous band of debris that writes 2, 0, 2, 6 in a single stroke and falls into
// the O's accretion disk. Knots of debris flow toward the hole and heat from starlight white to amber as
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
// The hole's shadow (canvas px, GL origin) hides the stream where it falls behind it.
uniform vec3 uHole;
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
  float flow = 0.75 + 0.25 * sin(s * 4.0 - uTime * 1.5);
  float clump = fbm(vec2(s * 2.5 - uTime * 0.8, vStream.y / halfWidth * 1.4));
  float heat = smoothstep(0.55, 1.0, along);
  vec3 tint = mix(vec3(0.78, 0.85, 1.0), vec3(1.0, 0.7, 0.36), heat);
  float light = (body * (0.3 + 0.7 * clump) * flow * 0.85 + spine * 0.8) * weight * (1.0 + heat * 0.6);
  float glow = exp(-d / (fs * 0.4)) * 0.07 * weight * (1.0 - smoothstep(fs * 0.16, fs * 0.32, d));
  vec3 rgb = tint * (light + glow);
  rgb *= smoothstep(0.0, 0.04, along) * smoothstep(uHole.z * 0.95, uHole.z * 1.15, length(gl_FragCoord.xy - uHole.xy));
  // Without a float target each strand is tone mapped on its own and added on the canvas.
  if (uDirect > 0.5) { rgb = tonemap(rgb); o = vec4(rgb, max(rgb.r, max(rgb.g, rgb.b))); }
  else o = vec4(rgb, 0.0);
}`;

const RESOLVE_VERT = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

// While the last digit re-forms, a gravitational wave rolls through it: space shears in
// rippling bands and the light splits into its colours, then settles.
const RESOLVE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uLight;
uniform float uQuake, uSeed, uFs;
uniform vec2 uZone;
out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 fetch(vec2 p) { return texelFetch(uLight, ivec2(clamp(p, vec2(0), vec2(textureSize(uLight, 0) - 1))), 0).rgb; }
void main() {
  vec2 p = gl_FragCoord.xy;
  float q = uQuake * smoothstep(uZone.x - uFs * 0.3, uZone.x, p.x) * (1.0 - smoothstep(uZone.y, uZone.y + uFs * 0.3, p.x));
  float band = floor(p.y / (uFs * 0.11));
  float shear = (hash(vec2(band, uSeed)) - 0.5) * step(0.55, hash(vec2(band, uSeed + 7.0))) * uFs * 0.4;
  float ripple = sin(p.y / uFs * 7.0 + uSeed * 2.4) * uFs * 0.08;
  vec2 at = p + vec2((shear + ripple) * q, 0.0), split = vec2(uFs * 0.06 * q, 0.0);
  vec3 x = q > 0.001 ? vec3(fetch(at + split).r, fetch(at).g, fetch(at - split).b) * (1.0 + q * 0.5) : fetch(p);
  vec3 rgb = clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  // Premultiplied light over the sky.
  o = vec4(rgb, max(rgb.r, max(rgb.g, rgb.b)));
}`;

// The ribbon reaches past the visible band so the glow fades out before its edge.
const RIBBON_HALF_WIDTH = 0.32;
// Corners are rounded to about this radius (em) before the ribbon is built around the spine.
const CORNER = 0.3;
// Spacing of the resampled spine (em).
const STEP = 0.04;
// Bridges between digits fade to a faint thread mid-way so each numeral reads on its own.
const crossing = ([ax, ay], [bx, by], [cx, cy], [dx, dy]) => {
  const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy, den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((cx - ax) * sy - (cy - ay) * sx) / den, u = ((cx - ax) * ry - (cy - ay) * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [ax + rx * t, ay + ry * t] : null;
};
const BRIDGE = t => 0.06 + 0.94 * Math.abs(2 * t - 1) ** 3;
// The black hole's disk plane on screen: major axis 55° up from the x-axis, seen nearly edge-on.
const DISK_ANGLE = 55 * Math.PI / 180, DISK_FLATTEN = 0.42;

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
  const shape = { mix: 0, quake: 0 };
  const start = performance.now();
  const onLost = event => { event.preventDefault(); lost = true; canvas.dataset.ready = 'false'; canvas.dispatchEvent(new Event('streamlost')); };
  canvas.addEventListener('webglcontextlost', onLost);

  // The stream's spine in canvas CSS px: each digit's centreline in reading order, faint
  // bridges that carry each stroke's direction into the next, then a fall into the disk.
  const hermite = (points, [ax, ay], [tax, tay], [bx, by], [tbx, tby], weight, count = 28) => {
    for (let i = 1; i < count; i++) {
      const t = i / count, t2 = t * t, t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
      points.push([h00 * ax + h10 * tax + h01 * bx + h11 * tbx, h00 * ay + h10 * tay + h01 * by + h11 * tby, typeof weight === 'function' ? weight(t) : weight]);
    }
  };
  const direction = ([ax, ay], [bx, by], length) => {
    const d = Math.hypot(bx - ax, by - ay) || 1;
    return [(bx - ax) / d * length, (by - ay) / d * length];
  };
  const spine = (box, anchor, fs) => {
    const points = [];
    const strokes = [...svg.querySelectorAll('.hero-year-stream')];
    strokes.forEach(node => {
      const m = node.getScreenCTM();
      if (!m) return;
      const length = node.getTotalLength(), count = Math.max(12, Math.round(length * Math.hypot(m.a, m.b) / 5));
      // The last digit can be caught between its own spine and the alternate one.
      const alt = shape.mix > 0 && node.parentNode.querySelector('[data-year-alt]'), altLength = alt ? alt.getTotalLength() : 0;
      const local = step => {
        const q = node.getPointAtLength(length * step / count);
        if (!alt) return q;
        const r = alt.getPointAtLength(altLength * step / count);
        return { x: q.x + (r.x - q.x) * shape.mix, y: q.y + (r.y - q.y) * shape.mix };
      };
      const at = step => { const q = local(step); return [m.a * q.x + m.c * q.y + m.e - box.left, m.b * q.x + m.d * q.y + m.f - box.top]; };
      if (points.length) {
        const end = points[points.length - 1], before = points[points.length - 2], first = at(0), next = at(1);
        const span = Math.hypot(first[0] - end[0], first[1] - end[1]);
        hermite(points, end, direction(before, end, span), first, direction(first, next, span), BRIDGE);
      }
      for (let i = 0; i <= count; i++) points.push([...at(i), 1]);
    });
    if (points.length < 2 || !anchor) return rounded(points, fs);
    let glyphLength = 0;
    for (let i = 1; i < points.length; i++) glyphLength += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    // The disk on screen: major axis DISK_ANGLE up from x, minor axis flattened (y down).
    const ox = anchor.left + anchor.width / 2 - box.left, oy = anchor.top + anchor.height / 2 - box.top;
    const cos = Math.cos(DISK_ANGLE), sin = Math.sin(DISK_ANGLE), shadow = anchor.height * 0.48;
    const orbit = (a, r) => { const u = r * Math.cos(a), w = r * Math.sin(a) * DISK_FLATTEN; return [ox + cos * u - sin * w, oy - (sin * u + cos * w)]; };
    const end = points[points.length - 1], before = points[points.length - 2];
    const vx = end[0] - ox, vy = oy - end[1];
    const entry = Math.atan2((-sin * vx + cos * vy) / DISK_FLATTEN, cos * vx + sin * vy);
    const outer = shadow * 2.3, inner = shadow * 1.2, turn = Math.PI * 1.5;
    const into = orbit(entry, outer);
    // Join the orbit in whichever direction continues the stroke's own heading.
    const spin = [1, -1].reduce((best, sign) => {
      const ahead = orbit(entry + sign * 0.05, outer), score = (ahead[0] - into[0]) * (into[0] - end[0]) + (ahead[1] - into[1]) * (into[1] - end[1]);
      return score > best.score ? { sign, score } : best;
    }, { sign: 1, score: -Infinity }).sign;
    const span = Math.max(shadow, Math.hypot(into[0] - end[0], into[1] - end[1]));
    hermite(points, end, direction(before, end, span), into, direction(into, orbit(entry + spin * 0.05, outer), span), BRIDGE);
    // One and a half turns spiralling in while the light fades into the disk.
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      points.push([...orbit(entry + spin * turn * t, outer + (inner - outer) * (1 - (1 - t) * (1 - t))), 1 - t]);
    }
    // The fall is told apart by length, since rounding resamples the spine evenly.
    return Object.assign(rounded(points, fs), { glyphs: Math.round(glyphLength / (fs * STEP)) + 1 });
  };

  // Resample the spine evenly, then average each point with its neighbours within the corner
  // radius: glyph corners and bridge joins become arcs, long curves keep their shape.
  const rounded = (points, fs) => {
    const step = fs * STEP, even = [points[0]];
    let carry = 0;
    for (let i = 1; i < points.length; i++) {
      const [ax, ay, aw] = points[i - 1], [bx, by, bw] = points[i], span = Math.hypot(bx - ax, by - ay);
      for (let at = step - carry; at <= span; at += step) {
        const t = at / span;
        even.push([ax + (bx - ax) * t, ay + (by - ay) * t, aw + (bw - aw) * t]);
      }
      carry = span ? (carry + span) % step : carry;
    }
    const reach = Math.max(1, Math.round(CORNER / STEP / 2));
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
    if (!direct) {
      gl.bindTexture(gl.TEXTURE_2D, light);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, light, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    return build();
  };

  // The ribbon around the current spine; rebuilt alone while the last digit morphs.
  const build = () => {
    if (lost || !canvas.width) return false;
    const box = canvas.getBoundingClientRect(), year = svg.getBoundingClientRect();
    if (!box.width || !year.width) return false;
    const dpr = canvas.width / box.width;
    const fs = year.height / 2.177 * dpr, half = fs * RIBBON_HALF_WIDTH;
    const anchor = document.querySelector('[data-story-anchor="portal"]')?.getBoundingClientRect();
    const path = spine(box, anchor, year.height / 2.177), glyphs = path.glyphs ?? path.length;
    const points = path.map(([x, y, w]) => [x * dpr, y * dpr, w]);
    // The fall narrows as it winds into the disk: only the geometry shrinks while the shader
    // still reads the full half width at its edge, so the band thins without a hard cut.
    const width = points.map((_, i) => {
      const t = Math.min(1, Math.max(0, i - glyphs) / ((points.length - glyphs) * 0.35));
      return half * (1 - 0.55 * t * t * (3 - 2 * t));
    });
    const travelled = [0];
    for (let i = 1; i < points.length; i++) travelled.push(travelled[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
    const total = travelled[travelled.length - 1] || 1;
    const normals = points.map((_, i) => {
      const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
    });
    // Each edge is the spine offset by the half width. Inside a turn tighter than that, the
    // offset loops back over itself (a fold that flares into a starburst); cut the loop at
    // its crossing so the edge meets there, where the distance to the spine really is `half`.
    const edge = side => {
      const edgePoints = points.map(([x, y], i) => [x + normals[i][0] * width[i] * side, y + normals[i][1] * width[i] * side]);
      for (let i = 0; i < edgePoints.length - 2; i++) {
        // Around the disk only the hairpins are cut, never one turn of the spiral against the next.
        for (let j = Math.min(edgePoints.length - 2, i + (i < glyphs ? 64 : 12)); j > i + 1; j--) {
          const hit = crossing(edgePoints[i], edgePoints[i + 1], edgePoints[j], edgePoints[j + 1]);
          if (!hit) continue;
          for (let k = i + 1; k <= j; k++) edgePoints[k] = hit;
          i = j;
          break;
        }
      }
      return edgePoints;
    };
    const plus = edge(1), minus = edge(-1);
    const vertices = new Float32Array(points.length * 10);
    points.forEach(([, , w], i) => {
      const along = travelled[i] / total;
      vertices.set([...plus[i], along, half, w, ...minus[i], along, -half, w], i * 10);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, ribbonBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    vertexCount = points.length * 2;
    const last = svg.querySelector('[data-year-alt]')?.parentNode.getBoundingClientRect();
    const zone = last ? [(last.left - box.left) * dpr, (last.right - box.left) * dpr] : [0, 0];
    const hole = anchor ? [(anchor.left + anchor.width / 2 - box.left) * dpr, canvas.height - (anchor.top + anchor.height / 2 - box.top) * dpr, anchor.height * 0.48 * dpr] : [0, 0, 0];
    layout = { fs, length: total, hole, zone };
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
    gl.uniform3f(ribbon.uniforms.uHole, ...layout.hole);
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
      gl.uniform1f(resolve.uniforms.uQuake, shape.quake);
      gl.uniform1f(resolve.uniforms.uSeed, Math.floor(now / 70) % 97);
      gl.uniform1f(resolve.uniforms.uFs, layout.fs);
      gl.uniform2f(resolve.uniforms.uZone, ...layout.zone);
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
    // mix: 0 = the digit's own spine, 1 = its alternate; quake: the wave's strength.
    shape(mix, quake) {
      const rebuild = mix !== shape.mix;
      Object.assign(shape, { mix, quake });
      if (rebuild) build(); else if (!playing) render();
    },
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
