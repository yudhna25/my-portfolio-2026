import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page = await browser.newPage({ viewport: {width:1440,height:900} });
await page.goto('http://127.0.0.1:5173/'); await page.waitForTimeout(4500);
const frames=[];
for(let i=0;i<60;i++) {
  await page.keyboard.press('Tab'); await page.waitForTimeout(250);
  const frame=await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e),r=e.getBoundingClientRect();let opacity=1;for(let p=e;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);return{tag:e.tagName,id:e.id,href:e.getAttribute('href'),label:e.getAttribute('aria-label')??e.textContent.trim().slice(0,55),type:e.type,section:e.closest('section,footer')?.id,outline:[s.outlineWidth,s.outlineStyle,s.outlineColor,s.outlineOffset],top:r.top,bottom:r.bottom,opacity,visibility:s.visibility,focusVisible:e.matches(':focus-visible')};});
  frames.push(frame);console.log(i,frame.label,frame.section,Math.round(frame.top),frame.opacity,frame.outline.join(' '));if(i>2&&frame.href==='#smooth-content'&&frame.label.includes('Chuyển'))break;
}
writeFileSync('outputs/task-4.4/probe-results.json',JSON.stringify(frames,null,2));await browser.close();
