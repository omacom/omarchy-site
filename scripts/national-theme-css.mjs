// A Vite plugin serving `virtual:national-theme.css`: the site's own
// national theme, as scripts/build-national-themes.mjs wrote it, or
// nothing on a site without one.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ID = 'virtual:national-theme.css'

export function nationalThemeCss(id) {
  return {
    name: 'national-theme-css',
    resolveId: (source) => (source === ID ? `\0${ID}` : undefined),
    load(source) {
      if (source !== `\0${ID}`) return
      if (!id) return ''
      const file = fileURLToPath(
        new URL(`../src/national-themes/${id}.css`, import.meta.url),
      )
      this.addWatchFile(file)
      return readFileSync(file, 'utf8')
    },
  }
}
