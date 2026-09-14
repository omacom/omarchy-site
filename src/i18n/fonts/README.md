# Persian web fonts

Noto Sans Arabic Regular and Bold provide Persian glyphs for the Persian edition.
The existing Geist and JetBrains Mono faces retain Latin text. The fallback is
scoped to `html[lang='fa']` in `international.css`.

These are WOFF2 conversions of the full upstream TrueType fonts at
https://github.com/notofonts/noto-fonts/tree/main/hinted/ttf/NotoSansArabic.
No character subset is applied, so new Persian translations do not require a
font rebuild. Font names and embedded copyright notices are preserved.

Copyright 2015-2021 Google LLC. All Rights Reserved.
Licensed under the SIL Open Font License 1.1; see [OFL.txt](OFL.txt).

To regenerate, install `fonttools[woff]`, download both upstream TTF files to a
directory, and run `python3 scripts/prepare-persian-web-fonts.py <directory>`.
Commit both generated WOFF2 files.
