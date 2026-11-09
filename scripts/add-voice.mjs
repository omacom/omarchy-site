#!/usr/bin/env node
/**
 * Add a post from X to the home page's "People love Omarchy" wall, from
 * nothing but its link.
 *
 *   node scripts/add-voice.mjs https://x.com/SimonHoiberg/status/2094771648377348264
 *   node scripts/add-voice.mjs <url> --dry     (show the entry, write nothing)
 *
 * Reads the post through the endpoint X's own embeds use, which needs no
 * key: the text as written, the author's name and handle, the date, and
 * the avatar. The text is cut where X cuts it for display, so a trailing
 * link to attached media does not come along, and shortened links inside
 * it are put back to where they point. The avatar is saved at 96px as
 * WebP beside the others, and the post's pictures come too, up to four,
 * each cropped to 16:9 at 800px so the cards stay even; a video gives its
 * poster, and the card marks it as one. The entry is appended to
 * src/data/voices.json. A post already on the wall is left alone.
 *
 * The avatar goes to the site checkout (OMARCHY_SITE_DIR, else this
 * repository), where the other site images live.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { voiceHandle, tweetId } from './lib/voice-input.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const SITE = path.resolve(process.env.OMARCHY_SITE_DIR ?? ROOT)
const DATA = path.join(ROOT, 'src/data/voices.json')
const AVATARS = path.join(SITE, 'assets/images/voices')

const [, , url, flag] = process.argv
const dry = flag === '--dry'
let id
try {
  id = tweetId(url)
} catch {
  console.error(
    'usage: add-voice.mjs https://x.com/<handle>/status/<id> [--dry]',
  )
  process.exit(1)
}

// The same token X's embed asks with: the id scaled and written in base 36.
const token = ((Number(id) / 1e15) * Math.PI)
  .toString(36)
  .replace(/(0+|\.)/g, '')
const res = await fetch(
  `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${token}&lang=en`,
)
if (!res.ok) {
  console.error(`X answered ${res.status} for that post`)
  process.exit(1)
}
const post = await res.json()
if (!post.text || !post.user) {
  console.error('That post could not be read. Is it public?')
  process.exit(1)
}

// The text as X shows it: cut at the display range, links put back.
const [from, to] = post.display_text_range ?? [0, post.text.length]
let text = post.text.slice(from, to)
for (const link of post.entities?.urls ?? []) {
  text = text.replace(link.url, link.expanded_url)
}
text = text.trim()

// A post longer than 280 characters comes back cut at 280, with the rest
// behind an id and no text. FxTwitter, a free mirror of X's posts, gives
// the whole of it; if it cannot, the cut text goes in with a warning.
if (post.note_tweet) {
  try {
    const fx = await fetch(`https://api.fxtwitter.com/status/${id}`)
    const full = (await fx.json())?.tweet?.text
    if (fx.ok && typeof full === 'string' && full.length > text.length) {
      text = full.trim()
    } else throw new Error(`answered ${fx.status}`)
  } catch (error) {
    console.warn(
      `This is a long post and the full text could not be read (${error}). ` +
        'The first 280 characters went in; finish it by hand in voices.json.',
    )
  }
}

const handle = voiceHandle(post.user.screen_name)
const media = (post.mediaDetails ?? []).slice(0, 4)
const stem = `${handle.toLowerCase()}-${id}`
const entry = {
  handle,
  name: post.user.name,
  date: new Date(post.created_at).toISOString().slice(0, 10),
  url: `https://x.com/${handle}/status/${id}`,
  avatar: `/assets/images/voices/${handle.toLowerCase()}.webp`,
  text,
  ...(media.length
    ? {
        images: media.map(
          (_, i) => `/assets/images/voices/${stem}-${i + 1}.webp`,
        ),
        ...(media.some((m) => m.type === 'video' || m.type === 'animated_gif')
          ? { video: true }
          : {}),
      }
    : {}),
}

const voices = JSON.parse(readFileSync(DATA, 'utf8'))
if (voices.some((v) => v.url.endsWith(`/status/${id}`))) {
  console.log(`Already on the wall: ${entry.name} (@${handle})`)
  process.exit(0)
}

if (dry) {
  console.log(JSON.stringify(entry, null, 2))
  process.exit(0)
}

// The avatar at 400px, since the embed only names the 48px one.
const big = post.user.profile_image_url_https.replace('_normal', '_400x400')
const image = await fetch(big)
if (!image.ok) {
  console.error(`The avatar could not be fetched (${image.status})`)
  process.exit(1)
}
mkdirSync(AVATARS, { recursive: true })
const out = path.join(AVATARS, `${handle.toLowerCase()}.webp`)
await sharp(Buffer.from(await image.arrayBuffer()))
  .resize(96, 96, { fit: 'cover' })
  .webp({ quality: 82 })
  .toFile(out)

// The pictures, or a video's poster: 800 by 450, the middle of each.
for (const [i, item] of media.entries()) {
  const src = item.media_url_https
  const picture = await fetch(src.includes('?') ? src : `${src}?name=large`)
  if (!picture.ok) {
    console.error(`Picture ${i + 1} could not be fetched (${picture.status})`)
    process.exit(1)
  }
  await sharp(Buffer.from(await picture.arrayBuffer()))
    .resize(800, 450, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(path.join(AVATARS, `${stem}-${i + 1}.webp`))
}

voices.push(entry)
writeFileSync(DATA, JSON.stringify(voices, null, 2) + '\n')
console.log(
  `Added ${entry.name} (@${handle}), ${entry.date}: "${text.slice(0, 60).replace(/\n/g, ' ')}${text.length > 60 ? '…' : ''}"`,
)
console.log(
  `Avatar: ${path.relative(process.cwd(), out)}${media.length ? `, ${media.length} picture${media.length > 1 ? 's' : ''}${entry.video ? ' (video poster)' : ''}` : ''}`,
)
