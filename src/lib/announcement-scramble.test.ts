import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  SCRAMBLE_GLYPHS,
  SCRAMBLE_IN_TICKS,
  SCRAMBLE_TICK_MS,
  announcementMarkup,
  scrambleGlyph,
} from './announcement-scramble.ts'

test('emphasizes the current amount after translation without rewriting source copy', () => {
  assert.equal(
    announcementMarkup('Omacom Foundation launches with $15.5 million'),
    'Omacom Foundation launches with <strong>$15.5 million</strong>',
  )
  assert.equal(
    announcementMarkup(
      'La Fondation Omacom démarre avec 15,5 millions de dollars',
    ),
    'La Fondation Omacom démarre avec <strong>15,5</strong> millions de dollars',
  )
  assert.equal(
    announcementMarkup('Omacom Foundation USD මිලියන 15.5 සමඟ ආරම්භ වෙනවා'),
    'Omacom Foundation USD මිලියන <strong>15.5</strong> සමඟ ආරම්භ වෙනවා',
  )
  assert.equal(
    announcementMarkup('Total: $15,5.'),
    'Total: <strong>$15,5</strong>.',
  )
  const authored =
    '<span title="$15.5 million">Authored <strong>$15.5 million</strong></span>'
  assert.equal(announcementMarkup(authored), authored)
})

test('keeps the registry PR #10 glyph pool with a slower reveal cadence', () => {
  assert.equal(
    SCRAMBLE_GLYPHS,
    '░▒▓/\\<>+=*#%&@$0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  )
  assert.equal(SCRAMBLE_TICK_MS, 60)
  assert.equal(SCRAMBLE_IN_TICKS, 26)
})

test('scrambles the amount and dollar sign, not just the announcement prefix', () => {
  for (const character of '$14.95million') {
    assert.equal(
      scrambleGlyph(character, 0, 26, () => 0),
      '░',
    )
    assert.equal(
      scrambleGlyph(character, 25, 26, () => 0.999),
      'Z',
    )
    assert.equal(
      scrambleGlyph(character, 26, 26, () => 0),
      character,
    )
  }
})

test('each position resolves at its own tick and stays resolved', () => {
  assert.equal(
    scrambleGlyph('O', 3, 4, () => 0),
    '░',
  )
  assert.equal(
    scrambleGlyph('O', 4, 4, () => 0),
    'O',
  )
  assert.equal(
    scrambleGlyph('O', 27, 4, () => 0),
    'O',
  )
})

test('whitespace and settled graphemes remain intact', () => {
  for (const whitespace of [' ', '\n', '\u00a0']) {
    assert.equal(
      scrambleGlyph(whitespace, 0, 26, () => 0),
      whitespace,
    )
  }
  for (const grapheme of ['e\u0301', '👩‍💻']) {
    assert.equal(scrambleGlyph(grapheme, 26, 26), grapheme)
  }
})
