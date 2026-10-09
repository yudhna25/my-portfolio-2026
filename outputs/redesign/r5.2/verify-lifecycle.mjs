import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

// Output-only instrumentation: reuse the existing fixture, real App and StrictMode.
const output = 'outputs/redesign/r5.2/lifecycle-results.json';
const results = { fixture: 'outputs/redesign/r4.2/lifecycle.html', viewport: { width: 1440, height: 900 }, cycles: [], errors: [], warnings: [], status: 'running' };
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const page = await browser.newPage({ viewport: results.viewport });
page.on('pageerror', error => results.errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') results.errors.push(message.text());
  if (message.type() === 'warning') results.warnings.push(message.text());
});

try {
  await page.goto('http://127.0.0.1:5173/outputs/redesign/r4.2/lifecycle.html#work');
  await page.waitForTimeout(3500);
  // Fixture's initial mount is setup only; wrap store subscriptions while empty.
  await page.evaluate(() => window.unmountApp());
  await page.waitForTimeout(800);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(entry => entry.name);
    const loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const { _roots } = await import(loaded('/@react-three_fiber.js'));
    const { ScrollSmoother, ScrollTrigger } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const stores = {}, storeCounts = {};
    for (const url of new Set(urls.filter(url => /\/src\/stores\/use[^/]+Store\.js/.test(url)))) {
      const module = await import(url);
      for (const [name, store] of Object.entries(module)) {
        if (typeof store !== 'function' || typeof store.getState !== 'function' || typeof store.subscribe !== 'function') continue;
        stores[name] = store;
        const original = store.subscribe;
        // Bound Zustand hooks close over api.subscribe. Wrapping hook.subscribe
        // alone misses React subscriptions. Capture the actual listener Set with
        // one synchronous probe, then restore Set.prototype before any mounting.
        const probe = () => {};
        const add = Set.prototype.add;
        let listeners;
        try {
          Set.prototype.add = function (value) {
            if (value === probe) listeners = this;
            return add.call(this, value);
          };
          original(probe)();
        } finally { Set.prototype.add = add; }
        if (!listeners) throw new Error(`Cannot inspect listener Set for ${name}`);
        Object.defineProperty(storeCounts, name, { enumerable: true, get: () => listeners.size });
      }
    }
    window.qa = { roots: _roots, ScrollSmoother, ScrollTrigger, stores, storeCounts, moduleStoreSubscribers: { ...storeCounts } };
  });
  results.instrumentedStores = await page.evaluate(() => Object.keys(window.qa.stores));
  results.moduleStoreSubscribers = await page.evaluate(() => window.qa.moduleStoreSubscribers);
  results.baselineNote = 'useLangStore has one module-lifetime store→i18n sync listener from src/i18n/config.js:19, retained until HMR module disposal. App-owned subscriptions must return to zero; total subscriptions must return exactly to this pre-mount baseline.';
  assert(results.instrumentedStores.includes('useScrollStore'));

  for (let cycle = 1; cycle <= 3; cycle++) {
    await page.evaluate(() => window.mountApp());
    await page.waitForTimeout(1800);
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      const fiber = canvas && window.qa.roots.get(canvas)?.store.getState();
      return !!fiber?.scene.getObjectByName('story-meteor') && !!fiber.scene.getObjectByName('works-constellations');
    });
    await page.evaluate(() => {
      const state = window.qa.stores.useScrollStore.getState();
      state.setStoryPosition('works', 0.5, state.scrollProgress, true);
    });
    await page.waitForTimeout(350);
    const mounted = await page.evaluate(() => {
      const fiber = window.qa.roots.get(document.querySelector('canvas')).store.getState();
      const record = name => {
        const root = fiber.scene.getObjectByName(name);
        const geometries = new Set(), materials = new Set();
        root.traverse(object => {
          if (object.geometry) geometries.add(object.geometry);
          if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        });
        const events = { geometries: 0, materials: 0 };
        const seen = { geometries: new Set(), materials: new Set() };
        for (const [type, resources] of Object.entries({ geometries, materials })) for (const item of resources) {
          item.addEventListener('dispose', () => { events[type]++; seen[type].add(item); });
        }
        return { root, geometries, materials, events, seen };
      };
      const meteor = record('story-meteor'), works = record('works-constellations');
      window.qa.resources = { fiber, meteor, works };
      const state = window.qa.stores.useScrollStore.getState();
      const trail = meteor.root.getObjectByName('story-meteor-trail'), head = meteor.root.getObjectByName('story-meteor-head');
      return {
        counts: { meteor: { geometries: meteor.geometries.size, materials: meteor.materials.size }, works: { geometries: works.geometries.size, materials: works.materials.size } },
        canvas: document.querySelectorAll('canvas').length,
        frameSubscribers: fiber.internal.subscribers.length,
        storeSubscribers: { ...window.qa.storeCounts },
        appStoreSubscribers: Object.fromEntries(Object.entries(window.qa.storeCounts).map(([name, count]) => [name, count - window.qa.moduleStoreSubscribers[name]])),
        triggers: window.qa.ScrollTrigger.getAll().length,
        smoother: !!window.qa.ScrollSmoother.get(),
        memory: { ...fiber.gl.info.memory },
        story: { chapter: state.storyChapter, progress: state.chapterProgress },
        works: { visible: works.root.visible, groups: works.root.children.length, phase: state.worksOrbit.phase },
        meteor: {
          visible: meteor.root.visible,
          finite: [...trail.geometry.attributes.position.array].every(Number.isFinite),
          uniforms: { trailOpacity: trail.material.uniforms.uOpacity.value, headOpacity: head.material.uniforms.uOpacity.value, trailDpr: trail.material.uniforms.uPixelRatio.value, headDpr: head.material.uniforms.uPixelRatio.value },
          headMatchesTrail: [0, 1, 2].every(i => head.geometry.attributes.position.array[i] === trail.geometry.attributes.position.array[i]),
        },
      };
    });
    assert.deepEqual(mounted.counts.meteor, { geometries: 2, materials: 2 });
    assert.deepEqual(mounted.counts.works, { geometries: 7, materials: 7 });
    assert.equal(mounted.canvas, 1);
    assert.equal(mounted.works.visible, true);
    assert.equal(mounted.works.groups, 4);
    assert(Number.isFinite(mounted.works.phase));
    assert.equal(mounted.story.chapter, 'works');
    assert.equal(mounted.meteor.visible, false);
    assert.equal(mounted.meteor.finite, true);
    assert.equal(mounted.meteor.headMatchesTrail, true);
    assert.equal(mounted.meteor.uniforms.headOpacity, 0);
    assert.equal(mounted.meteor.uniforms.headOpacity, mounted.meteor.uniforms.trailOpacity);
    assert.equal(mounted.meteor.uniforms.headDpr, mounted.meteor.uniforms.trailDpr);
    await page.evaluate(() => {
      const state = window.qa.stores.useScrollStore.getState();
      state.setStoryPosition('departure', 0.6, state.scrollProgress, true);
    });
    await page.waitForTimeout(250);
    const departure = await page.evaluate(() => {
      const { meteor, works } = window.qa.resources;
      const state = window.qa.stores.useScrollStore.getState();
      return { chapter: state.storyChapter, progress: state.chapterProgress, meteorVisible: meteor.root.visible, worksVisible: works.root.visible, strengths: works.root.children.slice(0, 3).map(group => group.children[1].material.uniforms.uStrength.value) };
    });
    assert.equal(departure.chapter, 'departure');
    assert.equal(departure.meteorVisible, true);
    assert.equal(departure.worksVisible, true);
    assert(departure.strengths.every(value => value > 0 && value < 1));
    await page.evaluate(() => window.unmountApp());
    await page.waitForTimeout(900);
    const unmounted = await page.evaluate(() => {
      const { fiber, meteor, works } = window.qa.resources;
      const disposed = group => ({ events: { ...group.events }, unique: { geometries: group.seen.geometries.size, materials: group.seen.materials.size }, all: group.seen.geometries.size === group.geometries.size && group.seen.materials.size === group.materials.size });
      return {
        disposed: { meteor: disposed(meteor), works: disposed(works) },
        canvas: document.querySelectorAll('canvas').length,
        frameSubscribers: fiber.internal.subscribers.length,
        storeSubscribers: { ...window.qa.storeCounts },
        appStoreSubscribers: Object.fromEntries(Object.entries(window.qa.storeCounts).map(([name, count]) => [name, count - window.qa.moduleStoreSubscribers[name]])),
        triggers: window.qa.ScrollTrigger.getAll().length,
        smoother: !!window.qa.ScrollSmoother.get(),
        memory: { ...fiber.gl.info.memory },
      };
    });
    const entry = { cycle, mounted, departure, unmounted };
    results.cycles.push(entry);
    assert.equal(unmounted.canvas, 0);
    assert.equal(unmounted.frameSubscribers, 0);
    assert.equal(unmounted.triggers, 0);
    assert.equal(unmounted.smoother, false);
    assert.deepEqual(unmounted.storeSubscribers, results.moduleStoreSubscribers);
    assert(Object.values(unmounted.appStoreSubscribers).every(count => count === 0));
    assert.equal(unmounted.disposed.meteor.all, true);
    assert.equal(unmounted.disposed.works.all, true);
    assert.deepEqual(unmounted.disposed.meteor.unique, { geometries: 2, materials: 2 });
    assert.deepEqual(unmounted.disposed.works.unique, { geometries: 7, materials: 7 });
    if (cycle > 1) {
      const baseline = results.cycles[0].mounted;
      assert.deepEqual(mounted.counts, baseline.counts);
      assert.equal(mounted.frameSubscribers, baseline.frameSubscribers);
      assert.equal(mounted.triggers, baseline.triggers);
      assert.deepEqual(mounted.storeSubscribers, baseline.storeSubscribers);
    }
  }
  assert.deepEqual(results.errors, []);
  results.status = 'pass';
  console.log('PASS: 3 real App StrictMode lifecycle cycles; all tracked meteor/Works resources disposed; Canvas/frame/App-owned store/trigger/Smoother cleanup zero. One pre-existing module i18n listener retained at baseline.');
} catch (error) {
  results.status = 'fail';
  results.failure = error.stack;
  throw error;
} finally {
  results.warnings = [...new Set(results.warnings)];
  writeFileSync(output, JSON.stringify(results, null, 2));
  await browser.close();
}

