import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { collectSources } from './translation-sources.mjs'
import locales from '../src/i18n/locales.json' with { type: 'json' }

const json = (file) => JSON.parse(readFileSync(file, 'utf8'))
const posts = json('src/data/news-posts.json')
const chapters = json('src/data/manual.json')
const sources = collectSources()
const messages = new Set(sources.messages)
const problems = []
const args = process.argv.slice(2)
const strictNews = args.includes('--strict-news')
const pendingNews = args.includes('--pending-news')
const pendingSite = args.includes('--pending-site')
const strictSite = args.includes('--strict-site')
const selected = args.filter(
  (arg) =>
    ![
      '--strict-news',
      '--pending-news',
      '--strict-site',
      '--pending-site',
    ].includes(arg),
)
const sourceHash = (post) =>
  createHash('sha256').update(`${post.title}\n${post.html}`).digest('hex')
const articleStatus = (contentLocale, news, post) => {
  const translated = news[post.slug]
  if (
    !translated?.title?.trim() ||
    !existsSync(`src/i18n/${contentLocale}/news/${post.slug}.html`) ||
    !readFileSync(
      `src/i18n/${contentLocale}/news/${post.slug}.html`,
      'utf8',
    ).trim()
  )
    return 'missing'
  if (translated.sourceHash !== sourceHash(post)) return 'stale'
  return null
}
for (const code of selected) {
  if (!Object.hasOwn(locales, code)) problems.push(`Unknown locale: ${code}`)
}
// Queue inspection is independent of UI validation and writes only JSON to stdout.
if (pendingNews || pendingSite) {
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  const pending = []
  const seen = new Set()
  for (const [code, locale] of Object.entries(locales)) {
    if (selected.length && !selected.includes(code)) continue
    const contentLocale = locale.contentLocale ?? code
    if (contentLocale === 'en' || seen.has(contentLocale)) continue
    seen.add(contentLocale)
    if (pendingSite) {
      for (const kind of ['messages', 'blocks']) {
        const file =
          kind === 'messages'
            ? `src/i18n/messages/${contentLocale}.json`
            : `src/i18n/${contentLocale}/blocks.json`
        const catalogue = existsSync(file) ? json(file) : {}
        for (const source of sources[kind]) {
          if (
            typeof catalogue[source] !== 'string' ||
            !catalogue[source].trim()
          )
            pending.push({ locale: contentLocale, kind, source })
        }
      }
      continue
    }
    const file = `src/i18n/${contentLocale}/news.json`
    const news = existsSync(file) ? json(file) : {}
    for (const post of posts) {
      const reason = articleStatus(contentLocale, news, post)
      if (reason)
        pending.push({
          locale: contentLocale,
          slug: post.slug,
          reason,
          sourceHash: sourceHash(post),
        })
    }
  }
  // A pipe is asynchronous: flush the complete queue before exiting.
  await new Promise((resolve, reject) => {
    process.stdout.write(`${JSON.stringify(pending, null, 2)}\n`, (error) =>
      error ? reject(error) : resolve(),
    )
  })
  process.exit(0)
}
// Only rendered once a locale enables its manual; other locales redirect those pages.
const MANUAL_MESSAGES = new Set([
  'The Manual - Omarchy',
  'The Omarchy manual: installation, navigation, hotkeys, themes, plugins, and everything else about running the OS.',
  'Omarchy Manual',
  'Answers to what comes up most: keyboard layouts, the clock format, timezones, DNS and Wi-Fi, printers, and where screenshots end up.',
  'This chapter has not been translated yet. The English original follows.',
])
const references = (html, attribute) =>
  [...html.matchAll(new RegExp(`${attribute}="([^"]*)"`, 'g'))]
    .map((match) => match[1])
    .sort()
const attributeValues = (text, attribute) =>
  [
    ...new Set(
      [...text.matchAll(new RegExp(`${attribute}="([^"\\s]+)"`, 'g'))].map(
        (match) => match[1],
      ),
    ),
  ].sort()
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const domains = new Set()
for (const [code, locale] of Object.entries(locales)) {
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(code))
    problems.push(`Invalid language code: ${code}`)
  const url = new URL(locale.domain)
  if (
    url.protocol !== 'https:' ||
    url.pathname !== '/' ||
    domains.has(url.hostname)
  )
    problems.push(`Invalid or duplicate domain: ${locale.domain}`)
  domains.add(url.hostname)
  if (locale.direction && !['ltr', 'rtl'].includes(locale.direction))
    problems.push(`Invalid text direction: ${code}`)
  if (locale.flag && !/^[A-Z]{2}$/.test(locale.flag))
    problems.push(`Invalid flag country code: ${code}`)
  new Intl.DateTimeFormat(locale.formatLocale)
  const contentLocale = locale.contentLocale ?? code
  if (contentLocale === 'en' || (selected.length && !selected.includes(code)))
    continue
  const catalogueFile = `src/i18n/messages/${contentLocale}.json`
  const catalogue = existsSync(catalogueFile) ? json(catalogueFile) : {}
  for (const message of messages) {
    if (typeof catalogue[message] !== 'string' || !catalogue[message].trim()) {
      if (strictSite && (locale.manual || !MANUAL_MESSAGES.has(message)))
        problems.push(`${code}: missing message: ${message}`)
    } else {
      for (const attribute of ['href', 'src']) {
        if (
          !same(
            references(message, attribute),
            references(catalogue[message], attribute),
          )
        )
          problems.push(
            `${code}: message ${attribute} references differ: ${message}`,
          )
      }
    }
  }
  const blocksFile = `src/i18n/${contentLocale}/blocks.json`
  const blocks = existsSync(blocksFile) ? json(blocksFile) : {}
  for (const source of sources.blocks) {
    if (typeof blocks[source] !== 'string' || !blocks[source].trim()) {
      if (strictSite) problems.push(`${code}: missing prose: ${source}`)
      continue
    }
    for (const attribute of ['href', 'src']) {
      if (
        !same(
          references(source, attribute),
          references(blocks[source], attribute),
        )
      )
        problems.push(
          `${code}: prose ${attribute} references differ: ${source}`,
        )
    }
  }
  const newsFile = `src/i18n/${contentLocale}/news.json`
  const news = existsSync(newsFile) ? json(newsFile) : {}
  for (const post of posts) {
    const status = articleStatus(contentLocale, news, post)
    if (status) {
      if (strictNews)
        problems.push(
          status === 'missing'
            ? `${code}: missing article: ${post.slug}`
            : `${code}: source article changed; review translation: ${post.slug}`,
        )
    } else {
      const html = readFileSync(
        `src/i18n/${contentLocale}/news/${post.slug}.html`,
        'utf8',
      )
      for (const attribute of ['href', 'src']) {
        const values = (text) =>
          [
            ...new Set(
              [
                ...text.matchAll(new RegExp(`${attribute}="([^"\\s]+)"`, 'g')),
              ].map((match) => match[1]),
            ),
          ].sort()
        if (JSON.stringify(values(post.html)) !== JSON.stringify(values(html)))
          problems.push(
            `${code}: article ${attribute} references differ: ${post.slug}`,
          )
      }
    }
  }
  if (locale.manual) {
    const manualFile = `src/i18n/${contentLocale}/manual.json`
    if (!existsSync(manualFile)) problems.push(`${code}: missing ${manualFile}`)
    const manual = existsSync(manualFile) ? json(manualFile) : {}
    for (const chapter of chapters) {
      const translated = manual[chapter.slug]
      const file = `src/i18n/${contentLocale}/manual/${chapter.slug}.html`
      if (!translated?.title || !existsSync(file))
        problems.push(`${code}: missing chapter: ${chapter.slug}`)
      else if (translated.sourceHash !== sourceHash(chapter))
        problems.push(
          `${code}: source chapter changed; review translation: ${chapter.slug}`,
        )
      else {
        const html = readFileSync(file, 'utf8')
        // Links, images and section ids must survive translation so cross-references keep working.
        for (const attribute of ['href', 'src', 'id']) {
          if (
            !same(
              attributeValues(chapter.html, attribute),
              attributeValues(html, attribute),
            )
          )
            problems.push(
              `${code}: chapter ${attribute} references differ: ${chapter.slug}`,
            )
        }
      }
    }
  }
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(
  `Translations checked: ${(selected.length ? selected : Object.keys(locales)).join(', ')}; ${messages.size} UI messages, ${posts.length} news articles, ${chapters.length} manual chapters where enabled.`,
)
