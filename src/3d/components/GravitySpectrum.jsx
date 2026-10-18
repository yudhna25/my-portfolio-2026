import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing';
import { Color, Texture, Uniform, Vector2, Vector3, Vector4 } from 'three';
import { useGravityField } from '@/3d/field/useGravityField';
import { GRAVITY_SPECTRUM_FRAG } from '@/3d/shaders/gravitySpectrum';
import { BLACK_HOLE_CENTER } from '@/3d/utils/cameraPath';
import { CHAPTER_PALETTE } from '@/3d/utils/chapterWave';
import { finaleSmooth } from '@/3d/utils/finale';
import { portalProgress, portalState } from '@/3d/utils/portal';
import { useScrollStore } from '@/stores/useScrollStore';

const center = new Vector3(...BLACK_HOLE_CENTER);
// Linear light, at its strongest beside the hole (the shader fades it with distance).
const CONTOUR_OPACITY = 0.018;
// Away from the Hero the window stays, quieter, so the cursor is one gesture site-wide.
const SPECTRUM_AWAY = 0.45;
// Aura gradient per chapter, from the chapter skies' single palette. Inner = the chapter's
// light colour beside the hole; outer = its second haze tone lifted to a visible brightness.
// Hero and the rest keep the ivory-amber signature.
const lift = (hex, light) => {
  const color = new Color(hex);
  const peak = Math.max(color.r, color.g, color.b, 1e-4);
  return color.multiplyScalar(0.55 / peak).lerp(light, 0.25);
};
const auraColors = { hero: [new Color('#F3E9D2'), new Color('#FFB25B')] };
for (const [chapter, { haze, light }] of Object.entries(CHAPTER_PALETTE)) {
  const inner = new Color(light);
  auraColors[chapter] = [inner, lift(haze[1], inner)];
}
auraColors.departure = auraColors.experience;

// Isopotential lines + the cursor's hidden spectrum, one convolution pass after bloom.
export function GravitySpectrum({ portal, reduced = false }) {
  const field = useGravityField();
  const phase = useRef({});
  const time = useRef(0);
  const spectrum = useRef(0);
  const effect = useMemo(() => new Effect('GravitySpectrum', GRAVITY_SPECTRUM_FRAG, {
    blendFunction: BlendFunction.NORMAL,
    attributes: EffectAttribute.CONVOLUTION,
    uniforms: new Map([
      ['uField', new Uniform(new Texture())],
      ['uPointer', new Uniform(new Vector4())],
      ['uHole', new Uniform(new Vector4(0.5, 0.5, 40, 0))],
      ['uContour', new Uniform(new Vector4())],
      ['uViewport', new Uniform(new Vector2(1, 1))],
      ['uTime', new Uniform(0)],
      ['uPulse', new Uniform(new Vector4(0, 0, 9, 0))],
      ['uAuraIn', new Uniform(auraColors.hero[0].clone())],
      ['uAuraOut', new Uniform(auraColors.hero[1].clone())],
    ]),
  }), []);
  useEffect(() => () => effect.dispose(), [effect]);

  useFrame(({ camera }, delta) => {
    const u = effect.uniforms;
    const state = useScrollStore.getState();
    const cssWidth = window.innerWidth, cssHeight = window.innerHeight;
    u.get('uViewport').value.set(cssWidth, cssHeight);
    if (!reduced) time.current += Math.min(delta, 0.05);
    u.get('uTime').value = time.current;
    u.get('uField').value = field.uniform.value;
    u.get('uPointer').value.copy(field.pointer.value);
    u.get('uPulse').value.copy(field.pulse.value);
    u.get('uPulse').value.w *= spectrum.current > 0.01 ? 1 : 0;

    // Where the hole is drawn: in its letter O (mini portal) or at the projected centre.
    const p = portalProgress(state.storyChapter, state.chapterProgress, reduced);
    portalState(p, phase.current);
    const hole = u.get('uHole').value;
    if (portal.uPortalMini.value > 0.5) {
      const shadow = portal.uPortalRadius.value.x * 0.48 / 2.8;
      hole.set(portal.uPortalCenter.value.x, portal.uPortalCenter.value.y, shadow, 0);
    } else {
      const distance = Math.max(1.1, camera.position.distanceTo(center));
      const angle = Math.asin(Math.min(0.999, 2.598076 * Math.sqrt(1 - 1 / distance) / distance));
      const shadow = Math.tan(angle) * cssHeight / (2 * Math.tan(camera.fov * Math.PI / 360));
      const scale = portal.uFinaleEnabled.value > 0.5 ? portal.uFinaleScale.value : 1;
      hole.set(portal.uRayCenter.value.x, portal.uRayCenter.value.y, shadow * scale, 0);
    }

    // Lines: hidden under the preloader and the portal blackout; in the finale they warm
    // to amber and stream inward until the collision swallows them. Contact stays untouched.
    const loading = Boolean(document.querySelector('[data-preloader]'));
    const finale = state.storyChapter === 'finale' ? state.chapterProgress : state.storyChapter === 'contact' ? 1 : 0;
    const visible = state.storyChapter === 'portal' ? phase.current.visibility : 1;
    const opacity = loading ? 0 : CONTOUR_OPACITY * visible * (1 - finaleSmooth(0.40, 0.50, finale));
    const contour = u.get('uContour').value;
    const heroIdle = state.storyChapter === 'hero' && p === 0;
    // Works has its own hidden layer (each figure's phenomenon), so the spectrum steps back there.
    const target = loading || reduced || finale > 0 || (state.storyChapter === 'portal' && p > 0) || state.storyChapter === 'works' ? 0
      : heroIdle ? 1 : SPECTRUM_AWAY;
    spectrum.current += (target - spectrum.current) * (1 - Math.exp(-Math.min(delta, 0.1) * 6));
    // The aura's colour drifts to the chapter's sky rather than switching with it.
    const [inner, outer] = auraColors[state.storyChapter] ?? auraColors.hero;
    const blend = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 1.4);
    u.get('uAuraIn').value.lerp(inner, blend);
    u.get('uAuraOut').value.lerp(outer, blend);
    contour.set(opacity, finaleSmooth(0.02, 0.3, finale), 7 * finaleSmooth(0.08, 0.46, finale), spectrum.current);
  });

  return <primitive object={effect} dispose={null} />;
}
