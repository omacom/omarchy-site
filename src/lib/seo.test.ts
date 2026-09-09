import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { excerptFromHtml, seo, socialImage } from './seo.ts'
import { SITE_THEMES } from './site-themes.ts'

test('social cards are stable for equivalent page URLs and vary across posts', () => {
  const path =
    '/news/2026/09/omacom-foundation-raises-another-half-a-million-dollars'
  assert.deepEqual(socialImage(path), socialImage(`${path}/`))
  assert.deepEqual(socialImage(path), socialImage(`${path}/?ref=share#quote`))
  const posts = JSON.parse(
    readFileSync(new URL('../data/news-posts.json', import.meta.url), 'utf8'),
  )
  const cards = new Set(
    posts.map((post: { path: string }) => socialImage(post.path).url),
  )
  assert.ok(cards.size > 1, 'news posts must not all share one card')
})

test('every selectable social card is a 1200x630 PNG', () => {
  for (const theme of SITE_THEMES) {
    const image = readFileSync(
      new URL(`../../public/brand/social/${theme.id}.png`, import.meta.url),
    )
    assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(image.readUInt32BE(16), 1200, theme.id)
    assert.equal(image.readUInt32BE(20), 630, theme.id)
  }
})

test('canonical and social URLs use the production site and trailing slash', () => {
  const head = seo({
    title: 'Hotkeys',
    description: 'Keyboard shortcuts',
    path: '/manual/hotkeys',
  })
  assert.equal(head.links[0].href, 'https://omarchy.org/manual/hotkeys/')
  assert.equal(
    head.meta.find((meta) => 'property' in meta && meta.property === 'og:url')
      ?.content,
    'https://omarchy.org/manual/hotkeys/',
  )
})

test('excerpts skip short introductions and decode prose as plain text', () => {
  assert.equal(
    excerptFromHtml(
      '<h1>Welcome</h1><p>Introduction</p><p>Omarchy &amp; its community make Linux a welcoming place for people who love their computers.</p>',
    ),
    'Omarchy & its community make Linux a welcoming place for people who love their computers.',
  )
})

test('removing tags cannot concatenate a new script tag', () => {
  const excerpt = excerptFromHtml(
    '<p>Omarchy has a long paragraph for this regression case: <scr<script>ipt>alert(1)</scr<script>ipt> with more text.</p>',
  )
  assert.equal(excerpt.includes('<script'), false)
})
