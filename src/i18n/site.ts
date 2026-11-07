import catalogue from './current-messages.ts'
import registry from './locales.json' with { type: 'json' }

export type Locale = {
  /** The language's own name for itself, as its switcher row reads. */
  name: string
  /** The name English readers know it by; searchable, never shown as a label. */
  englishName: string
  /** ISO 15924 code of the script it is written in: Latn, Cyrl, Arab, Deva, Hans. */
  script: string
  domain: string
  formatLocale: string
  ogLocale: string
  manual: boolean
  aliases?: string[]
  contentLocale?: string
  direction?: 'ltr' | 'rtl'
  flag?: string
  /** Extra spellings a search should find it by: "farsi", "mandarin". */
  searchTerms?: string[]
  /** Registered but not yet published: buildable and translatable on its own,
   *  invisible from every other edition until the flag is dropped. */
  draft?: boolean
}

/** Every registered edition, drafts included: the registry as written. */
export const allLocales = registry as Record<string, Locale>
export const language = import.meta.env?.PUBLIC_SITE_LOCALE || 'en'
if (!allLocales[language]) throw new Error(`Unknown site language: ${language}`)
export const locale = allLocales[language]
export const siteUrl = locale.domain

/** The editions readers can reach: the registry without its drafts. */
export const publishedLocales: Record<string, Locale> = Object.fromEntries(
  Object.entries(allLocales).filter(([, entry]) => !entry.draft),
)

/**
 * The editions this build links to: the published ones, plus itself when it
 * is a draft. A draft's own preview lists itself in its switcher, footer and
 * alternate links the way a published edition would, and no other edition
 * lists it at all.
 */
export const locales: Record<string, Locale> = locale.draft
  ? { ...publishedLocales, [language]: locale }
  : publishedLocales

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

/** A locale's flag, from its country code or its domain's suffix; a globe where
 *  there is no country to show. */
export function flag(domain: string, countryCode?: string) {
  const country = countryCode ?? new URL(domain).hostname.split('.').at(-1)!
  return country.length === 2
    ? [...country.toUpperCase()]
        .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
        .join('')
    : '🌐'
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

/**
 * The same page on another locale's site, or its front page where that site
 * does not have the page, as the header's switcher links.
 */
export function localeHref(code: string, path: string, suffix = '') {
  return `${locales[code].domain}${hasTranslation(code, path) ? path + suffix : '/'}`
}

/**
 * Text as a search sees it: decomposed, stripped of its accents and cases,
 * so "espanol" finds Español and "turkce" finds Türkçe.
 */
export function searchable(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
}

/**
 * Whether a query finds a language: by its own name, its English name, its
 * code, its formatting locale or any spelling listed under searchTerms, each
 * whitespace-separated term matching somewhere. Accents and case are ignored
 * on both sides, so "german" finds Deutsch and "espanol" finds Español.
 */
export function matchesLocale(
  entry: Pick<Locale, 'name' | 'englishName' | 'formatLocale' | 'searchTerms'>,
  query: string,
  code = '',
): boolean {
  const terms = searchable(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = searchable(
    [
      entry.name,
      entry.englishName,
      code,
      entry.formatLocale,
      ...(entry.searchTerms ?? []),
    ].join(' '),
  )
  return terms.every((term) => haystack.includes(term))
}

/**
 * The scripts in the order a grouped list shows them: Latin first, since it
 * carries English and most of the list, then east and south across the map.
 * A script the registry gains that is not listed here lands at the end.
 */
export const SCRIPT_ORDER = [
  'Latn',
  'Grek',
  'Cyrl',
  'Armn',
  'Geor',
  'Hebr',
  'Arab',
  'Ethi',
  'Deva',
  'Beng',
  'Guru',
  'Gujr',
  'Orya',
  'Taml',
  'Telu',
  'Knda',
  'Mlym',
  'Sinh',
  'Thai',
  'Laoo',
  'Mymr',
  'Khmr',
  'Tibt',
  'Hans',
  'Hant',
  'Jpan',
  'Kore',
]

export type ScriptGroup = { script: string; locales: Array<[string, Locale]> }

/**
 * The reachable languages grouped by script, each group sorted by native
 * name the way that script's first language collates, and English first of
 * all. A reader scanning for their language finds its script's block first,
 * then their name within it.
 */
export function scriptGroups(): Array<ScriptGroup> {
  const groups = new Map<string, Array<[string, Locale]>>()
  for (const pair of Object.entries(locales)) {
    const list = groups.get(pair[1].script) ?? []
    list.push(pair)
    groups.set(pair[1].script, list)
  }
  const order = [
    ...SCRIPT_ORDER,
    ...[...groups.keys()].filter((script) => !SCRIPT_ORDER.includes(script)),
  ]
  return order
    .filter((script) => groups.has(script))
    .map((script) => {
      const members = groups.get(script)!
      const collate = new Intl.Collator(members[0][1].formatLocale).compare
      members.sort(([a, la], [b, lb]) =>
        a === 'en' ? -1 : b === 'en' ? 1 : collate(la.name, lb.name),
      )
      return { script, locales: members }
    })
}
