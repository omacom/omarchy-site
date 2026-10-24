import locales from '../i18n/locales.json' with { type: 'json' }
import { NATIONAL_THEMES } from './national-themes.ts'

export type SiteTheme = {
  id: string
  name: string
  /** A light page: the theme's background is the lighter of its two inks. */
  light?: true
}

/** The themes Omarchy itself ships, in the order the picker walks them. */
export const STOCK_THEMES: SiteTheme[] = [
  { id: 'catppuccin', name: 'Catppuccin' },
  { id: 'catppuccin-latte', name: 'Catppuccin Latte', light: true },
  { id: 'ethereal', name: 'Ethereal' },
  { id: 'everforest', name: 'Everforest' },
  { id: 'flexoki-light', name: 'Flexoki Light', light: true },
  { id: 'gruvbox', name: 'Gruvbox' },
  { id: 'hackerman', name: 'Hackerman' },
  { id: 'kanagawa', name: 'Kanagawa' },
  { id: 'last-horizon', name: 'Last Horizon' },
  { id: 'lumon', name: 'Lumon' },
  { id: 'lupine', name: 'Lupine', light: true },
  { id: 'matte-black', name: 'Matte Black' },
  { id: 'miasma', name: 'Miasma' },
  { id: 'nord', name: 'Nord' },
  { id: 'osaka-jade', name: 'Osaka Jade' },
  { id: 'retro-82', name: 'Retro 82' },
  { id: 'ristretto', name: 'Ristretto' },
  { id: 'rose-pine', name: 'Rosé Pine', light: true },
  { id: 'solitude', name: 'Solitude' },
  { id: 'tokyo-night', name: 'Tokyo Night' },
  { id: 'vantablack', name: 'Vantablack' },
  { id: 'white', name: 'White', light: true },
]

/** A country's theme, by its ISO code, in the shape the picker lists. */
const BY_COUNTRY = new Map<string, SiteTheme>(
  NATIONAL_THEMES.map((theme) => [
    theme.country,
    theme.ground === 'light'
      ? { id: theme.id, name: theme.name, light: true }
      : { id: theme.id, name: theme.name },
  ]),
)

/** Every theme any site offers: a stored one from any of them is valid. */
export const ALL_THEMES: SiteTheme[] = [...STOCK_THEMES, ...BY_COUNTRY.values()]

/** The country a language's site stands for: its flag, else its domain's
 *  suffix. The English site at omarchy.org stands for none. */
export function countryOf(language: string): string | null {
  const entry = (locales as Record<string, { domain: string; flag?: string }>)[
    language
  ]
  if (!entry) return null
  const country =
    entry.flag ?? new URL(entry.domain).hostname.split('.').at(-1)!
  return country.length === 2 ? country.toUpperCase() : null
}

/** The theme a language's site opens in, or null where it has none. */
export function nationalThemeOf(language: string): SiteTheme | null {
  const country = countryOf(language)
  return (country && BY_COUNTRY.get(country)) || null
}

/** The themes a language's site offers, its own country's first. */
export function themesFor(language: string): SiteTheme[] {
  const national = nationalThemeOf(language)
  return national ? [national, ...STOCK_THEMES] : STOCK_THEMES
}

// Read in the browser through Vite, and in build scripts and tests through
// Node, where import.meta.env does not exist.
const language =
  import.meta.env?.PUBLIC_SITE_LOCALE ||
  (typeof process !== 'undefined' ? process.env?.PUBLIC_SITE_LOCALE : '') ||
  'en'

/** This site's own country theme, if it has one. */
export const HOME_THEME = nationalThemeOf(language)
/** The themes this site's picker walks. */
export const SITE_THEMES = themesFor(language)
