# Social card fonts

These renamed TrueType/OpenType subsets of Noto Sans, Noto Nastaliq Urdu, and Noto Sans CJK
cover the characters used by the existing social-card translations. They retain
script shaping tables and include a Latin fallback for mixed-script text.
English uses a subset from the existing JetBrains Mono dependency. TrueType and
OpenType files work with the font loader bundled with Sharp; WOFF2 files do not.

All bundled fonts are licensed under the [SIL Open Font License](OFL.txt).
See [copyright notices](COPYRIGHT.txt) for the original authors.

Normal builds use the checked-in subsets and need no installed system fonts.
When translations introduce new characters, the renderer fails with a missing
glyph error. Refresh the subsets using Python with `fonttools[woff]` installed
and the Noto fonts in `/usr/share/fonts/noto/` and `/usr/share/fonts/noto-cjk/`
(the Arch packages are `noto-fonts` and `noto-fonts-cjk`):

```sh
python3 scripts/prepare-social-fonts.py
npm run build:social
```

Commit the updated font subsets, manifest, and cards together. New scripts may
need a font mapping in `scripts/prepare-social-fonts.py`. Keep copyright notices
current when adding fonts.

Ukrainian uses a separate `Cyrillic` subset so adding its glyphs does not change
the existing Latin cards. To refresh just that subset, supply a directory
containing `NotoSans-Regular.ttf`:

```sh
python3 scripts/prepare-social-fonts.py --group Cyrillic --noto-dir /path/to/noto
PUBLIC_SITE_LOCALE=uk npm run build:social -- --site
```

`--group` preserves the other bundled fonts and may be repeated. Without it,
the script refreshes all groups. The Cyrillic subset was generated with
fontTools 4.60.1 from Noto Sans 2.008 at
[`notofonts/noto-fonts` revision `ffebf8c1ee449e544955a7e813c54f9b73848eac`](https://github.com/notofonts/noto-fonts/blob/ffebf8c1ee449e544955a7e813c54f9b73848eac/hinted/ttf/NotoSans/NotoSans-Regular.ttf)
(SHA-256 `b85c38ecea8a7cfb39c24e395a4007474fa5a4fc864f6ee33309eb4948d232d5`).
The subset preserves the source timestamp for reproducible regeneration.
