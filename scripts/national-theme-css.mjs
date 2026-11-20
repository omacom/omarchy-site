// A Vite plugin that trims src/national-themes.css to one theme, so each
// site ships only the national theme it can wear: its own country's, or
// none on omarchy.org. Pass `all` to keep every theme, as a page that
// previews them all would want.

import path from 'node:path'

const FILE = path.resolve('src/national-themes.css')

/** The generated file's blocks, blank-line apart, kept for one theme id. */
export function onlyTheme(css, id) {
  return css
    .split('\n\n')
    .map((block) => block.trim())
    .filter((block) => block.includes(`[data-theme='${id}']`))
    .join('\n\n')
}

export function nationalThemeCss(id, { all = false } = {}) {
  return {
    name: 'national-theme-css',
    enforce: 'pre',
    transform(code, file) {
      if (all || file.split('?')[0] !== FILE) return
      return { code: id ? `${onlyTheme(code, id)}\n` : '', map: null }
    },
  }
}
