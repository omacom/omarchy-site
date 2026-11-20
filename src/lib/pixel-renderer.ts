type Context = Pick<
  CanvasRenderingContext2D,
  'fillStyle' | 'fillRect' | 'beginPath' | 'rect' | 'fill'
>

export type PixelGrid = {
  width: number
  height: number
  cols: number
  rows: number
  x: number
  y: number
  cellWidth: number
  cellHeight: number
  firstCol: number
  firstRow: number
}

/** Retain unchanged lattice cells and paint changes in one batch per ink. */
export function createPixelRenderer(ctx: Context) {
  let grid: PixelGrid
  let colors: readonly string[] = []
  let previous = new Uint8Array(0)
  let xs = new Int32Array(0)
  let ys = new Int32Array(0)
  let batches: number[][] = []
  let invalid = true
  let fullDamage = true

  return {
    setGrid(next: PixelGrid) {
      grid = next
      previous = new Uint8Array(grid.cols * grid.rows)
      xs = new Int32Array(grid.cols + 1)
      ys = new Int32Array(grid.rows + 1)
      for (let c = 0; c <= grid.cols; c++)
        xs[c] = Math.round(grid.x + (grid.firstCol + c) * grid.cellWidth)
      for (let r = 0; r <= grid.rows; r++)
        ys[r] = Math.round(grid.y + (grid.firstRow + r) * grid.cellHeight)
      invalid = true
    },
    setPalette(next: readonly string[]) {
      colors = next
      batches = colors.map(() => [])
      invalid = true
    },
    begin(full = false) {
      for (const batch of batches) batch.length = 0
      fullDamage = invalid || full
      if (!invalid && !full) return
      ctx.fillStyle = colors[0]
      ctx.fillRect(0, 0, grid.width, grid.height)
      previous.fill(0)
      invalid = false
    },
    cell(index: number, color: number) {
      if (index < 0 || index >= previous.length) return
      if (previous[index] === color) return
      previous[index] = color
      batches[color].push(index)
    },
    flush() {
      for (let color = 0; color < batches.length; color++) {
        const cells = batches[color]
        if (cells.length === 0) continue
        ctx.fillStyle = colors[color]
        ctx.beginPath()
        for (const index of cells) {
          if (previous[index] !== color) continue
          const c = index % grid.cols
          const r = Math.floor(index / grid.cols)
          ctx.rect(xs[c], ys[r], xs[c + 1] - xs[c], ys[r + 1] - ys[r])
        }
        ctx.fill()
      }
    },
    /** Whether a sampled patch needs refreshing after this frame. */
    hasDamage(x: number, y: number, width: number, height: number) {
      if (
        width <= 0 ||
        height <= 0 ||
        x >= grid.width ||
        y >= grid.height ||
        x + width <= 0 ||
        y + height <= 0
      )
        return false
      if (fullDamage) return true
      for (let color = 0; color < batches.length; color++) {
        for (const index of batches[color]) {
          if (previous[index] !== color) continue
          const c = index % grid.cols
          const r = Math.floor(index / grid.cols)
          if (
            xs[c] < x + width &&
            xs[c + 1] > x &&
            ys[r] < y + height &&
            ys[r + 1] > y
          )
            return true
        }
      }
      return false
    },
  }
}
