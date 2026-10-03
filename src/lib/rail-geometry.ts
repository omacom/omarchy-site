/**
 * Rail geometry that reads the same in both writing directions.
 *
 * A right-to-left scroller counts `scrollLeft` down from zero at its starting
 * edge to `-(scrollWidth - clientWidth)` at its far one, and lays its slides
 * out with falling `offsetLeft`. Both are measured against the same signed
 * axis, so most of a rail's arithmetic carries over untouched. What does not
 * are the places that assume travel runs upward from zero, that a step
 * between slides is a positive number, or that the first slide's offset is
 * the padding in front of it rather than the room left behind.
 */

export type RailAlign = 'center' | 'start'

/** How far the rail has come from its starting edge, counted up from zero. */
export function travelFrom(scrollLeft: number, rtl: boolean): number {
  // Subtracted rather than negated so a rail parked at the start reads as
  // zero rather than as negative zero.
  return rtl ? 0 - scrollLeft : scrollLeft
}

/** Keep a target inside the travel the scroller actually has. */
export function clampScroll(
  target: number,
  reach: number,
  rtl: boolean,
): number {
  return rtl
    ? Math.min(0, Math.max(-reach, target))
    : Math.max(0, Math.min(reach, target))
}

/** Which ends of its travel the rail is resting against. */
export function edgesAt(
  scrollLeft: number,
  reach: number,
  rtl: boolean,
): { start: boolean; end: boolean } {
  const from = travelFrom(scrollLeft, rtl)
  return { start: from <= 1, end: from >= reach - 1 }
}

/**
 * The room between the scroller's starting edge and its first slide. Right to
 * left the first slide sits against the far end of the axis, so its own
 * offset measures the space behind it instead.
 */
export function startPad({
  clientWidth,
  firstOffset,
  firstWidth,
  rtl,
}: {
  clientWidth: number
  firstOffset: number
  firstWidth: number
  rtl: boolean
}): number {
  return rtl ? clientWidth - (firstOffset + firstWidth) : firstOffset
}

/** The distance from one slide's leading edge to the next, never negative. */
export function slideSpan(
  firstOffset: number,
  secondOffset: number | undefined,
  firstWidth: number,
): number {
  return secondOffset === undefined
    ? firstWidth
    : Math.abs(secondOffset - firstOffset)
}

/** The scroll position that shows a slide where the rail aligns it. */
export function slideTarget({
  align,
  slideOffset,
  slideWidth,
  firstOffset,
  clientWidth,
  reach,
  rtl,
}: {
  align: RailAlign
  slideOffset: number
  slideWidth: number
  firstOffset: number
  clientWidth: number
  reach: number
  rtl: boolean
}): number {
  const raw =
    align === 'center'
      ? slideOffset - (clientWidth - slideWidth) / 2
      : slideOffset - firstOffset
  return clampScroll(raw, reach, rtl)
}
