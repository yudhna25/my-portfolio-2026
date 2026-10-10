import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/unbounded';
import '@/index.css';
import '@/i18n/config';
import Work from '@/components/Work';
import { GalaxyScene } from '@/3d/GalaxyScene';
import { WorksConstellations } from '@/3d/components/WorksConstellations';
import { createWorksLayout } from '@/3d/utils/worksOrbit';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { useScrollProgress } from '@/3d/hooks/useScrollProgress';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

function QA() {
  const scope = useRef(null), layoutRef = useRef(null);
  const reduced = useReducedMotion();
  const [sceneVisible, setSceneVisible] = useState(true);
  if (!layoutRef.current) layoutRef.current = createWorksLayout();
  useSmoothScroll({ scope });
  const progress = useScrollProgress({ scope, story: true, ready: true });
  useEffect(() => {
    window.v7QA = { layoutRef, store: useScrollStore, setSceneVisible, progress };
    const frame = requestAnimationFrame(() => progress.current?.seek('works', 0, false));
    return () => { cancelAnimationFrame(frame); delete window.v7QA; };
  }, [progress]);
  return <div ref={scope}>
    {sceneVisible && <GalaxyScene story>{quality => <WorksConstellations layoutRef={layoutRef} frozen={reduced} quality={quality}/>}</GalaxyScene>}
    <div id="smooth-wrapper" className="z-10"><main id="smooth-content">
      <div data-story-chapter="departure" aria-hidden="true" className="min-h-screen"/>
      <div data-story-chapter="works"><Work layoutRef={layoutRef}/></div>
      <div data-story-chapter="finale" aria-hidden="true" className="min-h-[400vh]"/>
      <div data-story-chapter="contact" aria-hidden="true" className="min-h-screen"/>
    </main></div>
  </div>;
}
createRoot(document.getElementById('root')).render(<StrictMode><QA/></StrictMode>);
