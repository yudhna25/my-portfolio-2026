import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
const dir='outputs/redesign/r2.4/';
const browser=JSON.parse(readFileSync(dir+'browser-results.json'));
const streams=JSON.parse(readFileSync(dir+'scroll-results.json'));
const pure=JSON.parse(readFileSync(dir+'check-results.json'));
const number=n=>n.toFixed(2);
const rows=browser.benchmarks.map(x=>`| ${x.label} | ${x.configuration.viewport.join('×')} | ${number(x.fps)} | ${number(x.cpuMs.mean)} / ${number(x.cpuMs.p95)} | ${number(x.gpuFullFrameMs.mean)} / ${number(x.gpuFullFrameMs.p95)} | ${x.drawCalls.mean} | ${x.triangles.mean} | ${x.lines.mean} | ${x.rayDimensions.join('×')} |`);
const native=streams.filter(x=>x.samples).map(x=>{
 const a=x.samples.filter(x=>x.chapter==='finale');
 return `| ${x.mode} | ${a.length} | ${Math.min(...a.map(x=>x.p)).toFixed(3)}–${Math.max(...a.map(x=>x.p)).toFixed(3)} | ${Math.max(...a.map(x=>x.cameraError))} | ${Math.max(...a.map(x=>x.progressError)).toExponential(3)} | ${Math.max(...a.map(x=>x.holeError))} | ${x.resources.disposed.geometry}/${x.resources.disposed.material} | ${x.resources.memory.geometries}/${x.resources.memory.textures} |`;
});
const maxDpr=streams.find(x=>x.mode==='max-dpr');
const report=`# R2.4 — Finale đảo chiều / bàn giao R7.1

Ngày 08/10/2026. **PASS prototype**, chưa tích hợp redesign production. Cùng Lab/GalaxyScene/CameraRig/HDR renderer của R2.1–R2.3; không thêm Canvas, composer hay engine volumetric. App và typography production giữ nguyên; không thêm email/copy/terminal Contact.

## Timeline và owner

Đoạn finale giữ **2,25 viewport**. Một \`useScrollStore.chapterProgress\` từ producer \`useScrollProgress\`; manual controls gọi seek của chính producer. CameraRig priority −1, Works −0,75 rồi ray/copy/mask đọc cùng store, không thêm damping riêng.

| Khoảng progress | Hành vi |
|---|---|
| 0–.12 | Works pose khớp p0, nhãn opacity 1→0/y0→−16, inert khi rời Works |
| .12–.34 | Quỹ đạo co còn 24%, tăng tốc góc; 44 sao chính có vệt cong analytic |
| .34–.44 | Nén đúng **10%** toàn đoạn; cả 80 main/supporting points về [0,0,−200] |
| .44–.70 | Flare nhỏ tại cùng tâm, khí hai lớp fbm trắng/xám nở phủ khung, giữ dark lanes/pocket |
| .70–1 | Khí xoắn/co về tâm, HDR disk/horizon hiện dần; hole=1 tại .96, cloud=0 tại1; Contact lệch phải |

Camera đến pose Contact tại .44 và giữ pose đó qua quá trình hình thành. \`worksOrbit.origin\` được latch theo contract R2.3, không đổi khi đảo/dừng; deep Contact dùng default origin0. Trail lấy q=p−historyOffset, khí/góc/flare/disk-time đều là hàm của p+origin, không lấy elapsed Nebula/ShootingStars hay reseed frame. Các ambient đó được freeze/nhường trong story như hạ tầng hiện hành.

Formation dùng \`uFinaleHole\` riêng cho HDR copy **và** horizon mask; không dùng \`uPortalVisibility\` gây blackout. Gas straight RGB ≤.82 ngoài flare, dưới threshold1; chỉ collision rất nhỏ và đĩa phát HDR. Portal và production branch giữ công thức cũ. Tier đổi define có \`material.needsUpdate=true\`; Browser đọc shader thật đã compile đúng 4/3/2 octaves.

| Tier | Stars nền | Trail samples / 44 sao | Gas octaves | RK4 steps | DPR | Bloom |
|---|---:|---:|---:|---:|---|---|
| High | 24.000 | 24 | 4 | 192 | ≤1,75 | .3, composer hiện có |
| Medium | 12.000 | 18 | 3 | 160 | ≤1,5 | .15, composer hiện có |
| Low | 1.500 | 12 | 2 | 128 | 1 | Tắt composer |

## Kiểm chứng

- \`npm run build\`: pass, Vite 4,88s; bundle >500KB warning có sẵn. \`npm run lint\`: **0 errors**, 2 warnings SplashCursor inline class cũ; source R2.4 không warning.
- \`node outputs/redesign/r2.4/check-finale.mjs\`: **${pure.assertions.toLocaleString('vi-VN')} assertions**, 5 viewport ×7 origins ×101 progress; collision world max ${pure.maxCollisionError.toExponential(3)}; continuity p0/phase boundaries, finite exterior camera, reverse/reuse output, compression10%, gas bound/tier recompile pass.
- Edge154/Playwright: **${browser.poses.length} poses** + direct Contact, 8 rapid compression/burst reversals, năm mốc .25/.40/.50/.75/1 stop và quay lại cùng p **PNG Canvas hash trùng tuyệt đối**, không reseed/teleport. Lab labels đúng .06→.12, inert/ẩn sau retract. Một Canvas/một CameraRig writer/một ray render mỗi frame, WebGL error0.
- Resize high→medium→low giữ các lớp đồng bộ; geometry trail đúng2112/1584/1056 vertices. Live reduced và fresh reduced reload p=.44 dùng tĩnh endpoint/hole1/cloud0, ẩn orbit/labels; Vi/En parity78 keys, đổi En pass. Hidden mô phỏng: **0 frames/500ms**.
- App smoke: một Canvas, 7 sections hiện hành; \`uFinaleEnabled=0/uPortalEnabled=0\`, console/WebGL sạch. Không sửa production layout, store, CameraRig, raymarch RK4 body, quality config hoặc assets.
- Console cuối **0 errors**; warning THREE.Clock từ dependency Fiber cũ ghi trong JSON. Trace và clip native được giữ; Browser plugin/sandbox launcher lỗi MXC volume G:, dùng Edge binary sẵn có qua Playwright, không tải browser/dependency mới.

## FPS / ngân sách

GPU: **NVIDIA GeForce RTX 4060, ANGLE D3D11**, Edge154 trên Windows. Warmup450ms + đo1,8s/mốc, \`addAfterEffect\` đếm render thật. \`EXT_disjoint_timer_query_webgl2\` bao toàn frame, bỏ disjoint; CPU là thời gian submission trước/qua render. Draw calls gồm HDR/selective bloom/mask, không chỉ main pass. Các lượt dưới đây DPR1; có trace/instrumentation nên đây là số đo lab này, không suy ra điện thoại thật.

| Tier / progress | Viewport | FPS | CPU mean/p95 ms | GPU full mean/p95 ms | Draw calls | Triangles | Lines | HDR target |
|---|---|---:|---:|---:|---:|---:|---:|---|
${rows.join('\n')}

Budget tham chiếu: desktop120fps =8,33ms/frame; mobile60fps =16,67ms. Worst GPU p95 ở lượt DPR1 **${number(Math.max(...browser.benchmarks.map(x=>x.gpuFullFrameMs.p95)))}ms**, CPU p95 **${number(Math.max(...browser.benchmarks.map(x=>x.cpuMs.p95)))}ms**; CPU/GPU có overlap, không cộng thành FPS. Render đo được cả ba tier ${number(Math.min(...browser.benchmarks.map(x=>x.fps)))}–${number(Math.max(...browser.benchmarks.map(x=>x.fps)))}fps, gần refresh cap165Hz.

High tại DPR ceiling **1,75**, không video/trace overhead: ${maxDpr.values.map(x=>`p${x.p}: ${number(x.fps)}fps`).join('; ')}. GPU timer tại DPR1, FPS-only check tại1,75; không gán timer DPR1 cho1,75. Native mobile video context deviceScaleFactor3 vẫn render DPR1.

## Native scroll và lifecycle

Wheel thật qua Smoother/ScrollTrigger tiến/lùi và đảo giữa nén/nổ. Tọa độ producer/store khớp bounds DOM trong tolerance1e−6 progress (CSS transformed rect rounding, dưới .002px); camera/hole uniform bằng hàm progress **chính xác**, origin/capture giữ nguyên. Skew giữa publishedY và SmootherY dưới1e−12px trong stream cuối.

| Stream | Finale render samples | P đi qua | Camera error | Store/DOM progress error max | Hole error | Context-loss dispose geom/material | Memory geom/texture sau |
|---|---:|---|---:|---:|---:|---|---|
${native.join('\n')}

Ba vòng story off/on: geometry/material dispose mỗi lần; memory low **11 geometries/1 texture**, không tăng; pool/scene phục hồi đúng. Context-loss trên desktop/mobile unmount về **0 geometry/0 texture**, Canvas0, cả9 chapter DOM còn hoạt động. Không có cấp phát array/Vector/Matrix/material trong các callback useFrame R2.4; các buffer và uniforms được tạo một lần, cleanup theo owner. \`resources.disposed.target=0\` trong stream JSON là counter không instrument target, không phải chứng cứ target không dispose; memory sau unmount và owner cleanup xác nhận qua cảnh.

## Bằng chứng / chạy lại

- [Browser results](browser-results.json), [native streams + maxDPR](scroll-results.json), [CPU checks](check-results.json), [App smoke](app-smoke.json), [fresh reduced](fresh-reduced.json).
- [Desktop clip](clips/desktop.webm), [mobile viewport clip](clips/mobile.webm), [Playwright trace](trace.zip).
- [Orbit/trails](screenshots/desktop-0-25.png), [compression](screenshots/desktop-0-4.png), [collision](screenshots/desktop-0-44.png), [nebula](screenshots/desktop-0-58.png), [accretion](screenshots/desktop-0-75.png), [Contact](screenshots/desktop-1.png); mobile tương ứng trong screenshots/.
- [Bàn giao R7.1](handoff.md), [baseline](baseline.json), [integrity/pixel audit](integrity.json). Checker artifact kiểm mono từng pixel, dark pocket, no flat white, core đen, hash phạm vi và AGENTS append-only.
- \`node outputs/redesign/r2.4/verify-browser.mjs\`; \`verify-scroll.mjs\` cần ffmpeg của Playwright. Lượt này tạm tái dùng ffmpeg đã cài trên máy, binary tạm được dọn sau verify. Không commit/deploy; không thực hiện R3/R7.1.

## Giới hạn

Chưa đo trên GPU điện thoại thật, nhiệt/pin, OS reduced-motion thật hay Safari. Desktop FPS phụ thuộc màn hình165Hz/hardware này; viewport390/DPR3 không chứng minh điện thoại đạt60fps. Gas là approximation hai lớp screen-space bám projected BH center, không volumetric vật lý; không thêm engine mới theo spec. Dataset/seed cố định và shader procedural, chưa dữ liệu NASA gốc. R7.1 cần nối anchors/copy/selection production và đo lại sau polish toàn trang.
`;
writeFileSync(dir+'verification.md',report);
let handoff=readFileSync(dir+'handoff.md','utf8');
handoff=handoff.replace('Benchmark maxDPR đang được hoàn tất; dùng',`High DPR1,75 đã pass ${number(Math.min(...maxDpr.values.map(x=>x.fps)))}–${number(Math.max(...maxDpr.values.map(x=>x.fps)))}fps; dùng`);
writeFileSync(dir+'handoff.md',handoff);
const task='| 08/10/2026 | R2.4 — Reversible Works collision / nebula / black-hole finale | Codex | ✅ Xong (prototype; bàn giao R7.1) | Shared Works/HDR/camera, finale2.25viewport/5pha/nén10%, analytic trails + khí2layer mono/copy-mask formation/origin R2.3/reduced/hidden/tier; không engine/production fork. Build4.88s/lint0errors2warnings cũ, checker31544; Edge15431poses+5pixel-hold/reverse exact/8rapidreverse/2609native frames/3lifecycle+2context-loss memory0/0, 0console-GLerror, 1Canvas/1writer/1ray/frame. RTX4060 DPR1 ~164.6–165.4fps/high DPR1.75~165.0–165.4fps, GPUfull p95≤3.82ms; clip desktop/mobile390DPR3(render1), trace+handoff outputs/redesign/r2.4/. Giữ App/store/CameraRig/RK4/quality/assets; mobile GPU/nhiệt/OS motion thật chưa đo; Browser/MXC lỗi dùng Edge fallback. |';
if(!readFileSync('AGENTS.md','utf8').includes('| R2.4 — Reversible Works collision'))appendFileSync('AGENTS.md','\n'+task+'\n');
console.log('verification + handoff + append progress saved');
