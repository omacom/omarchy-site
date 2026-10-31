import assert from 'node:assert/strict'
import { test } from 'node:test'
import { inlineJson } from './inline-json.ts'

test('inline JSON cannot end a script element and preserves the original data', () => {
  const value = {
    theme: '</script><script>alert("x")</script>',
    separators: '\u2028\u2029',
  }
  const encoded = inlineJson(value)
  assert.equal(encoded.includes('<'), false)
  assert.equal(encoded.includes('\u2028'), false)
  assert.equal(encoded.includes('\u2029'), false)
  assert.deepEqual(JSON.parse(encoded), value)
})
