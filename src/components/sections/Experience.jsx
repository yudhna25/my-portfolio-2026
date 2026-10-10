import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { createMeteorLayout, meteorEmphasis, meteorWake } from '@/3d/utils/storyMeteor';
import { PORTFOLIO_DATA } from '@/data';

const placement = ['lg:col-start-1', 'lg:col-start-5', 'lg:col-start-8'];

export default function Experience({ onLayout }) {
  const root = useRef(null);
  const layoutRef = useRef(null);
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();

  useGSAP(() => {
    const layout = layoutRef.current ??= createMeteorLayout();
    const section = root.current;
    const labels = [...section.querySelectorAll('[data-meteor-label]')];
    const setters = labels.map(label => gsap.quickSetter(label, 'opacity'));
    const wakes = [...section.querySelectorAll('[data-meteor-wake]')];
    const wakeSetters = wakes.map(wake => gsap.quickSetter(wake, 'opacity'));
    const draw = () => {
      const state = useScrollStore.getState();
      labels.forEach((label, i) => {
        const strength = state.storyChapter === 'experience' ? meteorEmphasis(layout, i, state.chapterProgress) : 0;
        setters[i](reduced ? 1 : 0.72 + strength * 0.28);
        wakeSetters[i](!reduced && !document.hidden && state.storyChapter === 'experience' ? meteorWake(layout, i, state.chapterProgress) : 0);
        label.dataset.active = strength > 0.5 ? 'true' : 'false';
      });
    };
    const measure = () => {
      const rect = section.getBoundingClientRect();
      const departure = section.querySelector('[data-story-chapter="departure"]').getBoundingClientRect();
      const width = window.innerWidth, height = window.innerHeight;
      layout.width = width; layout.height = height;
      layout.range = departure.top - rect.top;
      const points = layout.points;
      points[0] = -0.22; points[1] = 0.22 * height;
      labels.forEach((label, i) => {
        const box = label.getBoundingClientRect();
        const y = box.top - rect.top - 24;
        points[(i + 1) * 2] = (box.left + box.width * (i === 1 ? 0.72 : 0.35)) / width;
        points[(i + 1) * 2 + 1] = y;
        layout.milestones[i] = y;
      });
      points[8] = 0.62; points[9] = layout.range + height * 0.5;
      onLayout(layout);
      draw();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', draw);
    ScrollTrigger.addEventListener('refresh', measure);
    const unsubscribe = useScrollStore.subscribe(draw);
    ScrollTrigger.refresh(true);
    return () => {
      observer.disconnect(); unsubscribe();
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', draw);
      ScrollTrigger.removeEventListener('refresh', measure);
      gsap.set(labels, { clearProps: 'opacity' });
      gsap.set(wakes, { clearProps: 'opacity' });
    };
  }, { scope: root, dependencies: [reduced, i18n.resolvedLanguage, onLayout], revertOnUpdate: true });

  return <section ref={root} id="experience" lang={i18n.resolvedLanguage} data-theme="dark" aria-labelledby="experience-heading" className="relative px-6 pt-24 text-(--text-primary) sm:px-8 lg:px-12">
    <div className="mx-auto max-w-7xl">
      <header className="mb-24 max-w-4xl lg:mb-32">
        <p lang="en" className="mb-5 font-mono text-xs tracking-[0.2em] text-(--text-secondary)">{t('experience.sectionLabel')}</p>
        <h2 id="experience-heading" className="font-display text-[clamp(1.75rem,4.5vw,4rem)] font-bold uppercase leading-[1.2] tracking-[-0.035em]">{t('experience.heading')}</h2>
      </header>
      <ul className="m-0 list-none space-y-[18vh] p-0 pb-[50vh] lg:space-y-[12vh]">
        {PORTFOLIO_DATA.experience.map(({ id }, index) => {
          const position = t(`experience.positions.${id}`, { returnObjects: true });
          return <li key={id} data-experience-item={id} className="grid grid-cols-1 lg:grid-cols-12">
            <article aria-labelledby={`experience-${id}`} className={`relative min-w-0 lg:col-span-5 ${placement[index]}`}>
              <span data-meteor-wake aria-hidden="true" className={`pointer-events-none absolute -top-10 h-20 w-40 -translate-x-1/2 opacity-0 [background:radial-gradient(ellipse_at_50%_40%,rgb(250_250_250/0.14),rgb(155_220_232/0.07)_35%,transparent_72%)] ${index === 1 ? 'left-[72%]' : 'left-[35%]'}`}>
                <span className="absolute inset-x-6 top-4 h-px bg-linear-to-r from-transparent via-white/70 to-transparent" />
              </span>
              <div data-meteor-label>
                <h3 id={`experience-${id}`} className="font-display text-[clamp(1.25rem,2.2vw,2rem)] font-semibold leading-tight tracking-[-0.035em] [overflow-wrap:anywhere]">{position.company}</h3>
                <p lang="en" className="mt-3 font-mono text-sm leading-relaxed">{position.role}</p>
              </div>
              <p className="mt-5 font-mono text-xs leading-relaxed text-white/65">{position.period}<span aria-hidden="true"> · </span><span lang="en">{position.type}</span></p>
              <p className="mt-6 max-w-[48ch] font-body text-base leading-[1.8] text-white/80">{position.description}</p>
            </article>
          </li>;
        })}
      </ul>
    </div>
    <div data-story-chapter="departure" aria-hidden="true" className="h-[110vh] motion-reduce:h-[20vh]" />
  </section>;
}
