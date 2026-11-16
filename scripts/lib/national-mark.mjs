/**
 * The square mark's colours on a national theme: the flag laid over the
 * mark's own 15 by 15 blocks, one flat colour a block, so every change of
 * colour falls between two blocks, as the stock mark's bands do.
 *
 * The flag is the wordmark's, read back to the flag's own layout: bands
 * and stripes keep their share of the height or width, in whole blocks; a
 * hoist, a triangle or a slant takes its place on the square; a Nordic
 * cross's upright sits left of centre, where the flag has it.
 */
import {
  tone,
  TWO_BAND_DEPTH,
  WORD_COLUMNS,
  WORD_ROWS,
} from '../../src/lib/word-shade.ts'

export const MARK_BLOCKS = 15
/** The stock mark's bands, by its rows of blocks, as Brand.tsx draws them. */
export const MARK_RAMP = [4, 2, 3, 2, 4]
const MARK_RAMP_EDGES = (() => {
  let at = 0
  return MARK_RAMP.map((size) => [at, (at += size)])
})()

/** Whole-block shares of `total`, each at least one, the largest
 *  remainders rounded up. */
export function blockShares(sizes, total = MARK_BLOCKS) {
  const sum = sizes.reduce((a, b) => a + b, 0)
  const exact = sizes.map((size) => (size / sum) * total)
  const shares = exact.map((x) => Math.max(1, Math.floor(x)))
  let left = total - shares.reduce((a, b) => a + b, 0)
  const order = exact
    .map((x, i) => ({ i, rest: x - Math.floor(x) }))
    .sort((a, b) => b.rest - a.rest || a.i - b.i)
  for (let k = 0; left > 0; k = (k + 1) % order.length) {
    shares[order[k].i]++
    left--
  }
  // Ones raised to a whole block are paid back by the largest.
  while (left < 0) {
    const big = shares.indexOf(Math.max(...shares))
    shares[big]--
    left++
  }
  return shares
}

/** Edges of runs of these sizes: [from, to) for each. */
const edgesOf = (shares) => {
  let at = 0
  return shares.map((size) => [at, (at += size)])
}

/**
 * The mark's colour at each block, by row then column, as `shown` gives
 * each flag colour by name.
 */
export function markGrid(theme, shown) {
  const N = MARK_BLOCKS
  const word = theme.word
  const runs = 'bands' in word ? word.bands : word.stripes
  const across = 'bands' in word
  const shares = blockShares(runs.map(([, size]) => size))
  const markEdges = edgesOf(shares)
  const wordEdges = edgesOf(runs.map(([, size]) => size))

  /** A word row's place on the mark, through the band it falls in. */
  const markY = (y) => {
    const i = wordEdges.findIndex(([, to]) => y <= to)
    const [from, to] = wordEdges[Math.max(0, i)]
    const [mFrom, mTo] = markEdges[Math.max(0, i)]
    return mFrom + ((y - from) / (to - from)) * (mTo - mFrom)
  }
  /** A mark row's word row, through the band it falls in. */
  const wordRow = (row) => {
    const i = markEdges.findIndex(([from, to]) => row >= from && row < to)
    const [mFrom, mTo] = markEdges[i]
    const [from, to] = wordEdges[i]
    return Math.floor(
      from + ((row + 0.5 - mFrom) / (mTo - mFrom)) * (to - from),
    )
  }

  const base = (row, col) => {
    const at = across ? row : col
    const i = markEdges.findIndex(([from, to]) => at >= from && at < to)
    return runs[i][0]
  }

  const hoist = 'hoist' in word ? word.hoist : null
  const inHoist = hoist
    ? (row, col) =>
        col < Math.round((hoist[1] / WORD_COLUMNS) * N) &&
        row < Math.round(markY(hoist[2] ?? WORD_ROWS))
    : () => false

  const triangle = 'triangle' in word ? word.triangle : null
  const inTriangle = triangle
    ? (row, col) => {
        if (row < 0 || row >= N) return false
        const columns = (triangle[1] / WORD_COLUMNS) * N
        const tip = markY(triangle[2])
        const y = row + 0.5
        const reach =
          y <= tip ? (columns * y) / tip : (columns * (N - y)) / (N - tip)
        return col + 0.5 < reach
      }
    : () => false

  const slant = 'diagonal' in word ? word.diagonal : null
  // Corner to corner on the square: a block's place along the slant.
  let slantRuns = null
  if (slant) {
    const span = WORD_COLUMNS + WORD_ROWS * slant.slope
    const widths = slant.band.map(([, cols]) =>
      Math.max(1, Math.round((cols / span) * 2 * N)),
    )
    let from = (2 * N - widths.reduce((a, b) => a + b, 0)) / 2
    slantRuns = slant.band.map(([name], i) => {
      const run = { name, from }
      from += widths[i]
      return run
    })
    slantRuns.unshift({ name: slant.above, from: -Infinity })
    slantRuns.push({ name: slant.below, from })
  }

  // A Nordic cross's upright: the word's runs down the M's middle stem,
  // its centre at column 18.5, moved to the flag's own place left of
  // centre, block for column.
  const uprights = 'uprights' in word ? word.uprights : []
  const UPRIGHT_SHIFT = 5.5 - 18.5

  // Tones, as the word's: a run the mark's full height steps through the
  // stock mark's five bands; a band of a flag in its own tones, two where
  // it has the rows; a field around lines steps down the mark and the lines
  // lie flat, as a cross's do; a slant's band lies flat too.
  const field = theme.fieldBg
  const turned = 'turned' in word && word.turned === true
  const ramp = (row) => {
    const i = MARK_RAMP_EDGES.findIndex(([from, to]) => row >= from && row < to)
    return { step: i, steps: MARK_RAMP.length }
  }
  const names = new Set(runs.map(([name]) => name))
  const ground =
    across &&
    runs.length >= 3 &&
    names.size === 2 &&
    runs[0][0] === runs.at(-1)[0]
      ? runs[0][0]
      : null
  const striped =
    ground !== null && runs.filter(([name]) => name !== ground).length >= 2
  const bandOf = (row) =>
    markEdges.findIndex(([from, to]) => row >= from && row < to)
  const bandTone = (row) => {
    const i = bandOf(row)
    const [from, to] = markEdges[i]
    const height = to - from
    const at = row - from
    if (runs.length === 2) {
      // Two bands step as the word's do: the first after five ninths of
      // it, the second after two fifths, so the lighter tone tops each.
      if (height < 2) return { step: 0, steps: 1 }
      const edge = Math.max(
        1,
        Math.min(height - 1, Math.round(height * (i === 0 ? 5 / 9 : 2 / 5))),
      )
      return { step: at >= edge ? 1 : 0, steps: 2, depth: TWO_BAND_DEPTH }
    }
    if (height < 4) return { step: 0, steps: 1 }
    return { step: at >= Math.floor(height / 2) ? 1 : 0, steps: 2 }
  }
  const shade = (name, { step, steps, depth }) =>
    tone(shown.get(name), step, steps, field, { depth, turned })

  const grid = []
  for (let row = 0; row < N; row++) {
    const line = []
    for (let col = 0; col < N; col++) {
      if (slantRuns) {
        const at = col + 0.5 + (row + 0.5)
        const i = slantRuns.findLastIndex((run) => run.from <= at)
        const name = slantRuns[i].name
        line.push(
          i === 0 || i === slantRuns.length - 1
            ? shade(name, ramp(row))
            : shown.get(name),
        )
        continue
      }
      const x = col + 0.5 - UPRIGHT_SHIFT
      const bar = uprights
        .filter(
          ([, from, to, rows]) =>
            x > from &&
            x < to &&
            (!rows || (wordRow(row) >= rows[0] && wordRow(row) < rows[1])),
        )
        .at(-1)
      if (bar) line.push(shown.get(bar[0]))
      else if (
        'edge' in word &&
        word.edge &&
        !inTriangle(row, col) &&
        (inTriangle(row - 1, col) || inTriangle(row + 1, col))
      )
        line.push(shown.get(word.edge))
      else if (inTriangle(row, col)) line.push(shade(triangle[0], ramp(row)))
      else if (inHoist(row, col)) line.push(shade(hoist[0], ramp(row)))
      else {
        const name = base(row, col)
        if (!across || runs.length === 1) line.push(shade(name, ramp(row)))
        else if (striped)
          line.push(shade(name, ramp(markEdges[bandOf(row)][0])))
        else if (ground !== null)
          line.push(name === ground ? shade(name, ramp(row)) : shown.get(name))
        else line.push(shade(name, bandTone(row)))
      }
    }
    grid.push(line)
  }
  return grid
}

/**
 * The mark in one colour, stepping down through the stock mark's five
 * bands as a one-colour word does: a favicon that is one flag colour.
 */
export function oneColourMark(color, field) {
  return Array.from({ length: MARK_BLOCKS }, (_, row) => {
    const step = MARK_RAMP_EDGES.findIndex(
      ([from, to]) => row >= from && row < to,
    )
    const ink = tone(color, step, MARK_RAMP.length, field)
    return Array(MARK_BLOCKS).fill(ink)
  })
}

/**
 * The mark's grid as a CSS image: an SVG of 15 by 15 blocks, each run of
 * one colour a single rect, run on down while the rows below repeat it.
 */
export function markImage(grid) {
  const N = grid.length
  const rects = []
  const done = grid.map((line) => line.map(() => false))
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      if (done[row][col]) continue
      const color = grid[row][col]
      let end = col
      while (end < N && grid[row][end] === color && !done[row][end]) end++
      let below = row + 1
      while (
        below < N &&
        grid[below]
          .slice(col, end)
          .every((c, i) => c === color && !done[below][col + i])
      )
        below++
      for (let r = row; r < below; r++)
        for (let c = col; c < end; c++) done[r][c] = true
      rects.push(
        `<rect x='${col}' y='${row}' width='${end - col}' height='${below - row}' fill='${color}'/>`,
      )
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${N} ${N}' shape-rendering='crispEdges'>${rects.join('')}</svg>`
  return `url("data:image/svg+xml,${svg.replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}")`
}
