import assert from 'node:assert/strict'
import { test } from 'node:test'
import { boxAround, fitOnMap, wholeMap } from './meetup-map.ts'

const W = 1000
const H = 440

test('a city in the corner stays on the map', () => {
  const box = boxAround([{ x: 0, y: 0 }], W, H)
  assert.ok(box.x >= 0, `x ${box.x}`)
  assert.ok(box.y >= 0, `y ${box.y}`)
  assert.ok(box.x + box.width <= W + 1e-9, `right ${box.x + box.width}`)
  assert.ok(box.y + box.height <= H + 1e-9, `bottom ${box.y + box.height}`)
  assert.ok(box.x <= 0 && box.y <= 0 + box.height, 'the corner city is inside the frame')
  assert.ok(0 >= box.x && 0 <= box.x + box.width)
  assert.ok(0 >= box.y && 0 <= box.y + box.height)
})

test('a city in the opposite corner stays on the map', () => {
  const box = boxAround([{ x: W, y: H }], W, H)
  assert.ok(box.x >= 0)
  assert.ok(box.y >= 0)
  assert.ok(box.x + box.width <= W + 1e-9)
  assert.ok(box.y + box.height <= H + 1e-9)
  assert.ok(W >= box.x && W <= box.x + box.width)
  assert.ok(H >= box.y && H <= box.y + box.height)
})

test('no cities shows the whole map', () => {
  assert.deepEqual(boxAround([], W, H), wholeMap(W, H))
})

test('a frame already on the map is not moved', () => {
  const box = { x: 100, y: 40, width: 200, height: 88 }
  assert.deepEqual(fitOnMap(box, W, H), box)
})

test('a frame larger than the map shows everything', () => {
  assert.deepEqual(
    fitOnMap({ x: -10, y: -10, width: W + 20, height: 100 }, W, H),
    wholeMap(W, H),
  )
})
