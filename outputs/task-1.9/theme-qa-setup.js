// Test-only OS override, before the production head bootstrap.
(() => {
  const os = new URLSearchParams(location.search).get('os');
  const nativeMedia = window.matchMedia.bind(window);
  if (['light', 'dark', 'none'].includes(os)) {
    window.matchMedia = (query) => query.includes('prefers-color-scheme')
      ? { matches: os !== 'none' && query.includes(os), media: query }
      : nativeMedia(query);
  }
  window.themeQA = { os: os ?? 'native', navigation: performance.timeOrigin, paints: [] };
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      window.themeQA.paints.push({ name: entry.name, startTime: entry.startTime, attribute: document.documentElement.dataset.theme ?? null, background: getComputedStyle(document.documentElement).backgroundColor });
    }
    document.dispatchEvent(new Event('theme-qa-paint'));
  }).observe({ type: 'paint', buffered: true });
})();
