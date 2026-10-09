import fs from 'node:fs';
let text=fs.readFileSync('outputs/redesign/r3.3/verify-performance.mjs','utf8').replaceAll('outputs/redesign/r3.3','outputs/redesign/r4.3').replaceAll('/#about','/#education');
text=text.replace("for (const mode of ['idle', 'portrait hover / lens'])", "for (const mode of ['saigonUniversity','greenAcademy','arenaMultimedia'])");
text=text.replace("if (mode !== 'idle') await page.locator('#about button').hover(); else await page.mouse.move(20, 80);", "await page.locator('[data-education-item=\"'+mode+'\"]').hover();");
text=text.replace('await page.waitForTimeout(400);','await page.waitForTimeout(1600);');
fs.writeFileSync('outputs/redesign/r4.3/verify-performance.mjs',text);
