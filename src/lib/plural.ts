/** Return the CLDR plural category for a count in a given locale. */
export function pluralCategory(
  formatLocale: string,
  count: number,
): Intl.LDMLPluralRule {
  return new Intl.PluralRules(formatLocale).select(count)
}
