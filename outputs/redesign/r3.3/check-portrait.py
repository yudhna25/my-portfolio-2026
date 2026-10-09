from pathlib import Path
from PIL import Image
import hashlib, json

out = Path(__file__).resolve().parent
root = out.parents[2]
manifest = json.loads((root / 'outputs/redesign/r0.2/assets-manifest.json').read_text(encoding='utf-8'))
asset = next(a for a in manifest['assets'] if a['id'] == 'avatar-cutout')
source = next(f for f in asset['files'] if f['role'] == 'web')
path = root / source['path']
digest = hashlib.sha256(path.read_bytes()).hexdigest()
assert digest == source['sha256']
with Image.open(path) as im:
    im.load()
    assert im.mode == 'RGBA' and im.size == (800, 1000)
    alpha = im.getchannel('A')
    histogram = alpha.histogram()
    probes = [(0, 0), (799, 0), (0, 999), (799, 999), (100, 150), (200, 150), (600, 150), (100, 400), (600, 600), (100, 900), (260, 980)]
    assert all(im.getpixel(p)[3] == 0 for p in probes)
    assert histogram[0] > 400000 and sum(histogram[240:]) > 200000
    dark = Image.new('RGBA', im.size, (5, 5, 5, 255))
    dark.alpha_composite(im)
    dark.convert('RGB').save(out / 'portrait-on-dark.png')
    result = {'status': 'pass', 'source': source['path'], 'sha256': digest,
              'bytes': path.stat().st_size, 'size': list(im.size), 'mode': im.mode,
              'alphaZero': histogram[0], 'alphaPartial': sum(histogram[1:255]),
              'alphaFull': histogram[255], 'alphaAtLeast240': sum(histogram[240:]),
              'alphaBounds': alpha.getbbox(), 'transparentProbes': len(probes),
              'composite': 'portrait-on-dark.png',
              'note': 'Composite uses decoded alpha; hidden RGB in fully transparent WebP pixels is not rendered.'}
    (out / 'portrait-audit.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result))
