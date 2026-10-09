"""Offline vector trace and catalog calibration. No image generation or runtime edits."""
import hashlib
import json
import math
from pathlib import Path
from xml.sax.saxutils import escape

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PUBLIC = ROOT / 'public/constellations'
REVISION = 'daace2add6a1bf886e8ee1934f51e9c69f818d18'
SPECS = [('Ori', 'orion', 'saigonUniversity', 'SGU'),
         ('Sco', 'scorpius', 'greenAcademy', 'Green Academy'),
         ('Leo', 'leo', 'arenaMultimedia', 'Arena'),
         ('Cen', 'centaurus', 'edura', 'EDURA'),
         ('Gem', 'gemini', 'veris', 'VERIS'),
         ('Cyg', 'cygnus', 'vie', 'VIE')]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def direction(star):
    a, d = np.radians([star['raDeg'], star['decDeg']])
    return np.array([np.cos(d) * np.cos(a), np.cos(d) * np.sin(a), np.sin(d)])


def basis(origin):
    a, d = np.radians([origin['raDeg'], origin['decDeg']])
    return np.array([[np.sin(a), -np.cos(a), 0],
                     [-np.sin(d) * np.cos(a), -np.sin(d) * np.sin(a), np.cos(d)],
                     [np.cos(d) * np.cos(a), np.cos(d) * np.sin(a), np.sin(d)]])


def apply(matrix, points):
    p = np.column_stack([np.asarray(points), np.ones(len(points))]) @ matrix.T
    assert np.all(p[:, 2] > 0), 'Artwork must remain in front of tangent plane'
    return p[:, :2] / p[:, 2, None]


def simplify(points, tolerance):
    if len(points) < 3:
        return points
    p = np.array(points)
    delta = p[-1] - p[0]
    length = np.linalg.norm(delta)
    offset = p - p[0]
    distances = np.linalg.norm(offset, axis=1) if length == 0 else np.abs(delta[0] * offset[:, 1] - delta[1] * offset[:, 0]) / length
    index = int(np.argmax(distances))
    if distances[index] <= tolerance:
        return [points[0], points[-1]]
    return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)


def trace(mask, min_area, tolerance):
    # Follow exposed pixel-grid edges; closed vector paths, not an embedded bitmap.
    padded = np.pad(mask, 1)
    edges = {}
    for y, x in np.argwhere(mask):
        for absent, a, b in [
            (not padded[y, x + 1], (x, y), (x + 1, y)),
            (not padded[y + 1, x + 2], (x + 1, y), (x + 1, y + 1)),
            (not padded[y + 2, x + 1], (x + 1, y + 1), (x, y + 1)),
            (not padded[y + 1, x], (x, y + 1), (x, y))]:
            if absent:
                edges.setdefault(a, []).append(b)
    paths = []
    while edges:
        start = next(iter(edges))
        point, path = start, [start]
        while True:
            options = edges[point]
            # At a diagonal pixel contact, choose the right turn to keep each boundary closed.
            if len(options) > 1 and len(path) > 1:
                prev = np.array(point) - path[-2]
                options.sort(key=lambda q: math.atan2(prev[0] * (q[1] - point[1]) - prev[1] * (q[0] - point[0]), np.dot(prev, np.array(q) - point)), reverse=True)
            q = options.pop(0)
            if not options:
                del edges[point]
            path.append(q)
            point = q
            if point == start:
                break
        p = np.array(path)
        area = abs(np.sum(p[:-1, 0] * p[1:, 1] - p[1:, 0] * p[:-1, 1])) / 2
        if area >= min_area:
            # Split closed contour at its farthest point before Douglas-Peucker reduction.
            cut = int(np.argmax(np.linalg.norm(p[:-1] - p[0], axis=1)))
            reduced = simplify(path[:cut + 1], tolerance)[:-1] + simplify(path[cut:], tolerance)
            if len(reduced) >= 4:
                paths.append(reduced)
    return paths


def svg_path(points):
    return 'M' + ' L'.join(f'{x:.4f},{y:.4f}' for x, y in points[:-1]) + ' Z'


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    baseline_path = HERE / 'protected-baseline.json'
    if not baseline_path.exists():
        paths = [p for p in (ROOT / 'src').rglob('*') if p.is_file()]
        paths += [ROOT / name for name in ['AGENTS.md', 'prompts.md', 'package.json', 'package-lock.json', 'index.html', 'vite.config.js'] if (ROOT / name).exists()]
        save(baseline_path, {p.relative_to(ROOT).as_posix(): digest(p) for p in paths})
    sky = json.loads((HERE / 'sources/index.json').read_bytes())
    works = json.loads((ROOT / 'src/3d/data/worksConstellations.json').read_bytes())
    rows = (HERE / 'sources/hipparcos-stars.tsv').read_text(encoding='utf-8')
    assert 'ICRS, Epoch=J1991.25' in rows
    catalog = {}
    for line in rows.splitlines():
        values = line.split('\t')
        if len(values) == 4 and values[0].strip().isdigit():
            hip, ra, dec, mag = map(float, values)
            assert 0 <= ra < 360 and -90 <= dec <= 90 and math.isfinite(mag)
            catalog[int(hip)] = dict(id=f'HIP {int(hip)}', hip=int(hip), raDeg=ra, decDeg=dec, vmag=mag)
    assert len(catalog) == 88
    assets, education, works_art = [], [], []
    for abbr, name, entity, assignment in SPECS:
        source = next(c for c in sky['constellations'] if c['id'] == f'CON modern {abbr}')
        hips = list(dict.fromkeys(source['lines'][0] + [h for line in source['lines'][1:] for h in line]))
        stars = [catalog[h] for h in hips]
        if abbr in ('Cen', 'Gem', 'Cyg'):
            original = next(c for c in works['constellations'] if c['id'] == abbr)
            assert original['geometry']['polylinesHip'] == source['lines']
            for s in original['geometry']['stars']:
                assert all(s[k] == catalog[s['hip']][k] for k in ['raDeg', 'decDeg', 'vmag'])
            geometry, projection = original['geometry'], original['projection']
        else:
            center = np.sum([direction(s) for s in stars], axis=0)
            origin = dict(raDeg=float(np.degrees(np.arctan2(center[1], center[0])) % 360),
                          decDeg=float(np.degrees(np.arctan2(center[2], np.hypot(center[0], center[1])))))
            tangent = np.array([basis(origin) @ direction(s) for s in stars])
            local = tangent[:, :2] / tangent[:, 2, None]
            radius = max(4, float(np.degrees(np.max(np.arctan(np.linalg.norm(local, axis=1))))) * 1.2)
            projection = dict(type='gnomonic', origin=origin, fieldRadiusDeg=radius,
                              uniformScale=1 / math.tan(math.radians(radius)),
                              xDirection='celestial west right (increasing RA left)', yDirection='north up', z=0,
                              view='sky as seen from Earth, not exterior celestial globe',
                              normalization='same scalar for x/y; no independent stretch, mirroring or invented coordinates')
            geometry = dict(convention='Stellarium Modern', sourceId='stellarium-modern', sourceConstellationId=source['id'],
                            polylinesHip=source['lines'], edges=[[f'HIP {a}', f'HIP {b}'] for line in source['lines'] for a, b in zip(line, line[1:])],
                            stars=[dict(s, position=[*map(float, np.round(p * projection['uniformScale'], 9)), 0]) for s, p in zip(stars, local)],
                            supportingStars=[], supportingStarPolicy='No extra context catalog query in V4. Shared StarField supplies ambient context.', fieldStarsReturned=0)
        image_path = HERE / 'sources' / f'{name}.png'
        image = Image.open(image_path).convert('L')
        assert list(image.size) == source['image']['size']
        side = image.width
        # Trace low-threshold silhouette and strong local dark valleys; omit broad raster shading.
        gray = np.array(image.filter(ImageFilter.GaussianBlur(.55)), dtype=float)
        mask = gray >= 12
        interior = np.array(Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.MinFilter(7))) > 0
        local_mean = np.array(image.filter(ImageFilter.BoxBlur(3)), dtype=float)
        ink = (local_mean - gray >= 9) & (local_mean >= 24) & interior
        outline = trace(mask, 18, .65)
        details = trace(ink, 8, .4)
        assert outline and details
        anchor_pixels = np.array([a['pos'] for a in source['image']['anchors']])
        anchor_directions = np.array([direction(catalog[a['hip']]) for a in source['image']['anchors']])
        # Same three-star art plane as Stellarium ConstellationMgr.cpp:639-641,
        # evaluated at the runtime's J1991.25 epoch, then projected to its tangent plane.
        plate = anchor_directions.T @ np.linalg.inv(np.column_stack([anchor_pixels, np.ones(3)]).T)
        h_local = basis(projection['origin']) @ plate
        h_local[:2] *= projection['uniformScale']
        h_local /= h_local[2, 2]
        # Crop only blank margins after calibration; include all three anchors in the crop.
        ink_bounds = np.vstack([apply(h_local, path) for path in outline] + [apply(h_local, anchor_pixels)])
        low, high = ink_bounds.min(axis=0), ink_bounds.max(axis=0)
        span = float(max(high - low) / .94)
        center = (low + high) / 2
        to_svg = np.array([[side / span, 0, side / 2 - center[0] * side / span],
                           [0, -side / span, side / 2 + center[1] * side / span], [0, 0, 1]])
        h_svg = to_svg @ h_local
        svg_to_local = np.linalg.inv(to_svg)
        out_paths = [svg_path(apply(h_svg, path)) for path in outline]
        detail_paths = [svg_path(apply(h_svg, path)) for path in details]
        credit = f'{name.title()} outline derivative, 2026-10-09. Original: Johan Meuris, Stellarium constellation art (2005), Free Art License; vector tracing/calibration: Tran Vu Anh Duy portfolio / Codex. Modified silhouette/ink contours, grayscale, removed shading; not a recovered vector master.'
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side} {side}" width="{side}" height="{side}">
<title>{name.title()} — calibrated outline derivative</title>
<desc>{escape(credit)}</desc>
<metadata>Copyleft: Free Art License 1.3 https://artlibre.org/licence/lal/en/ ; original https://raw.githubusercontent.com/Stellarium/stellarium/{REVISION}/skycultures/modern/illustrations/{name}.png ; source-to-vector matrix and HIP anchors: /constellations/manifest.json</metadata>
<g fill="none" stroke="#FAFAFA" stroke-width="{1.5 if side == 256 else 2.3}" stroke-linejoin="round" stroke-linecap="round">\n'''
        svg += '\n'.join(f'<path d="{p}"/>' for p in out_paths) + '\n</g>\n<g fill="#D4D4D4" fill-rule="evenodd">\n'
        svg += f'<path d="{" ".join(detail_paths)}"/>\n</g>\n</svg>\n'
        asset_path = PUBLIC / f'{name}.svg'
        asset_path.write_text(svg, encoding='utf-8')
        local_by_hip = {s['hip']: s['position'] for s in geometry['stars']}
        calibration = []
        anchors = []
        for a in source['image']['anchors']:
            s = catalog[a['hip']]
            ray = basis(projection['origin']) @ direction(s)
            local_position = [*(ray[:2] / ray[2] * projection['uniformScale']), 0]
            if a['hip'] not in local_by_hip:
                calibration.append(dict(s, position=list(map(float, local_position)), role='calibration-only; no edge'))
            anchors.append(dict(hip=a['hip'], sourcePixel=a['pos'], vectorPixel=apply(h_svg, [a['pos']])[0].tolist(),
                                localPosition=list(map(float, local_position)), raDeg=s['raDeg'], decDeg=s['decDeg'],
                                role='line-pattern' if a['hip'] in local_by_hip else 'calibration-only'))
        artwork = dict(assetId=abbr, url=f'/constellations/{name}.svg', sha256=digest(asset_path),
                       viewBox=[0, 0, side, side], anchors=anchors,
                       sourcePixelToLocal=h_local.tolist(), sourcePixelToVector=h_svg.tolist(), vectorPixelToLocal=svg_to_local.tolist(),
                       matrixConvention='row-major 3x3, column [x,y,1], divide by third coordinate',
                       plane=dict(center=[*map(float, center), 0], width=span, height=span, localZ=-.01),
                       opacity=dict(idle=[.08, .12], active=[.25, .35]))
        asset = dict(id=abbr, name=name.title(), entityId=entity, assignment=assignment,
                     section='education' if abbr in ('Ori', 'Sco', 'Leo') else 'works',
                     source=dict(url=f'https://raw.githubusercontent.com/Stellarium/stellarium/{REVISION}/skycultures/modern/illustrations/{name}.png',
                                 revision=REVISION, sha256=digest(image_path), size=list(image.size),
                                 metadataSha256=digest(HERE / 'sources/index.json'), author='Johan Meuris',
                                 authorPage='https://johanmeuris.eu/work/stellarium-constellation-art/',
                                 originalLicense='Free Art License (unversioned source notice)', date='2005-10-30 (author portfolio publication date)'),
                     license=dict(artwork='Free Art License 1.3', url='https://artlibre.org/licence/lal/en/',
                                  linePattern='CC BY-SA 4.0 — Stellarium team', catalog='ESA 1997 / CDS VizieR terms; no blanket FAL/CC assignment'),
                     credit=credit, derivative=dict(method='deterministic pixel-grid contour trace + Douglas-Peucker, three-star projective calibration; no AI/no raster embed/no upscale',
                     vectorMasterVerified=False, silhouetteThreshold=12, detailLocalContrast=9, detailsMinArea=8,
                     sourceToVectorApplied=True, crop='calibrated silhouette + three anchors, square with 3% margin per side',
                     outerPaths=len(out_paths), detailContours=len(detail_paths)),
                     artwork=artwork, projection=projection, calibrationStars=calibration)
        assets.append(asset)
        if asset['section'] == 'education':
            education.append(dict(id=entity, constellationId=abbr, name=asset['name'], assignment=assignment,
                                  geometry=geometry, projection=projection, calibrationStars=calibration, artwork=artwork,
                                  notes=['Calibration stars have no added edges.', 'Artwork uses three verified HIP anchors, not center-fit.']))
        else:
            works_art.append(dict(id=entity, constellationId=abbr, artwork=artwork,
                                  geometrySha256=hashlib.sha256(json.dumps(geometry, sort_keys=True, separators=(',', ':')).encode()).hexdigest(),
                                  projection=projection, geometry=geometry))
    manifest = dict(schemaVersion=1, date='2026-10-09', revision=REVISION,
                    revisionDate=json.loads((HERE / 'sources/revision.json').read_bytes())['commit']['committer']['date'],
                    catalog=works['catalog'], linePatternSource=works['chartConvention'],
                    sourceReceipts='outputs/visual-revision-2026-10-09/v4/source-receipts.json',
                    creditsUrl='/constellations/ATTRIBUTION.md', assets=assets)
    save(PUBLIC / 'manifest.json', manifest)
    save(HERE / 'education-data.json', dict(schemaVersion=1, catalog=works['catalog'], education=education))
    save(HERE / 'works-artwork.json', dict(schemaVersion=1, catalog=works['catalog'], works=works_art,
                                         runtimeDataSha256=digest(ROOT / 'src/3d/data/worksConstellations.json')))
    print(json.dumps([dict(id=a['id'], paths=a['derivative']['outerPaths'], details=a['derivative']['detailContours'], bytes=(PUBLIC / f"{a['name'].lower()}.svg").stat().st_size) for a in assets]))


if __name__ == '__main__':
    main()
