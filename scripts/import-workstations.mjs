// Import downloaded Discord attachments: node scripts/import-workstations.mjs <directory>
// The directory contains manifest.json and originals named by attachment ID.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const run = promisify(execFile)
import path from 'node:path'
import sharp from 'sharp'

const directory = process.argv[2]
if (!directory)
  throw new Error('Pass the directory containing manifest.json and originals')
const manifest = JSON.parse(
  await readFile(path.join(directory, 'manifest.json'), 'utf8'),
)
const exclusions = JSON.parse(
  await readFile('scripts/data/workstations-excluded.json', 'utf8'),
)
const excluded = new Set(
  exclusions.map((item) => item.attachment).filter(Boolean),
)
const excludedFiles = new Set(
  exclusions.map((item) => item.file).filter(Boolean),
)
const assetDirectory = 'assets/workstations'
await mkdir(`${assetDirectory}/previews`, { recursive: true })
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  )
const entries = []
const known = new Set()
const seen = new Set()
let originalBytes = 0
let fullBytes = 0
let previewBytes = 0
const oldHtml = await readFile('workstations/index.html', 'utf8')
const existing = [
  ...oldHtml.matchAll(/<img[^>]+src="(\/assets\/workstations\/[^\"]+)"/g),
]
const previous = JSON.parse(
  await readFile('scripts/data/workstations-media.json', 'utf8').catch(
    () => '[]',
  ),
)
// Retain the published gallery even if a Discord post is later deleted.
// Existing optimized assets never need to be downloaded or encoded again.
for (const entry of previous) {
  if (excluded.has(entry.attachment) || excludedFiles.has(entry.file)) continue
  await access(entry.file)
  await access(entry.preview)
  entries.push(entry)
  if (entry.attachment) known.add(entry.attachment)
  if (entry.hash) seen.add(entry.hash)
}
if (!previous.length) {
  for (const match of existing) {
    const file = match[1].slice(1)
    if (excludedFiles.has(file)) continue
    const data = await readFile(file)
    seen.add(createHash('sha256').update(data).digest('hex'))
    const preview = `${assetDirectory}/previews/${path.parse(file).name}.webp`
    const result = await sharp(data)
      .rotate()
      .resize({
        width: 640,
        height: 640,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 72 })
      .toFile(preview)
    entries.push({ file, preview, width: result.width, height: result.height })
  }
}
const additions = []
for (const item of manifest.toReversed()) {
  if (excluded.has(item.id) || known.has(item.id)) continue
  if (![item.id, item.post, item.message].every((id) => /^\d+$/.test(id)))
    throw new Error('Invalid Discord ID')
  const data = await readFile(path.join(directory, item.id))
  originalBytes += data.length
  const hash = createHash('sha256').update(data).digest('hex')
  if (seen.has(hash)) {
    exclusions.push({
      attachment: item.id,
      reason: `Duplicate media (SHA-256 ${hash})`,
    })
    excluded.add(item.id)
    continue
  }
  known.add(item.id)
  seen.add(hash)
  const video =
    item.content_type.startsWith('video/') ||
    (item.content_type === 'image/gif' &&
      (await sharp(data).metadata()).pages > 1)
  const file = `${assetDirectory}/discord-${item.id}.${video ? 'webm' : 'webp'}`
  const preview = `${assetDirectory}/previews/discord-${item.id}.webp`
  let info
  if (video) {
    await run('ffmpeg', [
      '-y',
      '-v',
      'error',
      '-i',
      path.join(directory, item.id),
      '-map',
      '0:v:0',
      '-map',
      '0:a?',
      '-vf',
      'scale=1280:1280:force_original_aspect_ratio=decrease:force_divisible_by=2',
      '-c:v',
      'libvpx-vp9',
      '-cpu-used',
      '4',
      '-crf',
      '36',
      '-b:v',
      '0',
      '-row-mt',
      '1',
      '-threads',
      '4',
      '-c:a',
      'libopus',
      '-b:a',
      '64k',
      file,
    ])
    const { stdout: frame } = await run(
      'ffmpeg',
      [
        '-v',
        'error',
        '-i',
        file,
        '-frames:v',
        '1',
        '-f',
        'image2pipe',
        '-vcodec',
        'png',
        '-',
      ],
      { encoding: 'buffer', maxBuffer: 20 * 1024 * 1024 },
    )
    info = await sharp(frame)
      .resize({ width: 640, height: 640, fit: 'inside' })
      .webp({ quality: 72 })
      .toFile(preview)
  } else {
    await sharp(data)
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(file)
    info = await sharp(data)
      .rotate()
      .resize({
        width: 640,
        height: 640,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 72 })
      .toFile(preview)
  }
  fullBytes += (await readFile(file)).length
  previewBytes += info.size
  additions.push({
    file,
    preview,
    width: info.width,
    height: info.height,
    video,
    title: item.title,
    source: `https://discord.com/channels/1390012484194275541/${item.post}/${item.message}`,
    attachment: item.id,
    hash,
  })
  if (additions.length % 30 === 0)
    console.log(`Processed ${additions.length} new gallery items`)
}
const ordered = [
  ...additions,
  ...entries.filter((entry) => entry.source),
  ...entries.filter((entry) => !entry.source),
]
const cards = ordered
  .map((entry) => {
    const title = escape(entry.title || 'Omarchy workstation')
    const media = entry.video
      ? `<video controls preload="none" playsinline poster="/${escape(entry.preview)}" aria-label="${title}" width="${entry.width}" height="${entry.height}"><source src="/${escape(entry.file)}" type="video/webm"></video>`
      : `<a href="/${escape(entry.file)}" aria-label="View workstation photo: ${title}"><img src="/${escape(entry.preview)}" alt="${title}" width="${entry.width}" height="${entry.height}" loading="lazy" decoding="async"></a>`
    return `          <figure>\n            ${media}\n          </figure>`
  })
  .join('\n\n')
await writeFile(
  'scripts/data/workstations-excluded.json',
  JSON.stringify(exclusions, null, 2) + '\n',
)
await writeFile(
  'scripts/data/workstations-media.json',
  JSON.stringify(ordered, null, 2) + '\n',
)
await writeFile(
  'workstations/index.html',
  `<!doctype html>
<!-- Content source for the React site; edit the article here, preview with npm run dev. -->
<html lang="en">
<head><meta charset="utf-8"><title>#omarchy-workstations</title></head>
<body>
<main>
      <div class="workstations">
        <div class="workstations__images">
${cards}
        </div>
      </div>
</main>
</body>
</html>
`,
)
console.log(
  JSON.stringify({
    total: ordered.length,
    added: additions.length,
    imported: ordered.filter((e) => e.source).length,
    originalBytes,
    fullBytes,
    previewBytes,
  }),
)
