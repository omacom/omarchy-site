import catalogue from './current-messages.ts'
import registry from './locales.json' with { type: 'json' }

export type Locale = {
  name: string
  domain: string
  formatLocale: string
  ogLocale: string
  manual: boolean
  aliases?: string[]
  contentLocale?: string
  direction?: 'ltr' | 'rtl'
  flag?: string
}
export const locales = registry as Record<string, Locale>
export const language = import.meta.env?.PUBLIC_SITE_LOCALE || 'en'
if (!locales[language]) throw new Error(`Unknown site language: ${language}`)
export const locale = locales[language]
export const siteUrl = locale.domain

/**
 * The languages in the order a list shows them: English first, since it is
 * the source, then the rest by their own name. The registry is in the order
 * the languages arrived, which reads as no order at all.
 */
const byName = new Intl.Collator('en').compare
export const sortedLocales: Array<[string, Locale]> = Object.entries(
  locales,
).sort(([a, la], [b, lb]) =>
  a === 'en' ? -1 : b === 'en' ? 1 : byName(la.name, lb.name),
)
export const contentLocale = locale.contentLocale ?? language

/** English is the source copy; each language keeps its own reviewed catalogue. */
export function t(english: string): string {
  return catalogue[english] ?? english
}

/** A team member's countries, "USA/Denmark", each translated on its own. */
export function tCountries(meta: string): string {
  return meta.split('/').map(t).join('/')
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
