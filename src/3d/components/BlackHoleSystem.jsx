import { useEffect, useMemo, useRef } from 'react';
import { EffectComposer, Select, SelectiveBloom } from '@react-three/postprocessing';
import { HalfFloatType, LinearFilter, Vector2, Vector4, WebGLRenderTarget } from 'three';
import { BlackHole } from '@/3d/components/BlackHole';
import { BlackHoleBloomMask } from '@/3d/components/BlackHoleBloomMask';

export function BlackHoleSystem({ frozen = false, quality = 'high', enableBloom = true, story = false, reduced = false }) {
  const light = useRef(null);
  const lights = useMemo(() => [light], []);
  const portal = useMemo(() => ({
    uPortalEnabled: { value: 0 }, uPortalMini: { value: 0 },
    uPortalCenter: { value: new Vector2(0.5, 0.5) }, uRayCenter: { value: new Vector2(0.5, 0.5) },
    uPortalScale: { value: 1 }, uPortalRadius: { value: new Vector2(1, 1) },
    uPortalVisibility: { value: 1 }, uPortalDust: { value: 0 }, uPortalPull: { value: 0 }, uPortalViewport: { value: new Vector2(1, 1) },
    uFinaleEnabled: { value: 0 }, uFinaleHole: { value: 1 }, uFinaleOrigin: { value: 0 },
    uFinaleGas: { value: new Vector4() },
  }), []);
  const target = useMemo(() => new WebGLRenderTarget(1, 1, {
    type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter,
    depthBuffer: false, stencilBuffer: false,
  }), []);
  useEffect(() => () => target.dispose(), [target]);

  return <>
    <Select enabled><BlackHole target={target} frozen={frozen} quality={quality} story={story} reduced={reduced} portal={portal} /></Select>
    {enableBloom && quality !== 'low' && <>
      <ambientLight ref={light} color="#FFFFFF" />
      <EffectComposer multisampling={0}>
        <SelectiveBloom lights={lights} ignoreBackground mipmapBlur intensity={quality === 'medium' ? 0.15 : 0.3}
          luminanceThreshold={1.0} luminanceSmoothing={0.15} radius={0.55} />
        <BlackHoleBloomMask texture={target.texture} portal={portal} />
      </EffectComposer>
    </>}
  </>;
}
