"""Capture the current protected scope and decode existing EDURA files without edits."""
import hashlib
import json
import subprocess
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
OLD = ROOT / 'outputs/visual-redesign-2026-10-07/edura'
sha = lambda data: hashlib.sha256(data).hexdigest()
dump = lambda name, data: (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

protected = sorted([*ROOT.joinpath('src').rglob('*'), *ROOT.joinpath('public').rglob('*'),
                    ROOT / 'index.html', ROOT / 'vite.config.js', *ROOT.glob('package*.json')])
files = [{'path': str(p.relative_to(ROOT)).replace('\\', '/'), 'bytes': p.stat().st_size,
          'sha256': sha(p.read_bytes())} for p in protected if p.is_file()]
agents = (ROOT / 'AGENTS.md').read_bytes()
git = lambda *args: subprocess.check_output(['git', *args], cwd=ROOT).decode('utf-8').rstrip()
baseline = {'createdAt': datetime.now(timezone.utc).isoformat(), 'files': files,
            'agentsBefore': {'bytes': len(agents), 'sha256': sha(agents)},
            'head': git('rev-parse', 'HEAD'),
            'trackedStatus': git('status', '--porcelain=v1', '--untracked-files=no')}
# Never overwrite the original session baseline on reruns.
if not (OUT / 'baseline.json').exists():
    dump('baseline.json', baseline)

manifest = json.loads((OLD / 'manifest.json').read_text(encoding='utf-8-sig'))
records, seen = [], {}
for item in manifest['records']:
    path = OLD / item['file']
    data = path.read_bytes()
    assert len(data) == item['bytes'] and sha(data) == item['sha256']
    with Image.open(path) as img:
        img.load()
        assert img.format == 'WEBP' and img.size == (1400, 989)
        size, mode = list(img.size), img.mode
    duplicate = seen.get(sha(data))
    seen.setdefault(sha(data), item['cacheDiscoveryIndex'])
    records.append({**item, 'path': str(path.relative_to(ROOT)).replace('\\', '/'),
                    'dimensions': size, 'mode': mode, 'decode': 'pass', 'duplicateOfIndex': duplicate})
assert len(records) == 26 and len(seen) == 24
dump('image-audit.json', {'checkedAt': datetime.now(timezone.utc).isoformat(), 'files': 26,
                         'uniqueContent': len(seen), 'totalBytes': sum(r['bytes'] for r in records),
                         'records': records})

sources = OUT / 'sources'
sources.mkdir(exist_ok=True)
url = 'https://oncoursesystems.com/making-school-data-work-fixing-fragmentation/'
retrieval = {'id': 'S-ONCOURSE', 'requestedUrl': url, 'checkedAt': datetime.now(timezone.utc).isoformat()}
try:
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30) as response:
        data = response.read()
        retrieval.update(status=response.status, finalUrl=response.url, contentType=response.headers.get('Content-Type'), bytes=len(data), sha256=sha(data))
    (sources / 'oncourse-fragmentation.html').write_bytes(data)
    retrieval['path'] = 'outputs/redesign/r0.3/sources/oncourse-fragmentation.html'
except Exception as error:
    retrieval['error'] = str(error)
dump('source-retrieval.json', retrieval)
print(json.dumps({'protectedFiles': len(files), 'images': 26, 'unique': 24, 'bytes': 2878812,
                  'sourceStatus': retrieval.get('status'), 'error': retrieval.get('error')}))
