import assert from 'node:assert/strict'
import { test } from 'node:test'
import { boxAround, fitOnMap, pinPaintOrder, wholeMap } from './meetup-map.ts'

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

test('upcoming pins paint above past ones, and a lit pin above a dim one', () => {
  const pins = [
    { id: 'past-lit', past: true, shown: true },
    { id: 'next-dim', past: false, shown: false },
    { id: 'next-lit', past: false, shown: true },
    { id: 'past-dim', past: true, shown: false },
  ]
  const order = pins.sort(pinPaintOrder).map((pin) => pin.id)
  assert.deepEqual(order, ['past-dim', 'past-lit', 'next-dim', 'next-lit'])
})

test('a pin with no coordinates leaves the whole map up', () => {
  assert.deepEqual(
    boxAround(
      [
        { x: Number.NaN, y: 10 },
        { x: 4, y: Number.POSITIVE_INFINITY },
      ],
      W,
      H,
    ),
    wholeMap(W, H),
  )
  const mixed = boxAround(
    [
      { x: Number.NaN, y: 0 },
      { x: 0, y: 0 },
    ],
    W,
    H,
  )
  assert.ok(mixed.width < W, 'a real city beside a missing one still gets a frame')
})

test('a zero-size map is not divided into a frame', () => {
  assert.deepEqual(boxAround([{ x: 1, y: 1 }], 0, 0), wholeMap(0, 0))
})

test('two pins in the same state keep their order', () => {
  assert.equal(
    pinPaintOrder({ past: false, shown: true }, { past: false, shown: true }),
    0,
  )
})
