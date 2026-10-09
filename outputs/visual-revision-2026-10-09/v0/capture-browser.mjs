// Output-only baseline harness; transient page state uses the existing producer contract.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.STELLAR_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href : 'playwright');
const out = 'outputs/visual-revision-2026-10-09/v0';
const base = process.argv[2] || 'http://127.0.0.1:5180';
fs.mkdirSync(`${out}/screenshots`, { recursive: true });
const report = { capturedAt: new Date().toISOString(), base, build: 'current source, Vite development server',
  browser: null, configurations: [], frames: [], comparisons: [], native: [], errors: [], warnings: [],
  limits: ['Mobile viewport/touch emulation on desktop, not a physical phone.',
    'Held poses synchronize visible DOM scroll and hold the existing store; native scroll is sampled separately.',
    'Camera and authored uniforms are compared at equal progress; ambient scene and wall-clock DOM reveals are not pixel-equality tests.',
    'No FPS/GPU benchmark, physical screen reader, OS motion toggle or public HTTPS verification.'] };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
report.browser = browser.version();
let context, page;
const save = () => fs.writeFileSync(`${out}/browser-results.json`, JSON.stringify(report, null, 2) + '\n');
async function setup(width, height) {
  context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 768, serviceWorkers: 'block', reducedMotion: 'no-preference' });
  page = await context.newPage();
  page.on('pageerror', error => report.errors.push({ width, type: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) report[message.type() === 'error' ? 'errors' : 'warnings'].push({ width, type: message.type(), message: message.text() });
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-galaxy-scene] canvas');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.waitForFunction(async () => {
    const url = performance.getEntriesByType('resource').map(entry => entry.name).find(url => url.includes('/@react-three_fiber.js'));
    if (!url) return false;
    const { _roots } = await import(url);
    return Boolean(_roots.get(document.querySelector('canvas'))?.store.getState().scene.getObjectByName('accretion-disk'));
  });
  await page.evaluate(async () => {
    const loaded = part => performance.getEntriesByType('resource').map(entry => entry.name).filter(url => url.includes(part)).at(-1);
    const fiber = await import(loaded('/@react-three_fiber.js'));
    const scroll = await import(loaded('/src/stores/useScrollStore.js'));
    const gsap = await import(loaded('/src/hooks/useGSAPSetup.js'));
    window.v0 = { fiber, scroll: scroll.useScrollStore, gsap,
      root: fiber._roots.get(document.querySelector('canvas')).store,
      ranges() {
        const content = document.getElementById('smooth-content');
        const top = content.getBoundingClientRect().top;
        const list = [...content.querySelectorAll('[data-story-chapter]')].map(element => ({ id: element.dataset.storyChapter, top: element.getBoundingClientRect().top - top })).sort((a,b) => a.top - b.top);
        for (let i=0;i<list.length;i++) list[i].end = list[i+1]?.top ?? document.documentElement.scrollHeight - innerHeight;
        return list;
      },
    };
  });
  await page.waitForTimeout(500);
  report.configurations.push(await page.evaluate(() => {
    const state = v0.root.getState(), gl = state.gl.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { width: innerWidth, height: innerHeight, devicePixelRatio, rendererDpr: state.gl.getPixelRatio(),
      drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], quality: document.querySelector('[data-galaxy-scene]').dataset.quality,
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      userAgent: navigator.userAgent, ranges: v0.ranges() };
  }));
}
async function seek(chapter, p) {
  await page.evaluate(({chapter,p}) => {
    const range = v0.ranges().find(range => range.id === (chapter === 'hero' ? 'portal' : chapter));
    const y = range.top + (range.end-range.top) * p;
    const smoother = v0.gsap.ScrollSmoother.get();
    v0.scroll.getState().setStoryPosition(chapter, p, y / Math.max(1, document.documentElement.scrollHeight-innerHeight), true);
    if (smoother) {
      smoother.scrollTop(y);
      const trigger = smoother.scrollTrigger;
      trigger.update();
      const tween = trigger.getTween();
      if (typeof tween?.progress === 'function') tween.progress(1).pause();
      trigger.animation.progress(trigger.progress);
    } else window.scrollTo(0,y);
  }, {chapter,p});
  await page.waitForTimeout(chapter === 'about' ? 1100 : 220);
}
async function read() {
  return page.evaluate(() => {
    const state = v0.scroll.getState(), frame = v0.root.getState();
    const uniforms = frame.scene.getObjectByName('accretion-disk').material.uniforms;
    const copy = {};
    for (const key of ['uPortalMini','uPortalVisibility','uPortalScale','uPortalPull','uFinaleHole','uFinaleOrigin','uFinaleGas']) {
      const value = uniforms[key].value;
      copy[key] = typeof value === 'number' ? value : value.toArray();
    }
    const rect = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect(), css = getComputedStyle(element);
      return { x: box.x, y: box.y, width: box.width, height: box.height, opacity: css.opacity, visibility: css.visibility,
        inert: element.inert, ariaHidden: element.getAttribute('aria-hidden') };
    };
    return { chapter: state.storyChapter, p: state.chapterProgress, manual: state.storyManual, section: state.currentSection,
      canvasCount: document.querySelectorAll('canvas').length,
      pose: [...frame.camera.position.toArray(), ...frame.camera.quaternion.toArray(), frame.camera.fov], uniforms: copy,
      orbit: {...state.worksOrbit}, selection: state.worksSelection, finaleSelection: state.worksFinaleSelection,
      worksTransforms: ['edura','veris','vie'].map(id => {
        const group = frame.scene.getObjectByName(`works-${id}`);
        return {id,position:group.position.toArray(),scale:group.scale.toArray()};
      }),
      anchor: state.storyAnchor, scroll: v0.gsap.ScrollSmoother.get()?.scrollTop() ?? scrollY,
      reading: rect('[data-story-content]'), about: rect('#about'), hero: rect('[data-portal-stage]'),
      contact: rect('[data-contact-content]'), works: rect('[data-work-background]'),
      overflow: document.documentElement.scrollWidth-innerWidth,
      scene: { geometries: frame.gl.info.memory.geometries, textures: frame.gl.info.memory.textures,
        meteorVisible: frame.scene.getObjectByName('story-meteor')?.visible,
        symbolCount: frame.scene.getObjectByName('symbol-pool')?.geometry.attributes.position.count },
    };
  });
}
async function capture(label, chapter, p, direction = 'baseline') {
  await seek(chapter,p);
  const state = await read();
  assert.equal(state.canvasCount,1);
  assert.equal(state.chapter,chapter);
  assert.equal(state.p,p);
  assert(state.pose.every(Number.isFinite));
  const viewport = page.viewportSize();
  const file = `${out}/screenshots/${viewport.width}-${label}.png`;
  await page.screenshot({path:file,fullPage:false});
  report.frames.push({label,direction,viewport,file,...state});
  save();
  console.log(`${viewport.width} ${label}: ${chapter} ${p} reading=${state.reading.visibility}/${state.reading.inert}`);
  return state;
}
try {
  const mobileOnly = process.argv.includes('--mobile-only');
  if (mobileOnly) {
    const previous = JSON.parse(fs.readFileSync(`${out}/browser-results.json`, 'utf8'));
    Object.assign(report, previous);
    delete report.failure;
    report.configurations = report.configurations.filter(item=>item.width !== 390);
    report.warnings = report.warnings.filter(item=>item.width !== 390);
  } else {
  await setup(1440,900);
  for (const [chapter,p] of [['hero',0],['about',0],['education',0.12],['experience',0.32],['works',0.2],['contact',0]]) {
    await capture(chapter,chapter,p);
  }
  await seek('education',0.12);
  await page.locator('[data-education-item="saigonUniversity"]').hover();
  await page.waitForTimeout(1600);
  const schoolFile = `${out}/screenshots/1440-education-active-sgu.png`;
  await page.screenshot({path:schoolFile});
  report.frames.push({label:'education-active-sgu',file:schoolFile,...await read()});
  await seek('works',0.2);
  await page.locator('#work-target-edura').click();
  await page.waitForTimeout(600);
  const workFile = `${out}/screenshots/1440-works-active-edura.png`;
  await page.screenshot({path:workFile});
  report.frames.push({label:'works-active-edura',file:workFile,...await read()});
  for (const chapter of ['portal','finale']) {
    const states = new Map();
    for (const p of [0,0.25,0.5,0.75,1]) states.set(p,await capture(`${chapter}-fwd-${p}`,chapter,p,'forward'));
    for (const p of [1,0.75,0.5,0.25,0]) {
      const back = await capture(`${chapter}-rev-${p}`,chapter,p,'reverse');
      const forward = states.get(p);
      assert.deepEqual(back.pose,forward.pose);
      const differences = Object.keys(back.uniforms).filter(key => JSON.stringify(back.uniforms[key])!==JSON.stringify(forward.uniforms[key]));
      // Origin is captured after finale p=0; its gas contribution is zero at that boundary.
      const inactiveDifference = chapter === 'finale' && p === 0 && differences.every(key=>key==='uFinaleOrigin');
      assert(differences.length === 0 || inactiveDifference, `Authored uniform mismatch: ${differences.join(',')}`);
      if (chapter === 'finale') assert.deepEqual(back.worksTransforms,forward.worksTransforms);
      report.comparisons.push({chapter,p,poseEqual:true,activeUniformsEqual:true,rawUniformDifferences:differences,
        worksTransformsEqual:chapter==='finale' ? true : null,readingEqual:JSON.stringify(back.reading)===JSON.stringify(forward.reading),
        readingGateEqual:['opacity','visibility','inert','ariaHidden'].every(key=>back.reading[key]===forward.reading[key]),
        maxReadingRectDelta:Math.max(...['x','y','width','height'].map(key=>Math.abs(back.reading[key]-forward.reading[key])))});
    }
  }
  await seek('portal',0.25);
  await page.evaluate(() => v0.scroll.getState().setStoryManual(false));
  for (const delta of [220,-220]) {
    await page.mouse.wheel(0,delta);
    await page.waitForTimeout(1800);
    const state = await read();
    assert.equal(state.manual,false);
    report.native.push({delta,...state});
  }
  await context.close();
  }
  await setup(390,844);
  for (const [chapter,p] of [['hero',0],['about',0],['education',0.12],['experience',0.32],['works',0.2],['contact',0]]) await capture(chapter,chapter,p);
  report.status = report.errors.length ? 'captured-with-errors' : 'captured';
} catch (error) {
  report.status = 'partial'; report.failure = error.stack; process.exitCode = 1;
} finally {
  save(); await browser.close();
  console.log(JSON.stringify({status:report.status,frames:report.frames.length,comparisons:report.comparisons.length,native:report.native.length,errors:report.errors.length,warnings:report.warnings.length,failure:report.failure?.split('\n')[0]}));
}
