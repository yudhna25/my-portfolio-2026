// Runs synchronously in <head>, before styles or the React module are loaded.
(() => {
  const root = document.documentElement;
  root.setAttribute('data-theme', 'dark');
  root.classList.remove('light');
  root.classList.add('dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = '#050505';
  try {
    window.localStorage.setItem('stellar-theme', 'dark');
  } catch { /* Fixed dark also works without storage. */ }
})();
