import { Children, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function CardRail({
  children,
  className,
}: {
  /** The grid the rail becomes, e.g. `sm:grid-cols-2 lg:grid-cols-3`. */
  className?: string
  children: ReactNode
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)

  const syncThumb = useCallback(() => {
    const el = scroller.current
    const bar = thumb.current
    if (!el || !bar) return
    const reach = el.scrollWidth - el.clientWidth
    const ratio = Math.min(1, el.clientWidth / el.scrollWidth)
    const progress = reach > 0 ? el.scrollLeft / reach : 0
    bar.style.width = `${ratio * 100}%`
    // Of the thumb's own width, so the travel is expressed relative to it.
    bar.style.transform = `translateX(${(progress * (1 - ratio) * 100) / ratio}%)`
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    syncThumb()
    const sizes = new ResizeObserver(syncThumb)
    sizes.observe(el)
    el.addEventListener('scroll', syncThumb, { passive: true })
    return () => {
      sizes.disconnect()
      el.removeEventListener('scroll', syncThumb)
    }
  }, [syncThumb])

  return (
    <>
      <div
        ref={scroller}
        className={cn(
          'rail-bare rail-column -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto sm:mx-0 sm:grid sm:snap-none sm:overflow-visible sm:px-0',
          className,
        )}
      >
        {Children.map(children, (child) => (
          <div className="w-full shrink-0 snap-center sm:contents">{child}</div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="mt-5 h-2 bg-border-subtle/50 sm:hidden"
      >
        <div ref={thumb} className="h-full bg-brand" />
      </div>
    </>
  )
}
