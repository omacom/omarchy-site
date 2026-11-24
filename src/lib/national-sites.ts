// Which national theme each language's site wears. Read at build time
// (astro.config.mjs) and in tests; the browser gets only its own site's
// answer, as HOME_THEME in site-themes.ts.

import locales from '../i18n/locales.json' with { type: 'json' }
import { NATIONAL_THEMES, type NationalTheme } from './national-themes.ts'

/** The country a language's site stands for: its flag, else its domain's
 *  suffix. The English site at omarchy.org stands for none. */
export function countryOf(language: string): string | null {
  const entry = (locales as Record<string, { domain: string; flag?: string }>)[
    language
  ]
  if (!entry) return null
  const country =
    entry.flag ?? new URL(entry.domain).hostname.split('.').at(-1)!
  return country.length === 2 ? country.toUpperCase() : null
}

/** The theme a language's site opens in, or null where it has none. */
export function nationalThemeOf(language: string): NationalTheme | null {
  const country = countryOf(language)
  return NATIONAL_THEMES.find((theme) => theme.country === country) ?? null
}
