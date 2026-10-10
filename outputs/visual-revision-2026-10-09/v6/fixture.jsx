import { StrictMode, useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/unbounded';
import '@/i18n/config';
import '@/index.css';
import { GalaxyScene } from '@/3d/GalaxyScene';
import { StoryMeteor } from '@/3d/components/StoryMeteor';
import Experience from '@/components/sections/Experience';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function Fixture() {
  const layout = useRef(null);
  const capture = useCallback(value => { layout.current = value; }, []);
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(true);
  window.v6Mount = setMounted;
  return <>
    {mounted && <GalaxyScene story freezeAmbient={false}><StoryMeteor layout={layout} frozen={reduced} /></GalaxyScene>}
    <main id="smooth-content" className="relative z-10 text-(--text-primary)">
      <div data-story-chapter="experience"><Experience onLayout={capture} /></div>
      <div data-story-chapter="works" aria-hidden="true" className="h-screen" />
    </main>
  </>;
}

createRoot(document.getElementById('root')).render(<StrictMode><Fixture /></StrictMode>);
