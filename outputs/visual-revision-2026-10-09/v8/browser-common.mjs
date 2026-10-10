import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
export { chromium };
export const base = 'http://127.0.0.1:5199';
export const out = 'outputs/visual-revision-2026-10-09/v8';
export async function ready(page) {
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.evaluate(() => document.fonts.ready);
  const attach = async () => {
    const canvas = document.querySelector('[data-galaxy-scene] canvas');
    if (!canvas) return false;
    const resources = performance.getEntriesByType('resource').map(e => e.name);
    const modules = await Promise.all([...new Set(resources.filter(url => /\/assets\/.*\.js$/.test(url) && !/\/assets\/(index|lab)-/.test(url)))].map(url => import(url)));
    const index = Object.assign({}, ...modules.map((m,i)=>Object.fromEntries(Object.entries(m).map(([k,v])=>[i+'-'+k,v]))));
    const store = Object.values(index).find(x => typeof x?.getState === 'function' && 'storyChapter' in x.getState());
    let runtime;
    let fiber = canvas[Object.keys(canvas).find(k=>k.startsWith('__reactFiber$'))];
    while(fiber && !runtime) {
      for(let hook=fiber.memoizedState; hook && !runtime; hook=hook.next) {
        const state=hook.memoizedState?.current;
        if(state?.gl && state?.camera && state?.scene && typeof state.get==='function') runtime=state;
      }
      fiber=fiber.return;
    }
    const root = runtime && { getState:runtime.get };
    if (!store || !root?.getState().scene.getObjectByName('symbol-stars')) return false;
    window.v8qa = { store, root, index,
      smoother: Object.values(index).find(x => x?.create && x?.get && !x?.getAll),
      trigger: Object.values(index).find(x => x?.getAll && x?.refresh),
      i18n: Object.values(index).find(x => x?.changeLanguage && x?.t),
      education: Object.values(index).find(x => typeof x?.getState === 'function' && 'anchorId' in x.getState()),
      skills: Object.values(index).find(x => typeof x?.getState === 'function' && 'visible' in x.getState() && 'focus' in x.getState() && !('anchorId' in x.getState())),
    };
    return Boolean(v8qa.smoother && v8qa.trigger);
  };
  for (let i=0; i<120; i++) {
    if (await page.evaluate(attach)) return;
    await page.waitForTimeout(250);
  }
  throw new Error('Production Canvas/store not ready');
}
export async function seek(page, chapter, p = 0) {
  await page.evaluate(({chapter,p}) => {
    const content = document.getElementById('smooth-content'), top = content.getBoundingClientRect().top;
    const list = [...content.querySelectorAll('[data-story-chapter]')].map(el => ({ id:el.dataset.storyChapter, top:el.getBoundingClientRect().top-top })).sort((a,b)=>a.top-b.top);
    const i = list.findIndex(x => x.id === chapter);
    if(i < 0) throw new Error('Missing chapter ' + chapter);
    const end = list[i+1]?.top ?? document.documentElement.scrollHeight-innerHeight;
    const y = list[i].top + (end-list[i].top)*p;
    v8qa.store.getState().setStoryPosition(chapter,p,y/Math.max(1,document.documentElement.scrollHeight-innerHeight),true);
    const smoother=v8qa.smoother.get();
    if(smoother) { smoother.scrollTop(y); const trigger=smoother.scrollTrigger; trigger.update(); const tween=trigger.getTween(); if(typeof tween?.progress === 'function') tween.progress(1).pause(); trigger.animation.progress(trigger.progress); }
    else scrollTo(0,y);
  },{chapter,p});
  await page.waitForTimeout(220);
}
export async function snapshot(page) {
  return page.evaluate(()=>{
    const s=v8qa.store.getState(), r=v8qa.root.getState(), arts=[], scene=r.scene;
    scene.traverse(o=>{if(o.name.includes('art')) arts.push({name:o.name,visible:o.visible,parent:o.parent?.visible,opacity:o.material?.opacity,loaded:!!o.material?.map?.image});});
    const boxes=[...document.querySelectorAll('[data-work-target]')].map(el=>{const b=el.getBoundingClientRect();return {id:el.dataset.workTarget,x:b.x,y:b.y,w:b.width,h:b.height};});
    return {chapter:s.storyChapter,p:s.chapterProgress,selection:s.worksSelection,hover:s.worksHover,focus:s.worksFocus,orbit:{...s.worksOrbit},camera:r.camera.position.toArray(),quaternion:r.camera.quaternion.toArray(),arts,
      width:innerWidth,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,boxes,
      active:document.activeElement.id,canvas:document.querySelectorAll('canvas').length,smoother:!!v8qa.smoother.get(),triggers:v8qa.trigger.getAll().length,
      resources:{...r.gl.info.memory},calls:r.gl.info.render.calls,y:v8qa.smoother.get()?.scrollTop()??scrollY,
      pool:{target:scene.getObjectByName('symbol-stars').userData.pool.target?.id??null,formation:scene.getObjectByName('symbol-stars').userData.pool.formation},
    };
  });
}
