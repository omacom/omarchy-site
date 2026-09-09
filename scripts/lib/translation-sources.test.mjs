import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { collectSources } from '../translation-sources.mjs'

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'omarchy-sources-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const put = (name, value) => {
    const file = path.join(root, name)
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(
      file,
      typeof value === 'string' ? value : JSON.stringify(value),
    )
  }
  return { root, put }
}

test('current literals replace old English without consulting translation catalogues', (t) => {
  const { root, put } = fixture(t)
  put('src/page.tsx', "const view = <div>{t('Old English')}</div>")
  put('src/i18n/messages/da.json', {
    'Old English': 'Gammel',
    'Historical key': 'Historisk',
  })
  assert.deepEqual(collectSources(root).messages, ['Old English'])
  put(
    'src/page.tsx',
    "const view = <div>{t('New English')}{t(`New literal`)}</div>",
  )
  assert.deepEqual(collectSources(root).messages, [
    'New English',
    'New literal',
  ])
})

test('Astro frontmatter and template literals are both extracted', (t) => {
  const { root, put } = fixture(t)
  put(
    'src/pages/index.astro',
    "---\nconst title = t('Heading')\n---\n<h1>{t('Body')}</h1>",
  )
  assert.deepEqual(collectSources(root).messages, ['Body', 'Heading'])
})

test('authored blocks preserve exact HTML and exclude people and product headings', (t) => {
  const { root, put } = fixture(t)
  const block = ' A <a href="/somewhere">new story</a>. '
  put('src/data/pages.json', {
    patrons: {
      title: 'Our patrons',
      html: `<h2>Support us</h2><p>${block}</p><p><img src="/picture.webp"></p><p><strong> </strong></p><h3 class="member__name">Donor Name</h3><p class="member__meta">Product Name</p><ul class="patrons__supporters"><li>Another Donor</li></ul><h3 class="resident__name">Artist Name</h3><h2 class="sponsorship__name">Product</h2>`,
    },
    meetups: { title: 'Unused imported title', html: '<p>Event Name</p>' },
  })
  assert.deepEqual(collectSources(root), {
    messages: ['Our patrons'],
    blocks: [block, 'Support us'].sort(),
  })
})

test('dynamic authored copy is extracted without donor, event, or plugin names', (t) => {
  const { root, put } = fixture(t)
  put('src/data/banner.json', {
    html: 'New <strong>announcement</strong>',
    href: '/news/',
  })
  put('src/data/teams.json', [
    {
      name: 'Omarchy Security',
      description: 'Keep safe',
      note: { text: 'Help us', linkText: 'Contact' },
      members: [{ name: 'Person Name', meta: 'Country/Other Country' }],
    },
  ])
  put('src/data/meetups.json', [
    { title: 'Event name', description: 'User event copy' },
  ])
  put('src/data/patrons.json', [{ name: 'Donor name' }])
  put('src/astro/data.ts', "const FEATURED_PLUGIN_IDS = ['featured']")
  put('src/data/plugins.json', {
    plugins: [
      {
        id: 'featured',
        name: 'Product Name',
        description: 'Featured description',
        category: 'Widgets',
      },
      {
        id: 'other',
        description: 'Unfeatured description',
        category: 'Unfeatured category',
      },
    ],
  })
  put(
    'src/lib/regions.ts',
    "export const REGIONS = ['Europe', 'Asia'] as const",
  )
  put('src/data/momentum.json', {
    downloads: { periods: [{ label: 'Yesterday', days: 1, count: 123 }] },
  })
  put('src/lib/search.ts', "export const KIND_LABEL = { plugin: 'Plugin' }")
  put('src/lib/seo.ts', "export const SITE_DESCRIPTION = 'Site summary'")
  put(
    'src/astro/page-seo.ts',
    "function homeSeo() { return seo({title: 'Home title', description: 'Home summary'}) }; function manualIndexSeo(){ return seo({ title: 'English manual' }) }",
  )
  assert.deepEqual(
    collectSources(root).messages,
    [
      'New <strong>announcement</strong>',
      'Security',
      'Keep safe',
      'Help us',
      'Contact',
      'Country',
      'Other Country',
      'Featured description',
      'Widgets',
      'Yesterday',
      'Europe',
      'Asia',
      'Plugin',
      'Site summary',
      'Home title',
      'Home summary',
    ].sort(),
  )
})
