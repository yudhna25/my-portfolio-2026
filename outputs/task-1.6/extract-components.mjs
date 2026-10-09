// One-time extraction: copy the approved shader strings without retyping GLSL.
import { readFileSync, writeFileSync } from 'node:fs';
const prototype = readFileSync('src/3d-lab.jsx', 'utf8');
const shader = name => prototype.match(new RegExp('const ' + name + ' = /\\* glsl \\*/ `[\\s\\S]*?`;'))[0];
writeFileSync('src/3d/components/StarField.jsx', `import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color } from 'three';
import { QUALITY } from '@/3d/quality';
import { buildStarGeometry } from '@/3d/utils/buildStarGeometry';

${shader('STAR_VERT')}

${shader('STAR_FRAG')}

export function StarField({ count = QUALITY.high, frozen = false }) {
  const material = useRef(null);
  const geometry = useMemo(() => buildStarGeometry(count), [count]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uColorA: { value: new Color('#FFFFFF') },
    uColorB: { value: new Color('#BBBBBB') },
  }), []);

  // Geometry supplied as a prop is manually owned; dispose also on tier changes.
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!material.current) return;
    // Match the actual drawing buffer, including the Canvas DPR cap / resize.
    material.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    if (!frozen) material.current.uniforms.uTime.value += Math.min(delta, 0.1);
  });

  return (
    <points name="star-field" geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
`);
writeFileSync('src/3d/components/Nebula.jsx', `import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color } from 'three';

${shader('NEBULA_VERT')}

${shader('NEBULA_FRAG')}

export function Nebula({ position, scale, colorA = '#202020', colorB = '#5A5A5A', frozen = false }) {
  const material = useRef(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new Color(colorA) },
    uColorB: { value: new Color(colorB) },
  }), [colorA, colorB]);

  useFrame((_, delta) => {
    if (material.current && !frozen) {
      material.current.uniforms.uTime.value += Math.min(delta, 0.1);
    }
  });

  return (
    <mesh name="nebula" position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={NEBULA_VERT}
        fragmentShader={NEBULA_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
`);
writeFileSync('src/3d/components/BlackHole.jsx', `import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';

// Move the prototype's rotation/pulse into the vertex stage: only uniforms
// change on the CPU. Local Z rotation precedes the outer ring's fixed tilt.
const DISK_VERT = /* glsl */ \`
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    float angle = uTime * 0.35;
    float c = cos(angle), s = sin(angle);
    vec3 p = position;
    p.xy = mat2(c, s, -s, c) * p.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
\`;

${shader('DISK_FRAG').replace('float tail = smoothstep(0.75, 1.0, r) * 0.15;', '// Fade to zero at the disk edge; the prototype left the square plane visible.\n    float tail = smoothstep(0.45, 0.75, r) * (1.0 - smoothstep(0.75, 1.0, r)) * 0.15;')}

const RING_VERT = /* glsl */ \`
  uniform float uTime;
  void main() {
    float angle = -uTime * 0.12;
    float c = cos(angle), s = sin(angle);
    vec3 p = position * (1.0 + sin(uTime * 1.4) * 0.03);
    p.xy = mat2(c, s, -s, c) * p.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
\`;

const RING_FRAG = /* glsl */ \`
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.45);
  }
\`;

export function BlackHole({ frozen = false }) {
  const disk = useRef(null);
  const ring = useRef(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, delta) => {
    if (frozen || !disk.current || !ring.current) return;
    disk.current.uniforms.uTime.value += Math.min(delta, 0.1);
    ring.current.uniforms.uTime.value = disk.current.uniforms.uTime.value;
  });

  return (
    <group name="black-hole" position={[0, 0, -200]}>
      <mesh name="event-horizon">
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh name="photon-ring">
        <torusGeometry args={[2.45, 0.05, 16, 160]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </mesh>
      <mesh name="accretion-disk">
        <planeGeometry args={[22, 22]} />
        <shaderMaterial
          ref={disk}
          vertexShader={DISK_VERT}
          fragmentShader={DISK_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh name="tilted-ring" rotation={[Math.PI / 2.7, 0.25, 0]} frustumCulled={false}>
        <torusGeometry args={[6.4, 0.035, 8, 200]} />
        <shaderMaterial
          ref={ring}
          vertexShader={RING_VERT}
          fragmentShader={RING_FRAG}
          uniforms={uniforms}
          transparent
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
`);
