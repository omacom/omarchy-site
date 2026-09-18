import { inlineJson } from './inline-json.ts'
import { SITE_THEMES } from './site-themes.ts'

export const DEFAULT_THEME = 'tokyo-night'
export const THEME_KEY = 'omarchy-site-theme'

export function isTheme(id: unknown): id is string {
  return SITE_THEMES.some((theme) => theme.id === id)
}

/** An explicit valid destination replaces the palette carried by Astro. */
export function themeForNavigation(url: URL): string {
  const requested = url.searchParams.get('theme')
  return isTheme(requested) ? requested : readTheme()
}

/** Only an explicit choice persists a URL palette, including choosing it again. */
export function saveTheme(id: string) {
  const url = new URL(location.href)
  if (url.searchParams.has('theme')) {
    url.searchParams.delete('theme')
    history.replaceState(history.state, '', url)
  }
  try {
    localStorage.setItem(THEME_KEY, id)
  } catch {
    /* storage unavailable */
  }
}

/** Resolve URL → carried Astro palette → saved preference before first paint.
 * Fresh documents have no carried palette; retain the system-scheme fallback.
 * The favicon is owned outside React so replacing it cannot break reconciliation. */
export const themeInitScript = `(function(){try{var ok=${inlineJson(
  SITE_THEMES.map((t) => t.id),
)};var light=${inlineJson(
  SITE_THEMES.filter((t) => t.light).map((t) => t.id),
)};var dark=${inlineJson(
  SITE_THEMES.filter((t) => !t.light).map((t) => t.id),
)};var t=new URLSearchParams(location.search).get("theme");if(ok.indexOf(t)<0)t=document.documentElement.dataset.theme;if(ok.indexOf(t)<0)t=localStorage.getItem(${inlineJson(THEME_KEY)});if(ok.indexOf(t)<0){var pool=window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?light:dark;t=pool[Math.floor(Math.random()*pool.length)];localStorage.setItem(${inlineJson(THEME_KEY)},t)}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme=${inlineJson(DEFAULT_THEME)}}if(!document.querySelector('link[rel="icon"][data-theme-icon]')){var l=document.createElement('link');l.rel='icon';l.type='image/svg+xml';l.href='/brand/omarchy-logo.svg';l.setAttribute('data-theme-icon','');document.head.appendChild(l)}})()`

export function readTheme(): string {
  if (typeof document !== 'undefined') {
    const active = document.documentElement.dataset.theme
    if (isTheme(active)) return active
  }
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (isTheme(stored)) return stored
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_THEME
}
