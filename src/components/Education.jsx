import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from '@/hooks/useGSAPSetup';
import { educationInstitutions } from '@/data/education';
import { useEducationStore, activeEducation } from '@/stores/useEducationStore';
import { useScrollStore } from '@/stores/useScrollStore';
import { SYMBOL_TARGETS } from '@/3d/utils/symbolMorph';
import { EDUCATION_KNOTS, educationBeat, knotLabels } from '@/3d/utils/educationKnots';
import { ConstellationCreditButton } from '@/components/ui/ConstellationCredits';
import { MixedText } from '@/components/ui/MixedText';
import '@/styles/education.css';

// The constellation as a small annotation mark beside the years: its real stick figure,
// brighter stars drawn larger.
function ConstellationMark({ id }) {
  const { geometry, edges } = SYMBOL_TARGETS[id];
  const stars = geometry.stars.map(star => [star.position[0], -star.position[1], star.vmag]);
  const xs = stars.map(([x]) => x), ys = stars.map(([, y]) => y);
  const pad = 0.08, box = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
  const unit = Math.max(box[2], box[3]) / 40;
  return <svg aria-hidden="true" viewBox={box.join(' ')} className="edu-mark h-7 w-7 shrink-0 overflow-visible">
    {edges.map(([a, b], index) => <line key={index} x1={stars[a][0]} y1={stars[a][1]} x2={stars[b][0]} y2={stars[b][1]} strokeWidth={unit * 0.9} />)}
    {stars.map(([x, y, mag], index) => <circle key={index} cx={x} cy={y} r={unit * Math.max(0.9, 2.6 - mag * 0.45)} />)}
  </svg>;
}

export default function Education() {
  const root = useRef(null);
  const items = useRef({});
  const pointer = useRef('');
  const { t, i18n } = useTranslation();
  const chosen = useEducationStore(activeEducation);
  const beat = useScrollStore(state => state.storyChapter === 'education' ? educationBeat(state.chapterProgress) : null);
  const reading = chosen ?? (beat === null ? null : EDUCATION_KNOTS[beat].id);
  const active = useScrollStore(state => state.storyChapter === 'education');
  const { interact, clear } = useEducationStore.getState();
  const handlers = id => ({
    onPointerEnter: event => { if (event.pointerType === 'mouse') interact('hover', id); },
    onPointerLeave: () => { if (useEducationStore.getState().hover === id) interact('hover', null); },
    onPointerDown: event => { pointer.current = event.pointerType; },
    onFocus: event => { if (!['touch', 'pen'].includes(pointer.current) && event.target.matches(':focus-visible')) interact('focus', id); },
    onBlur: () => { if (useEducationStore.getState().focus === id) interact('focus', null); },
    onClick: event => {
      if (['touch', 'pen'].includes(pointer.current)) { const previous = useEducationStore.getState().selection; clear(); interact('selection', previous === id ? null : id); }
      else if (event.detail === 0) interact('focus', id);
      pointer.current = '';
    },
  });

  useEffect(() => { if (!active) clear(); }, [active, clear]);

  // The sky places these labels beside their knots on the galaxy's arm (see Knots).
  useEffect(() => {
    const section = root.current;
    knotLabels.section = section;
    knotLabels.items = items.current;
    return () => {
      if (knotLabels.section === section) { knotLabels.section = null; knotLabels.items = {}; }
      delete section.dataset.knots;
      clear();
    };
  }, [clear]);

  useGSAP(() => { ScrollTrigger.refresh(true); }, { scope: root, dependencies: [i18n.resolvedLanguage], revertOnUpdate: true });

  return <section ref={root} id="education" lang={i18n.resolvedLanguage} aria-labelledby="education-heading"
    onKeyDownCapture={event => { pointer.current = 'keyboard'; if (event.key === 'Escape') { clear(); event.stopPropagation(); } }}
    onClick={event => { if (!event.target.closest('[data-education-item]')) clear(); }}
    className="edu relative isolate px-6 py-24 text-(--text-primary) sm:px-8 lg:min-h-[175vh] lg:py-28 lg:pl-28 lg:pr-12">
    <div className="mx-auto max-w-7xl">
      <header className="max-w-3xl star-scrim">
        <p key={`label-${i18n.resolvedLanguage}`} lang="en" data-reveal="dust" className="mb-5 font-mono text-xs tracking-[0.2em] text-(--text-secondary)">{t('education.sectionLabel')}</p>
        <h2 key={i18n.resolvedLanguage} id="education-heading" aria-label={t('education.heading')} data-reveal="starlight" className="font-display text-[clamp(1.75rem,4.5vw,4rem)] font-bold uppercase leading-[1.2] tracking-[-0.035em]"><MixedText text={t('education.heading')} accent={t('education.headingAccent')} /></h2>
        <p key={`note-${i18n.resolvedLanguage}`} data-reveal="dust" className="mt-5 max-w-md font-body text-base leading-relaxed text-white/75">{t('education.mapNote')}</p>
        <p id="education-hint" className="sr-only">{t('education.interactionHint')}</p>
      </header>
      <ol className="edu-stops mt-16 grid list-none grid-cols-1 gap-y-16 p-0 md:grid-cols-3 md:gap-x-10">
        {educationInstitutions.map(({ id, constellation }) => {
          const path = 'education.institutions.' + id;
          const lit = reading === id;
          return <li key={id} ref={element => { items.current[id] = element; }} data-education-region={id} data-active={lit || undefined}
            className="edu-stop relative min-w-0 star-scrim">
            <p data-reveal="items" className="flex items-center gap-3 font-body text-sm tabular-nums text-white/70">
              <ConstellationMark id={id} />
              <span>{t(path + '.period')}</span>
              <span className="mix-em text-base">{t('education.constellationNames.' + constellation)}</span>
            </p>
            <h3 data-reveal="items" className="mt-1 font-display text-[clamp(1.2rem,2vw,1.85rem)] font-semibold leading-[1.25] tracking-[-0.03em]">
              <button type="button" data-education-item={id} aria-pressed={chosen === id} aria-describedby="education-hint" {...handlers(id)}
                className="edu-name block min-h-11 w-full py-2 text-left focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4">
                {t(path + '.name')}
              </button>
            </h3>
            <div className="edu-details"><div>
              <p key={`degree-${i18n.resolvedLanguage}`} data-reveal="dust" className="font-body text-base leading-relaxed text-white/85">{t(path + '.degree')}</p>
              <p key={`description-${i18n.resolvedLanguage}`} data-reveal="dust" className="mt-2 max-w-[44ch] font-body text-sm leading-relaxed text-white/75">{t(path + '.description')}</p>
            </div></div>
          </li>;
        })}
      </ol>
      <ConstellationCreditButton className="edu-credit mt-12 opacity-70" />
    </div>
  </section>;
}
