import { PROSE } from '../lib/prose'
import { locale, localizedHref, contentLocale } from './site'
import {
  currentNewsTranslation,
  type NewsTranslation,
} from '../lib/news-translation'
const metadata = import.meta.glob<Record<string, NewsTranslation>>(
  './*/news.json',
  { import: 'default', eager: true },
)
const newsMeta = metadata[`./${contentLocale}/news.json`] ?? {}
import { excerptFromHtml } from '../lib/seo'
import type { NewsPost } from '../lib/news'

const newsHtml = import.meta.glob<string>('./*/news/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export function translateNews(post: NewsPost): NewsPost {
  if (contentLocale === 'en')
    return {
      ...post,
      html: localizeLinks(post.html),
      dateStr: new Intl.DateTimeFormat(locale.formatLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(post.date)),
    }
  const meta = (newsMeta as Record<string, NewsTranslation>)[post.slug]
  const html = newsHtml[`./${contentLocale}/news/${post.slug}.html`]
  if (!currentNewsTranslation(post, meta, html))
    return {
      ...post,
      html: `<div lang="en" dir="ltr">${localizeLinks(post.html)}</div>`,
      dateStr: new Intl.DateTimeFormat(locale.formatLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(post.date)),
    }
  return {
    ...post,
    title: meta.title,
    html: localizeLinks(html),
    excerpt: excerptFromHtml(html),
    dateStr: new Intl.DateTimeFormat(locale.formatLocale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(post.date)),
  }
}

const blockCatalogues = import.meta.glob<Record<string, string>>(
  './*/blocks.json',
  { import: 'default', eager: true },
)
const blocks = blockCatalogues[`./${contentLocale}/blocks.json`] ?? {}
import { t } from './site'

/** Translate authored prose blocks without copying live donor lists or asset markup. */
export function translateHtml(html: string): string {
  if (contentLocale === 'en') return localizeLinks(html)
  const translated = html.replace(
    PROSE,
    (whole, tag: string, attrs: string, inner: string) => {
      const replacement = (blocks as Record<string, string>)[inner]
      return replacement ? `<${tag}${attrs}>${replacement}</${tag}>` : whole
    },
  )
  return localizeLinks(translated).replace(
    />([^<>]+)</g,
    (whole, text: string) => {
      const value = t(text.trim())
      return value === text.trim()
        ? whole
        : `>${text.match(/^\s*/)?.[0] ?? ''}${value}${text.match(/\s*$/)?.[0] ?? ''}<`
    },
  )
}

function localizeLinks(html: string): string {
  return html.replace(
    /href="(\/manual[^" ]*)"/g,
    (_, href: string) => `href="${localizedHref(href)}"`,
  )
}
