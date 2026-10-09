import { readFileSync } from 'node:fs';
let harness=readFileSync(new URL('./verify-browser.mjs',import.meta.url),'utf8').split('try {\n  await init();')[0];
harness=harness.replace("const out = new URL('./', import.meta.url);",`const out = new URL(${JSON.stringify(new URL('./',import.meta.url).href)});`);
harness+=`try {
  await init();
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:900});await page.waitForTimeout(250);
    for(const id of ['figma','ai','saigonUniversity','greenAcademy','arenaMultimedia']){
      const chapter=id==='ai'||id==='figma'?'skills':'education';await seek(chapter);await select(id);await page.waitForTimeout(1600);
      const record=await snapshot(width+' unobscured '+id);assert.equal(record.target,id);assert(record.active);
      const obscured=await page.evaluate(()=>{const f=window.qa.fiber.getState(),root=f.scene.getObjectByName('symbol-anchor'),pool=f.scene.getObjectByName('symbol-stars').userData.pool,rect=document.querySelector('[data-lab-controls]').getBoundingClientRect();let hits=0;const v=f.camera.position.clone();const limit=pool.target.geometry?.stars.length??pool.positions.length/3;
        for(let i=0;i<limit;i++){v.fromArray(pool.positions,i*3).applyMatrix4(root.matrixWorld).project(f.camera);const x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2;if(x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom)hits++;}return hits;});
      assert.equal(obscured,0,'panel must not obscure target');record.panelObscuredPoints=obscured;await shot(width+'-visible-'+id);
    }
  }
  assert.equal(errors.length,0);writeFileSync(path('visible-stage-results.json'),JSON.stringify({status:'pass',date:new Date().toISOString(),results,errors,warnings},null,2));console.log('Visible stage pass: '+results.length+' poses');
}finally{await context.tracing.stop({path:path('visible-stage-trace.zip')});await browser.close();}`;
await import('data:text/javascript;base64,'+Buffer.from(harness).toString('base64'));
