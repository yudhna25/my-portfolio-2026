import fs from 'node:fs';
import { chromium,base,out,ready,seek,snapshot } from './browser-common.mjs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.stack));
try {
 await page.goto(base);await ready(page);await seek(page,'works',.3);
 const result=await snapshot(page);console.log(JSON.stringify(result));
 await page.screenshot({path:out+'/smoke.png'});fs.writeFileSync(out+'/smoke.json',JSON.stringify({result,errors},null,2));
}finally{await browser.close()}
