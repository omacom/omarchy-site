import { t } from '@/i18n/site'
import { PageHeading } from '@/components/PageHeading'
import { useEffect, useState } from 'react'
import { MeetupCover } from '@/components/MeetupCover'
import { MeetupMap, PIN_AT, WHOLE_MAP, boxAround } from '@/components/MeetupMap'
import { SectionActions } from '@/components/SectionHeading'
import { ArrowRightIcon } from '@/components/icons'
import type { MeetupsData, LocalizedMeetup as Meetup } from '@/lib/meetup-data'
import { COUNTRIES_OF, REGIONS, regionOf } from '@/lib/regions'
import type { Region } from '@/lib/regions'
import { cn } from '@/lib/utils'

const CALENDAR_URL = 'https://luma.com/omarchy'

function MeetupCard({
  meetup,
  active,
  onActive,
}: {
  meetup: Meetup
  active: boolean
  onActive: (id: string | null) => void
}) {
  const where = meetup.where
  return (
    <li
      id={`meetup-${meetup.id}`}
      onMouseEnter={() => onActive(meetup.id)}
      onMouseLeave={() => onActive(null)}
    >
      <a
        href={meetup.url}
        className={cn(
          'group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
          active && '[&_h3]:text-brand',
        )}
      >
        {meetup.cover ? (
          <img
            src={meetup.cover}
            alt={meetup.title}
            width={meetup.coverWidth}
            height={meetup.coverHeight}
            loading="lazy"
            decoding="async"
            className={cn(
              'aspect-square w-full object-cover transition-[outline-color] duration-150 ease-out',
              active && 'outline-2 outline-offset-2 outline-brand',
            )}
          />
        ) : (
          <div className="aspect-square w-full">
            <MeetupCover />
          </div>
        )}
        <p className="mt-3 font-mono text-xs text-text-muted">
          <time dateTime={meetup.start}>{meetup.when}</time>
        </p>
        <h3 className="mt-1 line-clamp-2 text-lg font-medium text-text group-hover:text-brand">
          {meetup.title}
        </h3>
        {where ? (
          <p className="mt-1 truncate font-mono text-xs text-text-muted">
            {where}
          </p>
        ) : null}
      </a>
    </li>
  )
}

export function MeetupsPage({
  rules,
  data: meetups,
}: {
  rules: string
  data: MeetupsData
}) {
  const { events, countries: countryNames } = meetups
  const countryOf = (code: string) => countryNames[code] || code
  // The first render matches the built page, then the visitor's own clock
  // decides what has passed, the same way the home page's strip does.
  const [now, setNow] = useState(() =>
    Date.parse(`${meetups.refreshed}T00:00:00Z`),
  )
  useEffect(() => setNow(Date.now()), [])
  const allUpcoming = events
    .filter((event) => Date.parse(event.start) >= now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
  const past = events
    .filter((event) => Date.parse(event.start) < now)
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start))

  // A region, then a country in it, narrow what is shown: the cards, and
  // which dots on the map are lit. Meetups whose place the calendar keeps
  // for its guests have no country, so they show under every region.
  const [region, setRegion] = useState<Region | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const regions = REGIONS.filter((r) =>
    allUpcoming.some((e) => regionOf(e.country) === r),
  )
  const countries = region
    ? [
        ...new Set(
          allUpcoming
            .filter((e) => regionOf(e.country) === region)
            .flatMap((e) => (e.country ? [e.country] : [])),
        ),
      ].sort((a, b) => countryOf(a).localeCompare(countryOf(b)))
    : []
  const matches = (event: Meetup) =>
    (!region || !event.country || regionOf(event.country) === region) &&
    (!country || event.country === country)
  const upcoming = allUpcoming.filter(matches)
  const pins = [...allUpcoming, ...past].map((event) => ({
    id: event.id,
    title: event.title,
    url: event.url,
    when: event.when,
    where: event.where,
    cover: event.cover,
    shown: matches(event),
    past: Date.parse(event.start) < now,
    approximate: Boolean(event.geo?.approximate),
  }))
  const focused = allUpcoming.filter(matches)
  const box =
    region || country
      ? boxAround(
          focused.flatMap((e) => (PIN_AT.get(e.id) ? [PIN_AT.get(e.id)!] : [])),
        )
      : WHOLE_MAP
  const pickRegion = (next: Region | null) => {
    setRegion(next)
    setCountry(null)
  }

  const [active, setActive] = useState<string | null>(null)

  const months: { name: string; id: string; meetups: Meetup[] }[] = []
  for (const meetup of upcoming) {
    const name = meetup.month
    const last = months.at(-1)
    if (last && last.name === name) last.meetups.push(meetup)
    else
      months.push({
        name,
        id: name.toLowerCase().replace(/\s+/g, '-'),
        meetups: [meetup],
      })
  }

  const calendar = (
    <a
      href={CALENDAR_URL}
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 py-2 text-sm font-medium whitespace-nowrap text-text underline decoration-current underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_svg]:size-5 [&_svg]:shrink-0"
    >
      {t('The calendar on Luma')}
      <ArrowRightIcon aria-hidden="true" />
    </a>
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeading title={t('Meetups')}>
        <div className="mx-auto mt-3 max-w-2xl text-center">
          <p className="text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
            {t(
              'Omarchy meetups are popping up around the world. Find one near you, or start one. They all live on the Omarchy calendar on Luma.',
            )}
          </p>
          <div className="mt-3 hidden sm:block">{calendar}</div>
        </div>
      </PageHeading>

      <nav aria-label={t('Filter the meetups by region')}>
        <ul className="flex flex-wrap gap-2">
          {[null, ...regions].map((r) => {
            const on = region === r
            const count = r
              ? allUpcoming.filter((e) => regionOf(e.country) === r).length
              : allUpcoming.length
            return (
              <li key={r ?? 'all'}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickRegion(r)}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 border px-3 text-sm transition-colors sm:min-h-9 duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    on
                      ? 'border-brand bg-brand text-brand-ink'
                      : 'border-border-strong bg-surface text-text hover:bg-surface-2',
                  )}
                >
                  {t(r ?? 'Everywhere')}
                  <span
                    className={cn(
                      'font-mono text-xs',
                      on ? 'text-brand-ink/70' : 'text-text-muted',
                    )}
                  >
                    {count}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {/* The countries of the chosen region. Where the map is shown the
            row keeps its height when there is nothing in it, so picking a
            region does not push the map down a line. The names are plain
            text, so their touch targets are grown underneath them rather
            than by spacing the rows out. */}
        <ul className="mt-3 flex flex-wrap gap-x-4 sm:min-h-9">
          {countries.length > 1 ? (
            <>
              {countries.map((code) => {
                const on = country === code
                return (
                  <li key={code}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setCountry(on ? null : code)}
                      className={cn(
                        'relative min-h-9 text-sm underline-offset-4 transition-colors duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        on
                          ? 'text-brand underline decoration-current'
                          : 'text-text-secondary hover:text-text',
                      )}
                    >
                      {countryOf(code)}
                      <span className="ml-1.5 font-mono text-xs text-text-muted">
                        {allUpcoming.filter((e) => e.country === code).length}
                      </span>
                    </button>
                  </li>
                )
              })}
            </>
          ) : null}
        </ul>
      </nav>

      <MeetupMap
        pins={pins}
        box={box}
        lit={
          country
            ? new Set([country])
            : region
              ? COUNTRIES_OF(region)
              : new Set<string>()
        }
        chosen={country}
        pickable={
          new Set(allUpcoming.flatMap((e) => (e.country ? [e.country] : [])))
        }
        onPickCountry={(code) => {
          if (code) setRegion(regionOf(code))
          setCountry(code)
        }}
        active={active}
        onActive={setActive}
        className="mt-6 hidden sm:block"
      />

      {months.length === 0 ? (
        <p className="mt-10 text-[15px] text-text-secondary">
          {region || country
            ? t('Nothing coming up there yet. The next one may be yours.')
            : t(
                'Nothing on the calendar right now. The next one may be yours.',
              )}
        </p>
      ) : (
        months.map((month) => (
          <section
            key={month.id}
            aria-labelledby={`month-${month.id}`}
            className="mt-12 first-of-type:mt-10"
          >
            <div className="flex items-baseline gap-3">
              <h2
                id={`month-${month.id}`}
                className="font-sans text-lg font-medium text-text"
              >
                {month.name}
              </h2>
              <span className="font-mono text-xs text-text-muted">
                {month.meetups.length}
              </span>
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {month.meetups.map((meetup) => (
                <MeetupCard
                  key={meetup.id}
                  meetup={meetup}
                  active={active === meetup.id}
                  onActive={setActive}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      <SectionActions>{calendar}</SectionActions>

      {past.length > 0 ? (
        <section
          aria-labelledby="past-meetups"
          className="mt-14 border-t border-border-subtle pt-10"
        >
          <div className="flex items-baseline gap-3">
            <h2
              id="past-meetups"
              className="font-sans text-lg font-medium text-text"
            >
              {t('Already happened')}
            </h2>
            <span className="font-mono text-xs text-text-muted">
              {past.length}
            </span>
          </div>
          <ul className="mt-5 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {past.map((meetup) => {
              const where = meetup.where
              return (
                <li
                  key={meetup.id}
                  id={`meetup-${meetup.id}`}
                  onMouseEnter={() => setActive(meetup.id)}
                  onMouseLeave={() => setActive(null)}
                >
                  <a
                    href={meetup.url}
                    className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    <div
                      className={cn(
                        'aspect-square w-full overflow-hidden bg-bg-deep grayscale transition-[filter,opacity] duration-200 ease-out group-hover:opacity-100 group-hover:grayscale-0',
                        active === meetup.id
                          ? 'opacity-100 grayscale-0'
                          : 'opacity-70',
                      )}
                    >
                      {meetup.cover ? (
                        <img
                          src={meetup.cover}
                          alt={meetup.title}
                          width={meetup.coverWidth}
                          height={meetup.coverHeight}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover"
                        />
                      ) : (
                        <MeetupCover />
                      )}
                    </div>
                    <p className="mt-2 font-mono text-xs text-text-muted">
                      <time dateTime={meetup.start}>{meetup.shortDate}</time>
                      {where ? ` · ${where}` : ''}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-text-secondary transition-colors duration-150 ease-out group-hover:text-text">
                      {meetup.title}
                    </p>
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {rules ? (
        <section
          id="run-your-own"
          className="mt-14 max-w-3xl scroll-mt-[calc(var(--nav-h)+2rem)] border-t border-border-subtle pt-10"
        >
          <div
            className="prose ported"
            dangerouslySetInnerHTML={{ __html: rules }}
          />
        </section>
      ) : null}
    </main>
  )
}
