import { test } from 'node:test'
import assert from 'node:assert/strict'
import ukrainian from '../i18n/messages/uk.json' with { type: 'json' }
import { translatePlural } from './plural.ts'

test('Ukrainian counted labels handle singular, few, and many including teens', () => {
  const forms = {
    contributors: ['учасник', 'учасники', 'учасників'],
    hearts: ['вподобайка', 'вподобайки', 'вподобайок'],
    stars: ['зірка', 'зірки', 'зірок'],
    results: ['результат', 'результати', 'результатів'],
    'pull requests ·': [
      'запит на злиття ·',
      'запити на злиття ·',
      'запитів на злиття ·',
    ],
  }
  const counts = [
    [1, 21, 101, 1001],
    [2, 3, 4, 22, 23, 24, 102],
    [0, 5, 11, 12, 14, 20, 25, 111, 112, 114],
  ]
  for (const [label, translations] of Object.entries(forms)) {
    for (const [index, numbers] of counts.entries()) {
      for (const count of numbers) {
        assert.equal(
          translatePlural(ukrainian, 'uk-UA', label, count),
          translations[index],
          `${count} ${label}`,
        )
      }
    }
  }
})

test('plural lookup supports other categories and preserves untranslated fallbacks', () => {
  assert.equal(
    translatePlural({ 'items [other]': 'дробові' }, 'uk-UA', 'items', 1.5),
    'дробові',
  )
  assert.equal(
    translatePlural(
      { contributors: 'bidragydere' },
      'da-DK',
      'contributors',
      1,
    ),
    'bidragydere',
  )
  assert.equal(translatePlural({}, 'en-US', 'contributors', 2), 'contributors')
})
