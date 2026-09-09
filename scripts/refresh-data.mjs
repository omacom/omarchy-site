#!/usr/bin/env node
/**
 * Refreshes the data snapshots that come from outside this repository:
 *   src/data/plugins.json      the marketplace's built catalogue (full field set)
 *   public/data/explorer.json  the plugin similarity map for /plugins/explore
 *   src/data/version.json      the current release, from the OS repo's releases
 * Everything the site shows from its own files - the manual, the news, the
 * pages, the teams, the theme gallery - is read at build time by
 * scripts/port_content.py instead, so it is never behind a deploy.
 *
 * Run: node scripts/refresh-data.mjs   (npm run refresh-data)
 * CI runs it on a schedule and commits what changed.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import prettier from 'prettier'
import { assetId } from './lib/asset-id.mjs'
import { decodeCalendarText } from './lib/ical.mjs'
import { geocodeTitle } from './lib/geocode.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src/data')
const PUBLIC_DATA = path.join(ROOT, 'public/data')

const MP_RAW =
  'https://raw.githubusercontent.com/omacom/omarchy-plugin-marketplace/main/site'

const noEmDash = (s) => String(s ?? '').replace(/\s*—\s*/g, ' - ')

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.text()
}

const asset = (p) => (p ? `https://plugins.omarchy.org/${p}` : null)

// ---------------------------------------------------------------- plugins
const catalog = JSON.parse(await fetchText(`${MP_RAW}/catalog.json`))
const plugins = catalog.plugins
  .filter((p) => p.id && p.name)
  .map((p) => ({
    id: assetId(p.id),
    name: noEmDash(p.name),
    description: noEmDash((p.description ?? '').slice(0, 300)),
    author: p.author ?? null,
    category: p.category ?? 'Other',
    kind: p.kind ?? null,
    tags: p.tags ?? [],
    stars: Number(p.stars ?? 0),
    version: p.version ?? null,
    verified: p.verificationStatus === 'verified',
    verificationStatus: p.verificationStatus ?? null,
    verificationCoverage: p.verificationCoverage ?? null,
    verificationSnapshotStatus: p.verificationSnapshotStatus ?? null,
    sourceType: p.sourceType === 'builtin' ? 'builtin' : 'community',
    builtIn: Boolean(p.builtIn || p.sourceType === 'builtin'),
    placeholder: Boolean(p.placeholder),
    repo: p.repo ?? null,
    sourceUrl: p.sourceUrl ?? null,
    repositoryLayout: p.repositoryLayout ?? null,
    installAvailable: Boolean(p.installAvailable),
    installCommand: p.installCommand ?? '',
    installNote: noEmDash(p.installNote ?? ''),
    status: p.status ?? null,
    license: p.license ?? null,
    addedAt: p.addedAt ?? null,
    listedAt: p.listedAt ?? null,
    updatedAt: p.repositoryUpdatedAt ?? null,
    repositoryRelease: p.repositoryRelease ?? null,
    listingValidatedCommit: p.listingValidatedCommit ?? null,
    listingValidatedAt: p.listingValidatedAt ?? null,
    listingValidatedBranch: p.listingValidatedBranch ?? null,
    upstreamCheckStatus: p.upstreamCheckStatus ?? null,
    upstreamCheckedAt: p.upstreamCheckedAt ?? null,
    upstreamObservedCommit: p.upstreamObservedCommit ?? null,
    upstreamObservedBranch: p.upstreamObservedBranch ?? null,
    upstreamValidatedCommit: p.upstreamValidatedCommit ?? null,
    thumb: asset(p.previewThumbnail),
    thumbW: Number(p.previewThumbnailWidth ?? 0) || null,
    thumbH: Number(p.previewThumbnailHeight ?? 0) || null,
    image: asset(p.previewImage),
    accent: p.accent ?? null,
    initials: p.initials ?? null,
  }))
await writeFile(
  path.join(OUT, 'plugins.json'),
  JSON.stringify({ generatedAt: catalog.generatedAt, plugins }),
)
console.log(
  `plugins.json: ${plugins.length} plugins (${plugins.filter((p) => p.sourceType === 'builtin').length} built-in)`,
)

// ---------------------------------------------------------------- explorer
await mkdir(PUBLIC_DATA, { recursive: true })
const explorer = JSON.parse(await fetchText(`${MP_RAW}/explorer-data.json`))
for (const node of explorer.nodes ?? []) {
  node.description = noEmDash(node.description ?? '')
  node.previewThumbnail = node.previewThumbnail
    ? `https://plugins.omarchy.org/${node.previewThumbnail}`
    : null
}
await writeFile(
  path.join(PUBLIC_DATA, 'explorer.json'),
  JSON.stringify(explorer),
)
console.log(
  `explorer.json: ${explorer.nodes?.length ?? 0} nodes, ${explorer.edges?.length ?? 0} edges, ${explorer.clusters?.length ?? 0} clusters`,
)

// Release version and ISO URL from the latest GitHub release.
const release = JSON.parse(
  await fetchText(
    'https://api.github.com/repos/omacom/omarchy/releases/latest',
  ),
)
const version = String(release.tag_name ?? '').replace(/^v/, '')
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`unexpected release tag: ${release.tag_name}`)
}
const versionPath = path.join(OUT, 'version.json')
const currentRelease = JSON.parse(await readFile(versionPath, 'utf8'))
// An ISO can be published before GitHub marks its release as latest.
if (
  version.localeCompare(currentRelease.version, 'en', { numeric: true }) < 0
) {
  console.log(
    `version.json: keeping ${currentRelease.version} (GitHub latest is ${version})`,
  )
} else {
  await writeFile(
    versionPath,
    JSON.stringify(
      { version, isoUrl: `https://iso.omarchy.org/omarchy-${version}.iso` },
      null,
      1,
    ),
  )
  console.log(`version.json: ${version}`)
}

// Refresh GitHub figures; foundation and download announcements are maintained separately.
const MOMENTUM = path.join(OUT, 'momentum.json')
const momentum = JSON.parse(await readFile(MOMENTUM, 'utf8'))
const gh = (p, init) =>
  fetch(`https://api.github.com/repos/omacom/omarchy${p}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN
        ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  })
const repoRes = await gh('')
if (!repoRes.ok) throw new Error(`repo → ${repoRes.status}`)
const repo = await repoRes.json()
// One result per page makes the last page the total across all PR states.
const pullsRes = await gh('/pulls?state=all&per_page=1')
if (!pullsRes.ok) throw new Error(`pull requests → ${pullsRes.status}`)
const pullsLastPage = /page=(\d+)>; rel="last"/.exec(
  pullsRes.headers.get('link') ?? '',
)
const pullRequests = pullsLastPage
  ? Number(pullsLastPage[1])
  : (await pullsRes.json()).length
// Include contributors whose commit emails are not associated with GitHub accounts.
const contributorsRes = await gh('/contributors?per_page=1&anon=1')
const lastPage = /page=(\d+)>; rel="last"/.exec(
  contributorsRes.headers.get('link') ?? '',
)
let weeks = []
for (let attempt = 0; attempt < 5 && weeks.length === 0; attempt++) {
  const res = await gh('/stats/commit_activity')
  if (res.status === 200) weeks = (await res.json()).map((w) => w.total)
  else await new Promise((r) => setTimeout(r, 3000))
}
if (weeks.length === 52 && lastPage) {
  // Warn on decreases that may indicate partial API results, but allow legitimate corrections.
  const before = momentum.github
  const now = {
    stars: repo.stargazers_count,
    pullRequests,
    contributors: Number(lastPage[1]),
  }
  for (const [key, value] of Object.entries(now)) {
    if (value < before[key]) {
      console.warn(
        `momentum.json: ${key} fell from ${before[key]} to ${value} - check ` +
          'the API answer before this is deployed',
      )
    }
  }

  momentum.checked = new Date().toISOString().slice(0, 10)
  momentum.github = {
    stars: repo.stargazers_count,
    pullRequests,
    contributors: Number(lastPage[1]),
    commitsYear: weeks.reduce((a, b) => a + b, 0),
    weeks,
  }
  await writeFile(
    MOMENTUM,
    await prettier.format(JSON.stringify(momentum), { parser: 'json' }),
  )
  console.log(
    `momentum.json: ${momentum.github.stars} stars, ${momentum.github.commitsYear} commits`,
  )
} else {
  // GitHub returns 202 while computing weekly stats; retain the previous snapshot and warn.
  console.warn(
    'momentum.json: the commit stats never arrived, so the previous figures ' +
      `stand (checked ${momentum.checked})`,
  )
}

// -------------------------------------------------------------- downloads
// The ISO download figure, counted from Cloudflare, which serves
// iso.omarchy.org. The number the file starts from is the one quoted by
// hand from the news; from the day counting begins, each run adds the
// days since the last count, so the figure only ever moves forward and a
// missed run is caught up. A day's downloads are the bytes the ISO files
// sent that day divided by the ISO's size, so a browser's single request
// and a download manager's many pieces count the same, and a download
// given up half way counts as half. Countries are the ones that took at
// least a whole ISO in a day. Needs a Cloudflare API token that can only
// read the zone's analytics, and the zone's id, both from the
// repository's secrets; without them the figure stays as it is.
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CF_ZONE = process.env.CLOUDFLARE_ZONE_ID
/** How far back a catch-up may reach: the analytics keep about a month. */
const DOWNLOADS_CATCH_UP_DAYS = 28

const day = (d) => d.toISOString().slice(0, 10)
const daysAgo = (n) => new Date(Date.now() - n * 864e5)

/** Bytes the ISO files sent, per day and country, between two dates. */
async function isoTraffic(start, end) {
  const query = `query($zone: String!, $start: Date!, $end: Date!) {
    viewer { zones(filter: { zoneTag: $zone }) {
      httpRequestsAdaptiveGroups(limit: 10000, filter: {
        date_geq: $start, date_leq: $end, clientRequestPath_like: "%.iso"
      }) {
        sum { edgeResponseBytes }
        dimensions { date clientCountryName }
      }
    } }
  }`
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${CF_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { zone: CF_ZONE, start, end },
    }),
  })
  if (!res.ok) throw new Error(`cloudflare analytics → ${res.status}`)
  const body = await res.json()
  if (body.errors?.length) throw new Error(body.errors[0].message)
  return body.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? []
}

if (CF_TOKEN && CF_ZONE) {
  try {
    const counting = momentum.downloads.counting ?? {
      since: day(daysAgo(1)),
      through: day(daysAgo(2)),
      countries: [],
    }
    const yesterday = day(daysAgo(1))
    const from = new Date(`${counting.through}T00:00:00Z`)
    from.setUTCDate(from.getUTCDate() + 1)
    const start = day(
      from > daysAgo(DOWNLOADS_CATCH_UP_DAYS)
        ? from
        : daysAgo(DOWNLOADS_CATCH_UP_DAYS),
    )
    if (start <= yesterday) {
      const head = await fetch(
        `https://iso.omarchy.org/omarchy-${version}.iso`,
        { method: 'HEAD' },
      )
      const isoBytes = Number(head.headers.get('content-length'))
      if (!(isoBytes > 1e9)) throw new Error(`odd ISO size: ${isoBytes}`)
      const rows = await isoTraffic(start, yesterday)
      let bytes = 0
      const countries = new Set(counting.countries)
      const perCountryDay = new Map()
      for (const row of rows) {
        bytes += row.sum.edgeResponseBytes
        const key = `${row.dimensions.date} ${row.dimensions.clientCountryName}`
        perCountryDay.set(
          key,
          (perCountryDay.get(key) ?? 0) + row.sum.edgeResponseBytes,
        )
      }
      for (const [key, sent] of perCountryDay) {
        if (sent >= isoBytes) countries.add(key.split(' ')[1])
      }
      const added = Math.round(bytes / isoBytes)
      momentum.downloads.total += added
      momentum.downloads.countries = Math.max(
        momentum.downloads.countries,
        countries.size,
      )
      momentum.downloads.counting = {
        since: counting.since,
        through: yesterday,
        lastAdded: added,
        countries: [...countries].sort(),
      }
      momentum.checked = day(new Date())
      await writeFile(
        MOMENTUM,
        await prettier.format(JSON.stringify(momentum), { parser: 'json' }),
      )
      console.log(
        `momentum.json: ${added} ISO downloads ${start} to ${yesterday}, ${momentum.downloads.total} in all`,
      )
    } else {
      console.log(
        'momentum.json: ISO downloads already counted through yesterday',
      )
    }
  } catch (error) {
    console.warn(
      `momentum.json: ISO downloads left as they were, ${error.message}`,
    )
  }
} else {
  console.log(
    'momentum.json: ISO downloads left as they were, no Cloudflare token',
  )
}

// Use the Luma API when configured, otherwise the public feed without cover images.
const LUMA_CALENDAR = 'cal-SDGGMsEps9ExsrT'
const MEETUPS = path.join(OUT, 'meetups.json')
const COVERS = path.join(ROOT, 'public/images/meetups')
const MEETUPS_SINCE = new Date(Date.now() - 400 * 864e5)

/** A date in one of the feed's shapes, as an ISO string in UTC. */
function icsDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z?)$/.exec(
    value,
  )
  if (!m) return null
  const [, y, mo, d, h = '00', mi = '00', s = '00'] = m
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`).toISOString()
}

/** The calendar's public feed, as events in the site's shape. */
async function meetupsFromFeed() {
  const text = await fetchText(
    `https://api.lu.ma/ics/get?entity=calendar&id=${LUMA_CALENDAR}`,
  )
  // Long lines are folded onto the next with a leading space.
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const events = []
  let cur = null
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = {}
    else if (line === 'END:VEVENT') {
      if (cur) events.push(cur)
      cur = null
    } else if (cur) {
      const at = line.indexOf(':')
      if (at < 0) continue
      const [name] = line.slice(0, at).split(';')
      cur[name] = decodeCalendarText(line.slice(at + 1))
    }
  }
  return events.map((e) => {
    const id = (e.UID ?? '').replace(/@.*$/, '')
    const info = /https:\/\/luma\.com\/\S+/.exec(e.DESCRIPTION ?? '')?.[0]
    const hosted = /Hosted by (.+)$/m.exec(e.DESCRIPTION ?? '')?.[1]
    // A location that is a link is one the calendar keeps for guests, not
    // an online event; the feed does not say which events are online.
    const location = e.LOCATION ?? ''
    const address = location.startsWith('https://') ? null : location || null
    const [lat, lon] = (e.GEO ?? '').split(';').map(Number)
    return {
      id,
      title: noEmDash(e.SUMMARY ?? ''),
      url:
        info ??
        (location.startsWith('https://') ? location : `https://luma.com/${id}`),
      start: icsDate(e.DTSTART ?? ''),
      end: icsDate(e.DTEND ?? ''),
      timezone: null,
      address,
      city: null,
      country: address ? address.split(',').pop().trim() : null,
      online: null,
      geo: Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null,
      hosts: hosted ? hosted.split(/\s*[&,]\s*/).filter(Boolean) : [],
      cover: null,
    }
  })
}

/** Where an event is on the globe, from whichever of the API's fields
 *  carries it, or null. */
function coordsOf(ev, geo) {
  const lat = Number(ev.geo_latitude ?? geo.latitude ?? geo.lat)
  const lon = Number(ev.geo_longitude ?? geo.longitude ?? geo.lng ?? geo.lon)
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
}

/** The coordinates the calendar's public feed carries, by event, for the
 *  events the API answers without any: the map on the meetups page needs
 *  them, and the feed has them for every event with a public place. */
async function coordsFromFeed() {
  const byId = new Map()
  try {
    for (const event of await meetupsFromFeed()) {
      if (event.geo) byId.set(event.id, event.geo)
    }
  } catch {
    /* the feed is a bonus here; without it the pins are just fewer */
  }
  return byId
}

/** Luma's API, page by page, as events in the site's shape. */
async function meetupsFromApi(key) {
  const events = []
  let cursor = null
  for (;;) {
    const url = new URL('https://public-api.luma.com/v1/calendars/events/list')
    // Community meetups are often listed here but managed by their hosts.
    // Luma otherwise returns only events managed by this calendar itself.
    url.searchParams.append('access', 'manage')
    url.searchParams.append('access', 'view')
    url.searchParams.append('platforms', 'luma')
    url.searchParams.append('platforms', 'external')
    url.searchParams.set('after', MEETUPS_SINCE.toISOString())
    url.searchParams.set('pagination_limit', '100')
    url.searchParams.set('sort_column', 'start_at')
    url.searchParams.set('sort_direction', 'asc')
    if (cursor) url.searchParams.set('pagination_cursor', cursor)
    const res = await fetch(url, { headers: { 'x-luma-api-key': key } })
    if (!res.ok) throw new Error(`${url.pathname} → ${res.status}`)
    const page = await res.json()
    for (const entry of page.entries ?? []) {
      const ev = entry.event ?? entry
      const geo = ev.geo_address_json ?? {}
      events.push({
        id: ev.id ?? ev.api_id ?? entry.api_id,
        title: noEmDash(ev.name ?? ''),
        url: ev.url ?? `https://luma.com/${ev.api_id}`,
        start: ev.start_at ?? null,
        end: ev.end_at ?? null,
        timezone: ev.timezone ?? null,
        address: geo.full_address ?? geo.address ?? null,
        city: geo.city ?? geo.city_state ?? null,
        country: geo.country ?? null,
        online: !geo.full_address && Boolean(ev.meeting_url),
        geo: coordsOf(ev, geo),
        hosts: (entry.hosts ?? []).map((h) => h.name).filter(Boolean),
        cover: ev.cover_url ?? null,
      })
    }
    if (!page.has_more || !page.next_cursor) break
    cursor = page.next_cursor
  }
  const feedCoords = await coordsFromFeed()
  for (const event of events) {
    if (!event.geo && feedCoords.has(event.id))
      event.geo = feedCoords.get(event.id)
  }
  return events
}

/** The meetups whose place the calendar keeps for its guests get a rough
 *  one from their title, so the map can show them: the city, marked as
 *  such, and the country for the filters. Only the ones still missing a
 *  place are asked about, one a second. */
async function placeByTitle(events) {
  let placed = 0
  for (const event of events) {
    if (event.geo) continue
    try {
      const found = await geocodeTitle(event.title)
      if (!found) continue
      event.geo = { lat: found.lat, lon: found.lon, approximate: true }
      event.city ??= found.city
      event.country ??= found.country
      placed++
    } catch {
      /* the map is a bonus; without an answer the dot is just missing */
    }
  }
  return placed
}

/** Saves an event's cover as a small webp, once; the site links the file. */
async function saveCover(event) {
  if (!event.cover) return null
  const id = assetId(event.id)
  const file = path.join(COVERS, `${id}-full.webp`)
  const rel = `/images/meetups/${id}-full.webp`
  const sharp = (await import('sharp')).default
  if (existsSync(file)) {
    const metadata = await sharp(file).metadata()
    event.coverWidth = metadata.width
    event.coverHeight = metadata.height
    return rel
  }
  const res = await fetch(event.cover)
  if (!res.ok) return null
  await mkdir(COVERS, { recursive: true })
  const info = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(file)
  event.coverWidth = info.width
  event.coverHeight = info.height
  return rel
}

try {
  const key = process.env.LUMA_API_KEY
  const source = key ? 'luma-api' : 'luma-feed'
  const found = key ? await meetupsFromApi(key) : await meetupsFromFeed()
  const placed = await placeByTitle(found)
  const events = []
  for (const event of found.filter((e) => e.id && e.title && e.start)) {
    if (new Date(event.start) < MEETUPS_SINCE) continue
    const cover = await saveCover(event)
    events.push({ ...event, cover })
  }
  events.sort((a, b) => a.start.localeCompare(b.start))
  await writeFile(
    MEETUPS,
    await prettier.format(
      JSON.stringify({
        source,
        calendar: 'https://luma.com/omarchy',
        refreshed: new Date().toISOString().slice(0, 10),
        events,
      }),
      { parser: 'json' },
    ),
  )
  const upcoming = events.filter((e) => new Date(e.start) > new Date()).length
  console.log(
    `meetups.json: ${events.length} events, ${upcoming} upcoming, from the ${
      key ? 'API' : 'public feed'
    }, ${placed} placed by title`,
  )
} catch (error) {
  console.warn(`meetups.json: left as it was, ${error.message}`)
}
