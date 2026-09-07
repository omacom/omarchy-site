/**
 * Which theme the machine is wearing, as the browser reports it.
 *
 * omacom/omarchy-theme-sync is a Chromium extension that reads the Omarchy
 * theme a machine is actually running and publishes it to every page: the
 * palette as `--omarchy-*` custom properties on <html>, and the theme's own
 * name as `data-omarchy-theme`. It rewrites both when the desktop theme
 * changes.
 *
 * None of that palette is wanted here, and that is the whole point. This
 * site's themes are named after Omarchy's own and their values come from that
 * theme's colors.toml — so the ids in SITE_THEMES and the directory names
 * under `themes/` in omacom/omarchy are the same strings, and the name the
 * extension publishes is that directory name. Twenty-two for twenty-two, no
 * differences.
 *
 * So this is a name match onto a palette the site already ships, hand-authored
 * with every in-between step already chosen. Nothing is derived from a foreign
 * palette and there is no extra theme to maintain.
 *
 * Reading only. The extension does let one origin *set* the desktop's theme,
 * and this site is that origin, but a website is not a thing that should
 * change somebody's desktop, so nothing here asks it to.
 *
 * A leaf on purpose: no imports, so it can be read by a test.
 */

/** Where the extension puts the name: `<html data-omarchy-theme>`. */
export const DESKTOP_ATTR = 'omarchyTheme'
/** What it fires on `document` when the desktop's theme changes. */
export const DESKTOP_EVENT = 'omarchythemechange'

/**
 * The site theme matching a name the extension published, or null.
 *
 * Tolerant about spelling and nothing else. The name arrives as a directory
 * slug already, but a theme called "Rose Pine" should still find `rose-pine`.
 * An inexact match is not a match: somebody running a community theme called
 * "Gruvbox Dark" is not running `gruvbox`, and guessing would dress the site
 * in colours their desktop is not wearing.
 */
export function siteThemeFor(
  name: string | null | undefined,
  ids: readonly string[],
): string | null {
  const slug = String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
  return slug && ids.includes(slug) ? slug : null
}

/** The raw name on the document, if a browser is publishing one. */
export function desktopThemeName(): string | null {
  if (typeof document === 'undefined') return null
  return document.documentElement.dataset[DESKTOP_ATTR] ?? null
}

/**
 * Calls back whenever the desktop's theme changes, and once straight away.
 *
 * A subscription rather than a question: the extension gets the name from a
 * native host over a port, so on a cold worker it lands after the first paint.
 *
 * @returns a function that stops listening.
 */
export function onDesktopTheme(fn: () => void): () => void {
  if (typeof document === 'undefined') return () => {}
  document.addEventListener(DESKTOP_EVENT, fn)
  // Sometimes it is already there, a warm worker having beaten the paint.
  fn()
  return () => document.removeEventListener(DESKTOP_EVENT, fn)
}
