import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import locales from '../../src/i18n/locales.json' with { type: 'json' }
import { NATIONAL_THEMES } from '../../src/lib/national-themes.ts'
import { countryOf, nationalThemeOf } from '../../src/lib/national-sites.ts'
import { STOCK_THEMES } from '../../src/lib/site-themes.ts'
import {
  contrast,
  gridFromToken,
  luminance,
  problemsWith,
  WORD_CONTRAST,
  BLACK_CONTRAST,
  isBlackish,
  TEXT_CONTRAST,
  themeTokens,
} from './national-palette.mjs'
import { inHoist, wordGrid } from './word-shade.ts'
import { WORDMARK_ROWS } from '../../src/data/wordmark-bitmap.ts'

test('every language site but the English one has a national theme', () => {
  for (const code of Object.keys(locales)) {
    if (code === 'en') {
      assert.equal(countryOf(code), null)
      continue
    }
    assert.ok(nationalThemeOf(code), `${code} has no national theme`)
  }
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
    // Every cell the word draws, after shading, not only the flag colours
    // it starts from.
    const field = tokens['--t-field-bg']
    for (const cell of new Set(gridFromToken(tokens['--t-word-grid']).flat()))
      if (cell.toLowerCase() !== field)
        assert.ok(
          contrast(cell, field) >=
            (isBlackish(cell) ? BLACK_CONTRAST : WORD_CONTRAST),
          `${theme.id}: word cell ${cell}`,
        )
  }
})

test('src/national-themes/ is generated from the flags', () => {
  execFileSync(
    process.execPath,
    [
      new URL('../build-national-themes.mjs', import.meta.url).pathname,
      '--check',
    ],
    { stdio: 'pipe' },
  )
})

test('every colour is exact on its middle step, lighter above, deeper below', () => {
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
    // Exact on the middle step, rows 7 to 10, as a stock word's lit band;
    // white, which cannot lift, exact from the top.
    assert.equal(cells[exact === '#ffffff' ? 0 : 7], exact)
    if (exact !== '#ffffff') assert.notEqual(cells[0], exact)
    // Each step is no lighter than the one above it.
    for (let row = 1; row < cells.length; row++)
      assert.ok(luminance(cells[row]) <= luminance(cells[row - 1]))
    // Five steps, like the stock bands: four, three, four, three, five rows.
    const runs = []
    for (const cell of cells)
      if (runs.at(-1)?.[0] === cell) runs.at(-1)[1]++
      else runs.push([cell, 1])
    assert.deepEqual(
      runs.map(([, rows]) => rows),
      [4, 3, 4, 3, 5],
    )
  }
  // Stripes keep their edges.
  assert.notEqual(grid[0][26], grid[0][27])
})

test('a field under a cross steps only where it shows', () => {
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
  // Two steps of four rows above the cross, then the exact red just under
  // it and the deepest at the foot, the tallest, as the stock word's is.
  const runs = []
  for (const cell of down)
    if (runs.at(-1)?.[0] === cell) runs.at(-1)[1]++
    else runs.push([cell, 1])
  assert.deepEqual(
    runs.map(([, rows]) => rows),
    [4, 4, 3, 3, 5],
  )
  assert.equal(down[11], red)
  const reds = down.filter((cell) => cell !== '#ffffff')
  for (let i = 1; i < reds.length; i++)
    assert.ok(
      luminance(reds[i]) < luminance(reds[i - 1]) || reds[i] === reds[i - 1],
    )
  // The cross lies flat over it.
  assert.deepEqual(new Set(down.slice(8, 11)), new Set(['#ffffff']))
})

const theme = (id) => NATIONAL_THEMES.find((t) => t.id === id)

test('a Nordic cross runs its upright flat down the M middle stem', () => {
  const tokens = themeTokens(theme('sverige'))
  const grid = gridFromToken(tokens['--t-word-grid'])
  const yellow = grid[0][17]
  for (const line of grid)
    assert.deepEqual(line.slice(17, 20), [yellow, yellow, yellow])
})

const lit = (row, col) => {
  const line = WORDMARK_ROWS[row]
  return (typeof line === 'string' ? line : line.join(''))[col] === '1'
}

test('a triangle edge borders the triangle just above and below it', () => {
  const hoist = {
    color: '#ffffff',
    columns: 27,
    rows: 19,
    tip: 9,
    edge: '#111111',
  }
  const grid = wordGrid(
    { axis: 'rows', cells: Array(19).fill('#319208'), hoist },
    '#031c09',
  )
  for (let row = 0; row < 19; row++)
    for (let col = 0; col < 81; col++) {
      const inside = inHoist(hoist, row, col)
      const beside =
        !inside &&
        (inHoist(hoist, row - 1, col) || inHoist(hoist, row + 1, col))
      if (beside) assert.equal(grid[row][col], '#111111', `${row}:${col}`)
      else assert.notEqual(grid[row][col], '#111111', `${row}:${col}`)
    }
})

test('a slant crosses each upright stroke whole', () => {
  const grid = gridFromToken(themeTokens(theme('tanzania'))['--t-word-grid'])
  for (let row = 0; row < 19; row++) {
    let col = 0
    while (col < 81) {
      if (!lit(row, col)) {
        col++
        continue
      }
      let end = col
      while (lit(row, end)) end++
      // A stroke three wide or less is one colour across.
      if (end - col <= 3)
        assert.equal(
          new Set(grid[row].slice(col, end)).size,
          1,
          `${row}:${col}`,
        )
      col = end
    }
  }
})

test('a bar can cover some rows, and half columns, by its cells middles', () => {
  const grid = gridFromToken(themeTokens(theme('norge'))['--t-word-grid'])
  const [white, blue] = [grid[4][17], grid[8][17]]
  assert.notEqual(white, blue)
  // Off the arm, a half column of white edges a blue two columns wide: the
  // cells whose middles the blue's edges fall on stay white.
  assert.deepEqual(grid[4].slice(17, 20), [white, blue, white])
  // On the arm, the cross runs unbroken through the stem.
  assert.deepEqual(grid[8].slice(17, 20), [blue, blue, blue])
  assert.deepEqual(grid[9].slice(17, 20), [blue, blue, blue])
})

test('a turned word deepens down the page instead of lifting', () => {
  const blue = '#0038b8'
  const field = '#fcfdff'
  const down = (turned) =>
    wordGrid({ axis: 'rows', cells: Array(19).fill(blue), turned }, field).map(
      (line) => luminance(line[1]),
    )
  const plain = down(false)
  const turned = down(true)
  assert.ok(plain[0] < plain[18])
  assert.ok(turned[0] > turned[18])
  // The flag's own blue stays in the middle either way.
  assert.equal(
    wordGrid(
      { axis: 'rows', cells: Array(19).fill(blue), turned: true },
      field,
    )[9][1],
    blue,
  )
})

test('new word shapes reject what they cannot draw', () => {
  const base = theme('tanzania')
  const word = (extra) => ({ ...base, word: { ...base.word, ...extra } })
  assert.ok(
    problemsWith(
      word({ diagonal: { ...base.word.diagonal, above: 'purple' } }),
    ).some((p) => p.includes('purple')),
  )
  assert.ok(
    problemsWith(word({ edge: 'black' })).some((p) => p.includes('triangle')),
  )
  assert.ok(
    problemsWith(word({ uprights: [['black', 17, 20, [10, 30]]] })).some((p) =>
      p.includes('rows'),
    ),
  )
})
