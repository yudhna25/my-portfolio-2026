import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,edge,base,out,sha,ready,scrollChapter,selectWork,capture,save} from './common.mjs';
const build=JSON.parse(fs.readFileSync(out+'/build-source.json','utf8'));
for(const [f,h] of Object.entries(build.source))assert.equal(sha(f),h,f);
const report={checks:0,poses:[],core:[],holds:[],errors:[],warnings:[]};
const check=(ok,msg)=>{report.checks++;assert(ok,msg)};
const browser=await chromium.launch({executablePath:edge,headless:true});
async function observe(page){await page.evaluate(()=>{
 const r=motionQA.root.getState(),render=r.gl.render,probe={target:null,passes:0};
 r.gl.render=function(scene,camera){if(scene.children.some(n=>n.material?.uniforms?.uObserver)){probe.target=this.getRenderTarget();probe.uniforms=scene.children.find(n=>n.material?.uniforms?.uObserver).material.uniforms;probe.passes++}return render.call(this,scene,camera)};
 window.finaleProbe=probe;
});}
async function pose(page){return page.evaluate(()=>{
 const r=motionQA.root.getState(),s=motionQA.store.getState(),u=r.scene.getObjectByName('accretion-disk').material.uniforms;
 const particles=r.scene.getObjectByName('finale-particles'),works=r.scene.getObjectByName('works-constellations'),panel=document.querySelector('[data-contact-content]');
 return {width:innerWidth,chapter:s.storyChapter,p:s.chapterProgress,orbit:{...s.worksOrbit},selection:s.worksSelection,hover:s.worksHover,
 camera:r.camera.position.toArray(),quaternion:r.camera.quaternion.toArray(),center:u.uRayCenter.value.toArray(),scale:u.uFinaleScale.value,enabled:u.uFinaleEnabled.value,gas:u.uFinaleGas.value.toArray(),hole:u.uFinaleHole.value,time:finaleProbe.uniforms.uTime.value,
 figures:works.children.filter(n=>/^works-(edura|veris|vie)$/.test(n.name)).map(n=>({name:n.name,position:n.position.toArray(),scale:n.scale.toArray()})),
 particles:{visible:particles.visible,phase:particles.material.uniforms.uPhase.value.toArray(),origin:particles.material.uniforms.uOrigin.value,seeds:[...particles.geometry.attributes.position.array.slice(0,24)],count:particles.geometry.attributes.position.count},
 panel:{opacity:+getComputedStyle(panel).opacity,inert:panel.inert,visible:getComputedStyle(panel).visibility,gradient:getComputedStyle(panel).backgroundImage},
 canvas:document.querySelectorAll('canvas').length,overflow:document.documentElement.scrollWidth-innerWidth,gl:r.gl.getContext().getError(),resources:{...r.gl.info.memory},subscribers:r.internal.subscribers.length,passes:finaleProbe.passes,
 height:document.querySelector('[data-story-chapter="finale"]').getBoundingClientRect().height,
 target:finaleProbe.target?{width:finaleProbe.target.width,height:finaleProbe.target.height}:null};
});}
async function core(page,label){const value=await page.evaluate(()=>{
 const r=motionQA.root.getState(),target=finaleProbe.target,u=r.scene.getObjectByName('accretion-disk').material.uniforms,half=n=>{const e=n>>10&31,m=n&1023;return (n&32768?-1:1)*(e===0?m*2**-24:e===31?Infinity:(1+m/1024)*2**(e-15))};
 const x=Math.round(u.uRayCenter.value.x*target.width),pixels=new Uint16Array(target.height*4);r.gl.readRenderTargetPixels(target,x,0,1,target.height,pixels);
 const core=[],lit=[];let finite=true,mono=true;
 for(let y=0;y<target.height;y++){const a=[...pixels.slice(y*4,y*4+4)].map(half);finite&&=a.every(Number.isFinite);mono&&=a[0]===a[1]&&a[1]===a[2];if(a[3]>.97&&a[0]<.0001)core.push(y);if(a[0]>.05)lit.push(y)}
 const runs=[];for(const y of core){if(!runs.length||y>runs.at(-1).at(-1)+1)runs.push([]);runs.at(-1).push(y)}
 const broad=runs.filter(run=>run.length>=target.height*.01).flat();
 const frames=finaleProbe.passes;
 return {width:innerWidth,height:innerHeight,dpr:r.gl.getPixelRatio(),target:[target.width,target.height],x,coreBounds:[broad[0],broad.at(-1)],capturedRuns:runs.map(run=>[run[0],run.at(-1)]),diameterFraction:broad.length?(broad.at(-1)-broad[0]+1)/target.height:0,finite,mono,litPixels:lit.length,passes:frames};
 });value.label=label;report.core.push(value);check(value.finite&&value.mono,'HDR finite mono '+label);check(value.diameterFraction>=.5&&value.diameterFraction<=.6,'Actual core 50–60vh '+JSON.stringify(value));return value;}
function delta(a,b){if(typeof a==='number')return Math.abs(a-b);if(a===null||typeof a!=='object')return a===b?0:Infinity;return Math.max(0,...Object.keys(a).map(k=>delta(a[k],b[k])))}
function story(s){return {p:s.p,camera:s.camera,quaternion:s.quaternion,center:s.center,scale:s.scale,gas:s.gas,hole:s.hole,figures:s.figures,particlePhase:s.p>.445&&s.p<.955?s.particles.phase:null,origin:s.orbit.origin,selection:s.selection}}
try{
 for(const width of [1920]){
 const page=await browser.newPage({viewport:{width,height:900},hasTouch:width===390,serviceWorkers:'block'});page.on('pageerror',e=>report.errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())});
 await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);await observe(page);
 const year=await page.locator('.hero-year-base').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).stroke));check(year.length>0&&year.every(c=>c==='none'),'Continuous year outline removed');
 await capture(page,'hero-no-outline-'+width);await scrollChapter(page,'works',.3);await selectWork(page,'edura',width===390);await page.mouse.move(2,880);
 const checkpoints=[0,.12,.34,.439,.44,.441,.5,.56,.62,.68,.70,.74,.78,.80,.86,.92,.96,.999];const forward=new Map();let origin;
 for(const direction of ['forward','reverse'])for(const p of direction==='forward'?checkpoints:[...checkpoints].reverse()){
  await scrollChapter(page,'finale',p);const s=await pose(page);report.poses.push({direction,requested:p,...s});
  check(s.canvas===1&&s.gl===0&&s.overflow===0,'One valid canvas '+width+'/'+p);check(Math.abs(s.height-3600)<1,'400vh');
  if(p>.001){origin??=s.orbit.origin;check(s.orbit.origin===origin,'Orbit origin fixed')}
  check(s.selection==='edura','Selection survives');check(s.panel.inert,'Finale Contact inert');check(s.p>.96||s.panel.opacity<.0001,'Contact waits for .96');
  if(direction==='forward'){forward.set(p,story(s));if([0,.12,.34,.44,.5,.56,.62,.68,.70,.74,.78,.80,.86,.92,.96,.999].includes(p))await capture(page,'finale-'+p+'-'+width)}else{const a=story(s),b=forward.get(p);const error=delta(a,b);report.maxNativePoseDelta=Math.max(report.maxNativePoseDelta||0,error);const progressError=Math.abs(s.p-b.p);report.maxNativeProgressDelta=Math.max(report.maxNativeProgressDelta||0,progressError);check(progressError<.0003&&(p===0||a.origin===b.origin)&&a.selection===b.selection,'Native reverse returns to same scroll pixel '+width+'/'+p);if(p>0&&progressError<1e-10)check(error<1e-8,'Exact progress produces exact pose');}
  if(direction==='forward'&&p===.96)await core(page,'formed-'+width);
 }
 await scrollChapter(page,'finale',.58);const before=await pose(page);await page.waitForTimeout(1300);const after=await pose(page);report.holds.push({width,before,after});check(delta(story(before),story(after))<.02,'Hold freezes explosion after native settling');
 for(const p of [.9,.2,.82,.44,.7,.34,.96]){await scrollChapter(page,'finale',p);const s=await pose(page);check(s.orbit.origin===origin&&s.gl===0,'Jump keeps origin and valid render')}
 await scrollChapter(page,'contact',0);const contact=await pose(page);check(!contact.panel.inert&&contact.panel.opacity===1,'Contact readable and interactive');await core(page,'contact-'+width);await capture(page,'contact-'+width);
 const action=page.locator('[data-contact-email]');await action.focus();check(await action.evaluate(n=>n===document.activeElement&&n.getAttribute('href').startsWith('mailto:')),'Contact email keyboard accessible');
 await scrollChapter(page,'finale',.82);const old=await pose(page);await page.evaluate(()=>motionQA.i18n.changeLanguage('en'));await page.waitForTimeout(900);await scrollChapter(page,'finale',.82);const english=await pose(page);check(english.orbit.origin===origin&&JSON.stringify(old.camera)===JSON.stringify(english.camera),'Locale preserves center/orbit');await scrollChapter(page,'contact',0);await capture(page,'contact-en-'+width);
 await page.evaluate(()=>motionQA.i18n.changeLanguage('vi'));await page.waitForTimeout(600);
 for(const p of [0,.25,.44,.47,.50,.70,.94,.999]){await scrollChapter(page,'portal',p);const s=await pose(page);check(s.enabled===0&&s.scale===1&&s.canvas===1&&s.gl===0,'V3 shared pipeline isolated');if([.25,.47,.70].includes(p))await capture(page,'portal-regression-'+p+'-'+width)}
 await page.close();console.log('Verified width '+width);
 }
 check(!report.errors.length,'No browser errors');report.status='pass';
}catch(e){report.status='fail';report.failure=e.stack;console.error(e.stack);process.exitCode=1;const page=browser.contexts().flatMap(c=>c.pages()).at(-1);if(page){report.failurePose=await pose(page).catch(()=>null);await capture(page,'v9-failure').catch(()=>{})}}
finally{save('browser-results-1920.json',report);await browser.close()}
console.log(JSON.stringify({status:report.status,checks:report.checks,core:report.core}));
