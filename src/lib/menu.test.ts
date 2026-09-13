import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { SearchEntry } from '../astro/search-index.ts'
import { locales } from '../i18n/site.ts'
import {
  childrenOf,
  everyRow,
  filterRows,
  localeHref,
  menuItem,
  menuParent,
  menuTitle,
  opensMenu,
  providerRows,
} from './menu.ts'

const chapter = (
  slug: string,
  title: string,
  heading: string | null,
): SearchEntry => ({
  kind: 'manual',
  slug,
  title,
  heading,
  hash: heading && heading.toLowerCase(),
  text: 'body',
})

const post: SearchEntry = {
  kind: 'news',
  slug: 'hello',
  year: '2026',
  month: '09',
  title: 'Hello',
  meta: 'September 2026',
  text: 'body',
}

test('every manual chapter is listed once, in index order, even one that opens with a heading', () => {
  const index = [
    chapter('index', 'Getting started', null),
    chapter('index', 'Getting started', 'Install'),
    // No headingless entry: the chapter's text starts under its first heading.
    chapter('faq', 'FAQ', 'Why Hyprland?'),
    chapter('faq', 'FAQ', 'Why Arch?'),
    chapter('tuis', 'TUIs', null),
    post,
  ]
  assert.deepEqual(
    providerRows('manual', index).map((row) => [row.id, row.label, row.to]),
    [
      ['manual.index', 'Getting started', '/manual/'],
      ['manual.faq', 'FAQ', '/manual/faq/'],
      ['manual.tuis', 'TUIs', '/manual/tuis/'],
    ],
  )
})

test('a row without a provider takes nothing from the index', () => {
  assert.deepEqual(providerRows(undefined, [post]), [])
  assert.deepEqual(providerRows('manual', null), [])
  assert.equal(opensMenu(menuItem('news')!), false)
})

test('filtering keeps the rows whose label contains every term', () => {
  const root = childrenOf('root')
  assert.deepEqual(
    filterRows(root, 'found').map((row) => row.id),
    ['foundation'],
  )
  assert.deepEqual(
    filterRows(root, 'ins TALL').map((row) => row.id),
    ['install'],
  )
  assert.deepEqual(filterRows(root, 'nothing like this'), [])
  assert.deepEqual(filterRows(root, '  '), root)
  // From the root a query reaches the whole tree, not just the root's rows.
  const doctrine = filterRows(everyRow(), 'doctrine')
  assert.deepEqual(
    doctrine.map((row) => [row.id, menuParent(row)?.id]),
    [['community.doctrine', 'community']],
  )
  assert.deepEqual(
    filterRows(everyRow(), 'dansk').map((row) => row.id),
    ['language.da'],
  )
  // GitHub is at the root and under Project; a query lists it once.
  assert.deepEqual(
    filterRows(everyRow(), 'github').map((row) => row.id),
    ['github'],
  )
  assert.ok(childrenOf('project').some((row) => row.id === 'project.github'))
})

test('the tree reads out of the dotted ids', () => {
  assert.equal(childrenOf('root')[0]?.id, 'home')
  for (const row of childrenOf('community'))
    assert.ok(row.id.startsWith('community.'), row.id)
  assert.equal(opensMenu(menuItem('manual')!), true)
  assert.equal(opensMenu(menuItem('community')!), true)
  assert.equal(opensMenu(menuItem('themes')!), false)
  assert.equal(menuTitle('root'), 'Go')
  assert.equal(menuTitle('community'), menuItem('community')!.label)
})

test('the root runs Home to Project, Plugins before Themes and GitHub before Install', () => {
  assert.deepEqual(
    childrenOf('root').map((row) => row.id),
    [
      'home',
      'manual',
      'news',
      'plugins',
      'themes',
      'language',
      'github',
      'install',
      'community',
      'foundation',
      'project',
    ],
  )
})

test('every locale is a language row, English first, linking to the page only where that site has it', () => {
  const rows = childrenOf('language')
  assert.equal(rows.length, Object.keys(locales).length)
  assert.equal(rows[0]?.locale, 'en')
  assert.ok(rows.every((row) => row.glyph && row.locale && row.label))
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
