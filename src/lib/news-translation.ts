import { createHash } from 'node:crypto'

export type NewsTranslation = { title: string; sourceHash: string }

/** An English edit invalidates its translation until the new text is reviewed. */
export function currentNewsTranslation(
  source: { title: string; html: string },
  translation: NewsTranslation | undefined,
  html: string | undefined,
): translation is NewsTranslation {
  return Boolean(
    translation?.title &&
    html?.trim() &&
    translation.sourceHash ===
      createHash('sha256')
        .update(`${source.title}\n${source.html}`)
        .digest('hex'),
  )
}
