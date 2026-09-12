/** Horizontal field inks on the wordmark, in crest→dim order. */
export const FIELD_BAND_INKS = [
  'crest',
  'hover',
  'lit',
  'mid',
  'dim',
] as const

export type FieldBandInk = (typeof FIELD_BAND_INKS)[number]

/**
 * Band heights: 5, 2, 4, 3, 5. That field is 19 units tall, one per
 * wordmark bitmap row.
 */
export const FIELD_BAND_UNITS: readonly [FieldBandInk, number][] = [
  ['crest', 5],
  ['hover', 2],
  ['lit', 4],
  ['mid', 3],
  ['dim', 5],
]

export const FIELD_BAND_ROWS = FIELD_BAND_UNITS.reduce(
  (sum, [, units]) => sum + units,
  0,
)

/** One ink per unit, for a lattice whose height is FIELD_BAND_ROWS. */
export function fieldBandRowInks(): FieldBandInk[] {
  const rows: FieldBandInk[] = []
  for (const [ink, units] of FIELD_BAND_UNITS) {
    for (let i = 0; i < units; i++) rows.push(ink)
  }
  return rows
}

/** Ink at `t` of the way down the word (0 at the top, 1 at the bottom). */
export function fieldBandInkAtT(t: number): FieldBandInk {
  const last = FIELD_BAND_UNITS[FIELD_BAND_UNITS.length - 1]![0]
  const u = Math.min(1, Math.max(0, t)) * FIELD_BAND_ROWS
  let acc = 0
  for (const [ink, units] of FIELD_BAND_UNITS) {
    acc += units
    if (u < acc) return ink
  }
  return last
}

/** Ink for bitmap row `row` when the glyph is `height` rows tall. */
export function fieldBandInkAtRow(row: number, height = FIELD_BAND_ROWS): FieldBandInk {
  const inks = fieldBandRowInks()
  if (height === inks.length) {
    const i = Math.min(inks.length - 1, Math.max(0, Math.floor(row)))
    return inks[i]!
  }
  return fieldBandInkAtT((row + 0.5) / Math.max(1, height))
}

/** CSS linear-gradient: 5/19, 2/19, 4/19, 3/19, 5/19 of the word. */
export function fieldBandGradientCss(
  colorOf: (ink: FieldBandInk) => string = (ink) => `var(--t-field-${ink})`,
): string {
  const pct = (n: number) =>
    `${Math.round((n / FIELD_BAND_ROWS) * 100000) / 1000}%`
  const stops: string[] = []
  let acc = 0
  for (const [ink, units] of FIELD_BAND_UNITS) {
    const from = acc
    acc += units
    stops.push(`${colorOf(ink)} ${pct(from)} ${pct(acc)}`)
  }
  return `linear-gradient(to bottom, ${stops.join(', ')})`
}
