export type Point = { x: number; y: number }
export type RoadPoint = Point & { distance: number; angle: number }
export type Controls = {
  throttle: boolean
  brake: boolean
  steer: number
  drift: boolean
}
export type Car = Point & {
  vx: number
  vy: number
  angle: number
  yaw: number
  progress: number
  elapsed: number
  offroad: boolean
  finished: boolean
}

export const ROAD_WIDTH = 138
export const FIXED_STEP = 1 / 120
export const BEST_KEY = 'omarchy-rally-best'
const anchors = [
  [0, 180],
  [0, -220],
  [100, -560],
  [440, -780],
  [810, -690],
  [1020, -940],
  [870, -1230],
  [500, -1290],
  [240, -1570],
  [430, -1870],
  [850, -1850],
  [1250, -1650],
  [1570, -1820],
  [1620, -2180],
  [1390, -2440],
  [970, -2470],
  [740, -2780],
  [960, -3090],
  [1360, -3170],
  [1610, -3440],
  [1590, -3800],
]

export function buildStage(): RoadPoint[] {
  const points: RoadPoint[] = []
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[Math.max(0, i - 1)]
    const b = anchors[i],
      c = anchors[i + 1],
      d = anchors[Math.min(anchors.length - 1, i + 2)]
    const steps = Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / 12)
    for (let j = 0; j < steps; j++) {
      const t = j / steps
      const coordinate = (axis: number) =>
        0.5 *
        (2 * b[axis] +
          (-a[axis] + c[axis]) * t +
          (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * t * t +
          (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * t * t * t)
      const x = coordinate(0),
        y = coordinate(1),
        previous = points.at(-1)
      points.push({
        x,
        y,
        distance: previous
          ? previous.distance + Math.hypot(x - previous.x, y - previous.y)
          : 0,
        angle: 0,
      })
    }
  }
  const last = anchors.at(-1)!,
    previous = points.at(-1)!
  points.push({
    x: last[0],
    y: last[1],
    distance:
      previous.distance +
      Math.hypot(last[0] - previous.x, last[1] - previous.y),
    angle: 0,
  })
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)],
      b = points[Math.min(points.length - 1, i + 1)]
    points[i].angle = Math.atan2(b.y - a.y, b.x - a.x)
  }
  return points
}

export const STAGE = buildStage()
export const STAGE_LENGTH = STAGE.at(-1)!.distance
export const stageKm = (STAGE_LENGTH / 3000).toFixed(1)
export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n))
export const angleDifference = (a: number, b: number) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b))

export function startingCar(): Car {
  return {
    x: STAGE[0].x,
    y: STAGE[0].y,
    vx: 0,
    vy: 0,
    angle: STAGE[0].angle,
    yaw: 0,
    progress: 0,
    elapsed: 0,
    offroad: false,
    finished: false,
  }
}

/** Search locally, so a neighbouring stretch cannot skip part of the stage. */
export function nearestRoad(point: Point, start = 0, end = STAGE.length - 1) {
  let index = start,
    distance = Infinity
  for (let i = start; i <= end; i++) {
    const d = Math.hypot(point.x - STAGE[i].x, point.y - STAGE[i].y)
    if (d < distance) {
      distance = d
      index = i
    }
  }
  return { index, distance }
}

/** Mutates only this run's car; call at FIXED_STEP for frame-independent handling. */
export function stepCar(car: Car, input: Controls, dt: number) {
  if (car.finished) return
  car.elapsed += dt
  const road = nearestRoad(
    car,
    Math.max(0, car.progress - 22),
    Math.min(STAGE.length - 1, car.progress + 30),
  )
  car.offroad = road.distance > ROAD_WIDTH / 2 - 8
  if (road.distance < ROAD_WIDTH * 0.8)
    car.progress = Math.max(car.progress, road.index)
  const forward = car.vx * Math.cos(car.angle) + car.vy * Math.sin(car.angle)
  const steer = clamp(input.steer, -1, 1)
  const targetYaw =
    steer * clamp(forward / 85, -0.65, 1) * (input.drift ? 2.35 : 1.65)
  car.yaw += (targetYaw - car.yaw) * Math.min(1, dt * 7)
  car.angle += car.yaw * dt
  let speed = car.vx * Math.cos(car.angle) + car.vy * Math.sin(car.angle)
  const lateral = -car.vx * Math.sin(car.angle) + car.vy * Math.cos(car.angle)
  if (input.throttle) speed += 150 * dt
  if (input.brake) speed -= (speed > 0 ? 230 : 70) * dt
  speed *= Math.exp(-(car.offroad ? 1.9 : input.drift ? 0.9 : 0.45) * dt)
  speed = clamp(speed, -55, car.offroad ? 110 : 290)
  // The rear steps out under handbraking, then grips progressively on release.
  const slip =
    lateral * Math.exp(-(input.drift ? 1.35 : car.offroad ? 3.5 : 7.5) * dt)
  car.vx = Math.cos(car.angle) * speed - Math.sin(car.angle) * slip
  car.vy = Math.sin(car.angle) * speed + Math.cos(car.angle) * slip
  car.x += car.vx * dt
  car.y += car.vy * dt
  if (car.progress >= STAGE.length - 3 && road.distance < ROAD_WIDTH / 2)
    car.finished = true
}

export function recoverCar(car: Car) {
  if (car.finished) return
  const road = STAGE[car.progress]
  Object.assign(car, {
    x: road.x,
    y: road.y,
    angle: road.angle,
    vx: 0,
    vy: 0,
    yaw: 0,
    offroad: false,
    elapsed: car.elapsed + 3,
  })
}

export function formatTime(seconds: number) {
  const centiseconds = Math.floor(Math.max(0, seconds) * 100)
  return `${Math.floor(centiseconds / 6000)}:${String(Math.floor(centiseconds / 100) % 60).padStart(2, '0')}.${String(centiseconds % 100).padStart(2, '0')}`
}

export function paceNote(progress: number) {
  const here = STAGE[Math.min(progress + 8, STAGE.length - 1)]
  const ahead = STAGE[Math.min(progress + 27, STAGE.length - 1)]
  if (STAGE_LENGTH - STAGE[progress].distance < 330)
    return { arrow: '↑', text: 'Finish ahead' }
  const bend = angleDifference(ahead.angle, here.angle)
  if (Math.abs(bend) < 0.2) return { arrow: '↑', text: 'Flat out' }
  return {
    arrow: bend > 0 ? '↱' : '↰',
    text: `${Math.abs(bend) > 0.85 ? 'Tight' : 'Easy'} ${bend > 0 ? 'right' : 'left'}`,
  }
}
