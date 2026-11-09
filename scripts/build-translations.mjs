import { spawnSync } from 'node:child_process'
import locales from '../src/i18n/locales.json' with { type: 'json' }

// Drafts build on their own with npm run build:locale; they are not deployed.
const published = Object.keys(locales).filter(
  (code) => code !== 'en' && !locales[code].draft,
)
for (const code of published) {
  const result = spawnSync(
    process.execPath,
    ['scripts/build-locale.mjs', code],
    { stdio: 'inherit' },
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const verification = spawnSync('python3', ['scripts/verify-locales.py'], {
  stdio: 'inherit',
})
process.exit(verification.status ?? 1)
