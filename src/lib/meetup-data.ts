/** The calendar's shape is stable even when optional fields have no values
 *  in the current JSON snapshot. */
export type Meetup = {
  id: string
  title: string
  url: string
  start: string
  timezone: string | null
  address: string | null
  city: string | null
  country: string | null
  cover: string | null
  coverWidth?: number
  coverHeight?: number
  geo: { lat: number; lon: number; approximate?: boolean } | null
}

/** Dates, time zones and country names are resolved once at build time.
 *  Both hydrated cards and later map/filter interactions use these strings. */
export function formatMeetups(
  calendar: { refreshed: string; events: Meetup[] },
  formatLocale: string,
) {
  const regions = new Intl.DisplayNames([formatLocale], { type: 'region' })
  const countries: Record<string, string> = {}
  for (const { country } of calendar.events) {
    if (!country || countries[country]) continue
    try {
      countries[country] = regions.of(country) || country
    } catch {
      countries[country] = country
    }
  }
  return {
    refreshed: calendar.refreshed,
    countries,
    events: calendar.events.map((event) => {
      const date = new Date(event.start)
      const inZone = (options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(formatLocale, {
          ...options,
          timeZone: event.timezone || 'UTC',
        }).format(date)
      const country = event.country ? countries[event.country] : ''
      const where = event.city
        ? !country || event.city.includes(country)
          ? event.city
          : `${event.city}, ${country}`
        : event.address || country
      return {
        ...event,
        where,
        when: `${inZone({ weekday: 'short', month: 'short', day: 'numeric' })} · ${inZone({ hour: 'numeric', minute: '2-digit' })}`,
        shortDate: inZone({ month: 'short', day: 'numeric' }),
        fullDate: inZone({ month: 'short', day: 'numeric', year: 'numeric' }),
        month: inZone({ month: 'long', year: 'numeric' }),
      }
    }),
  }
}

export type MeetupsData = ReturnType<typeof formatMeetups>
export type LocalizedMeetup = MeetupsData['events'][number]
