import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, MouseEvent } from 'react'

const GLIDE_MS = 420
const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3)
/** How far a flick's speed is projected past where the finger let go. */
const FLICK_MS = 150
/** A gesture turns the page once it has covered this much of a slide. */
const TURN_AT = 0.2
/** A pause before release means the drag was a placement, not a flick. */
const STALE_MS = 90
/** Movement under this is still a click, not a drag. */
const DRAG_SLOP = 6

/** Capture keeps a drag alive past the element's edges. It is a nicety, and
 *  a browser that refuses it must not take the whole gesture down with it. */
const capture = (el: Element, pointerId: number) => {
  try {
    el.setPointerCapture(pointerId)
  } catch {
    /* the drag still tracks through events on the element itself */
  }
}

export type RailAlign = 'center' | 'start'

export function useRail<T extends HTMLElement = HTMLDivElement>({
  count,
  align = 'center',
}: {
  /** How many slides the rail holds; slides are re-observed when it changes. */
  count: number
  align?: RailAlign
}) {
  const scroller = useRef<T>(null)
  const track = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: false })
  // Which slides sit wholly inside the content column, as opposed to
  // peeking in from the bleed. Null until measured, so the server's page
  // and the first paint dim nothing rather than everything.
  const [inColumn, setInColumn] = useState<Set<number> | null>(null)
  const glide = useRef(0)
  const drag = useRef({
    active: false,
    id: -1,
    startX: 0,
    startLeft: 0,
    moved: 0,
    startIndex: 0,
    lastX: 0,
    lastT: 0,
    speed: 0,
  })
  const thumbDrag = useRef({
    active: false,
    id: -1,
    startX: 0,
    startLeft: 0,
    room: 0,
    reach: 0,
  })

  /** The scroll position that shows slide `i` where the rail aligns it. */
  const targetFor = useCallback(
    (el: HTMLElement, slide: HTMLElement) => {
      const first = el.children[0] as HTMLElement | undefined
      const raw =
        align === 'center'
          ? slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2
          : slide.offsetLeft - (first?.offsetLeft ?? 0)
      return Math.max(0, Math.min(el.scrollWidth - el.clientWidth, raw))
    },
    [align],
  )

  const nearest = useCallback(() => {
    const el = scroller.current
    if (!el) return 0
    const first = el.children[0] as HTMLElement | undefined
    const at =
      align === 'center' ? el.scrollLeft + el.clientWidth / 2 : el.scrollLeft
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement
      const pos =
        align === 'center'
          ? child.offsetLeft + child.clientWidth / 2
          : child.offsetLeft - (first?.offsetLeft ?? 0)
      const dist = Math.abs(pos - at)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    }
    return best
  }, [align])

  /** How many slides fit in view at once, never fewer than one. */
  const perView = useCallback(() => {
    const el = scroller.current
    const first = el?.children[0] as HTMLElement | undefined
    const second = el?.children[1] as HTMLElement | undefined
    if (!el || !first) return 1
    const step = second
      ? second.offsetLeft - first.offsetLeft
      : first.clientWidth
    const gap = Math.max(0, step - first.clientWidth)
    const room = el.clientWidth - first.offsetLeft * 2 + gap
    // A hair of tolerance, so four cards sized to fill the column exactly
    // never round down to three.
    return Math.max(1, Math.floor(room / Math.max(1, step) + 0.05))
  }, [])

  const stopGlide = () => {
    if (glide.current) cancelAnimationFrame(glide.current)
    glide.current = 0
  }

  /**
   * The slides that sit wholly inside the content column once the rail is
   * scrolled to `scrollLeft`. The column runs from the rail's padding to
   * the same distance short of its far edge.
   */
  const columnAt = (el: HTMLElement, scrollLeft: number) => {
    const first = el.children[0] as HTMLElement | undefined
    const pad = first?.offsetLeft ?? 0
    const left = scrollLeft + pad - 1
    const right = scrollLeft + el.clientWidth - pad + 1
    const inside = new Set<number>()
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement
      if (
        child.offsetLeft >= left &&
        child.offsetLeft + child.clientWidth <= right
      )
        inside.add(i)
    }
    return inside
  }

  const showColumn = (next: Set<number>) =>
    setInColumn((was) =>
      was && was.size === next.size && [...next].every((i) => was.has(i))
        ? was
        : next,
    )

  /**
   * Sizes and places the thumb, and notes whether the rail is at either
   * end. The rail is full-bleed, so its own scrollbar would stretch the
   * whole window; the one drawn in the content column mirrors the rail's
   * proportions instead.
   */
  const syncThumb = useCallback(() => {
    const el = scroller.current
    const bar = thumb.current
    if (!el || !bar) return
    const reach = el.scrollWidth - el.clientWidth
    const ratio = Math.min(1, el.clientWidth / el.scrollWidth)
    const progress = reach > 0 ? el.scrollLeft / reach : 0
    bar.style.width = `${ratio * 100}%`
    // Percentages here are of the thumb's own width, so the travel is
    // expressed relative to it rather than to the track.
    bar.style.transform = `translateX(${(progress * (1 - ratio) * 100) / ratio}%)`
    const start = el.scrollLeft <= 1
    const end = el.scrollLeft >= reach - 1
    setEdges((was) =>
      was.start === start && was.end === end ? was : { start, end },
    )
    if (!glide.current) showColumn(columnAt(el, el.scrollLeft))
  }, [])

  /**
   * Animates the strip to a slide and owns the motion for its whole
   * duration. Scroll-snap is suspended until the last frame: mandatory
   * snap resolves the instant it is re-applied, so restoring it while a
   * scroll is still running makes one gesture land twice, which is what
   * made dragging feel like the rail was throwing itself around.
   */
  const glideTo = useCallback(
    (i: number) => {
      const el = scroller.current
      const slide = el?.children[i] as HTMLElement | undefined
      if (!el || !slide) return
      stopGlide()
      setIndex(i)
      const from = el.scrollLeft
      const to = targetFor(el, slide)
      showColumn(columnAt(el, to))
      const still = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      if (still || Math.abs(to - from) < 1) {
        el.scrollLeft = to
        el.style.scrollSnapType = ''
        return
      }
      el.style.scrollSnapType = 'none'
      // Start the clock on the first frame: its timestamp can precede the click handler.
      let start: number | null = null
      const frame = (now: number) => {
        if (start === null) start = now
        const t = Math.min(1, Math.max(0, (now - start) / GLIDE_MS))
        el.scrollLeft = from + (to - from) * EASE_OUT(t)
        if (t < 1) {
          glide.current = requestAnimationFrame(frame)
          return
        }
        glide.current = 0
        el.style.scrollSnapType = ''
      }
      glide.current = requestAnimationFrame(frame)
    },
    [targetFor],
  )

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const el = scroller.current
    if (!el) return
    stopGlide()
    drag.current = {
      active: true,
      id: e.pointerId,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      moved: 0,
      startIndex: nearest(),
      lastX: e.clientX,
      lastT: performance.now(),
      speed: 0,
    }
    // Snap fights direct scrollLeft writes; suspend it for the drag.
    el.style.scrollSnapType = 'none'
    // Delay pointer capture until dragging so button clicks keep their original target.
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d.active || e.pointerId !== d.id) return
    const el = scroller.current
    if (!el) return
    const now = performance.now()
    const elapsed = now - d.lastT
    if (elapsed > 0) {
      const sample = (e.clientX - d.lastX) / elapsed
      d.speed = d.speed * 0.6 + sample * 0.4
    }
    d.lastX = e.clientX
    d.lastT = now
    const dx = e.clientX - d.startX
    const wasClick = d.moved <= DRAG_SLOP
    d.moved = Math.max(d.moved, Math.abs(dx))
    if (wasClick && d.moved > DRAG_SLOP) capture(el, d.id)
    el.scrollLeft = d.startLeft - dx
  }

  const endDrag = () => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    const el = scroller.current
    if (!el) return
    const first = el.children[0] as HTMLElement | undefined
    const second = el.children[1] as HTMLElement | undefined
    const step =
      first && second
        ? second.offsetLeft - first.offsetLeft
        : el.clientWidth || 1
    const coasting = performance.now() - d.lastT < STALE_MS
    const travelled =
      el.scrollLeft - d.startLeft + (coasting ? -d.speed * FLICK_MS : 0)
    const pages = travelled / step
    const turned =
      Math.abs(pages) < TURN_AT
        ? 0
        : Math.sign(pages) * Math.max(1, Math.round(Math.abs(pages)))
    glideTo(Math.max(0, Math.min(count - 1, d.startIndex + turned)))
  }

  const onClickCapture = (e: MouseEvent) => {
    // A drag is not a click: swallow it so nothing plays or jumps.
    if (drag.current.moved > DRAG_SLOP) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = 0
    }
  }

  const onThumbDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return
    const el = scroller.current
    const rail = track.current
    const bar = thumb.current
    if (!el || !rail || !bar) return
    e.preventDefault()
    stopGlide()
    el.style.scrollSnapType = 'none'
    const room = rail.clientWidth - bar.clientWidth
    const reach = el.scrollWidth - el.clientWidth
    thumbDrag.current = {
      active: true,
      id: e.pointerId,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      room,
      reach,
    }
    capture(bar, e.pointerId)
  }

  const onThumbMove = (e: ReactPointerEvent) => {
    const d = thumbDrag.current
    const el = scroller.current
    if (!d.active || e.pointerId !== d.id || !el || d.room <= 0) return
    el.scrollLeft = d.startLeft + ((e.clientX - d.startX) * d.reach) / d.room
  }

  const onThumbUp = () => {
    if (!thumbDrag.current.active) return
    thumbDrag.current.active = false
    glideTo(nearest())
  }

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    syncThumb()
    // Browsers restore a scroller's position across a reload, so the rail
    // can come back on a different slide than the one this starts on.
    setIndex(nearest())
    const sizes = new ResizeObserver(syncThumb)
    sizes.observe(el)
    // The thumb tracks the scroll itself, on a native listener: scroll does
    // not bubble, React re-dispatches it from the root, and a rail that a
    // finger throws is exactly where that is least worth relying on. Which
    // slide is current is settled separately, by the observer below.
    el.addEventListener('scroll', syncThumb, { passive: true })

    // Which slide is current is read from how much of it the rail can see,
    // not from the scroll position. A touch swipe hands its scrolling to the
    // browser - momentum, then snap - and the events that come back from
    // that are not something to rebuild a position from; this is told
    // directly, by the same machinery that drives the scrolling. Centred,
    // the current slide is the one most in view; lined up at the start, it
    // is the first one wholly in view.
    const seen = new Map<number, number>()
    const slides = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const at = (entry.target as HTMLElement).dataset.slide
          if (at !== undefined) seen.set(Number(at), entry.intersectionRatio)
        }
        if (glide.current) return
        let best = 0
        let most = -1
        let firstWhole = Infinity
        seen.forEach((ratio, at) => {
          if (ratio > most) {
            most = ratio
            best = at
          }
          if (ratio >= 0.98 && at < firstWhole) firstWhole = at
        })
        setIndex(align === 'start' && firstWhole < Infinity ? firstWhole : best)
      },
      { root: el, threshold: [0, 0.25, 0.5, 0.75, 0.98, 1] },
    )
    for (const slide of el.children) slides.observe(slide)

    return () => {
      sizes.disconnect()
      slides.disconnect()
      el.removeEventListener('scroll', syncThumb)
      stopGlide()
    }
  }, [syncThumb, nearest, align, count])

  return {
    scroller,
    track,
    thumb,
    index,
    atStart: edges.start,
    atEnd: edges.end,
    /** Whether slide `i` sits wholly inside the content column. True for
     *  every slide until the rail has been measured. */
    inColumn: (i: number) => inColumn === null || inColumn.has(i),
    nearest,
    perView,
    glideTo,
    /** Spread onto the scrolling element. */
    scrollerProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
    /** Spread onto the thumb of the bar. */
    thumbProps: {
      onPointerDown: onThumbDown,
      onPointerMove: onThumbMove,
      onPointerUp: onThumbUp,
      onPointerCancel: onThumbUp,
    },
  }
}

export function RailBar({
  rail,
  className,
}: {
  rail: Pick<ReturnType<typeof useRail>, 'track' | 'thumb' | 'thumbProps'>
  className?: string
}) {
  return (
    <div
      ref={rail.track}
      aria-hidden="true"
      className={className ?? 'mt-5 h-2 bg-border-subtle/50'}
    >
      <div
        ref={rail.thumb}
        {...rail.thumbProps}
        className="h-full cursor-grab bg-brand transition-colors duration-150 ease-out hover:bg-(--t-field-hover) active:cursor-grabbing active:bg-(--t-field-crest)"
      />
    </div>
  )
}
