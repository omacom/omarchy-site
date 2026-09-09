import { siteUrl, contentLocale, t } from '../i18n/site.ts'
import { SITE_THEMES } from './site-themes.ts'

/**
 * The tags social sites read when a link is pasted: Open Graph for Slack,
 * Discord, iMessage, LinkedIn and Facebook, and Twitter Cards for X.
 *
 * Base.astro renders the common tags and each page supplies its own
 * title, description, canonical URL, and optional publication date.
 *
 * `og:title` is the document title verbatim rather than a bare heading.
 * Slack shows the site name beside it and X shows nothing beside it, so
 * "Hotkeys" alone would arrive without context in the place that needs it
 * most, and the suffix is what tells you which manual you are being sent to.
 */

/**
 * Every absolute URL in the head is built from this. Open Graph forbids
 * relative image URLs, and a canonical is only meaningful as an absolute.
 */
export const SITE_URL = siteUrl

export const SITE_DESCRIPTION =
  'The malleable OS for the age of agents. Vibe your way through every alteration, tweak, and desire.'

/** Select by canonical path so translations share a theme and repeated builds stay stable. */
export function socialImage(path: string) {
  const pathname = canonicalPath(path.split(/[?#]/, 1)[0])
  let hash = 2166136261
  for (const char of pathname) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
  }
  const theme = SITE_THEMES[hash % SITE_THEMES.length]
  return {
    url: `${SITE_URL}/brand/social/${contentLocale === 'en' ? '' : `${contentLocale}/`}${theme.id}.png`,
    width: '1200',
    height: '630',
    alt: `The Omarchy wordmark in the ${theme.name} theme`,
  }
}

export interface SeoInput {
  /** The document title, used for the tab and for the card's heading. */
  title: string
  description: string
  /** Absolute path, leading slash, no origin: '/manual/hotkeys'. */
  path: string
  /** 'article' for anything with a publication date; 'website' otherwise. */
  type?: 'website' | 'article'
  /** ISO-8601 instant; only read when type is 'article'. */
  published?: string
  /** e.g. 'noindex' on the not-found page, which is not a real URL. */
  robots?: string
}

/** omarchy.org serves every page with a trailing slash; a canonical that
 *  drops it is a different URL to every crawler. */
function canonicalPath(path: string) {
  if (path === '/') return '/'
  return path.endsWith('/') ? path : `${path}/`
}

export function seo({
  title,
  description,
  path,
  type = 'website',
  published,
  robots,
}: SeoInput) {
  title = t(title)
  description = t(description)
  const url = `${SITE_URL}${canonicalPath(path)}`
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      ...(type === 'article' && published
        ? [{ property: 'article:published_time', content: published }]
        : []),
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      ...(robots ? [{ name: 'robots', content: robots }] : []),
    ],
    // Only ever set on a leaf route. The root cannot know the path, and two
    // canonicals on one page are worse than none.
    links: [{ rel: 'canonical', href: url }],
  }
}

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '\u2026',
  mdash: '\u2014',
  ndash: '\u2013',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
}

/**
 * Entities have to be resolved, not passed through: a description is written
 * into an attribute, so an unknown "&rsquo;" leaves as "&amp;rsquo;" and the
 * card shows the escape rather than the apostrophe.
 */
const decode = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] === '#') {
      const n = parseInt(
        ref.slice(ref[1] === 'x' || ref[1] === 'X' ? 2 : 1),
        ref[1] === 'x' || ref[1] === 'X' ? 16 : 10,
      )
      if (!Number.isInteger(n) || n < 0 || n > 0x10ffff) return whole
      return String.fromCodePoint(n)
    }
    return NAMED[ref.toLowerCase()] ?? whole
  })

export function excerptFromHtml(html: string, limit = 155): string {
  // Only ever a paragraph. A chapter that opens on a heading would otherwise
  // summarise itself with its own section titles, and the folded heading
  // links would drag their "#" along with them.
  const head = html.slice(0, 4000)
  // A paragraph short enough to be a standfirst ("Setting the direction")
  // describes the page worse than the body does, so fall through to the body.
  const para = [...head.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => m[1])
    .find((p) => p.replace(/<[^>]*>/g, ' ').trim().length >= 60)
  // A page with no prose at all - a page of lists, like the teams page -
  // gets nothing rather than a run-on of its own list items. The caller
  // falls back to the site's own summary.
  if (!para) return ''
  const text = decode(para.replace(/<[^>]*>/g, ' '))
    // The "#" a folded heading link leaves behind, and the space a stripped
    // inline tag leaves in front of punctuation.
    .replace(/\s#(?=\s|$)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([),.;:!?])/g, '$1')
    .trim()
  if (text.length <= limit) return text
  const cut = text.slice(0, limit)
  const space = cut.lastIndexOf(' ')
  // Trimming to the last space also keeps the cut off the middle of a
  // surrogate pair; the guard covers the case where there is no space to
  // fall back to and an emoji straddles the limit.
  const kept =
    space > 40 ? cut.slice(0, space) : cut.replace(/[\uD800-\uDBFF]$/, '')
  return `${kept}…`
}
