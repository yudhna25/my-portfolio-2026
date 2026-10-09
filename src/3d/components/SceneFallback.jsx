import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useScrollStore } from '@/stores/useScrollStore';
import { i18n } from '@/i18n/config';
import vi from '@/i18n/locales/vi/scene.json';
import en from '@/i18n/locales/en/scene.json';

i18n.addResourceBundle('vi', 'scene', vi, true, true);
i18n.addResourceBundle('en', 'scene', en, true, true);

export function SceneFallback() {
  const root = useRef(null);
  const { t } = useTranslation('scene');
  useEffect(() => {
    // Canvas contains alternate DOM even when WebGL works; only a shown fallback counts.
    if (root.current?.closest('canvas')) return;
    useScrollStore.getState().setSceneFallback(true);
    return () => useScrollStore.getState().setSceneFallback(false);
  }, []);

  return (
    <div ref={root} data-scene-fallback className="flex h-full flex-col items-center justify-center bg-(--bg-void) px-6 text-center text-(--text-primary)">
      <strong className="font-display text-lg">{t('fallback.title')}</strong>
      <p className="mt-3 max-w-md font-body text-sm text-(--text-secondary)">{t('fallback.description')}</p>
    </div>
  );
}
