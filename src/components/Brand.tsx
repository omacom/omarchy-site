import { NOT_FOUND_HEIGHT, NOT_FOUND_WIDTH } from '@/data/not-found-bitmap'
import { cn } from '@/lib/utils'
import { WORD_BANDS } from '@/lib/word-shade'

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

const BAND_NAMES = ['crest', 'hover', 'lit', 'mid', 'dim'] as const

/** Band edges in percent of the height, for bands of so many rows each. */
function bandStops(rows: readonly number[]) {
  const total = rows.reduce((sum, n) => sum + n, 0)
  const pct = (n: number) => Math.round((n / total) * 100000) / 1000
  let at = 0
  return BAND_NAMES.map((name, i): [string, number, number] => {
    const from = at
    at += rows[i]
    return [`var(--t-field-${name})`, pct(from), pct(at)]
  })
}

/** The wordmark's bands, by its pixel rows. */
const BAND_STOPS = bandStops(WORD_BANDS)

/** The mark's own bands, by its 15 rows of blocks, so every colour change
 *  falls between two blocks rather than through one. */
const MARK_BANDS = [4, 2, 3, 2, 4] as const
const MARK_STOPS = bandStops(MARK_BANDS)

/** The drawn mark's strokes, in the order they draw. */
const MARK_STROKES = [
  'M640 1160H40V40H1160V1160H720',
  'M600 40V200',
  'M640 200H200V1000H1000V200H880',
  'M600 1160V1040',
  'M40 600H200',
]

/**
 * The mark drawn in strokes, in the stock bands, or where a theme gives
 * one (a national theme's flag, as `--t-mark`), in its own blocks: they
 * show through the same strokes, so the mark draws itself the same way.
 */
export function OmarchyMarkDrawn({ className }: { className?: string }) {
  const strokes = MARK_STROKES.map((d) => <path key={d} pathLength={1} d={d} />)
  return (
    <svg
      viewBox="0 0 1200 1200"
      fill="none"
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
          {MARK_STOPS.flatMap(([color, from, to]) => [
            <stop
              key={`${color}-from`}
              offset={`${from}%`}
              stopColor={color}
            />,
            <stop key={`${color}-to`} offset={`${to}%`} stopColor={color} />,
          ])}
        </linearGradient>
        <mask
          id="mark-strokes"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1200"
          height="1200"
        >
          <g stroke="#fff">{strokes}</g>
        </mask>
      </defs>
      <g className="mark-bands">{strokes}</g>
      <foreignObject
        x="0"
        y="0"
        width="1200"
        height="1200"
        mask="url(#mark-strokes)"
        className="mark-blocks"
      >
        <div />
      </foreignObject>
    </svg>
  )
}

/** The word's colours: a theme's own (a national theme wears its flag),
 *  else the brand bands. */
export const WORDMARK_BANDS = `var(--t-word, linear-gradient(to bottom, ${BAND_STOPS.map(
  ([color, from, to]) => `${color} ${from}% ${to}%`,
).join(', ')}))`

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
