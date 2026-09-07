import { locale, localizedHref, contentLocale, t } from './site'
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

const manualMeta = import.meta.glob<Record<string, NewsTranslation>>(
  './*/manual.json',
  { import: 'default', eager: true },
)
const manualHtml = import.meta.glob<string>('./*/manual/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export type ManualChapter = { slug: string; title: string; html: string }

/** A chapter without a current translation keeps its English source behind a language notice. */
export function translateManualChapter(chapter: ManualChapter): ManualChapter {
  if (contentLocale === 'en') return chapter
  const meta = manualMeta[`./${contentLocale}/manual.json`]?.[chapter.slug]
  const html = manualHtml[`./${contentLocale}/manual/${chapter.slug}.html`]
  if (!currentNewsTranslation(chapter, meta, html))
    return {
      ...chapter,
      html: `<p class="manual__notice"><em>${t('This chapter has not been translated yet. The English original follows.')}</em></p>\n<div lang="en" dir="ltr">${chapter.html}</div>`,
    }
  return { ...chapter, title: meta.title, html }
}

const blockCatalogues = import.meta.glob<Record<string, string>>(
  './*/blocks.json',
  { import: 'default', eager: true },
)
const blocks = blockCatalogues[`./${contentLocale}/blocks.json`] ?? {}

/** Translate authored prose blocks without copying live donor lists or asset markup. */
export function translateHtml(html: string): string {
  if (contentLocale === 'en') return localizeLinks(html)
  const translated = html.replace(
    /<(p|h2|h3|figcaption|li)\b([^>]*)>([\s\S]*?)<\/\1>/g,
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
