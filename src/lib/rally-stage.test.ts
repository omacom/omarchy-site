import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceKonami } from './konami.ts'
import {
  FIXED_STEP,
  ROAD_WIDTH,
  STAGE,
  STAGE_LENGTH,
  angleDifference,
  formatTime,
  recoverCar,
  startingCar,
  stepCar,
} from './rally-stage.ts'
import type { Controls } from './rally-stage.ts'

const coast: Controls = {
  throttle: false,
  brake: false,
  steer: 0,
  drift: false,
}
function drive(seconds: number, input: Controls, car = startingCar()) {
  for (let i = 0; i < Math.round(seconds / FIXED_STEP); i++)
    stepCar(car, input, FIXED_STEP)
  return car
}

test('both secret codes accept uppercase and overlapping prefixes', () => {
  for (const sequence of [
    [
      'ArrowUp',
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'B',
      'A',
    ],
    [...'xkkkjjhlhlBA'],
  ]) {
    let keys: string[] = [],
      hit = false
    for (const key of sequence) {
      const result = advanceKonami(keys, key)
      keys = result.keys
      hit = result.hit
    }
    assert.equal(hit, true)
    assert.deepEqual(keys, [])
  }
  let keys: string[] = []
  for (const key of 'kkjjhXlhlba') {
    const result = advanceKonami(keys, key)
    assert.equal(result.hit, false)
    keys = result.keys
  }
})

test('course is continuous, ordered and long enough for a timed stage', () => {
  assert.ok(STAGE_LENGTH > 6000)
  for (let i = 1; i < STAGE.length; i++) {
    assert.ok(STAGE[i].distance > STAGE[i - 1].distance)
    assert.ok(
      Math.hypot(STAGE[i].x - STAGE[i - 1].x, STAGE[i].y - STAGE[i - 1].y) <
        ROAD_WIDTH / 4,
    )
  }
})

test('accelerates, coasts, brakes and reverses without steering at rest', () => {
  const car = drive(1, { ...coast, throttle: true })
  assert.ok(car.y < STAGE[0].y - 50)
  assert.ok(Math.abs(car.x - STAGE[0].x) < 1)
  const speed = Math.hypot(car.vx, car.vy)
  drive(0.5, coast, car)
  assert.ok(Math.hypot(car.vx, car.vy) < speed)
  drive(2, { ...coast, brake: true }, car)
  assert.ok(car.vy > 0)
  assert.ok(Math.hypot(car.vx, car.vy) <= 55)
  const stationary = drive(2, { ...coast, steer: 1 })
  assert.equal(stationary.angle, STAGE[0].angle)
})

test('handbrake permits more sideways slip than normal cornering', () => {
  const car = drive(1.4, { ...coast, throttle: true })
  const grip = { ...car },
    drift = { ...car }
  drive(0.5, { ...coast, throttle: true, steer: 1 }, grip)
  drive(0.5, { ...coast, throttle: true, steer: 1, drift: true }, drift)
  const slip = (c: typeof car) =>
    Math.abs(-c.vx * Math.sin(c.angle) + c.vy * Math.cos(c.angle))
  assert.ok(slip(drift) > slip(grip) * 1.3)
  assert.ok(drift.angle > grip.angle)
})

test('leaving the course reduces speed and recovery adds exactly three seconds', () => {
  const car = startingCar()
  car.x += ROAD_WIDTH * 3
  car.vy = -250
  car.progress = 12
  car.elapsed = 10
  stepCar(car, { ...coast, throttle: true }, FIXED_STEP)
  assert.equal(car.offroad, true)
  assert.ok(Math.hypot(car.vx, car.vy) <= 111)
  const before = car.elapsed,
    progress = car.progress
  recoverCar(car)
  assert.equal(car.elapsed, before + 3)
  assert.equal(car.progress, progress)
  assert.equal(car.x, STAGE[progress].x)
  assert.equal(car.y, STAGE[progress].y)
  assert.equal(car.vx, 0)
  assert.equal(car.vy, 0)
})

test('finish requires ordered progress and the final clock is immutable', () => {
  const car = startingCar(),
    finish = STAGE.at(-2)!
  car.x = finish.x
  car.y = finish.y
  stepCar(car, coast, FIXED_STEP)
  assert.equal(car.finished, false)
  car.progress = STAGE.length - 5
  stepCar(car, coast, FIXED_STEP)
  assert.equal(car.finished, true)
  const final = { ...car }
  stepCar(car, { ...coast, throttle: true }, FIXED_STEP)
  recoverCar(car)
  assert.deepEqual(car, final)
})

test('a steering controller can complete the entire course without recovery', () => {
  const car = startingCar()
  for (let i = 0; i < 120 * 180 && !car.finished; i++) {
    const speed = Math.hypot(car.vx, car.vy)
    const target =
      STAGE[
        Math.min(STAGE.length - 1, car.progress + Math.round(5 + speed / 22))
      ]
    const difference = angleDifference(
      Math.atan2(target.y - car.y, target.x - car.x),
      car.angle,
    )
    stepCar(
      car,
      {
        throttle: Math.abs(difference) < 0.65 || speed < 85,
        brake: Math.abs(difference) > 0.65 && speed > 110,
        steer: Math.max(-1, Math.min(1, difference * 2)),
        drift: false,
      },
      FIXED_STEP,
    )
  }
  assert.equal(
    car.finished,
    true,
    `stopped at ${((car.progress / STAGE.length) * 100).toFixed(0)}% after ${formatTime(car.elapsed)}`,
  )
  assert.ok(car.elapsed > 20)
})

test('clock formatting truncates consistently across minute boundaries', () => {
  assert.equal(formatTime(0), '0:00.00')
  assert.equal(formatTime(59.999), '0:59.99')
  assert.equal(formatTime(60), '1:00.00')
  assert.equal(formatTime(83.456), '1:23.45')
})
