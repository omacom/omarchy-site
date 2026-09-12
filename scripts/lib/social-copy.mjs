import { readFileSync } from 'node:fs'
import locales from '../../src/i18n/locales.json' with { type: 'json' }

export const socialKeys = [
  'Omarchy - Beautiful, fun & agentic Linux by DHH',
  'The malleable OS for the age of agents.',
  'Vibe your way through every alteration, tweak, or trouble.',
]

export function socialCopy(code) {
  const locale = locales[code]
  if (!locale) throw new Error(`Unknown social-card language: ${code}`)
  const content = locale.contentLocale ?? code
  const messages =
    content === 'en'
      ? {}
      : JSON.parse(
          readFileSync(
            new URL(`../../src/i18n/messages/${content}.json`, import.meta.url),
            'utf8',
          ),
        )
  const lines = socialKeys.map((key) => {
    const value = content === 'en' ? key : messages[key]
    if (!value?.trim())
      throw new Error(`Missing ${code} social-card text: ${key}`)
    return value
  })
  // The pixel wordmark already supplies the brand name above these lines.
  const titlePrefix = /^[„“«"]?Omarchy[“”»"]?\s*[-–—:]\s*/u
  if (!titlePrefix.test(lines[0]))
    throw new Error(`Unexpected ${code} title: ${lines[0]}`)
  lines[0] = lines[0].replace(titlePrefix, '')
  return { lines, direction: locale.direction ?? 'ltr' }
}

export const socialCopies = Object.fromEntries(
  Object.keys(locales).map((code) => [code, socialCopy(code)]),
)
