import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='outputs/nasa-black-hole-2026-10-05/';
for(const file of ['journey-desktop.json','journey-tablet.json','journey-mobile.json','reduced-motion.json','bloom.json','cpu-results.json','geodesic-results.json'])assert.equal(JSON.parse(fs.readFileSync(dir+file,'utf8')).status,'PASS',file);
const endpoints=JSON.parse(fs.readFileSync(dir+'final-endpoints.json','utf8'));
for(const data of Object.values(endpoints)){assert(data.programsPass);assert.equal(data.shadowLeaks,0);assert.equal(data.tinted,0);assert(data.center[0]>.65&&data.center[0]<.76);assert(data.heightAboveDisk<.181);assert(data.starGrowth>1.079);}
const cleanup=JSON.parse(fs.readFileSync(dir+'cleanup.json','utf8'));assert.equal(cleanup.liveRays,0);assert.equal(cleanup.liveComposers,0);assert(cleanup.canvasRemoved);
const app=JSON.parse(fs.readFileSync(dir+'app-smoke.json','utf8'));assert.equal(app.dom.canvases,1);assert(app.logs.every(log=>log.level!=='error'));
const before=fs.readFileSync(dir+'AGENTS.before.txt','utf8'),after=fs.readFileSync('AGENTS.md','utf8');
const lines=after.split(/\r?\n/).filter(line=>line.includes('| NASA reference — ray tracing mono, camera sát đĩa, sao dày |'));
assert.equal(lines.length,1);assert.equal(after.replace('\r\n'+lines[0],''),before);
console.log('PASS: browser/CPU artifacts, safe final framing, cleanup, app smoke and append-only AGENTS');
