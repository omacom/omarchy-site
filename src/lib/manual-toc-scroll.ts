const tocViewportSelector =
  '[data-manual-toc] [data-slot="scroll-area-viewport"]'

/**
 * Keep the reader's place in the manual's chapter list. Each chapter is a
 * new page the ClientRouter swaps in, which would bring the list back to the
 * top, so its offset is carried across the swap before the incoming page
 * paints. The current chapter is then nudged into view, for arrivals from
 * search, the prev/next links or another page.
 */
export function watchManualTocScroll() {
  let scrollTop: number | null = null

  // scrollIntoView would also scroll the window and every other scrollable
  // ancestor; this moves only the list. The link lands a row in from the
  // edge, clear of the scroll fade and with a neighbour showing; at either
  // end of the list the browser clamps the offset, which lifts the fade.
  const revealCurrent = (viewport: Element) => {
    const link = viewport.querySelector('[aria-current="page"]')
    if (!link) return
    const view = viewport.getBoundingClientRect()
    const rect = link.getBoundingClientRect()
    const margin = rect.height
    if (rect.top < view.top + margin)
      viewport.scrollTop -= view.top + margin - rect.top
    else if (rect.bottom > view.bottom - margin)
      viewport.scrollTop += rect.bottom - (view.bottom - margin)
  }

  const onBeforeSwap = () => {
    scrollTop = document.querySelector(tocViewportSelector)?.scrollTop ?? null
  }
  const onAfterSwap = () => {
    const viewport = document.querySelector(tocViewportSelector)
    if (viewport) {
      if (scrollTop !== null) viewport.scrollTop = scrollTop
      revealCurrent(viewport)
    }
    scrollTop = null
  }

  const initial = document.querySelector(tocViewportSelector)
  if (initial) revealCurrent(initial)
  document.addEventListener('astro:before-swap', onBeforeSwap)
  document.addEventListener('astro:after-swap', onAfterSwap)
  return () => {
    document.removeEventListener('astro:before-swap', onBeforeSwap)
    document.removeEventListener('astro:after-swap', onAfterSwap)
  }
}
