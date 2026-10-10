from pathlib import Path
import json, hashlib, html

out=Path('outputs/visual-revision-2026-10-09/v8')
read=lambda name: json.loads((out/name).read_text(encoding='utf-8'))
main=read('browser-results.json'); extra=read('extras-results.json'); interaction=read('interaction-results.json'); performance=read('performance-results.json'); fallback=read('fallback-results.json'); scope=read('check-results.json'); clip=read('clip-results.json'); build=read('build-source.json')
assert all(r['status']=='pass' for r in [main,extra,interaction,performance,fallback])
if 'fps' in main['performance']:
    p=main['performance'];p['scenePasses']=p.pop('frames');p['scenePassRate']=p.pop('fps');p['method']='Render passes, not FPS; performance-results.json measures actual frame cadence.'
    (out/'browser-results.json').write_text(json.dumps(main,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for file,sha in build['source'].items(): assert hashlib.sha256(Path(file).read_bytes()).hexdigest()==sha, file
assert main['source']==build['source']==clip['source']
fps=' / '.join(f"{s['chapter']}: {s['fps']:.2f}" for s in performance['samples'])
images=[p for p in sorted((out/'screenshots').glob('*.png'))]
evidence={str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in images}
evidence[clip['path']]=hashlib.sha256((out/clip['path']).read_bytes()).hexdigest()
(out/'evidence-index.json').write_text(json.dumps({'buildSources':build['source'],'evidence':evidence},indent=2)+'\n',encoding='utf-8')

(out/'verification.md').write_text(f'''# V8 — Integrated production verification

Status: **technical/local PASS; human G2 pending**. V9 has not started. Date: 10/10/2026 (Asia/Saigon).

## Source and build

V5/V6 chats were idle/completed before integration, V7 had completed. The only delegated reviewer was read-only. [Baseline](baseline.json), [source/build hashes](build-source.json), [scope check](check-results.json).

- Standard `npm run build`: pass on final source; PWA40 entries. Repo lint: 0 errors, 2 existing SplashCursor warnings. Scoped lint: clean. `git diff --check`: pass (CRLF notices only).
- A single output-only Vite **production** build includes index.html and 3d-lab.html, served on loopback5199. No Vite config edit or production route was added. Both entrypoints use the same compiled consumers. Screenshots and clip below are new V8 evidence from that build; no worker baseline image is used to call the integrated site pass.
- {scope['preserved']} baseline source/asset files remain byte-identical, including camera/producer/store/GalaxyScene/BH/compositor/ambient/meteor curve/Skills/EDURA and all V4 assets. Ten integration source files changed; one credits component was added. Final90 source/asset hashes match the measured build.
- Vi/En parity: 254 main keys +93 Lab keys. New Education figure labels/names match Orion/Scorpius/Leo; obsolete Circinus/Telescopium/Pictor labels removed. Credit/source/license labels are bilingual.

## Current production behavior

| Check | Evidence/result |
|---|---|
| Matrix | [browser-results](browser-results.json): {main['checks']} executed assertions; 390×844,768×1024,1440×900,1920×1080. G1 portal forward/reverse, all7 Skills tools, all3 Education figures, meteor/departure, all3 Works figures/panels. 0 horizontal overflow in measured states. |
| Native interaction | Mouse on projected figure→panel, touch/pin, keyboard Tab→EDURA CTA/Escape, separate CTA vs selection, VERIS/VIE coming soon. [Additional interactions](interaction-results.json): 180ms grace preserved at90ms, closed after270ms; 48 rapid taps across4 viewports; Works height and scroll unchanged. |
| Route/Back | Three cycles each at390 and1440. Reader Canvas0/Smoother absent, Back Canvas1/projected work-target-edura focus, selection/scroll/orbit restored. Desktop compares the actual history snapshot at CTA activation, not an earlier still-easing orbit sample. All6 unmounts GPU memory0geometry/0texture; each watched scene cleanup24geometry/33material/15texture dispose events, and resources return consistently. |
| Motion/lifecycle | Three live reduce↔normal cycles: Smoother off/on, triggers0↔3, camera static/meteor off when reduced. Normal samples stabilize at8geometry/23texture before first visible uploads. [extras](extras-results.json): hidden subscription changes frameloop to never and produces0 new render passes; resume/frozen lifecycle has0 GL error. No OS Settings was toggled in V8. |
| Lab | Same production SkillsSymbols/Education/Experience/StoryMeteor/Work/WorksConstellations; exactly1 departure marker and1 pool. Native chapter select, real Education control, Works projection, native EDURA navigation. Content Off inert; About ejection remains governed by its existing G1 phase writer. |
| Fallback | [fallback-results](fallback-results.json): Edge --disable-webgl at390/1440, Canvas0, three real SVG artwork images, no overflow, real reader and Back focus. |
| Bilingual/focus | [extras](extras-results.json): {extra['checks']} checks, bonus320 viewport, main Vi/En, credit Enter/Tab/Escape and trigger focus return, native SVG Tab/Enter. |
| Console/GL/URLs | 0 unexpected console/page errors,0 measured GL errors,0 local404. Expected THREE.Clock deprecation and Playwright service-worker-block warning are listed separately. All6 artwork maps decoded/loaded in current main scene; fallback images use BASE_URL. |

Credits use a native auto popover, including light-dismiss/Escape and return to trigger; [MDN platform behavior](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using). Links preserve V4 author, pinned source, Free Art License1.3, Stellarium CC BY-SA4.0 and ESA/CDS citation; full attribution/manifest are linked via BASE_URL. No public asset was edited.

## Integration fixes discovered by current QA

The tiny-viewBox Education SVG hotspot inherited both a native pointer-focus outline (`auto5px`) and the unlayered global keyboard outline/shadow. These were magnified in SVG local units and obscured the figure. Scoped important outline/shadow resets now apply to the polygon for both pointer and keyboard; keyboard focus uses a white2px **non-scaling stroke**. Native Tab/touch states and final screenshots confirm the correction; no geometry/artwork/radius change was made. Earlier education-debug images are failure diagnostics, not G2 evidence.

Work's shared projection ref is wired to both renderer and DOM. Back focus waits for that projection after the existing seek/settle, is bounded, and cancels on new input. Lab reuses production consumers and native reader navigation; hidden controls use inert. Artwork is enabled only during Education; the Skills regression saw no Education artwork leak. Meteor stays out of SelectiveBloom: child layers1; selected BH disk layer1025; BH/shader/composer source is unchanged and core stays visually dark in the new captures.

## Frame and resource measurement

Current GPU: ANGLE NVIDIA RTX4060 / D3D11, high tier at1440×900, DPR1.75. One passive negative-priority R3F subscription counts frames; scene render passes are counted separately because bloom draws the scene twice. **{fps} FPS**, each2.5s. [Measured samples](performance-results.json). The earlier main-suite render-pass rate is not FPS. No physical-phone FPS or thermal claim.

Ambient counts remained1500/12000/24000/24000 across the four viewports. No second Canvas, camera/controller, state store, curve, or renderer was added.

## G2 review and known exception

[Review gallery](review.html), [same-build clip]({clip['path']}) ({clip['duration']:.2f}s, {clip['frames']} actual captured frames; encoded with installed ffmpeg, not an FPS measurement), [evidence hashes](evidence-index.json), [handoff](handoff.md).

V6's **first milestone tail remains short** (worker quantified6.23% desktop/14.60% mobile); mature tail reaches42%. V8 deliberately preserves the approved curve/birth timing. This visible exception is presented to G2, not silently declared resolved. Scientific catalog attribution retains V4's recorded commercial-grant evidence gap; V8 makes no additional licensing conclusion or publication.

G2 is a human art review; passing scripts cannot approve it. V9's finale400vh/spectacle remains untouched (225vh current marker). No deploy/push/commit or new-task automation was performed.

Not checked: physical touch device/GPU, OS motion toggle, screen reader, Safari/Firefox, public HTTPS/deployment. Touch/reduced/hidden/fallback are browser simulations. Technical checks cover the stated integration, not a full accessibility or legal audit.
''',encoding='utf-8')

(out/'handoff.md').write_text('''# V8 integration handoff — G2 pending

## Shared interfaces

- `Portfolio.worksLayout`: one stable `{current:createWorksLayout()}` object. Same ref goes to `<Work layoutRef>` and `<WorksConstellations layoutRef>`. Renderer publishes `ready/width/height/basis/figures/onChange`; it is projection telemetry, not a second selection store. Work owns the single callback and cleans it up.
- R6.2 history/route store is unchanged. Back first seeks through the existing producer and completes Smoother scrub, then waits boundedly for the Works projection before focusing `work-target-edura`. New input cancels pending focus. Fallback still focuses the native control. `work-case-edura` and route metadata remain intact.
- Work's optional `nativeNavigation` defaults false; Lab sets true because its page has no SPA reader route subscriber. CTA remains a separate anchor. Production uses the unchanged navigateRoute/saveMainEntry contract.
- Education gets three stable stage refs. SkillsSymbols remains the only shared SymbolStars/pool192 renderer; three EducationArtwork instances follow their own stage anchors. Artwork is enabled only in the Education chapter, while native early-focus pool ownership stays intact. No Education art in Skills.
- Experience's stable `onLayout` callback writes its measured layout into one ref for StoryMeteor. Lab now uses the same component instead of a duplicate generic chapter/departure. Camera/progress/curve/wake helpers are untouched.
- Works and Education fallback artwork URLs resolve from `import.meta.env.BASE_URL`; EducationArtwork already used this convention. V4 mappings/star positions/edges/assets remain identical.
- `ConstellationCredits` mounts once outside Smoother in App and Lab. Two consumer triggers target its native auto popover. Main new keys: `education.constellationNames.*`, `education.figureLabel`, `constellationCredits.*`; Lab source labels/notes updated. No store patch needed.
- Education polygons suppress native/global scaled outline/shadow and keep keyboard non-scaling white2px stroke. Do not remove this focus treatment when reusing the hotspots.

## Preserved contract for V9

Existing `worksOrbit` remains the only origin/phase. `syncWorksOrbit` captures once when leaving Works into positive finale/contact; reverse uses the same origin. `worksFinaleSelection` and Work presentation ownership return on reverse. No additional snapshot writer was introduced. Idle uses the existing analytic eased integration; compare route restore against the snapshot captured at CTA activation.

Finale stays225vh and existing helpers remain unchanged. V9 may begin only after explicit human G2 approval; it must recheck Hero/portal G1 after changing shared files. No finale400vh, explosion or Contact rewrite in V8.

## Evidence and review

See verification.md, browser-results.json, extras-results.json, interaction-results.json, fallback-results.json, performance-results.json, build-source.json and evidence-index.json. Review.html uses only final V8 captures from the same compiled source; failure diagnostics and worker baseline images are excluded.

Pending human decision: G2 Education/meteor/Works art direction, including the known V6 entry-tail exception. First milestone6.23% desktop/14.60% mobile is a worker measurement retained as an explicit exception, not new V8 approval. Mature tail42%. No physical phone/OS/Safari/Firefox/HTTPS verification in V8.

Worker AGENTS rows V5/V6/V7 are appended by root sequentially with their historical evidence status. The V8 row records technical completion and G2 pending; existing rows stay unchanged.
''',encoding='utf-8')

blocks=[]
for width in [390,768,1440,1920]:
    group=[]
    for filename,label in [(f'education-saigonUniversity-{width}.png','Education · Orion active'),(f'education-greenAcademy-{width}.png','Education · Scorpius active'),(f'education-arenaMultimedia-{width}.png','Education · Leo active'),(f'experience-0.2-{width}.png','Meteor · p0.20 / entry'),(f'experience-0.45-{width}.png','Meteor · p0.45'),(f'works-edura-{width}.png','Works · EDURA preview'),(f'works-veris-{width}.png','Works · VERIS coming soon'),(f'works-vie-{width}.png','Works · VIE coming soon')]:
        assert (out/'screenshots'/filename).exists(), filename
        group.append(f'<a href="screenshots/{filename}" target="_blank"><img loading="lazy" src="screenshots/{filename}" alt="{html.escape(label)} at {width}px"><span>{label}</span></a>')
    blocks.append(f'<details {"open" if width==1440 else ""}><summary>{width}px · same production build</summary><div class="grid">'+''.join(group)+'</div></details>')
(out/'review.html').write_text('''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V8 — G2 review</title><style>html{background:#050505;color:#fafafa;font:16px/1.6 system-ui}body{max-width:1500px;margin:auto;padding:24px}h1{font-size:clamp(24px,4vw,48px)}a{color:inherit}summary{cursor:pointer;padding:16px;border-top:1px solid #444}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}img{display:block;width:100%;height:280px;object-fit:contain;background:#111}span{display:block;padding:8px}video{width:100%;max-height:70vh}p{max-width:90ch}.notice{padding:16px;border:1px solid #777}</style><h1>V8 · Education / Meteor / Works</h1><p>Technical PASS · G2 chờ bạn duyệt. Ảnh và clip ở đây đều từ cùng production build V8; click ảnh để xem kích thước gốc. Camera, BH, Skills và EDURA giữ contract.</p><p class="notice">Điểm cần xem khi duyệt G2: đuôi meteor ở milestone đầu còn ngắn (V6: 6,23% desktop /14,60% mobile); đuôi trưởng thành42%. Curve/birth timing được giữ nguyên. Chưa bắt đầu V9.</p><p><a href="verification.md">Verification</a> · <a href="handoff.md">Handoff</a> · <a href="evidence-index.json">Source/evidence hashes</a></p><video controls preload="metadata" src="clips/integrated-education-experience-works.webm"></video>'''+''.join(blocks)+'<p>Touch/reduced/hidden là mô phỏng trên Edge RTX4060; chưa kiểm điện thoại thật/OS/Safari/Firefox/HTTPS.</p></html>',encoding='utf-8')
print(json.dumps({'screenshots':len(images),'fps':fps,'technical':'pass','G2':'pending'}))
