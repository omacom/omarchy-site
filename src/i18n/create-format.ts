import type { DateFormatName, IntlData, TableField } from './intl-data.ts'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const zoneFormats = new Map<string, Intl.DateTimeFormat>()

/** A date's year in a time zone, and where it falls in each field's table
 *  of values. Only numeric en-US output is used, which every browser ships,
 *  so no localized data is needed here. */
function fieldsIn(
  date: Date,
  timeZone: string,
): Record<TableField, number> & { year: number } {
  let format = zoneFormats.get(timeZone)
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
    })
    zoneFormats.set(timeZone, format)
  }
  const parts = Object.fromEntries(
    format.formatToParts(date).map((p) => [p.type, p.value] as const),
  )
  const hour = Number(parts.hour) % 24
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day) - 1,
    weekday: WEEKDAYS.indexOf(parts.weekday),
    hour,
    minute: Number(parts.minute),
    dayPeriod: hour,
  }
}

/**
 * Dates, numbers and region names formatted from bundled ICU data
 * (src/i18n/intl-data.ts) rather than the browser's, which desktop
 * Chrome strips for several of our languages.
 */
export function createFormat(data: IntlData) {
  const {
    digits,
    decimal,
    group,
    negativePrefix,
    primaryGroup,
    secondaryGroup,
    minimumGroupingDigits,
  } = data.number
  const localDigits = (text: string) =>
    text.replace(/[0-9]/g, (d) => digits[Number(d)])

  function groupInteger(integer: string) {
    if (integer.length < primaryGroup + minimumGroupingDigits) return integer
    const groups = [integer.slice(-primaryGroup)]
    let rest = integer.slice(0, -primaryGroup)
    while (rest.length > secondaryGroup) {
      groups.unshift(rest.slice(-secondaryGroup))
      rest = rest.slice(0, -secondaryGroup)
    }
    if (rest) groups.unshift(rest)
    return groups.join(group)
  }

  function number(value: number, fractionDigits = 0) {
    // Round half away from zero on the decimal value, as Intl does: shifting
    // through the exponent keeps 1.005 at 100.5, where * 100 gives 100.49….
    const units = String(
      Math.round(Number(`${Math.abs(value)}e${fractionDigits}`)),
    ).padStart(fractionDigits + 1, '0')
    const integer = units.slice(0, units.length - fractionDigits)
    const fraction = units.slice(units.length - fractionDigits)
    const text = fraction
      ? `${groupInteger(integer)}${decimal}${fraction}`
      : groupInteger(integer)
    return localDigits(
      value < 0 && /[1-9]/.test(units) ? `${negativePrefix}${text}` : text,
    )
  }

  function date(name: DateFormatName, value: Date, timeZone = 'UTC') {
    const at = fieldsIn(value, timeZone)
    return data.dates[name]
      .map((p) => {
        if ('text' in p) return p.text
        if (p.field === 'year')
          return localDigits(String(at.year + data.yearOffset))
        return p.values[at[p.field]]
      })
      .join('')
  }

  const region = (code: string) => data.regions[code.toUpperCase()] ?? code

  return { number, date, region }
}
