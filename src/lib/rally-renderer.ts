import { ROAD_WIDTH, STAGE, clamp, nearestRoad } from './rally-stage.ts'
import type { Car, Point } from './rally-stage.ts'
import { createRallyPalette } from './rally-palette.ts'
import type { RGB } from './rally-palette.ts'

type Decoration = Point & { size: number; kind: number; shade: number }
type Dust = Point & { vx: number; vy: number; age: number; size: number }
type Mark = { a: Point; b: Point; alpha: number }
/** Resolve CSS colours in the browser; world lighting is mapped independently. */
function readPalette() {
  const css = getComputedStyle(document.documentElement)
  const mixer = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true })!
  const read = (name: string) => css.getPropertyValue(`--t-${name}`).trim()
  // A theme missing a field token still gets a drivable, on-brand course.
  const token = (name: string, fallback = name): RGB => {
    mixer.clearRect(0, 0, 1, 1)
    mixer.fillStyle = read(name) || read(fallback)
    mixer.fillRect(0, 0, 1, 1)
    const [r, g, b] = mixer.getImageData(0, 0, 1, 1).data
    return [r, g, b]
  }
  return createRallyPalette({
    bg: token('field-bg', 'bg'),
    dim: token('field-dim', 'brand'),
    mid: token('field-mid', 'brand'),
    lit: token('field-lit', 'brand'),
    hover: token('field-hover', 'brand'),
    crest: token('field-crest', 'text'),
    brand: token('brand', 'text'),
    brandInk: token('brand-ink', 'bg'),
    paper: token('bg'),
    ink: token('text'),
  })
}

export class RallyRenderer {
  private palette = readPalette()
  private ctx: CanvasRenderingContext2D
  private road = new Path2D()
  private decorations: Decoration[] = []
  private gravel: Point[] = []
  private dust: Dust[] = []
  private marks: Mark[] = []
  private camera = { x: STAGE[0].x - 180, y: STAGE[0].y - 150 }
  private width = 1000
  private height = 600
  private ratio = 1
  private lastTyres: Point[] | null = null
  private zoom = 0.9
  private particleTime = 0
  private random: () => number

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas is unavailable')
    this.ctx = ctx
    let seed = 404
    this.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    STAGE.forEach((p, i) =>
      i ? this.road.lineTo(p.x, p.y) : this.road.moveTo(p.x, p.y),
    )
    for (let i = 0; i < 2300; i++) {
      const p = {
        x: this.random() * 2850 - 600,
        y: this.random() * 5000 - 4300,
      }
      const distance = nearestRoad(p).distance
      if (distance < ROAD_WIDTH / 2 + 33) continue
      this.decorations.push({
        ...p,
        size: 12 + this.random() * 30,
        kind: this.random(),
        shade: this.random(),
      })
    }
    this.decorations.sort((a, b) => a.y - b.y)
    for (const p of STAGE) {
      for (let i = 0; i < 9; i++) {
        const side = (this.random() - 0.5) * (ROAD_WIDTH - 12)
        this.gravel.push({
          x: p.x + Math.cos(p.angle + Math.PI / 2) * side + this.random() * 8,
          y: p.y + Math.sin(p.angle + Math.PI / 2) * side + this.random() * 8,
        })
      }
    }
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.ratio = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(width * this.ratio)
    this.canvas.height = Math.round(height * this.ratio)
  }

  refreshPalette() {
    this.palette = readPalette()
  }

  reset() {
    this.dust = []
    this.marks = []
    this.lastTyres = null
    this.camera = { x: STAGE[0].x - 180, y: STAGE[0].y - 150 }
  }

  draw(
    car: Car,
    dt: number,
    active: boolean,
    drifting: boolean,
    reducedMotion: boolean,
  ) {
    const ctx = this.ctx,
      w = this.width,
      h = this.height
    const speed = Math.hypot(car.vx, car.vy)
    const follow = active ? 1 - Math.exp(-dt * 5) : 0
    this.camera.x += (car.x + car.vx * 0.65 - this.camera.x) * follow
    this.camera.y += (car.y + car.vy * 0.65 - this.camera.y) * follow
    const desiredZoom = Math.min(w / 800, h / 530, 1.3) * (1 - speed / 1500)
    this.zoom +=
      (desiredZoom - this.zoom) * (active ? 1 - Math.exp(-dt * 3) : 1)
    const z = this.zoom
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0)
    ctx.fillStyle = this.palette.ground
    ctx.fillRect(0, 0, w, h)
    ctx.translate(w / 2, h / 2)
    ctx.scale(z, z)
    ctx.translate(-this.camera.x, -this.camera.y)
    const visible = (p: Point, margin = 80) =>
      Math.abs(p.x - this.camera.x) < w / z / 2 + margin &&
      Math.abs(p.y - this.camera.y) < h / z / 2 + margin

    // Sparse ground texture, with a contrasting edge beneath the gravel.
    ctx.fillStyle = this.palette.groundDetail
    for (const d of this.decorations) {
      if (!visible(d)) continue
      ctx.beginPath()
      ctx.ellipse(d.x, d.y, d.size * 1.9, d.size * 1.2, 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const [width, color] of [
      [ROAD_WIDTH + 22, this.palette.dark],
      [ROAD_WIDTH + 12, this.palette.verge],
      [ROAD_WIDTH, this.palette.road],
      [ROAD_WIDTH - 24, this.palette.roadInner],
    ] as const) {
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.stroke(this.road)
    }
    ctx.fillStyle = this.palette.gravel
    for (const p of this.gravel)
      if (visible(p, 0)) ctx.fillRect(p.x, p.y, 1.5, 2)

    // Course stakes alternate with accent flags on the outside of bends.
    STAGE.forEach((p, i) => {
      if (i % 8 !== 0 || !visible(p)) return
      for (const side of [-1, 1]) {
        const x =
          p.x + Math.cos(p.angle + Math.PI / 2) * side * (ROAD_WIDTH / 2 + 9)
        const y =
          p.y + Math.sin(p.angle + Math.PI / 2) * side * (ROAD_WIDTH / 2 + 9)
        ctx.fillStyle = this.palette.dark
        ctx.fillRect(x + 2, y + 2, 4, 8)
        ctx.fillStyle = i % 24 === 0 ? this.palette.accent : this.palette.text
        ctx.fillRect(x, y - 4, 3, 8)
      }
    })
    this.gate(STAGE[2], 'START', false)
    this.gate(STAGE.at(-3)!, 'FINISH', true)

    if (active && dt > 0) {
      const tyres = [-1, 1].map((side) => ({
        x:
          car.x -
          Math.cos(car.angle) * 11 +
          Math.cos(car.angle + Math.PI / 2) * side * 8,
        y:
          car.y -
          Math.sin(car.angle) * 11 +
          Math.sin(car.angle + Math.PI / 2) * side * 8,
      }))
      if (
        this.lastTyres &&
        speed > 45 &&
        (drifting || Math.abs(car.yaw) > 0.75)
      ) {
        for (let i = 0; i < 2; i++) {
          if (
            Math.hypot(
              tyres[i].x - this.lastTyres[i].x,
              tyres[i].y - this.lastTyres[i].y,
            ) < 35
          )
            this.marks.push({
              a: this.lastTyres[i],
              b: tyres[i],
              alpha: drifting ? 0.3 : 0.13,
            })
        }
      }
      this.lastTyres = tyres
      if (this.marks.length > 1800)
        this.marks.splice(0, this.marks.length - 1800)
      this.particleTime += dt
      if (!reducedMotion && speed > 30 && this.particleTime > 0.035) {
        this.particleTime = 0
        for (const p of tyres)
          this.dust.push({
            ...p,
            vx: -car.vx * 0.13 + (this.random() - 0.5) * 25,
            vy: -car.vy * 0.13 + (this.random() - 0.5) * 25,
            age: 0,
            size: (car.offroad ? 6 : 3) + this.random() * 4,
          })
      }
    }
    ctx.strokeStyle = this.palette.dark
    ctx.lineWidth = 3
    for (const mark of this.marks) {
      if (!visible(mark.a)) continue
      ctx.globalAlpha = mark.alpha
      ctx.beginPath()
      ctx.moveTo(mark.a.x, mark.a.y)
      ctx.lineTo(mark.b.x, mark.b.y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    this.paintCar(car)
    for (const puff of this.dust) {
      puff.age += dt
      puff.x += puff.vx * dt
      puff.y += puff.vy * dt
      ctx.globalAlpha = Math.max(0, 0.24 * (1 - puff.age / 1.1))
      ctx.fillStyle = this.palette.dust
      ctx.beginPath()
      ctx.arc(puff.x, puff.y, puff.size + puff.age * 12, 0, Math.PI * 2)
      ctx.fill()
    }
    this.dust = this.dust.filter((p) => p.age < 1.1)
    ctx.globalAlpha = 1

    for (const d of this.decorations) {
      if (!visible(d)) continue
      ctx.save()
      ctx.translate(d.x, d.y)
      if (d.kind < 0.13) {
        ctx.fillStyle = this.palette.shadow
        ctx.fillRect(-d.size / 3 + 5, 0, d.size, d.size * 0.7)
        ctx.fillStyle = this.palette.rock
        ctx.beginPath()
        ctx.moveTo(-d.size / 2, 0)
        ctx.lineTo(-d.size / 3, -d.size / 2)
        ctx.lineTo(d.size / 3, -d.size / 3)
        ctx.lineTo(d.size / 2, d.size / 4)
        ctx.lineTo(0, d.size / 2)
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.fillStyle = this.palette.shadow
        ctx.beginPath()
        ctx.ellipse(12, 14, d.size, d.size * 0.8, 0.6, 0, Math.PI * 2)
        ctx.fill()
        for (let layer = 0; layer < 3; layer++) {
          const radius = d.size * (1 - layer * 0.23)
          ctx.fillStyle = [
            this.palette.treeBase,
            d.shade > 0.5 ? this.palette.treeMidAlt : this.palette.treeMid,
            d.shade > 0.5 ? this.palette.treeTopAlt : this.palette.treeTop,
          ][layer]
          ctx.beginPath()
          for (let i = 0; i < 16; i++) {
            const angle = (i * Math.PI) / 8 + d.shade * 2
            const r = radius * (i % 2 ? 0.72 : 1)
            const x = Math.cos(angle) * r - layer * 2,
              y = Math.sin(angle) * r - layer * 3
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.fill()
        }
      }
      ctx.restore()
    }
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0)
    // Gentle fixed vignette, independent of motion preferences.
    const vignette = ctx.createRadialGradient(
      w / 2,
      h / 2,
      h * 0.2,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.65,
    )
    vignette.addColorStop(0, 'transparent')
    vignette.addColorStop(1, this.palette.dark)
    ctx.fillStyle = vignette
    ctx.globalAlpha = this.palette.daylight ? 0.1 : 0.4
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  }

  private gate(point: (typeof STAGE)[number], label: string, finish: boolean) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(point.x, point.y)
    ctx.rotate(point.angle + Math.PI / 2)
    for (let i = 0; i < 12; i++)
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = (i + j) % 2 ? this.palette.dark : this.palette.text
        ctx.fillRect(
          -ROAD_WIDTH / 2 + (i * ROAD_WIDTH) / 12,
          j * 7,
          ROAD_WIDTH / 12,
          7,
        )
      }
    for (const side of [-1, 1]) {
      ctx.fillStyle = finish ? this.palette.accent : this.palette.text
      ctx.fillRect(side * (ROAD_WIDTH / 2 + 16) - 11, -22, 22, 36)
      ctx.fillStyle = finish ? this.palette.accentInk : this.palette.dark
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'center'
      ctx.save()
      ctx.translate(side * (ROAD_WIDTH / 2 + 16), -4)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(label, 0, 3)
      ctx.restore()
    }
    ctx.restore()
  }

  private paintCar(car: Car) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(car.x, car.y)
    ctx.rotate(car.angle + Math.PI / 2)
    ctx.fillStyle = this.palette.shadow
    ctx.fillRect(-9, -16, 24, 40)
    ctx.fillStyle = this.palette.dark
    ctx.fillRect(-11, -21, 22, 42)
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(side * 10, -9)
      ctx.rotate(clamp(car.yaw * 0.2, -0.4, 0.4))
      ctx.fillRect(-3, -5, 6, 10)
      ctx.restore()
      ctx.fillRect(side * 10 - 3, 9, 6, 10)
    }
    ctx.fillStyle = this.palette.text
    ctx.fillRect(-10, -20, 20, 40)
    ctx.fillRect(-8, -23, 16, 4)
    ctx.fillStyle = this.palette.carSide
    ctx.fillRect(-11, -7, 3, 20)
    ctx.fillStyle = this.palette.glass
    ctx.fillRect(-7, -8, 14, 8)
    ctx.fillRect(-7, 10, 14, 6)
    ctx.fillStyle = this.palette.glassShine
    ctx.fillRect(-6, -7, 11, 2)
    ctx.fillStyle = this.palette.accent
    ctx.fillRect(3, -22, 4, 14)
    ctx.fillRect(3, 16, 4, 5)
    ctx.fillStyle = this.palette.livery
    ctx.fillRect(-7, -22, 8, 10)
    ctx.fillStyle = this.palette.dark
    ctx.font = 'bold 8px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('04', 0, 8)
    ctx.fillStyle = this.palette.dark
    ctx.fillRect(-13, 17, 26, 4)
    ctx.fillStyle = this.palette.headlight
    ctx.fillRect(-9, -23, 5, 3)
    ctx.fillRect(4, -23, 5, 3)
    ctx.fillStyle = this.palette.accent
    ctx.fillRect(-9, 21, 5, 2)
    ctx.fillRect(4, 21, 5, 2)
    ctx.restore()
  }
}
