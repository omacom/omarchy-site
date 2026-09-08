import { t } from '@/i18n/site'

const SOURCE = 'Beautiful, fun & agentic Linux by DHH'

/**
 * The site's byline, "Beautiful, fun & agentic Linux by DHH", as the text
 * on either side of the name, so the name can carry its link wherever a
 * language puts it: Turkish, Japanese and Korean all say it the other way
 * round. Null while a language has no translation of the whole line; the
 * caller then falls back to the two older fragments every language has.
 */
export function byline(): { before: string; after: string } | null {
  const whole = t(SOURCE)
  if (whole === SOURCE) return null
  const [before = '', after = ''] = whole.split('DHH')
  return { before, after }
}
