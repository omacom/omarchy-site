import assert from 'node:assert/strict'
import { test } from 'node:test'
import { startingEngine, stepEngine } from './rally-audio.ts'
import { startingCar } from './rally-stage.ts'
import type { Car, Controls } from './rally-stage.ts'

const input = { throttle: false, brake: false, steer: 0, drift: false }
const atSpeed = (speed: number) => ({ ...startingCar(), angle: 0, vx: speed })
function run(
  car: Car,
  controls: Controls = input,
  engine = startingEngine(),
  seconds = 1,
) {
  let voice = stepEngine(engine, car, controls, 0)
  for (let i = 0; i < Math.round(seconds * 120); i++)
    voice = stepEngine(engine, car, controls, 1 / 120)
  return { engine, voice }
}

test('idle has a low exhaust pulse without gravel or tyre noise', () => {
  const { voice } = run(startingCar())
  assert.ok(voice.frequency * 5 > 30 && voice.frequency * 5 < 60)
  assert.equal(voice.gravel, 0)
  assert.equal(voice.scrub, 0)
  assert.equal(run(startingCar(), { ...input, drift: true }).voice.scrub, 0)
})

test('throttle builds revs progressively rather than jumping immediately', () => {
  const engine = startingEngine(),
    initial = engine.rpm
  const first = stepEngine(
    engine,
    startingCar(),
    { ...input, throttle: true },
    1 / 120,
  )
  assert.ok(engine.rpm > initial && engine.rpm < initial + 100)
  const sustained = run(
    startingCar(),
    { ...input, throttle: true },
    engine,
  ).voice
  assert.ok(sustained.frequency > first.frequency * 2)
  assert.ok(sustained.engine > first.engine)
})

test('upshift drops revs and does not chatter when speed crosses the same threshold', () => {
  const { engine } = run(atSpeed(69), { ...input, throttle: true })
  assert.equal(engine.gear, 0)
  const highRpm = engine.rpm
  stepEngine(engine, atSpeed(72), { ...input, throttle: true }, 1 / 120)
  assert.equal(engine.gear, 1)
  assert.ok(engine.shift > 0)
  for (let i = 0; i < 240; i++) {
    stepEngine(
      engine,
      atSpeed(i % 2 ? 69 : 72),
      { ...input, throttle: true },
      1 / 120,
    )
    assert.equal(engine.gear, 1)
  }
  assert.equal(engine.shift, 0)
  assert.ok(engine.rpm < highRpm - 1000)
  run(atSpeed(45), input, engine)
  assert.equal(engine.gear, 0)
})

test('a sideways slide increases surface noise without raising engine revs', () => {
  const car = atSpeed(160),
    straight = run(car)
  const slide = run({ ...car, vy: 80 })
  assert.equal(straight.engine.rpm, slide.engine.rpm)
  assert.equal(straight.voice.scrub, 0)
  assert.ok(slide.voice.scrub > straight.voice.scrub)
  assert.ok(run({ ...car, offroad: true }).voice.gravel > straight.voice.gravel)
  assert.ok(run(car, { ...input, drift: true }).voice.scrub > 0)
})

test('turbo spools under load and releases once on lift-off', () => {
  const car = atSpeed(160)
  const { engine } = run(car, { ...input, throttle: true }, startingEngine(), 3)
  assert.ok(engine.boost > 0.5)
  assert.equal(stepEngine(engine, car, input, 1 / 120).lift, true)
  assert.equal(stepEngine(engine, car, input, 1 / 120).lift, false)
  run(car, input, engine)
  assert.ok(engine.boost < 0.01)
  const idle = run(startingCar(), { ...input, throttle: true }).engine
  assert.equal(stepEngine(idle, startingCar(), input, 1 / 120).lift, false)
})

test('reverse cannot use forward gears and all sound parameters remain bounded', () => {
  const engine = startingEngine()
  engine.gear = 4
  for (let speed = -55; speed <= 300; speed += 5) {
    for (const throttle of [false, true]) {
      const { voice } = run(
        { ...atSpeed(speed), vy: 30, offroad: true },
        { ...input, throttle, drift: true },
        engine,
      )
      for (const value of Object.values(voice)) {
        if (typeof value === 'number')
          assert.ok(Number.isFinite(value) && value >= 0)
      }
      if (speed < 0) assert.equal(engine.gear, 0)
      assert.ok(engine.rpm >= 950 && engine.rpm <= 6900)
      assert.ok(voice.engine <= 0.2)
      assert.ok(voice.gravel <= 0.17)
      assert.ok(voice.scrub <= 0.12)
      assert.ok(voice.cutoff < 4000)
    }
  }
})
