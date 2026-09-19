import { t, locale } from '@/i18n/site'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BankIcon, DownloadIcon, GithubIcon } from '@/components/icons'
import momentum from '@/data/momentum.json'

const STEP_WIDTH = 22
const CHART_ROWS = 8
const EIGHTHS = ' ▁▂▃▄▅▆▇'

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale.formatLocale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

/** The Monday of the week a column stands for, `back` weeks before the day
 *  these figures were last checked. */
function weekOf(checked: string, back: number) {
  const d = new Date(`${checked}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - back * 7)
  // With the year: a year of weeks reaches back into the last one, and
  // "Sep 12" on its own reads as this month.
  return d.toLocaleDateString(locale.formatLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Weekly commits as rows of eighth-blocks, oldest week on the left. */
function commitRows(weeks: Array<number>) {
  const top = Math.max(1, ...weeks)
  return Array.from({ length: CHART_ROWS }, (_, row) =>
    weeks
      .map((v) => {
        const e =
          Math.round((v / top) * CHART_ROWS * 8) - (CHART_ROWS - 1 - row) * 8
        return e >= 8 ? '█' : EIGHTHS[Math.max(0, e)]
      })
      .join(''),
  ).join('\n')
}

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        setInView(true)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, inView }
}

/** Renders the final value until told to run, then counts up to it once. */
function Count({
  value,
  live,
  prefix = '',
  suffix = '',
}: {
  value: number
  live: boolean
  prefix?: string
  suffix?: string
}) {
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (!live) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t0 = performance.now()
    let frame = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1100)
      setShown(value * (1 - Math.pow(1 - p, 3)))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [live, value])
  const digits = Number.isInteger(value) ? 0 : 1
  return (
    <>
      {prefix}
      {shown.toLocaleString(locale.formatLocale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}
      {suffix}
    </>
  )
}

function Card({
  icon,
  children,
  live,
  innerRef,
}: {
  icon: ReactNode
  children: ReactNode
  live: boolean
  innerRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={innerRef}
      className={
        '@container ring-elevation flex flex-col bg-surface p-6' +
        (live ? ' figure-live' : '')
      }
    >
      <div className="hidden md:block">{icon}</div>
      {children}
    </div>
  )
}

const number =
  'flex items-center gap-3 font-sans text-3xl font-semibold tracking-tight text-text tabular-nums md:mt-4'
const label = 'mt-1 block text-sm text-text-secondary'
const meta = 'mt-3 font-mono text-xs text-text-muted'
const more =
  'mt-auto self-start pt-4 text-[13px] font-medium text-brand underline decoration-transparent underline-offset-[3px] transition-colors duration-150 ease-out hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** One tooltip follows the active column without remounting between weeks. */
function WeekHover({
  weeks,
  checked,
}: {
  weeks: Array<number>
  checked: string
}) {
  const [at, setAt] = useState<number | null>(null)
  const [width, setWidth] = useState(0)
  const [labelWidth, setLabelWidth] = useState(0)
  const row = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const el = row.current
    if (!el) return
    const sizes = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    sizes.observe(el)
    return () => sizes.disconnect()
  }, [])

  const count = at === null ? 0 : weeks[at]
  // The column's centre, held inside the chart: the first weeks and the last
  // would otherwise carry the label off the edge of the card.
  const centre = at === null ? 0 : (width / weeks.length) * (at + 0.5)
  const half = labelWidth / 2
  const x = Math.min(Math.max(centre, half), Math.max(half, width - half))

  return (
    <div
      ref={row}
      className="absolute inset-0"
      onPointerLeave={() => setAt(null)}
    >
      <div className="flex h-full">
        {weeks.map((_, i) => (
          <span
            key={i}
            onPointerEnter={() => setAt(i)}
            className="flex-1 transition-colors duration-100 ease-out hover:bg-text/10"
          />
        ))}
      </div>

      <AnimatePresence>
        {at !== null && width > 0 ? (
          <motion.div
            // Laid out from the chart's left edge and moved with a transform,
            // so the slide costs nothing but compositing.
            ref={(node) => {
              if (node) setLabelWidth(node.offsetWidth)
            }}
            className="ring-elevation pointer-events-none absolute bottom-full left-0 mb-2 w-max bg-surface px-3 py-2 font-mono"
            initial={{ opacity: 0, y: 4, x, translateX: '-50%' }}
            animate={{ opacity: 1, y: 0, x, translateX: '-50%' }}
            exit={{ opacity: 0, y: 4 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    x: { type: 'spring', duration: 0.35, bounce: 0 },
                    opacity: { duration: 0.12 },
                    y: { duration: 0.16 },
                  }
            }
          >
            <span className="block text-[13px] text-text">
              {count.toLocaleString(locale.formatLocale)} commit
              {count === 1 ? '' : 's'}
            </span>
            <span className="block text-[11px] text-text-muted">
              {t('week of')} {weekOf(checked, weeks.length - 1 - at)}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function Figures() {
  const { foundation, downloads, github } = momentum
  const funding = useInView()
  const isos = useInView()
  const repo = useInView()

  return (
    <div className="mt-6 lg:mt-10 grid gap-4 md:grid-cols-3">
      <Card
        icon={<BankIcon className="size-5 text-brand" />}
        live={funding.inView}
        innerRef={funding.ref}
      >
        <span className={number}>
          <Count
            value={foundation.total * 1_000_000}
            live={funding.inView}
            prefix="$"
          />
          <BankIcon className="size-5 shrink-0 text-brand md:hidden" />
        </span>
        <span className={label}>{t('pledged to the Omacom Foundation')}</span>
        <div className="figure-chart mt-4 font-mono text-[min(0.75rem,4.4cqw)] leading-relaxed whitespace-pre">
          {[...foundation.steps].reverse().map((step) => (
            <Link
              key={step.post}
              to={step.post}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="text-text-muted">
                {shortDate(step.date).padEnd(7)}
              </span>
              <span className="text-brand">
                {'█'.repeat(
                  Math.round((STEP_WIDTH * step.amount) / foundation.total),
                )}
              </span>
              <span className="text-text-muted transition-colors duration-150 ease-out group-hover:text-text">
                {'  $' + step.amount + 'M'}
              </span>
            </Link>
          ))}
        </div>
        <Link to="/$/" params={{ _splat: 'foundation' }} className={more}>
          {t('About the foundation')}
        </Link>
      </Card>

      <Card
        icon={<DownloadIcon className="size-5 text-brand" />}
        live={isos.inView}
        innerRef={isos.ref}
      >
        <span className={number}>
          <Count value={downloads.total} live={isos.inView} />
          <DownloadIcon className="size-5 shrink-0 text-brand md:hidden" />
        </span>
        <span className={label}>{t('ISO downloads in year one')}</span>
        <div className="flex flex-1 items-center pt-4">
          <table className="w-full font-mono text-xs leading-relaxed">
            <caption className="sr-only">{t('Recent ISO downloads')}</caption>
            <tbody className="divide-y-2 divide-border-strong">
              {downloads.periods.map((period) => (
                <tr key={period.label}>
                  <th
                    scope="row"
                    className="py-2 text-left font-normal text-text-muted"
                  >
                    {t(period.label)}
                  </th>
                  <td className="py-2 text-right text-text-secondary tabular-nums">
                    {period.count.toLocaleString(locale.formatLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link to={downloads.post} className={more}>
          {t('The numbers')}
        </Link>
      </Card>

      <Card
        icon={<GithubIcon className="size-5 text-brand" />}
        live={repo.inView}
        innerRef={repo.ref}
      >
        <span className={number}>
          <Count value={github.stars} live={repo.inView} />
          <GithubIcon className="size-5 shrink-0 text-brand md:hidden" />
        </span>
        <span className={label}>{t('stars on GitHub')}</span>
        {/* One column per week, the last 52, scaled to the busiest week.
            The chart is drawn as text, so the weeks are not elements to hover;
            a row of targets sits over it instead, one per column, each
            naming its week and its count. */}
        <div className="relative mt-4">
          <pre
            aria-hidden="true"
            className="figure-chart overflow-hidden font-mono text-[min(0.875rem,3.15cqw)] leading-[0.92] text-brand"
          >
            {commitRows(github.weeks)}
          </pre>
          <WeekHover weeks={github.weeks} checked={momentum.checked} />
        </div>
        <p className={`${meta} mt-[14px]`}>
          {github.pullRequests.toLocaleString(locale.formatLocale)}{' '}
          {t('pull requests ·')} {github.contributors} {t('contributors')}
        </p>
        <a href="https://github.com/omacom/omarchy" className={more}>
          {t('The repo')}
        </a>
      </Card>
    </div>
  )
}
