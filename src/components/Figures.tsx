import { t } from '@/i18n/site'
import { number as formatNumber } from '@/i18n/format'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BankIcon, DownloadIcon, GithubIcon } from '@/components/icons'
import momentum from '@/data/momentum.json'

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
      {formatNumber(shown, digits)}
      {suffix}
    </>
  )
}

function Card({
  icon,
  children,
  innerRef,
}: {
  icon: ReactNode
  children: ReactNode
  innerRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={innerRef}
      className="ring-elevation flex flex-col bg-surface p-6"
    >
      <div className="hidden md:block">{icon}</div>
      {children}
    </div>
  )
}

const number =
  'flex items-center gap-3 font-sans text-3xl font-semibold tracking-tight text-text tabular-nums md:mt-4'
const label = 'mt-1 block text-sm text-text-secondary'
const more =
  'mt-auto self-start pt-4 text-[13px] font-medium text-brand underline decoration-transparent underline-offset-[3px] transition-colors duration-150 ease-out hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function Figures() {
  const { foundation, downloads, github } = momentum
  const funding = useInView()
  const isos = useInView()
  const repo = useInView()

  return (
    <div className="mt-6 lg:mt-10 grid gap-4 md:grid-cols-3">
      <Card
        icon={<BankIcon className="size-5 text-brand" />}
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
        <Link to="/$/" params={{ _splat: 'foundation' }} className={more}>
          {t('About the foundation')}
        </Link>
      </Card>

      <Card
        icon={<DownloadIcon className="size-5 text-brand" />}
        innerRef={isos.ref}
      >
        <span className={number}>
          <Count value={downloads.total} live={isos.inView} />
          <DownloadIcon className="size-5 shrink-0 text-brand md:hidden" />
        </span>
        <span className={label}>{t('ISO downloads in year one')}</span>
        <Link to={downloads.post} className={more}>
          {t('The numbers')}
        </Link>
      </Card>

      <Card
        icon={<GithubIcon className="size-5 text-brand" />}
        innerRef={repo.ref}
      >
        <span className={number}>
          <Count value={github.stars} live={repo.inView} />
          <GithubIcon className="size-5 shrink-0 text-brand md:hidden" />
        </span>
        <span className={label}>{t('stars on GitHub')}</span>
        <a href="https://github.com/omacom/omarchy" className={more}>
          {t('The repo')}
        </a>
      </Card>
    </div>
  )
}
