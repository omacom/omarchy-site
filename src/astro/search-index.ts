import manualJson from '../data/manual.json'
import themesJson from '../data/themes.json'
import { loadNews } from '../lib/news'
import type { NewsPost } from '../lib/news'

export type SearchEntry =
  | {
      kind: 'manual'
      slug: string
      title: string
      heading: string | null
      hash: string | null
      text: string
    }
  | {
      kind: 'news'
      slug: string
      year: string
      month: string
      title: string
      meta: string
      text: string
    }
  | { kind: 'theme'; slug: string; title: string; meta: string; text: string }

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
}

function strip(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#?\w+);/g, (whole, name: string) => ENTITIES[name] ?? whole)
    .replace(/\s+/g, ' ')
    .trim()
}

const HEADING = /<h([23])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi

function manualSections(chapter: {
  slug: string
  title: string
  html: string
}): SearchEntry[] {
  const out: SearchEntry[] = []
  const html = chapter.html
  let cursor = 0
  let heading: string | null = null
  let hash: string | null = null
  const push = (end: number) => {
    const text = strip(html.slice(cursor, end))
    if (text) {
      out.push({
        kind: 'manual',
        slug: chapter.slug,
        title: chapter.title,
        heading,
        hash,
        text,
      })
    }
  }
  for (const match of html.matchAll(HEADING)) {
    push(match.index)
    heading = strip(match[3]).replace(/\s*#\s*$/, '')
    hash = match[2]
    cursor = match.index + match[0].length
  }
  push(html.length)
  return out
}

function newsEntries(posts: Array<NewsPost>): SearchEntry[] {
  return posts.map((post) => ({
    kind: 'news' as const,
    slug: post.slug,
    year: post.year,
    month: post.month,
    title: post.title,
    meta: post.dateStr,
    text: strip(post.html),
  }))
}

function owner(repo: string) {
  try {
    return new URL(repo).pathname.split('/').filter(Boolean)[0] ?? 'community'
  } catch {
    return 'community'
  }
}

export async function buildSearchIndex(): Promise<Array<SearchEntry>> {
  const news = newsEntries(await loadNews())
  const manualPart: SearchEntry[] = []
  for (const chapter of manualJson as Array<{
    slug: string
    title: string
    html: string
  }>) {
    manualPart.push(...manualSections(chapter))
  }
  const rest: SearchEntry[] = []
  for (const theme of themesJson as Array<{ name: string; repo: string }>) {
    rest.push({
      kind: 'theme',
      slug: theme.name,
      title: theme.name,
      meta: owner(theme.repo),
      text: owner(theme.repo),
    })
  }
  return [...manualPart, ...news, ...rest]
}
