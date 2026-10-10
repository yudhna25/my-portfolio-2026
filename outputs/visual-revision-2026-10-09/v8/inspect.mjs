import {chromium,base,out} from './browser-common.mjs';import fs from 'node:fs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage();await page.goto(base);await page.waitForTimeout(4500);
const result=await page.evaluate(async()=>{
 const c=document.querySelector('canvas'); const chain=[];
 let f=c?.[Object.keys(c).find(k=>k.startsWith('__reactFiber$'))];
 while(f){const hooks=[];let h=f.memoizedState,n=0;while(h&&n++<70){const v=h.memoizedState;hooks.push({type:typeof v,keys:v&&typeof v==='object'?Object.keys(v).slice(0,15):[],current:v?.current&&typeof v.current==='object'?Object.keys(v.current).slice(0,40):typeof v?.current});h=h.next;}chain.push({name:f.type?.name,tag:f.tag,hooks});f=f.return;}
 const modules=[];for(const url of [...new Set(performance.getEntriesByType('resource').map(e=>e.name).filter(url=>/\/assets\/.*\.js$/.test(url)&&!/\/assets\/(index|lab)-/.test(url)))]){const m=await import(url);modules.push({url,keys:Object.entries(m).map(([k,v])=>({k,type:typeof v,name:v?.name,state:typeof v?.getState==='function'?Object.keys(v.getState()):null,map:v instanceof Map,getAll:!!v?.getAll,scrollTop:!!v?.prototype?.scrollTop}))});}
 return{canvas:!!c,chain,modules};
});fs.writeFileSync(out+'/inspect.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
