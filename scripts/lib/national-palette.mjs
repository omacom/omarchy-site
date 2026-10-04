/**
 * Turns a national theme (src/lib/national-themes.ts) into the same theme
 * tokens a stock theme sets by hand in src/styles.css.
 *
 * Greys are built in OKLCH, leaning toward one of the flag's colours. The
 * flag's colours are kept exact wherever they sit on something they
 * contrast with. Where one has to be read against the page, it keeps its
 * hue and moves in lightness only as far as the contrast floor needs.
 */

/** WCAG floors: body text, and large shapes such as the wordmark. */
export const TEXT_CONTRAST = 4.5
export const SHAPE_CONTRAST = 3
/** How far the resting pixels stand off the field: clearly there, quieter
 *  than the word. */
const REST_CONTRAST = 3.5

/** The wordmark's grid. */
import { wordGrid, WORD_COLUMNS, WORD_ROWS } from '../../src/lib/word-shade.ts'
export { WORD_COLUMNS, WORD_ROWS }

// ------------------------------------------------------------ colour math

const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const toGamma = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055

export function parseHex(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`Not a #rrggbb colour: ${hex}`)
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function toHex(rgb) {
  return (
    '#' +
    rgb
      .map((v) =>
        Math.round(Math.min(255, Math.max(0, v)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

/** Relative luminance, as WCAG defines it. */
export function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((v) => toLinear(v / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function hexToOklch(hex) {
  const [r, g, b] = parseHex(hex).map((v) => toLinear(v / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return {
    l: L,
    c: Math.hypot(A, B),
    h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
  }
}

function oklchToLinear({ l: L, c, h }) {
  const A = c * Math.cos((h * Math.PI) / 180)
  const B = c * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** An OKLCH colour as hex, giving up chroma until it fits in sRGB. */
export function oklch(l, c, h) {
  let chroma = c
  for (let i = 0; i < 40; i++) {
    const rgb = oklchToLinear({ l, c: chroma, h })
    if (rgb.every((v) => v >= -0.0001 && v <= 1.0001))
      return toHex(rgb.map((v) => toGamma(Math.min(1, Math.max(0, v))) * 255))
    chroma *= 0.92
  }
  return toHex(
    oklchToLinear({ l, c: 0, h }).map(
      (v) => toGamma(Math.min(1, Math.max(0, v))) * 255,
    ),
  )
}

/** Part way from one colour to another, in sRGB as the stock themes mix. */
export function mix(from, to, t) {
  const a = parseHex(from)
  const b = parseHex(to)
  return toHex(a.map((v, i) => v + (b[i] - v) * t))
}

/**
 * The colour itself if it reaches `floor` against every ground, else the
 * same hue moved in lightness, away from the grounds, until it does.
 */
export function readableOn(hex, grounds, floor, dark) {
  const passes = (c) => grounds.every((g) => contrast(c, g) >= floor)
  if (passes(hex)) return hex
  const { l, c, h } = hexToOklch(hex)
  // A deep colour drained of chroma as it lightens reads as grey, so it
  // gains some on the way up: a navy stays blue.
  const chroma = dark ? Math.max(c, Math.min(0.13, c * 2.2)) : c
  for (let step = 1; step <= 100; step++) {
    const next = oklch(dark ? l + step * 0.005 : l - step * 0.005, chroma, h)
    if (passes(next)) return next
  }
  return dark ? '#ffffff' : '#000000'
}

// --------------------------------------------------------------- tokens

/**
 * The page's greys, at OKLCH lightness, leaning toward the base colour's
 * hue. A dark ground takes up to `chroma` of the base's own saturation, so
 * a vivid flag gives a deep, clearly coloured ground and a muted one stays
 * near black.
 */
const GREYS = {
  dark: {
    share: 0.3,
    chroma: 0.055,
    textChroma: 0.012,
    secondaryChroma: 0.02,
    mutedChroma: 0.035,
    deep: 0.17,
    bg: 0.2,
    surface: 0.23,
    surface2: 0.265,
    borderStrong: 0.42,
    field: 0.145,
    text: 0.955,
    secondary: 0.87,
    muted: 0.75,
  },
  light: {
    share: 0.04,
    chroma: 0.008,
    textChroma: 0.02,
    secondaryChroma: 0.02,
    mutedChroma: 0.02,
    deep: 0.955,
    bg: 0.993,
    surface: 1,
    surface2: 0.955,
    borderSubtle: 0.915,
    borderStrong: 0.78,
    field: 0.93,
    text: 0.22,
    secondary: 0.32,
    muted: 0.43,
  },
}

const ELEVATION = {
  dark: [
    '0 0 0 1px oklch(1 0 0 / 0.07)',
    '0 0 0 1px oklch(1 0 0 / 0.13)',
    'rgb(255 255 255 / 0.1)',
    'rgb(255 255 255 / 0.14)',
  ],
  light: [
    '0 0 0 1px oklch(0 0 0 / 0.06), 0 1px 3px oklch(0 0 0 / 0.05),\n    0 4px 10px -4px oklch(0 0 0 / 0.05)',
    '0 0 0 1px oklch(0 0 0 / 0.09), 0 1px 3px oklch(0 0 0 / 0.07),\n    0 4px 10px -4px oklch(0 0 0 / 0.08)',
    'rgb(0 0 0 / 0.1)',
    'rgb(0 0 0 / 0.18)',
  ],
}

/** The wordmark as one colour per row, or per column, in flag colours. */
export function wordCells(theme) {
  const runs = 'bands' in theme.word ? theme.word.bands : theme.word.stripes
  const cells = runs.flatMap(([color, size]) => Array(size).fill(color))
  return { axis: 'bands' in theme.word ? 'rows' : 'cols', cells, runs }
}

/** Rows grouped into runs of one value: [value, first row, end row). */
function runsOf(values) {
  const runs = []
  values.forEach((value, row) => {
    const last = runs.at(-1)
    if (last && last[0] === value) last[2] = row + 1
    else runs.push([value, row, row + 1])
  })
  return runs
}

/**
 * The shaded word (src/lib/word-shade.ts) as CSS backgrounds. The word is
 * cut into blocks that each end at a column: the hoist, then each stripe,
 * or the bands. A conic gradient centred on a point fills exactly the
 * quarter above and left of it, so each run of colour down a block is one
 * such layer, the higher runs and the blocks further left on top. The last
 * block spans the word and is a plain gradient underneath.
 */
function wordCss(grid, ends) {
  const pct = (n, of) => `${Math.round((n / of) * 100000) / 1000}%`
  return ends
    .flatMap(({ column, rows }, i) => {
      const runs = runsOf(grid.slice(0, rows).map((line) => line[column - 1]))
      if (i === ends.length - 1)
        return `linear-gradient(to bottom, ${runs
          .map(
            ([color, from, to]) =>
              `${color} ${pct(from, WORD_ROWS)} ${pct(to, WORD_ROWS)}`,
          )
          .join(', ')})`
      return runs.map(
        ([color, , to]) =>
          `conic-gradient(at ${pct(column, WORD_COLUMNS)} ${pct(to, WORD_ROWS)}, transparent 0deg 270deg, ${color} 270deg)`,
      )
    })
    .join(', ')
}

/** Every token a national theme sets, in the order the stock themes do. */
export function themeTokens(theme) {
  const dark = theme.ground === 'dark'
  const g = GREYS[theme.ground]
  const color = (name) => {
    const hex = theme.colors[name]
    if (!hex) throw new Error(`${theme.id}: no flag colour called ${name}`)
    return hex.toLowerCase()
  }
  const base = hexToOklch(color(theme.base))
  const chroma = Math.min(base.c * g.share, g.chroma)
  const grey = (l, c = chroma) => oklch(l, c, base.h)

  const bg = grey(g.bg)
  const surface = grey(g.surface)
  const surface2 = grey(g.surface2)
  const fieldBg = grey(g.field)
  const text = grey(g.text, g.textChroma)
  const secondary = grey(g.secondary, g.secondaryChroma)
  const muted = grey(g.muted, g.mutedChroma)
  const grounds = [grey(g.deep), bg, surface, surface2]

  // The buttons wear the flag colour exactly; the label is the first of
  // the flag's colours readable on it, else the page's own ink.
  const fill = color(theme.button.fill)
  const labels = [
    ...(theme.button.label ?? []).map(color),
    dark ? text : bg,
    '#ffffff',
    dark ? grey(g.deep) : text,
    '#000000',
  ]
  const ink = labels.find((c) => contrast(c, fill) >= TEXT_CONTRAST)

  // Links are read against every ground the page has. A white button
  // would make them the text's own colour, so they take the field's then.
  const links =
    theme.links ?? (luminance(fill) > 0.85 ? theme.base : theme.button.fill)
  const brand = readableOn(color(links), grounds, TEXT_CONTRAST, dark)

  // The pixels rest in the field's colour and light up in the hot one.
  const rest = readableOn(color(theme.base), [fieldBg], REST_CONTRAST, dark)
  const fieldLit = readableOn(
    color(theme.hot ?? theme.button.fill),
    [fieldBg],
    SHAPE_CONTRAST,
    dark,
  )

  // The word's colours, each kept exact unless the field would swallow it.
  const { axis, cells, runs } = wordCells(theme)
  const shown = new Map()
  for (const [name] of runs)
    shown.set(name, readableOn(color(name), [fieldBg], SHAPE_CONTRAST, dark))
  const hoist = 'hoist' in theme.word ? theme.word.hoist : undefined
  if (hoist)
    shown.set(
      hoist[0],
      readableOn(color(hoist[0]), [fieldBg], SHAPE_CONTRAST, dark),
    )
  const uprights = ('uprights' in theme.word && theme.word.uprights) || []
  for (const [name] of uprights)
    shown.set(name, readableOn(color(name), [fieldBg], SHAPE_CONTRAST, dark))
  const bars = uprights.map(([name, from, to]) => ({
    color: shown.get(name),
    from,
    to,
  }))
  const hoistRows = hoist?.[2] ?? WORD_ROWS
  const grid = wordGrid(
    {
      axis,
      cells: cells.map((name) => shown.get(name)),
      hoist: hoist && {
        color: shown.get(hoist[0]),
        columns: hoist[1],
        rows: hoistRows,
      },
      uprights: bars,
    },
    fieldBg,
  )
  // Where each block of the word ends: the hoist, then every stripe, or
  // the bands across the whole word.
  let edge = 0
  const ends = [
    ...(hoist ? [{ column: hoist[1], rows: hoistRows }] : []),
    ...(axis === 'cols'
      ? runs.map(([, size]) => ({ column: (edge += size), rows: WORD_ROWS }))
      : [{ column: WORD_COLUMNS, rows: WORD_ROWS }]),
  ]
  // Uprights lie over everything, the last listed on top.
  const pctOf = (n) => `${Math.round((n / WORD_COLUMNS) * 100000) / 1000}%`
  const word = [
    ...[...bars]
      .reverse()
      .map(
        ({ color: bar, from, to }) =>
          `linear-gradient(to right, transparent ${pctOf(from)}, ${bar} ${pctOf(from)} ${pctOf(to)}, transparent ${pctOf(to)})`,
      ),
    wordCss(grid, ends),
  ].join(', ')

  // The bar over the hero draws its labels in difference mode, so it asks
  // for the colour that comes out as the secondary text over the field.
  const fb = parseHex(fieldBg)
  const hdr = toHex(
    parseHex(secondary).map((v, i) =>
      dark ? Math.min(255, fb[i] + v) : Math.max(0, fb[i] - v),
    ),
  )

  const [elevation, elevationHover, imgOutline, scrollThumb] =
    ELEVATION[theme.ground]

  return {
    '--t-bg-deep': grey(g.deep),
    '--t-bg': bg,
    '--t-surface': surface,
    '--t-surface-2': surface2,
    '--t-border-subtle': dark ? surface2 : grey(g.borderSubtle),
    '--t-border-strong': grey(g.borderStrong),
    '--t-text': text,
    '--t-text-secondary': secondary,
    '--t-text-muted': muted,
    '--t-brand': brand,
    '--t-brand-soft': `${brand}1f`,
    '--t-brand-fill': fill,
    '--t-brand-ink': ink,
    '--t-elevation': elevation,
    '--t-elevation-hover': elevationHover,
    '--t-img-outline': imgOutline,
    '--t-scroll-thumb': scrollThumb,
    '--t-selection': mix(bg, brand, dark ? 0.3 : 0.22),
    '--t-field-bg': fieldBg,
    '--t-field-dim': mix(fieldBg, rest, dark ? 0.45 : 0.35),
    '--t-field-mid': rest,
    '--t-field-lit': fieldLit,
    '--t-field-hover': dark
      ? mix(fieldLit, '#ffffff', 0.35)
      : mix(fieldLit, '#000000', 0.22),
    '--t-field-crest': dark
      ? mix(fieldLit, '#ffffff', 0.7)
      : mix(fieldLit, '#000000', 0.45),
    '--t-word': word,
    '--t-word-cells': `${axis} ${cells.map((name) => shown.get(name)).join(' ')}`,
    ...(hoist && {
      '--t-word-hoist': `${shown.get(hoist[0])} ${hoist[1]} ${hoistRows}`,
    }),
    ...(bars.length && {
      '--t-word-uprights': bars
        .map(({ color: bar, from, to }) => `${bar} ${from} ${to}`)
        .join(', '),
    }),
    'color-scheme': theme.ground,
    '--t-hdr-text-2': hdr,
  }
}

/** Checks a theme's own description before any tokens are made from it. */
export function problemsWith(theme) {
  const problems = []
  const { axis, cells } = wordCells(theme)
  const want = axis === 'rows' ? WORD_ROWS : WORD_COLUMNS
  if (cells.length !== want)
    problems.push(`word has ${cells.length} ${axis}, wants ${want}`)
  for (const name of cells)
    if (!theme.colors[name]) problems.push(`word uses unknown colour ${name}`)
  const hoist = 'hoist' in theme.word ? theme.word.hoist : undefined
  if (hoist) {
    if (!theme.colors[hoist[0]])
      problems.push(`hoist uses unknown colour ${hoist[0]}`)
    if (hoist[1] !== 11 && hoist[1] !== 27)
      problems.push('hoist must end in a gap between letters: 11 or 27')
  }
  for (const [name, from, to] of ('uprights' in theme.word &&
    theme.word.uprights) ||
    []) {
    if (!theme.colors[name])
      problems.push(`upright uses unknown colour ${name}`)
    if (!(from >= 0 && from < to && to <= WORD_COLUMNS))
      problems.push(`upright ${name} must run from 0 to ${WORD_COLUMNS}`)
  }
  for (const name of [
    theme.base,
    theme.button.fill,
    ...(theme.button.label ?? []),
    theme.links,
    theme.hot,
  ])
    if (name && !theme.colors[name]) problems.push(`unknown colour ${name}`)
  return problems
}

export function themeCss(themes) {
  const blocks = themes.map((theme) => {
    const lines = Object.entries(themeTokens(theme)).map(
      ([name, value]) => `  ${name}: ${value};`,
    )
    return `/* ${theme.name} (${theme.country}) */\nhtml[data-theme='${theme.id}'],\n[data-theme='${theme.id}'] {\n${lines.join('\n')}\n}`
  })
  return `/* Generated by scripts/build-national-themes.mjs from src/lib/national-themes.ts.
   Edit the flags there and run the script; do not edit this file by hand.

   This file is imported ahead of the stock themes, whose defaults sit on
   :root. The html prefix outranks :root, so a national theme on the page
   wins; the bare selector serves any element that wears a theme itself. */\n\n${blocks.join('\n\n')}\n`
}
