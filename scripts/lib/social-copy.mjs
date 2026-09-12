import { existsSync, readFileSync } from 'node:fs'
import locales from '../../src/i18n/locales.json' with { type: 'json' }

export const socialKeys = [
  'Omarchy - Beautiful, fun & agentic Linux by DHH',
  'The malleable OS for the age of agents.',
  'Vibe your way through every alteration, tweak, or trouble.',
]

// The pixel wordmark already supplies the brand name above these lines, so the
// title drops its "Omarchy - " prefix. Translators legitimately use other
// separators (dashes, colons, bars, Armenian ՝, Ethiopic ፦, fullwidth/CJK
// variants) and quotes around the name; a title without the prefix is kept.
const titlePrefix = /^[„“«"「『]?Omarchy[“”»"」』]?\s*[-‐‑–—―:：՝፡፦|｜]\s*/u

export function stripTitlePrefix(title) {
  return title.replace(titlePrefix, '')
}

export function socialCopy(code) {
  const locale = locales[code]
  if (!locale) throw new Error(`Unknown social-card language: ${code}`)
  const content = locale.contentLocale ?? code
  const messages = content === 'en' ? {} : readMessages(content)
  if (!messages)
    throw new Error(`Missing ${code} social-card messages: ${content}.json`)
  const lines = socialKeys.map((key) => {
    const value = content === 'en' ? key : messages[key]
    if (!value?.trim())
      throw new Error(`Missing ${code} social-card text: ${key}`)
    return value
  })
  lines[0] = stripTitlePrefix(lines[0])
  return { lines, direction: locale.direction ?? 'ltr' }
}

function readMessages(content) {
  const file = new URL(
    `../../src/i18n/messages/${content}.json`,
    import.meta.url,
  )
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined
}

/**
 * Copy for every registered language whose translation carries the card text.
 * Drafts (no messages file, or the card keys not translated yet) are listed in
 * `socialCopyDrafts` with the reason instead of failing every other card.
 */
export const socialCopies = {}
export const socialCopyDrafts = {}
for (const code of Object.keys(locales)) {
  try {
    socialCopies[code] = socialCopy(code)
  } catch (error) {
    if (!/^Missing /.test(error.message)) throw error
    socialCopyDrafts[code] = error.message
  }
}
