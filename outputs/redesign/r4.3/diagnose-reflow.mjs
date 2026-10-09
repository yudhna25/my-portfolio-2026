// Focus reflow diagnostic, reusing the real Browser harness; not a second App.
import { readFileSync } from 'node:fs';
let harness = readFileSync(new URL('./verify-browser.mjs', import.meta.url), 'utf8').split('\ntry {')[0];
harness += `
try {
  const context = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page = await context.newPage(); await init(page); await position('arenaMultimedia');
  await page.keyboard.press('Tab'); await page.locator('[data-education-item="arenaMultimedia"]').focus(); await page.waitForTimeout(200);
  await page.evaluate(() => {
    window.qa.events = [];
    const record = (source, detail={}) => {
      const story = qa.useScrollStore.getState(), state = qa.useEducationStore.getState();
      const stage = document.querySelector('[data-education-stage="arenaMultimedia"]').getBoundingClientRect();
      const content=document.querySelector('#smooth-content'),base=content.getBoundingClientRect().top;
      qa.events.push({time:performance.now(),source,detail,chapter:story.storyChapter,p:story.chapterProgress,manual:story.storyManual,
        channels:[state.hover,state.focus,state.selection],visible:state.visible,anchorId:state.anchorId,domFocus:document.activeElement.dataset.educationItem,
        viewport:[innerWidth,innerHeight],stage:[stage.x,stage.y,stage.width,stage.height],nativeY:scrollY,smoothY:qa.ScrollSmoother.get()?.scrollTop(),
        ranges:[...content.querySelectorAll('[data-story-chapter]')].map(e=>({id:e.dataset.storyChapter,top:e.getBoundingClientRect().top-base})),stack:new Error().stack});
    };
    let story = qa.useScrollStore.getState().storyChapter;
    qa.useScrollStore.subscribe(state => {if(state.storyChapter!==story){story=state.storyChapter;record('chapter');}});
    qa.useEducationStore.subscribe(()=>record('education'));
    const original=qa.useScrollStore.getState().setStoryPosition;
    qa.useScrollStore.setState({setStoryPosition:(...args)=>{if(args[0]!==qa.useScrollStore.getState().storyChapter)record('setStoryPosition',{args});return original(...args);}});
    window.addEventListener('resize',()=>record('resize'));
    qa.record=record;
    record('start');
  });
  await snap('initial');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);await snap('reduced');
  await page.evaluate(()=>qa.i18n.changeLanguage('en'));await page.waitForTimeout(150);await snap('en-only');
  await page.evaluate(()=>qa.record('before-width'));await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await snap('mobile-before-position');
  await position('arenaMultimedia');await snap('mobile-after-position');
  const events=await page.evaluate(()=>qa.events);writeFileSync(out+'reflow-diagnostic.json',JSON.stringify({results,events,errors,warnings:[...new Set(warnings)]},null,2));
  console.log(JSON.stringify(events,null,2));await context.close();
}finally{await browser.close();}
`;
await import('data:text/javascript;base64,' + Buffer.from(harness).toString('base64'));
