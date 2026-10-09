import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useLangStore } from '@/stores/useLangStore';
import { PORTFOLIO_DATA } from '@/data';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4';
const prose = 'max-w-[68ch] font-body text-base leading-[1.75] text-white/75 sm:text-lg';
const assets = { overview: 'A02', problem: 'A07', solution: 'A09' };

function EduraFigure({ id, t, priority = false }) {
  const src = `/projects/edura/${id}.webp`;
  return <figure id={`edura-${id}-figure`} data-edura-asset={assets[id]} className="my-10 sm:my-16">
    <img src={src} width="1400" height="989" alt={t(`edura.figures.${id}.alt`)}
      loading={priority ? 'eager' : 'lazy'} decoding="async" className="h-auto w-full object-contain" />
    <figcaption className="mt-4 flex flex-col gap-2 font-body text-sm leading-relaxed text-(--text-secondary) sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <p className="max-w-[75ch]">{t(`edura.figures.${id}.caption`)}</p>
      <a href={src} target="_blank" rel="noopener noreferrer"
        aria-label={`${t('edura.viewOriginal')} — ${t(`edura.figures.${id}.name`)} (${t('common.opensInNewTab')})`}
        className={`inline-flex min-h-11 shrink-0 items-center gap-2 self-start underline decoration-white/25 underline-offset-4 ${focusRing}`}>
        {t('edura.viewOriginal')} <span aria-hidden="true">↗</span>
      </a>
    </figcaption>
  </figure>;
}

export default function Edura({ onReturn }) {
  const root = useRef(null);
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const lang = useLangStore(state => state.lang);
  const setLang = useLangStore(state => state.setLang);
  useGSAP(() => {
    if (reduced) return;
    gsap.fromTo('[data-reader-intro]', { y: 12, opacity: 0.65 }, {
      y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power2.out',
    });
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  return <div ref={root} data-edura-reader className="min-h-dvh bg-(--bg-void) px-4 pt-[calc(4.5rem+env(safe-area-inset-top))] text-(--text-primary) sm:px-8 lg:px-12">
    <header className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/15 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div role="group" aria-label={t('nav.languageLabel')} className="ml-auto flex gap-1 sm:order-3 sm:ml-0">
        {['vi', 'en'].map(language => <button key={language} type="button" onClick={() => setLang(language)} aria-pressed={lang === language}
          aria-label={t(language === 'vi' ? 'nav.langViFull' : 'nav.langEnFull')}
          className={`min-h-11 min-w-11 cursor-pointer font-mono text-sm uppercase underline-offset-4 ${focusRing} ${lang === language ? 'text-white underline' : 'text-(--text-secondary)'}`}>{language.toUpperCase()}</button>)}
      </div>
      <button type="button" data-edura-return onClick={onReturn} disabled={!onReturn}
        className={`inline-flex min-h-11 w-full items-center gap-2 font-body text-sm disabled:cursor-default disabled:text-(--text-secondary) sm:order-2 sm:ml-auto sm:w-auto ${focusRing}`}>
        <span aria-hidden="true">←</span> {t('edura.return')}
      </button>
    </header>

    <main id="edura-main" tabIndex={-1} className="mx-auto max-w-7xl pb-16 pt-12 sm:pt-20 lg:pt-24">
      <article aria-labelledby="edura-title">
        <header className="mb-10 sm:mb-16">
          <p className="mb-6 font-mono text-sm uppercase tracking-widest text-(--text-secondary)">{t('edura.eyebrow')}</p>
          <h1 id="edura-title" data-reader-intro className="font-display text-[clamp(3rem,8.8vw,8.5rem)] leading-[1.05] font-bold tracking-[-0.055em] text-balance">{t('edura.overview.intro.heading')}</h1>
          <p data-reader-intro className="mt-8 max-w-[58ch] font-body text-lg leading-relaxed text-white/90 sm:mt-12 sm:text-2xl">{t('edura.overview.intro.body')}</p>
          <p className="mt-6 font-body text-sm leading-relaxed text-(--text-secondary)">{t('edura.context')}</p>
          <div className="mt-10 max-w-[68ch] border-t border-white/15 pt-6">
            <h2 className="font-mono text-sm uppercase tracking-wider text-(--text-secondary)">{t('edura.overview.role.heading')}</h2>
            <p className={`mt-3 ${prose}`}>{t('edura.overview.role.body')}</p>
          </div>
        </header>

        <EduraFigure id="overview" t={t} priority />

        <section aria-labelledby="edura-problem" className="mt-16 sm:mt-24">
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-12">
            <h2 id="edura-problem" className="font-display text-[clamp(1.65rem,3vw,2.75rem)] leading-tight font-semibold tracking-tight text-balance lg:col-span-5">{t('edura.problem.framing.heading')}</h2>
            <p className={`${prose} lg:col-span-7`}>{t('edura.problem.framing.body')}</p>
          </div>
          <EduraFigure id="problem" t={t} />
        </section>

        <section aria-labelledby="edura-decisions" className="my-16 grid gap-8 border-y border-white/15 py-12 sm:my-24 sm:py-16 lg:grid-cols-12 lg:gap-12">
          <h2 id="edura-decisions" className="font-display text-[clamp(1.65rem,3vw,2.75rem)] leading-tight font-semibold tracking-tight text-balance lg:col-span-5">{t('edura.decisions.heading')}</h2>
          <div className="space-y-10 lg:col-span-7">
            {['layout', 'color', 'system'].map(id => <div key={id}>
              <h3 className="font-body text-xl font-medium sm:text-2xl">{t(`edura.decisions.${id}.heading`)}</h3>
              <p className={`mt-3 ${prose}`}>{t(`edura.decisions.${id}.body`)}</p>
            </div>)}
          </div>
        </section>

        <section aria-labelledby="edura-artifacts">
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-12">
            <h2 id="edura-artifacts" className="font-display text-[clamp(1.65rem,3vw,2.75rem)] leading-tight font-semibold tracking-tight text-balance lg:col-span-5">{t('edura.artifacts.heading')}</h2>
            <div className="space-y-6 lg:col-span-7">
              <p className={prose}>{t('edura.artifacts.overview.body')}</p>
              <p className={prose}>{t('edura.artifacts.direction.body')}</p>
            </div>
          </div>
          <EduraFigure id="solution" t={t} />
        </section>

        <section aria-labelledby="edura-results" className="mt-16 grid gap-6 border-t border-white/15 pt-12 sm:mt-24 sm:pt-16 lg:grid-cols-12 lg:gap-12">
          <h2 id="edura-results" className="font-display text-[clamp(1.65rem,3vw,2.75rem)] leading-tight font-semibold tracking-tight text-balance lg:col-span-5">{t('edura.results.deliverables.heading')}</h2>
          <p className={`${prose} lg:col-span-7`}>{t('edura.results.deliverables.body')}</p>
        </section>

        <section aria-labelledby="edura-reflection" className="mt-16 grid gap-6 sm:mt-24 lg:grid-cols-12 lg:gap-12">
          <h2 id="edura-reflection" className="font-display text-[clamp(1.65rem,3vw,2.75rem)] leading-tight font-semibold tracking-tight text-balance lg:col-span-5">{t('edura.reflection.heading')}</h2>
          <div className="space-y-6 lg:col-span-7">
            <p className={prose}>{t('edura.reflection.prototype')}</p>
            <p className={prose}>{t('edura.reflection.references')}</p>
          </div>
        </section>
      </article>
    </main>

    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 border-t border-white/15 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] font-body text-sm">
      <button type="button" data-edura-return onClick={onReturn} disabled={!onReturn} className={`inline-flex min-h-11 items-center gap-2 disabled:cursor-default disabled:text-(--text-secondary) ${focusRing}`}><span aria-hidden="true">←</span> {t('edura.return')}</button>
      <a href={PORTFOLIO_DATA.projects[0].link} target="_blank" rel="noopener noreferrer" aria-label={`${t('edura.behance')} (${t('common.opensInNewTab')})`}
        className={`inline-flex min-h-11 items-center gap-2 text-(--text-secondary) underline decoration-white/25 underline-offset-4 ${focusRing}`}>{t('edura.behance')} <span aria-hidden="true">↗</span></a>
    </footer>
    <p aria-live="polite" className="sr-only">{i18n.resolvedLanguage === 'vi' ? t('nav.langViFull') : t('nav.langEnFull')}</p>
  </div>;
}
