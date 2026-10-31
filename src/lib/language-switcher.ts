import type { Locale, ScriptGroup } from '../i18n/site.ts'
import {
  language,
  matchesLocale,
  scriptGroups,
  sortedLocales,
} from '../i18n/site.ts'
import type { MenuItem } from './menu.ts'
import { languageMenuCopy } from './menu.ts'

/**
 * The language switcher's list, worked out away from the DOM: which rows a
 * query leaves, how they group when there is no query, and where the
 * keyboard's cursor goes next. The component renders what comes out of here.
 */

export type SwitcherRow = [code: string, entry: Locale]

export type SwitcherSection = {
  /** The pinned current language, a script's block, or a query's matches. */
  kind: 'current' | 'script' | 'matches'
  /** ISO 15924 code, on a script block. */
  script?: string
  rows: Array<SwitcherRow>
}

export type SwitcherSource = {
  current?: string
  groups?: Array<ScriptGroup>
  all?: Array<SwitcherRow>
}

/**
 * With nothing typed, the current language sits first on its own, then the
 * rest by script so a reader finds their alphabet's block before their name.
 * A query flattens that into one list of matches in the plain sorted order:
 * a match is what the reader asked for, and its script no longer helps.
 */
export function switcherSections(
  query: string,
  {
    current = language,
    groups = scriptGroups(),
    all = sortedLocales,
  }: SwitcherSource = {},
): Array<SwitcherSection> {
  if (query.trim()) {
    const rows = all.filter(([code, entry]) =>
      matchesLocale(entry, query, code),
    )
    return rows.length ? [{ kind: 'matches', rows }] : []
  }
  const sections: Array<SwitcherSection> = []
  const own = all.find(([code]) => code === current)
  if (own) sections.push({ kind: 'current', rows: [own] })
  for (const group of groups) {
    const rows = group.locales.filter(([code]) => code !== current)
    if (rows.length)
      sections.push({ kind: 'script', script: group.script, rows })
  }
  return sections
}

/** The rows in reading order, which is the order the arrow keys walk. */
export function flattenSections(
  sections: Array<SwitcherSection>,
): Array<SwitcherRow> {
  return sections.flatMap((section) => section.rows)
}

/**
 * Where the cursor lands after a navigation key, or null for any other key.
 * The ends stop rather than wrap, the way the palette's list does.
 */
export function moveActive(
  active: number,
  count: number,
  key: string,
): number | null {
  if (count === 0) return null
  const last = count - 1
  switch (key) {
    case 'ArrowDown':
      return Math.min(last, active + 1)
    case 'ArrowUp':
      return Math.max(0, active - 1)
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return null
  }
}

/** Plain names for when the runtime cannot name a script in the reader's language. */
const SCRIPT_NAMES: Record<string, string> = {
  Latn: 'Latin',
  Grek: 'Greek',
  Cyrl: 'Cyrillic',
  Armn: 'Armenian',
  Geor: 'Georgian',
  Hebr: 'Hebrew',
  Arab: 'Arabic',
  Ethi: 'Ethiopic',
  Deva: 'Devanagari',
  Beng: 'Bangla',
  Guru: 'Gurmukhi',
  Gujr: 'Gujarati',
  Orya: 'Odia',
  Taml: 'Tamil',
  Telu: 'Telugu',
  Knda: 'Kannada',
  Mlym: 'Malayalam',
  Sinh: 'Sinhala',
  Thai: 'Thai',
  Laoo: 'Lao',
  Mymr: 'Myanmar',
  Khmr: 'Khmer',
  Tibt: 'Tibetan',
  Hans: 'Simplified Chinese',
  Hant: 'Traditional Chinese',
  Jpan: 'Japanese',
  Kore: 'Korean',
}

/** Scripts whose own name is a bare adjective - "Simplified", "Traditional" -
 *  and read better as the language they write: "Simplified Chinese". */
const SCRIPT_AS_LANGUAGE: Record<string, string> = {
  Hans: 'zh-Hans',
  Hant: 'zh-Hant',
}

/**
 * A script's name as a group heading, in the reader's language where the
 * runtime knows it. Intl hands nothing back when it has no name, and throws
 * on a locale it does not know; both fall to the English table, then the code.
 */
export function scriptName(script: string, displayLocale = language): string {
  try {
    const languageTag = SCRIPT_AS_LANGUAGE[script]
    const named = languageTag
      ? new Intl.DisplayNames([displayLocale, 'en'], {
          type: 'language',
          languageDisplay: 'dialect',
          fallback: 'none',
        }).of(languageTag)
      : new Intl.DisplayNames([displayLocale, 'en'], {
          type: 'script',
          fallback: 'none',
        }).of(script)
    if (named) return named
  } catch {
    // An Intl without DisplayNames, or a locale it cannot resolve.
  }
  return SCRIPT_NAMES[script] ?? script
}

/** How many language rows a root query lists before pointing at the submenu. */
export const LANGUAGE_ROW_CAP = 5

/** The id of the row that opens the full language list from a root query. */
export const ALL_LANGUAGES_ID = 'language.all'

/**
 * A root query's rows, with the languages taken out of the middle. A query
 * like "an" lands on a dozen languages that would bury Manual and the news
 * hits under them, so the palette lists the languages last, and only the
 * first few, with one row that opens the full list when more matched.
 */
export function partitionLanguageRows(
  rows: Array<MenuItem>,
  cap = LANGUAGE_ROW_CAP,
): { content: Array<MenuItem>; languages: Array<MenuItem>; more: boolean } {
  const content = rows.filter((row) => !row.locale)
  const languages = rows.filter((row) => row.locale)
  const more = languages.length > cap
  return {
    content,
    languages: more ? languages.slice(0, cap) : languages,
    more,
  }
}

/** The row that stands in for the languages a capped list left out. */
export function allLanguagesRow(): MenuItem {
  return {
    id: ALL_LANGUAGES_ID,
    label: languageMenuCopy.all,
    icon: 'language',
  }
}
