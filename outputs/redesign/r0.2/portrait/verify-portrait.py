from pathlib import Path
from PIL import Image
import json, hashlib

folder = Path(__file__).resolve().parent
root = folder.parents[3]
baseline = json.loads((folder.parent / 'source-baseline.json').read_text(encoding='utf-8'))
original = root / 'public/avatar.webp'
expected = next(f['sha256'] for f in baseline['files'] if f['path'] == 'public/avatar.webp')
assert hashlib.sha256(original.read_bytes()).hexdigest() == expected
web = folder / 'avatar-cutout-color.webp'
with Image.open(web) as im:
    im.load()
    assert im.size == (800, 1000) and im.mode == 'RGBA'
    alpha = im.getchannel('A').histogram()
    probes = [(0,0),(799,0),(0,999),(799,999),(100,150),(200,150),(600,150),(100,400),(600,600),(100,900),(260,980)]
    assert all(im.getpixel(p)[3] == 0 for p in probes)
    assert alpha[0] > 400000 and sum(alpha[240:]) > 200000
    def green_count(box):
        return sum(a > 200 and g > r * 1.3 and g > b * 1.05 for r,g,b,a in im.crop(box).get_flattened_data())
    assert green_count((300,330,470,505)) > 3000, 'Shirt print colors erased'
    assert green_count((280,505,320,550)) > 50, 'Watch colors erased'
    result = {'status':'pass','format':im.format,'mode':im.mode,'size':im.size,'bytes':web.stat().st_size,
        'sha256':hashlib.sha256(web.read_bytes()).hexdigest(),'originalHashUnchanged':True,
        'alphaZero':alpha[0],'alphaFull':alpha[255],'alphaPartial':sum(alpha[1:255]),
        'backgroundProbesTransparent':len(probes),'shirtAndWatchColorsRetained':True,
        'visualEvidence':['portrait-inspection.png','portrait/face-and-edge-comparison.png','portrait/cutout-on-white.png'],
        'visualVerdict':'V2 identity, pose, glasses, raised hand and clothing recognizable; baked circle/halo/triangles removed. Fine hair edges inspected on dark/light. Original visible seating support retained.',
        'limit':'AI texture is not pixel-identical. This check tests decode/alpha/color/source bytes; facial identity requires visual review.'}
(folder / 'alpha-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
