import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const url = 'https://www.behance.net/gallery/241524417/Edura-LMS';
const result = { requestedUrl:url, projectId:'241524417', checkedAt:new Date().toISOString(), webReader:{status:'cache-miss',ref:'turn56view0'}, errors:[], galleryVerified:false, usableModuleUrls:[], usableWalkthroughUrls:[] };
const browser = await chromium.launch({ executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true });
try {
  result.browser=browser.version();
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const projectRequests=new Set();
  page.on('request',req=>{if(req.url().includes('241524417'))projectRequests.add(req.url());});
  page.on('pageerror',err=>result.errors.push(String(err)));
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  result.httpStatus=response?.status()??null;
  await page.waitForTimeout(2500);
  result.finalUrl=page.url();result.title=await page.title();result.bodyText=(await page.locator('body').innerText()).slice(0,12000);
  result.galleryVerified=result.httpStatus===200&&page.url().includes('/gallery/241524417/')&&/EDURA/i.test(result.bodyText);
  result.observedRequests=[...projectRequests];
  const links=await page.locator('a[href],iframe[src],video[src],source[src],img[src]').evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,url:n.currentSrc||n.href||n.src,text:(n.textContent||n.getAttribute('alt')||'').trim().slice(0,160)})));
  result.observedPageLinks=links.filter(link=>!link.url.startsWith('data:'));
  if(result.galleryVerified){
    result.usableModuleUrls=[...new Set([...projectRequests,...links.map(link=>link.url)].filter(link=>/mir-s3-cdn-cf\.behance\.net\/project_modules\//.test(link)&&link.includes('241524417')))];
    result.usableWalkthroughUrls=[...new Set(links.filter(link=>/vimeo\.com|youtube\.com|youtu\.be|figma\.com|\.mp4(?:\?|$)|\.webm(?:\?|$)/i.test(link.url)).map(link=>link.url))];
  }
  const html=await page.content();
  const bytes=Buffer.from(html,'utf8');result.htmlBytes=bytes.length;result.htmlSha256=crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(new URL('source-access.html',import.meta.url),html);
  await page.screenshot({path:new URL('source-access.png',import.meta.url).pathname.replace(/^\/(\w:)/,'$1')});
  assert(result.galleryVerified||(result.usableModuleUrls.length===0&&result.usableWalkthroughUrls.length===0));
} catch(error){result.errors.push(String(error));}
finally {await browser.close();fs.writeFileSync(new URL('source-access.json',import.meta.url),JSON.stringify(result,null,2));}
console.log(JSON.stringify({httpStatus:result.httpStatus,finalUrl:result.finalUrl,galleryVerified:result.galleryVerified,moduleCount:result.usableModuleUrls.length,walkthroughCount:result.usableWalkthroughUrls.length,errors:result.errors},null,2));