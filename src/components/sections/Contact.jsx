import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { playRadioClick } from '@/lib/audioEngine';
import { finaleState } from '@/3d/utils/finale';

export default function Contact() {
  const root = useRef(null);
  const [transmitted, setTransmitted] = useState(false);
  const copyTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const language = i18n.resolvedLanguage;

  useGSAP(() => {
    const stage = root.current.querySelector('[data-contact-content]');
    const transition = root.current.closest('[data-story-chapter]').previousElementSibling;
    let height = transition.getBoundingClientRect().height;
    const phase = {};
    gsap.set(stage, { opacity: 0, visibility: 'hidden', y: 0 });
    const opacity = gsap.quickSetter(stage, 'opacity');
    const visibility = gsap.quickSetter(stage, 'visibility');
    const shift = gsap.quickSetter(stage, 'y', 'px');
    const draw = () => {
      const state = useScrollStore.getState();
      const ending = state.storyChapter === 'finale';
      const reading = state.storyChapter === 'contact';
      finaleState(reducedMotion || reading ? 1 : state.chapterProgress, phase);
      const alpha = reading ? 1 : ending ? phase.contact : 0;
      opacity(alpha);
      visibility(alpha > 0 ? 'visible' : 'hidden');
      shift(ending ? -(1 - state.chapterProgress) * height : 0);
      stage.inert = !reading;
    };
    const observer = new ResizeObserver(() => { height = transition.getBoundingClientRect().height; draw(); });
    observer.observe(transition);
    const unsubscribe = useScrollStore.subscribe(draw);
    draw();
    return () => { observer.disconnect(); unsubscribe(); };
  }, { scope: root, dependencies: [reducedMotion, language], revertOnUpdate: true });

  const handleTransmit = async () => {
    playRadioClick();
    let ok = false;
    try {
      if (navigator.clipboard) { await navigator.clipboard.writeText(t('contact.email')); ok = true; }
    } catch {
      // Strict browsers can refuse clipboard access; say so instead of pretending it worked.
    }
    setTransmitted(ok ? 'copied' : 'failed');
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setTransmitted(false), ok ? 3500 : 6000);
  };

  const linkStyle = 'inline-flex min-h-11 items-center py-2 text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white';

  return (
    <section
      ref={root}
      id="transmission"
      lang={language}
      data-theme="dark"
      aria-labelledby="transmission-heading"
      className="relative px-6 py-24 text-(--text-primary) sm:px-8 lg:px-12 lg:py-36"
    >
      <div data-contact-content className="invisible mx-auto max-w-7xl bg-[radial-gradient(ellipse_70%_80%_at_22%_45%,rgba(7,8,13,0.6),rgba(7,8,13,0.25)_55%,transparent_80%)] p-5 sm:p-8 lg:p-12">
        <p data-contact-copy lang="en" className="mb-10 flex items-center gap-4 font-mono text-sm tracking-[0.2em] text-(--text-primary)">
          <span aria-hidden="true" className="h-px w-10 bg-white/30" />
          {t('contact.sectionLabel')}
        </p>
        <h2 key={language} aria-label={`${t('contact.heading')} ${t('contact.alternateHeading')}`} id="transmission-heading" className="[text-shadow:0_2px_30px_rgba(7,8,13,0.85)] font-display text-[clamp(1.15rem,6vw,7rem)] font-bold leading-[1.25] tracking-[-0.045em]">
          <span className="block overflow-clip">
            <span data-contact-line className="split-heading block whitespace-nowrap">{t('contact.heading')}</span>
          </span>
          <span className="block overflow-clip">
            <span data-contact-line lang={language === 'vi' ? 'en' : 'vi'} className="split-heading block whitespace-nowrap">{t('contact.alternateHeading')}</span>
          </span>
        </h2>
        <p data-contact-copy className="mt-8 max-w-xl font-body text-lg leading-relaxed text-(--text-primary) sm:text-xl">
          {t('contact.subHeading')}
        </p>

        {/* The address is the signal itself: set in the serif voice, no console around it. */}
        <div data-contact-copy className="mt-12 flex flex-col items-start gap-3 sm:mt-16">
          <a
            data-contact-email
            href={t('contact.emailUrl')}
            onClick={playRadioClick}
            className="group inline-flex min-h-11 max-w-full items-baseline gap-4 font-serif text-[clamp(1.5rem,4.4vw,3.75rem)] [overflow-wrap:normal] leading-[1.1] font-light text-(--text-primary) italic [text-shadow:0_2px_30px_rgba(7,8,13,0.85)] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-white"
          >
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-bottom-left bg-no-repeat pb-1 transition-[background-size] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-[length:100%_1px] group-focus-visible:bg-[length:100%_1px]">{(([user, domain]) => <>{user}@<wbr />{domain}</>)(t('contact.email').split('@'))}</span>
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className="size-[0.6em] shrink-0 translate-y-[0.05em] stroke-(--color-amber,#FFB25B) stroke-[1.25] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:-translate-y-1">
              <path d="M5 19 19 5M7 5h12v12" />
            </svg>
          </a>
          <button
            type="button"
            onClick={handleTransmit}
            className="inline-flex min-h-11 items-center gap-2 font-body text-sm text-(--text-secondary) underline decoration-white/25 underline-offset-4 transition-colors hover:text-(--text-primary) hover:decoration-(--color-amber,#FFB25B) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {transmitted === 'copied' ? t('contact.copied') : t('contact.copyAddress')}
          </button>
          <p role="status" aria-live="polite" className={transmitted === 'failed' ? 'max-w-md font-body text-sm text-(--text-secondary)' : 'sr-only'}>
            {transmitted === 'copied' ? t('contact.copied') : transmitted === 'failed' ? t('contact.copyFailed') : ''}
          </p>
        </div>

        <div data-contact-copy className="mt-16 flex flex-row flex-wrap items-center gap-x-8 gap-y-2 border-t border-(--bg-elevated) py-6 font-body text-sm sm:gap-x-10 lg:mt-24">
          {['facebook', 'linkedin', 'behance'].map((social) => t(`contact.${social}Url`) ? (
            <a key={social} href={t(`contact.${social}Url`)} target="_blank" rel="noopener noreferrer" aria-label={`${t(`contact.${social}Label`)} (${t('common.opensInNewTab')})`} className={linkStyle}>
              {t(`contact.${social}Label`)}
            </a>
          ) : null)}
          <a href={`tel:${t('contact.phone').replace(/\s/g, '')}`} className={`${linkStyle} tabular-nums`}>{t('contact.phone')}</a>
        </div>
      </div>
    </section>
  );
}
