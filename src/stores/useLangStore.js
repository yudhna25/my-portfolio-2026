import { create } from 'zustand';

export const useLangStore = create((set) => ({
  lang: 'vi',
  setLang: (lang) => {
    if (lang === 'vi' || lang === 'en') set({ lang });
  },
}));
