import { useNavigate } from '@tanstack/react-router'
import { claimNextHashScroll, scrollToAnchor } from './anchor-scroll'

/** Repeated same-page anchor clicks must scroll even when the URL is unchanged. */

/**
 * A click handler for a link to an anchor. On the page that holds it, it takes
 * over and scrolls; anywhere else it stands aside and lets the router
 * navigate, and the anchor is reached on arrival.
 */
export function useHashLink(hash: string) {
  const navigate = useNavigate()

  return (event: React.MouseEvent) => {
    // Anything but a plain left click is the reader asking for a new tab or a
    // saved link, and belongs to the browser.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    const target = document.getElementById(hash)
    if (!target) return

    event.preventDefault()
    // Honours the scroll-margin-top that holds the section clear of the bar.
    claimNextHashScroll()
    scrollToAnchor(target, true)
    // Replaced, not pushed: pressing the same button three times should not
    // put three entries in the reader's history.
    void navigate({ to: '/', hash, replace: true, resetScroll: false })
  }
}

/** Scroll to the homepage top even when already on that route. */
export function useTopLink() {
  const navigate = useNavigate()

  return (event: React.MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()

    if (window.location.pathname === '/') {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      })
      // Drops any #section from the address without a second scroll.
      void navigate({ to: '/', replace: true, resetScroll: false })
      return
    }
    void navigate({ to: '/' })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}
