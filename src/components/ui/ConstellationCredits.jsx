import { useTranslation } from 'react-i18next';
import { Info, X } from 'lucide-react';

const id = 'constellation-credits';
const source = 'https://github.com/Stellarium/stellarium/tree/daace2add6a1bf886e8ee1934f51e9c69f818d18/skycultures/modern';
const linkClass = 'inline-flex min-h-11 items-center underline decoration-white/30 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white';

export function ConstellationCreditButton({ className = '', compact = false }) {
  const { t } = useTranslation();
  return <button type="button" popoverTarget={id} aria-label={t('constellationCredits.label')} title={t('constellationCredits.label')}
    className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 font-mono text-xs text-white/65 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${className}`}>
    <Info size={16} aria-hidden="true" />{!compact && t('constellationCredits.label')}
  </button>;
}

export function ConstellationCredits() {
  const { t } = useTranslation();
  const newTab = t('common.opensInNewTab');
  return <aside id={id} popover="auto" role="dialog" aria-labelledby={id + '-title'}
    className="fixed inset-x-4 top-1/2 bottom-auto m-auto max-h-[80dvh] max-w-xl -translate-y-1/2 overflow-y-auto rounded-sm border border-white/20 bg-(--bg-void) p-6 text-(--text-primary) shadow-xl backdrop:bg-black/50">
    <div className="flex items-center justify-between gap-4">
      <h2 id={id + '-title'} className="font-display text-lg">{t('constellationCredits.title')}</h2>
      <button type="button" popoverTarget={id} popoverTargetAction="hide" aria-label={t('constellationCredits.close')}
        className="inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-white"><X size={20} aria-hidden="true" /></button>
    </div>
    <div className="mt-4 space-y-3 font-body text-sm leading-relaxed text-white/75">
      <p>{t('constellationCredits.illustrations')} <a className={linkClass} aria-label={`Johan Meuris (${newTab})`} href="https://johanmeuris.eu/work/stellarium-constellation-art/" target="_blank" rel="noopener noreferrer">Johan Meuris</a> · Stellarium (2005).</p>
      <p>{t('constellationCredits.adaptation')}</p>
      <p><a className={linkClass} aria-label={`${t('constellationCredits.source')} (${newTab})`} href={source} target="_blank" rel="noopener noreferrer">{t('constellationCredits.source')}</a> · <a className={linkClass} aria-label={`Free Art License 1.3 (${newTab})`} href="https://artlibre.org/licence/lal/en/" target="_blank" rel="noopener noreferrer">Free Art License 1.3</a></p>
      <p>{t('constellationCredits.patterns')} <a className={linkClass} aria-label={`CC BY-SA 4.0 (${newTab})`} href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></p>
      <p>{t('constellationCredits.catalog')} <a className={linkClass} aria-label={`ESA Hipparcos (1997) (${newTab})`} href="https://www.cosmos.esa.int/web/hipparcos/catalogues" target="_blank" rel="noopener noreferrer">ESA Hipparcos (1997)</a> · <a className={linkClass} aria-label={`CDS I/239 (${newTab})`} href="https://doi.org/10.26093/cds/vizier" target="_blank" rel="noopener noreferrer">CDS I/239</a>.</p>
      <div className="flex flex-wrap gap-x-5">
        <a className={linkClass} aria-label={`${t('constellationCredits.attribution')} (${newTab})`} href={import.meta.env.BASE_URL + 'constellations/ATTRIBUTION.md'} target="_blank" rel="noopener noreferrer">{t('constellationCredits.attribution')}</a>
        <a className={linkClass} aria-label={`${t('constellationCredits.manifest')} (${newTab})`} href={import.meta.env.BASE_URL + 'constellations/manifest.json'} target="_blank" rel="noopener noreferrer">{t('constellationCredits.manifest')}</a>
      </div>
    </div>
  </aside>;
}
