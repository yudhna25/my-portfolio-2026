"""Build each Skills logo's bare mark (no app-icon tile) from its raster (see dump.mjs).

Usage: python3 marks.py raster.json src/3d/data/symbolTargets.json src/3d/data/logoMarks
Writes src/3d/data/logoMarks/<id>.png (white mark, alpha = coverage) and src/3d/data/logoMarks.json:
per logo the cropped size, ordered outline loops and the star points, all in mark units
(longest side of the mark spans 2, y up), so stars, outline and eclipse share one frame.
"""
import base64, json, sys
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, sys.path[0])
from trace_lib import loops, resample, blur

raster = json.load(open(sys.argv[1]))
targets = json.load(open(sys.argv[2]))
out_dir = sys.argv[3]
result = {}
for logo in targets['logos']:
    key = logo['id']; item = raster[key]
    w, h = item['w'], item['h']
    a = np.frombuffer(base64.b64decode(item['rgba']), np.uint8).reshape(h, w, 4).astype(np.float64) / 255
    lum = a[..., :3] @ [.2126, .7152, .0722]
    if key == 'davinci-resolve':
        # Petals only: the tile and its bright bevel stay out, the shaded side of a petal stays in.
        tile = Image.fromarray(((a[..., 3] > .5) * 255).astype(np.uint8))
        inner = np.array(tile.filter(ImageFilter.MinFilter(61))) > 0
        field = blur(((lum > .28) & inner).astype(np.float64), 1)
    else:
        # Vector marks: white ink; app-icon tiles are #1A1A1A and drop out.
        field = a[..., 3] * np.clip((lum - .3) / .4, 0, 1)
    ys, xs = np.nonzero(field > .5)
    m = max(w, h)
    pad = .04 * max(np.ptp(xs), np.ptp(ys))
    x0, x1, y0, y1 = xs.min() - pad, xs.max() + 1 + pad, ys.min() - pad, ys.max() + 1 + pad
    side = max(x1 - x0, y1 - y0)
    # Old units (symbolTargets) -> mark units.
    cx_old, cy_old = ((x0 + x1) / 2 - w / 2) / m * 2, (h / 2 - (y0 + y1) / 2) / m * 2
    k = m / side
    ox, oy = int(np.floor(x0)), int(np.floor(y0))
    crop = np.zeros((int(np.ceil(y1)) - oy, int(np.ceil(x1)) - ox))
    sy0, sx0 = max(0, oy), max(0, ox)
    sy1, sx1 = min(h, oy + crop.shape[0]), min(w, ox + crop.shape[1])
    crop[sy0 - oy:sy1 - oy, sx0 - ox:sx1 - ox] = field[sy0:sy1, sx0:sx1]
    ch, cw = crop.shape
    size = 256 / max(cw, ch)
    img = Image.fromarray((np.clip(crop, 0, 1) * 255).astype(np.uint8)).resize((max(1, round(cw * size)), max(1, round(ch * size))), Image.LANCZOS)
    rgba = Image.new('RGBA', img.size, (255, 255, 255, 0)); rgba.putalpha(img)
    rgba.save(f'{out_dir}/{key}.png', optimize=True)
    cm = max(cw, ch)
    shapes = []
    for loop in loops(blur(crop, 1)):
        r = resample(loop, cm / 80)
        if r is None: continue
        pts = np.c_[(r[:, 0] - cw / 2) / cm * 2, (ch / 2 - r[:, 1]) / cm * 2]
        shapes.append(np.roll(pts, -int(np.argmin(pts[:, 0])), axis=0))
    shapes.sort(key=lambda s: s[0, 0])
    # Star points move into the mark frame; any that sat on the dropped tile snap onto the mark.
    inside = np.argwhere(crop > .5)
    points = []
    for x, y, *_ in logo['points']:
        nx, ny = (x - cx_old) * k, (y - cy_old) * k
        px, py = (nx / 2) * cm + cw / 2, ch / 2 - (ny / 2) * cm
        iy, ix = int(round(py)), int(round(px))
        if not (0 <= iy < ch and 0 <= ix < cw and crop[iy, ix] > .5):
            j = np.argmin((inside[:, 0] - py) ** 2 + (inside[:, 1] - px) ** 2)
            py, px = inside[j]
            nx, ny = (px - cw / 2) / cm * 2, (ch / 2 - py) / cm * 2
        points.append([round(float(nx), 4), round(float(ny), 4)])
    result[key] = {'width': cw, 'height': ch, 'points': points,
                   'loops': [[int(round(v * 1000)) for p in s for v in p] for s in shapes]}
    print(key, cw, ch, len(shapes), round(k, 3))
json.dump(result, open(f'{out_dir}/../logoMarks.json', 'w'), separators=(',', ':'))
