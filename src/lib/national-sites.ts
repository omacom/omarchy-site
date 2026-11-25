// Which national theme each language's site wears. Read at build time
// (astro.config.mjs) and in tests; the browser gets only its own site's
// answer, as HOME_THEME in site-themes.ts.

import locales from '../i18n/locales.json' with { type: 'json' }
import { NATIONAL_THEMES } from './national-themes.ts'
import type { SiteTheme } from './site-themes.ts'

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

/** The theme a language's site opens in, as the picker lists it, or null
 *  where it has none. */
export function nationalThemeOf(language: string): SiteTheme | null {
  const country = countryOf(language)
  const theme = NATIONAL_THEMES.find((t) => t.country === country)
  if (!theme) return null
  return theme.ground === 'light'
    ? { id: theme.id, name: theme.name, light: true }
    : { id: theme.id, name: theme.name }
}
