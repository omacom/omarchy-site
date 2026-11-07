import sharp from 'sharp'
import locales from '../../src/i18n/locales.json' with { type: 'json' }
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import fonts from '../fonts/social/manifest.json' with { type: 'json' }
import { socialCopies } from './social-copy.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const fontDir = path.join(root, 'scripts/fonts/social')
// Keep system font aliases and hinting rules out of the offline card renderer.
process.env.FONTCONFIG_FILE = path.join(fontDir, 'fonts.conf')
const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Vertical boxes for the three lines, in pixels of rendered ink. Each line is
 * shrunk from its maximum size until it fits its box, but never below MIN_SIZE.
 * Scripts that stack marks far above and below the baseline (Myanmar, Tibetan,
 * Khmer) need about twice the ink height of Latin per line, so two wrapped
 * lines at MIN_SIZE (about 62px for Myanmar) overflow the default boxes. They get deeper boxes for the
 * two smaller lines, borrowing from the empty band below the text.
 */
export const MIN_SIZE = 16
const LINE_BOXES = {
  default: {
    maxSizes: [28, 20, 20],
    tops: [370, 454, 510],
    heights: [70, 50, 60],
  },
  english: {
    maxSizes: [28, 17, 17],
    tops: [390, 454, 482],
    heights: [70, 50, 60],
  },
  tall: {
    maxSizes: [28, 20, 20],
    tops: [370, 448, 516],
    heights: [70, 62, 66],
  },
}
const TALL_SCRIPTS = new Set(['Mymr', 'Tibt', 'Khmr'])

const contentLocale = (code) => locales[code]?.contentLocale ?? code

export function socialLineBoxes(code) {
  const content = contentLocale(code)
  if (content === 'en') return LINE_BOXES.english
  return TALL_SCRIPTS.has(locales[content]?.script)
    ? LINE_BOXES.tall
    : LINE_BOXES.default
}

export function validateSocialCharacters(code, copy = socialCopies[code]) {
  const font = fonts.fonts[fonts.locales[contentLocale(code)]]
  if (!font || !copy) throw new Error(`Prepare social-card fonts for ${code}`)
  const supported = new Set(font.characters + fonts.fonts.Latin.characters)
  for (const char of copy.lines.join('')) {
    if (!supported.has(char) && !/[\s‌-‏‪-‮⁦-⁩]/u.test(char)) {
      throw new Error(
        `Missing ${code} social-card glyph ${char}; run scripts/prepare-social-fonts.py`,
      )
    }
  }
}

/** Register every bundled subset with Pango once, before any text is shaped. */
async function loadFonts() {
  for (const font of Object.values(fonts.fonts)) {
    await sharp({
      text: {
        text: escape(font.characters.trim()[0]),
        font: `${font.family} 16`,
        fontfile: path.join(fontDir, font.file),
        rgba: true,
      },
    })
      .png()
      .toBuffer()
  }
}

/** Render one line at the largest size from its box's maximum that fits. */
async function fitLine(code, copy, index) {
  const font = fonts.fonts[fonts.locales[contentLocale(code)]]
  const boxes = socialLineBoxes(code)
  const height = boxes.heights[index]
  for (let size = boxes.maxSizes[index]; size >= MIN_SIZE; size--) {
    const rendered = await sharp({
      text: {
        text: `<span foreground="white" lang="${code}">${copy.direction === 'rtl' ? '‏' : ''}${escape(copy.lines[index])}</span>`,
        font: `${font.family}, ${fonts.fonts.Latin.family} ${size}`,
        fontfile: path.join(fontDir, font.file),
        width: 1020,
        wrap: 'word-char',
        align: 'center',
        rgba: true,
        dpi: 72,
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true })
    if (rendered.info.width <= 1020 && rendered.info.height <= height)
      return { rendered, size, top: boxes.tops[index], height }
  }
  throw new Error(`${code} social-card line ${index + 1} does not fit`)
}

/** Shape once per language, then reuse the alpha masks in every palette. */
export async function socialLabelMasks(codes = Object.keys(socialCopies)) {
  await loadFonts()
  const masks = {}
  for (const code of codes) {
    const copy = socialCopies[code]
    validateSocialCharacters(code, copy)
    const english = contentLocale(code) === 'en'
    masks[code] = []
    for (const index of copy.lines.keys()) {
      const { rendered, top, height } = await fitLine(code, copy, index)
      masks[code].push({
        alpha: await sharp(rendered.data)
          .extractChannel('alpha')
          .raw()
          .toBuffer(),
        width: rendered.info.width,
        height: rendered.info.height,
        left: Math.round((1200 - rendered.info.width) / 2),
        top: english
          ? top
          : top + Math.floor((height - rendered.info.height) / 2),
      })
    }
  }
  return masks
}

/**
 * The font size each line ends up at, with the ink it takes against its box,
 * so languages pinned at MIN_SIZE or scraping the box show up before review.
 */
export async function socialLabelSizes(codes = Object.keys(socialCopies)) {
  await loadFonts()
  const sizes = {}
  for (const code of codes) {
    const copy = socialCopies[code]
    validateSocialCharacters(code, copy)
    sizes[code] = []
    for (const index of copy.lines.keys()) {
      const boxes = socialLineBoxes(code)
      const { rendered, size, height } = await fitLine(code, copy, index)
      sizes[code].push({
        size,
        maxSize: boxes.maxSizes[index],
        width: rendered.info.width,
        height: rendered.info.height,
        box: height,
      })
    }
  }
  return sizes
}

export async function colorSocialLabels(masks, colors) {
  return Promise.all(
    masks.map(async (mask, index) => ({
      input: await sharp({
        create: {
          width: mask.width,
          height: mask.height,
          channels: 3,
          background: colors[index === 0 ? 0 : 1],
        },
      })
        .joinChannel(mask.alpha, {
          raw: { width: mask.width, height: mask.height, channels: 1 },
        })
        .png()
        .toBuffer(),
      left: mask.left,
      top: mask.top,
    })),
  )
}

// node scripts/lib/social-labels.mjs --report [codes...]
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href &&
  process.argv.includes('--report')
) {
  const requested = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  const codes = requested.length
    ? requested
    : Object.keys(socialCopies).filter((code) => !locales[code].contentLocale)
  const sizes = await socialLabelSizes(codes)
  console.log('locale  script  line  size  ink        box  note')
  for (const [code, lines] of Object.entries(sizes)) {
    const script = locales[contentLocale(code)]?.script ?? '?'
    lines.forEach((line, index) => {
      const notes = []
      if (line.size === MIN_SIZE) notes.push('at minimum size')
      else if (line.size < line.maxSize)
        notes.push(`shrunk from ${line.maxSize}`)
      if (line.box - line.height <= 2) notes.push('scrapes box')
      console.log(
        `${code.padEnd(7)} ${script.padEnd(7)} ${String(index + 1).padEnd(5)} ${String(line.size).padEnd(5)} ${`${line.width}x${line.height}`.padEnd(10)} ${String(line.box).padEnd(4)} ${notes.join(', ')}`,
      )
    })
  }
}
