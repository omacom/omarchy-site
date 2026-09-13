import sharp from 'sharp'
import locales from '../../src/i18n/locales.json' with { type: 'json' }
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fonts from '../fonts/social/manifest.json' with { type: 'json' }
import { socialCopies } from './social-copy.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const fontDir = path.join(root, 'scripts/fonts/social')
// Keep system font aliases and hinting rules out of the offline card renderer.
process.env.FONTCONFIG_FILE = path.join(fontDir, 'fonts.conf')
const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function validateSocialCharacters(code, copy = socialCopies[code]) {
  const font = fonts.fonts[fonts.locales[locales[code]?.contentLocale ?? code]]
  if (!font || !copy) throw new Error(`Prepare social-card fonts for ${code}`)
  const supported = new Set(font.characters + fonts.fonts.Latin.characters)
  for (const char of copy.lines.join('')) {
    if (
      !supported.has(char) &&
      !/[\s\u200c-\u200f\u202a-\u202e\u2066-\u2069]/u.test(char)
    ) {
      throw new Error(
        `Missing ${code} social-card glyph ${char}; run scripts/prepare-social-fonts.py`,
      )
    }
  }
}

/** Shape once per language, then reuse the alpha masks in every palette. */
export async function socialLabelMasks(codes = Object.keys(socialCopies)) {
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
  const masks = {}
  for (const code of codes) {
    const copy = socialCopies[code]
    validateSocialCharacters(code, copy)
    const font =
      fonts.fonts[fonts.locales[locales[code]?.contentLocale ?? code]]
    masks[code] = []
    for (const [index, line] of copy.lines.entries()) {
      const english = (locales[code].contentLocale ?? code) === 'en'
      const maxSize = index === 0 ? 28 : english ? 17 : 20
      const top = english ? [390, 454, 482][index] : [370, 454, 510][index]
      const height = [70, 50, 60][index]
      let fitted
      for (let size = maxSize; size >= 16; size--) {
        const rendered = await sharp({
          text: {
            text: `<span foreground="white" lang="${code}">${copy.direction === 'rtl' ? '\u200f' : ''}${escape(line)}</span>`,
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
        if (rendered.info.width <= 1020 && rendered.info.height <= height) {
          fitted = rendered
          break
        }
      }
      if (!fitted)
        throw new Error(`${code} social-card line ${index + 1} does not fit`)
      masks[code].push({
        alpha: await sharp(fitted.data)
          .extractChannel('alpha')
          .raw()
          .toBuffer(),
        width: fitted.info.width,
        height: fitted.info.height,
        left: Math.round((1200 - fitted.info.width) / 2),
        top: english
          ? top
          : top + Math.floor((height - fitted.info.height) / 2),
      })
    }
  }
  return masks
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
