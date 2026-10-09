import { useLayoutEffect, useRef } from 'react';

import { useGSAP } from '@gsap/react';

import { useTranslation } from 'react-i18next';

import { gsap, revealHeadings, ScrollSmoother, ScrollTrigger } from '@/hooks/useGSAPSetup';

import { useReducedMotion } from '@/hooks/useReducedMotion';

import { useLangStore } from '@/stores/useLangStore';
import { useScrollStore } from '@/stores/useScrollStore';

import { navigationSections } from '@/data/navigation';
import { navigateRoute, pushMainAnchor } from '@/stores/useRouteStore';

import '@/styles/menu.css';



const focusRing = 'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4';



export function MenuOverlay({ open, onClose, reader = false }) {

  const { t, i18n } = useTranslation();

  const lang = useLangStore((state) => state.lang);

  const setLang = useLangStore((state) => state.setLang);

  const reducedMotion = useReducedMotion();

  const dialog = useRef(null);

  const timeline = useRef(null);

  const finish = useRef(null);

  const session = useRef({ locked: false, target: null, reduced: false });



  useGSAP((context, contextSafe) => {

    const panel = dialog.current;

    const state = session.current;



    function releaseScroll() {

      if (!state.locked) return;

      if (!state.hadLock) document.documentElement.classList.remove('stellar-menu-open');

      if (state.smoother && state.smoother === ScrollSmoother.get()) {

        state.smoother.paused(state.wasPaused);

      }

      state.locked = false;

      state.smoother = null;

    }



    finish.current = contextSafe(() => {

      if (!panel.open) return;

      panel.close();

      releaseScroll();

      const target = state.target && document.getElementById(state.target);

      state.target = null;

      if (!target) {

        state.trigger?.focus({ preventScroll: true });

        return;

      }



      const storyTarget = target.closest('[data-story-chapter]') || target.querySelector('[data-story-chapter]');
      const offset = target.id === 'hero' || storyTarget ? 0 : (document.querySelector('nav[aria-label]')?.offsetHeight ?? 72) + 8;

      const smoother = ScrollSmoother.get();

      const y = smoother

        ? smoother.offset(target, 'top top') - offset

        : target.getBoundingClientRect().top + window.scrollY - offset;

      if (storyTarget || state.keyboard) {
        useScrollStore.getState().setStoryManual(false);
        if (storyTarget && location.hash !== `#${target.id}`) pushMainAnchor(target.id);

        const destination = gsap.utils.clamp(0, ScrollTrigger.maxScroll(window), y);

        if (smoother) smoother.scrollTop(destination);

        else window.scrollTo(0, destination);

        target.setAttribute('tabindex', '-1');

        if (storyTarget) {
          cancelAnimationFrame(state.focusFrame);
          state.focusFrame = requestAnimationFrame(() => { if (target.isConnected) target.focus({ preventScroll: true }); });
        } else target.focus({ preventScroll: true });

        return;

      }

      state.scrollTween = gsap.to(window, {

        duration: state.reduced ? 0 : 1,

        ease: 'power3.inOut',

        scrollTo: { y: gsap.utils.clamp(0, ScrollTrigger.maxScroll(window), y), autoKill: true },

        overwrite: 'auto',

      });

    });



    timeline.current = gsap.timeline({

      paused: true,

      defaults: { duration: 0.7, ease: 'expo.inOut' },

      onReverseComplete: () => finish.current(),

    })

      .fromTo(panel, { clipPath: 'inset(0% 0% 100% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)

      .fromTo(panel.querySelector('[data-menu-depth]'),

        { z: -60, opacity: 0 }, { z: 0, opacity: 1, force3D: true }, 0);



    return () => {

      state.target = null;

      state.scrollTween?.kill();
      cancelAnimationFrame(state.focusFrame);

      releaseScroll();

      if (panel.open) {

        panel.close();

        state.trigger?.focus({ preventScroll: true });

      }

    };

  }, { scope: dialog });



  // Control the owned timeline outside a second GSAP context (instant reduced-motion close).

  useLayoutEffect(() => {

    const panel = dialog.current;

    const state = session.current;

    state.reduced = reducedMotion;

    if (reducedMotion) state.scrollTween?.kill();



    function pauseScroll() {

      const smoother = ScrollSmoother.get();

      if (smoother && state.smoother !== smoother) {

        state.smoother = smoother;

        state.wasPaused = smoother.paused();

      }

      smoother?.paused(true);

    }



    if (open) {

      state.target = null;

      if (!panel.open) {

        state.trigger = document.activeElement;

        state.keyboard = state.trigger?.matches(':focus-visible');

        state.scrollTween?.kill();

        state.hadLock = document.documentElement.classList.contains('stellar-menu-open');

        document.documentElement.classList.add('stellar-menu-open');

        state.locked = true;

        pauseScroll();

        panel.showModal();

      }

      pauseScroll();

      if (reducedMotion || state.keyboard) timeline.current.progress(1, true).pause();

      else timeline.current.play();

      // A live OS preference change can replace the smoother in the parent hook.

      const frame = requestAnimationFrame(pauseScroll);

      return () => cancelAnimationFrame(frame);

    }



    if (panel.open) {

      if (reducedMotion || state.keyboard || timeline.current.progress() === 0) {

        timeline.current.progress(0, true).pause();

        finish.current();

      } else timeline.current.reverse();

    }

  }, [open, reducedMotion]);



  useGSAP((context, contextSafe) => {

    if (open && !reducedMotion) revealHeadings(dialog.current.querySelectorAll('h2'), contextSafe, false);

  }, { scope: dialog, dependencies: [open, reducedMotion, i18n.resolvedLanguage], revertOnUpdate: true });



  function navigate(event, id) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (reader) { session.current.trigger = null; onClose(); navigateRoute(event, `/#${id}`); return; }

    event.preventDefault();

    if (!document.getElementById(id)) return;

    session.current.target = id;

    onClose();

  }



  function trapFocus(event) {

    session.current.keyboard = true;

    if (event.key !== 'Tab') return;

    const controls = Array.from(event.currentTarget.querySelectorAll('a[href], button:not([disabled])'))

      .filter((element) => element.tabIndex >= 0 && element.getAttribute('aria-disabled') !== 'true');

    const first = controls[0];

    const last = controls.at(-1);

    if (event.shiftKey && document.activeElement === first) {

      event.preventDefault();

      last?.focus();

    } else if (!event.shiftKey && document.activeElement === last) {

      event.preventDefault();

      first?.focus();

    }

  }



  return (

    <dialog

      ref={dialog}

      id="stellar-menu"

      onKeyDown={trapFocus}

      onFocus={(event) => event.stopPropagation()}

      aria-labelledby="stellar-menu-title"

      onCancel={(event) => {

        event.preventDefault();

        timeline.current.progress(0, true).pause();

        finish.current();

        onClose();

      }}

      onClick={(event) => { if (!event.target.closest('a, button')) onClose(); }}

      className="fixed inset-0 z-40 m-0 h-dvh max-h-none w-full max-w-none overflow-clip border-0 bg-(--bg-void) p-0 text-(--text-primary) [perspective:1000px] [&::backdrop]:bg-transparent"

    >

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid grid-cols-[repeat(24,minmax(0,1fr))]">

        {Array.from({ length: 24 }, (_, column) => (

          <span key={column} className="border-l border-white/[0.04] last:border-r" />

        ))}

      </div>

      <div data-menu-depth className="relative flex h-full flex-col">

        <header className="flex h-[calc(4.5rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-white/[0.08] px-[max(1.5rem,env(safe-area-inset-left),env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] lg:px-[max(2rem,env(safe-area-inset-left),env(safe-area-inset-right))]">

          <span className="font-display text-lg font-bold tracking-tight">{t('nav.logo')}</span>

          <button

            type="button"

            onClick={onClose}

            aria-label={t('nav.closeMenu')}

            className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 border border-white/[0.08] px-3 font-body text-sm uppercase tracking-[0.08em] hover:border-white ${focusRing}`}

          >

            {t('nav.closeLabel')}

            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">

              <path d="m6 6 12 12M6 18 18 6" />

            </svg>

          </button>

        </header>



        <div data-menu-scroll className="grid min-h-0 flex-1 grid-cols-[repeat(24,minmax(0,1fr))] overflow-y-auto overscroll-contain px-[max(env(safe-area-inset-left),env(safe-area-inset-right))] py-6 [scrollbar-color:#555555_#050505]">

          <nav aria-labelledby="stellar-menu-title" className="col-start-2 col-end-24 min-w-0">

            <h2 key={i18n.resolvedLanguage} id="stellar-menu-title" aria-label={t('nav.menuTitle')} className="mb-6 font-mono text-xs font-normal uppercase tracking-[0.2em] text-(--text-secondary)">

              {t('nav.menuTitle')}

            </h2>

            <ul>

              {navigationSections.map(({ id, key }, index) => (

                <li key={id} className="border-t border-white/[0.08] last:border-b">

                  <a

                    href={`/#${id}`}

                    onClick={(event) => navigate(event, id)}

                    className={`group flex min-h-11 min-w-11 items-center gap-4 text-(--text-primary) lg:gap-8 ${focusRing}`}

                  >

                    <span aria-hidden="true" className="shrink-0 font-mono text-xs text-(--text-secondary)">

                      {String(index + 1).padStart(2, '0')}

                    </span>

                    <span className="grid min-w-0 overflow-clip font-display text-[clamp(1.25rem,8vw,8rem)] font-semibold uppercase leading-[1.12] tracking-[-0.045em]">

                      <span className="col-start-1 row-start-1 block py-[0.12em] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.87,0,0.13,1)] motion-safe:group-hover:-translate-y-full motion-safe:group-focus-visible:-translate-y-full">

                        {t(`nav.${key}`)}

                      </span>

                      <span aria-hidden="true" className="col-start-1 row-start-1 block translate-y-full py-[0.12em] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.87,0,0.13,1)] motion-safe:group-hover:translate-y-0 motion-safe:group-focus-visible:translate-y-0">

                        {t(`nav.${key}`)}

                      </span>

                    </span>

                  </a>

                </li>

              ))}

            </ul>

          </nav>

        </div>



        <footer className="grid shrink-0 grid-cols-[repeat(24,minmax(0,1fr))] border-t border-white/[0.08] px-[max(env(safe-area-inset-left),env(safe-area-inset-right))] pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] font-body text-sm">

          <div className="col-start-2 col-end-24 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <a href={t('contact.emailUrl')} className={`inline-flex min-h-11 min-w-11 max-w-full w-fit items-center [overflow-wrap:anywhere] py-2 ${focusRing}`}>{t('contact.email')}</a>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-(--text-secondary)">

              {['facebook', 'linkedin', 'behance'].map((social) => t(`contact.${social}Url`) ? (

                <a key={social} href={t(`contact.${social}Url`)} target="_blank" rel="noopener noreferrer" aria-label={`${t(`contact.${social}Label`)} (${t('common.opensInNewTab')})`} className={`inline-flex min-h-11 min-w-11 items-center hover:text-white ${focusRing}`}>

                  {t(`contact.${social}Label`)}

                </a>

              ) : (

                <span key={social} title={t('nav.socialPending')} className="text-(--text-muted)">{t(`contact.${social}Label`)}</span>

              ))}

            </div>

            <div role="group" aria-label={t('nav.languageLabel')} className="flex items-center gap-1">

              {['vi', 'en'].map((language) => (

                <button key={language} type="button" onClick={() => setLang(language)} aria-pressed={lang === language} aria-label={t(language === 'vi' ? 'nav.langViFull' : 'nav.langEnFull')} className={`min-h-11 min-w-11 px-2 uppercase underline-offset-4 ${lang === language ? 'text-white underline' : 'text-(--text-secondary) hover:text-white'} ${focusRing}`}>

                  {t(language === 'vi' ? 'nav.langVi' : 'nav.langEn')}

                </button>

              ))}

            </div>

          </div>

        </footer>

      </div>

    </dialog>

  );

}
