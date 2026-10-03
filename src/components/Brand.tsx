import { NOT_FOUND_HEIGHT, NOT_FOUND_WIDTH } from '@/data/not-found-bitmap'
import { cn } from '@/lib/utils'

/** The square-spiral glyph from public/brand/omarchy-logo.svg, inlined. The
 *  favicon is drawn from this same path, so the two cannot drift apart. */
export const OMARCHY_MARK_PATH =
  'm1200 1200h-480v-80h400v-1040h-479.996v160h-400v720h720v-720h-80v-80h159.996v880h-400v160h-640v-1200h1200zm-1120-80h480v-80h-400l.004-400h-80.004zm0-560h80.004v-400h400v-80h-480.004z'

export function OmarchyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 1200"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d={OMARCHY_MARK_PATH}
      />
    </svg>
  )
}

/** Brand gradient bands as wordmark pixel rows, shared by wordmark and mark. */
const BRAND_BANDS: [color: string, rows: number][] = [
  ['var(--t-field-crest)', 5],
  ['var(--t-field-hover)', 2],
  ['var(--t-field-lit)', 4],
  ['var(--t-field-mid)', 3],
  ['var(--t-field-dim)', 5],
]
const BAND_ROWS = BRAND_BANDS.reduce((sum, [, rows]) => sum + rows, 0)

/** Band edges in percent of the height. */
export const BAND_STOPS = BRAND_BANDS.reduce<{
  stops: [string, number, number][]
  rows: number
}>(
  ({ stops, rows }, [color, band]) => {
    const pct = (n: number) => Math.round((n / BAND_ROWS) * 100000) / 1000
    return {
      stops: [...stops, [color, pct(rows), pct(rows + band)]],
      rows: rows + band,
    }
  },
  { stops: [], rows: 0 },
).stops

export function OmarchyMarkDrawn({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 1200"
      fill="none"
      stroke="url(#mark-bands)"
      strokeWidth="80"
      aria-hidden="true"
      className={cn('mark-draw', className)}
    >
      <defs>
        <linearGradient
          id="mark-bands"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2="1200"
        >
          {BAND_STOPS.flatMap(([color, from, to]) => [
            <stop
              key={`${color}-from`}
              offset={`${from}%`}
              stopColor={color}
            />,
            <stop key={`${color}-to`} offset={`${to}%`} stopColor={color} />,
          ])}
        </linearGradient>
      </defs>
      <path pathLength={1} d="M640 1160H40V40H1160V1160H720" />
      <path pathLength={1} d="M600 40V200" />
      <path pathLength={1} d="M640 200H200V1000H1000V200H880" />
      <path pathLength={1} d="M600 1160V1040" />
      <path pathLength={1} d="M40 600H200" />
    </svg>
  )
}

export const WORDMARK_BANDS = `linear-gradient(to bottom, ${BAND_STOPS.map(
  ([color, from, to]) => `${color} ${from}% ${to}%`,
).join(', ')})`

type WordmarkProps = {
  className?: string
  label?: string
  /** A CSS background-image to wear instead of the flat currentColor. */
  background?: string
  'data-hero-wordmark'?: boolean
}

/**
 * The pixel wordmark as a mask over currentColor. Masking the shipped SVG
 * keeps one source of truth for the 211 rects while letting the fill be a
 * theme token.
 */
export function OmarchyWordmark({
  className,
  label,
  background,
  ...rest
}: WordmarkProps) {
  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{
        aspectRatio: '4131 / 950',
        backgroundColor: 'currentColor',
        backgroundImage: background,
        maskImage: 'url(/brand/omarchy-wordmark.svg)',
        maskRepeat: 'no-repeat',
        maskSize: '100% 100%',
        WebkitMaskImage: 'url(/brand/omarchy-wordmark.svg)',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: '100% 100%',
      }}
      {...rest}
    />
  )
}

export function NotFoundWordmark({ className, label, ...rest }: WordmarkProps) {
  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{
        aspectRatio: `${NOT_FOUND_WIDTH * 51} / ${NOT_FOUND_HEIGHT * 50}`,
        backgroundColor: 'currentColor',
        maskImage: 'url(/brand/not-found-wordmark.svg)',
        maskRepeat: 'no-repeat',
        maskSize: '100% 100%',
        WebkitMaskImage: 'url(/brand/not-found-wordmark.svg)',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: '100% 100%',
      }}
      {...rest}
    />
  )
}
