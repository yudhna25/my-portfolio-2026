"""Trace ordered outline loops of each Skills logo from its raster (see dump.mjs).

Output units match symbolTargets.json: the logo's longest side spans 2 units, y up.
Ink = the bright mark; tile = the app-icon tile when a logo has one.
"""
import base64, json, sys
import numpy as np

def blur(a, r=2):
    k = 2 * r + 1
    for axis in (0, 1):
        p = np.pad(a, [(r, r) if i == axis else (0, 0) for i in range(2)], mode='edge')
        c = np.cumsum(p, axis=axis, dtype=np.float64)
        c = np.concatenate([np.zeros_like(np.take(c, [0], axis=axis)), c], axis=axis)
        a = (np.take(c, range(k, c.shape[axis]), axis=axis) - np.take(c, range(0, c.shape[axis] - k), axis=axis)) / k
    return a

def loops(field):
    f = np.pad(field, 1)
    h, w = f.shape
    seg = {}
    def edge(y, x, side):  # canonical edge id + interpolated point
        if side == 0: a, b, key = (y, x), (y, x + 1), ('h', y, x)
        elif side == 1: a, b, key = (y, x + 1), (y + 1, x + 1), ('v', y, x + 1)
        elif side == 2: a, b, key = (y + 1, x), (y + 1, x + 1), ('h', y + 1, x)
        else: a, b, key = (y, x), (y + 1, x), ('v', y, x)
        va, vb = f[a] - .5, f[b] - .5
        t = va / (va - vb) if va != vb else .5
        return key, (a[1] + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t)
    pts = {}
    links = {}
    table = {1: [(3, 2)], 2: [(2, 1)], 3: [(3, 1)], 4: [(0, 1)], 5: [(3, 0), (2, 1)], 6: [(0, 2)], 7: [(3, 0)],
             8: [(0, 3)], 9: [(0, 2)], 10: [(0, 1), (2, 3)], 11: [(0, 1)], 12: [(1, 3)], 13: [(1, 2)], 14: [(2, 3)]}
    b = f > .5
    for y in range(h - 1):
        for x in range(w - 1):
            c = b[y, x] * 8 + b[y, x + 1] * 4 + b[y + 1, x + 1] * 2 + b[y + 1, x] * 1
            for s0, s1 in table.get(int(c), []):
                k0, p0 = edge(y, x, s0); k1, p1 = edge(y, x, s1)
                pts[k0], pts[k1] = p0, p1
                links.setdefault(k0, []).append(k1); links.setdefault(k1, []).append(k0)
    seen, result = set(), []
    for start in links:
        if start in seen: continue
        loop, prev, cur = [start], None, start
        seen.add(start)
        while True:
            nxt = [n for n in links[cur] if n != prev and n not in seen]
            if not nxt: break
            prev, cur = cur, nxt[0]; seen.add(cur); loop.append(cur)
        result.append([(pts[k][0] - 1, pts[k][1] - 1) for k in loop])
    return result

def resample(loop, step):
    p = np.array(loop + [loop[0]], dtype=np.float64)
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]
    if d[-1] < step * 6: return None
    n = max(8, int(d[-1] / step))
    s = np.linspace(0, d[-1], n, endpoint=False)
    return np.c_[np.interp(s, d, p[:, 0]), np.interp(s, d, p[:, 1])]

raster = json.load(open(sys.argv[1]))
out = {}
for key, item in raster.items():
    w, h = item['w'], item['h']
    a = np.frombuffer(base64.b64decode(item['rgba']), np.uint8).reshape(h, w, 4).astype(np.float64) / 255
    lum = a[..., :3] @ [.2126, .7152, .0722]
    tile = a[..., 3]
    ink = tile * np.clip((lum - .31) / .24, 0, 1)
    fields = [ink]
    if np.abs(tile - ink).mean() > .05: fields.insert(0, tile)
    m = max(w, h)
    shapes = []
    for field in fields:
        for loop in loops(blur(field)):
            r = resample(loop, m / 80)
            if r is None: continue
            x = (r[:, 0] - w / 2) / m * 2
            y = (h / 2 - r[:, 1]) / m * 2
            pts = np.c_[x, y]
            i = int(np.argmin(pts[:, 0]))
            shapes.append(np.roll(pts, -i, axis=0))
    # A tile with a bright rim traces twice; keep one outline per box.
    boxes, kept = [], []
    for s in shapes:
        box = np.r_[s.min(0), s.max(0)]
        if any(np.abs(box - b).max() < .12 for b in boxes): continue
        boxes.append(box); kept.append(s)
    kept.sort(key=lambda s: s[0, 0])
    # Flat integer pairs in thousandths of a unit keep the bundle small.
    out[key] = [[int(round(v * 1000)) for p in s for v in p] for s in kept]
    print(key, len(out[key]))
json.dump(out, open(sys.argv[2], 'w'), separators=(',', ':'))
