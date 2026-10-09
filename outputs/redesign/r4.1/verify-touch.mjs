import { readFileSync } from 'node:fs';

// Reuse the same scene/anchor assertions in a fresh, native-scroll touch context.
let harness = readFileSync(new URL('./verify-browser.mjs', import.meta.url), 'utf8').split('try {\n  await init();')[0];
harness = harness.replace('deviceScaleFactor: 1 });', 'deviceScaleFactor: 1, hasTouch: true });');
harness = harness.replace("const out = new URL('./', import.meta.url);", `const out = new URL(${JSON.stringify(new URL('./', import.meta.url).href)});`);
harness += `try {
  await page.setViewportSize({width:390,height:844}); await init(); await seek('skills');
  await page.locator('[data-symbol-choice="figma"]').tap(); await page.waitForTimeout(1600);
  assert.equal((await snapshot('native touch select')).target,'figma');
  await page.locator('[data-symbol-choice="figma"]').tap(); await page.waitForTimeout(1400);
  assert.equal((await snapshot('native touch deselect')).baseError,0);
  for(let i=0;i<12;i++){await page.locator('[data-symbol-choice="'+['photoshop','ai','premiere-pro'][i%3]+'"]').tap();}
  await page.waitForTimeout(1600); assert.equal((await snapshot('12 rapid touch swaps')).target,'premiere-pro');
  await page.keyboard.press('Escape'); await page.waitForTimeout(1400); assert.equal((await snapshot('touch Esc clears')).baseError,0);
  await page.locator('[data-symbol-choice="ai"]').tap();await page.waitForTimeout(1600);await shot('390-native-ai');
  await page.locator('[data-symbol-anchor="skills"]').tap();await page.waitForTimeout(1400);assert.equal((await snapshot('touch background clears')).baseError,0);
  await seek('education');await page.locator('[data-symbol-choice="greenAcademy"]').tap();await page.waitForTimeout(1600);
  assert.equal((await snapshot('touch Telescopium')).renderedEdges,1);await shot('390-native-education');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);
  const first=await snapshot('touch reduced');await page.waitForTimeout(250);const second=await snapshot('touch reduced holds');
  assert.equal(first.positionVersion,second.positionVersion);assert.equal(first.smoothDuration,0);
  assert.equal(errors.length,0);writeFileSync(path('touch-results.json'),JSON.stringify({status:'pass',date:new Date().toISOString(),results,errors,warnings},null,2));
  console.log(JSON.stringify({status:'pass',records:results.length,errors},null,2));
} finally {await context.tracing.stop({path:path('touch-trace.zip')});await browser.close();}`;
await import('data:text/javascript;base64,' + Buffer.from(harness).toString('base64'));
