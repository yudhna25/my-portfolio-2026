import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from '@/hooks/useGSAPSetup';
import { educationInstitutions } from '@/data/education';
import { useEducationStore, activeEducation } from '@/stores/useEducationStore';
import { useScrollStore } from '@/stores/useScrollStore';

const regions = [
  'lg:col-start-1 lg:col-span-5 lg:row-start-1',
  'lg:col-start-8 lg:col-span-5 lg:row-start-1 lg:translate-y-[18vh]',
  'lg:col-start-3 lg:col-span-5 lg:row-start-2',
];
const windows = ['w-[92%]', 'ml-auto w-[88%]', 'w-[84%] sm:ml-8'];

export default function Education({ stageRefs }) {
  const root = useRef(null);
  const pointer = useRef('');
  const { t, i18n } = useTranslation();
  const target = useEducationStore(activeEducation);
  const active = useScrollStore(state => state.storyChapter === 'education');
  const { interact, clear, setVisible } = useEducationStore.getState();

  useEffect(() => { if (!active) clear(); }, [active, clear]);

  useGSAP(() => {
    const visible = new Map();
    const sync = () => setVisible(visible.get(useEducationStore.getState().anchorId) ?? false);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.dataset.educationStage;
        visible.set(id, entry.isIntersecting);
        const state = useEducationStore.getState();
        // Keep native keyboard ownership through reflow; off-chapter cleanup still clears it.
        if (!entry.isIntersecting && state.anchorId === id && state.focus !== id) clear();
      });
      sync();
    });
    root.current.querySelectorAll('[data-education-stage]').forEach(element => observer.observe(element));
    const unsubscribe = useEducationStore.subscribe(sync);
    return () => { unsubscribe(); observer.disconnect(); setVisible(false); clear(); };
  }, { scope: root });

  useGSAP(() => { ScrollTrigger.refresh(true); }, { scope: root, dependencies: [i18n.resolvedLanguage], revertOnUpdate: true });

  return <section ref={root} id="education" lang={i18n.resolvedLanguage} aria-labelledby="education-heading"
    onKeyDownCapture={event => { pointer.current = 'keyboard'; if (event.key === 'Escape') { clear(); event.stopPropagation(); } }}
    onClick={event => { if (!event.target.closest('[data-education-item],[data-education-clear]')) clear(); }}
    className="relative isolate border-y border-white/[0.06] px-6 py-24 text-(--text-primary) sm:px-8 lg:min-h-[175vh] lg:px-12 lg:py-28">
    <div className="mx-auto max-w-7xl">
      <header className="max-w-3xl bg-linear-to-r from-(--bg-void)/90 via-(--bg-void)/70 to-transparent">
        <h2 id="education-heading" className="font-display text-[clamp(2rem,6vw,6rem)] font-bold uppercase leading-[1.2] tracking-[-0.04em]">{t('education.heading')}</h2>
        <p className="mt-5 max-w-xl font-body text-sm leading-relaxed text-white/65">{t('education.mapNote')}</p>
        <p id="education-hint" className="mt-3 max-w-xl font-mono text-xs leading-relaxed text-white/55">{t('education.interactionHint')}</p>
        <button type="button" data-education-clear onClick={clear} className="mt-3 min-h-11 px-1 font-mono text-xs text-white/65 underline decoration-white/25 underline-offset-4 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4">{t('education.clearSelection')}</button>
      </header>
      <ul className="mt-8 grid list-none grid-cols-1 gap-y-12 p-0 lg:mt-12 lg:grid-cols-12 lg:gap-x-16 lg:gap-y-10">
        {educationInstitutions.map(({ id }, index) => {
          const path = 'education.institutions.' + id;
          return <li key={id} data-education-region={id} className={'relative min-w-0 ' + regions[index]}>
            <div id={'education-stage-' + id} ref={stageRefs?.[id]} data-education-stage={id} aria-hidden="true" className={'h-[min(34vh,18rem)] min-h-56 lg:ml-0 lg:h-[31vh] lg:min-h-64 lg:w-full ' + windows[index]} />
            <div className="relative z-10 bg-linear-to-r from-(--bg-void)/90 via-(--bg-void)/70 to-transparent">
              <p className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-white/65"><span>{t(path + '.period')}</span><span className="text-white/55">{t('education.constellations.' + id)}</span></p>
              <h3 className="mt-2 font-display text-[clamp(1.2rem,2.3vw,2.25rem)] font-semibold leading-[1.3] tracking-[-0.03em]">
              <button type="button" data-education-item={id} aria-pressed={target === id} aria-controls={'education-stage-' + id} aria-describedby="education-hint"
                onPointerEnter={event => { if (event.pointerType === 'mouse') interact('hover', id); }}
                onPointerLeave={() => interact('hover', null)}
                onPointerDown={event => { pointer.current = event.pointerType; }}
                onFocus={event => { if (!['touch', 'pen'].includes(pointer.current) && event.target.matches(':focus-visible')) interact('focus', id); }}
                onBlur={() => interact('focus', null)}
                onClick={event => {
                  if (['touch', 'pen'].includes(pointer.current)) { const previous = useEducationStore.getState().selection; clear(); interact('selection', previous === id ? null : id); }
                  else if (event.detail === 0) interact('focus', id);
                  pointer.current = '';
                }}
                className={'block min-h-11 w-full py-3 text-left focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 ' + (target === id ? 'underline decoration-white/50 underline-offset-8' : '')}>
                {t(path + '.name')}
              </button>
              </h3>
              <p className="mt-1 font-body text-base leading-relaxed text-white/85">{t(path + '.degree')}</p>
              <p className="mt-2 max-w-[48ch] font-body text-sm leading-relaxed text-white/60">{t(path + '.description')}</p>
            </div>
          </li>;
        })}
      </ul>
    </div>
  </section>;
}
