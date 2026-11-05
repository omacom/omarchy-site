import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { currentNewsTranslation } from './news-translation.ts'

const source = { title: 'New release', html: '<p>Available now.</p>' }
const translation = {
  title: 'Ny udgivelse',
  sourceHash: createHash('sha256')
    .update(`${source.title}\n${source.html}`)
    .digest('hex'),
}

test('only a complete translation of the current English source is used', () => {
  assert.equal(
    currentNewsTranslation(source, translation, '<p>Ude nu.</p>'),
    true,
  )
  assert.equal(currentNewsTranslation(source, undefined, undefined), false)
  assert.equal(currentNewsTranslation(source, translation, ' '), false)
  assert.equal(
    currentNewsTranslation(
      { ...source, title: 'Corrected release' },
      translation,
      '<p>Ude nu.</p>',
    ),
    false,
  )
  assert.equal(
    currentNewsTranslation(
      { ...source, html: '<p>Delayed.</p>' },
      translation,
      '<p>Ude nu.</p>',
    ),
    false,
  )
})
