import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import locales from '../src/i18n/locales.json' with { type: 'json' }

const [code, ...flags] = process.argv.slice(2)
if (
  !Object.hasOwn(locales, code) ||
  code === 'en' ||
  flags.some((flag) => !['--domain', '--dry-run'].includes(flag))
) {
  console.error(
    'Usage: npm run deploy:locale -- <language> [--domain] [--dry-run]',
  )
  console.error(
    'Build first with npm run build:locale -- <language>. English keeps its existing deployment.',
  )
  process.exit(1)
}
if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error(
    'Set CLOUDFLARE_ACCOUNT_ID to the account that will host the translation.',
  )
  process.exit(1)
}
const assets = path.resolve(`dist/${code}`)
const domain = new URL(locales[code].domain).hostname
if ((await readFile(path.join(assets, 'CNAME'), 'utf8')).trim() !== domain) {
  throw new Error(
    `Build domain does not match ${domain}; rebuild before deploying.`,
  )
}
const directory = await mkdtemp(path.join(tmpdir(), 'omarchy-deploy-'))
try {
  const config = path.join(directory, 'wrangler.json')
  await writeFile(
    config,
    JSON.stringify({
      name: `omarchy-${code.toLowerCase()}`,
      account_id: process.env.CLOUDFLARE_ACCOUNT_ID,
      compatibility_date: '2026-09-07',
      workers_dev: true,
      ...(flags.includes('--domain')
        ? {
            routes: [domain, ...(locales[code].aliases ?? [])].map(
              (hostname) => ({
                pattern: hostname,
                custom_domain: true,
              }),
            ),
          }
        : {}),
      assets: {
        directory: assets,
        html_handling: 'auto-trailing-slash',
        not_found_handling: '404-page',
      },
    }),
  )
  const args = ['wrangler', 'deploy', '--config', config]
  if (flags.includes('--dry-run')) args.push('--dry-run')
  const result = spawnSync('npx', args, { stdio: 'inherit' })
  process.exitCode = result.status ?? 1
} finally {
  await rm(directory, { recursive: true, force: true })
}
