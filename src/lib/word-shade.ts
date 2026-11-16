import { WORDMARK_ROWS } from '../data/wordmark-bitmap.ts'

/**
 * A national theme's wordmark is shaded the way the stock words are: in
 * flat bands, lighter at the top and deeper toward the foot. Every flag
 * colour is shaded down its own run, a stripe, a band of the flag or the
 * hoist, with its exact value on the middle step, as a stock word wears
 * its true colour on its middle band: the steps above it lift away from
 * the field and the ones below fall toward it, so the word reads as the
 * flag's own colour overall, and each of its bands keeps its edges. White
 * cannot lift, nor can yellow without fading, so they start exact at the
 * top and only deepen. Colours move in OKLCH lightness, so every step looks
 * the same size. Shared by the theme generator, which writes the CSS,
 * and the hero canvas, so the two cannot disagree.
 */

/** The word's grid. */
export const WORD_ROWS = 19
export const WORD_COLUMNS = 81

/** The stock wordmark's bands, top to bottom, in rows: crest, hover, lit,
 *  mid and dim. A run of one colour the word's full height steps the same
 *  way, so a one-colour flag shades like the stock themes. */
export const WORD_BANDS = [4, 3, 4, 3, 5] as const

/** Each step is at least this many rows, and a run has at most this many
 *  steps: a run under two steps tall stays flat. */
const STEP_ROWS = 3
const MAX_STEPS = 4
/** How far each step of shading moves a colour, in OKLCH lightness, so
 *  every step looks as big as the next whatever the colour and whichever
 *  way it moves: every run, however short, steps as gently. */
const STEP_DEPTH = 0.04

/** A full-height run's step at a row: the stock bands. */
function stockStep(position: number) {
  let step = 0
  for (let edge = WORD_BANDS[0]; position >= edge;) edge += WORD_BANDS[++step]
  return { step, steps: WORD_BANDS.length }
}

/** The most steps a run of this height can take. */
const stepsFit = (height: number) =>
  Math.min(MAX_STEPS, Math.floor(height / STEP_ROWS))

/** A shorter run's step at a row: steps of near equal height, the taller
 *  ones last, so a band's exact colour at its foot gets the extra row. */
function evenStep(position: number, height: number, steps: number) {
  if (steps < 2) return { step: 0, steps }
  const short = Math.floor(height / steps)
  // The last `extra` steps are a row taller than the rest.
  const extra = height - short * steps
  const shortRows = short * (steps - extra)
  const step =
    position < shortRows
      ? Math.floor(position / short)
      : steps - extra + Math.floor((position - shortRows) / (short + 1))
  return { step, steps }
}

/**
 * How far a colour moves at a row of its run: 0 on its middle step, toward
 * the field below it and, as a negative amount, away from it above. White
 * and yellow are exact on their first step instead, since they cannot lift.
 */
export function shadeAt(
  color: string,
  position: number,
  height: number,
  steps = stepsFit(height),
) {
  const at = stepOf(position, height, steps)
  return amountAt(color, at.step, at.steps)
}

/** Which step of its run a row is on, and how many steps the run has:
 *  the stock bands where it is the word's full height, else near-equal
 *  steps. */
function stepOf(position: number, height: number, steps: number) {
  if (steps < 2) return { step: 0, steps: 1 }
  return height === WORD_ROWS
    ? stockStep(position)
    : evenStep(position, height, steps)
}

/** How far a colour moves on one step of a run of `height` rows. */
function amountAt(
  color: string,
  step: number,
  steps: number,
  depth = STEP_DEPTH,
) {
  if (steps < 2) return 0
  const pale = isPale(color)
  const middle = pale ? 0 : Math.floor(steps / 2)
  return depth * (step - middle)
}

/** #rrggbb to OKLab, and back. */
const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const fromLinear = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055

function toOklab(color: string) {
  const n = parseInt(color.slice(1), 16)
  const [r, g, b] = [16, 8, 0].map((shift) =>
    toLinear(((n >> shift) & 255) / 255),
  )
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** OKLab to linear sRGB, which may fall outside 0 to 1. */
function oklabToLinear(L: number, a: number, b: number) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (rgb: number[]) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4)

/** How much of a colour's chroma sRGB holds at a lightness, 0 to 1. */
function chromaKept(L: number, a: number, b: number) {
  if (L > 1 || L < 0) return 0
  if (inGamut(oklabToLinear(L, a, b))) return 1
  let low = 0
  let high = 1
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2
    if (inGamut(oklabToLinear(L, a * mid, b * mid))) low = mid
    else high = mid
  }
  return low
}

/** An OKLCH colour sRGB can show: its chroma eased down until it fits. */
function inSrgb(L: number, a: number, b: number) {
  const scale = chromaKept(L, a, b)
  return [L, a * scale, b * scale]
}

/** An OKLab colour as #rrggbb. */
function toHex([L, a, b]: number[]) {
  return `#${oklabToLinear(L, a, b)
    .map((c) =>
      Math.round(fromLinear(Math.min(1, Math.max(0, c))) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/** A word of two bands has only two tones in each, so they step further
 *  apart to be seen. */
const TWO_BAND_DEPTH = 0.07

/** White, and colours as near the top of sRGB as yellow, cannot lift a
 *  step without fading toward cream: they start exact at the top and only
 *  deepen. */
function isPale(color: string) {
  const [L, a, b] = toOklab(color)
  return chromaKept(L + STEP_DEPTH, a, b) < 0.9
}

/** A colour moved by a shading amount, in OKLCH lightness at its own hue
 *  and chroma, toward the field's lightness or away from it: as far as
 *  makes the colour look `amount` away, chroma it loses to sRGB counted. */
function shaded(color: string, amount: number, field: string) {
  if (amount === 0) return color
  const lab = toOklab(color)
  const [L, a, b] = lab
  const sign = (toOklab(field)[0] < 0.6 ? -1 : 1) * Math.sign(amount)
  const at = (t: number) => inSrgb(Math.min(1, Math.max(0, L + sign * t)), a, b)
  const target = Math.abs(amount)
  let low = 0
  let high = target
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2
    if (Math.hypot(...at(mid).map((v, i) => v - lab[i])) < target) low = mid
    else high = mid
  }
  return toHex(at(low))
}

/** A colour shaded for its row in a run of it that is `height` tall. */
function shadeCell(
  color: string,
  position: number,
  height: number,
  field: string,
  steps?: number,
) {
  return shaded(color, shadeAt(color, position, height, steps), field)
}

export type WordColours = {
  axis: 'rows' | 'cols'
  /** One colour per row, or per column. */
  cells: string[]
  /** A block from the top left, `columns` wide and `rows` tall, or with
   *  a `tip` a triangle: its base the word's left edge, its point on that
   *  row's edge at `columns`, a flag's hoist triangle. */
  hoist?: {
    color: string
    columns: number
    rows: number
    tip?: number
    /** Rows a flag sets the triangle's reach on itself: row, then the
     *  column it ends at. */
    ends?: [row: number, column: number][]
    /** A colour on the cells just above and below a triangle, outside
     *  it: a border along its slopes. Flat, like a cross. */
    edge?: string | null
  } | null
  /** Bars down the whole word, the later ones on top, from one column up
   *  to another: a cross's upright. Flat, like the cross's arm. */
  uprights?:
    | {
        color: string
        from: number
        to: number
        /** Only over these rows, from one up to another. */
        rows?: [number, number] | null
      }[]
    | null
  /** A slant across the word instead of bands, bottom left to top right:
   *  `slope` columns per row, and each colour from where it starts along
   *  the row through the middle of the top row, shifted on as rows go down. */
  diagonal?: {
    slope: number
    runs: { color: string; from: number }[]
    /** Cells set by hand: a colour over a row's columns, from up to to. */
    fill?: { color: string; row: number; from: number; to: number }[]
  } | null
  /** The bands' tones run the other way, away from the field down the word. */
  turned?: boolean
  /** Rows where a band of two steps is told to take its second: a flag's
   *  own say over where a band's tone changes. */
  splits?: number[] | null
}

/** The wordmark's pixels, one string of 0 and 1 per row. */
const GLYPH = (WORDMARK_ROWS as readonly (string | readonly number[])[]).map(
  (line) => (typeof line === 'string' ? line : line.join('')),
)
const lit = (row: number, col: number) => GLYPH[row]?.[col] === '1'

/**
 * How far a hoist triangle reaches along each row. A cell is in it where
 * its centre is, so the slopes step a pixel at a time, then the slopes
 * are tidied against the letters: where the edge would leave a pixel or
 * two of a letter's run on one side, the run goes to the side holding
 * more of it, or out of the triangle on a tie.
 */
const reaches = new Map<string, number[]>()
function triangleReach(hoist: {
  columns: number
  rows: number
  tip: number
  ends?: [number, number][]
}) {
  const key = `${hoist.columns} ${hoist.rows} ${hoist.tip} ${hoist.ends ?? ''}`
  const known = reaches.get(key)
  if (known) return known
  const reach = Array.from({ length: hoist.rows }, (_, row) => {
    const y = row + 0.5
    const x =
      y <= hoist.tip
        ? (hoist.columns * y) / hoist.tip
        : (hoist.columns * (hoist.rows - y)) / (hoist.rows - hoist.tip)
    return Math.max(0, Math.ceil(x - 0.5))
  })
  // A run of a letter the edge cuts goes to whichever side holds more of
  // it, where the other holds a pixel or two: outside on a tie.
  reach.forEach((col, row) => {
    if (!lit(row, col) || !lit(row, col - 1)) return
    let start = col
    while (lit(row, start - 1)) start--
    let end = col
    while (lit(row, end)) end++
    const kept = col - start
    const left = end - col
    if (Math.min(kept, left) <= 2) reach[row] = kept > left ? end : start
  })
  for (const [row, column] of hoist.ends ?? []) reach[row] = column
  reaches.set(key, reach)
  return reach
}

/** Whether a hoist covers a cell. */
export function inHoist(
  hoist: NonNullable<WordColours['hoist']>,
  row: number,
  col: number,
) {
  if (row >= hoist.rows) return false
  if (hoist.tip === undefined) return col < hoist.columns
  return col < triangleReach({ ...hoist, tip: hoist.tip })[row]
}

/**
 * How many steps each band of a word takes. A word has as many tones top
 * to bottom as the stock wordmark's five, four for a flag of two bands:
 * each band of the flag is one, and what is left goes to shading, the
 * outer bands first and the top before the bottom. A band takes a step
 * only where it has the rows for one. A flag of three colours or more
 * steps each of its bands in two instead.
 */
function bandSteps(cells: string[]) {
  const runs: { top: number; height: number; steps: number }[] = []
  cells.forEach((color, row) => {
    if (row > 0 && color === cells[row - 1]) runs.at(-1)!.height++
    else runs.push({ top: row, height: 1, steps: 1 })
  })
  // A flag of three colours or more steps each band of it in two, a band
  // of five rows too, two rows over three: only thin lines stay flat.
  if (new Set(cells).size >= 3) {
    for (const run of runs) run.steps = run.height >= 5 ? 2 : 1
    return runs
  }
  let spare = (runs.length === 2 ? 4 : WORD_BANDS.length) - runs.length
  const order = runs
    .map((run, i) => ({ run, i, edge: Math.min(i, runs.length - 1 - i) }))
    .sort((a, b) => a.edge - b.edge || a.i - b.i)
    .map(({ run }) => run)
  for (let gave = true; spare > 0 && gave;) {
    gave = false
    for (const run of order) {
      if (spare === 0) break
      if (run.steps < stepsFit(run.height)) {
        run.steps++
        spare--
        gave = true
      }
    }
  }
  return runs
}

/**
 * The word's colour at every cell of its 19 by 81 grid, by row then
 * column: the bands or stripes, the hoist over them, each run of one
 * colour shaded down toward `field`, the ground it sits on.
 */
export function wordGrid(word: WordColours, field: string) {
  const grid: string[][] = []
  const cells = word.cells
  const bands = word.axis === 'rows' ? bandSteps(cells) : []
  // A field with lines across it, a Nordic cross or stripes: two colours,
  // the field's at the top and the foot. The field shades down the whole
  // word as a one-colour word does, and the lines lie flat over it.
  const ground =
    word.axis === 'rows' &&
    bands.length >= 3 &&
    new Set(cells).size === 2 &&
    cells[0] === cells[WORD_ROWS - 1]
      ? cells[0]
      : null
  // The field steps over only the rows it shows, never under a line: each
  // stretch of it between lines takes the steps it has rows for, up to the
  // stock five in all, the taller stretches first, and the steps run on
  // from one stretch to the next down the word.
  const fieldStep: number[] = []
  let fieldSteps = 1
  if (ground !== null) {
    const parts = bands.filter((run) => cells[run.top] === ground)
    const given = parts.map(() => 1)
    let spare = WORD_BANDS.length - parts.length
    const order = parts
      .map((part, i) => ({ part, i }))
      .sort((a, b) => b.part.height - a.part.height || b.i - a.i)
    for (let gave = true; spare > 0 && gave;) {
      gave = false
      for (const { part, i } of order) {
        if (spare > 0 && given[i] < stepsFit(part.height)) {
          given[i]++
          spare--
          gave = true
        }
      }
    }
    let first = 0
    parts.forEach((part, i) => {
      // The stretch above the first line mirrors the foot: its taller
      // step at the top, so the word opens and closes on its widest.
      const mirrored = i === 0 && parts.length > 1
      for (let row = part.top; row < part.top + part.height; row++) {
        const at = mirrored
          ? given[i] -
            1 -
            stepOf(part.top + part.height - 1 - row, part.height, given[i]).step
          : stepOf(row - part.top, part.height, given[i]).step
        fieldStep[row] = first + at
      }
      first += given[i]
    })
    fieldSteps = first
    // The last step takes a row from the one above, as the stock word's
    // foot is its tallest band, where that leaves the one above three.
    const last = parts.at(-1)!
    const foot = last.top + last.height - 1
    const lastTop = fieldStep.indexOf(fieldStep[foot])
    const aboveTop = fieldStep.indexOf(fieldStep[foot] - 1)
    if (
      fieldStep[lastTop - 1] === fieldStep[foot] - 1 &&
      lastTop - 1 - aboveTop >= STEP_ROWS
    )
      fieldStep[lastTop - 1] = fieldStep[foot]
  }
  // Stripes, two lines or more, step down the word as the field does; a
  // cross's single arm lies flat.
  const striped =
    ground !== null &&
    bands.filter((run) => cells[run.top] !== ground).length >= 2
  /** The stock step for a row, which a striped word takes stripe by
   *  stripe, at each stripe's first row, so no stripe changes tone part
   *  way: the stripes and a canton over them step on the same rows. */
  const rowStep = (row: number) =>
    stockStep(striped ? bands.filter((run) => run.top <= row).at(-1)!.top : row)
  /** A row's step: its band's own, or the field's down the whole word. */
  const toneAt = (row: number) => {
    if (ground !== null) {
      if (cells[row] !== ground)
        return striped
          ? { ...rowStep(row), key: `line${row}` }
          : { step: 0, steps: 1, key: `line${row}` }
      const step = fieldStep[row]
      return { step, steps: fieldSteps, key: `field${step}` }
    }
    const band = bands.filter((run) => run.top <= row).at(-1)!
    const split = word.splits?.find(
      (at) => at > band.top && at < band.top + band.height,
    )
    if (band.steps === 2 && split !== undefined) {
      const step = row >= split ? 1 : 0
      return { step, steps: 2, key: `${band.top}:${step}` }
    }
    // A flag of two bands steps its first band after five rows and its
    // second after four, so the lighter tone tops each colour.
    if (bands.length === 2 && band.steps === 2) {
      const edge = band.top + (band.top === 0 ? 5 : 4)
      if (band.top + band.height - edge >= STEP_ROWS) {
        const step = row >= edge ? 1 : 0
        return { step, steps: 2, key: `${band.top}:${step}` }
      }
    }
    const at = stepOf(row - band.top, band.height, band.steps)
    return { ...at, key: `${band.top}:${at.step}` }
  }
  // A hoist steps with the bands beside it: a new step on every row where
  // they change, in colour or in shade, so its edges line up with theirs.
  // Where that would be more steps than a run takes, it steps only where
  // they change colour, so one colour of the flag stays near its own.
  const hoistStep: number[] = []
  let hoistSteps = 1
  if (word.hoist && word.axis === 'rows') {
    const stepsBy = (keyOf: (row: number) => string) => {
      const steps: number[] = []
      let count = 1
      for (let row = 0; row < word.hoist!.rows; row++) {
        if (row > 0 && keyOf(row) !== keyOf(row - 1)) count++
        steps.push(count - 1)
      }
      return { steps, count }
    }
    let by = stepsBy((row) => toneAt(row).key)
    if (by.count > MAX_STEPS) by = stepsBy((row) => cells[row])
    hoistStep.push(...by.steps)
    hoistSteps = by.count
  }
  const depth =
    word.axis === 'rows' && bands.length === 2 ? TWO_BAND_DEPTH : STEP_DEPTH
  for (let row = 0; row < WORD_ROWS; row++) {
    const line: string[] = []
    for (let col = 0; col < WORD_COLUMNS; col++) {
      if (word.diagonal) {
        // Either side shades as the stock word does, row by row; the band
        // lies flat, like a cross, so its lines read whole corner to corner.
        // An upright stroke takes its colour whole from its middle, so a
        // line crosses every stroke as the same clean bar, never a notch.
        let start = col
        while (lit(row, start - 1)) start--
        let end = col + 1
        while (lit(row, end)) end++
        const x = end - start <= 3 ? (start + end) / 2 : col + 0.5
        const at = x + (row + 0.5) * word.diagonal.slope
        const runs = word.diagonal.runs
        const index = runs.filter((run) => run.from <= at).length - 1
        const set = word.diagonal.fill?.find(
          (cells) => cells.row === row && col >= cells.from && col < cells.to,
        )
        if (set) {
          line.push(set.color)
          continue
        }
        const color = runs[index].color
        if (index > 0 && index < runs.length - 1) {
          line.push(color)
          continue
        }
        const step = rowStep(row)
        line.push(shaded(color, amountAt(color, step.step, step.steps), field))
        continue
      }
      // The last bar listed over this column's middle is the one on top; a
      // bar whose edge falls on the middle leaves the cell to what is under
      // it, and the hero paints its half over.
      const upright = (word.uprights ?? [])
        .filter(
          (bar) =>
            col + 0.5 > bar.from &&
            col + 0.5 < bar.to &&
            (!bar.rows || (row >= bar.rows[0] && row < bar.rows[1])),
        )
        .pop()
      if (upright) {
        line.push(upright.color)
        continue
      }
      const hoist = word.hoist
      if (
        hoist?.edge &&
        hoist.tip !== undefined &&
        !inHoist(hoist, row, col) &&
        (inHoist(hoist, row - 1, col) || inHoist(hoist, row + 1, col))
      ) {
        line.push(hoist.edge)
        continue
      }
      if (hoist && inHoist(hoist, row, col)) {
        line.push(
          word.axis === 'rows'
            ? shaded(
                hoist.color,
                amountAt(hoist.color, hoistStep[row], hoistSteps, depth),
                field,
              )
            : shadeCell(hoist.color, row, hoist.rows, field),
        )
        continue
      }
      if (word.axis === 'cols') {
        line.push(shadeCell(word.cells[col], row, WORD_ROWS, field))
        continue
      }
      const tone = toneAt(row)
      line.push(
        shaded(
          cells[row],
          (word.turned ? -1 : 1) *
            amountAt(cells[row], tone.step, tone.steps, depth),
          field,
        ),
      )
    }
    grid.push(line)
  }
  return grid
}
