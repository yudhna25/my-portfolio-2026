import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTranslation } from 'react-i18next';
import { useScrollStore } from '@/stores/useScrollStore';
import { storyCameraPath } from '@/3d/utils/cameraPath';

export function LabTelemetry({ story = false, frozen = false }) {
  const frames = useRef(0);
  const start = useRef(0);
  const options = useRef({ value: 0 });
  const pose = useRef({});
  const { t } = useTranslation('lab');
  useFrame(({ camera, size }) => {
    const state = useScrollStore.getState();
    const progress = document.getElementById('lab-progress');
    if (progress) progress.value = state.scrollProgress;
    frames.current++;
    const now = performance.now();
    if (!start.current) start.current = now;
    if (now - start.current >= 500) {
      const output = document.getElementById('lab-fps');
      options.current.value = Math.round(frames.current * 1000 / (now - start.current));
      if (output) output.textContent = t('fpsValue', options.current);
      if (story) {
        const scrub = document.getElementById('lab-scrub');
        if (scrub) scrub.value = state.chapterProgress;
        const status = document.getElementById('lab-story-state');
        options.current.value = Math.round(state.chapterProgress * 100);
        if (status) status.textContent = t('story.state', { ...options.current, chapter: t(`story.chapters.${state.storyChapter}`), mode: t(state.storyManual ? 'story.manual' : 'story.scroll') });
        const target = storyCameraPath(state.storyChapter, state.chapterProgress, pose.current, frozen, size.width / size.height);
        const position = document.getElementById('lab-story-pose');
        if (position) {
          position.dataset.position = `${camera.position.x},${camera.position.y},${camera.position.z}`;
          position.dataset.target = `${target.lookX},${target.lookY},${target.lookZ}`;
          position.textContent = t('story.camera', { x: camera.position.x.toFixed(2), y: camera.position.y.toFixed(2), z: camera.position.z.toFixed(2) });
        }
        const orbitStatus = document.getElementById('lab-orbit-state');
        if (orbitStatus) {
          const orbit = state.worksOrbit;
          orbitStatus.textContent = t('story.works.state', { phase: orbit.phase.toFixed(4), origin: orbit.origin.toFixed(4), velocity: orbit.velocity.toFixed(4), captures: orbit.captures, mode: t(orbit.latched ? 'story.works.latched' : 'story.works.idle') });
        }
      }
      frames.current = 0;
      start.current = now;
    }
  });
  return null;
}
