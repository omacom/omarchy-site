/**
 * A national theme's wordmark is shaded the way the stock words are: in
 * flat bands that deepen toward the foot. Every flag colour is shaded down
 * its own run, a stripe, a band of the flag or the hoist: it starts at its
 * exact value at the top and steps evenly toward the field below, never
 * lighter, so the flag reads as itself and each of its bands keeps its
 * edges. Shared by the theme generator, which writes the CSS, and the hero
 * canvas, so the two cannot disagree.
 */

/** The word's grid. */
export const WORD_ROWS = 19
export const WORD_COLUMNS = 81

/** Each step is at least this many rows, and a run has at most this many
 *  steps: a run under two steps tall stays flat. */
const STEP_ROWS = 3
const MAX_STEPS = 4
/** How far toward the field a run's last step goes, for a run the word's
 *  full height. A shorter run goes as far in proportion, so a flag's
 *  narrow bands deepen gently. */
const DEPTH = 0.45
/** White deepens a little less, so it stays white rather than grey. */
const PALE_DEPTH = 0.75

/** Whites and near whites: every channel at 0xee or above. */
function isPale(color: string) {
  const n = parseInt(color.slice(1), 16)
  return [16, 8, 0].every((shift) => ((n >> shift) & 255) >= 0xee)
}

/** Part way from one #rrggbb colour to another, in sRGB. */
export function mixHex(from: string, to: string, t: number) {
  const a = parseInt(from.slice(1), 16)
  const b = parseInt(to.slice(1), 16)
  const channel = (shift: number) => {
    const x = (a >> shift) & 255
    const y = (b >> shift) & 255
    return Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(16)}${channel(8)}${channel(0)}`
}

/**
 * How far toward the field a colour moves at a row of its run: 0 for the
 * first step, more for each one below. The run is cut into steps of near
 * equal height, the taller ones first.
 */
export function shadeAt(color: string, position: number, height: number) {
  const steps = Math.min(MAX_STEPS, Math.floor(height / STEP_ROWS))
  if (steps < 2) return 0
  const tall = Math.ceil(height / steps)
  const extra = height - (tall - 1) * steps
  // The first `extra` steps are `tall` rows; the rest one fewer.
  const step =
    position < extra * tall
      ? Math.floor(position / tall)
      : extra + Math.floor((position - extra * tall) / (tall - 1))
  const depth = DEPTH * (height / WORD_ROWS) * (isPale(color) ? PALE_DEPTH : 1)
  return (depth * step) / (steps - 1)
}

/** A colour shaded for its row in a run of it that is `height` tall. */
function shadeCell(
  color: string,
  position: number,
  height: number,
  field: string,
) {
  const amount = shadeAt(color, position, height)
  return amount > 0 ? mixHex(color, field, amount) : color
}

export type WordColours = {
  axis: 'rows' | 'cols'
  /** One colour per row, or per column. */
  cells: string[]
  hoist?: { color: string; columns: number; rows: number } | null
  /** Bars down the whole word, the later ones on top, from one column up
   *  to another: a cross's upright. Flat, like the cross's arm. */
  uprights?: { color: string; from: number; to: number }[] | null
}

/**
 * The word's colour at every cell of its 19 by 81 grid, by row then
 * column: the bands or stripes, the hoist over them, each run of one
 * colour shaded down toward `field`, the ground it sits on.
 */
export function wordGrid(word: WordColours, field: string) {
  const grid: string[][] = []
  for (let row = 0; row < WORD_ROWS; row++) {
    const line: string[] = []
    for (let col = 0; col < WORD_COLUMNS; col++) {
      // The last bar listed over this column is the one on top.
      const upright = (word.uprights ?? [])
        .filter((bar) => col >= bar.from && col < bar.to)
        .pop()
      if (upright) {
        line.push(upright.color)
        continue
      }
      const hoist = word.hoist
      if (hoist && col < hoist.columns && row < hoist.rows) {
        line.push(shadeCell(hoist.color, row, hoist.rows, field))
        continue
      }
      if (word.axis === 'cols') {
        line.push(shadeCell(word.cells[col], row, WORD_ROWS, field))
        continue
      }
      // The run of this band's colour that the row sits in.
      const color = word.cells[row]
      let top = row
      while (top > 0 && word.cells[top - 1] === color) top--
      let bottom = row
      while (bottom < WORD_ROWS - 1 && word.cells[bottom + 1] === color)
        bottom++
      line.push(shadeCell(color, row - top, bottom - top + 1, field))
    }
    grid.push(line)
  }
  return grid
}
