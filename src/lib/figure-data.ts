/** Build-time display data, serialized by Astro alongside the page's news. */
export type Momentum = {
  checked: string
  foundation: {
    total: number
    steps: Array<{ date: string; amount: number; post: string }>
  }
  downloads: {
    total: number
    post: string
    periods: Array<{ label: string; count: number }>
  }
  github: {
    stars: number
    pullRequests: number
    contributors: number
    weeks: number[]
  }
}

export const COUNT_DURATION = 1100
const COUNT_STEPS = 66

/** The existing cubic count-up, sampled at 60 fps. Formatting its small,
 *  finite set of frames here keeps even the animation independent of the
 *  browser's locale support, without shipping an Intl implementation. */
export function countFrames(value: number, formatLocale: string) {
  const digits = Number.isInteger(value) ? 0 : 1
  const format = new Intl.NumberFormat(formatLocale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  return Array.from({ length: COUNT_STEPS + 1 }, (_, i) =>
    format.format(value * (1 - Math.pow(1 - i / COUNT_STEPS, 3))),
  )
}

export function formatFigures(data: Momentum, formatLocale: string) {
  const { foundation, downloads, github } = data
  const number = new Intl.NumberFormat(formatLocale)
  const shortDate = new Intl.DateTimeFormat(formatLocale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  const weekDate = new Intl.DateTimeFormat(formatLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return {
    foundation: {
      total: foundation.total,
      frames: countFrames(foundation.total * 1_000_000, formatLocale),
      steps: foundation.steps.map((step) => ({
        ...step,
        date: shortDate.format(new Date(`${step.date}T00:00:00Z`)),
      })),
    },
    downloads: {
      frames: countFrames(downloads.total, formatLocale),
      post: downloads.post,
      periods: downloads.periods.map((period) => ({
        label: period.label,
        count: number.format(period.count),
      })),
    },
    github: {
      frames: countFrames(github.stars, formatLocale),
      pullRequests: number.format(github.pullRequests),
      contributors: github.contributors,
      weeks: github.weeks,
      weekLabels: github.weeks.map((count, i) => {
        const date = new Date(`${data.checked}T00:00:00Z`)
        date.setUTCDate(date.getUTCDate() - (github.weeks.length - 1 - i) * 7)
        return { count: number.format(count), date: weekDate.format(date) }
      }),
    },
  }
}

export type FiguresData = ReturnType<typeof formatFigures>
