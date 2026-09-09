import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pluralCategory } from './plural.ts'

test('Ukrainian plural categories follow the language rules', () => {
  assert.deepEqual(
    [1, 21, 101].map((count) => pluralCategory('uk-UA', count)),
    ['one', 'one', 'one'],
  )
  assert.deepEqual(
    [2, 3, 4, 22, 23, 24].map((count) => pluralCategory('uk-UA', count)),
    ['few', 'few', 'few', 'few', 'few', 'few'],
  )
  assert.deepEqual(
    [0, 5, 11, 12, 14, 20, 25].map((count) => pluralCategory('uk-UA', count)),
    ['many', 'many', 'many', 'many', 'many', 'many', 'many'],
  )
})
