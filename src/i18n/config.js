import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from '@/i18n/locales/vi.json';
import en from '@/i18n/locales/en.json';
import { useLangStore } from '@/stores/useLangStore';
import { EDURA_ROUTE, useRouteStore } from '@/stores/useRouteStore';

i18n.use(initReactI18next).init({
  lng: useLangStore.getState().lang, // The store defaults to 'vi'.
  fallbackLng: 'en',
  supportedLngs: ['vi', 'en'],
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
});

// Store → i18n only: languageChanged never writes back into the store.
const unsubscribe = useLangStore.subscribe(({ lang }) => {
  if (i18n.language !== lang) i18n.changeLanguage(lang);
});

const META_COPY = {
  vi: {
    title: 'Trần Vũ Anh Duy — Creative Designer · Stellar Odyssey Portfolio',
    description: 'Trần Vũ Anh Duy — Creative Designer chuyên về UX/UI, Motion Graphics và 3D Web tương tác. Trải nghiệm không gian vũ trụ điện ảnh, tối giản và hướng tới người dùng.',
  },
  en: {
    title: 'Tran Vu Anh Duy — Creative Designer · Stellar Odyssey Portfolio',
    description: 'Portfolio of Tran Vu Anh Duy — Creative Designer specializing in UX/UI, Motion Graphics, and interactive 3D Web. Minimalist, cinematic, user-centric portfolio experience.',
  },
};

function applyLanguage(lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  const reader = useRouteStore.getState().path === EDURA_ROUTE;
  const copy = reader ? { title: i18n.t('edura.metaTitle', { lng: lang }), description: i18n.t('edura.metaDescription', { lng: lang }) } : META_COPY[lang] || META_COPY.vi;
  document.title = copy.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', copy.description);
  const url = `https://stellar-odyssey.vercel.app${reader ? EDURA_ROUTE : '/'}`;
  document.querySelectorAll('link[rel="canonical"],link[rel="alternate"]').forEach(link => link.setAttribute('href', url));
  for (const [name, value] of Object.entries({ title: copy.title, description: copy.description, url })) {
    document.querySelector(`meta[property="og:${name}"]`)?.setAttribute('content', value);
    document.querySelector(`meta[name="twitter:${name}"]`)?.setAttribute('content', value);
  }
}
applyLanguage(i18n.resolvedLanguage);
i18n.on('languageChanged', applyLanguage);
const unsubscribeRoute = useRouteStore.subscribe(() => applyLanguage(i18n.resolvedLanguage));

if (import.meta.hot) import.meta.hot.dispose(() => {
  unsubscribe();
  unsubscribeRoute();
  i18n.off('languageChanged', applyLanguage);
});

export { i18n };
export default i18n;
