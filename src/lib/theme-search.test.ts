import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchesTheme } from './theme-search.ts'

test('an empty or blank query finds every theme', () => {
  assert.equal(matchesTheme('Tokyo Night', ''), true)
  assert.equal(matchesTheme('Tokyo Night', '   '), true)
})

test('a query finds any part of the name, ignoring case and accents', () => {
  assert.equal(matchesTheme('Tokyo Night', 'NIGHT'), true)
  assert.equal(matchesTheme('Tokyo Night', 'kyo'), true)
  assert.equal(matchesTheme('Café Noir', 'cafe'), true)
  assert.equal(matchesTheme('Cafe Noir', 'café'), true)
})

test('every term must match, in any order', () => {
  assert.equal(matchesTheme('Tokyo Night', 'night tokyo'), true)
  assert.equal(matchesTheme('Tokyo Night', 'tokyo day'), false)
})
