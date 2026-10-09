import {chromium} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {portalState} from '../../../src/3d/utils/portal.js';
const results=[];
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://127.0.0.1:5173/#skills');await p.waitForTimeout(3400);
await p.evaluate(async()=>{const r=performance.getEntriesByType('resource').map(x=>x.name),url=n=>r.filter(u=>u.includes(n)).at(-1);window.qa={...(await import(url('/src/hooks/useGSAPSetup.js'))),...(await import(url('/src/stores/useScrollStore.js'))),i18n:(await import(url('/src/i18n/config.js'))).default};});
async function log(n,expected=0){const s=await p.evaluate(()=>{const el=document.querySelector('[data-portal-stage]');return{opacity:getComputedStyle(el).opacity,aria:el.getAttribute('aria-hidden'),chapter:qa.useScrollStore.getState().storyChapter};});assert(Math.abs(Number(s.opacity)-expected)<.00001,n);results.push({label:n,...s,expected});}
await log('initial');await p.setViewportSize({width:390,height:844});await p.waitForTimeout(500);await log('resize390');await p.evaluate(()=>qa.i18n.changeLanguage('en'));await p.waitForTimeout(400);await log('en');await p.evaluate(()=>qa.i18n.changeLanguage('vi'));await p.waitForTimeout(400);await log('vi');await p.mouse.wheel(0,100);await p.waitForTimeout(1600);await log('nativeWheel');
for(const progress of [0,.2,.35,.43,1,.35,0]){await p.evaluate(value=>qa.useScrollStore.getState().setStoryPosition('portal',value),progress);await p.waitForTimeout(70);await log('portal-'+progress,portalState(progress).textOpacity);}
writeFileSync('outputs/redesign/r4.2/hero-regression.json',JSON.stringify({status:'PASS',results},null,2));console.log('PASS Hero locale/resize/native + portal forward/reverse',results.length);await b.close();
