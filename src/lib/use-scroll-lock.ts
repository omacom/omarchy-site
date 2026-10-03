import { useEffect } from 'react'

/**
 * Locks the page scroll while `open` is true. The viewport keeps the current
 * scroll position through the toggle, so nothing needs to be saved or restored.
 */
export function useScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return
    const body = document.body
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = previousOverflow
    }
  }, [open])
}
