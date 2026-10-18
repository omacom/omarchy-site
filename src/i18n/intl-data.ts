/**
 * The date, number and region-name data one edition needs, read from the
 * build's full ICU. astro.config.mjs inlines it into src/i18n/format.ts, so
 * pages format from data they carry rather than from the browser's ICU, which
 * desktop Chrome strips for Bosnian, Uzbek, Icelandic, Irish and others.
 */

/** Every date shape the site renders. */
export const DATE_FORMATS = {
  longDate: { day: 'numeric', month: 'long', year: 'numeric' },
  shortDate: { day: 'numeric', month: 'short', year: 'numeric' },
  monthDay: { day: 'numeric', month: 'short' },
  weekdayMonthDay: { weekday: 'short', month: 'short', day: 'numeric' },
  time: { hour: 'numeric', minute: '2-digit' },
  monthYear: { month: 'long', year: 'numeric' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

export type DateFormatName = keyof typeof DATE_FORMATS

const FIELDS = [
  'year',
  'month',
  'day',
  'weekday',
  'hour',
  'minute',
  'dayPeriod',
] as const satisfies readonly Intl.DateTimeFormatPartTypes[]
type DateField = (typeof FIELDS)[number]
/** Every field but the year is looked up in a table of its values. */
export type TableField = Exclude<DateField, 'year'>

const isField = (type: string): type is DateField =>
  (FIELDS as readonly string[]).includes(type)

export type DatePart =
  { text: string } | { field: 'year' } | { field: TableField; values: string[] }

export type IntlData = {
  yearOffset: number
  number: {
    digits: string[]
    decimal: string
    group: string
    negativePrefix: string
    primaryGroup: number
    secondaryGroup: number
    minimumGroupingDigits: number
  }
  dates: Record<DateFormatName, DatePart[]>
  regions: Record<string, string>
}

// V8 turns ICU's narrow no-break space into a plain space in format() for
// web compatibility, but not in formatToParts(); match what pages show.
const asFormatted = (text: string) => text.replaceAll('\u202f', ' ')

/** One part's text. This runs at build time, so a missing part stops the
 *  build rather than shipping blank dates. */
function part(
  parts: readonly { type: string; value: string }[],
  type: string,
  tag: string,
) {
  const value = parts.find((p) => p.type === type)?.value
  if (value === undefined) throw new Error(`${tag}: ICU gave no ${type} part`)
  return value
}

// How many values each field takes, and a date that shows value i.
// 2026-02-01 is a Sunday, so weekday i lines up with getUTCDay.
const SAMPLES: Record<
  TableField,
  { count: number; at: (i: number) => number }
> = {
  month: { count: 12, at: (i) => Date.UTC(2026, i, 15) },
  weekday: { count: 7, at: (i) => Date.UTC(2026, 1, 1 + i) },
  day: { count: 31, at: (i) => Date.UTC(2026, 0, 1 + i) },
  hour: { count: 24, at: (i) => Date.UTC(2026, 0, 1, i) },
  dayPeriod: { count: 24, at: (i) => Date.UTC(2026, 0, 1, i) },
  minute: { count: 60, at: (i) => Date.UTC(2026, 0, 1, 0, i) },
}

function datePattern(
  tag: string,
  options: Intl.DateTimeFormatOptions,
): DatePart[] {
  const format = new Intl.DateTimeFormat(tag, { ...options, timeZone: 'UTC' })
  const valuesOf = (field: TableField) => {
    const { count, at } = SAMPLES[field]
    return Array.from({ length: count }, (_, i) =>
      asFormatted(part(format.formatToParts(at(i)), field, tag)),
    )
  }
  // A two-digit day and an afternoon hour, so no value reads as a literal.
  return format
    .formatToParts(Date.UTC(2026, 8, 22, 14, 5))
    .map(({ type, value }): DatePart => {
      if (!isField(type)) return { text: asFormatted(value) }
      if (type === 'year') return { field: type }
      return { field: type, values: valuesOf(type) }
    })
}

function numberData(tag: string): IntlData['number'] {
  const format = new Intl.NumberFormat(tag)
  const partOf = (value: number, type: string) =>
    part(format.formatToParts(value), type, tag)
  // Sizes from the right: 3 then 3 for 1,234,567, but 3 then 2 for the
  // Indian 12,34,567.
  const [secondaryGroup, primaryGroup] = format
    .formatToParts(1234567890)
    .filter((p) => p.type === 'integer')
    .map((p) => p.value.length)
    .slice(-2)
  // What comes before a negative number's digits: "−" in Swedish, a
  // left-to-right mark and "-" in Arabic.
  const negative = format.formatToParts(-1)
  const prefix = negative.slice(
    0,
    negative.findIndex((p) => p.type === 'integer'),
  )
  if (!prefix.some((p) => p.type === 'minusSign'))
    throw new Error(`${tag}: ICU puts no minus sign before the digits`)
  const plain = new Intl.NumberFormat(tag, { useGrouping: false })
  return {
    digits: Array.from({ length: 10 }, (_, d) => plain.format(d)),
    decimal: partOf(1.5, 'decimal'),
    group: partOf(1234567, 'group'),
    negativePrefix: prefix.map((p) => p.value).join(''),
    primaryGroup,
    secondaryGroup,
    // Some locales (Polish, Spanish) leave a four-digit number ungrouped.
    minimumGroupingDigits: format
      .formatToParts(1234)
      .some((p) => p.type === 'group')
      ? 1
      : 2,
  }
}

// The Thai calendar counts from 543 BCE.
function yearOffset(tag: string) {
  const format = new Intl.DateTimeFormat(tag, {
    year: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })
  const year = part(format.formatToParts(Date.UTC(2026, 5, 1)), 'year', tag)
  return Number(year) - 2026
}

const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']

function regionNames(tag: string) {
  const names = new Intl.DisplayNames([tag], {
    type: 'region',
    fallback: 'none',
  })
  const regions: Record<string, string> = {}
  for (const a of LETTERS)
    for (const b of LETTERS) {
      const name = names.of(a + b)
      if (name) regions[a + b] = name
    }
  return regions
}

export function intlData(tag: string): IntlData {
  return {
    yearOffset: yearOffset(tag),
    number: numberData(tag),
    dates: Object.fromEntries(
      Object.entries(DATE_FORMATS).map(
        ([name, options]) => [name, datePattern(tag, options)] as const,
      ),
    ) as IntlData['dates'],
    regions: regionNames(tag),
  }
}
