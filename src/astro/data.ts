import { translateHtml } from '../i18n/content'
import { t } from '../i18n/site'
import manualJson from '../data/manual.json'
import pagesJson from '../data/pages.json'
import pluginsJson from '../data/plugins.json'
import { loadNews, summarize } from '../lib/news'
import type { NewsPost, NewsSummary } from '../lib/news'
import { toCatalogueEntry } from '../lib/plugin-filter'
import type { CatalogueEntry, Engagement } from '../lib/plugin-filter'

export type ManualChapter = { slug: string; title: string; html: string }
export type { NewsPost, NewsSummary }
export type PortedPage = {
  title: string
  html: string
  seoTitle?: string
  description?: string
  presentation?: string
}

const HEADING_LINK =
  /<h([23])([^>]*)>([\s\S]*?)\s*<a class="manual__heading-link"([^>]*)>#<\/a><\/h\1>/g

function retargetContentsLink(html: string) {
  return html.replace(/href="\/manual\/toc\/?"/g, 'href="/manual/"')
}

function foldHeadingLinks(html: string) {
  return html.replace(
    HEADING_LINK,
    (_whole, level: string, attrs: string, text: string, linkAttrs: string) =>
      `<h${level}${attrs}><a class="manual__heading-link"${linkAttrs}>${text}` +
      `<span class="manual__hash" aria-hidden="true">#</span></a></h${level}>`,
  )
}

const chapters = manualJson as Array<ManualChapter>

export function getManualToc() {
  return chapters.map(({ slug, title }) => ({ slug, title }))
}

export function getManualChapter(slug: string) {
  const found = chapters.find((c) => c.slug === slug) ?? null
  const chapter = found
    ? { ...found, html: retargetContentsLink(foldHeadingLinks(found.html)) }
    : null
  const index = chapters.findIndex((c) => c.slug === slug)
  return {
    chapter,
    toc: getManualToc(),
    prev:
      index > 0
        ? { slug: chapters[index - 1].slug, title: chapters[index - 1].title }
        : null,
    next:
      index >= 0 && index < chapters.length - 1
        ? { slug: chapters[index + 1].slug, title: chapters[index + 1].title }
        : null,
  }
}

export async function getNewsIndex(): Promise<Array<NewsSummary>> {
  return summarize(await loadNews())
}

export async function getNewsPost(slug: string): Promise<NewsPost | null> {
  const posts = await loadNews()
  return posts.find((p) => p.slug === slug) ?? null
}

const pages = pagesJson as Record<string, PortedPage>

export function getPortedPage(path: string): PortedPage | null {
  const page = pages[path]
  return page
    ? {
        ...page,
        title: t(page.title),
        seoTitle: page.seoTitle ? t(page.seoTitle) : undefined,
        description: page.description ? t(page.description) : undefined,
        html: translateHtml(page.html),
      }
    : null
}

export function getPortedSlugs(): Array<string> {
  return Object.keys(pages)
}

const ZERO_STATS: Engagement = { views: 0, copies: 0, hearts: 0 }

const FEATURED_PLUGIN_IDS = [
  'akshar.radio-atlas',
  'slcode777.omagotchi',
  'io.github.thisisgm.omapods',
  'jankeesvw.omasweeper',
  'jankeesvw.time-machine',
  'raiden-meixelysia.omarchy-pets',
]

type PluginRecord = Omit<CatalogueEntry, 'stats'>

export function getPluginHighlights(): {
  top: Array<CatalogueEntry>
  total: number
} {
  const all = (pluginsJson as { plugins: Array<PluginRecord> }).plugins
  const featured = FEATURED_PLUGIN_IDS.map((id) => {
    const plugin = all.find((p) => p.id === id)
    if (!plugin) throw new Error(`Featured plugin missing: ${id}`)
    return plugin
  })
  const top = featured.map((p) => toCatalogueEntry({ ...p, stats: ZERO_STATS }))
  return { top, total: all.length }
}
