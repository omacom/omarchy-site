import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  FIELD_BAND_ROWS,
  FIELD_BAND_UNITS,
  fieldBandGradientCss,
  fieldBandInkAtRow,
  fieldBandInkAtT,
  fieldBandRowInks,
} from './field-bands.ts'

test('wordmark bands are 5, 2, 4, 3, 5 units crest to dim', () => {
  assert.deepEqual(
    FIELD_BAND_UNITS.map(([ink, units]) => [ink, units]),
    [
      ['crest', 5],
      ['hover', 2],
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
    'crest',
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

test('bands fill the word: 5/19 crest through 5/19 dim', () => {
  assert.equal(fieldBandInkAtT(0), 'crest')
  assert.equal(fieldBandInkAtT(5 / 19 - 1e-9), 'crest')
  assert.equal(fieldBandInkAtT(5 / 19), 'hover')
  assert.equal(fieldBandInkAtT(7 / 19), 'lit')
  assert.equal(fieldBandInkAtT(11 / 19), 'mid')
  assert.equal(fieldBandInkAtT(14 / 19), 'dim')
  assert.equal(fieldBandInkAtT(1), 'dim')
})

test('each of the 19 bitmap rows is one 5-2-4-3-5 unit', () => {
  const rows = Array.from({ length: 19 }, (_, row) => fieldBandInkAtRow(row, 19))
  assert.deepEqual(rows, fieldBandRowInks())
  assert.equal(rows[4], 'crest')
  assert.equal(rows[5], 'hover')
  assert.equal(rows[6], 'hover')
  assert.equal(rows[7], 'lit')
  assert.equal(rows[10], 'lit')
  assert.equal(rows[11], 'mid')
  assert.equal(rows[13], 'mid')
  assert.equal(rows[14], 'dim')
})

test('wordmark CSS bands are 5/19, 2/19, 4/19, 3/19, 5/19 of the height', () => {
  const css = fieldBandGradientCss()
  assert.match(css, /0% 26\.316%/)
  assert.match(css, /26\.316% 36\.842%/)
  assert.match(css, /36\.842% 57\.895%/)
  assert.match(css, /57\.895% 73\.684%/)
  assert.match(css, /73\.684% 100%/)
})
