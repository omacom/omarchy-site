/** Resolve a counted label without changing catalogues that only have base copy. */
export function translatePlural(
  catalogue: Record<string, string>,
  formatLocale: string,
  english: string,
  count: number,
): string {
  const category = new Intl.PluralRules(formatLocale).select(count)
  return catalogue[`${english} [${category}]`] ?? catalogue[english] ?? english
}
