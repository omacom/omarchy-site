/**
 * Frosted split-wipe used when the site changes theme.
 *
 * A 10-degree parallelogram slit opens over 200ms through the View
 * Transitions API, shared by the site theme controls. The old page is
 * frosted as a whole in the snapshot the browser keeps of it (see
 * theme-transition.css), so the slit is what clears the frost, edge by
 * edge. Nothing is blurred on the live page first: the picker's own
 * backdrop blur is not carried into that snapshot by every browser, and
 * a live frost layer was not either, which left a sharp frame between
 * the two. Browsers without the API, and anyone who asked for less
 * motion, swap in one frame.
 */

export type ThemeTransitionDocument = {
  startViewTransition?: (update: () => void) => unknown
}

export function prefersReducedMotion(
  media: Pick<MediaQueryList, 'matches'> = matchReducedMotion(),
): boolean {
  return media.matches
}

export function shouldAnimateThemeTransition(
  doc: ThemeTransitionDocument,
  reducedMotion: boolean,
): boolean {
  return typeof doc.startViewTransition === 'function' && !reducedMotion
}

/** Set on the root for the length of a wipe that starts from the picker,
 *  so the page's snapshot is frosted only then (see theme-transition.css):
 *  under the picker the page already wears that blur, and the wipe keeps
 *  it until the slit clears it; from anywhere else the page is sharp and
 *  stays sharp. */
export const THEME_WIPE_FROSTED_CLASS = 'theme-wipe-frosted'

export function runThemeViewTransition(
  update: () => void,
  doc: ThemeTransitionDocument = globalDocument(),
  reducedMotion = prefersReducedMotion(),
  frosted = false,
): void {
  if (!shouldAnimateThemeTransition(doc, reducedMotion)) {
    update()
    return
  }

  const root = typeof document !== 'undefined' ? document.documentElement : null
  if (frosted) root?.classList.add(THEME_WIPE_FROSTED_CLASS)
  const done = () => root?.classList.remove(THEME_WIPE_FROSTED_CLASS)
  startWipe(update, doc, frosted ? done : undefined)
}

function startWipe(
  update: () => void,
  doc: ThemeTransitionDocument,
  done?: () => void,
): void {
  try {
    const transition = doc.startViewTransition?.(update) as
      { finished?: Promise<unknown> } | undefined
    if (done) {
      const finished = transition?.finished
      if (finished) void finished.then(done, done)
      else done()
    }
  } catch {
    update()
    done?.()
  }
}

function matchReducedMotion(): Pick<MediaQueryList, 'matches'> {
  if (typeof window === 'undefined') {
    return { matches: false }
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)')
}

function globalDocument(): ThemeTransitionDocument {
  if (typeof document === 'undefined') {
    return {}
  }

  return document
}
