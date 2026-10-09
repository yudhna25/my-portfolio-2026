"""Offline provenance, SVG, catalog, line-pattern and anchor checks; exits nonzero on failure."""
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PUBLIC = ROOT / 'public/constellations'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_bytes())
manifest = read(PUBLIC / 'manifest.json')
source = read(HERE / 'sources/index.json')
education = read(HERE / 'education-data.json')['education']
works = read(HERE / 'works-artwork.json')['works']
runtime = read(ROOT / 'src/3d/data/worksConstellations.json')
decoded = read(HERE / 'decode-results.json')
assert len(manifest['assets']) == len(decoded['assets']) == 6
assert len(list(PUBLIC.glob('*.svg'))) == 6
assert (PUBLIC / 'ATTRIBUTION.md').exists() and 'commercial' in (PUBLIC / 'ATTRIBUTION.md').read_text(encoding='utf-8')
assert manifest['catalog']['positionEpoch'] == 'J1991.25' and manifest['catalog']['properMotionApplied'] is False
assert manifest['revision'] == read(HERE / 'sources/revision.json')['sha']
assert 'Text and data: CC BY-SA 4.0' in (HERE / 'sources/description.md').read_text(encoding='utf-8')
assert 'Illustrations: Free Art License' in (HERE / 'sources/description.md').read_text(encoding='utf-8')
for receipt in read(HERE / 'source-receipts.json'):
    p = HERE / 'sources' / receipt['filename']
    assert sha(p) == receipt['sha256'] and p.stat().st_size == receipt['bytes']
catalog = {}
for line in (HERE / 'sources/hipparcos-stars.tsv').read_text(encoding='utf-8').splitlines():
    row = line.split('\t')
    if len(row) == 4 and row[0].strip().isdigit():
        hip, ra, dec, vmag = map(float, row)
        catalog[int(hip)] = (ra, dec, vmag)


def projected(hip, projection):
    ra, dec, _ = catalog[hip]
    a, d, a0, d0 = map(math.radians, [ra, dec, projection['origin']['raDeg'], projection['origin']['decDeg']])
    den = math.sin(d0) * math.sin(d) + math.cos(d0) * math.cos(d) * math.cos(a - a0)
    assert den > 0
    k = projection['uniformScale']
    return np.array([-math.cos(d) * math.sin(a - a0) / den * k,
                     (math.cos(d0) * math.sin(d) - math.sin(d0) * math.cos(d) * math.cos(a - a0)) / den * k])


def transform(m, xy):
    p = np.asarray(m) @ [*xy, 1]
    return p[:2] / p[2]


results = []
for asset in manifest['assets']:
    art = asset['artwork']
    svg_path = PUBLIC / f"{asset['name'].lower()}.svg"
    text = svg_path.read_text(encoding='utf-8')
    doc = ET.fromstring(text)
    tags = [e.tag.split('}')[-1] for e in doc.iter()]
    assert not set(tags) & {'image', 'script', 'foreignObject', 'filter', 'style', 'use'}
    assert 'data:' not in text and 'base64' not in text
    assert len(doc.findall('.//{*}path')) >= 2
    assert art['viewBox'] == list(map(int, doc.get('viewBox').split()))
    assert sha(svg_path) == art['sha256']
    src = next(c for c in source['constellations'] if c['id'] == f"CON modern {asset['id']}")
    assert asset['source']['revision'] == manifest['revision']
    assert asset['source']['size'] == src['image']['size']
    assert sha(HERE / 'sources' / src['image']['file'].split('/')[-1]) == asset['source']['sha256']
    assert len(art['anchors']) == 3
    assert np.linalg.det(art['sourcePixelToVector']) > 0, 'Unexpected artwork mirror'
    entry = next(c for c in education + works if c['constellationId'] == asset['id'])
    geometry = entry['geometry']
    assert geometry['polylinesHip'] == src['lines']
    edges = [[f'HIP {a}', f'HIP {b}'] for line in src['lines'] for a, b in zip(line, line[1:])]
    assert geometry['edges'] == edges
    assert {s['hip'] for s in geometry['stars']} == set(h for line in src['lines'] for h in line)
    max_star_error = 0
    for star in geometry['stars']:
        assert (star['raDeg'], star['decDeg'], star['vmag']) == catalog[star['hip']]
        error = np.linalg.norm(projected(star['hip'], entry['projection']) - star['position'][:2])
        max_star_error = max(max_star_error, error)
        assert error < 1e-8
    anchor_errors, roundtrip_errors = [], []
    for anchor, reference in zip(art['anchors'], src['image']['anchors']):
        assert anchor['sourcePixel'] == reference['pos'] and anchor['hip'] == reference['hip']
        assert (anchor['raDeg'], anchor['decDeg']) == catalog[anchor['hip']][:2]
        actual = transform(art['vectorPixelToLocal'], transform(art['sourcePixelToVector'], anchor['sourcePixel']))
        error = float(np.linalg.norm(actual - projected(anchor['hip'], entry['projection'])))
        assert error < 1e-12
        anchor_errors.append(error)
        roundtrip = transform(np.linalg.inv(art['sourcePixelToVector']), anchor['vectorPixel'])
        roundtrip_error = float(np.linalg.norm(roundtrip - anchor['sourcePixel']))
        assert roundtrip_error < 1e-9
        roundtrip_errors.append(roundtrip_error)
    if asset['section'] == 'works':
        original = next(c for c in runtime['constellations'] if c['id'] == asset['id'])
        assert geometry == original['geometry'] and entry['projection'] == original['projection']
    if asset['id'] == 'Sco':
        assert [s['hip'] for s in entry['calibrationStars']] == [82729]
        assert all('HIP 82729' not in edge for edge in edges)
        assert 82671 in {s['hip'] for s in geometry['stars']}
    gray = np.array(Image.open(HERE / 'sources' / f"{asset['name'].lower()}.png").convert('L').filter(ImageFilter.GaussianBlur(.55)))
    mask = gray >= 12
    inverse = np.linalg.inv(art['sourcePixelToVector'])
    signed_area, traced_vertices = 0, 0
    paths = doc.findall('{*}g')[0].findall('{*}path')
    for path in paths:
        d = path.get('d')
        assert not re.sub(r'[MLZ\s,.\d-]', '', d)
        coordinates = np.array(list(map(float, re.findall(r'-?\d+\.\d+', d)))).reshape(-1, 2)
        assert np.all(np.isfinite(coordinates))
        original_pixels = np.array([transform(inverse, p) for p in coordinates])
        p = np.vstack([original_pixels, original_pixels[0]])
        signed_area += np.sum(p[:-1, 0] * p[1:, 1] - p[1:, 0] * p[:-1, 1]) / 2
        for x, y in original_pixels:
            near = mask[max(0, int(y) - 2):min(mask.shape[0], int(y) + 3), max(0, int(x) - 2):min(mask.shape[1], int(x) + 3)]
            assert near.any() and not near.all(), 'Vector silhouette vertex must follow real source ink boundary'
        traced_vertices += len(original_pixels)
    area_relative_error = abs(abs(signed_area) - int(mask.sum())) / int(mask.sum())
    assert area_relative_error < .02
    results.append(dict(id=asset['id'], stars=len(geometry['stars']), edges=len(edges),
                        context=len(geometry['supportingStars']), calibration=len(asset['calibrationStars']),
                        anchors=3, maxAnchorLocalError=max(anchor_errors), maxAnchorSourceRoundtripPx=max(roundtrip_errors),
                        maxMainStarProjectionError=max_star_error, silhouetteAreaRelativeError=area_relative_error,
                        sourceBoundaryVerticesChecked=traced_vertices, svgBytes=svg_path.stat().st_size))
protected = read(HERE / 'protected-baseline.json')
changed = [path for path, old in protected.items() if not (ROOT / path).exists() or sha(ROOT / path) != old]
added_source = [p.relative_to(ROOT).as_posix() for p in (ROOT / 'src').rglob('*') if p.is_file() and p.relative_to(ROOT).as_posix() not in protected]
parallel_owners = {
    'src/components/Hero.jsx': 'V1', 'src/components/effects/PortalHeading.jsx': 'V1',
    'src/3d/components/BlackHole.jsx': 'V2', 'src/3d/components/BlackHoleSystem.jsx': 'V2',
    'src/3d/components/BlackHoleBloomMask.jsx': 'V2', 'src/3d/shaders/blackHole.js': 'V2', 'src/3d/quality.js': 'V2',
    'src/styles/hero.css': 'V1',
}
assert not set(changed) - parallel_owners.keys(), f'Unclassified protected changes: {changed}'
assert not set(added_source) - parallel_owners.keys(), f'Unclassified added source: {added_source}'
concurrent = [dict(path=p, owner=parallel_owners[p], baselineSha256=protected[p], currentSha256=sha(ROOT / p),
                   note='Observed external worker change; V4 did not write this file.') for p in changed]
concurrent += [dict(path=p, owner=parallel_owners[p], baselineSha256=None, currentSha256=sha(ROOT / p),
                    note='New file from parallel owner; V4 did not write this file.') for p in added_source]
(HERE / 'concurrent-changes.json').write_text(json.dumps(concurrent, indent=2) + '\n', encoding='utf-8')
assert sum(len(a['opacityStats']) for a in decoded['assets']) == 24
report = dict(status='PASS', assets=results, sources=len(read(HERE / 'source-receipts.json')),
              protectedFilesUnchanged=len(protected) - len(changed), concurrentProtectedChanges=concurrent,
              svgDecode='6/6 via librsvg', opacityChecks='24/24 rendered on #050505; visual interpretation in verification.md')
(HERE / 'check-results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
