import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  allLocales,
  flag,
  localeHref,
  matchesLocale,
  publishedLocales,
  SCRIPT_ORDER,
  scriptGroups,
  searchable,
  sortedLocales,
} from '../i18n/site.ts'

const RTL_SCRIPTS = ['Arab', 'Hebr', 'Thaa', 'Nkoo', 'Syrc']

test('English leads the sorted list and every entry carries its names and script', () => {
  assert.equal(sortedLocales[0]?.[0], 'en')
  for (const [code, entry] of Object.entries(allLocales)) {
    assert.ok(entry.name.trim(), `${code}: name`)
    assert.ok(entry.englishName.trim(), `${code}: englishName`)
    assert.match(entry.script, /^[A-Z][a-z]{3}$/, `${code}: script`)
  }
})

test('right-to-left editions are the ones in right-to-left scripts', () => {
  for (const [code, entry] of Object.entries(allLocales)) {
    assert.equal(
      entry.direction === 'rtl',
      RTL_SCRIPTS.includes(entry.script),
      `${code}: ${entry.script} ${entry.direction ?? 'ltr'}`,
    )
  }
  assert.equal(allLocales.ar.direction, 'rtl')
})

test('every edition but English shows a country flag', () => {
  assert.equal(flag(allLocales.en.domain, allLocales.en.flag), '🌐')
  for (const [code, entry] of Object.entries(allLocales)) {
    if (code === 'en') continue
    const glyph = flag(entry.domain, entry.flag)
    assert.notEqual(glyph, '🌐', `${code}: ${entry.domain}`)
    assert.equal([...glyph].length, 2, `${code}: ${glyph}`)
  }
})

test('drafts are absent from the published and sorted lists', () => {
  for (const [code, entry] of Object.entries(publishedLocales))
    assert.notEqual(entry.draft, true, code)
  for (const [code, entry] of sortedLocales)
    assert.notEqual(entry.draft, true, code)
  const published = Object.keys(allLocales).filter(
    (code) => !allLocales[code].draft,
  )
  assert.deepEqual(Object.keys(publishedLocales), published)
  assert.deepEqual(sortedLocales.map(([code]) => code).sort(), published.sort())
})

test('script groups cover every published locale exactly once, in script order', () => {
  const groups = scriptGroups()
  const codes = groups.flatMap((group) => group.locales.map(([code]) => code))
  assert.deepEqual(codes.slice().sort(), Object.keys(publishedLocales).sort())
  assert.equal(new Set(codes).size, codes.length)
  assert.equal(groups[0]?.script, 'Latn')
  assert.equal(groups[0]?.locales[0]?.[0], 'en')
  const positions = groups.map((group) => SCRIPT_ORDER.indexOf(group.script))
  const known = positions.filter((position) => position >= 0)
  assert.deepEqual(
    known,
    known.slice().sort((a, b) => a - b),
  )
  for (const group of groups) {
    for (const [code, entry] of group.locales)
      assert.equal(entry.script, group.script, code)
  }
  // Within a script the names read in that script's own order.
  const cyrillic = groups.find((group) => group.script === 'Cyrl')
  if (cyrillic) {
    const collate = new Intl.Collator(cyrillic.locales[0][1].formatLocale)
      .compare
    const names = cyrillic.locales.map(([, entry]) => entry.name)
    assert.deepEqual(names, names.slice().sort(collate))
  }
})

test('a language answers to its own name, its English name and its code, accents aside', () => {
  const da = allLocales.da
  assert.ok(matchesLocale(da, 'dansk', 'da'))
  assert.ok(matchesLocale(da, 'Danish', 'da'))
  assert.ok(matchesLocale(da, 'da', 'da'))
  assert.ok(matchesLocale(da, 'da-dk', 'da'))
  assert.ok(matchesLocale(da, '  ', 'da'))
  assert.ok(!matchesLocale(da, 'swedish', 'da'))
  assert.ok(matchesLocale(allLocales['es-MX'], 'espanol', 'es-MX'))
  assert.ok(matchesLocale(allLocales['es-MX'], 'ESPAÑOL mex', 'es-MX'))
  assert.ok(matchesLocale(allLocales.tr, 'turkce', 'tr'))
  assert.ok(matchesLocale(allLocales.no, 'no', 'no'))
  assert.ok(
    matchesLocale({ ...da, searchTerms: ['jutlandic'] }, 'Jutlandic', 'da'),
  )
  assert.equal(searchable('Ελληνικά'), 'ελληνικα')
  assert.equal(searchable('Tiếng Việt'), 'tieng viet')
})

test('localeHref keeps the page where the other site has it', () => {
  assert.equal(
    localeHref('da', '/themes/', '?x=1'),
    'https://omarchy.dk/themes/?x=1',
  )
  assert.equal(localeHref('da', '/manual/faq/'), 'https://omarchy.dk/')
  assert.equal(
    localeHref('en', '/manual/faq/'),
    'https://omarchy.org/manual/faq/',
  )
})
