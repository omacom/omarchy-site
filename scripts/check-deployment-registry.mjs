/** Every deployed country or language Worker must remain in automatic updates. */
import locales from '../src/i18n/locales.json' with { type: 'json' }

const account = process.env.CLOUDFLARE_ACCOUNT_ID
const token = process.env.CLOUDFLARE_API_TOKEN
if (!account || !token) {
  throw new Error(
    'Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to audit deployments.',
  )
}
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts`,
  { headers: { Authorization: `Bearer ${token}` } },
)
const body = await response.json()
if (!response.ok || !body.success) {
  throw new Error(
    `Cannot inventory deployed Workers: ${JSON.stringify(body.errors)}`,
  )
}
const registered = new Set(
  Object.keys(locales).map((code) =>
    code === 'en' ? 'omarchy' : `omarchy-${code.toLowerCase()}`,
  ),
)
const unmanaged = body.result
  .map((worker) => worker.id)
  .filter((name) => name.startsWith('omarchy-') && !registered.has(name))
if (unmanaged.length) {
  throw new Error(
    `Deployed editions missing from src/i18n/locales.json: ${unmanaged.join(', ')}. Restore them to automatic updates before publishing.`,
  )
}
console.log(
  `All ${body.result.filter((worker) => registered.has(worker.id)).length} deployed editions are registered for updates.`,
)
