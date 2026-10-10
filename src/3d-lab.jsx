import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import '@/index.css';
import { i18n } from '@/i18n/config';
import { GalaxyScene } from '@/3d/GalaxyScene';
import { LabTelemetry } from '@/3d/components/LabTelemetry';
import { WorksConstellations } from '@/3d/components/WorksConstellations';
import { SkillsSymbols } from '@/3d/components/SkillsSymbols';
import { StoryMeteor } from '@/3d/components/StoryMeteor';
import { createWorksLayout } from '@/3d/utils/worksOrbit';
import Work from '@/components/Work';
import Skills from '@/components/sections/Skills';
import Education from '@/components/Education';
import Experience from '@/components/sections/Experience';
import { ConstellationCredits } from '@/components/ui/ConstellationCredits';
import { PortalHeading } from '@/components/effects/PortalHeading';
import About from '@/components/About';
import { useLabScroll } from '@/3d/hooks/useLabScroll';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useScrollStore } from '@/stores/useScrollStore';
import { STORY_CHAPTERS, STORY_SEED, STORY_IDLE_PHASE } from '@/3d/utils/cameraPath';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMediaQuery } from '@/3d/hooks/useMediaQuery';
import { QUALITY } from '@/3d/quality';
import vi from '@/i18n/locales/vi/lab.json';
import en from '@/i18n/locales/en/lab.json';

i18n.addResourceBundle('vi', 'lab', vi, true, true);
i18n.addResourceBundle('en', 'lab', en, true, true);

export default function Lab() {
  const scope = useRef(null);
  const [story, setStory] = useState(() => new URLSearchParams(window.location.search).get('story') === '1');
  const [chosenQuality, setQuality] = useState(null);
  const [showContent, setShowContent] = useState(() => new URLSearchParams(window.location.search).get('story') === '1');
  const [bloom, setBloom] = useState(true);
  const skillsAnchor = useRef(null);
  const meteorLayout = useRef(null);
  const captureMeteorLayout = useCallback(layout => { meteorLayout.current = layout; }, []);
  const [worksLayout] = useState(() => ({ current: createWorksLayout() }));
  const [educationStages] = useState(() => ({ saigonUniversity: { current: null }, greenAcademy: { current: null }, arenaMultimedia: { current: null } }));
  const mobile = useMediaQuery('(max-width: 767px)');
  const tablet = useMediaQuery('(max-width: 1023px)');
  const quality = chosenQuality ?? (mobile ? 'low' : tablet ? 'medium' : 'high');
  const bloomEnabled = bloom && quality !== 'low';
  const frozen = useReducedMotion();
  const fallback = useScrollStore(state => state.sceneFallback);
  const staticMotion = frozen || fallback;
  const { t } = useTranslation('lab');
  const chapter = useScrollStore(state => state.storyChapter);
  const manual = useScrollStore(state => state.storyManual);
  const entering = story && (chapter === 'hero' || chapter === 'portal');
  useSmoothScroll({ scope });
  const controls = useLabScroll({ scope, story, locale: i18n.language, staticMotion });
  useEffect(() => { document.title = t('title'); }, [t]);

  return (
    <div ref={scope} className="relative text-white font-body">
      <GalaxyScene quality={quality} enableBloom={bloom} story={story}>{tier => <>
        {story && <WorksConstellations frozen={frozen} quality={tier} layoutRef={worksLayout} />}
        {story && <SkillsSymbols anchor={skillsAnchor} educationAnchors={educationStages} />}
        {story && <StoryMeteor layout={meteorLayout} frozen={frozen} />}
        <LabTelemetry story={story} frozen={frozen} />
      </>}</GalaxyScene>
      {story && <PortalHeading label={t('story.portfolioPrefix') + t('story.portalGlyph')} year={t('story.year')} name={i18n.t('hero.name')} role={i18n.t('hero.tagline')} visible={showContent} />}
      <ConstellationCredits />
      <a href="/" aria-label={t('back')} className="fixed top-3 left-6 z-30 inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-widest text-secondary hover:text-foreground"><span className="sm:hidden">{t('story.backShort')}</span><span className="hidden sm:inline">{t('back')}</span></a>
      <div id="smooth-wrapper"><main id="smooth-content" inert={!showContent} aria-hidden={!showContent} className={`relative z-10 pointer-events-none ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {story ? <>
          {STORY_CHAPTERS.filter(item => item.id !== 'departure').map(item => item.id === 'skills' ? <div key={item.id} data-story-chapter="skills" inert={entering && !staticMotion} className="pointer-events-auto"><Skills stageRef={skillsAnchor} /></div>
            : item.id === 'education' ? <div key={item.id} data-story-chapter="education" inert={entering && !staticMotion} className="pointer-events-auto"><Education stageRefs={educationStages} /></div>
            : item.id === 'experience' ? <div key={item.id} data-story-chapter="experience" inert={entering && !staticMotion} className="pointer-events-auto"><Experience onLayout={captureMeteorLayout} /></div>
            : item.id === 'works' ? <div key={item.id} data-story-chapter="works" inert={entering && !staticMotion} className="pointer-events-auto"><Work layoutRef={worksLayout} nativeNavigation /></div>
            : item.id === 'about' ? <div key={item.id} id="lab-about" data-story-chapter="about" className="pointer-events-auto"><About /></div> : (
            <section key={item.id} id={`lab-${item.id}`} data-story-chapter={item.id} className={`flex flex-col justify-start px-6 pt-28 pb-64 sm:px-12 lg:px-20 ${entering ? 'invisible' : ''} ${item.id === 'portal' ? staticMotion ? 'min-h-screen' : 'min-h-[400vh]' : item.id === 'finale' && staticMotion ? 'min-h-0' : item.height === 1.75 ? 'min-h-[175vh]' : item.height === 2.25 ? 'min-h-[225vh]' : item.height === 1.1 ? 'min-h-[110vh]' : 'min-h-screen'}`}>
              <div className={`max-w-lg ${item.id === 'works' || chapter === 'works' ? 'invisible' : ''}`}>
                <p className="font-mono text-xs uppercase tracking-widest text-secondary">{t('story.prototype')}</p>
                <h2 className="mt-4 font-display text-3xl sm:text-5xl">{t(`story.chapters.${item.id}`)}</h2>
                <p className="mt-5 leading-relaxed text-secondary">{t(`story.notes.${item.id}`)}</p>
              </div>
            </section>
          ))}
          <footer className="flex min-h-screen flex-col justify-start px-6 pt-28 pb-64 sm:px-12 lg:px-20">
            <p className="max-w-lg leading-relaxed text-secondary">{t('story.end', { seed: STORY_SEED, phase: STORY_IDLE_PHASE })}</p>
          </footer>
        </> : ['start', 'travel', 'end'].map(key => (
          <section key={key} id={`lab-${key}`} className={`flex min-h-screen flex-col px-6 py-24 sm:px-12 lg:px-20 ${key === 'end' ? 'justify-start sm:justify-center' : 'justify-center'}`}>
            <div className="max-w-sm lg:max-w-[43vw]">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary">{t(`${key}.code`)}</p>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-none tracking-tight sm:text-6xl lg:text-[clamp(48px,6vw,100px)]">
                {t(`${key}.line1`)}{t(`${key}.line2`) && <><br /><span className="text-secondary">{t(`${key}.line2`)}</span></>}
              </h1>
              <p className="mt-5 max-w-md leading-relaxed text-secondary">{t(`${key}.description`, { count: QUALITY[quality].toLocaleString(i18n.language) })}</p>
            </div>
          </section>
        ))}
      </main></div>
      <div data-lab-hud className="fixed top-5 right-6 z-30 flex flex-col items-end gap-3 font-mono text-xs">
        <p><span className="mr-3 text-secondary">{t('fps')}</span><span id="lab-fps">{t('waiting')}</span></p>
        <label className="flex items-center gap-3 text-secondary">{t('scroll')}<progress id="lab-progress" max="1" value="0" className="h-0.5 w-16 sm:w-32 appearance-none [&::-webkit-progress-bar]:bg-white/20 [&::-webkit-progress-value]:bg-white [&::-moz-progress-bar]:bg-white" /></label>
      </div>
      <details data-lab-controls open={!story} className={`fixed bottom-3 inset-x-3 z-30 mx-auto flex max-w-3xl flex-col items-center gap-2 rounded-lg bg-black/90 p-3 ${story ? 'max-h-[35vh] overflow-y-auto' : ''}`}>
        <summary className="min-h-11 w-full cursor-pointer content-center text-center font-mono text-xs text-secondary">{t('controls')}</summary>
        {story && <div className="w-full font-mono text-xs">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label>{t('story.chapter')}<select id="lab-chapter" value={chapter} onChange={event => controls.current?.seek(event.target.value, 0)} className="ml-2 min-h-11 max-w-44 rounded border border-white/30 bg-black px-2 text-white">{STORY_CHAPTERS.map(item => <option key={item.id} value={item.id}>{t(`story.chapters.${item.id}`)}</option>)}</select></label>
            <button id="lab-hold" onClick={() => manual ? controls.current?.resume() : controls.current?.hold()} className="min-h-11 rounded border border-white/30 px-3 hover:border-white">{t(manual ? 'story.resume' : 'story.hold')}</button>
            <output id="lab-story-state" aria-live="off" className="text-secondary" />
          </div>
          <label className="mt-2 flex items-center gap-3">{t('story.progress')}<input id="lab-scrub" type="range" min="0" max="1" step="0.001" defaultValue="0" onChange={event => controls.current?.seek(chapter, Number(event.target.value))} className="h-11 min-w-0 flex-1 accent-white" /></label>
          <div aria-label={t('story.poses')} className="flex justify-center gap-2">{[0, 0.25, 0.5, 0.75, 1].map(p => <button key={p} data-pose={p} onClick={() => controls.current?.seek(chapter, p)} className="min-h-11 min-w-11 rounded border border-white/20 hover:border-white">{t('story.percent', { value: p * 100 })}</button>)}</div>
          <output id="lab-story-pose" className="mt-1 block break-words text-center text-[10px] text-secondary" />
          <output id="lab-orbit-state" className="mt-1 block break-words text-center text-[10px] text-secondary" />
        </div>}
        <p role="status" className="text-center font-mono text-[10px] text-secondary">{t(frozen ? 'frozen' : story ? 'story.running' : 'running')}</p>
        <details open={!story} className="w-full text-center">
          <summary className="min-h-11 cursor-pointer content-center font-mono text-xs text-secondary">{t('controls')}</summary>
        <div aria-label={t('controls')} className="flex flex-wrap justify-center gap-2 [&>button]:min-h-11">
          {Object.keys(QUALITY).map(key => <button key={key} aria-pressed={quality === key} onClick={() => setQuality(key)} className="rounded-lg border border-white/20 bg-black/80 px-4 py-3 font-mono text-xs hover:border-white aria-pressed:bg-white aria-pressed:text-black">{t(`quality.${key}`, { count: (QUALITY[key] / 1000).toLocaleString(i18n.language) })}</button>)}
          <button aria-pressed={bloomEnabled} disabled={quality === 'low'} onClick={() => setBloom(value => !value)} className="rounded-lg border border-white/20 bg-black/80 px-4 py-3 font-mono text-xs hover:border-white disabled:opacity-40 disabled:cursor-not-allowed">{t(bloomEnabled ? 'bloomOff' : 'bloomOn')}</button>
          <button aria-pressed={showContent} onClick={() => setShowContent(value => !value)} className="rounded-lg border border-white/20 bg-black/80 px-4 py-3 font-mono text-xs hover:border-white">{t(showContent ? 'contentOff' : 'contentOn')}</button>
          <button id="lab-mode" aria-pressed={story} onClick={() => setStory(value => !value)} className="rounded-lg border border-white/20 bg-black/80 px-4 py-3 font-mono text-xs hover:border-white">{t(story ? 'story.legacy' : 'story.enable')}</button>
          <button id="lab-language" onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')} className="rounded-lg border border-white/20 bg-black/80 px-4 py-3 font-mono text-xs hover:border-white">{t('story.language')}</button>
        </div>
        </details>
      </details>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><Lab /></StrictMode>);
