import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, revealHeadings } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSkillsStore, activeSkill } from '@/stores/useSkillsStore';
import { useScrollStore } from '@/stores/useScrollStore';
import { skillTools, appliedSkills, commonSkills, technicalSkills } from '@/data/skills';

export default function Skills({ stageRef }) {
  const root = useRef(null);
  const region = useRef(null);
  const localStage = useRef(null);
  const pointer = useRef('');
  const anchor = stageRef ?? localStage;
  const reduced = useReducedMotion();
  const { t, i18n } = useTranslation();
  const target = useSkillsStore(activeSkill);
  const { interact, clear, setVisible } = useSkillsStore.getState();
  const active = useScrollStore((state) => state.storyChapter === 'skills');
  const tool = skillTools.find((item) => item.id === target);

  useEffect(() => {
    if (!active) clear();
    return clear;
  }, [active, clear]);

  useGSAP(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (!entry.isIntersecting) clear();
    });
    observer.observe(anchor.current);
    return () => { observer.disconnect(); setVisible(false); clear(); };
  }, { scope: root, dependencies: [anchor], revertOnUpdate: true });

  useGSAP((context, contextSafe) => {
    if (!reduced) revealHeadings(root.current.querySelectorAll('h2,h3'), contextSafe);
    ScrollTrigger.refresh(true);
  }, { scope: root, dependencies: [reduced, i18n.resolvedLanguage], revertOnUpdate: true });

  useGSAP(() => {
    if (!tool) return;
    const area = region.current;
    const svg = area.querySelector('svg');
    const paths = [...svg.querySelectorAll('path')];
    const measure = () => {
      const box = area.getBoundingClientRect();
      const start = area.querySelector('[data-skill-tool="' + tool.id + '"]').getBoundingClientRect();
      const stage = anchor.current.getBoundingClientRect();
      const x = start.right - box.left, y = start.top + start.height / 2 - box.top;
      const cx = stage.left + stage.width / 2 - box.left, cy = stage.top + stage.height / 2 - box.top;
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
      // Keep narrow mobile routes off the always-readable labels.
      svg.querySelectorAll('[data-skill-mask]').forEach((rect) => {
        const label = area.querySelector(rect.dataset.skillMask).getBoundingClientRect();
        rect.setAttribute('x', label.left - box.left - 4);
        rect.setAttribute('y', label.top - box.top - 2);
        rect.setAttribute('width', label.width + 8);
        rect.setAttribute('height', label.height + 4);
      });
      paths.forEach((path) => {
        const end = area.querySelector('[data-skill-ability="' + path.dataset.skillConnection + '"]').getBoundingClientRect();
        const ex = end.left - box.left, ey = end.top + end.height / 2 - box.top;
        path.setAttribute('d', 'M ' + x + ',' + y + ' C ' + (x + cx) / 2 + ',' + y + ' ' + (x + cx) / 2 + ',' + cy + ' ' + cx + ',' + cy + ' C ' + (cx + ex) / 2 + ',' + cy + ' ' + (cx + ex) / 2 + ',' + ey + ' ' + ex + ',' + ey);
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    observer.observe(anchor.current);
    ScrollTrigger.addEventListener('refresh', measure);
    const tween = reduced ? null : gsap.fromTo(paths, { opacity: 0 }, {
      opacity: 0.55, duration: 0.45, delay: 1.05, stagger: 0.07, ease: 'power3.out',
    });
    if (reduced) gsap.set(paths, { opacity: 0.55 });
    const visibility = () => tween?.paused(document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      observer.disconnect();
      ScrollTrigger.removeEventListener('refresh', measure);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, { scope: root, dependencies: [target, reduced, i18n.resolvedLanguage], revertOnUpdate: true });

  return (
    <section ref={root} id="skills" lang={i18n.resolvedLanguage} data-theme="dark" aria-labelledby="skills-heading"
      onKeyDownCapture={(event) => {
        pointer.current = 'keyboard';
        if (event.key === 'Escape') { clear(); event.stopPropagation(); }
      }}
      onClick={(event) => { if (!event.target.closest('[data-skill-tool],[data-skill-clear]')) clear(); }}
      className="relative border-y border-white/[0.06] px-6 py-20 text-(--text-primary) sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 lg:mb-14">
          <h2 key={i18n.resolvedLanguage} aria-label={t('skills.heading')} id="skills-heading" className="split-heading font-display text-[clamp(2rem,6vw,6rem)] font-bold uppercase leading-[1.2] tracking-[-0.04em]">{t('skills.heading')}</h2>
          <p className="mt-5 max-w-2xl font-mono text-xs leading-relaxed text-white/55">{t('skills.interactionHint')}</p>
        </header>
        <div ref={region} className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,1fr)] lg:gap-8">
          <div className="relative z-10 order-2 min-w-0 md:order-1">
            <h3 className="mb-5 font-mono text-xs uppercase tracking-widest text-white/55">{t('skills.toolsLabel')}</h3>
            <ul className="grid grid-cols-2 gap-x-5 md:grid-cols-1">
              {skillTools.map(({ id }) => (
                <li key={id} className="min-w-0">
                  <button type="button" data-skill-tool={id} aria-pressed={target === id} aria-controls="skills-stage"
                    onPointerEnter={(event) => { if (event.pointerType === 'mouse') interact('hover', id); }}
                    onPointerLeave={() => interact('hover', null)}
                    onPointerDown={(event) => { pointer.current = event.pointerType; }}
                    onFocus={(event) => {
                      if (!['touch', 'pen'].includes(pointer.current) && event.target.matches(':focus-visible')) interact('focus', id);
                    }}
                    onBlur={() => interact('focus', null)}
                    onClick={(event) => {
                      if (['touch', 'pen'].includes(pointer.current)) {
                        const previous = useSkillsStore.getState().selection;
                        clear();
                        interact('selection', previous === id ? null : id);
                      } else if (event.detail === 0) interact('focus', id);
                      pointer.current = '';
                    }}
                    className="flex min-h-11 w-full items-center gap-3 border-b border-white/10 py-3 text-left font-body text-sm leading-snug transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 md:text-base">
                    <span aria-hidden="true" className={'h-1 w-1 shrink-0 rounded-full ' + (target === id ? 'bg-white' : 'bg-white/25')} />
                    <span className={target === id ? 'text-white' : 'text-white/65'}>{t('skills.toolNames.' + id)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <figure id="skills-stage" aria-label={t('skills.stageLabel')} className="relative order-1 h-[min(40vh,22rem)] min-h-64 min-w-0 md:order-2 md:h-full md:min-h-104">
            <div ref={anchor} data-skills-stage className="absolute inset-x-0 bottom-12 top-11" />
            <button type="button" data-skill-clear onClick={clear} className="absolute right-0 top-0 z-20 min-h-11 px-2 font-mono text-[10px] uppercase tracking-wider text-white/55 underline decoration-white/20 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4">{t('skills.clearSelection')}</button>
            <figcaption role="status" aria-live="polite" className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-64 text-center font-mono text-[10px] leading-relaxed text-white/55">
              {tool ? t('skills.activeTool', { tool: t('skills.toolNames.' + tool.id) }) : t('skills.idleStage')}
              {target === 'ai' && <span className="mt-2 block">{t('skills.aiMembers')}</span>}
            </figcaption>
          </figure>
          <div className="relative z-10 order-3 min-w-0 bg-linear-to-r from-(--bg-void)/90 via-(--bg-void)/80 to-transparent">
            <h3 className="mb-5 font-mono text-xs uppercase tracking-widest text-white/55">{t('skills.competenciesLabel')}</h3>
            <ul className="grid grid-cols-2 gap-x-5 md:grid-cols-1">
              {appliedSkills.map((id) => (
                <li key={id} data-skill-ability={id} data-linked={tool?.competencies.includes(id) ? 'true' : 'false'} className={'flex min-h-9 items-center gap-3 py-2 font-body text-sm leading-snug transition-colors md:text-base ' + (tool?.competencies.includes(id) ? 'text-white' : 'text-white/55')}>
                  <span aria-hidden="true" className={'h-1 w-1 shrink-0 rounded-full ' + (tool?.competencies.includes(id) ? 'bg-white' : 'bg-white/20')} />
                  <span>{t('skills.abilityNames.' + id)}</span>
                </li>
              ))}
            </ul>
          </div>
          <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible fill-none stroke-white/70 stroke-1">
            <defs><mask id="skills-connection-mask" maskUnits="userSpaceOnUse">
              <rect width="100%" height="100%" fill="white" stroke="none" />
              {skillTools.map(({ id }) => <rect key={id} data-skill-mask={'[data-skill-tool="' + id + '"] > span:last-child'} fill="black" stroke="none" />)}
              {appliedSkills.map((id) => <rect key={id} data-skill-mask={'[data-skill-ability="' + id + '"] > span:last-child'} fill="black" stroke="none" />)}
            </mask></defs>
            {tool?.competencies.map((id) => <path key={id} data-skill-connection={id} mask="url(#skills-connection-mask)" opacity="0" vectorEffect="non-scaling-stroke" />)}
          </svg>
        </div>
        <div className="mt-12 grid gap-8 border-t border-white/10 pt-8 md:grid-cols-[2fr_1fr] lg:mt-16">
          <div>
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-white/55">{t('skills.commonLabel')}</h3>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 font-body text-sm text-white/65">
              {commonSkills.map((id) => <li key={id}>{t('skills.abilityNames.' + id)}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-white/55">{t('skills.technicalLabel')}</h3>
            <ul className="space-y-3 font-mono text-xs leading-relaxed text-white/65">
              {technicalSkills.map((id) => <li key={id}>{t('skills.technicalNames.' + id)}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

