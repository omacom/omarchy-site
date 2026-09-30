import { t } from '@/i18n/site'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { SectionActions, SectionHeading } from '@/components/SectionHeading'
import { MeetupCover } from '@/components/MeetupCover'
import { RailBar, useRail } from '@/components/Rail'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import type { MeetupsData } from '@/lib/meetup-data'
import { cn } from '@/lib/utils'

export function MeetupShowcase({
  data: meetups,
  action,
}: {
  data: MeetupsData
  action?: ReactNode
}) {
  // Keep the first render identical to the built page, then drop past events
  // using the visitor's current time when the page opens.
  const [now, setNow] = useState(() =>
    Date.parse(`${meetups.refreshed}T00:00:00Z`),
  )
  useEffect(() => setNow(Date.now()), [])
  const upcoming = meetups.events
    .filter((event) => Date.parse(event.start) >= now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .slice(0, 15)

  const rail = useRail<HTMLUListElement>({
    count: upcoming.length,
    align: 'start',
  })
  const turn = (dir: 1 | -1) => {
    const to = rail.nearest() + dir * rail.perView()
    rail.glideTo(Math.max(0, Math.min(upcoming.length - 1, to)))
  }

  const arrows = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label={t('Previous meetups')}
        disabled={rail.atStart}
        onClick={() => turn(-1)}
      >
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label={t('Next meetups')}
        disabled={rail.atEnd}
        onClick={() => turn(1)}
      >
        <ChevronRightIcon className="size-5" />
      </Button>
    </div>
  )

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          roomy
          anchor="meetups"
          title={t('Share the love of beautiful, fun & agentic Linux')}
          description={
            <>
              {t(
                'Get together with others who love computers as much as you do.',
              )}{' '}
              <span className="md:block">
                {t(
                  'Share plugins, present work, and help newcomers into the community.',
                )}
              </span>
            </>
          }
          action={
            <div className="flex flex-col items-end gap-3">
              {action}
              {arrows}
            </div>
          }
        />
      </div>

      <ul
        ref={rail.scroller}
        {...rail.scrollerProps}
        aria-label={t('Upcoming Omarchy meetups')}
        className="rail-bare rail-column mt-6 lg:mt-10 flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto select-none active:cursor-grabbing motion-reduce:scroll-auto"
      >
        {upcoming.map((event, i) => (
          <li
            key={event.id}
            data-slide={i}
            // Subtract gaps before dividing the content width into whole cards.
            className={cn(
              'w-[42.5%] shrink-0 snap-start transition-[opacity,filter] duration-300 ease-out sm:w-[calc((100%_-_3rem)/3)] lg:w-[calc((100%_-_4.5rem)/4)]',
              !rail.inColumn(i) && 'opacity-40 brightness-75',
            )}
          >
            <a
              href={event.url}
              draggable={false}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {event.cover ? (
                <img
                  src={event.cover}
                  alt={event.title}
                  width={event.coverWidth}
                  height={event.coverHeight}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="aspect-square w-full">
                  <MeetupCover />
                </div>
              )}
              <p className="mt-3 font-mono text-xs text-text-muted">
                <time dateTime={event.start}>{event.fullDate}</time>
                {event.city ? ` · ${event.city}` : ''}
              </p>
              <h3 className="mt-1 line-clamp-2 text-lg font-medium text-text group-hover:text-brand">
                {event.title}
              </h3>
            </a>
          </li>
        ))}
      </ul>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RailBar rail={rail} />
        <p className="mt-6 text-[15px] leading-relaxed text-text-secondary">
          {t("Don't see a meetup in your city?")}{' '}
          <a
            href="/meetups/"
            className="whitespace-nowrap underline decoration-border-strong underline-offset-4 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {t('Start your own')}
          </a>
          .
        </p>
        <SectionActions>{action}</SectionActions>
      </div>
    </>
  )
}
