"""Compare displacement 6 -> 0 with the same compositor layer (verify-lens.mjs)."""
from pathlib import Path
import json
from PIL import Image, ImageChops

root = Path(__file__).resolve().parent
rect = json.loads((root / 'lens-results.json').read_text(encoding='utf-8'))['rect']
a = Image.open(root / 'screenshots/lens-filter-active.png').convert('RGB')
b = Image.open(root / 'screenshots/lens-filter-disabled.png').convert('RGB')
diff = ImageChops.difference(a, b)
x0, y0, width, height = (int(rect[key]) for key in ('x', 'y', 'width', 'height'))
inside = outside = maximum = 0
for i, color in enumerate(diff.get_flattened_data()):
    if not max(color):
        continue
    x, y = i % a.width, i // a.width
    maximum = max(maximum, max(color))
    if x0 <= x < x0 + width and y0 <= y < y0 + height:
        inside += 1
    else:
        outside += 1
result = dict(insideChangedPixels=inside, outsideChangedPixels=outside,
              maxDifference=maximum, differenceBounds=diff.getbbox(), rect=rect)
(root / 'lens-pixel-results.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
assert inside > 0, 'Lens must change rendered pixels.'
assert outside == 0, 'Displacement must stay inside the lens.'
print('PASS:', result)
