"""One assert-based check for source preservation, assets, bilingual copy and claims."""
import hashlib
import json
import subprocess
from pathlib import Path
from urllib.parse import urlparse
from datetime import datetime, timezone
from PIL import Image

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
read = lambda name: json.loads((OUT / name).read_text(encoding='utf-8-sig'))
sha = lambda data: hashlib.sha256(data).hexdigest()
count = 0
def check(condition, message):
    global count
    assert condition, message
    count += 1

baseline = read('baseline.json')
current = sorted(str(p.relative_to(ROOT)).replace('\\', '/') for p in [*ROOT.joinpath('src').rglob('*'), *ROOT.joinpath('public').rglob('*'), ROOT / 'index.html', ROOT / 'vite.config.js', *ROOT.glob('package*.json')] if p.is_file())
check(current == sorted(r['path'] for r in baseline['files']), 'Protected file set changed')
for r in baseline['files']:
    check(sha((ROOT / r['path']).read_bytes()) == r['sha256'], f"Source changed: {r['path']}")
git = lambda *args: subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8').rstrip()
check(git('rev-parse', 'HEAD') == baseline['head'], 'HEAD changed')
check(git('status', '--porcelain=v1', '--untracked-files=no') == baseline['trackedStatus'], 'Tracked/index status changed')
agents = (ROOT / 'AGENTS.md').read_bytes()
check(sha(agents[:baseline['agentsBefore']['bytes']]) == baseline['agentsBefore']['sha256'], 'AGENTS original prefix changed')

index = read('asset-index.json')
assets = {r['id']: r for r in index['assets']}
check(len(assets) == 26 and len({r['sha256'] for r in assets.values()}) == 24, '26/24 inventory mismatch')
check(sum(r['bytes'] for r in assets.values()) == 2878812, 'Original image bytes mismatch')
for aid, r in assets.items():
    data = (ROOT / r['path']).read_bytes()
    check(len(data) == r['bytes'] and sha(data) == r['sha256'], f'{aid}: changed bytes')
    with Image.open(ROOT / r['path']) as image:
        image.load()
        check(image.size == (r['width'], r['height']) and image.format == 'WEBP', f'{aid}: decode/size')
    check(urlparse(r['sourceUrl']).netloc == 'mir-s3-cdn-cf.behance.net' and '241524417' in r['sourceUrl'], f'{aid}: wrong project URL')
    check(set(r['alt']) == {'vi', 'en'} and all(r['alt'].values()) and set(r['caption']) == {'vi', 'en'} and all(r['caption'].values()), f'{aid}: incomplete bilingual image text')
    check(r['originalColorsPreserved'] and not r['newDownload'], f'{aid}: original changed/re-downloaded')
    if r['duplicateOf']:
        check(r['selection'] == 'exclude' and r['sha256'] == assets[r['duplicateOf']]['sha256'], f'{aid}: invalid duplicate')
check(assets['A25']['duplicateOf'] == 'A23' and assets['A26']['duplicateOf'] == 'A24', 'Duplicate mapping mismatch')
for aid in ['A15', 'A16', 'A17']:
    check(assets[aid]['classification'] == 'competitor-apms' and assets[aid]['selection'] == 'exclude', f'{aid}: APMS misclassified')
check(index['primaryAssetIds'] == ['A02', 'A07', 'A09'] and index['newProductAssets'] == [], 'Unexpected primary/new asset')

sources = {s['id']: s for s in read('sources.json')['sources']}
claims = {c['id']: c for c in read('claims.json')['claims']}
check(len(claims) == 19, 'Claim register count changed')
for cid, claim in claims.items():
    check(set(claim['statement']) == {'vi', 'en'} and all(claim['statement'].values()), f'{cid}: missing bilingual claim')
    check(bool(claim['sourceIds']) and all(s in sources for s in claim['sourceIds']), f'{cid}: unresolved source')
    check(all(a in assets for a in claim['assetIds']), f'{cid}: unresolved asset')

content = read('content-index.json')
check([s['id'] for s in content['sections']] == ['overview', 'problem', 'decisions', 'artifacts', 'results', 'lessons'], 'Outline order changed')
check(content['uiImplementation'] is False, 'Pack should not imply route implementation')
block_count = 0
for section in content['sections']:
    for block in section['blocks']:
        block_count += 1
        check(set(block['heading']) == {'vi', 'en'} and set(block['body']) == {'vi', 'en'} and all(block['body'].values()), f"{block['id']}: copy parity")
        check(bool(block['claimIds']) and all(c in claims for c in block['claimIds']), f"{block['id']}: unresolved claim")
        check(all(a in assets and assets[a]['selection'] in ['primary', 'optional'] for a in block['assetIds']), f"{block['id']}: unsafe image selection")
        check('coming soon' not in str(block['body']).lower() and 'lorem' not in str(block['body']).lower(), 'Publishing placeholder')
        if block['id'] == 'results.evaluation':
            check(block['status'] == 'qualified-owner-report' and block['body']['vi'].startswith('Theo tác giả') and block['body']['en'].startswith('According to the author'), 'Excellent must remain owner-attributed')
check(content['sections'][-1]['blocks'] == [] and content['sections'][-1]['status'] == 'missing-author-reflection', 'Invented author reflection')

source = read('source-retrieval.json')
body = (ROOT / source['path']).read_bytes()
check(source['status'] == 200 and urlparse(source['finalUrl']).netloc == 'oncoursesystems.com', 'External primary URL not verified')
check(len(body) == source['bytes'] and sha(body) == source['sha256'], 'New source HTML bytes/hash mismatch')
html = body.decode('utf-8')
check('May 2023, 300 educators across eighteen K-12' in html and 'nearly 60%' in html, 'OnCourse evidence missing')
check('2023-08-04T19:28:50+00:00' in html, 'OnCourse publication date missing')
with Image.open(OUT / 'behance-access.png') as image:
    image.load()
    check(image.format == 'PNG', 'New access screenshot decode failed')
check(read('behance-access.json')['status'] == 403, 'Unexpected Behance access outcome; re-review assets if access improved')
for name in ['content.md', 'claim-register.md', 'gaps.md', 'verification.md', 'integration-handoff.md', 'progress-row.txt']:
    check((OUT / name).is_file() and (OUT / name).stat().st_size > 0, f'Missing handoff: {name}')
result = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'assertions': count,
          'sourceFilesUnchanged': len(current), 'assetFilesVerified': 26, 'uniqueAssets': 24,
          'claims': len(claims), 'copyBlocksViEn': block_count, 'newProductImages': 0,
          'newHtmlSourceVerified': 1, 'newScreenshotDecoded': 1,
          'headAndTrackedStatusUnchanged': True, 'agentsOriginalPrefixPreserved': True,
          'errors': [], 'readiness': content['readiness']}
(OUT / 'verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False))
