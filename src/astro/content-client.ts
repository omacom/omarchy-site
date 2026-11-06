import type { SearchEntry } from './search-index'

export type { SearchEntry } from './search-index'

let searchIndex: Promise<Array<SearchEntry>> | undefined

/** Fetch and parse once per visit, including across page navigation. Retry failures. */
export function getSearchIndex(): Promise<Array<SearchEntry>> {
  return (searchIndex ??= fetch('/data/search-index.json')
    .then(async (res) => {
      if (!res.ok) throw new Error('search index unavailable')
      return (await res.json()) as Array<SearchEntry>
    })
    .catch((error) => {
      searchIndex = undefined
      throw error
    }))
}
