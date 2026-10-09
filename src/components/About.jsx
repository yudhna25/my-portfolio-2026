import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';

export default function About() {
  const root = useRef(null);
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const [color, setColor] = useState(false);
  const name = t('about.heading').split(' / ');
  const bio = t('about.bioFirst');
  const split = bio.indexOf('. ') + 1 || bio.length;
  const opening = bio.slice(0, split);

  useGSAP(() => {
    ScrollTrigger.refresh(true);
    if (reduced) return;
    const q = gsap.utils.selector(root);
    const decode = q('[data-about-decode]');
    const text = decode.map(element => element.textContent);
    const reveal = gsap.timeline({ id: 'about-introduction', paused: true });
    decode.forEach((element, index) => reveal.to(element, {
      duration: 0.9, scrambleText: { text: text[index], chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', tweenLength: false, revealDelay: 0.1 },
    }, 0));
    reveal.fromTo(q('[data-about-bio]'), { y: 8, opacity: 0.8 }, {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.16, ease: 'power3.out',
    }, 0);
    let active;
    const sync = () => {
      const visible = !document.hidden && useScrollStore.getState().storyChapter === 'about';
      if (active === visible) return;
      active = visible;
      if (visible) reveal.play(); else reveal.pause();
    };
    sync();
    const unsubscribe = useScrollStore.subscribe(sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', sync);
      decode.forEach((element, index) => { element.textContent = text[index]; });
    };
  }, { scope: root, dependencies: [reduced, i18n.resolvedLanguage], revertOnUpdate: true });

  return <section ref={root} id="about" aria-labelledby="about-heading" className="relative isolate min-h-screen px-6 py-28 text-(--text-primary) sm:px-8 lg:px-16 lg:py-36">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_65%_62%,rgba(5,5,5,0.97)_15%,rgba(5,5,5,0.85)_42%,transparent_78%)]" />
    <div className="mx-auto grid max-w-7xl grid-cols-12 items-start gap-y-10 lg:gap-x-16 lg:gap-y-8">
      <header className="col-span-12 min-w-0 lg:col-span-7 lg:col-start-6 lg:row-start-1">
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

      <figure className="col-span-12 m-0 min-w-0 lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center">
        <button type="button" aria-label={t('about.portraitToggle')} aria-describedby="about-portrait-hint" aria-pressed={color}
          onClick={() => setColor(value => !value)} onKeyDown={event => { if (event.key === 'Escape') setColor(false); }}
          className="group relative mx-auto block w-full max-w-md cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-8">
          <img src="/avatar-cutout.webp" alt={t('about.avatarAlt')} width="800" height="1000" loading="lazy" decoding="async"
            className={`avatar-img block aspect-[4/5] h-auto w-full object-contain group-focus-visible:grayscale-0 [@media(hover:hover)]:group-hover:grayscale-0 ${color ? 'grayscale-0' : 'grayscale'}`} />
        </button>
        <p id="about-portrait-hint" className="mx-auto mt-5 max-w-md text-center font-body text-xs leading-relaxed text-(--text-secondary)">{t('about.portraitHint')}</p>
      </figure>

      <div className="col-span-12 min-w-0 lg:col-span-7 lg:col-start-6 lg:row-start-2">
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
