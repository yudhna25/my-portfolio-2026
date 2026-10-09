import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { portalProgress, portalState, portalSmooth } from '@/3d/utils/portal';

export default function About() {
  const root = useRef(null);
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const fallback = useScrollStore(state => state.sceneFallback);
  const frozen = reduced || fallback;
  const [color, setColor] = useState(false);
  const name = t('about.heading').split(' / ');
  const bio = t('about.bioFirst');
  const split = bio.indexOf('. ') + 1 || bio.length;
  const opening = bio.slice(0, split);

  useGSAP(() => {
    const q = gsap.utils.selector(root);
    const stage = root.current;
    let active = true;
    const frames = q('[data-about-motion]');
    gsap.set([...frames, ...q('[data-about-group]')], { transform: 'none', opacity: 1 });
    const groups = q('[data-about-group]').map(node => ({ node, x: 0, y: 0,
      transform: value => { node.style.transform = value; }, opacity: gsap.quickSetter(node, 'opacity') }));
    const phase = {};
    let range = 0;
    gsap.set(stage, { autoAlpha: 0 });
    const visibility = gsap.quickSetter(stage, 'visibility');
    const shifts = frames.map(node => value => { node.style.transform = value; });
    const backdrop = gsap.quickSetter(q('[data-about-backdrop]')[0], 'opacity');
    gsap.set(stage, { opacity: 1 });
    const draw = () => {
      const state = useScrollStore.getState();
      const p = portalProgress(state.storyChapter, state.chapterProgress, frozen);
      portalState(p, phase);
      const entering = state.storyChapter === 'portal' && !frozen;
      const visible = phase.aboutOpacity > 0;
      visibility(visible ? 'visible' : 'hidden');
      stage.inert = !phase.aboutInteractive;
      stage.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (stage.inert && stage.contains(document.activeElement)) {
        document.getElementById('smooth-content')?.focus({ preventScroll: true });
      }
      // Only inner visuals move; section/marker/footprint remain in document flow.
      shifts.forEach(shift => shift(`translateY(${entering ? -(1 - p) * range : 0}px)`));
      groups.forEach((item, index) => {
        const start = [0.54, 0.60, 0.66][index], end = [0.78, 0.86, 0.94][index];
        const t = frozen ? 1 : portalSmooth(start, end, p);
        const dx = window.innerWidth * 0.5 - item.x, dy = window.innerHeight * 0.45 - item.y;
        const curve = Math.sin(t * Math.PI) * 0.12 * (1 - t);
        item.transform(`translate(${dx * (1 - t) - dy * curve}px, ${dy * (1 - t) + dx * curve}px) rotate(${(index - 1) * 12 * (1 - t)}deg) scale(${Math.max(0.015, t * (1 + 0.22 * Math.sin(t * Math.PI)))}, ${Math.max(0.015, t * t)})`);
        item.opacity(portalSmooth(start, start + 0.09, p));
      });
      backdrop(phase.aboutOpacity);
    };
    const measure = () => {
      if (!active) return;
      shifts.forEach(shift => shift('none'));
      groups.forEach(item => item.transform('none'));
      const base = stage.getBoundingClientRect();
      const content = document.getElementById('smooth-content');
      const portal = content?.querySelector('[data-story-chapter="portal"]');
      range = portal ? base.top - portal.getBoundingClientRect().top : 0;
      groups.forEach(item => { const rect = item.node.getBoundingClientRect(); item.x = rect.left + rect.width / 2; item.y = rect.top - base.top + rect.height / 2; });
      draw();
    };
    measure();
    const unsubscribe = useScrollStore.subscribe(draw);
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener('resize', measure);
    ScrollTrigger.addEventListener('refresh', measure);
    document.fonts?.ready.then(() => { if (active) measure(); });
    ScrollTrigger.refresh(true);
    return () => {
      active = false;
      unsubscribe();
      observer.disconnect();
      window.removeEventListener('resize', measure);
      ScrollTrigger.removeEventListener('refresh', measure);
    };
  }, { scope: root, dependencies: [frozen, i18n.resolvedLanguage], revertOnUpdate: true });

  return <section ref={root} id="about" aria-labelledby="about-heading" className="relative isolate min-h-screen px-6 py-28 text-(--text-primary) sm:px-8 lg:px-16 lg:py-36">
    <div data-about-motion data-about-backdrop aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_65%_62%,rgba(5,5,5,0.97)_15%,rgba(5,5,5,0.85)_42%,transparent_78%)]" />
    <div data-about-motion className="mx-auto grid max-w-7xl grid-cols-12 items-start gap-y-10 lg:gap-x-16 lg:gap-y-8">
      <header data-about-group="heading" className="col-span-12 min-w-0 lg:col-span-7 lg:col-start-6 lg:row-start-1">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-(--text-secondary)">{t('about.sectionLabel')}</p>
        <h2 key={i18n.resolvedLanguage} id="about-heading" aria-label={t('hero.name')} className="font-display text-[clamp(1.75rem,5vw,4rem)] font-bold uppercase leading-[1.18] tracking-[-0.035em]">
          <span className="sr-only">{t('hero.name')}</span>
          {name.map(line => <span key={line} aria-hidden="true" className="relative block">
            <span className="invisible block">{line}</span>
            <span data-about-decode className="absolute inset-0 overflow-clip">{line}</span>
          </span>)}
        </h2>
        <p className="mt-5 font-body text-sm text-(--text-secondary) sm:text-base">{t('about.subLabel')}</p>
      </header>

      <figure data-about-group="avatar" className="col-span-12 m-0 min-w-0 lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center">
        <button type="button" aria-label={t('about.portraitToggle')} aria-describedby="about-portrait-hint" aria-pressed={color}
          onClick={() => setColor(value => !value)} onKeyDown={event => { if (event.key === 'Escape') setColor(false); }}
          className="group relative mx-auto block w-full max-w-md cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-8">
          <img src="/avatar-cutout.webp" alt={t('about.avatarAlt')} width="800" height="1000" loading="lazy" decoding="async"
            className={`avatar-img block aspect-[4/5] h-auto w-full object-contain group-focus-visible:grayscale-0 [@media(hover:hover)]:group-hover:grayscale-0 ${color ? 'grayscale-0' : 'grayscale'}`} />
        </button>
        <p id="about-portrait-hint" className="mx-auto mt-5 max-w-md text-center font-body text-xs leading-relaxed text-(--text-secondary)">{t('about.portraitHint')}</p>
      </figure>

      <div data-about-group="bio" className="col-span-12 min-w-0 lg:col-span-7 lg:col-start-6 lg:row-start-2">
        <div className="max-w-[56ch] space-y-6 font-body text-base leading-[1.8] lg:text-lg">
          <p data-about-bio className="text-base leading-[1.8] lg:text-lg">
            <span key={i18n.resolvedLanguage} className="relative block">
              <span className="sr-only">{opening}</span>
              <span aria-hidden="true" className="invisible block">{opening}</span>
              <span aria-hidden="true" data-about-decode className="absolute inset-0 overflow-clip">{opening}</span>
            </span>{bio.slice(split)}
          </p>
          <p data-about-bio className="text-base leading-[1.8] lg:text-lg">{t('about.bioSecond')}</p>
          <blockquote data-about-bio className="pt-4 font-body text-xl font-light italic leading-relaxed text-(--text-primary) sm:text-2xl">{t('about.quote')}</blockquote>
        </div>
      </div>
    </div>
  </section>;
}
