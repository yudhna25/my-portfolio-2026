import json
from pathlib import Path
from PIL import Image
out = Path('outputs/visual-revision-2026-10-12/g1-g2-round-2')
records = []
for case in json.loads((out / 'browser-results.json').read_text(encoding='utf-8'))['cases']:
    if case['width'] not in (390, 1440):
        continue
    for tag, pose in zip((.04, .15, .32, .5, .7, .92), case['meteor']):
        image = Image.open(out / 'screenshots' / f"meteor-{tag}-{case['width']}.png").convert('RGB')
        x, y = round(pose['meteor']['x']), round(pose['meteor']['y'])
        def light(px):
            return min(image.getpixel((px, y))) >= 235
        assert light(x), f'Head core absent at {case["width"]}/{tag}'
        left, right = x, x
        while left > 0 and light(left - 1):
            left -= 1
        while right < image.width - 1 and light(right + 1):
            right += 1
        diameter = right - left + 1
        assert 26 <= diameter <= 36 if case['width'] == 390 else 46 <= diameter <= 60
        records.append({'width':case['width'],'progress':tag,'whiteCorePixels':diameter,'haloUniformCssPx':pose['meteor']['halo'],'sparkPool':pose['meteor']['sparks']})
(out / 'pixel-results.json').write_text(json.dumps({'status':'pass','method':'Contiguous near-white row through the actual projected head in CSS-viewport screenshots; halo field is reported separately as a uniform, not a measured glow radius.','records':records},indent=2)+'\n',encoding='utf-8')
print(json.dumps(records))
