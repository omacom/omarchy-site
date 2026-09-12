import { RallyRenderer } from './rally-renderer.ts'
import { RallyAudio, RALLY_MUTE_KEY, readRallyMuted } from './rally-audio.ts'
import {
  BEST_KEY,
  FIXED_STEP,
  recoverCar,
  startingCar,
  stepCar,
} from './rally-stage.ts'

export type Phase = 'ready' | 'countdown' | 'racing' | 'paused' | 'finished'
export type View = {
  phase: Phase
  countdown: number
  time: number
  speed: number
  progress: number
  offroad: boolean
  penalty: boolean
  best: number | null
  record: boolean
  muted: boolean
  audioAvailable: boolean
}

export const DRIVING_KEYS = new Set([
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'w',
  'a',
  's',
  'd',
  ' ',
])

function readBest(): number | null {
  try {
    const n = Number(localStorage.getItem(BEST_KEY))
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

/** Runs one rally on a canvas: clock, car, sound and picture. The React
 * component around it only renders the view and forwards page events. */
export class RallyEngine {
  private renderer: RallyRenderer
  private audio: RallyAudio | null = null
  private resize: ResizeObserver
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  private car = startingCar()
  private phase: Phase = 'ready'
  private resumePhase: Phase = 'racing'
  private held = new Set<string>()
  private countdown = 3
  private accumulator = 0
  private previous = 0
  private lastPublish = 0
  private frame = 0
  private penaltyUntil = 0
  private dirty = true
  private best = readBest()
  private record = false
  private muted = readRallyMuted()
  private audioAvailable = true

  constructor(
    private canvas: HTMLCanvasElement,
    private listener: (view: View) => void,
    private onError: (error: unknown) => void,
  ) {
    this.renderer = new RallyRenderer(canvas)
    this.resize = new ResizeObserver(([entry]) => {
      this.renderer.resize(entry.contentRect.width, entry.contentRect.height)
      this.dirty = true
    })
    this.resize.observe(canvas)
    this.frame = requestAnimationFrame(this.animate)
  }

  get view(): View {
    return {
      phase: this.phase,
      countdown: Math.ceil(this.countdown),
      time: this.car.elapsed,
      speed: Math.round(Math.hypot(this.car.vx, this.car.vy) * 0.55),
      progress: this.car.progress,
      offroad: this.car.offroad,
      penalty: this.car.elapsed < this.penaltyUntil,
      best: this.best,
      record: this.record,
      muted: this.muted,
      audioAvailable: this.audioAvailable,
    }
  }

  start() {
    this.held.clear()
    this.car = startingCar()
    this.renderer.reset()
    this.phase = 'countdown'
    this.countdown = 3
    this.accumulator = 0
    this.penaltyUntil = 0
    this.record = false
    this.wakeAudio()
    this.audio?.reset()
    this.audio?.countdown(3)
    this.canvas.focus()
    this.changed()
  }

  pause() {
    if (this.phase !== 'racing' && this.phase !== 'countdown') return
    this.resumePhase = this.phase
    this.phase = 'paused'
    this.audio?.setActive(false)
    this.held.clear()
    this.changed()
  }

  resume() {
    if (this.phase !== 'paused') return
    this.phase = this.resumePhase
    this.held.clear()
    this.wakeAudio()
    this.canvas.focus()
    this.changed()
  }

  /** The one obvious action for Enter or Space; false while driving. */
  proceed() {
    if (this.phase === 'paused') this.resume()
    else if (this.phase === 'ready' || this.phase === 'finished') this.start()
    else return false
    return true
  }

  recover() {
    if (this.phase !== 'racing') return
    recoverCar(this.car)
    this.penaltyUntil = this.car.elapsed + 2
    this.changed()
  }

  toggleSound() {
    this.muted = !this.muted
    try {
      localStorage.setItem(RALLY_MUTE_KEY, String(this.muted))
    } catch {
      /* Sound still works without storage. */
    }
    this.audio?.setMuted(this.muted)
    if (!this.muted && this.driving) this.wakeAudio()
    this.changed()
  }

  press(key: string) {
    if (this.phase !== 'paused' && DRIVING_KEYS.has(key)) this.held.add(key)
  }

  release(key: string) {
    this.held.delete(key)
  }

  releaseAll() {
    this.held.clear()
  }

  refreshPalette() {
    this.renderer.refreshPalette()
    this.dirty = true
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.resize.disconnect()
    this.audio?.dispose()
    this.held.clear()
  }

  private get driving() {
    return this.phase === 'racing' || this.phase === 'countdown'
  }

  private changed() {
    this.dirty = true
    this.publish()
  }

  private publish() {
    this.listener(this.view)
  }

  private wakeAudio() {
    try {
      this.audio ??= new RallyAudio(() => {
        this.audioAvailable = false
        this.publish()
      })
      this.audio.setMuted(this.muted)
      this.audio.setActive(true)
    } catch {
      this.audioAvailable = false
      this.publish()
    }
  }

  private finish() {
    this.phase = 'finished'
    this.audio?.finish()
    this.held.clear()
    const old = readBest()
    if (old === null || this.car.elapsed < old) {
      try {
        localStorage.setItem(BEST_KEY, String(this.car.elapsed))
      } catch {
        /* Still playable without storage. */
      }
      this.best = this.car.elapsed
      this.record = true
    }
    this.publish()
  }

  private animate = (now: number) => {
    const dt = this.previous ? Math.min((now - this.previous) / 1000, 0.08) : 0
    this.previous = now
    const active = this.driving
    if (this.phase === 'countdown') {
      const beat = Math.ceil(this.countdown)
      this.countdown -= dt
      if (this.countdown <= 0) {
        this.phase = 'racing'
        this.audio?.countdown(0)
      } else if (Math.ceil(this.countdown) !== beat)
        this.audio?.countdown(Math.ceil(this.countdown))
    }
    const keys = this.held
    const input = {
      throttle: keys.has('w') || keys.has('arrowup'),
      brake: keys.has('s') || keys.has('arrowdown'),
      steer:
        Number(keys.has('d') || keys.has('arrowright')) -
        Number(keys.has('a') || keys.has('arrowleft')),
      drift: keys.has(' '),
    }
    if (this.phase === 'racing') {
      this.accumulator += dt
      while (this.accumulator >= FIXED_STEP) {
        stepCar(this.car, input, FIXED_STEP)
        this.accumulator -= FIXED_STEP
      }
      if (this.car.finished) this.finish()
    }
    if (this.driving) this.audio?.update(this.car, input, dt)
    if (active || this.dirty) {
      try {
        this.renderer.draw(
          this.car,
          active ? dt : 0,
          active,
          input.drift,
          this.reducedMotion.matches,
        )
      } catch (error) {
        this.held.clear()
        this.audio?.setActive(false)
        this.onError(error)
        return
      }
      this.dirty = false
    }
    if (active && now - this.lastPublish > 80) {
      this.publish()
      this.lastPublish = now
    }
    this.frame = requestAnimationFrame(this.animate)
  }
}
