import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: 'dark',
  applyTheme: () => {
    set({ theme: 'dark' });
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', 'dark');
    for (const element of [document.documentElement, document.body]) {
      element?.classList.remove('light');
      element?.classList.add('dark');
    }

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.append(meta);
    }
    meta.content = '#050505';
    try {
      window.localStorage.setItem('stellar-theme', 'dark');
    } catch { /* Fixed dark also works without storage. */ }
  },
}));
