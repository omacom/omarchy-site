import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  FIELD_BAND_ROWS,
  FIELD_BAND_UNITS,
  fieldBandGradientCss,
  fieldBandInkAtRow,
  fieldBandInkAtT,
  fieldBandRowInks,
  fieldBandStopPercents,
} from './field-bands.ts'

test('wordmark bands are 4, 3, 4, 3, 5 units crest to dim', () => {
  assert.deepEqual(
    FIELD_BAND_UNITS.map(([ink, units]) => [ink, units]),
    [
      ['crest', 4],
      ['hover', 3],
      ['lit', 4],
      ['mid', 3],
      ['dim', 5],
    ],
  )
  assert.equal(FIELD_BAND_ROWS, 19)
  assert.deepEqual(fieldBandRowInks(), [
    'crest',
    'crest',
    'crest',
    'crest',
    'hover',
    'hover',
    'hover',
    'lit',
    'lit',
    'lit',
    'lit',
    'mid',
    'mid',
    'mid',
    'dim',
    'dim',
    'dim',
    'dim',
    'dim',
  ])
})

test('bands fill the word: 4/19 crest through 5/19 dim', () => {
  assert.equal(fieldBandInkAtT(0), 'crest')
  assert.equal(fieldBandInkAtT(4 / 19 - 1e-9), 'crest')
  assert.equal(fieldBandInkAtT(4 / 19), 'hover')
  assert.equal(fieldBandInkAtT(7 / 19), 'lit')
  assert.equal(fieldBandInkAtT(11 / 19), 'mid')
  assert.equal(fieldBandInkAtT(14 / 19), 'dim')
  assert.equal(fieldBandInkAtT(1), 'dim')
})

test('each of the 19 bitmap rows is one 4-3-4-3-5 unit', () => {
  const rows = Array.from({ length: 19 }, (_, row) =>
    fieldBandInkAtRow(row, 19),
  )
  assert.deepEqual(rows, fieldBandRowInks())
  assert.equal(rows[3], 'crest')
  assert.equal(rows[4], 'hover')
  assert.equal(rows[6], 'hover')
  assert.equal(rows[7], 'lit')
  assert.equal(rows[10], 'lit')
  assert.equal(rows[11], 'mid')
  assert.equal(rows[13], 'mid')
  assert.equal(rows[14], 'dim')
})

test('wordmark CSS bands are 4/19, 3/19, 4/19, 3/19, 5/19 of the height', () => {
  assert.deepEqual(
    fieldBandStopPercents(),
    [0, 21.053, 36.842, 57.895, 73.684, 100],
  )
  const css = fieldBandGradientCss()
  assert.match(css, /0% 21\.053%/)
  assert.match(css, /21\.053% 36\.842%/)
  assert.match(css, /36\.842% 57\.895%/)
  assert.match(css, /57\.895% 73\.684%/)
  assert.match(css, /73\.684% 100%/)
})

test('/brand preview and oma-logo.svg use the same 4-3-4-3-5 stops', async () => {
  const compact = (value: string) => value.replace(/\s+/g, '')
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8')
  assert.equal(compact(css).includes(compact(fieldBandGradientCss())), true)

  const svg = await readFile(
    new URL('../../brand/oma-logo.svg', import.meta.url),
    'utf8',
  )
  for (const edge of fieldBandStopPercents().slice(1)) {
    assert.equal(svg.includes(`offset="${edge}%"`), true)
  }
  assert.equal(svg.includes('26.316%'), false)
})
