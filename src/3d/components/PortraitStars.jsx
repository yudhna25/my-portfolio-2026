import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Vector2, Vector4 } from 'three';
import { buildPortraitGeometry } from '@/3d/utils/portrait';

const VERT = /* glsl */ `
  attribute float aTone, aSeed;
  uniform vec4 uRect;
  uniform vec2 uViewport;
  uniform float uMorph, uTime, uSize, uOpacity;
  varying float vLight, vOpacity, vSpark;
  void main() {
    float gather = smoothstep(aSeed * 0.16, 1.0, uMorph);
    float angle = aSeed * 62.83 + uTime * (0.04 + aSeed * 0.035);
    float radius = 0.04 + 0.46 * sqrt(fract(aSeed * 73.17));
    vec2 cloud = vec2(cos(angle), sin(angle)) * radius;
    cloud += vec2(sin(uTime * 0.17 + aSeed * 42.0), cos(uTime * 0.13 + aSeed * 23.0)) * 0.025;
    vec2 p = mix(cloud, position.xy, gather);
    p += vec2(-position.y, position.x) * sin(gather * 3.14159265) * (0.35 + aSeed * 0.25);
    vec2 pixel = uRect.xy + (vec2(p.x, -p.y) + 0.5) * uRect.zw;
    gl_Position = vec4(pixel / uViewport * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
    vSpark = step(0.993, aSeed);
    gl_PointSize = uSize * mix(0.42 + aSeed * 0.35, 0.55 + aTone * 0.65 + aSeed * 0.38, gather) * (1.0 + vSpark * 1.1);
    vLight = mix(0.18 + 0.5 * aSeed, 0.07 + 1.1 * pow(aTone, 0.85), gather);
    vOpacity = uOpacity * mix(0.32, 0.95, gather) * (0.94 + 0.06 * sin(uTime + aSeed * 113.0));
  }
`;
const FRAG = /* glsl */ `
  varying float vLight, vOpacity, vSpark;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float core = 1.0 - smoothstep(0.18, 0.5, length(p));
    float rays = exp(-min(abs(p.x), abs(p.y)) * 40.0) * (1.0 - smoothstep(0.0, 0.5, length(p))) * vSpark;
    gl_FragColor = vec4(vec3(vLight), max(core * core, rays * 0.45) * vOpacity);
  }
`;

export function PortraitStars({ layout, frozen = false, quality = 'high' }) {
  const points = useRef(null);
  const [geometry, setGeometry] = useState(null);
  const uniforms = useMemo(() => ({ uRect: { value: new Vector4() }, uViewport: { value: new Vector2() },
    uMorph: { value: 0 }, uTime: { value: 0 }, uSize: { value: 2 }, uOpacity: { value: 0 } }), []);
  useEffect(() => {
    let active = true, owned;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const canvas = document.createElement('canvas');
      canvas.width = quality === 'low' ? 72 : quality === 'medium' ? 104 : 144;
      canvas.height = Math.round(canvas.width * 1.25);
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      owned = buildPortraitGeometry(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      setGeometry(owned);
    };
    image.src = `${import.meta.env.BASE_URL}avatar-cutout.webp`;
    return () => { active = false; image.onload = null; owned?.dispose(); };
  }, [quality]);
  useEffect(() => () => {
    layout.current?.node?.removeAttribute('data-stars-ready');
  }, [layout]);
  useFrame(({ gl }, delta) => {
    const data = layout.current;
    if (!points.current || !data) return;
    points.current.visible = !frozen && data.visible && Boolean(geometry);
    if (frozen || !geometry) data.node?.removeAttribute('data-stars-ready');
    else if (data.node && !data.node.hasAttribute('data-stars-ready')) data.node.setAttribute('data-stars-ready', 'true');
    if (!points.current.visible) return;
    const rect = data.rect;
    const values = points.current.material.uniforms;
    values.uRect.value.set(rect.left, rect.top, rect.width, rect.height);
    values.uViewport.value.set(window.innerWidth, window.innerHeight);
    values.uMorph.value = Math.max(data.morph, data.intent || 0);
    values.uOpacity.value = data.opacity;
    values.uSize.value = Math.max(1.2, rect.width / (quality === 'low' ? 72 : quality === 'medium' ? 104 : 144) * 1.35) * gl.getPixelRatio();
    values.uTime.value += Math.min(delta, 0.05);
  });
  return <points ref={points} name="portrait-stars" geometry={geometry ?? undefined} frustumCulled={false} renderOrder={30}>
    <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false} blending={AdditiveBlending} />
  </points>;
}
