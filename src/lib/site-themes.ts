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

/** This site's own country theme, if it has one. The build works it out
 *  from the site's language (src/lib/national-sites.ts) and hands it over
 *  as a constant, so the browser never loads the table of flags. */
declare const __HOME_THEME__: SiteTheme | null | undefined
export const HOME_THEME: SiteTheme | null =
  typeof __HOME_THEME__ === 'undefined' ? null : __HOME_THEME__
/** The themes this site's picker walks, its own country's first. */
export const SITE_THEMES: SiteTheme[] = HOME_THEME
  ? [HOME_THEME, ...STOCK_THEMES]
  : STOCK_THEMES
