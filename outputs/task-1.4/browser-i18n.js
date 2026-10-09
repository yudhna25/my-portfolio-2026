// QA-only document: imports the production instance, not a second i18n engine.
import i18n from '@/i18n/config';
import { getI18n } from 'react-i18next';
import { useLangStore } from '@/stores/useLangStore';

let languageChanges = 0;
function show() {
  const result = {
    i18nLanguage: i18n.language,
    storeLanguage: useLangStore.getState().lang,
    reactBinding: getI18n() === i18n,
    tagline: i18n.t('hero.tagline'),
    subTagline: i18n.t('hero.subTagline'),
    navigation: i18n.t('nav.about'),
    linkedinUrl: i18n.t('contact.linkedinUrl'),
    behanceUrl: i18n.t('contact.behanceUrl'),
    languageChanges,
  };
  document.querySelector('#qa-results').textContent = JSON.stringify(result, null, 2);
  console.log("i18n.t('hero.tagline'):", i18n.t('hero.tagline'));
  console.log("i18n.t('hero.subTagline'):", i18n.t('hero.subTagline'));
}

i18n.on('languageChanged', () => {
  languageChanges += 1;
  show();
});
document.querySelector('#store-en').addEventListener('click', () => useLangStore.getState().setLang('en'));
document.querySelector('#store-vi').addEventListener('click', () => useLangStore.getState().setLang('vi'));
document.querySelector('#direct-en').addEventListener('click', () => i18n.changeLanguage('en'));
document.querySelector('#direct-vi').addEventListener('click', () => i18n.changeLanguage('vi'));
show();
