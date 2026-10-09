import { useEffect, useMemo } from 'react';
import { BlendFunction, Effect } from 'postprocessing';
import { Uniform } from 'three';
import { PORTAL_IMAGE_GLSL } from '@/3d/shaders/blackHole';

const MASK_FRAG = /* glsl */ `
  uniform sampler2D uBlackHoleImage;
  ${PORTAL_IMAGE_GLSL}
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec4 ray = portalImage(uBlackHoleImage, uv);
    // Restore only rays absorbed by the horizon. Foreground disk emission can
    // cross the shadow; a circular cutout would incorrectly erase that light.
    float captured = smoothstep(0.97, 1.0, ray.a) * (1.0 - step(0.0001, ray.r));
    if (uFinaleEnabled > 0.5) captured *= uFinaleHole;
    float visibility = uPortalEnabled > 0.5 ? uPortalVisibility : 1.0;
    outputColor = vec4(inputColor.rgb * (1.0 - captured) * visibility, inputColor.a);
  }
`;

export function BlackHoleBloomMask({ texture, portal }) {
  const effect = useMemo(() => new Effect('BlackHoleBloomMask', MASK_FRAG, {
    blendFunction: BlendFunction.NORMAL,
    uniforms: new Map([['uBlackHoleImage', new Uniform(texture)], ...Object.entries(portal)]),
  }), [texture, portal]);
  useEffect(() => () => effect.dispose(), [effect]);
  return <primitive object={effect} dispose={null} />;
}
