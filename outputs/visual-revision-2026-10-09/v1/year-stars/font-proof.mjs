import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
await page.goto('http://127.0.0.1:5181/outputs/visual-revision-2026-10-09/v1/fixture.html');
await page.evaluate(async()=>{await document.fonts.ready;const node=document.createElement('p');node.textContent='2067';node.style.font='800 100px "Unbounded Variable"';document.body.replaceChildren(node);});
await page.pdf({path:'outputs/visual-revision-2026-10-09/v1/year-stars/font-proof.pdf'});
await browser.close();
