import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'msedge',headless:true});
for(const [width,height] of [[320,568],[1440,900]]) {
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:5181');
  await page.waitForFunction(()=>document.querySelector('[data-portal-stage]')?.dataset.heroIdle==='true');
  await page.waitForTimeout(1500);
  await page.screenshot({path:`outputs/visual-revision-2026-10-09/v1/year-stars/first-${width}.png`});
  console.log(await page.evaluate(()=>({meteors:document.querySelectorAll('[data-year-meteor]').length,stars:document.querySelectorAll('[data-year-twinkle] circle').length,svg:document.querySelector('.hero-year-svg').getBoundingClientRect().toJSON(),circles:[...document.querySelectorAll('[data-year-twinkle]')].map(x=>getComputedStyle(x).opacity)})));
  await page.close();
}
await browser.close();
