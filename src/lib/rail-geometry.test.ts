import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  edgesAt,
  slideSpan,
  slideTarget,
  startPad,
  travelFrom,
} from './rail-geometry.ts'

// Measured from the running site at a 1440px viewport. The right-to-left
// figures are the Arabic build's; the left-to-right ones are the same rails
// mirrored, so the pairs below describe one layout read from either end.
const video = {
  ltr: {
    clientWidth: 1425,
    reach: 6720,
    width: 1104,
    offsets: [161, 1281, 2401],
  },
  rtl: {
    clientWidth: 1425,
    reach: 6720,
    width: 1104,
    offsets: [161, -959, -2079],
  },
}
const meetups = {
  ltr: { clientWidth: 1425, reach: 3102, width: 258, offsets: [160, 442, 724] },
  rtl: {
    clientWidth: 1425,
    reach: 3102,
    width: 258,
    offsets: [1007, 725, 443],
  },
}

test('a centred slide is targeted the same distance along either direction', () => {
  const centre = (rail: typeof video.ltr, i: number, rtl: boolean) =>
    slideTarget({
      align: 'center',
      slideOffset: rail.offsets[i],
      slideWidth: rail.width,
      firstOffset: rail.offsets[0],
      clientWidth: rail.clientWidth,
      reach: rail.reach,
      rtl,
    })

  // Left to right the rail counts up from its starting edge; right to left it
  // counts down from it. Either way the second slide is one span along.
  assert.equal(centre(video.ltr, 1, false), 1120.5)
  assert.equal(centre(video.rtl, 1, true), -1119.5)
  assert.equal(centre(video.rtl, 2, true), -2239.5)
})

test('every slide of a right-to-left rail gets its own target', () => {
  // The bug this guards: clamping to a left-to-right range collapsed every
  // right-to-left target onto zero, so the rail sprang back to the first
  // slide however it was dragged or paged.
  const targets = video.rtl.offsets.map((slideOffset) =>
    slideTarget({
      align: 'center',
      slideOffset,
      slideWidth: video.rtl.width,
      firstOffset: video.rtl.offsets[0],
      clientWidth: video.rtl.clientWidth,
      reach: video.rtl.reach,
      rtl: true,
    }),
  )
  assert.equal(new Set(targets).size, targets.length)
  assert.ok(targets.slice(1).every((to) => to < 0))
})

test('a target never asks for travel the rail does not have', () => {
  const far = (rtl: boolean, slideOffset: number) =>
    slideTarget({
      align: 'center',
      slideOffset,
      slideWidth: 1104,
      firstOffset: 161,
      clientWidth: 1425,
      reach: 6720,
      rtl,
    })
  assert.equal(far(false, 99999), 6720)
  assert.equal(far(false, -99999), 0)
  assert.equal(far(true, -99999), -6720)
  assert.equal(far(true, 99999), 0)
})

test('a rail aligned to the start lines slides up with its leading edge', () => {
  const start = (rail: typeof meetups.ltr, i: number, rtl: boolean) =>
    slideTarget({
      align: 'start',
      slideOffset: rail.offsets[i],
      slideWidth: rail.width,
      firstOffset: rail.offsets[0],
      clientWidth: rail.clientWidth,
      reach: rail.reach,
      rtl,
    })
  assert.equal(start(meetups.ltr, 0, false), 0)
  assert.equal(start(meetups.ltr, 2, false), 564)
  assert.equal(start(meetups.rtl, 0, true), 0)
  assert.equal(start(meetups.rtl, 2, true), -564)
})

test('the padding in front of the first slide is measured from the near edge', () => {
  // Right to left the first slide sits against the far end of the axis, so
  // its own offset is the room behind it rather than in front.
  assert.equal(
    startPad({
      clientWidth: 1425,
      firstOffset: 160,
      firstWidth: 258,
      rtl: false,
    }),
    160,
  )
  assert.equal(
    startPad({
      clientWidth: 1425,
      firstOffset: 1007,
      firstWidth: 258,
      rtl: true,
    }),
    160,
  )
})

test('the span between slides is a distance, not a direction', () => {
  assert.equal(slideSpan(161, 1281, 1104), 1120)
  assert.equal(slideSpan(161, -959, 1104), 1120)
  // A rail of one slide steps by its own width.
  assert.equal(slideSpan(161, undefined, 1104), 1104)
})

test('travel is counted up from the starting edge in either direction', () => {
  assert.equal(travelFrom(0, false), 0)
  assert.equal(travelFrom(3360, false), 3360)
  assert.equal(travelFrom(0, true), 0)
  assert.equal(travelFrom(-3360, true), 3360)
})

test('both ends of the travel are reported in either direction', () => {
  assert.deepEqual(edgesAt(0, 6720, false), { start: true, end: false })
  assert.deepEqual(edgesAt(6720, 6720, false), { start: false, end: true })
  // The bug this guards: right to left the rail read as parked at its start
  // forever, so paging back stayed disabled and paging on never stopped.
  assert.deepEqual(edgesAt(0, 6720, true), { start: true, end: false })
  assert.deepEqual(edgesAt(-6720, 6720, true), { start: false, end: true })
})

test('a rail with nothing to scroll sits against both of its ends', () => {
  assert.deepEqual(edgesAt(0, 0, false), { start: true, end: true })
  assert.deepEqual(edgesAt(0, 0, true), { start: true, end: true })
})
