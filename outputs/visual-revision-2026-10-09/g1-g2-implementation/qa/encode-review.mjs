import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {out,sha,save} from './common.mjs';
const captured=JSON.parse(fs.readFileSync(out+'/clip-results.json','utf8'));
const records=[];
for(const clip of captured.records){
  const file=clip.file.replace(/\.webm$/,'.mp4');
  const encoded=spawnSync('ffmpeg',['-y','-v','error','-i',clip.file,'-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-g','30','-movflags','+faststart','-an',file],{encoding:'utf8',windowsHide:true});
  assert.equal(encoded.status,0,encoded.stderr);
  const decode=spawnSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{encoding:'utf8',windowsHide:true});
  assert.equal(decode.status,0,decode.stderr);
  records.push({name:clip.name,file,source:clip.file,sourceSha:sha(clip.file),sha256:sha(file),bytes:fs.statSync(file).size});
}
save('review-media-results.json',{status:'pass',records,note:'H264 MP4 from original captured frames; WEBM retained. Native Edge GPU seek exposed PIPELINE_ERROR_DECODE for WEBM, so gallery uses MP4. Encoding FPS is not the R3F performance metric.'});
console.log(JSON.stringify({status:'pass',mp4:records.length}));
