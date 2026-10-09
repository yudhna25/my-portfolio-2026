"""Extract browser-printed vector outlines of the installed Unbounded 800."""
import json
from pathlib import Path
from pypdf import PdfReader
from pypdf.generic import ContentStream

reader = PdfReader('outputs/visual-revision-2026-10-09/v1/year-stars/font-proof.pdf')
font = reader.pages[0]['/Resources']['/Font']['/F4']
assert font['/Subtype'] == '/Type3'
paths = {}
for digit, glyph in zip('2067', ['/g88', '/g86', '/g8C', '/g8D']):
    commands = []
    for values, operator in ContentStream(font['/CharProcs'][glyph], reader).operations:
        if operator not in [b'm', b'l', b'c', b'h']:
            continue
        coords = [round(float(value) + (800 if index % 2 else 0), 3) for index, value in enumerate(values)]
        command = {b'm': 'M', b'l': 'L', b'c': 'C', b'h': 'Z'}[operator]
        commands.append(command + ' '.join(f'{value:g}' for value in coords))
    paths[digit] = ' '.join(commands)
assert all(path.startswith('M') and path.endswith('Z') for path in paths.values())
assert paths['0'].count('M') == 2
Path('outputs/visual-revision-2026-10-09/v1/year-stars/contours.json').write_text(json.dumps(paths, indent=2) + '\n')
print({digit: len(path) for digit, path in paths.items()})
