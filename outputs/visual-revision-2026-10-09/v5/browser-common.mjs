import { pathToFileURL } from 'node:url';
export const { chromium } = await import(process.env.STELLAR_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href : 'playwright');
export const base = process.env.STELLAR_QA_URL || 'http://127.0.0.1:5185';
export const out = 'outputs/visual-revision-2026-10-09/v5';
export async function ready(page) {
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.evaluate(() => document.fonts.ready);
  const attach = async () => {
    const canvas = document.querySelector('[data-galaxy-scene] canvas');
    if (!canvas) return false;
    for (const url of [...new Set(performance.getEntriesByType('resource').map(x => x.name)
      .filter(x => x.includes('/@react-three_fiber.js') && !x.endsWith('.map')))]) {
      const fiber = await import(url), root = fiber._roots?.get(canvas)?.store;
      if (root?.getState().scene.getObjectByName('symbol-stars')) {
        const loaded = part => performance.getEntriesByType('resource').map(x => x.name).filter(x => x.includes(part)).at(-1);
        const scroll = await import(loaded('/src/stores/useScrollStore.js'));
        const gsap = await import(loaded('/src/hooks/useGSAPSetup.js'));
        const skills = await import(loaded('/src/stores/useSkillsStore.js'));
        const education = await import(loaded('/src/stores/useEducationStore.js'));
        window.v5qa = { fiber, root, scroll: scroll.useScrollStore, gsap, skills: skills.useSkillsStore, education: education.useEducationStore };
        return true;
      }
    }
    return false;
  };
  await page.waitForFunction(attach, null, { timeout: 60000 });
  for (let i = 0; i < 100; i++) {
    if (await page.evaluate(attach)) return;
    await page.waitForTimeout(250);
  }
  throw new Error('Current main-world Canvas root did not become ready');
}
export async function seek(page, chapter, p = 0) {
  await page.evaluate(({ chapter, p }) => {
    const content = document.getElementById('smooth-content'), top = content.getBoundingClientRect().top;
    const list = [...content.querySelectorAll('[data-story-chapter]')].map(el => ({ id: el.dataset.storyChapter,
      top: el.getBoundingClientRect().top - top })).sort((a, b) => a.top - b.top);
    const i = list.findIndex(x => x.id === chapter), end = list[i + 1]?.top ?? document.documentElement.scrollHeight - innerHeight;
    const y = list[i].top + (end - list[i].top) * p;
    v5qa.scroll.getState().setStoryPosition(chapter, p, y / Math.max(1, document.documentElement.scrollHeight - innerHeight), true);
    const smoother = v5qa.gsap.ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTop(y); const trigger = smoother.scrollTrigger;
      trigger.update(); const tween = trigger.getTween();
      if (typeof tween?.progress === 'function') tween.progress(1).pause();
      trigger.animation.progress(trigger.progress);
    } else scrollTo(0, y);
  }, { chapter, p });
  await page.waitForTimeout(250);
}
export async function poolSnapshot(page) {
  return page.evaluate(() => {
    const scene = v5qa.root.getState().scene, group = scene.getObjectByName('symbol-stars'), pool = group.userData.pool;
    const root = scene.getObjectByName('symbol-anchor');
    return { target: pool.target?.id ?? null, formation: pool.formation, lines: pool.lines, logo: pool.logo,
      phase: pool.phase, positions: [...pool.positions], weights: [...pool.weights], sizes: [...pool.sizes],
      uniforms: Object.fromEntries(Object.entries(scene.getObjectByName('symbol-pool').material.uniforms).map(([k, v]) => [k, v.value])),
      links: [...scene.getObjectByName('symbol-links').geometry.attributes.position.array],
      pose: [...root.position.toArray(), ...root.quaternion.toArray(), ...root.scale.toArray()],
      logos: scene.children.flatMap(() => []).concat(...['figma','photoshop','illustrator','after-effects','premiere-pro','davinci-resolve','chatgpt','claude','google-antigravity']
        .map(id => { const mesh = scene.getObjectByName('symbol-logo-' + id); return { id, visible: mesh.visible,
          opacity: mesh.material.opacity, position: mesh.position.toArray(), scale: mesh.scale.toArray(), loaded: !!mesh.material.map?.image }; })) };
  });
}
