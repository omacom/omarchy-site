# Social card fonts

These renamed TrueType/OpenType subsets of Noto Sans, the Noto script families,
Noto Nastaliq Urdu, and Noto Sans CJK cover the characters used by the
social-card translations. They retain script shaping tables and include a Latin
fallback for mixed-script text. English uses a subset from the existing
JetBrains Mono dependency. TrueType and OpenType files work with the font loader
bundled with Sharp; WOFF2 files do not.

All bundled fonts are licensed under the [SIL Open Font License](OFL.txt).
See [copyright notices](COPYRIGHT.txt) for the original authors.

Normal builds use the checked-in subsets and need no installed system fonts.

## Which font a language gets

`scripts/prepare-social-fonts.py` maps each registry entry's ISO 15924 `script`
(from `src/i18n/locales.json`) to a Noto family: Latin, Greek, and Cyrillic
share one Noto Sans subset (which is also every other script's Latin fallback);
Arabic-script languages share Noto Sans Arabic; each Indic, Southeast Asian,
Caucasian, Ethiopic, and Hebrew script has its own Noto Sans family; Tibetan
uses Noto Serif Tibetan (Arch ships no Noto Sans Tibetan); Japanese, Korean,
and Simplified Chinese are faces of the Noto Sans CJK collection. A per-code
override table keeps English on JetBrains Mono and Urdu on Noto Nastaliq Urdu.
A language whose script has no mapping fails the script with a message naming
the script; add it to `SCRIPT_FAMILIES`.

## Refreshing the subsets

When translations introduce new characters, the renderer fails with a missing
glyph error. The subsetter needs Python with `fonttools[woff]` and the Noto
fonts. Create the tooling once (the directory is git-ignored):

```sh
python3 -m venv .venv-fonts
.venv-fonts/bin/pip install 'fonttools[woff]'
```

Install the Noto fonts (Arch packages `noto-fonts` and `noto-fonts-cjk`), or
point `NOTO_DIR` and `NOTO_CJK_DIR` at directories holding the
`Noto*-Regular.ttf` files and `NotoSansCJK-Regular.ttc`. The script names the
missing package when a family file is absent. Then:

```sh
.venv-fonts/bin/python scripts/prepare-social-fonts.py --report   # coverage only
.venv-fonts/bin/python scripts/prepare-social-fonts.py            # write subsets
node scripts/lib/social-labels.mjs --report                       # font size per line
npm run build:social
```

`--report` (or `--check`) writes nothing; it lists, per locale, any card code
point missing from the mapped family's cmap, so tofu is caught before a card is
rendered, and exits non-zero when there are gaps. Locales in the registry whose
messages file lacks the card copy yet (drafts) are skipped with a note in both
modes. The output is deterministic for a given Noto release: the subsets keep
the source font's modification date, so a refresh that changes no glyphs
changes no bytes.

The label report prints the font size each line ends up at against its box,
flagging lines pinned at the minimum size or scraping the box. Scripts that
stack marks far above and below the baseline (Myanmar, Tibetan, Khmer) get
deeper boxes for the second and third lines in `scripts/lib/social-labels.mjs`;
extend `TALL_SCRIPTS` there if the report shows a new script failing to fit.

Commit the updated font subsets, manifest, and cards together. Keep copyright
notices current when adding fonts: the strings come from name ID 0 of the Noto
files.
