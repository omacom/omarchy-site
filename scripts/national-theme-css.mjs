// A Vite plugin serving `virtual:national-theme.css`: the CSS for the
// site's own national theme, or nothing on a site without one.

import { themeCss } from '../src/lib/national-themes.ts'

const ID = 'virtual:national-theme.css'

export function nationalThemeCss(theme) {
  return {
    name: 'national-theme-css',
    resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
    load: (id) =>
      id === `\0${ID}` ? (theme ? themeCss(theme) : '') : undefined,
  }
}
