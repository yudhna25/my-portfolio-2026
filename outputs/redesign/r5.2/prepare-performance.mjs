import fs from 'node:fs';
let text=fs.readFileSync('outputs/redesign/r5.1/verify-performance.mjs','utf8');
text=text.replaceAll('outputs/redesign/r5.1','outputs/redesign/r5.2').replace('#experience','#work');
text=text.replace("for(const chapter of ['experience','departure']) {", "for(const mode of ['orbit','preview']) {\n    const chapter='works';\n    await page.mouse.move(8,450); await page.keyboard.press('Escape');\n    if(mode==='preview') { await page.locator('[data-work-target=edura]').click(); await page.mouse.move(8,450); }\n    await page.waitForTimeout(400);");
text=text.replace('result.samples.push(sample);','result.samples.push({...sample,mode});');
fs.writeFileSync('outputs/redesign/r5.2/verify-performance.mjs',text);
