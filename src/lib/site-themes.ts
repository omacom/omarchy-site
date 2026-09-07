/* The palettes this site ships, and nothing else.
 *
 * Its own module so the list can be read without the machinery around it:
 * theme.ts reaches for a canvas to resolve colours and for the brand mark's
 * path to repaint the favicon, which makes it a module only a browser can
 * load. The list is data, and data should be reachable from a test.
 *
 * Every id is the name of a directory under `themes/` in `omacom/omarchy`,
 * and the values behind it are copied from that directory's colors.toml. That
 * is not incidental: it is what lets omarchy-theme-sync tell this site which
 * theme a machine is wearing by name alone, with no palette crossing over.
 * See src/lib/desktop-theme.ts.
 */

export type SiteTheme = {
  id: string
  name: string
  /** A light page: the theme's background is the lighter of its two inks. */
  light?: true
}

export const SITE_THEMES: SiteTheme[] = [
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

export const DEFAULT_THEME = 'tokyo-night'
