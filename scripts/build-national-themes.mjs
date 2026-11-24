// Writes src/national-themes/<id>.css, one per flag in
// src/lib/national-themes.ts. With --check it only reports whether the
// files are current.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { NATIONAL_THEMES } from '../src/lib/national-themes.ts'
import { problemsWith, themeCss } from './lib/national-palette.mjs'

const dir = new URL('../src/national-themes/', import.meta.url)

const problems = NATIONAL_THEMES.flatMap((theme) =>
  problemsWith(theme).map((problem) => `${theme.id}: ${problem}`),
)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

const files = new Map(
  NATIONAL_THEMES.map((theme) => [`${theme.id}.css`, themeCss(theme)]),
)
if (process.argv.includes('--check')) {
  const read = (name) => {
    try {
      return readFileSync(new URL(name, dir), 'utf8')
    } catch {
      return null
    }
  }
  let present = []
  try {
    present = readdirSync(dir)
  } catch {
    /* missing counts as stale */
  }
  const stale = [
    ...[...files].filter(([name, css]) => read(name) !== css).map(([n]) => n),
    ...present.filter((name) => !files.has(name)),
  ]
  if (stale.length) {
    console.error(
      `Out of date: ${stale.join(', ')}. Run node scripts/build-national-themes.mjs`,
    )
    process.exit(1)
  }
} else {
  mkdirSync(dir, { recursive: true })
  for (const [name, css] of files) writeFileSync(new URL(name, dir), css)
  console.log(`Wrote ${files.size} national themes`)
}
