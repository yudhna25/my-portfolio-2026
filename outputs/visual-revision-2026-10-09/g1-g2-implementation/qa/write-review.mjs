import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {PNG} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs/lib/png.js';
import {out,sha} from './common.mjs';
const read=name=>JSON.parse(fs.readFileSync(out+'/'+name,'utf8'));
const checks=read('check-results.json'),browser=read('browser-results.json'),extra=read('extras-results.json'),opening=read('opening-fallback-results.json'),perf=read('performance-results.json'),pixels=read('comet/pixel-results.json'),intake=read('intake/final-capture.json'),clips=read('clip-results.json'),build=read('build-source.json');
assert.equal(checks.status,'pass');
const reviewMedia=read('review-media-results.json');assert.equal(reviewMedia.status,'pass');
const displayClip=clip=>reviewMedia.records.find(r=>r.name===clip.name).file;
const write=(name,text)=>fs.writeFileSync(out+'/'+name,text.trim()+'\n');
const fps=perf.records.map(r=>`| ${r.label} | ${r.fps.toFixed(2)} | ${r.frameMs.p95.toFixed(2)} | ${r.frameMs.p99.toFixed(2)} | ${r.frameMs.maximum.toFixed(2)} | ${r.frameMs.over16}/${r.frames} |`).join('\n');
const viewports=browser.cases.map(r=>`| ${r.width} × ${r.height} | 0px | ${(r.hero.year.width/r.hero.heading.width).toFixed(3)} | ${r.openingSummary.maximumRevealAlignmentPx.toFixed(4)}px | ${r.openingSummary.minimumPhotonSizeRatio.toFixed(3)} |`).join('\n');
const comet=pixels.records.map(r=>`| ${r.width}px / công ty ${r.company} | ${r.metrics.coreDiameterCss}px | ${r.metrics.haloDiameterCss}px | ${(r.tailRatio*100).toFixed(2)}vw |`).join('\n');
write('verification.md',`# Tinh chỉnh G1/G2 — verification 10/10/2026

**Kỹ thuật/local PASS; G1/G2 chờ người dùng duyệt visual lại. V9/G3 chưa bắt đầu.** [Ảnh và clip](review.html) · [Handoff](handoff.md) · [Source/build](build-source.json) · [Scope/parity](check-results.json).

## Phạm vi và build

Thực hiện P1–P4 theo [phương án đã chốt](../../../docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md). ${checks.changed.length} file nguồn cũ được sửa, ${checks.added.length} file mới; ${checks.unchanged}/${checks.baselineFiles} file baseline giữ hash. Bộ bảo vệ riêng 56 file (camera/producer/stores/BH/ambient/Skills/Education/Works/EDURA/locales/public/config) PASS. AGENTS giữ nguyên prefix ${checks.agentsPrefixBytes} bytes rồi chỉ append. Không thêm dependency, route, Canvas R3F hoặc writer.

\`npm run build\` PASS, PWA40 entries; \`npm run lint\`: 0 lỗi, 2 warning SplashCursor cũ. Chunk lớn/THREE.Clock cũ được ghi riêng. Source đo tại **${build.at}**; một production build output-only có index + Lab, phục vụ loopback5212. Build chuẩn dist cũng pass; không sửa vite.config. ${checks.sourceFiles} source/asset hashes khớp bản đo. Kiểm locale: ${checks.parity.map(p=>p.keys+' keys').join(' + ')}, Vi/En parity100%; không đổi copy.

## Opening và 2026

Vòng mono từ tâm đến O thật; cold1.8s, warm-ready0.9s (reload chậm vẫn1.8s). Đây là thời gian trình diễn, tách khỏi tải font/shader. Hero đã có dưới veil; idle chờ opening hoàn tất. Font/layout đổi trong lúc mở được đo lại. GSAP scaleX/Y thật, không dùng shorthand scale quickSetter. Watchdog5s và finish deadline vẫn có; reduced không render overlay.

${opening.records.length} tình huống độc lập PASS: font trễ1.8s trên390/1440; font trễ6s thật đi qua watchdog390; font abort390; no-WebGL390/1440; fresh reduce390. Không frame reveal thiếu Hero; sai tâm tối đa <0.001px ở các ca fallback; photon ring/O ratio0.96. ${opening.expectedFaults.length} lỗi network/context **do test chủ động gây ra** được tách khỏi0 lỗi không dự kiến. [Log](opening-fallback-results.json).

2026 rộng khoảng1.30 lần PORTFOLIO, đủ bốn số. Không stroke cố định normal; tail35% + wake10%, lap10–14s, giữ glitch6↔7. Các snapshot4/8/12/16s ở320/1440 bổ sung ảnh ready; không lấy một frame để kết luận cả vòng. Hai SVG sao/contour trùng basis. Seed/vị trí/nhóm sao gốc được rasterize một lần vào PNG mono, tránh pattern repaint; cache2D tách rời không thêm DOM/WebGL Canvas. Reduced/fallback có contour chấm tĩnh để đọc số.

| Viewport | Overflow | Year / PORTFOLIO width | Lệch tâm khi reveal | Photon / O |
|---|---:|---:|---:|---:|
${viewports}

## Intake và comet

Sau ảnh theo từng glyph/word/control đo thật; ${6} snapshots/source mobile, ${8} desktop, một pool mỗi consumer. Bản sao inert/aria-hidden, không ID/link/handler/focus. Chữ nhận ra ở đầu, giảm đậm trước join; nhánh nhập một funnel toán học1.25 vòng, thu mảnh và bị che khi vào core. Không biến dạng pixel từng chữ bằng shader; chất lượng silhouette cần người dùng xem clip. Will-change chỉ khi intake active. [12 ảnh tiến/lùi](intake/final-capture.json); cùng progress cho cùng pose qua33,272 assertions, native camera reverse sai lệch <0.03 world units. Raw transform strings ở ảnh tới/lùi có thể khác bởi residual Smoother <1.1px; không tuyên bố pixel hash giống nhau.

Một StoryMeteor/curve/layout cũ được nâng cấp: C2 quintic qua ba DOM company anchors; authored q âm cho entry có đuôi~42vw; nối departure không lọc/lerp trễ riêng. Flare nở mềm theo reading progress, white core/cyan đuôi hiện có, không flash toàn màn hình. 16,963 assertions kiểm continuity/reverse/buffers. Pixel phép trừ cùng pose, chỉ tạm ẩn head mesh rồi phục hồi để đo; không tính plane trong suốt là halo. Sai số diameter khoảng±2px, halo ngưỡng head-only luminance20/255.

| Viewport / mốc | Lõi sáng thật | Halo thật | Đuôi tại mốc |
|---|---:|---:|---:|
${comet}

[Pixel log](comet/pixel-results.json). Mobile core31px/halo121px; desktop core51px/halo223–225px nằm trong lựa chọn C. Độ rõ chữ khi vệt đi qua cần xem thêm ở clip/thiết bị thật.

## Interaction, lifecycle và performance

${browser.assertions} kiểm tra main trên5viewport PASS; native wheel/scroll tới-lùi, Skills/Education/Works, ${browser.back.length} EDURA Back giữ focus work-target-edura/selection/scroll/orbit, ${browser.motion.length} live reduce↔normal và hidden↔visible. Reduced: native scroll,0 triggers/active year timelines/copies, camera đứng, comet ẩn. Hidden: frameloop never/render passes không tăng. ${extra.checks} extras PASS: Enter/Tab/Escape Menu, Vi/En, resize390→1440→390, Lab shared renderer và6reader disposal cycles trả GPU0geometry/0texture,0 trail pools. [Main](browser-results.json) · [Extras](extras-results.json). Main/extras:0 console/page/GL/HTTP404 lỗi; warning thư viện và SW blocked-by-QA được giữ trong JSON.

Đo riêng actual negative-priority R3F frame observer trên Edge/RTX4060/DPR1; không override renderer, không flag gỡ frame limit. Opening đặt cửa sổ danh nghĩa1.2s sau presentation bắt đầu (thực đo1.367s theo timer), không tính compilation/readiness. Wheel samples gồm Smoother settling. Clip encode30fps không phải benchmark. [Số đo](performance-results.json).

| Sample | FPS | p95 ms | p99 ms | Max ms | Frames >16.7ms |
|---|---:|---:|---:|---:|---:|
${fps}

Tất cả sample >120FPS, không frame >16.7ms trong lượt đo source cuối. Đây là sample ngắn trên máy dev, không bảo đảm mọi thiết bị/mọi lượt cuộn không hitch. Pool/cache giảm bottleneck của bản thử: year repaint~19–25FPS →~165FPS; intake không cache~1–2FPS →>120FPS. Các profile/attempt thất bại và lượt trước có frame20–24ms là diagnostics, không có trong gallery nghiệm thu.

## Giới hạn và gate

Chưa kiểm điện thoại thật, native OS motion lần mới, Safari/Firefox, HTTPS/deployment, screen reader/SPL/nhiệt thiết bị. Touch/media/hidden mô phỏng trên Edge; phản ứng keyboard/pointer/route là native browser input. Không push/deploy. PWA offline và deep-link server rewrite không chạy lại; Python QA server phục vụ build, route client Back được kiểm. Dev5211 hỗ trợ SPA preview.

Các ảnh/clip trong gallery thuộc cùng source/build hiện tại, có decode/hash trong evidence-index. 132PNG và hai capture WebM được giữ nguyên; gallery dùng thêm hai MP4 H264 transcode từ đúng các frame đó. Edge GPU báo PIPELINE_ERROR_DECODE khi tua WebM, dù ffmpeg decode pass; [media log](review-media-results.json) ghi rõ. [Kiểm gallery native](gallery-results.json) PASS:76ảnh decode,2MP4 phát/tua,0console/HTTP errors; phần archive còn lại được decode/hash trong evidence-index. G1/G2 phải được duyệt lại; giữ V9/G3 chờ. Không lấy review V8 hoặc lựa chọn Q12 làm duyệt animation mới.
`);
write('handoff.md',`# G1/G2 refinement handoff — chờ visual approval

P1–P4 đã triển khai và kiểm local. [Verification](verification.md), [gallery](review.html), [plan](../../../docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md). **Không mở V9/G3 trước khi người dùng duyệt G1/G2 mới.**

- App chỉ đổi Hero active dưới opening; loading store và caller giữ API. Preloader dùng DOM O thật + data-scene-ready sau3frames, font loaded/fallback/watchdog; cold1.8s/warm-ready0.9s, hidden pause, reduced return null và complete ngay. Font/resize đồng bộ target trên draw, GSAP contextSafe/timers/listeners cleanup.
- PortalHeading/hero.css giữ source text/i18n/O anchor, year hierarchy1.30×, no static outline normal, lap10–14s/tail35%; cache PNG từ sao gốc trong detached2D canvas rồi hiển thị SVG image, không Canvas scene mới. Last glyph6↔7 cập nhật cả silhouette/star image; source snapshots lấy đúng cached image và contour.
- portalIntake/portalIntakeSample giữ signature/phases; sampled analytic funnel1.25 turns, per-source arrival/alpha giảm lump tại join. portalTrails đo sources một lần/resize/font, pool6/8, one common Hero spiral, Nav/Cursor branches, radius alpha-mask bảo vệ BH. Original visuals suppress tới eject, native controls vẫn inert đúng gate. Không store/producer/locale/ref mới.
- StoryMeteor/Experience giữ onLayout/layoutRef, buffers128 và named head/trail objects; q[-.9,2], measured C2S path/pre-entry42vw/continuous departure, scalar flare/wake. Resource budget2geometry/3material. Không copy renderer vào Lab; camera/BH/ambient nguyên hash.
- V4/Skills/Education/Works/EDURA/store/camera producer:56protected files nguyên hash. Native Back restore6cycles và cleanup6cycles đã kiểm. Không sửa finale, Contact/Footer hay art mapping.

Diagnostic selectors: [data-preloader], data-opening-duration/data-opening-ready; [data-galaxy-scene][data-scene-ready]; [data-portal-trails] source/copy/progress, .portal-trail-copy/.portal-trail-common, .hero-year-tail, named story-meteor-head/trail. Không public API mới; không đọc diagnostic attributes để điều khiển production.

Reproduce: npm run build; npm run lint. QA_BASE_URL=http://127.0.0.1:5212; qa/build-production.mjs, verify-opening-fallback.mjs, verify-browser.mjs, verify-extras.mjs, measure-performance.mjs, intake/capture-final.mjs, comet/measure-pixels.mjs (QA_CALIBRATION_STAGE=final frozen source), capture-clips.mjs, encode-review.mjs, check-final.mjs, write-review.mjs, check-gallery.mjs. Browser/FPS chạy tuần tự để tránh hidden-tab pause ảnh hưởng observation; keep measured source frozen.

Giới hạn: DOM afterimages/tapered SVG ribbons là biểu diễn đã chọn, chưa pixel-deformation shader; human visual pending. FPS/frame pacing là sample ngắn trên máy dev. Touch/hidden/reduced giả lập; chưa phone/OS thật/Safari/Firefox/HTTPS. Không deploy/push.
`);
const images=[];
for(const entry of browser.cases){const w=entry.width;images.push(`screenshots/hero-${w}.png`,...['0.1','0.22','0.34','0.5','0.9'].map(p=>`screenshots/portal-${p}-${w}.png`),...['0.04','0.15','0.32','0.5','0.7','0.92'].map(p=>`screenshots/meteor-${p}-${w}.png`),`screenshots/departure-${w}.png`,...['skills','education','works'].map(s=>`screenshots/${s}-regression-${w}.png`));if(w===320||w===1440)images.push(...[4,8,12,16].map(t=>`screenshots/hero-cycle-${t}-${w}.png`),`screenshots/hero-warm-${w}.png`);if(w===390||w===1440)images.push(`screenshots/edura-back-${w}.png`)}
images.push('screenshots/motion-resumed.png',...opening.records.map(r=>`screenshots/opening-${r.mode}-${r.width}.png`),...['en','vi'].flatMap(lang=>[390,1440].map(w=>`screenshots/portal-${lang}-${w}.png`)),...['portal-resize','lab-experience'].flatMap(s=>[390,1440].map(w=>`screenshots/${s}-${w}.png`)),...intake.cases.map(r=>r.file.slice(out.length+1)));
for(const r of pixels.records)for(const file of Object.values(r.screenshots))images.push(`comet/pixel-calibration/final-frozen-source/${file}`);
const media=[...new Set(images)].map(file=>{const png=PNG.sync.read(fs.readFileSync(out+'/'+file));return{file,width:png.width,height:png.height,bytes:fs.statSync(out+'/'+file).size,sha256:sha(out+'/'+file)}});
for(const clip of [...clips.records,...reviewMedia.records]){const probe=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height:format=duration','-of','json',clip.file],{encoding:'utf8',windowsHide:true});assert.equal(probe.status,0,probe.stderr);const stream=JSON.parse(probe.stdout);assert(stream.streams[0].width>0);const decode=spawnSync('ffmpeg',['-v','error','-i',clip.file,'-f','null','-'],{encoding:'utf8',windowsHide:true});assert.equal(decode.status,0,decode.stderr);media.push({file:clip.file.slice(out.length+1),bytes:fs.statSync(clip.file).size,sha256:sha(clip.file),probe:stream})}
write('evidence-index.json',JSON.stringify({status:'pass',buildAt:build.at,source:build.source,production:build.production,media,notes:['Canonical final-source evidence only. Earlier failures/profile/dev images are diagnostics.','PNG decoded including data integrity; WEBM/MP4 ffprobe and full ffmpeg decode pass; native Edge gallery uses MP4.']},null,2));
const card=(file,label)=>`<a href="${file}" target="_blank" rel="noopener"><img loading="lazy" src="${file}" alt="${label}"><span>${label}</span></a>`;
let html=`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="/favicon.svg"><title>G1/G2 · Bản tinh chỉnh 10/10</title><style>html{background:#050505;color:#fafafa;font:16px/1.65 system-ui}body{max-width:1500px;margin:auto;padding:24px}h1{font-size:clamp(28px,4vw,52px);line-height:1.15}a{color:inherit}p{max-width:100ch}.notice{border:1px solid #555;padding:16px}video{width:100%;max-height:78vh;background:#050505}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}img{width:100%;height:330px;object-fit:contain;background:#0a0a0a;display:block}span{display:block;padding:8px}summary{padding:18px 0;border-top:1px solid #444;cursor:pointer}</style><h1>G1/G2 · Bản tinh chỉnh</h1><p class="notice">P1–P4 kiểm kỹ thuật/local đã pass. <strong>G1/G2 đang chờ bạn duyệt visual lại; V9/G3 chưa bắt đầu.</strong> Ảnh và clip ở đây cùng source/build ${build.at}; không trộn ảnh worker/V8. FPS đo riêng trên RTX4060/DPR1, clip encode30fps không phải FPS.</p><p><a href="verification.md">Verification</a> · <a href="handoff.md">Handoff</a> · <a href="evidence-index.json">Source/media hashes</a> · <a href="http://127.0.0.1:5211/">Trang chạy để thử</a></p>`;
for(const clip of clips.records)html+=`<h2>${clip.name.startsWith('opening')?'Opening → Hero → hút / đảo chiều':'Comet → departure → Works'}</h2><video controls preload="metadata" src="${displayClip(clip).slice(out.length+1)}"></video>`;
html+='<p>Điểm cần duyệt: nhịp nối vòng sáng vào O; năm lớn/contour chậm dài; dòng chữ/Nav nhập xoắn; comet lớn/lóe mềm và đường S. Lượt đo source cuối không có frame >16.7ms trong các sample; chưa kiểm điện thoại thật.</p>';
for(const w of [320,390,768,1440,1920]){html+=`<details${w===1440?' open':''}><summary>${w}px · Hero / Portal / Experience / regression</summary><div class="grid">`;for(const [file,label]of [[`screenshots/hero-${w}.png`,'Hero / 2026'],...[.1,.22,.34].map(p=>[`screenshots/portal-${p}-${w}.png`,`Portal p${p}`]),...[.15,.5,.92].map(p=>[`screenshots/meteor-${p}-${w}.png`,`Comet p${p}`]),...[['skills','Skills'],['education','Education'],['works','Works']].map(([s,l])=>[`screenshots/${s}-regression-${w}.png`,l])])html+=card(file,`${label} · ${w}px`);html+='</div></details>'}
html+='<details><summary>Contouring / glitch · cả chu kỳ</summary><div class="grid">';for(const w of [320,1440])for(const t of [4,8,12,16])html+=card(`screenshots/hero-cycle-${t}-${w}.png`,`${w}px · ${t}s sau ready`);html+='</div></details><details><summary>Intake close review · tiến / lùi</summary><div class="grid">';for(const r of intake.cases)html+=card(r.file.slice(out.length+1),`${r.width}px · ${r.direction} p${r.actual.toFixed(4)}`);html+='</div></details><details><summary>Comet · kích thước sáng thực tại ba công ty</summary><div class="grid">';for(const r of pixels.records)html+=card(`comet/pixel-calibration/final-frozen-source/${r.screenshots.lit}`,`${r.width}px / công ty${r.company} · core${r.metrics.coreDiameterCss}px / halo${r.metrics.haloDiameterCss}px`);html+='</div></details><p>Chưa kiểm native OS motion lần mới, phone/Safari/Firefox/HTTPS. Không deploy/push; không tự chuyển sang finale V9/G3.</p></html>';
write('review.html',html);
console.log(JSON.stringify({status:'pass',images:media.filter(m=>m.file.endsWith('.png')).length,clips:clips.records.length,files:['verification.md','handoff.md','review.html','evidence-index.json']}));
