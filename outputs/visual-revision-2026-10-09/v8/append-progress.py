from pathlib import Path
import json, re, hashlib
out=Path('outputs/visual-revision-2026-10-09/v8')
path=Path('AGENTS.md');before=path.read_bytes();base=json.loads((out/'baseline.json').read_text(encoding='utf-8-sig'))
assert hashlib.sha256(before).hexdigest()==base['agentsHash'].lower(), 'AGENTS changed since baseline; re-read before appending'
rows=[]
for worker in ['v5','v6','v7']:
    handoff=(out.parent/worker/'handoff.md').read_text(encoding='utf-8')
    row=re.search(r'^\| 09/10/2026 \| V'+worker[1:]+r' .+\|$',handoff,re.M).group(0)
    assert row.encode('utf-8') not in before
    rows.append(row)
rows.append('| 10/10/2026 | V8 — Integration Education / Meteor / Works | Codex | ✅ Kỹ thuật/local xong; chờ duyệt G2 | Shared Works projection + bounded EDURA Back focus; Lab reuse consumers/one pool/one departure, native reader CTA; bilingual credits/BASE_URL + SVG focus fix. Final build/scoped lint pass, repo0errors/2warnings cũ; current production Edge4viewports529assertions +69extra +48rapid taps,6reader/back cycles GPU0geom0tex,3motioncycles,2fallback; RTX4060 DPR1.75 actual163.19–165.16FPS. 79baseline hashes giữ/90build sources match; 75PNG +same-build clip/gallery tại outputs/visual-revision-2026-10-09/v8. Giữ exception V6 first-tail; G2 chưa duyệt, V9 chưa bắt đầu; phone/OS/Safari/Firefox/HTTPS chưa kiểm. |')
addition=('\n'+'\n'.join(rows)+'\n').encode('utf-8')
path.write_bytes(before+addition)
assert path.read_bytes().startswith(before)
(out/'progress-append.json').write_text(json.dumps({'prefixPreserved':True,'beforeHash':hashlib.sha256(before).hexdigest(),'afterHash':hashlib.sha256(path.read_bytes()).hexdigest(),'rows':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Appended V5, V6, V7, V8 sequentially; old AGENTS bytes preserved.')
