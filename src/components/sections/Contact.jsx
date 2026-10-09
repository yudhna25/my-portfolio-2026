import { useRef, useState } from 'react';
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
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(t('contact.email'));
      }
    } catch {
      // Gracefully handle clipboard rejection in strict browser environments
    }
    setTransmitted(true);
    setTimeout(() => setTransmitted(false), 3500);
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
      <div data-contact-content className="invisible mx-auto max-w-7xl bg-(--bg-void) border border-(--bg-elevated) hover:border-white/30 transition-colors p-5 sm:p-8 lg:p-12">
        <p data-contact-copy lang="en" className="mb-10 flex items-center gap-4 font-mono text-xs tracking-[0.2em] text-(--text-primary)">
          <span aria-hidden="true" className="h-px w-10 bg-white/30" />
          {t('contact.sectionLabel')}
        </p>
        <h2 key={language} aria-label={`${t('contact.heading')} ${t('contact.alternateHeading')}`} id="transmission-heading" className="font-display text-[clamp(1.15rem,6vw,7rem)] font-bold leading-[1.25] tracking-[-0.045em]">
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

        {/* Deep Space Transceiver / Radio Transmission Console */}
        <div data-contact-copy className="mt-10 max-w-2xl">
          {/* Telemetry Frequency Header */}
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] tracking-[0.18em] text-[#FAFAFA]/80 uppercase">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2 rounded-full bg-[#FAFAFA]" />
              <span>{t('contact.telemetryFreq')}</span>
            </div>
            <span className="hidden sm:inline-block text-(--text-muted)">[CARRIER: LOCKED]</span>
          </div>

          {/* Transceiver Terminal Card */}
          <div
            data-transmission-terminal
            className="rounded-xl border border-(--bg-elevated) p-5 transition-colors hover:border-[#FAFAFA]/30 sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs font-mono text-(--text-secondary)">
              <span className="flex items-center gap-2">
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-[#FAFAFA] stroke-[1.5]">
                  <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4M12 12h.01M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-(--text-primary)">{t('contact.radioTerminal')}</span>
              </span>
              <span className="border border-white/20 rounded px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#FAFAFA]">
                RX // TX 100%
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Decrypted Email String */}
              <div className="min-w-0">
                <span className="sr-only">{t('contact.email')}</span>
                <span
                  aria-hidden="true"
                  className="block font-mono text-base font-semibold tracking-wider text-(--text-primary) select-all sm:text-xl lg:text-2xl"
                >
                  {t('contact.email')}
                </span>
              </div>

              {/* Transmit / Copy Dispatch Button */}
              <button
                type="button"
                onClick={handleTransmit}
                aria-label={transmitted ? t('contact.signalTransmitted') : t('contact.copyDispatch')}
                className={`group inline-flex min-h-11 shrink-0 items-center justify-center gap-2.5 rounded-lg border px-4 py-2.5 font-mono text-xs font-medium tracking-wider transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  transmitted
                    ? 'border-[#FAFAFA] bg-[#FAFAFA]/15 text-[#FAFAFA] shadow-[0_0_20px_rgba(250,250,250,0.35)]'
                    : 'border border-white/20 text-(--text-primary) hover:border-[#FAFAFA]/60 hover:text-[#FAFAFA]'
                }`}
              >
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-current stroke-[1.5]">
                  {transmitted ? (
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </>
                  )}
                </svg>
                <span>{transmitted ? 'DELIVERED ✓' : t('contact.copyDispatch')}</span>
              </button>
            </div>

            {/* Signal Transmission Feedback Waveform HUD */}
            {transmitted && (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 flex items-center gap-3 border-t border-[#FAFAFA]/20 pt-3 font-mono text-xs text-[#FAFAFA] motion-safe:animate-fade-in"
              >
                <div aria-hidden="true" className="flex h-3.5 items-end gap-1">
                  <span className="w-0.5 rounded-full bg-[#FAFAFA] motion-safe:animate-[pulse_0.4s_ease-in-out_infinite] h-3" />
                  <span className="w-0.5 rounded-full bg-[#FAFAFA] motion-safe:animate-[pulse_0.6s_ease-in-out_infinite] h-3.5" />
                  <span className="w-0.5 rounded-full bg-[#FAFAFA] motion-safe:animate-[pulse_0.3s_ease-in-out_infinite] h-2" />
                  <span className="w-0.5 rounded-full bg-[#FAFAFA] motion-safe:animate-[pulse_0.5s_ease-in-out_infinite] h-3.5" />
                  <span className="w-0.5 rounded-full bg-[#FAFAFA] motion-safe:animate-[pulse_0.45s_ease-in-out_infinite] h-2.5" />
                </div>
                <span className="tracking-wider">{t('contact.signalTransmitted')}</span>
              </div>
            )}
          </div>
        </div>

        <div data-contact-copy className="mt-12 sm:mt-16">
          <a
            data-contact-email
            data-magnetic
            href={t('contact.emailUrl')}
            onClick={() => {
              playRadioClick();
            }}
            className="cta-hover relative inline-flex min-h-18 w-full items-center justify-center gap-4 rounded-full border border-transparent bg-(--text-primary) px-5 py-6 font-display text-xs font-semibold tracking-[0.06em] text-black shadow-(--glow-button) focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-white sm:w-auto sm:gap-6 sm:px-10 sm:text-sm"
          >
            <span data-contact-glow aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full opacity-15 shadow-(--glow-button)" />
            <span className="relative">{t('contact.emailCta')}</span>
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" className="relative h-5 w-5 shrink-0 stroke-current stroke-[1.5]">
              <path d="M5 19 19 5M5 5h14v14" />
            </svg>
          </a>
        </div>

        <div data-contact-copy className="mt-16 flex flex-col gap-4 border-t border-(--bg-elevated) py-6 font-mono text-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10 sm:text-sm lg:mt-24">
          <a href={t('contact.emailUrl')} className={`${linkStyle} [overflow-wrap:anywhere]`}>{t('contact.email')}</a>
          {['facebook', 'linkedin', 'behance'].map((social) => t(`contact.${social}Url`) ? (
            <a key={social} href={t(`contact.${social}Url`)} target="_blank" rel="noopener noreferrer" aria-label={`${t(`contact.${social}Label`)} (${t('common.opensInNewTab')})`} className={linkStyle}>
              {t(`contact.${social}Label`)}
            </a>
          ) : null)}
          <a href={`tel:${t('contact.phone').replace(/\s/g, '')}`} className={`${linkStyle} sm:ml-auto`}>{t('contact.phone')}</a>
        </div>
      </div>
    </section>
  );
}
