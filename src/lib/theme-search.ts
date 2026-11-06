import { searchable } from '../i18n/site.ts'

/**
 * Whether a query finds a theme by name: each whitespace-separated term must
 * appear somewhere in it, ignoring accents and case. An empty query finds all.
 */
export function matchesTheme(name: string, query: string): boolean {
  const haystack = searchable(name)
  return searchable(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}
