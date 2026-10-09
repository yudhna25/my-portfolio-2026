import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { useTranslation } from 'react-i18next';
import { gsap, ScrollTrigger, ScrollSmoother } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { navigationSections } from '@/data/navigation';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { playRadioClick } from '@/lib/audioEngine';
import { navigateRoute, pushMainAnchor } from '@/stores/useRouteStore';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4';

export function Nav({ onMenuClick, menuOpen = false, reader = false }) {
  const { t } = useTranslation();
  const currentSection = useScrollStore((state) => state.currentSection);
  const reducedMotion = useReducedMotion();
  const root = useRef(null);
  const scrollTween = useRef(null);
  const focusFrame = useRef(null);

  const { contextSafe } = useGSAP(() => {
    const bar = root.current.querySelector('nav');
    gsap.set(bar, { yPercent: 0 });
    if (reducedMotion || reader) return () => { scrollTween.current?.kill(); cancelAnimationFrame(focusFrame.current); };

    const hide = gsap.to(bar, {
      yPercent: -100,
      duration: 0.35,
      ease: 'power2.out',
      paused: true,
    });

    ScrollTrigger.create({
      id: 'stellar-nav-auto-hide',
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const keepVisible = self.scroll() <= 80 || self.direction < 0 || bar.querySelector(':focus-visible');
        if (keepVisible) hide.reverse();
        else hide.play();
      },
    });

    // Keyboard users must never have to wait for an off-screen control.
    const revealOnFocus = (event) => {
      if (event.target.matches(':focus-visible')) hide.reverse().pause(0);
    };
    bar.addEventListener('focusin', revealOnFocus);
    return () => {
      scrollTween.current?.kill();
      cancelAnimationFrame(focusFrame.current);
      bar.removeEventListener('focusin', revealOnFocus);
    };
  }, { scope: root, dependencies: [reducedMotion, reader], revertOnUpdate: true });

  function navigate(event, id) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (reader && id !== 'edura-main') { navigateRoute(event, `/#${id}`); return; }
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    contextSafe(() => {
      scrollTween.current?.kill();
      cancelAnimationFrame(focusFrame.current);
      const home = id === 'hero' || id === 'smooth-content';
      const storyTarget = target.closest('[data-story-chapter]') || target.querySelector('[data-story-chapter]');
      const offset = home || storyTarget ? 0 : root.current.querySelector('nav').offsetHeight + 8;
      const smoother = ScrollSmoother.get();
      // Numeric coordinates avoid transformed DOM offsets inside ScrollSmoother.
      const targetY = home ? 0 : smoother
        ? smoother.offset(target, 'top top') - offset
        : target.getBoundingClientRect().top + window.scrollY - offset;
      if (storyTarget || event.detail === 0) {
        useScrollStore.getState().setStoryManual(false);
        if (storyTarget && id !== 'smooth-content' && location.hash !== `#${id}`) pushMainAnchor(id);
        const y = gsap.utils.clamp(0, ScrollTrigger.maxScroll(window), targetY);
        if (smoother) smoother.scrollTop(y);
        else window.scrollTo(0, y);
        if (event.detail === 0) {
          target.setAttribute('tabindex', '-1');
          if (storyTarget) focusFrame.current = requestAnimationFrame(() => { if (target.isConnected) target.focus({ preventScroll: true }); });
          else target.focus({ preventScroll: true });
        }
        return;
      }
      scrollTween.current = gsap.to(window, {
        duration: reducedMotion ? 0 : 1,
        ease: 'power3.inOut',
        scrollTo: {
          y: gsap.utils.clamp(0, ScrollTrigger.maxScroll(window), targetY),
          autoKill: true,
        },
        overwrite: 'auto',
      });
      if (id === 'smooth-content') target.focus({ preventScroll: true });
    })();
  }

  return (
    <header ref={root}>
      <a
        href={reader ? '#edura-main' : '#smooth-content'}
        onClick={(event) => navigate(event, reader ? 'edura-main' : 'smooth-content')}
        className={`fixed left-[max(1.5rem,env(safe-area-inset-left))] top-[calc(0.75rem+env(safe-area-inset-top))] z-[10000] -translate-y-[150%] border border-white bg-(--bg-void) px-4 py-3 font-body text-sm text-white focus-visible:translate-y-0 ${focusRing}`}
      >
        {t(reader ? 'edura.skip' : 'nav.skip')}
      </a>
      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 top-0 z-[70] flex h-[calc(4.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-white/[0.08] bg-(--bg-void) gap-3 px-[max(1.5rem,env(safe-area-inset-left),env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] font-body lg:px-[max(2rem,env(safe-area-inset-left),env(safe-area-inset-right))]"
      >
        <a
          href="/#hero"
          aria-label={t('nav.homeLabel')}
          aria-current={!reader && currentSection === 'hero' ? 'location' : undefined}
          onClick={(event) => navigate(event, 'hero')}
          className={`inline-flex min-h-11 min-w-11 shrink-0 items-center font-display text-lg font-bold tracking-tight text-white ${focusRing}`}
        >
          {t('nav.logo')}
        </a>
        <ul className="hidden items-center gap-4 xl:flex 2xl:gap-6">
          {navigationSections.filter(({ id }) => id !== 'hero').map(({ id, key }) => {
            const active = !reader && currentSection === id;
            return (
              <li key={id}>
                <a
                  href={`/#${id}`}
                  aria-current={active ? 'location' : undefined}
                  onClick={(event) => navigate(event, id)}
                  className={`inline-flex min-h-11 min-w-11 items-center whitespace-nowrap text-sm uppercase tracking-[0.08em] underline-offset-8 decoration-1 ${active ? 'text-white underline' : 'text-(--text-secondary)'} hover:text-white ${focusRing}`}
                >
                  {t(`nav.${key}`)}
                </a>
              </li>
            );
          })}
        </ul>
        <div className="flex shrink-0 items-center gap-2">
          <SoundToggle />
          <button
            type="button"
            onClick={(event) => { if (onMenuClick) { playRadioClick(); onMenuClick(event); } }}
            aria-label={t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="stellar-menu"
            aria-haspopup="dialog"
            aria-disabled={!onMenuClick || undefined}
            title={!onMenuClick ? t('nav.menuPending') : undefined}
            className={`border border-white/20 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm uppercase tracking-[0.08em] text-white hover:border-[#FAFAFA]/60 hover:text-[#FAFAFA] ${focusRing}`}
          >
            <span className="hidden lg:inline">{t('nav.menuLabel')}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">
              <path d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}
