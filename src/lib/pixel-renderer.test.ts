import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPixelRenderer } from './pixel-renderer.ts'
import type { PixelGrid } from './pixel-renderer.ts'

class Raster {
  fillStyle: CanvasRenderingContext2D['fillStyle'] = '0'
  pixels: Uint8Array
  fills = 0
  path: number[][] = []

  constructor() {
    this.pixels = new Uint8Array(17 * 13)
  }

  fillRect(x: number, y: number, width: number, height: number) {
    this.fills++
    this.paint(x, y, width, height)
  }

  beginPath() {
    this.path = []
  }

  rect(x: number, y: number, width: number, height: number) {
    this.path.push([x, y, width, height])
  }

  fill() {
    this.fills++
    for (const rect of this.path)
      this.paint(...(rect as [number, number, number, number]))
  }

  paint(x: number, y: number, width: number, height: number) {
    for (let row = Math.max(0, y); row < Math.min(13, y + height); row++)
      for (let col = Math.max(0, x); col < Math.min(17, x + width); col++)
        this.pixels[row * 17 + col] = Number(this.fillStyle)
  }
}

const grid: PixelGrid = {
  width: 17,
  height: 13,
  cols: 7,
  rows: 6,
  x: 3.1,
  y: 2.2,
  cellWidth: 2.4,
  cellHeight: 2.3,
  firstCol: -2,
  firstRow: -2,
}

function setup() {
  const ctx = new Raster()
  const renderer = createPixelRenderer(ctx)
  renderer.setPalette(['0', '1', '2'])
  renderer.setGrid(grid)
  return { ctx, renderer }
}

test('unchanged cells issue no drawing calls; changes batch by ink', () => {
  const { ctx, renderer } = setup()
  renderer.begin()
  for (const index of [8, 9, 10]) renderer.cell(index, 1)
  renderer.flush()
  assert.equal(ctx.fills, 2) // Background and one ink batch.
  const pixels = ctx.pixels.slice()
  renderer.begin()
  for (const index of [8, 9, 10]) renderer.cell(index, 1)
  renderer.flush()
  assert.equal(ctx.fills, 2)
  assert.deepEqual(ctx.pixels, pixels)
  renderer.begin()
  renderer.cell(8, 0)
  renderer.flush()
  assert.equal(ctx.fills, 3)
  assert.notDeepEqual(ctx.pixels, pixels)
})

test('palette and geometry changes invalidate retained cells', () => {
  const { ctx, renderer } = setup()
  renderer.begin()
  renderer.cell(8, 1)
  renderer.flush()
  const before = ctx.pixels.slice()
  renderer.setPalette(['3', '4', '5'])
  renderer.begin()
  renderer.cell(8, 1)
  renderer.flush()
  assert.ok(ctx.pixels.includes(4))
  assert.ok(!ctx.pixels.includes(1))
  assert.notDeepEqual(ctx.pixels, before)
  renderer.setGrid({ ...grid, x: 5.1 })
  renderer.begin()
  renderer.cell(8, 1)
  renderer.flush()
  assert.equal(ctx.fills, 6)
})

test('sampled patches refresh only when their pixels change, including clears', () => {
  const { renderer } = setup()
  renderer.begin()
  renderer.flush()
  assert.equal(renderer.hasDamage(1, 0, 2, 2), true)
  assert.equal(renderer.hasDamage(-5, -5, 1, 1), false)

  renderer.begin()
  renderer.cell(8, 1)
  renderer.flush()
  assert.equal(renderer.hasDamage(1, 0, 2, 2), true)
  assert.equal(renderer.hasDamage(3, 0, 1, 2), false)
  assert.equal(renderer.hasDamage(8, 8, 2, 2), false)

  renderer.begin()
  renderer.cell(8, 1)
  renderer.flush()
  assert.equal(renderer.hasDamage(1, 0, 2, 2), false)

  renderer.begin()
  renderer.cell(8, 0)
  renderer.flush()
  assert.equal(renderer.hasDamage(1, 0, 2, 2), true)

  renderer.setPalette(['3', '4', '5'])
  renderer.begin()
  renderer.flush()
  assert.equal(renderer.hasDamage(8, 8, 2, 2), true)
  assert.equal(renderer.hasDamage(8, 8, 0, 2), false)
})

test('full repaint removes partial-cell effect trails and repaints retained ink', () => {
  const { ctx, renderer } = setup()
  renderer.begin()
  renderer.cell(8, 1)
  renderer.flush()
  const resting = ctx.pixels.slice()
  ctx.fillStyle = '9'
  ctx.fillRect(2, 1, 5, 3)
  renderer.begin(true)
  renderer.cell(8, 1)
  renderer.flush()
  assert.deepEqual(ctx.pixels, resting)
})

test('incremental frames match full repainting across fractional and clipped cells', () => {
  const { ctx, renderer } = setup()
  const expected = new Raster()
  let seed = 123
  for (let frame = 0; frame < 100; frame++) {
    expected.fillStyle = '0'
    expected.fillRect(0, 0, grid.width, grid.height)
    renderer.begin()
    for (let index = 0; index < grid.cols * grid.rows; index++) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      const color = seed % 3
      renderer.cell(index, color)
      expected.fillStyle = String(color)
      const col = grid.firstCol + (index % grid.cols)
      const row = grid.firstRow + Math.floor(index / grid.cols)
      const x = Math.round(grid.x + col * grid.cellWidth)
      const y = Math.round(grid.y + row * grid.cellHeight)
      expected.fillRect(
        x,
        y,
        Math.round(grid.x + (col + 1) * grid.cellWidth) - x,
        Math.round(grid.y + (row + 1) * grid.cellHeight) - y,
      )
    }
    renderer.flush()
    assert.deepEqual(ctx.pixels, expected.pixels, `frame ${frame}`)
  }
})
