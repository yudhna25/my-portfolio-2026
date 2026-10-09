import { useTranslation } from 'react-i18next';
import { PortalHeading } from '@/components/effects/PortalHeading';

export default function Hero({ active }) {
  const { t } = useTranslation();
  return <PortalHeading label={t('hero.portfolio')} year={t('hero.year')} name={t('hero.name')} visible={active} glitch>
    <div className="mt-[25vh] max-w-[32ch] md:mt-12 [@media(max-height:550px)]:mt-5">
      <p className="font-body text-base font-medium md:text-xl">{t('hero.tagline')}</p>
      <p className="mt-3 font-body text-sm leading-relaxed text-secondary md:text-base">{t('hero.subTagline')}</p>
    </div>
    <p className="fixed bottom-[max(2rem,env(safe-area-inset-bottom))] left-4 right-4 font-mono text-[10px] tracking-[0.12em] md:left-[4vw] md:text-xs">{t('hero.scrollIndicator')}</p>
  </PortalHeading>;
}
