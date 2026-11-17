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
  // The note belongs to the opening sky only; past the Hero it would sit under the chapters' copy.
  const opening = useScrollStore(state => state.storyChapter === 'hero');
  useEffect(() => {
    // Canvas contains alternate DOM even when WebGL works; only a shown fallback counts.
    if (root.current?.closest('canvas')) return;
    useScrollStore.getState().setSceneFallback(true);
    return () => useScrollStore.getState().setSceneFallback(false);
  }, []);

  return (
    <div ref={root} data-scene-fallback className="flex h-full flex-col items-start justify-end bg-(--bg-void) p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-left text-(--text-primary) sm:p-10">
      <div className={`max-w-xs transition-opacity duration-700 ${opening ? 'opacity-100' : 'opacity-0'}`}>
        <strong className="font-serif text-lg font-normal italic">{t('fallback.title')}</strong>
        <p className="mt-2 font-body text-sm leading-relaxed text-(--text-secondary)">{t('fallback.description')}</p>
      </div>
    </div>
  );
}
