import { spawnSync } from 'node:child_process'
import locales from '../src/i18n/locales.json' with { type: 'json' }

const language = process.argv[2]
if (!Object.hasOwn(locales, language)) {
  console.error(`Choose a language: ${Object.keys(locales).join(', ')}`)
  process.exit(1)
}
const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, PUBLIC_SITE_LOCALE: language },
})
process.exit(result.status ?? 1)
