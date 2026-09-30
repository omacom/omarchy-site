import assert from 'node:assert/strict'
import { test } from 'node:test'
import { countFrames, formatFigures } from './figure-data.ts'
import type { Momentum } from './figure-data.ts'

const data: Momentum = {
  checked: '2026-01-05',
  foundation: {
    total: 15.5,
    steps: [{ date: '2025-12-31', amount: 15.5, post: '/news/funding/' }],
  },
  downloads: {
    total: 1067342,
    post: '/news/downloads/',
    periods: [{ label: 'Last week', count: 75071 }],
  },
  github: {
    stars: 39079,
    pullRequests: 4970,
    contributors: 516,
    weeks: [1, 1234],
  },
}

test('figures carry Albanian numbers and UTC dates across the JSON boundary', () => {
  const display = JSON.parse(JSON.stringify(formatFigures(data, 'sq-AL')))
  assert.equal(display.foundation.frames.at(-1), '15\u00a0500\u00a0000')
  assert.equal(display.downloads.periods[0].count, '75\u00a0071')
  assert.match(display.foundation.steps[0].date, /31.*dhj/)
  assert.match(display.github.weekLabels[0].date, /29.*dhj.*2025/)
  assert.match(display.github.weekLabels[1].date, /5.*jan.*2026/)
  assert.equal(display.github.weekLabels[1].count, '1234')
  assert.equal(display.downloads.post, data.downloads.post)
})

test('count-up frames preserve easing, rounding, and the final value in each locale', () => {
  for (const locale of ['sq-AL', 'en-US', 'hi-IN', 'ar-AE']) {
    for (const value of [0, 15.5, 15500000]) {
      const frames = countFrames(value, locale)
      const digits = Number.isInteger(value) ? 0 : 1
      const format = new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
      assert.equal(frames.length, 67)
      assert.equal(frames[0], format.format(0))
      assert.equal(frames[33], format.format(value * 0.875))
      assert.equal(frames.at(-1), format.format(value))
    }
  }
  assert.equal(countFrames(12345678, 'hi-IN').at(-1), '1,23,45,678')
})
