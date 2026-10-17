import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Vector2 } from 'three';
import { portalProgress, portalState } from '@/3d/utils/portal';
import { useScrollStore } from '@/stores/useScrollStore';

// The Hero year as stardust: sampled from the digits (star-filled interiors and their
// contours) as the portal opens, then spiralled into the hole with the DOM portal
// particles' seeded law, so scrolling back reassembles it exactly. Screen-space, CSS px.
const PARTICLE = /* glsl */ `
  uniform float uP, uPixelRatio, uCore;
  uniform vec2 uCenter, uViewport;
  attribute vec2 aStart;
  attribute vec3 aSeed;
  attribute float aTail;
  varying vec3 vColor;
  varying float vAlpha;
  float smooth01(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
  float fall(float p) { float q = clamp(p / 0.44, 0.0, 1.0); return q * q * (0.25 + 0.75 * q); }
  vec2 inspiral(float p, float seed, out float t) {
    float f = fall(p);
    t = min(1.0, f + seed * 0.16 * smooth01(0.01, 0.22, p) * (1.0 - f));
    vec2 d = aStart - uCenter;
    float r = length(d) * pow(1.0 - t, 0.72);
    float angle = atan(d.y, d.x) + (5.2 + seed * 2.4) * t * t;
    float scatter = sin(seed * 113.0 + t * 13.0) * sin(t * 3.14159) * (4.0 + seed * 14.0);
    return uCenter + vec2(cos(angle) * r + cos(angle + 1.5708) * scatter,
      sin(angle) * r * (1.0 - 0.18 * t) + sin(angle + 1.5708) * scatter);
  }
  void main() {
    float t, lag;
    vec2 head = inspiral(uP, aSeed.x, t);
    vec2 point = head;
    if (aTail > 0.5) {
      // Streak tail: the same particle a moment earlier, capped like the DOM streaks.
      vec2 tail = inspiral(max(0.0, uP - 0.002 - 0.008 * t), aSeed.x, lag) - head;
      point = head + tail * min(1.0, 22.0 / max(length(tail), 0.001));
    }
    gl_Position = vec4(point.x / uViewport.x * 2.0 - 1.0, 1.0 - point.y / uViewport.y * 2.0, 0.0, 1.0);
    gl_PointSize = max(1.0, (0.9 + 1.5 * aSeed.z) * (1.0 - 0.45 * t) * uPixelRatio);
    // Swallowed at the horizon of the growing shadow.
    float horizon = smoothstep(uCore * 0.95, uCore * 1.25, length(head - uCenter));
    float heat = t * t;
    vColor = mix(vec3(0.82, 0.88, 1.0), mix(vec3(1.0, 0.86, 0.66), vec3(1.0, 0.62, 0.32), smoothstep(0.55, 1.0, t)), smoothstep(0.15, 0.7, t))
      * (aSeed.y * (1.0 + 2.2 * heat));
    vAlpha = smooth01(0.0, 0.05, uP) * (1.0 - smooth01(0.34, 0.435, uP)) * horizon * (1.0 - 0.4 * t) * (aTail > 0.5 ? 0.0 : 1.0);
  }
`;
const DOT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor, pow(1.0 - smoothstep(0.0, 0.5, r), 1.4) * vAlpha);
  }
`;
// Streak vertices share the particle law; the head end is opaque, the tail end transparent.
const STREAK = PARTICLE.replace('* (aTail > 0.5 ? 0.0 : 1.0);', '* (aTail > 0.5 ? 0.0 : 0.55) * smoothstep(0.02, 0.2, t);');
const LINE = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() { gl_FragColor = vec4(vColor, vAlpha); }
`;

const hash = n => { const value = Math.sin(n * 127.1) * 43758.5453; return value - Math.floor(value); };

const MASK = 160, OUTLINE = 480;

// Fills `starts` with year points in CSS px and returns how many it placed (0 when the
// year is not laid out). Glyphs are interleaved, so any prefix of the buffer covers all
// four digits evenly; each is rasterized once into a coarse mask and flattened into a
// polyline, so rejection sampling stays cheap on the first portal frame.
function sampleYear(starts, seeds, count) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MASK;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const glyphs = [...document.querySelectorAll('[data-hero-year] svg:not([data-year-contours]) [data-portal-year-glyph]')].flatMap(glyph => {
    const node = glyph.querySelector('.hero-year-base'), matrix = node?.getScreenCTM();
    if (!matrix || !context) return [];
    const box = node.getBBox(), length = node.getTotalLength();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, MASK, MASK);
    context.setTransform(MASK / box.width, 0, 0, MASK / box.height, -box.x * MASK / box.width, -box.y * MASK / box.height);
    context.fill(new Path2D(node.getAttribute('d')));
    return [{ matrix, box, mask: context.getImageData(0, 0, MASK, MASK).data,
      outline: Array.from({ length: OUTLINE }, (_, i) => node.getPointAtLength(length * i / OUTLINE)) }];
  });
  if (!glyphs.length) return 0;
  let area = 0;
  for (const { matrix, box } of glyphs) area += Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) * box.width * box.height;
  // About one grain per 7 px² of glyph box: dense dust, never a solid fill on small screens.
  const total = Math.max(Math.min(count, 2000), Math.min(count, Math.round(area / 7)));
  for (let index = 0, tries = 0; index < total && tries < total * 20; tries++) {
    const { matrix, box, mask, outline } = glyphs[index % glyphs.length];
    const n = index * 7.31 + tries * 0.137;
    let x, y, brightness;
    // About a third of the dust traces the contour; the rest fills the star field inside it.
    if (Math.floor(index / glyphs.length) % 3 === 0) {
      const along = hash(n + 3.3) * OUTLINE, i = Math.floor(along), f = along - i;
      const a = outline[i], b = outline[(i + 1) % OUTLINE];
      x = a.x + (b.x - a.x) * f + (hash(n + 4.4) - 0.5) * 10;
      y = a.y + (b.y - a.y) * f + (hash(n + 5.5) - 0.5) * 10;
      brightness = 0.65 + 0.35 * hash(n + 6.6);
    } else {
      const u = hash(n + 1.1), v = hash(n + 2.2);
      if (mask[(Math.floor(v * MASK) * MASK + Math.floor(u * MASK)) * 4 + 3] < 128) continue;
      x = box.x + box.width * u; y = box.y + box.height * v;
      brightness = 0.2 + 0.5 * hash(n + 6.6) ** 3;
    }
    starts[index * 2] = matrix.a * x + matrix.c * y + matrix.e;
    starts[index * 2 + 1] = matrix.b * x + matrix.d * y + matrix.f;
    seeds[index * 3] = hash(n + 7.7);
    seeds[index * 3 + 1] = brightness;
    seeds[index * 3 + 2] = hash(n + 8.8) ** 3;
    index++;
    if (index === total) return total;
  }
  return 0;
}

export function YearDust({ quality = 'high', reduced = false }) {
  const dots = useRef(null);
  const streaks = useRef(null);
  const phase = useRef({});
  const sampled = useRef('');
  const count = quality === 'low' ? 6000 : quality === 'medium' ? 12000 : 20000;
  const { pointGeometry, lineGeometry } = useMemo(() => {
    const starts = new Float32Array(count * 2), seeds = new Float32Array(count * 3);
    const lineStarts = new Float32Array(count * 4), lineSeeds = new Float32Array(count * 6), tails = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) tails[i * 2 + 1] = 1;
    const pointGeometry = new BufferGeometry();
    pointGeometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    pointGeometry.setAttribute('aStart', new BufferAttribute(starts, 2));
    pointGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 3));
    pointGeometry.setAttribute('aTail', new BufferAttribute(new Float32Array(count), 1));
    const lineGeometry = new BufferGeometry();
    lineGeometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3));
    lineGeometry.setAttribute('aStart', new BufferAttribute(lineStarts, 2));
    lineGeometry.setAttribute('aSeed', new BufferAttribute(lineSeeds, 3));
    lineGeometry.setAttribute('aTail', new BufferAttribute(tails, 1));
    return { pointGeometry, lineGeometry };
  }, [count]);
  const uniforms = useMemo(() => ({
    uP: { value: 0 }, uPixelRatio: { value: 1 }, uCore: { value: 0 },
    uCenter: { value: new Vector2() }, uViewport: { value: new Vector2(1, 1) },
  }), []);
  useEffect(() => () => { pointGeometry.dispose(); lineGeometry.dispose(); }, [pointGeometry, lineGeometry]);

  useFrame(({ gl }) => {
    if (!dots.current || !streaks.current) return;
    const state = useScrollStore.getState();
    const p = portalProgress(state.storyChapter, state.chapterProgress, reduced);
    const active = !reduced && p > 0 && p < 0.435 && !document.querySelector('[data-preloader]');
    dots.current.visible = streaks.current.visible = active;
    if (!active) { if (p === 0) sampled.current = ''; return; }
    const width = window.innerWidth, height = window.innerHeight;
    const key = `${width}x${height}`;
    if (sampled.current !== key) {
      const point = dots.current.geometry.attributes, line = streaks.current.geometry.attributes;
      const total = sampleYear(point.aStart.array, point.aSeed.array, count);
      if (!total) { dots.current.visible = streaks.current.visible = false; return; }
      sampled.current = key;
      dots.current.geometry.setDrawRange(0, total);
      streaks.current.geometry.setDrawRange(0, total * 2);
      for (let i = 0; i < total; i++) {
        for (let end = 0; end < 2; end++) {
          line.aStart.array.set(point.aStart.array.subarray(i * 2, i * 2 + 2), (i * 2 + end) * 2);
          line.aSeed.array.set(point.aSeed.array.subarray(i * 3, i * 3 + 3), (i * 2 + end) * 3);
        }
      }
      for (const attributes of [point, line]) attributes.aStart.needsUpdate = attributes.aSeed.needsUpdate = true;
    }
    portalState(p, phase.current);
    const anchor = state.storyAnchor;
    const ox = anchor ? anchor.left + anchor.width / 2 : width * 0.75;
    const oy = anchor ? anchor.top + anchor.height / 2 : height * 0.4;
    const values = dots.current.material.uniforms;
    values.uP.value = p;
    values.uPixelRatio.value = gl.getPixelRatio();
    values.uViewport.value.set(width, height);
    values.uCenter.value.set(ox + (width * 0.5 - ox) * phase.current.center, oy + (height * 0.45 - oy) * phase.current.center);
    // Match BlackHole's projected shadow radius, as the DOM trails do.
    values.uCore.value = (anchor?.height || 40) * 0.48 * phase.current.growth;
  });

  return <>
    <lineSegments ref={streaks} name="year-dust-streaks" geometry={lineGeometry} frustumCulled={false} renderOrder={11} visible={false}>
      <shaderMaterial uniforms={uniforms} vertexShader={STREAK} fragmentShader={LINE} transparent depthTest={false} depthWrite={false} toneMapped={false} blending={AdditiveBlending} />
    </lineSegments>
    <points ref={dots} name="year-dust" geometry={pointGeometry} frustumCulled={false} renderOrder={11} visible={false}>
      <shaderMaterial uniforms={uniforms} vertexShader={PARTICLE} fragmentShader={DOT} transparent depthTest={false} depthWrite={false} toneMapped={false} blending={AdditiveBlending} />
    </points>
  </>;
}
