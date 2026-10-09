import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import locales from '../../src/i18n/locales.json' with { type: 'json' }
import { NATIONAL_THEMES } from '../../src/lib/national-themes.ts'
import {
  countryOf,
  nationalThemeOf,
  themesFor,
  STOCK_THEMES,
} from '../../src/lib/site-themes.ts'
import {
  contrast,
  luminance,
  problemsWith,
  SHAPE_CONTRAST,
  TEXT_CONTRAST,
  themeTokens,
} from './national-palette.mjs'
import { wordGrid } from '../../src/lib/word-shade.ts'

test('every language site but the English one has a national theme', () => {
  for (const code of Object.keys(locales)) {
    if (code === 'en') {
      assert.equal(countryOf(code), null)
      continue
    }
    assert.ok(nationalThemeOf(code), `${code} has no national theme`)
  }
})

test('a national site lists its own theme first, then the stock ones', () => {
  const themes = themesFor('tr')
  assert.equal(themes[0].id, 'turkiye')
  assert.deepEqual(themes.slice(1), STOCK_THEMES)
  assert.deepEqual(themesFor('en'), STOCK_THEMES)
})

test('theme ids are unique and never clash with a stock theme', () => {
  const ids = [...STOCK_THEMES, ...NATIONAL_THEMES].map((theme) => theme.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('every flag is described completely', () => {
  for (const theme of NATIONAL_THEMES)
    assert.deepEqual(problemsWith(theme), [], theme.id)
})

test('buttons wear the flag colour exactly, with a readable label', () => {
  for (const theme of NATIONAL_THEMES) {
    const tokens = themeTokens(theme)
    assert.equal(
      tokens['--t-brand-fill'],
      theme.colors[theme.button.fill].toLowerCase(),
      theme.id,
    )
    assert.ok(
      contrast(tokens['--t-brand-ink'], tokens['--t-brand-fill']) >=
        TEXT_CONTRAST,
      `${theme.id}: button label`,
    )
  }
})

test('text, links and the word can all be read on their grounds', () => {
  for (const theme of NATIONAL_THEMES) {
    const tokens = themeTokens(theme)
    const grounds = ['--t-bg-deep', '--t-bg', '--t-surface', '--t-surface-2']
    for (const ground of grounds) {
      for (const ink of [
        '--t-text',
        '--t-text-secondary',
        '--t-text-muted',
        '--t-brand',
      ])
        assert.ok(
          contrast(tokens[ink], tokens[ground]) >= TEXT_CONTRAST,
          `${theme.id}: ${ink} on ${ground}`,
        )
    }
    const [, ...cells] = tokens['--t-word-cells'].split(' ')
    const hoist = tokens['--t-word-hoist']?.split(' ')[0]
    for (const cell of new Set(hoist ? [...cells, hoist] : cells))
      assert.ok(
        contrast(cell, tokens['--t-field-bg']) >= SHAPE_CONTRAST,
        `${theme.id}: word colour ${cell}`,
      )
  }
})

test('src/national-themes.css is generated from the flags', () => {
  execFileSync(
    process.execPath,
    [
      new URL('../build-national-themes.mjs', import.meta.url).pathname,
      '--check',
    ],
    { stdio: 'pipe' },
  )
})

test('every colour starts exact at its top and only deepens below', () => {
  const field = '#020821'
  const grid = wordGrid(
    {
      axis: 'cols',
      cells: [
        ...Array(27).fill('#2052d3'),
        ...Array(27).fill('#ffffff'),
        ...Array(27).fill('#e1000f'),
      ],
    },
    field,
  )
  const down = (col) => grid.map((line) => line[col])
  for (const [col, exact] of [
    [0, '#2052d3'],
    [40, '#ffffff'],
    [80, '#e1000f'],
  ]) {
    const cells = down(col)
    assert.equal(cells[0], exact)
    // Each step is no lighter than the one above it.
    for (let row = 1; row < cells.length; row++)
      assert.ok(luminance(cells[row]) <= luminance(cells[row - 1]))
    // Four even steps of five, five, five and four rows.
    const runs = []
    for (const cell of cells)
      if (runs.at(-1)?.[0] === cell) runs.at(-1)[1]++
      else runs.push([cell, 1])
    assert.deepEqual(
      runs.map(([, rows]) => rows),
      [5, 5, 5, 4],
    )
  }
  // Stripes keep their edges.
  assert.notEqual(grid[0][26], grid[0][27])
})

test('a band of a flag starts at its own exact colour', () => {
  const red = '#c8102e'
  const grid = wordGrid(
    {
      axis: 'rows',
      cells: [
        ...Array(8).fill(red),
        ...Array(3).fill('#ffffff'),
        ...Array(8).fill(red),
      ],
    },
    '#1c0101',
  )
  const down = grid.map((line) => line[40])
  // Both reds start exact, then step deeper in even steps of four rows.
  assert.equal(down[0], red)
  assert.equal(down[11], red)
  assert.deepEqual(down.slice(0, 4), Array(4).fill(red))
  assert.notEqual(down[4], red)
  assert.equal(down[4], down[7])
  for (const cell of down)
    assert.ok(luminance(cell) <= luminance(red) || cell === '#ffffff')
  // The thin cross stays flat white.
  assert.deepEqual(new Set(down.slice(8, 11)), new Set(['#ffffff']))
})

test('a Nordic cross runs its upright flat down the M middle stem', () => {
  const sverige = NATIONAL_THEMES.find((theme) => theme.id === 'sverige')
  const tokens = themeTokens(sverige)
  const [yellow, from, to] = tokens['--t-word-uprights'].split(' ')
  assert.deepEqual([Number(from), Number(to)], [17, 20])
  const grid = wordGrid(
    {
      axis: 'rows',
      cells: tokens['--t-word-cells'].split(' ').slice(1),
      uprights: [{ color: yellow, from: 17, to: 20 }],
    },
    tokens['--t-field-bg'],
  )
  for (const line of grid)
    assert.deepEqual(line.slice(17, 20), [yellow, yellow, yellow])
})
