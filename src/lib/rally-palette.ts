export type RGB = readonly [number, number, number]
export const FIELD_COLORS = [
  'bg',
  'dim',
  'mid',
  'lit',
  'hover',
  'crest',
] as const
export type RallyColors = Record<
  (typeof FIELD_COLORS)[number] | 'brand' | 'brandInk' | 'paper' | 'ink',
  RGB
>

export function luminance(color: RGB) {
  const linear = color.map((value) => {
    const channel = value / 255
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

const mix = (base: RGB, over: RGB, amount: number): RGB => [
  Math.round(base[0] + (over[0] - base[0]) * amount),
  Math.round(base[1] + (over[1] - base[1]) * amount),
  Math.round(base[2] + (over[2] - base[2]) * amount),
]
const cssColor = (color: RGB, alpha = 1) => `rgb(${color.join(' ')} / ${alpha})`

/** Theme contrast can reverse; illumination in the game world must not. */
export function createRallyPalette(t: RallyColors) {
  const { bg, dim, mid, lit, crest, paper, ink } = t
  const daylight = luminance(bg) > luminance(crest)
  const dark = daylight ? mix(crest, ink, 0.3) : bg
  const colors = {
    dark,
    ground: daylight ? mix(mid, paper, 0.45) : mix(bg, dim, 0.6),
    groundDetail: daylight ? mix(mid, paper, 0.38) : mix(bg, dim, 0.83),
    road: daylight ? mix(ink, paper, 0.84) : mix(dim, crest, 0.62),
    roadInner: daylight ? mix(ink, paper, 0.88) : mix(dim, crest, 0.68),
    verge: daylight ? mix(mid, paper, 0.25) : mid,
    text: daylight ? paper : crest,
    accent: t.brand,
    accentInk: t.brandInk,
    gravel: daylight ? mix(ink, paper, 0.52) : mix(dim, crest, 0.35),
    dust: daylight ? paper : mix(mid, crest, 0.6),
    rock: daylight ? mix(mid, paper, 0.22) : mid,
    treeBase: daylight ? mix(dark, mid, 0.3) : mix(bg, dim, 0.5),
    treeMid: daylight ? mix(dark, mid, 0.65) : dim,
    treeMidAlt: daylight ? mix(dark, mid, 0.8) : mix(dim, mid, 0.2),
    treeTop: daylight ? mid : mix(dim, mid, 0.5),
    treeTopAlt: daylight ? mix(mid, dim, 0.35) : mix(dim, mid, 0.7),
    carSide: daylight ? mix(mid, paper, 0.68) : mix(mid, crest, 0.7),
    glass: daylight ? dark : mix(bg, mid, 0.25),
    glassShine: daylight ? mix(dark, mid, 0.6) : mid,
    livery: lit,
    headlight: daylight ? paper : t.hover,
  }
  return {
    ...(Object.fromEntries(
      Object.entries(colors).map(([key, value]) => [key, cssColor(value)]),
    ) as Record<keyof typeof colors, string>),
    shadow: cssColor(dark, daylight ? 0.28 : 0.65),
    daylight,
  }
}
