from pathlib import Path
import json, hashlib, struct
from PIL import Image, ImageOps, ImageDraw, ImageFont

folder = Path(__file__).resolve().parent
manifest = json.loads((folder / 'frame-manifest.json').read_text(encoding='utf-8'))
label_font = ImageFont.truetype(str(folder / 'fonts/google-1.ttf'), 16)
for width, cell_width, cell_height in [(1440, 350, 380), (390, 260, 520), (320, 260, 520)]:
    sheet = Image.new('RGB', (5 * cell_width, 5 * cell_height + 62), '#171717')
    draw = ImageDraw.Draw(sheet)
    draw.text((16, 18), f'R1.1 / {width}px / 25 static states / Vi / see native PNG for reading', font=label_font, fill='white')
    for i, frame in enumerate(manifest['states']):
        p = folder / 'frames' / str(width) / 'vi' / (frame['id'] + '.png')
        with Image.open(p) as im:
            im.load()
            thumb = ImageOps.contain(im.convert('RGB'), (cell_width - 16, cell_height - 44))
        x, y = i % 5 * cell_width, i // 5 * cell_height + 62
        sheet.paste(thumb, (x + (cell_width - thumb.width) // 2, y + 30))
        draw.text((x + 8, y + 6), f'{i + 1:02d} {frame["id"]}', font=label_font, fill='#dddddd')
    sheet.save(folder / f'contact-sheet-{width}.png')

# Record the actual embedded font names/license, without installing font tools.
font_meta = []
license_text = (folder / 'fonts/Unbounded-LICENSE.txt').read_text(encoding='utf-8')
ofl_body = license_text[license_text.index('This Font Software'):]
for p in sorted((folder / 'fonts').glob('google-*.ttf')):
    data = p.read_bytes()
    count = struct.unpack_from('>H', data, 4)[0]
    table_offset = next(struct.unpack_from('>I', data, 12 + i * 16 + 8)[0] for i in range(count) if data[12+i*16:16+i*16] == b'name')
    _, records, strings = struct.unpack_from('>HHH', data, table_offset)
    names = {}
    for i in range(records):
        platform, _, _, name_id, length, offset = struct.unpack_from('>HHHHHH', data, table_offset + 6 + i * 12)
        if name_id not in [0, 1, 2, 13, 14]:
            continue
        raw = data[table_offset + strings + offset:table_offset + strings + offset + length]
        names[str(name_id)] = raw.decode('utf-16-be' if platform in [0, 3] else 'mac_roman', errors='replace')
    (folder / 'fonts' / (p.stem + '-LICENSE.txt')).write_text(names.get('0', '') + '\n\n' + ofl_body, encoding='utf-8')
    font_meta.append({'file': p.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'names': names})
(folder / 'fonts/font-metadata.json').write_text(json.dumps(font_meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'sheets': 3, 'frames': len(manifest['frames']), 'fontFiles': len(font_meta)}))
