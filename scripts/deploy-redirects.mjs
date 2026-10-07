/** Publish a 301 redirect Worker for each retired domain in src/i18n/redirects.json. */
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import redirects from '../src/i18n/redirects.json' with { type: 'json' }

const flags = process.argv.slice(2)
if (flags.some((flag) => flag !== '--dry-run')) {
  console.error('Usage: npm run deploy:redirects -- [--dry-run]')
  process.exit(1)
}
if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error(
    'Set CLOUDFLARE_ACCOUNT_ID to the account that hosts the redirects.',
  )
  process.exit(1)
}
const main = path.resolve('scripts/redirect-worker.js')
const directory = await mkdtemp(path.join(tmpdir(), 'omarchy-redirect-'))
try {
  for (const [name, { target, domains }] of Object.entries(redirects)) {
    const config = path.join(directory, `${name}.json`)
    await writeFile(
      config,
      JSON.stringify({
        name,
        main,
        account_id: process.env.CLOUDFLARE_ACCOUNT_ID,
        compatibility_date: '2026-09-07',
        workers_dev: false,
        vars: { TARGET: target },
        routes: domains.map((hostname) => ({
          pattern: hostname,
          custom_domain: true,
        })),
      }),
    )
    const args = ['wrangler', 'deploy', '--config', config]
    if (flags.includes('--dry-run')) args.push('--dry-run')
    const result = spawnSync('npx', args, { stdio: 'inherit' })
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1
      break
    }
  }
} finally {
  await rm(directory, { recursive: true, force: true })
}
