/** Build a 1200x630 social card for every site theme from its CSS palette. */
import sharp from 'sharp'
import locales from '../src/i18n/locales.json' with { type: 'json' }
import { socialLabelMasks, colorSocialLabels } from './lib/social-labels.mjs'
import { SITE_THEMES } from '../src/lib/site-themes.ts'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(root, 'public/brand/social')
fs.mkdirSync(outputDir, { recursive: true })
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8')

const W = 1200
const H = 630
const language = process.env.PUBLIC_SITE_LOCALE || 'en'
const labelMasks = await socialLabelMasks(
  process.argv.includes('--site')
    ? [locales[language].contentLocale ?? language]
    : undefined,
)

// The wordmark's own grid: 81 cells across, 19 down, each cell 51 wide by
// 50 tall in the SVG's units. The card keeps that aspect exactly.
const bitmap = fs.readFileSync(
  path.join(root, 'src/data/wordmark-bitmap.ts'),
  'utf8',
)
const ROWS = [...bitmap.matchAll(/'([01]{81})'/g)].map((m) => m[1])
if (ROWS.length !== 19) throw new Error(`expected 19 rows, read ${ROWS.length}`)

// Use whole pixels per cell so downsampling preserves sharp edges.
const CW = 11
const CH = 11
const COLS = Math.ceil(W / CW)
const GRID_ROWS = Math.ceil(H / CH)

const WM_COL = Math.round((COLS - 81) / 2)
const WM_ROW = 10

for (const theme of SITE_THEMES) {
  const block = css.split(`[data-theme='${theme.id}'] {`)[1]?.split('}')[0]
  if (!block) throw new Error(`Missing CSS palette for ${theme.id}`)
  const color = (name) => {
    const value = block.match(
      new RegExp(`--t-${name}:\\s*(#[0-9a-f]{6});`, 'i'),
    )?.[1]
    if (!value) throw new Error(`Missing ${name} color for ${theme.id}`)
    return value
  }
  const BG = color('field-bg')
  const RAMP = ['field-dim', 'field-mid', 'field-mid', 'field-lit'].map(color)
  const WORDMARK_INKS = [
    'field-crest',
    'field-hover',
    'field-lit',
    'field-mid',
    'field-dim',
  ].map(color)

  // Deterministic: the card should be the same picture every time it is built.
  const rand = (() => {
    let s = 0x9e3779b9
    return () => {
      s = (s + 0x6d2b79f5) | 0
      let t = Math.imul(s ^ (s >>> 15), 1 | s)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  })()

  const lit = (r, c) =>
    r >= 0 && r < 19 && c >= 0 && c < 81 && ROWS[r][c] === '1'
  // Is any letter cell within `reach` cells of this one?
  const within = (r, c, reach) => {
    for (let dr = -reach; dr <= reach; dr++)
      for (let dc = -reach; dc <= reach; dc++)
        if (lit(r + dr, c + dc)) return true
    return false
  }

  const cells = []
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const wr = row - WM_ROW
      const wc = col - WM_COL
      if (lit(wr, wc)) continue
      if (row * CH > 365 && row * CH < 585 && col * CW > 90 && col * CW < 1110)
        continue

      const near1 = within(wr, wc, 1)
      if (near1) continue
      const near2 = within(wr, wc, 2)

      const dx = (col - (WM_COL + 40)) / 62
      const dy = (row - (WM_ROW + 9)) / 26
      const d = Math.sqrt(dx * dx + dy * dy)
      const near = Math.max(0, 1 - d)
      const chance = (0.014 + 0.15 * near * near) * (near2 ? 0.35 : 1)
      if (rand() > chance) continue

      const r = rand()
      const tier = near2
        ? 0
        : r < 0.52
          ? 0
          : r < 0.78
            ? 1
            : r < 0.93
              ? 2
              : near > 0.45
                ? 3
                : 2
      cells.push(
        `<rect x="${col * CW}" y="${row * CH}" width="${CW}" height="${CH}" fill="${RAMP[tier]}"/>`,
      )
    }
  }

  const wordmark = []
  for (let row = 0; row < 19; row++) {
    const ink =
      WORDMARK_INKS[row < 5 ? 0 : row < 7 ? 1 : row < 11 ? 2 : row < 14 ? 3 : 4]
    for (let col = 0; col < 81; col++) {
      if (lit(row, col)) {
        wordmark.push(
          `<rect x="${(WM_COL + col) * CW}" y="${(WM_ROW + row) * CH}" width="${CW}" height="${CH}" fill="${ink}"/>`,
        )
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${BG}"/>
${cells.join('')}
${wordmark.join('')}
</svg>`

  for (const [language, masks] of Object.entries(labelMasks)) {
    const directory =
      language === 'en' ? outputDir : path.join(outputDir, language)
    fs.mkdirSync(directory, { recursive: true })
    const out = path.join(directory, `${theme.id}.png`)
    const overlays = await colorSocialLabels(masks, [
      color('text'),
      color('text-secondary'),
    ])
    await sharp(Buffer.from(svg))
      .composite(overlays)
      .png({ palette: true })
      .toFile(out)
  }
  console.log(`${theme.name}: ${Object.keys(labelMasks).length} language cards`)
}
