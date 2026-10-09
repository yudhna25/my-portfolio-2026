import { useTranslation } from 'react-i18next';
import { PortalHeading } from '@/components/effects/PortalHeading';

export default function Hero({ active }) {
  const { t } = useTranslation();
  return <PortalHeading label={t('hero.portfolio')} year={t('hero.year')} name={t('hero.name')} role={t('hero.tagline')} visible={active} glitch>
    <p data-hero-layer="intro" className="mt-[24px] max-w-[40ch] font-body text-sm leading-relaxed text-secondary md:mt-[32px] md:text-base">{t('hero.subTagline')}</p>
    <p data-hero-layer="indicator" className="fixed bottom-[max(2rem,env(safe-area-inset-bottom))] left-4 right-4 font-mono text-[10px] tracking-[0.12em] md:left-[14vw] md:text-xs">{t('hero.scrollIndicator')}</p>
  </PortalHeading>;
}
