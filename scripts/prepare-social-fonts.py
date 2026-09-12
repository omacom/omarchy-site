#!/usr/bin/env python3
"""Refresh the bundled social-card font subsets, or report the glyphs they lack.

    .venv-fonts/bin/python scripts/prepare-social-fonts.py            # write subsets
    .venv-fonts/bin/python scripts/prepare-social-fonts.py --report   # check coverage only

Each registry entry's ISO 15924 `script` picks a Noto family; a few codes
override it (English keeps JetBrains Mono, Urdu keeps Nastaliq). Requires
fonttools[woff] plus the Noto fonts, found in NOTO_DIR (/usr/share/fonts/noto,
Arch package noto-fonts) and NOTO_CJK_DIR (/usr/share/fonts/noto-cjk, package
noto-fonts-cjk). Locales without translated card copy yet are skipped.
"""
import json
import os
import subprocess
import sys
import unicodedata
from pathlib import Path

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit('fontTools is missing; run python3 -m venv .venv-fonts && '
             ".venv-fonts/bin/pip install 'fonttools[woff]' (see scripts/fonts/social/README.md)")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'scripts/fonts/social'
NOTO_DIR = Path(os.environ.get('NOTO_DIR', '/usr/share/fonts/noto'))
NOTO_CJK_DIR = Path(os.environ.get('NOTO_CJK_DIR', '/usr/share/fonts/noto-cjk'))
REPORT = any(flag in sys.argv[1:] for flag in ('--report', '--check'))

# ISO 15924 script -> (subset group, Noto family). Latin, Greek, and Cyrillic
# share one Noto Sans subset, which also serves as the Latin fallback for every
# other script. CJK families are faces of the NotoSansCJK collection.
SCRIPT_FAMILIES = {
    'Latn': ('Latin', 'NotoSans'),
    'Grek': ('Latin', 'NotoSans'),
    'Cyrl': ('Latin', 'NotoSans'),
    'Arab': ('Arabic', 'NotoSansArabic'),
    'Hebr': ('Hebrew', 'NotoSansHebrew'),
    'Armn': ('Armenian', 'NotoSansArmenian'),
    'Geor': ('Georgian', 'NotoSansGeorgian'),
    'Ethi': ('Ethiopic', 'NotoSansEthiopic'),
    'Deva': ('Devanagari', 'NotoSansDevanagari'),
    'Beng': ('Bengali', 'NotoSansBengali'),
    'Guru': ('Gurmukhi', 'NotoSansGurmukhi'),
    'Gujr': ('Gujarati', 'NotoSansGujarati'),
    'Orya': ('Odia', 'NotoSansOriya'),
    'Taml': ('Tamil', 'NotoSansTamil'),
    'Telu': ('Telugu', 'NotoSansTelugu'),
    'Knda': ('Kannada', 'NotoSansKannada'),
    'Mlym': ('Malayalam', 'NotoSansMalayalam'),
    'Sinh': ('Sinhala', 'NotoSansSinhala'),
    'Thai': ('Thai', 'NotoSansThai'),
    'Laoo': ('Lao', 'NotoSansLao'),
    'Mymr': ('Myanmar', 'NotoSansMyanmar'),
    'Khmr': ('Khmer', 'NotoSansKhmer'),
    'Tibt': ('Tibetan', 'NotoSerifTibetan'),
    'Jpan': ('Japanese', 'NotoSansCJK', 0),
    'Kore': ('Korean', 'NotoSansCJK', 1),
    'Hans': ('Chinese', 'NotoSansCJK', 2),
}
# Language code -> family, when the script's default is not the right voice.
CODE_FAMILIES = {
    'en': ('JetBrains', 'JetBrainsMono'),
    'ur': ('Urdu', 'NotoNastaliqUrdu'),
}
LATIN = SCRIPT_FAMILIES['Latn']
# Marks and controls Pango handles without a glyph; matches social-labels.mjs.
INVISIBLE = set(map(chr, [*range(0x200C, 0x2010), *range(0x202A, 0x202F), *range(0x2066, 0x206A)]))


def family_source(group):
    name, face = group[1], group[2] if len(group) > 2 else None
    if name == 'JetBrainsMono':
        return ROOT / 'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2', None, 'npm install'
    if face is not None:
        return NOTO_CJK_DIR / 'NotoSansCJK-Regular.ttc', face, 'noto-fonts-cjk (set NOTO_CJK_DIR)'
    return NOTO_DIR / f'{name}-Regular.ttf', None, 'noto-fonts (set NOTO_DIR)'


def load_family(group):
    source, face, package = family_source(group)
    if not source.exists():
        sys.exit(f'{group[1]} is missing: {source} not found; install {package}')
    # Keep the source's modification date so identical input yields identical bytes.
    return TTFont(source, fontNumber=face if face is not None else -1, recalcTimestamp=False)


def card_copies():
    """Card copy per content locale from the registry, and the drafts without it."""
    script = """
      import locales from './src/i18n/locales.json' with { type: 'json' }
      import { socialCopies, socialCopyDrafts } from './scripts/lib/social-copy.mjs'
      const copies = {}, drafts = {}
      for (const code of Object.keys(locales)) {
        if (locales[code].contentLocale) continue
        if (socialCopies[code]) copies[code] = { ...socialCopies[code], script: locales[code].script }
        else drafts[code] = socialCopyDrafts[code]
      }
      console.log(JSON.stringify({ copies, drafts }))
    """
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', script], cwd=ROOT))


def family_for(code, script):
    group = CODE_FAMILIES.get(code) or SCRIPT_FAMILIES.get(script)
    if not group:
        sys.exit(f'{code}: no font family mapped for script {script!r}; add it to SCRIPT_FAMILIES')
    return group


def card_characters(copy):
    text = ''.join(copy['lines'])
    # Pango may decompose marks (for example Thai Sara Am) before shaping.
    return set(text + unicodedata.normalize('NFD', text) + unicodedata.normalize('NFKD', text))


def missing_glyphs(copy, cmap, latin_cmap):
    text = ''.join(copy['lines'])
    return sorted(
        char for char in set(text)
        if char not in INVISIBLE and not char.isspace()
        and ord(char) not in cmap and ord(char) not in latin_cmap
    )


def describe(char):
    return f'U+{ord(char):04X} {unicodedata.name(char, "?")}'


def main():
    data = card_copies()
    for code, reason in sorted(data['drafts'].items()):
        print(f'{code}: skipped, no card copy yet ({reason})')

    manifest = {'fonts': {}, 'locales': {}}
    groups = {}
    for code, copy in data['copies'].items():
        group = family_for(code, copy.get('script'))
        manifest['locales'][code] = group[0]
        groups.setdefault(group, {'codes': [], 'characters': set()})
        groups[group]['codes'].append(code)
        groups[group]['characters'].update(map(ord, card_characters(copy)))
    groups.setdefault(LATIN, {'codes': [], 'characters': set()})
    # Latin letters and punctuation embedded in other scripts use the same bundled fallback.
    groups[LATIN]['characters'].update({cp for entry in groups.values() for cp in entry['characters'] if cp < 0x300})

    fonts = {group: load_family(group) for group in groups}
    cmaps = {group: set(font.getBestCmap()) for group, font in fonts.items()}

    gaps = 0
    for group, entry in groups.items():
        for code in entry['codes']:
            missing = missing_glyphs(data['copies'][code], cmaps[group], cmaps[LATIN])
            if missing:
                gaps += 1
                print(f'{code}: {group[1]} lacks ' + ', '.join(map(describe, missing)))
            elif REPORT:
                print(f'{code}: {group[1]} covers all {len(card_characters(data["copies"][code]))} card characters')
    if REPORT:
        sys.exit(1 if gaps else 0)
    if gaps:
        print(f'{gaps} locale(s) will render tofu; pick another family or fix the copy', file=sys.stderr)

    OUT.mkdir(parents=True, exist_ok=True)
    for group, entry in groups.items():
        font, available = fonts[group], cmaps[group]
        characters = entry['characters']
        options = subset.Options()
        options.layout_features = ['*']
        worker = subset.Subsetter(options=options)
        worker.populate(unicodes=characters & available)
        worker.subset(font)
        # Distinct family names prevent installed fonts from replacing these subsets.
        family = f'Omarchy Social {group[0]}'
        for record in font['name'].names:
            if record.nameID in (1, 4, 6, 16):
                value = family.replace(' ', '') if record.nameID == 6 else family
                record.string = value.encode(record.getEncoding())
        font.flavor = None
        extension = 'otf' if 'CFF ' in font else 'ttf'
        filename = f'{group[0].lower()}.{extension}'
        font.save(OUT / filename)
        manifest['fonts'][group[0]] = {
            'family': family, 'file': filename,
            'characters': ''.join(map(chr, sorted(characters & available))),
        }
        print(f'{group[0]}: {(OUT / filename).stat().st_size:,} bytes')
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
