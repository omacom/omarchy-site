#!/usr/bin/env python3
"""Refresh bundled social-card font subsets. Requires fonttools[woff] and Noto fonts.

Pass --only <group> to refresh one group from its current copy; the other
manifest entries are preserved, so no Noto system fonts are needed.
"""
import argparse
import json
import subprocess
import unicodedata
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'scripts/fonts/social'
OUT.mkdir(parents=True, exist_ok=True)
COPIES = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import { socialCopies } from './scripts/lib/social-copy.mjs'; console.log(JSON.stringify(socialCopies))",
], cwd=ROOT))
GROUPS = {
    'en': ('JetBrains', 'JetBrainsMono', None),
    'ar': ('Arabic', 'NotoSansArabic', None),
    'azb': ('South Azerbaijani', None, None),
    'ur': ('Urdu', 'NotoNastaliqUrdu', None),
    'hi': ('Devanagari', 'NotoSansDevanagari', None),
    'bn': ('Bengali', 'NotoSansBengali', None),
    'si': ('Sinhala', 'NotoSansSinhala', None),
    'ta': ('Tamil', 'NotoSansTamil', None),
    'th': ('Thai', 'NotoSansThai', None),
    'ja': ('Japanese', 'NotoSansCJK', 0),
    'ko': ('Korean', 'NotoSansCJK', 1),
    'zh-CN': ('Chinese', 'NotoSansCJK', 2),
}
LATIN = ('Latin', 'NotoSans', None)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--only', action='append',
                    help='refresh only this font group, preserving other manifest entries')
args = parser.parse_args()
manifest_path = OUT / 'manifest.json'
if args.only:
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
else:
    args.only = None
    manifest = {'fonts': {}, 'locales': {}}
groups = {}
for code, copy in COPIES.items():
    group = GROUPS.get(code, LATIN)
    if args.only and group[0] not in args.only:
        continue
    manifest['locales'][code] = group[0]
    text = ''.join(copy['lines'])
    # Pango may decompose marks (for example Thai Sara Am) before shaping.
    characters = text + unicodedata.normalize('NFD', text) + unicodedata.normalize('NFKD', text)
    groups.setdefault(group, set()).update(map(ord, characters))
# Latin letters and punctuation embedded in other scripts use the same bundled fallback.
if not args.only:
    groups.setdefault(LATIN, set()).update(
        {cp for chars in groups.values() for cp in chars if cp < 0x300})
for (group, name, face), characters in groups.items():
    source = Path('/usr/share/fonts/noto') / f'{name}-Regular.ttf'
    if face is not None:
        source = Path('/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc')
    if group == 'JetBrains':
        source = ROOT / 'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'
    if group == 'South Azerbaijani':
        source = ROOT / 'assets/fonts/Xaqan-Code.ttf'
    font = TTFont(source, fontNumber=face if face is not None else -1)
    available = set(font.getBestCmap())
    options = subset.Options()
    options.layout_features = ['*']
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=characters & available)
    worker.subset(font)
    # Distinct family names prevent installed fonts from replacing these subsets.
    family = f'Omarchy Social {group}'
    for record in font['name'].names:
        if record.nameID in (1, 4, 6, 16):
            value = family.replace(' ', '') if record.nameID == 6 else family
            record.string = value.encode(record.getEncoding())
    font.flavor = None
    extension = 'otf' if 'CFF ' in font else 'ttf'
    filename = f'{group.lower().replace(" ", "-")}.{extension}'
    font.save(OUT / filename)
    manifest['fonts'][group] = {
        'family': family, 'file': filename,
        'characters': ''.join(map(chr, sorted(characters & available))),
    }
    print(f'{group}: {(OUT / filename).stat().st_size:,} bytes')
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
