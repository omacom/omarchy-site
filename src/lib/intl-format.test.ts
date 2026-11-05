import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createFormat } from '../i18n/create-format.ts'
import {
  DATE_FORMATS,
  intlData,
  type DateFormatName,
} from '../i18n/intl-data.ts'
import locales from '../i18n/locales.json' with { type: 'json' }

const zones = [
  'UTC',
  'America/New_York',
  'Europe/Sarajevo',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Chatham',
]
const dates = Array.from(
  { length: 220 },
  (_, i) => new Date(Date.UTC(2025, 0, 1) + i * 5 * 86400000 + i * 37 * 60000),
)
const numbers = [
  0, 1, 7, 12, 123, 999, 1000, 1234, 9999, 10000, 12345, 43466, 123456, 390146,
  1204788, 21700000, 0.5, 1.25, 21.7, 99.95, 1234.5, 18.35,
  // Halves that binary scaling rounds the wrong way.
  1.005, 1.045, 0.125, 2.675, 8.345, 99.995,
  // Some locales write a minus sign, not a hyphen.
  -1, -7, -1234, -21.7, -1234.5, -1204788,
]

test('bundled data formats like full ICU for every edition', () => {
  for (const [code, { formatLocale: tag }] of Object.entries(locales)) {
    const data = intlData(tag)
    const format = createFormat(data)
    for (const [name, options] of Object.entries(DATE_FORMATS))
      for (const timeZone of zones) {
        const expected = new Intl.DateTimeFormat(tag, { ...options, timeZone })
        for (const date of dates)
          assert.equal(
            format.date(name as DateFormatName, date, timeZone),
            expected.format(date),
            `${code} ${name} ${timeZone} ${date.toISOString()}`,
          )
      }
    for (const value of numbers)
      for (const digits of [0, 1, 2])
        assert.equal(
          format.number(value, digits),
          value.toLocaleString(tag, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          }),
          `${code} ${value} ${digits}`,
        )
    const regions = new Intl.DisplayNames([tag], { type: 'region' })
    for (const [region, name] of Object.entries(data.regions))
      assert.equal(name, regions.of(region), `${code} ${region}`)
  }
})
