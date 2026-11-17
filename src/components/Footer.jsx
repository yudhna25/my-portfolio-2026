import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollSmoother } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { playRadioClick } from '@/lib/audioEngine';
import { pushMainAnchor } from '@/stores/useRouteStore';

// Contact already carries every way to reach Duy; the footer only closes the voyage.
export default function Footer() {
  const root = useRef(null);
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();

  useGSAP(() => {
    if (reducedMotion) return;
    gsap.fromTo(root.current.querySelectorAll('.footer-fade'), { y: 16, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: root.current, start: 'top 92%', once: true },
    });
  }, { scope: root, dependencies: [i18n.resolvedLanguage, reducedMotion], revertOnUpdate: true });

  const returnToFirstLight = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    playRadioClick();
    useScrollStore.getState().setStoryManual(false);
    pushMainAnchor('hero');
    const smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTop(0); else window.scrollTo(0, 0);
    if (event.detail === 0) document.getElementById('smooth-content')?.focus({ preventScroll: true });
  };

  return (
    <footer
      ref={root}
      id="site-footer"
      data-theme="dark"
      role="contentinfo"
      aria-label={t('footer.label')}
      className="relative z-10 border-t border-white/[0.08] px-6 pt-14 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-(--text-primary) sm:px-8 md:px-12 lg:pr-16 lg:pl-28"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <p className="footer-fade max-w-md font-serif text-[clamp(1.25rem,2.2vw,1.75rem)] leading-snug font-light italic">
          {t('footer.closing')}
        </p>
        <a
          href="/#hero"
          onClick={returnToFirstLight}
          className="footer-fade group inline-flex min-h-11 items-center gap-3 self-start font-body text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:self-auto"
        >
          <span aria-hidden="true" className="text-(--color-amber,#FFB25B) transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">↑</span>
          {t('works.voyageAgain')}
        </a>
      </div>

      <div className="footer-fade mx-auto mt-12 flex max-w-[1600px] flex-col gap-2 border-t border-white/[0.06] pt-6 font-body text-sm text-(--text-secondary) sm:flex-row sm:justify-between">
        <span className="text-pretty">{t('footer.copyright')}</span>
        <span>{t('footer.disciplines')}</span>
      </div>
    </footer>
  );
}
