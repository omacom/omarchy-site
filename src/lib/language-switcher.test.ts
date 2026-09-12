import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Locale, ScriptGroup } from '../i18n/site.ts'
import { locales, sortedLocales } from '../i18n/site.ts'
import type { MenuItem } from './menu.ts'
import {
  ALL_LANGUAGES_ID,
  allLanguagesRow,
  flattenSections,
  moveActive,
  partitionLanguageRows,
  scriptName,
  switcherSections,
} from './language-switcher.ts'

const entry = (
  name: string,
  englishName: string,
  script: string,
  searchTerms?: string[],
): Locale => ({
  name,
  englishName,
  script,
  domain: `https://${englishName.toLowerCase()}.example`,
  formatLocale: englishName.slice(0, 2).toLowerCase(),
  ogLocale: 'xx',
  manual: false,
  searchTerms,
})

const en = entry('English', 'English', 'Latn')
const da = entry('Dansk', 'Danish', 'Latn')
const es = entry('Español', 'Spanish', 'Latn')
const el = entry('Ελληνικά', 'Greek', 'Grek')
const ru = entry('Русский', 'Russian', 'Cyrl')
const fa = entry('فارسی', 'Persian', 'Arab', ['farsi'])

const all: Array<[string, Locale]> = [
  ['en', en],
  ['da', da],
  ['el', el],
  ['es', es],
  ['fa', fa],
  ['ru', ru],
]
const groups: Array<ScriptGroup> = [
  {
    script: 'Latn',
    locales: [
      ['en', en],
      ['da', da],
      ['es', es],
    ],
  },
  { script: 'Grek', locales: [['el', el]] },
  { script: 'Cyrl', locales: [['ru', ru]] },
  { script: 'Arab', locales: [['fa', fa]] },
]

test('with nothing typed the current language is pinned first, then the rest by script', () => {
  const sections = switcherSections('', { current: 'da', groups, all })
  assert.deepEqual(
    sections.map((section) => [
      section.kind,
      section.script,
      section.rows.map(([code]) => code),
    ]),
    [
      ['current', undefined, ['da']],
      ['script', 'Latn', ['en', 'es']],
      ['script', 'Grek', ['el']],
      ['script', 'Cyrl', ['ru']],
      ['script', 'Arab', ['fa']],
    ],
  )
  assert.deepEqual(
    flattenSections(sections).map(([code]) => code),
    ['da', 'en', 'es', 'el', 'ru', 'fa'],
  )
})

test('a script block that held only the current language is not shown empty', () => {
  const sections = switcherSections('', { current: 'el', groups, all })
  assert.ok(!sections.some((section) => section.script === 'Grek'))
  assert.equal(sections[0]?.kind, 'current')
  assert.equal(sections[0]?.rows[0]?.[0], 'el')
})

test('a query flattens the list to its matches, blind to accents and case', () => {
  const [matches, ...rest] = switcherSections('ESPANOL', {
    current: 'da',
    groups,
    all,
  })
  assert.equal(rest.length, 0)
  assert.equal(matches?.kind, 'matches')
  assert.deepEqual(
    matches?.rows.map(([code]) => code),
    ['es'],
  )
  // English name, code and searchTerms all find a row; the sorted order holds.
  assert.deepEqual(
    flattenSections(switcherSections('a', { current: 'da', groups, all })).map(
      ([code]) => code,
    ),
    ['da', 'es', 'fa', 'ru'],
  )
  assert.deepEqual(
    flattenSections(
      switcherSections('farsi', { current: 'da', groups, all }),
    ).map(([code]) => code),
    ['fa'],
  )
  assert.deepEqual(
    switcherSections('nothing like it', { current: 'da', groups, all }),
    [],
  )
  // Whitespace alone is no query.
  assert.equal(
    switcherSections('   ', { current: 'da', groups, all })[0]?.kind,
    'current',
  )
})

test('the real registry lists every reachable language exactly once', () => {
  const rows = flattenSections(switcherSections(''))
  assert.equal(rows.length, Object.keys(locales).length)
  assert.equal(new Set(rows.map(([code]) => code)).size, rows.length)
  assert.equal(rows[0]?.[0], 'en')
  assert.deepEqual(
    flattenSections(switcherSections('dansk')).map(([code]) => code),
    ['da'],
  )
  assert.equal(
    flattenSections(switcherSections('')).length,
    sortedLocales.length,
  )
})

test('the arrows stop at the ends, Home and End jump, other keys are not ours', () => {
  assert.equal(moveActive(0, 5, 'ArrowDown'), 1)
  assert.equal(moveActive(4, 5, 'ArrowDown'), 4)
  assert.equal(moveActive(0, 5, 'ArrowUp'), 0)
  assert.equal(moveActive(3, 5, 'ArrowUp'), 2)
  assert.equal(moveActive(3, 5, 'Home'), 0)
  assert.equal(moveActive(1, 5, 'End'), 4)
  assert.equal(moveActive(1, 5, 'Enter'), null)
  assert.equal(moveActive(1, 5, 'a'), null)
  assert.equal(moveActive(0, 0, 'ArrowDown'), null)
})

test('a script is named in the display language, falling back to a plain name', () => {
  assert.equal(scriptName('Latn', 'en'), 'Latin')
  assert.equal(scriptName('Cyrl', 'en'), 'Cyrillic')
  assert.equal(scriptName('Latn', 'da'), 'latinsk')
  // Han is named by the Chinese it writes, not as "Simplified" alone.
  assert.equal(scriptName('Hans', 'en'), 'Simplified Chinese')
  assert.equal(scriptName('Hant', 'da'), 'traditionelt kinesisk')
  // A locale Intl cannot resolve still yields a name rather than throwing.
  assert.equal(scriptName('Arab', 'x-nowhere'), 'Arabic')
  // A code without a name anywhere reads as itself.
  assert.equal(scriptName('Qaaa', 'en'), 'Qaaa')
})

test('a root query lists the languages last, capped, with one row for the rest', () => {
  const row = (id: string, locale?: string): MenuItem => ({
    id,
    label: id,
    icon: 'page',
    locale,
  })
  const rows = [
    row('language.a', 'a'),
    row('manual'),
    row('language.b', 'b'),
    row('language.c', 'c'),
    row('news'),
    row('language.d', 'd'),
    row('language.e', 'e'),
    row('language.f', 'f'),
    row('language.g', 'g'),
  ]
  const capped = partitionLanguageRows(rows)
  assert.deepEqual(
    capped.content.map((item) => item.id),
    ['manual', 'news'],
  )
  assert.deepEqual(
    capped.languages.map((item) => item.locale),
    ['a', 'b', 'c', 'd', 'e'],
  )
  assert.equal(capped.more, true)

  const few = partitionLanguageRows(rows.slice(0, 5))
  assert.deepEqual(
    few.languages.map((item) => item.locale),
    ['a', 'b', 'c'],
  )
  assert.equal(few.more, false)

  // Exactly the cap is not "more": the row would stand in for nothing.
  const exact = partitionLanguageRows(rows.slice(0, 7))
  assert.equal(exact.languages.length, 5)
  assert.equal(exact.more, false)

  const all = allLanguagesRow()
  assert.equal(all.id, ALL_LANGUAGES_ID)
  assert.equal(all.locale, undefined)
  assert.ok(all.label)
})
