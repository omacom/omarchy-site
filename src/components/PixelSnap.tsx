import { useEffect, useLayoutEffect, useRef } from 'react'
import {
  GRID_CLEAR_EVENT,
  GRID_EVENT,
  clearGridSnap,
  snapToGrid,
} from '@/lib/pixel-grid'
import type { PixelGrid } from '@/lib/pixel-grid'

/** Snap hero controls to the pixel grid only before paint to avoid visible layout shifts. */
export function PixelSnap() {
  /** Ignore later grid events unless the initial pre-paint pass snapped. */
  const armed = useRef(false)

  useLayoutEffect(() => {
    // Lives in the document shell, outside every route error boundary.
    // A throw here takes the page with it, so the snap is allowed to no-op.
    try {
      const fonts = document.fonts
      const ready =
        !fonts?.check ||
        (fonts.check('16px "Geist Variable"') &&
          fonts.check('16px "JetBrains Mono Variable"'))
      if (!ready) return
      const slot = document.querySelector('[data-hero-wordmark]')
      if (!slot) return
      const r = slot.getBoundingClientRect()
      if (r.width < 1) return
      snapToGrid({ x: r.left, y: r.top, cw: r.width / 81, ch: r.height / 19 })
      armed.current = true
    } catch {
      /* no snap this load */
    }
  }, [])

  useEffect(() => {
    const onGrid = (event: Event) => {
      if (!armed.current) return
      snapToGrid((event as CustomEvent<PixelGrid>).detail)
    }
    const onClear = () => clearGridSnap()

    window.addEventListener(GRID_EVENT, onGrid)
    window.addEventListener(GRID_CLEAR_EVENT, onClear)
    return () => {
      window.removeEventListener(GRID_EVENT, onGrid)
      window.removeEventListener(GRID_CLEAR_EVENT, onClear)
      clearGridSnap()
    }
  }, [])

  return null
}
