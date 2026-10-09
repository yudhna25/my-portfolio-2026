from pathlib import Path
from PIL import Image, ImageFilter
import hashlib, json, math

out = Path(__file__).resolve().parent
root = out.parents[2]
result = json.loads((out / 'interaction-results.json').read_text(encoding='utf-8'))
rect = result['alpha'].get('imageRect', result['alpha']['rect'])
source_path = root / 'outputs/redesign/r0.2/portrait/avatar-cutout-color.webp'
image_path = out / 'screenshots/alpha-image.png'
background_path = out / 'screenshots/alpha-background.png'
source = Image.open(source_path).convert('RGBA')
image = Image.open(image_path).convert('RGB')
background = Image.open(background_path).convert('RGB')
assert image.size == background.size == (1440, 900)
assert abs(rect['width'] / rect['height'] - .8) < 1e-6
alpha = source.getchannel('A')
# Ignore resampling-edge ambiguity: a four-source-pixel guard around each mapped sample.
max_alpha = alpha.filter(ImageFilter.MaxFilter(9))
min_alpha = alpha.filter(ImageFilter.MinFilter(9))
counts = {'transparent': 0, 'transparentChanged': 0, 'transparentMaxDelta': 0,
          'opaque': 0, 'opaqueChanged': 0, 'outside': 0, 'outsideChanged': 0}
for y in range(image.height):
    for x in range(image.width):
        delta = max(abs(a-b) for a,b in zip(image.getpixel((x,y)), background.getpixel((x,y))))
        sx = (x+.5-rect['x']) * source.width / rect['width']
        sy = (y+.5-rect['y']) * source.height / rect['height']
        if not (4 <= sx < source.width-4 and 4 <= sy < source.height-4):
            if not (0 <= sx < source.width and 0 <= sy < source.height):
                counts['outside'] += 1
                counts['outsideChanged'] += delta > 0
            continue
        pixel = (math.floor(sx), math.floor(sy))
        if max_alpha.getpixel(pixel) == 0:
            counts['transparent'] += 1
            counts['transparentChanged'] += delta > 0
            counts['transparentMaxDelta'] = max(counts['transparentMaxDelta'], delta)
        elif min_alpha.getpixel(pixel) >= 240:
            counts['opaque'] += 1
            counts['opaqueChanged'] += delta > 0

probes = []
for label,sx,sy in [('leftMargin',20,200),('rightMargin',750,300),('bottomMargin',720,850),
                    ('hairOutside',420,100),('handGap',430,220),('betweenLegs',375,750),
                    ('face',340,205),('shirt',350,405),('pants',530,730)]:
    x = math.floor(rect['x'] + (sx+.5)*rect['width']/source.width)
    y = math.floor(rect['y'] + (sy+.5)*rect['height']/source.height)
    value = {'label':label,'source':[sx,sy],'screen':[x,y],'sourceAlpha':alpha.getpixel((sx,sy)),
             'imageRGB':list(image.getpixel((x,y))),'backgroundRGB':list(background.getpixel((x,y)))}
    value['maxDelta'] = max(abs(a-b) for a,b in zip(value['imageRGB'],value['backgroundRGB']))
    probes.append(value)

assert counts['transparent'] > 100000
assert counts['transparentChanged'] == 0
assert counts['outsideChanged'] == 0
assert counts['opaque'] > 50000 and counts['opaqueChanged']/counts['opaque'] > .95
audit = {'status':'pass','interactionFinished':result['finished'],'viewport':list(image.size),'rect':rect,
         'source':str(source_path.relative_to(root)).replace('\\','/'),
         'sourceSha256':hashlib.sha256(source_path.read_bytes()).hexdigest(),
         'imageSha256':hashlib.sha256(image_path.read_bytes()).hexdigest(),
         'backgroundSha256':hashlib.sha256(background_path.read_bytes()).hexdigest(),
         'counts':counts,'probes':probes,
         'limits':['Desktop DPR1 snapshot pair only; scene held at frameloop never.',
                   'Four-source-pixel guard excludes partially transparent and resampled silhouette edges.',
                   'Asset identity/halo verdict uses the separate visual source review, not this pixel difference alone.']}
(out / 'alpha-render-audit.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf-8')
print(json.dumps(audit))
