import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BlendFunction, Effect } from 'postprocessing';
import { Uniform, Vector2, Vector3 } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { BLACK_HOLE_CENTER } from '@/3d/utils/cameraPath';
import { chapterWave, waveFrame, waveRadius, waveScreen } from '@/3d/utils/chapterWave';

// The gravitational wave between reading chapters, as a screen pass: a torn wavefront
// leaves the BH, refracts the sky as it passes, trails a band of debris stretched toward
// the hole (spaghettification) and a thin hot rim. The DOM reveal of the next chapter
// follows the same front (useChapterReveal), so the page tears open with the sky.
const WAVE_FRAG = /* glsl */ `
  uniform vec2 uCenter;
  uniform float uRadius, uStrength, uAspect, uPixel, uSeed;
  const float TAU = 6.28318530718;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // Torn edge: integer harmonics only, so the front closes on itself without a seam.
  float tear(float angle) {
    return 0.020 * sin(angle * 5.0 + uSeed) + 0.012 * sin(angle * 11.0 - uSeed * 1.7)
      + 0.007 * sin(angle * 23.0 + uSeed * 2.3) + 0.004 * sin(angle * 47.0 - uSeed * 0.6);
  }

  vec2 polar(vec2 uv, out float d, out float angle) {
    vec2 p = (uv - uCenter) * vec2(uAspect, 1.0);
    d = length(p);
    angle = atan(p.y, p.x);
    return p;
  }

  void mainUv(inout vec2 uv) {
    if (uStrength <= 0.0) return;
    float d, angle;
    vec2 p = polar(uv, d, angle);
    float x = (d - uRadius - tear(angle)) / 0.04;
    // Compress ahead of the front, stretch behind it: the sky visibly ripples.
    float push = -x * exp(-x * x) * 0.022 * uStrength;
    uv += p / max(d, 0.0001) / vec2(uAspect, 1.0) * push;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    outputColor = inputColor;
    if (uStrength <= 0.0) return;
    float d, angle;
    polar(uv, d, angle);
    float edge = uRadius + tear(angle);
    float behind = edge - d;
    // A thin, slightly frayed hot rim exactly on the front.
    float rim = exp(-pow((d - edge) / (1.6 * uPixel), 2.0));
    rim *= 0.75 + 0.25 * sin(angle * 140.0 + uSeed * 9.0);
    // Debris band: polar cells, long along the radius, short across it.
    float debris = 0.0;
    if (behind > 0.0 && behind < 0.12) {
      float bins = 260.0;
      float a = (angle / TAU + 0.5) * bins;
      float len = 0.010;
      vec2 cell = vec2(floor(a), floor(behind / len));
      float h = hash(cell + uSeed);
      float density = 0.38 * (1.0 - behind / 0.12);
      vec2 local = vec2(fract(a), fract(behind / len));
      float sliver = step(abs(local.x - 0.5), 0.22) * step(abs(local.y - 0.5), 0.42);
      debris = step(h, density) * sliver * (1.0 - behind / 0.12) * (0.4 + 0.6 * hash(cell * 1.7));
    }
    // A faint wash of light just behind the front, the new region opening.
    float wash = behind > 0.0 ? exp(-behind * 30.0) * 0.035 : 0.0;
    vec3 add = vec3(1.0, 0.84, 0.64) * rim * 0.9 + vec3(0.82, 0.88, 1.0) * debris * 0.5 + vec3(0.6, 0.7, 0.9) * wash;
    outputColor = vec4(inputColor.rgb + add * uStrength, inputColor.a);
  }
`;

// Computes the wave once per frame and publishes the BH's screen position for the DOM.
export function ChapterWaveDriver({ reduced = false }) {
  const projected = useMemo(() => new Vector3(), []);
  const wave = useMemo(() => ({}), []);
  useFrame(({ camera, size }) => {
    const state = useScrollStore.getState();
    chapterWave(state.storyChapter, state.chapterProgress, wave);
    projected.set(...BLACK_HOLE_CENTER).project(camera);
    // Behind the camera the projection flips; keep the last on-screen side instead.
    const behind = projected.z > 1;
    const u = behind ? waveFrame.center.x : projected.x * 0.5 + 0.5, v = behind ? waveFrame.center.y : projected.y * 0.5 + 0.5;
    waveFrame.center.set(u, v);
    const aspect = size.width / Math.max(1, size.height);
    // Farthest screen corner from the BH, in height units: the front must clear it.
    const reach = Math.max(Math.hypot(u * aspect, v), Math.hypot((1 - u) * aspect, v), Math.hypot(u * aspect, 1 - v), Math.hypot((1 - u) * aspect, 1 - v));
    waveFrame.active = !reduced && wave.active;
    waveFrame.phase = wave.phase;
    waveFrame.to = wave.to;
    waveFrame.strength = waveFrame.active ? wave.strength : 0;
    waveFrame.radius = waveRadius(wave.phase) * reach;
    waveScreen.x = u * size.width;
    waveScreen.y = (1 - v) * size.height;
    waveScreen.width = size.width;
    waveScreen.height = size.height;
    waveScreen.ready = true;
  }, -0.6);
  return null;
}

const SEEDS = { skills: 1.3, education: 2.9, experience: 4.4, departure: 5.8 };

export function ChapterWaveEffect() {
  const effect = useMemo(() => new Effect('ChapterWave', WAVE_FRAG, {
    blendFunction: BlendFunction.NORMAL,
    uniforms: new Map([
      ['uCenter', new Uniform(new Vector2(0.75, 0.75))], ['uRadius', new Uniform(0)], ['uStrength', new Uniform(0)],
      ['uAspect', new Uniform(1)], ['uPixel', new Uniform(0.001)], ['uSeed', new Uniform(0)],
    ]),
  }), []);
  useEffect(() => () => effect.dispose(), [effect]);
  useFrame(({ size }) => {
    const values = effect.uniforms;
    values.get('uCenter').value.set(waveFrame.center.x, waveFrame.center.y);
    values.get('uRadius').value = waveFrame.radius;
    values.get('uStrength').value = waveFrame.strength;
    values.get('uAspect').value = size.width / Math.max(1, size.height);
    values.get('uPixel').value = 1 / Math.max(1, size.height);
    // A different tear for every chapter join, fixed while it plays.
    values.get('uSeed').value = SEEDS[waveFrame.to] ?? 0;
  });
  return <primitive object={effect} dispose={null} />;
}
