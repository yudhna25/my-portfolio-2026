import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import '@/index.css';
import { i18n } from '@/i18n/config';
import { GalaxyScene } from '@/3d/GalaxyScene';
import { LabTelemetry } from '@/3d/components/LabTelemetry';
import { WorksConstellations } from '@/3d/components/WorksConstellations';
import { SymbolStars } from '@/3d/components/SymbolStars';
import { SYMBOL_TOOL_IDS, SYMBOL_EDUCATION_IDS } from '@/3d/utils/symbolMorph';
import { PortalHeading } from '@/components/effects/PortalHeading';
import { useLabScroll } from '@/3d/hooks/useLabScroll';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useScrollStore } from '@/stores/useScrollStore';
import { STORY_CHAPTERS, STORY_SEED, STORY_IDLE_PHASE } from '@/3d/utils/cameraPath';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMediaQuery } from '@/3d/hooks/useMediaQuery';
import { QUALITY } from '@/3d/quality';
import { WORKS_IDS } from '@/3d/utils/worksOrbit';
import { finaleState } from '@/3d/utils/finale';
import { gsap, useGSAPSetup } from '@/hooks/useGSAPSetup';
import vi from '@/i18n/locales/vi/lab.json';
import en from '@/i18n/locales/en/lab.json';

i18n.addResourceBundle('vi', 'lab', vi, true, true);
i18n.addResourceBundle('en', 'lab', en, true, true);

// Stable sample controls only: R5.2 supplies the real preview/reader action.
function WorksControls({ visible }) {
  const scope = useRef(null);
  const frozen = useReducedMotion();
  const active = useScrollStore(state => state.storyChapter === 'works');
  const { t } = useTranslation('lab');
  const selected = useScrollStore(state => state.worksSelection);
  const interact = useScrollStore(state => state.setWorksInteraction);
  const clear = useScrollStore(state => state.clearWorksInteraction);
  const pointer = useRef('');
  useEffect(() => {
    if (!visible || !active) { interact('Hover', null); interact('Focus', null); }
    return () => { interact('Hover', null); interact('Focus', null); };
  }, [visible, active, interact]);
  useGSAPSetup(() => {
    const stage = scope.current, phase = {};
    gsap.set(stage, { opacity: 1, y: 0 });
    const opacity = gsap.quickSetter(stage, 'opacity');
    const shift = gsap.quickSetter(stage, 'y', 'px');
    const draw = () => {
      const state = useScrollStore.getState();
      const ending = state.storyChapter === 'finale' && !frozen;
      finaleState(ending ? state.chapterProgress : 0, phase);
      stage.hidden = !visible || !(active || ending && phase.label > 0);
      stage.inert = !active;
      opacity(ending ? phase.label : 1);
      shift(ending ? (phase.label - 1) * 16 : 0);
    };
    draw();
    return useScrollStore.subscribe(draw);
  }, { scope, dependencies: [visible, active, frozen], revertOnUpdate: true });
  const dismiss = target => { target.focus({ preventScroll: true }); clear(); };
  return <div ref={scope} data-works-controls hidden={!visible} tabIndex={-1} role="group" aria-label={t('story.works.controls')} className="fixed inset-0 z-20 px-5 pt-[10vh] pointer-events-auto focus-visible:outline-2 focus-visible:outline-white"
    onClick={event => { if (!event.target.closest('[data-works-choice]')) dismiss(event.currentTarget); }}
    onKeyDown={event => { if (event.key === 'Escape') { dismiss(event.currentTarget); event.stopPropagation(); } }}>
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="font-display text-xl sm:text-3xl">{t('story.chapters.works')}</h2>
      <p className="mt-2 font-mono text-[10px] text-secondary">{t('story.works.help')}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-5">
        {WORKS_IDS.map(id => <button key={id} data-works-choice={id} aria-pressed={selected === id}
          onPointerEnter={event => { if (event.pointerType !== 'touch') interact('Hover', id); }}
          onPointerLeave={() => interact('Hover', null)}
          onPointerDown={event => { pointer.current = event.pointerType; }}
          onFocus={() => interact('Focus', id)} onBlur={() => interact('Focus', null)}
          onClick={() => { interact('Selection', selected === id ? null : id); if (pointer.current === 'touch') { interact('Focus', null); interact('Hover', null); } pointer.current = ''; }}
          className="min-h-11 min-w-11 border-b border-white/20 px-1 py-2 font-mono text-xs hover:border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white aria-pressed:border-white">
          <span className="block">{t(`story.works.${id}`)}</span><span className="mt-1 block text-[9px] text-secondary">{t(`story.works.${id}Figure`)}</span>
        </button>)}
      </div>
    </div>
  </div>;
}

// Lab input only; production Skills/Education supply their own DOM and selection.
function SymbolControls({ chapter, onTarget }) {
  const [selection, setSelection] = useState(null);
  const [hover, setHover] = useState(null);
  const [focus, setFocus] = useState(null);
  const pointer = useRef('');
  const { t } = useTranslation('lab');
  const ids = chapter === 'skills' ? SYMBOL_TOOL_IDS : SYMBOL_EDUCATION_IDS;
  const target = selection ?? focus ?? hover;
  useEffect(() => { onTarget(target); return () => onTarget(null); }, [onTarget, target]);
  const clear = element => { element.focus({ preventScroll: true }); setSelection(null); setFocus(null); setHover(null); };
  return <div data-symbol-controls tabIndex={-1} role="group" aria-label={t('symbols.controls')} className="pointer-events-auto pt-14 md:pt-0 focus-visible:outline-2 focus-visible:outline-white"
    onKeyDown={event => { if (event.key === 'Escape') { clear(event.currentTarget); event.stopPropagation(); } }}>
    <p className="mb-2 max-w-2xl font-mono text-[10px] text-secondary">{t('symbols.help')}</p>
    <div className="flex flex-wrap gap-1">
      {ids.map(id => <button key={id} data-symbol-choice={id} aria-pressed={selection === id}
        onPointerEnter={event => { if (event.pointerType !== 'touch') setHover(id); }} onPointerLeave={() => setHover(null)}
        onPointerDown={event => { pointer.current = event.pointerType; }} onFocus={() => setFocus(id)} onBlur={() => setFocus(null)}
        onClick={() => { setSelection(selection === id ? null : id); if (pointer.current === 'touch') { setFocus(null); setHover(null); } pointer.current = ''; }}
        className="min-h-11 min-w-11 border-b border-white/20 px-3 py-2 font-mono text-xs hover:border-white focus-visible:outline-2 focus-visible:outline-white aria-pressed:border-white">{t(`symbols.targets.${id}`)}</button>)}
      <button data-symbol-reset onClick={event => clear(event.currentTarget)} className="min-h-11 min-w-11 px-3 font-mono text-xs underline focus-visible:outline-2 focus-visible:outline-white">{t('symbols.reset')}</button>
    </div>
  </div>;
}

export default function Lab() {
  const scope = useRef(null);
  const [story, setStory] = useState(() => new URLSearchParams(window.location.search).get('story') === '1');
  const [chosenQuality, setQuality] = useState(null);
  const [showContent, setShowContent] = useState(() => new URLSearchParams(window.location.search).get('story') === '1');
  const [bloom, setBloom] = useState(true);
  const [symbolTarget, setSymbolTarget] = useState(null);
  const skillsAnchor = useRef(null), educationAnchor = useRef(null);
  const mobile = useMediaQuery('(max-width: 767px)');
  const tablet = useMediaQuery('(max-width: 1023px)');
  const quality = chosenQuality ?? (mobile ? 'low' : tablet ? 'medium' : 'high');
  const bloomEnabled = bloom && quality !== 'low';
  const frozen = useReducedMotion();
  const { t } = useTranslation('lab');
  const chapter = useScrollStore(state => state.storyChapter);
  const manual = useScrollStore(state => state.storyManual);
  const entering = story && (chapter === 'hero' || chapter === 'portal');
  useSmoothScroll({ scope });
  const controls = useLabScroll({ scope, story, locale: i18n.language });
  useEffect(() => { document.title = t('title'); }, [t]);

  return (
    <div ref={scope} className="relative text-white font-body">
      <GalaxyScene quality={quality} enableBloom={bloom} story={story}>{tier => <>
        {story && <WorksConstellations frozen={frozen} quality={tier} />}
        {story && <SymbolStars anchor={chapter === 'education' ? educationAnchor : skillsAnchor} target={symbolTarget}
          active={showContent && (chapter === 'skills' || chapter === 'education')} frozen={frozen} />}
        <LabTelemetry story={story} frozen={frozen} />
      </>}</GalaxyScene>
      {story && <PortalHeading label={t('story.portfolioPrefix') + t('story.portalGlyph')} year={t('story.year')} name={i18n.t('hero.name')} visible={showContent} />}
      {story && <WorksControls visible={showContent} />}
      <a href="/" aria-label={t('back')} className="fixed top-3 left-6 z-30 inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-widest text-secondary hover:text-foreground"><span className="sm:hidden">{t('story.backShort')}</span><span className="hidden sm:inline">{t('back')}</span></a>
      <div id="smooth-wrapper"><main id="smooth-content" aria-hidden={!showContent || entering} className={`relative z-10 pointer-events-none ${showContent && !entering ? 'opacity-100' : 'opacity-0'}`}>
        {story ? <>
          {STORY_CHAPTERS.map(item => (
            <section key={item.id} id={`lab-${item.id}`} data-story-chapter={item.id} className={`flex flex-col justify-start px-6 pt-28 pb-64 sm:px-12 lg:px-20 ${item.height === 1.75 ? 'min-h-[175vh]' : item.height === 2.25 ? 'min-h-[225vh]' : item.height === 1.1 ? 'min-h-[110vh]' : 'min-h-screen'}`}>
              <div className={`max-w-lg ${item.id === 'works' || chapter === 'works' ? 'invisible' : ''}`}>
                <p className="font-mono text-xs uppercase tracking-widest text-secondary">{t('story.prototype')}</p>
                <h2 className="mt-4 font-display text-3xl sm:text-5xl">{t(`story.chapters.${item.id}`)}</h2>
                <p className="mt-5 leading-relaxed text-secondary">{t(`story.notes.${item.id}`)}</p>
              </div>
              {(item.id === 'skills' || item.id === 'education') && <div className="mt-6 max-w-4xl">
                {chapter === item.id && showContent && <SymbolControls key={item.id} chapter={item.id} onTarget={setSymbolTarget} />}
                <div ref={item.id === 'skills' ? skillsAnchor : educationAnchor} data-symbol-anchor={item.id}
                  className="mt-5 h-[min(35vh,420px)] min-h-60 w-full pointer-events-auto md:h-[min(45vh,420px)]"
                  onClick={event => { if (chapter === item.id) { const controls = event.currentTarget.previousElementSibling; controls?.focus({ preventScroll: true }); controls?.querySelector('[data-symbol-reset]')?.click(); } }} />
              </div>}
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
      <div data-lab-controls className={`fixed bottom-3 inset-x-3 z-30 mx-auto flex max-w-3xl flex-col items-center gap-2 rounded-lg bg-black/90 p-3 ${(chapter === 'skills' || chapter === 'education') && story ? 'max-h-[23vh] overflow-y-auto md:inset-x-auto md:right-3 md:w-72' : ''}`}>
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
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><Lab /></StrictMode>);
