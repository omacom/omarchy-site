#!/usr/bin/env python3
"""Convert upstream Noto Sans Arabic TTFs to the bundled Persian web fonts.

Requires fonttools[woff]. Pass a directory containing NotoSansArabic-Regular.ttf
and NotoSansArabic-Bold.ttf from notofonts/noto-fonts/hinted/ttf/NotoSansArabic.
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont

source = Path(sys.argv[1])
output = Path(__file__).resolve().parents[1] / 'src/i18n/fonts'
output.mkdir(parents=True, exist_ok=True)
for weight in ('Regular', 'Bold'):
    font = TTFont(source / f'NotoSansArabic-{weight}.ttf')
    font.flavor = 'woff2'
    font.save(output / f'noto-sans-arabic-{weight.lower()}.woff2')
