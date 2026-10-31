import { useEffect, useState } from 'react'
import type { FieldGlyph } from './HeroPixelField'
import { cn } from '@/lib/utils'

type Field = typeof import('./HeroPixelField').HeroPixelField

type Props = {
  onPainted?: () => void
  /** The word the field resolves into. Defaults to the wordmark. */
  glyph?: FieldGlyph
  /** What a press on the word does. Defaults to the theme picker. */
  onGlyphPress?: () => void
}

function usePixelField() {
  const [Field, setField] = useState<Field | null>(null)
  useEffect(() => {
    let cancelled = false
    void import('./HeroPixelField').then((mod) => {
      if (!cancelled) setField(() => mod.HeroPixelField)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return Field
}

/** The canvas and wordmark share a grid. The host must have a measurable size. */
export function HeroShader({ onPainted, glyph, onGlyphPress }: Props) {
  const Field = usePixelField()
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none"
    >
      {Field ? (
        <Field
          onPainted={onPainted}
          glyph={glyph}
          onGlyphPress={onGlyphPress}
        />
      ) : null}
    </div>
  )
}

/**
 * The same field with no wordmark in it: a ground that drifts, answers the
 * cursor and takes a stamp on a click, wherever a block of the page wants
 * the hero's surface under it. The host must be positioned and clipped.
 */
export function PixelBackdrop({ className }: { className?: string }) {
  const Field = usePixelField()
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 select-none',
        className,
      )}
    >
      {Field ? <Field variant="field" /> : null}
    </div>
  )
}
