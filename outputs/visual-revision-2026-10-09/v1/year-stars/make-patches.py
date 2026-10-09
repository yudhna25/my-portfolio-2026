from pathlib import Path
from difflib import unified_diff
import subprocess
root = Path('outputs/visual-revision-2026-10-09/v1')
revision = []
for previous, current in [('PortalHeading.before.jsx', 'src/components/effects/PortalHeading.jsx'), ('hero.before.css', 'src/styles/hero.css')]:
    before = (root / 'year-stars' / previous).read_text(encoding='utf-8').splitlines(keepends=True)
    after = Path(current).read_text(encoding='utf-8').splitlines(keepends=True)
    revision.append(f'diff --git a/{current} b/{current}\n' + ''.join(unified_diff(before, after, fromfile=f'a/{current}', tofile=f'b/{current}')))
(root / 'year-stars/year-stars.patch').write_text(''.join(revision), encoding='utf-8', newline='\n')
full = subprocess.check_output(['git', 'diff', '--', 'src/components/Hero.jsx', 'src/components/effects/PortalHeading.jsx']).decode('utf-8')
css = Path('src/styles/hero.css').read_text(encoding='utf-8').splitlines(keepends=True)
full += 'diff --git a/src/styles/hero.css b/src/styles/hero.css\nnew file mode 100644\n' + ''.join(unified_diff([], css, fromfile='/dev/null', tofile='b/src/styles/hero.css'))
(root / 'v1-owned.patch').write_text(full, encoding='utf-8', newline='\n')
for patch in [root / 'year-stars/year-stars.patch', root / 'v1-owned.patch']:
    subprocess.run(['git', 'apply', '--reverse', '--check', str(patch)], check=True)
print('Both patches reverse-check against current source')
