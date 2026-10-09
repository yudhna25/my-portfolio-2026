import { useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { useGSAP } from '@gsap/react';

import { Mail, Facebook, Linkedin, Globe } from 'lucide-react';

import { gsap, splitText } from '@/hooks/useGSAPSetup';

import { useReducedMotion } from '@/hooks/useReducedMotion';



export default function Footer() {

  const root = useRef(null);

  const { t, i18n } = useTranslation();

  const reducedMotion = useReducedMotion();

  const heading = t('contact.heading');

  const words = heading.split(' ');

  const email = t('contact.email');



  const { contextSafe } = useGSAP(

    () => {

      if (reducedMotion) return;

      const q = gsap.utils.selector(root.current);

      const split = splitText(q('.footer-big'), {

        type: 'chars, words',

        charsClass: 'split-char',

        smartWrap: true,

        aria: 'none',

      });



      gsap.fromTo(

        split.chars,

        { y: 60, autoAlpha: 0, rotation: 3 },

        {

          y: 0,

          autoAlpha: 1,

          rotation: 0,

          duration: 0.8,

          ease: 'expo.out',

          stagger: { each: 0.03, from: 'start' },

          scrollTrigger: {

            trigger: q('.footer-big'),

            start: 'top 88%',

            toggleActions: 'play none none reverse',

          },

        }

      );



      gsap.fromTo(

        q('.footer-fade'),

        { y: 24, opacity: 0 },

        {

          y: 0,

          opacity: 1,

          duration: 0.7,

          ease: 'power3.out',

          stagger: 0.08,

          scrollTrigger: {

            trigger: q('.footer-grid'),

            start: 'top 85%',

            toggleActions: 'play none none reverse',

          },

        }

      );



      return () => split.revert();

    },

    { scope: root, dependencies: [i18n.resolvedLanguage, reducedMotion], revertOnUpdate: true }

  );



  const scrambleMail = contextSafe((e) => {

    if (reducedMotion) return;

    gsap.to(e.currentTarget.querySelector('.mail-text'), {

      duration: 0.6,

      ease: 'none',

      scrambleText: { text: email, chars: 'upperAndLowerCase', revealDelay: 0.2 },

      overwrite: 'auto',

    });

  });



  return (

    <footer

      ref={root}

      id="site-footer"

      data-theme="dark"

      role="contentinfo"

      aria-label={t('footer.label')}

      className="relative z-10 overflow-hidden border-t border-white/[0.08] bg-transparent px-6 py-20 text-(--text-primary) sm:px-8 md:px-12 md:py-28 lg:px-16"

    >

      <div className="footer-grid mx-auto flex max-w-[1600px] flex-col justify-between gap-12 xl:flex-row xl:items-end">

        <h2

          key={i18n.resolvedLanguage}

          aria-label={heading}

          className="footer-big min-w-0 font-display text-[clamp(2.5rem,6.5vw,6.5rem)] font-bold uppercase leading-[1.1] tracking-[-0.035em] text-(--text-primary)"

        >

          {words.slice(0, -1).join(' ')}{' '}

          <span className="stroke-text-white whitespace-nowrap">{words.at(-1)}</span>

        </h2>



        <div className="flex flex-col items-start gap-5 xl:shrink-0 xl:items-end">

          <a

            href={t('contact.emailUrl')}

            aria-label={email}

            onMouseEnter={scrambleMail}

            data-magnetic

            className="footer-fade group flex max-w-full items-center gap-3 rounded-full border border-white/15 bg-white/[0.02] px-6 py-3 font-mono text-sm font-medium text-(--text-primary) transition-all hover:border-white/40 hover:bg-white/[0.06] hover:text-white sm:text-base will-transform"

          >

            <Mail size={18} aria-hidden="true" focusable="false" className="shrink-0 text-(--text-secondary) transition-colors group-hover:text-white" />

            <span className="mail-text min-w-0 [overflow-wrap:anywhere]" aria-hidden="true">

              {email}

            </span>

          </a>



          <a

            href={`tel:${t('contact.phone').replace(/\s/g, '')}`}

            className="footer-fade inline-flex min-h-11 items-center font-mono text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"

          >

            {t('contact.phone')}

          </a>



          <div className="footer-fade flex items-center gap-3">

            <a

              href={t('contact.facebookUrl')}

              target="_blank"

              rel="noopener noreferrer"

              aria-label={`${t('contact.facebookLabel')} (${t('common.opensInNewTab')})`}

              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-(--text-secondary) transition-all hover:border-white/35 hover:bg-white/[0.06] hover:text-white"

            >

              <Facebook size={18} aria-hidden="true" focusable="false" />

            </a>



            <a

              href={t('contact.linkedinUrl') || undefined}

              target="_blank"

              rel="noopener noreferrer"

              aria-label={`${t('contact.linkedinLabel')} (${t('common.opensInNewTab')})`}

              aria-disabled={!t('contact.linkedinUrl') || undefined}

              title={t('contact.linkedinUrl') ? undefined : t('nav.socialPending')}

              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] transition-all ${

                t('contact.linkedinUrl')

                  ? 'text-(--text-secondary) hover:border-white/35 hover:bg-white/[0.06] hover:text-white'

                  : 'cursor-default text-(--text-muted) opacity-40'

              }`}

            >

              <Linkedin size={18} aria-hidden="true" focusable="false" />

            </a>



            <a

              href={t('footer.websiteUrl') || undefined}

              target="_blank"

              rel="noopener noreferrer"

              aria-label={`${t('footer.websiteLabel')} (${t('common.opensInNewTab')})`}

              aria-disabled={!t('footer.websiteUrl') || undefined}

              title={t('footer.websiteUrl') ? undefined : t('nav.socialPending')}

              className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] transition-all ${

                t('footer.websiteUrl')

                  ? 'text-(--text-secondary) hover:border-white/35 hover:bg-white/[0.06] hover:text-white'

                  : 'cursor-default text-(--text-muted) opacity-40'

              }`}

            >

              <Globe size={18} aria-hidden="true" focusable="false" />

            </a>

          </div>

        </div>

      </div>



      <div className="mx-auto mt-16 flex max-w-[1600px] flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-8 font-mono text-xs uppercase tracking-wider text-(--text-secondary) sm:flex-row sm:flex-wrap">

        <span>{t('footer.copyright')}</span>

        <span className="hidden text-(--text-muted) md:inline">{t('footer.disciplines')}</span>

        <span className="text-(--text-secondary)">{t('footer.buildCredit', { version: '3.15' })}</span>

      </div>

    </footer>

  );

}

