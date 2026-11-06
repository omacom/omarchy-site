import { assetId } from './asset-id.mjs'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { voiceHandle, tweetId } from './voice-input.mjs'
import { decodeCalendarText } from './ical.mjs'

test('avatar handles cannot escape their output directory', () => {
  for (const value of [
    '../file',
    '..\\file',
    'a/b',
    'a%2fb',
    '',
    null,
    'x'.repeat(16),
  ]) {
    assert.throws(() => voiceHandle(value))
  }
  assert.equal(voiceHandle('SimonHoiberg'), 'SimonHoiberg')
})

test('tweet input accepts post URLs only and produces a numeric file suffix', () => {
  assert.equal(tweetId('https://x.com/dhh/status/123456?s=20'), '123456')
  for (const url of [
    'https://evil.example/x.com/dhh/status/123',
    'https://x.com/dhh/status/../file',
    'https://x.com/dhh/status/123/extra',
    'http://x.com/dhh/status/123',
  ]) {
    assert.throws(() => tweetId(url))
  }
})

test('calendar text decodes punctuation, line breaks, and literal backslashes', () => {
  assert.equal(
    decodeCalendarText(String.raw`one\; two\, three\nfour\Nfive`),
    'one; two, three\nfour\nfive',
  )
  assert.equal(
    decodeCalendarText(String.raw`literal \\n`),
    String.raw`literal \n`,
  )
})

test('upstream asset IDs cannot form paths outside the output tree', () => {
  for (const id of [
    '../outside',
    '/tmp/outside',
    'x/../../outside',
    'x\\outside',
    '.',
    '..',
    'x%2foutside',
  ]) {
    assert.throws(() => assetId(id))
  }
  assert.equal(assetId('org.example.plugin'), 'org.example.plugin')
  assert.equal(assetId('evt-abc123'), 'evt-abc123')
})
