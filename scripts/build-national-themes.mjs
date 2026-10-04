// Writes src/national-themes.css from the flags in src/lib/national-themes.ts.
// With --check it only reports whether the file is current.

import { readFileSync, writeFileSync } from 'node:fs'
import { NATIONAL_THEMES } from '../src/lib/national-themes.ts'
import { problemsWith, themeCss } from './lib/national-palette.mjs'

const target = new URL('../src/national-themes.css', import.meta.url)

const problems = NATIONAL_THEMES.flatMap((theme) =>
  problemsWith(theme).map((problem) => `${theme.id}: ${problem}`),
)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

const css = themeCss(NATIONAL_THEMES)
if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(target, 'utf8')
  } catch {
    /* missing counts as stale */
  }
  if (current !== css) {
    console.error(
      'src/national-themes.css is out of date: run node scripts/build-national-themes.mjs',
    )
    process.exit(1)
  }
} else {
  writeFileSync(target, css)
  console.log(`Wrote ${NATIONAL_THEMES.length} national themes`)
}
