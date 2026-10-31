import { translateNews } from '../i18n/content'

export type NewsPost = {
  slug: string
  year: string
  month: string
  /** The canonical address, dated and slash-terminated: /news/2026/09/slug/.
   *  It is the feed's GUID and every link anyone has shared. */
  path: string
  title: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  /** The date as prose: "September 3, 2026". */
  dateStr: string
  excerpt: string
  html: string
}

export type NewsSummary = Omit<NewsPost, 'html'>

let posts: Array<NewsPost> | null = null

export async function loadNews(): Promise<Array<NewsPost>> {
  if (posts) return posts
  const mod = await import('../data/news-posts.json')
  posts = mod.default.map(translateNews)
  return posts
}

/** The list without the bodies - what an index or a teaser row needs. */
export function summarize(list: Array<NewsPost>): Array<NewsSummary> {
  return list.map(({ html: _html, ...rest }) => rest)
}
