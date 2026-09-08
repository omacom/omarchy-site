import catalogue from './current-messages.ts'
import registry from './locales.json' with { type: 'json' }
import { pluralCategory } from '../lib/plural.ts'

export type Locale = {
  name: string
  domain: string
  formatLocale: string
  ogLocale: string
  manual: boolean
  contentLocale?: string
  direction?: 'ltr' | 'rtl'
  flag?: string
}
export const locales = registry as Record<string, Locale>
export const language = import.meta.env?.PUBLIC_SITE_LOCALE || 'en'
if (!locales[language]) throw new Error(`Unknown site language: ${language}`)
export const locale = locales[language]
export const siteUrl = locale.domain
export const contentLocale = locale.contentLocale ?? language

/** English is the source copy; each language keeps its own reviewed catalogue. */
export function t(english: string): string {
  return catalogue[english] ?? english
}

/**
 * Translate a counted label. A locale can provide optional entries such as
 * `contributors [one]` and `contributors [few]`; the base translation remains
 * the fallback for locales that do not need separate forms.
 */
export function tPlural(english: string, count: number): string {
  const category = pluralCategory(locale.formatLocale, count)
  return catalogue[`${english} [${category}]`] ?? t(english)
}

export function hasTranslation(code: string, path: string): boolean {
  return (
    Boolean(locales[code]) &&
    (!path.startsWith('/manual') || locales[code].manual)
  )
}

/** Keep untranslated chapters on the English site, including their fragments. */
export function localizedHref(href: string): string {
  return !locale.manual && /^\/manual(?:[/?#]|$)/.test(href)
    ? `${locales.en.domain}${href}`
    : href
}
