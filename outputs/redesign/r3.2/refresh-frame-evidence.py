"""Refresh hashes/diffs from existing actual captures; no screenshot alteration."""
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageChops

out = Path(__file__).resolve().parent
manifest = json.loads((out / 'frames-manifest.json').read_text(encoding='utf8'))
browser = json.loads((out / 'browser-results.json').read_text(encoding='utf8'))
preview = json.loads((out / 'preview-results.json').read_text(encoding='utf8'))
names = {f['path'] for f in manifest['frames']}
assert names == {f.relative_to(out).as_posix() for f in (out / 'screenshots').glob('*.png') if f.name != 'failure.png'}
for frame in manifest['frames']:
    file = out / frame['path']
    image = Image.open(file)
    frame.update(imageSize={'width': image.width, 'height': image.height}, bytes=file.stat().st_size,
                 sha256=hashlib.sha256(file.read_bytes()).hexdigest(),
                 fileModifiedAt=datetime.fromtimestamp(file.stat().st_mtime, timezone.utc).isoformat())
    assert (frame['viewport']['width'], frame['viewport']['height']) == image.size

pixel_pairs = []
keys = ['camera', 'mini', 'visibility', 'pull', 'center', 'scale', 'aperture', 'anchor', 'intensity']
for pair in manifest['portalPairs']:
    files = [out / p for p in pair['paths']]
    a, b = [Image.open(f).convert('RGB') for f in files]
    assert a.size == b.size
    diff = ImageChops.difference(a, b)
    pixels = list(diff.get_flattened_data())
    changed = sum(max(v) > 0 for v in pixels)
    maximum = max(max(v) for v in pixels)
    records = [v for v in browser['poses'] if v['width'] == pair['width'] and v['requested'] == pair['transitionProgress']]
    assert len(records) == 2
    fields_exact = all(records[0][k] == records[1][k] for k in keys)
    assert fields_exact
    pair.update(fullPngPixelIdentical=changed == 0, changedPixels=changed, maxChannelDifference=maximum,
                sharedPoseAndUniformFieldsExact=fields_exact, comparedFields=keys)
    white = sum(min(pixel) >= 245 for pixel in a.get_flattened_data())
    pixel_pairs.append({'width': pair['width'], 'p': str(pair['transitionProgress']),
                        'files': [f.name for f in files], 'sha256': [hashlib.sha256(f.read_bytes()).hexdigest() for f in files],
                        'changedPixels': changed, 'maxDifference': maximum,
                        'whitePixelsAtLeast245': white, 'whiteFraction': round(white / (a.width * a.height), 7),
                        'forwardMtime': files[0].stat().st_mtime, 'reverseMtime': files[1].stat().st_mtime})

manifest['generatedAt'] = datetime.now(timezone.utc).isoformat()
manifest['verificationRuns'] = {'browser': {'started': browser['started'], 'finished': browser['finished']},
                                'preview': {'started': preview['started'], 'finished': preview['finished']}}
assert len(manifest['frames']) == 48 and Counter(f['group'] for f in manifest['frames'])['portal'] == 20
(out / 'frames-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
pixel_document = {'generatedAt': manifest['generatedAt'], 'browserRun': manifest['verificationRuns']['browser'],
                  'note': 'Final passing capture files. Only five sampled poses per direction; full PNG diff includes time-dependent ambient/year/Nav/old section entrance DOM. Shared camera/portal fields exact independently in frames-manifest.json; no pixel regions excluded or screenshots altered.',
                  'results': pixel_pairs}
(out / 'portal-pixels-audit.json').write_text(json.dumps(pixel_document, indent=2) + '\n', encoding='utf8')
print(json.dumps({'frames': len(manifest['frames']), 'sharedPairsExact': len(manifest['portalPairs']),
                  'fullPngPairsExact': sum(p['fullPngPixelIdentical'] for p in manifest['portalPairs']),
                  'pairs': [{'width': p['width'], 'p': p['transitionProgress'], 'changed': p['changedPixels'], 'max': p['maxChannelDifference']} for p in manifest['portalPairs']]}, indent=2))
