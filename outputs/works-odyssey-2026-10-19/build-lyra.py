"""Lyra for the Stellar Odyssey project: same offline trace + three-star calibration as V4.

Adds the fourth Works figure to src/3d/data/worksConstellations.json and public/constellations.
Sources (sources/): Stellarium Modern lyra.png at the pinned revision, Hipparcos I/239 rows
for the figure stars and a V <= 5.5 field cone (8 deg) for context stars.
"""
import hashlib
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
V4 = ROOT / 'outputs/visual-revision-2026-10-09/v4'
spec = importlib.util.spec_from_file_location('v4', V4 / 'build-assets.py')
v4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v4)
REVISION = v4.REVISION
# Messier 57, the Ring Nebula (SIMBAD, ICRS): between Sheliak (beta) and Sulafat (gamma).
ART_FIT = 0.557
M57 = dict(raDeg=283.39625, decDeg=33.02917)


def rows(path):
    out = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        values = line.split('\t')
        if len(values) == 4 and values[0].strip().isdigit():
            hip, ra, dec, mag = map(float, values)
            out[int(hip)] = dict(id=f'HIP {int(hip)}', hip=int(hip), raDeg=ra, decDeg=dec, vmag=mag)
    return out


def main():
    sky = json.loads((V4 / 'sources/index.json').read_bytes())
    source = next(c for c in sky['constellations'] if c['id'] == 'CON modern Lyr')
    catalog = rows(HERE / 'sources/lyra-stars.tsv')
    field = rows(HERE / 'sources/field.tsv')
    hips = list(dict.fromkeys(source['lines'][0] + [h for line in source['lines'][1:] for h in line]))
    stars = [catalog[h] for h in hips]
    center = np.sum([v4.direction(s) for s in stars], axis=0)
    origin = dict(raDeg=float(np.degrees(np.arctan2(center[1], center[0])) % 360),
                  decDeg=float(np.degrees(np.arctan2(center[2], np.hypot(center[0], center[1])))))
    frame = v4.basis(origin)

    def local(star):
        ray = frame @ v4.direction(star)
        return ray[:2] / ray[2]
    radius = max(4, float(np.degrees(np.max([np.arctan(np.linalg.norm(local(s))) for s in stars]))) * 1.2)
    # The lyre drawing is about twice the size of its five stars: shrink the figure so its art
    # plane matches the other Works figures (~1.6 units), one uniform scalar for stars and art.
    scale = 1 / math.tan(math.radians(radius)) * ART_FIT
    place = lambda s: [*map(float, np.round(local(s) * scale, 9)), 0]
    projection = dict(type='gnomonic', origin=origin, fieldRadiusDeg=math.degrees(math.atan(1 / scale)), uniformScale=scale,
                      xDirection='celestial west right (increasing RA left)', yDirection='north up', z=0,
                      view='sky as seen from Earth, not exterior celestial globe',
                      normalization='same scalar for x/y; no independent stretch, mirroring or invented coordinates')
    # Context: the 12 brightest V <= 5.5 field stars that are not figure stars, inside the figure's view.
    context = [s for s in sorted(field.values(), key=lambda s: s['vmag']) if s['hip'] not in hips
               and np.linalg.norm(local(s) * scale) < 0.95][:12]
    geometry = dict(convention='Stellarium Modern', sourceId='stellarium-modern', sourceConstellationId=source['id'],
                    polylinesHip=source['lines'], edges=[[f'HIP {a}', f'HIP {b}'] for line in source['lines'] for a, b in zip(line, line[1:])],
                    stars=[dict(s, position=place(s)) for s in stars],
                    supportingStars=[dict(s, position=place(s)) for s in context],
                    supportingStarPolicy='At most 12 brightest Johnson V <= 5.5 field stars, excluding stick-figure stars. No edge; a cone may include adjacent constellations. These are context, not members added to the figure.',
                    fieldStarsReturned=len(field))

    image_path = HERE / 'sources/lyra.png'
    image = Image.open(image_path).convert('L')
    assert list(image.size) == source['image']['size']
    side = image.width
    gray = np.array(image.filter(ImageFilter.GaussianBlur(.55)), dtype=float)
    mask = gray >= 12
    interior = np.array(Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.MinFilter(7))) > 0
    local_mean = np.array(image.filter(ImageFilter.BoxBlur(3)), dtype=float)
    ink = (local_mean - gray >= 9) & (local_mean >= 24) & interior
    outline = v4.trace(mask, 18, .65)
    details = v4.trace(ink, 8, .4)
    assert outline and details
    anchor_pixels = np.array([a['pos'] for a in source['image']['anchors']])
    anchor_directions = np.array([v4.direction(catalog[a['hip']]) for a in source['image']['anchors']])
    plate = anchor_directions.T @ np.linalg.inv(np.column_stack([anchor_pixels, np.ones(3)]).T)
    h_local = frame @ plate
    h_local[:2] *= scale
    h_local /= h_local[2, 2]
    ink_bounds = np.vstack([v4.apply(h_local, path) for path in outline] + [v4.apply(h_local, anchor_pixels)])
    low, high = ink_bounds.min(axis=0), ink_bounds.max(axis=0)
    span = float(max(high - low) / .94)
    mid = (low + high) / 2
    to_svg = np.array([[side / span, 0, side / 2 - mid[0] * side / span],
                       [0, -side / span, side / 2 + mid[1] * side / span], [0, 0, 1]])
    h_svg = to_svg @ h_local
    out_paths = [v4.svg_path(v4.apply(h_svg, path)) for path in outline]
    detail_paths = [v4.svg_path(v4.apply(h_svg, path)) for path in details]
    credit = 'Lyra outline derivative, 2026-10-19. Original: Johan Meuris, Stellarium constellation art (2005), Free Art License; vector tracing/calibration: Tran Vu Anh Duy portfolio / Claude. Modified silhouette/ink contours, grayscale, removed shading; not a recovered vector master.'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {side} {side}" width="{side}" height="{side}">
<title>Lyra — calibrated outline derivative</title>
<desc>{v4.escape(credit)}</desc>
<metadata>Copyleft: Free Art License 1.3 https://artlibre.org/licence/lal/en/ ; original https://raw.githubusercontent.com/Stellarium/stellarium/{REVISION}/skycultures/modern/illustrations/lyra.png ; source-to-vector matrix and HIP anchors: /constellations/manifest.json</metadata>
<g fill="none" stroke="#FAFAFA" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">\n'''
    svg += '\n'.join(f'<path d="{p}"/>' for p in out_paths) + '\n</g>\n<g fill="#D4D4D4" fill-rule="evenodd">\n'
    svg += f'<path d="{" ".join(detail_paths)}"/>\n</g>\n</svg>\n'
    asset_path = ROOT / 'public/constellations/lyra.svg'
    asset_path.write_text(svg, encoding='utf-8')
    anchors = [dict(hip=a['hip'], sourcePixel=a['pos'], vectorPixel=v4.apply(h_svg, [a['pos']])[0].tolist(),
                    localPosition=[*map(float, local(catalog[a['hip']]) * scale), 0],
                    raDeg=catalog[a['hip']]['raDeg'], decDeg=catalog[a['hip']]['decDeg'], role='line-pattern')
               for a in source['image']['anchors']]
    artwork = dict(assetId='Lyr', url='/constellations/lyra.svg', sha256=v4.digest(asset_path), viewBox=[0, 0, side, side],
                   anchors=anchors, sourcePixelToLocal=h_local.tolist(), sourcePixelToVector=h_svg.tolist(),
                   vectorPixelToLocal=np.linalg.inv(to_svg).tolist(),
                   matrixConvention='row-major 3x3, column [x,y,1], divide by third coordinate',
                   plane=dict(center=[*map(float, mid), 0], width=span, height=span, localZ=-.01),
                   opacity=dict(idle=[.08, .12], active=[.25, .35]))
    ring = [*map(float, local(M57) * scale)]
    entry = dict(id='Lyr', name='Lyra', assignment='STELLAR ODYSSEY', section='works', status='ready', nameMeaning='Lyre',
                 designInterpretation='Cây đàn của Orpheus, người đi xuống bóng tối rồi trở về; liên hệ hành trình của chính trang web là diễn giải thiết kế.',
                 meaningSourceIds=['iau-names'], geometry=geometry, projection=projection,
                 referenceChart=dict(sourceId='iau-charts', path='https://iauarchive.eso.org/public/themes/constellations/', role='comparison only; IAU/MacRobert patterns can differ from selected Modern figure'),
                 notes=[f'Phenomenon: Messier 57, the Ring Nebula, RA {M57["raDeg"]} Dec {M57["decDeg"]} (ICRS), local {ring[0]:.4f}, {ring[1]:.4f}; it lies on the Sheliak–Sulafat edge.'],
                 artwork=artwork, phenomenon=dict(id='M57', name='Ring Nebula', localPosition=ring))
    data_path = ROOT / 'src/3d/data/worksConstellations.json'
    data = json.loads(data_path.read_bytes())
    data['constellations'] = [c for c in data['constellations'] if c['id'] != 'Lyr'] + [entry]
    data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    manifest_path = ROOT / 'public/constellations/manifest.json'
    manifest = json.loads(manifest_path.read_bytes())
    asset = dict(id='Lyr', name='Lyra', entityId='odyssey', assignment='STELLAR ODYSSEY', section='works',
                 source=dict(url=f'https://raw.githubusercontent.com/Stellarium/stellarium/{REVISION}/skycultures/modern/illustrations/lyra.png',
                             revision=REVISION, sha256=v4.digest(image_path), size=list(image.size),
                             metadataSha256=v4.digest(V4 / 'sources/index.json'), author='Johan Meuris',
                             authorPage='https://johanmeuris.eu/work/stellarium-constellation-art/',
                             originalLicense='Free Art License (unversioned source notice)', date='2005-10-30 (author portfolio publication date)'),
                 license=dict(artwork='Free Art License 1.3', url='https://artlibre.org/licence/lal/en/',
                              linePattern='CC BY-SA 4.0 — Stellarium team', catalog='ESA 1997 / CDS VizieR terms; no blanket FAL/CC assignment'),
                 credit=credit, derivative=dict(method='deterministic pixel-grid contour trace + Douglas-Peucker, three-star projective calibration; no AI/no raster embed/no upscale',
                 vectorMasterVerified=False, silhouetteThreshold=12, detailLocalContrast=9, detailsMinArea=8,
                 sourceToVectorApplied=True, crop='calibrated silhouette + three anchors, square with 3% margin per side',
                 outerPaths=len(out_paths), detailContours=len(detail_paths)),
                 artwork=artwork, projection=projection, calibrationStars=[])
    manifest['assets'] = [a for a in manifest['assets'] if a['id'] != 'Lyr'] + [asset]
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(dict(origin=origin, radius=radius, stars=[(s['id'], place(s)) for s in stars], ring=ring,
                          plane=artwork['plane'], context=len(context), paths=len(out_paths), details=len(detail_paths),
                          bytes=asset_path.stat().st_size)))


if __name__ == '__main__':
    main()
