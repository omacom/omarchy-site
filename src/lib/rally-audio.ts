import { clamp } from './rally-stage.ts'
import type { Car, Controls } from './rally-stage.ts'

export const RALLY_MUTE_KEY = 'omarchy-rally-muted'

export function readRallyMuted() {
  try {
    return localStorage.getItem(RALLY_MUTE_KEY) === 'true'
  } catch {
    return false
  }
}

export type EngineState = {
  gear: number
  rpm: number
  throttle: number
  boost: number
  shift: number
  cooldown: number
  wasThrottle: boolean
}

export const startingEngine = (): EngineState => ({
  gear: 0,
  rpm: 950,
  throttle: 0,
  boost: 0,
  shift: 0,
  cooldown: 0,
  wasThrottle: false,
})

const GEAR_RATIOS = [88, 51, 35, 27, 22]

/** The gearbox has memory, so a corner cannot chatter between two gear sounds. */
export function stepEngine(
  engine: EngineState,
  car: Car,
  input: Controls,
  dt: number,
) {
  dt = clamp(dt, 0, 0.1)
  const forward = car.vx * Math.cos(car.angle) + car.vy * Math.sin(car.angle)
  const speed = Math.hypot(car.vx, car.vy)
  const wheelSpeed = Math.abs(forward)
  engine.shift = Math.max(0, engine.shift - dt)
  engine.cooldown = Math.max(0, engine.cooldown - dt)
  if (forward < -5 || wheelSpeed < 8) engine.gear = 0
  if (engine.cooldown === 0 && forward >= 8) {
    const wheelRpm = wheelSpeed * GEAR_RATIOS[engine.gear]
    const previousGear = engine.gear
    if (wheelRpm > 6200 && engine.gear < 4) engine.gear++
    else if (wheelRpm < 2600 && engine.gear > 0) engine.gear--
    if (engine.gear !== previousGear) {
      engine.shift = 0.13
      engine.cooldown = 0.45
    }
  }
  engine.throttle +=
    (Number(input.throttle) - engine.throttle) * (1 - Math.exp(-dt * 8))
  // Slip can make gravel louder without falsely revving the driven wheels.
  const freeRev = 950 + engine.throttle * 1700
  const wheelRpm = wheelSpeed * GEAR_RATIOS[engine.gear]
  const targetRpm = clamp(
    Math.max(freeRev, wheelRpm) + engine.throttle * 200,
    950,
    6900,
  )
  engine.rpm +=
    (targetRpm - engine.rpm) * (1 - Math.exp(-dt * (engine.shift > 0 ? 14 : 7)))
  const lift = engine.wasThrottle && !input.throttle && engine.boost > 0.32
  engine.wasThrottle = input.throttle
  const targetBoost =
    input.throttle && engine.shift === 0
      ? clamp((engine.rpm - 2400) / 3500, 0, 1)
      : 0
  engine.boost +=
    (targetBoost - engine.boost) *
    (1 - Math.exp(-dt * (targetBoost > engine.boost ? 2 : 9)))
  const slip = Math.abs(
    -car.vx * Math.sin(car.angle) + car.vy * Math.cos(car.angle),
  )
  const rolling = clamp(speed / 220, 0, 1)
  return {
    // A whole engine cycle, with five exhaust pulses in the waveform below.
    frequency: engine.rpm / 120,
    engine: (0.11 + engine.throttle * 0.085) * (engine.shift > 0 ? 0.52 : 1),
    cutoff: 420 + engine.rpm * (0.11 + engine.throttle * 0.19),
    gravel: rolling * (car.offroad ? 0.15 : 0.055),
    scrub: rolling * clamp(slip / 65 + (input.drift ? 0.3 : 0), 0, 1) * 0.1,
    turbo: engine.boost * 0.045,
    lift,
  }
}

/** Construct only from a user gesture, or autoplay policy blocks the context. */
export class RallyAudio {
  private context = new AudioContext()
  private master = this.context.createGain()
  private engine = this.context.createOscillator()
  private lowEngine = this.context.createOscillator()
  private engineGain = this.context.createGain()
  private engineFilter = this.context.createBiquadFilter()
  private intakeGain = this.context.createGain()
  private turboGain = this.context.createGain()
  private turboFilter = this.context.createBiquadFilter()
  private gravelGain = this.context.createGain()
  private scrubGain = this.context.createGain()
  private noise = this.context.createBufferSource()
  private cues = new Set<OscillatorNode | AudioBufferSourceNode>()
  private drive = startingEngine()
  private muted = false
  private active = false
  private closed = false
  private onUnavailable: () => void
  private suspendTimer: ReturnType<typeof setTimeout> | undefined
  private finishTimer: ReturnType<typeof setTimeout> | undefined

  constructor(onUnavailable: () => void) {
    this.onUnavailable = onUnavailable
    const ctx = this.context
    this.master.gain.value = 0
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -16
    compressor.knee.value = 12
    compressor.ratio.value = 3
    compressor.attack.value = 0.006
    compressor.release.value = 0.18
    this.master.connect(compressor).connect(ctx.destination)
    this.engineGain.gain.value = 0
    this.engineFilter.type = 'lowpass'
    this.engineFilter.Q.value = 0.7
    this.engineFilter.frequency.value = 800
    const exhaust = ctx.createWaveShaper()
    exhaust.curve = Float32Array.from(
      { length: 1024 },
      (_, i) => Math.tanh(((i / 1023) * 2 - 1) * 1.8) / Math.tanh(1.8),
    )
    exhaust.oversample = '2x'
    this.engineFilter
      .connect(exhaust)
      .connect(this.engineGain)
      .connect(this.master)

    // Five slightly different pulses per cycle provide low, uneven exhaust
    // harmonics instead of a clean musical note at the firing frequency.
    const real = new Float32Array(64),
      imaginary = new Float32Array(64)
    const pulses = [1, 0.84, 0.96, 0.88, 0.93]
    for (let harmonic = 1; harmonic < real.length; harmonic++) {
      for (let pulse = 0; pulse < pulses.length; pulse++) {
        const phase = (2 * Math.PI * harmonic * pulse) / pulses.length
        const level = pulses[pulse] / (1 + (harmonic / 9) ** 2)
        real[harmonic] += Math.cos(phase) * level
        imaginary[harmonic] += Math.sin(phase) * level
      }
    }
    this.engine.setPeriodicWave(ctx.createPeriodicWave(real, imaginary))
    this.engine.frequency.value = 950 / 120
    this.engine.connect(this.engineFilter)
    this.lowEngine.type = 'triangle'
    this.lowEngine.frequency.value = 950 / 60
    const lowGain = ctx.createGain()
    lowGain.gain.value = 0.32
    this.lowEngine.connect(lowGain).connect(this.engineFilter)

    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const samples = buffer.getChannelData(0)
    let previous = 0
    for (let i = 0; i < samples.length; i++) {
      previous = (previous + (Math.random() * 2 - 1) * 0.12) / 1.12
      samples[i] = previous * 3
    }
    // Blend the loop boundary so surface noise has no repeating click.
    for (let i = 0; i < 512; i++) {
      const at = samples.length - 512 + i,
        fade = i / 511
      samples[at] = samples[at] * (1 - fade) + samples[i] * fade
    }
    this.noise.buffer = buffer
    this.noise.loop = true
    this.noise.loopStart = 512 / ctx.sampleRate
    const intakeFilter = ctx.createBiquadFilter()
    intakeFilter.type = 'bandpass'
    intakeFilter.frequency.value = 380
    intakeFilter.Q.value = 0.6
    this.intakeGain.gain.value = 0
    this.noise
      .connect(intakeFilter)
      .connect(this.intakeGain)
      .connect(this.engineFilter)
    const flutter = ctx.createGain()
    flutter.gain.value = 5
    this.noise.connect(flutter)
    flutter.connect(this.engine.detune)
    this.turboFilter.type = 'bandpass'
    this.turboFilter.frequency.value = 2600
    this.turboFilter.Q.value = 1.2
    this.turboGain.gain.value = 0
    this.noise
      .connect(this.turboFilter)
      .connect(this.turboGain)
      .connect(this.master)
    const gravelFilter = ctx.createBiquadFilter()
    gravelFilter.type = 'lowpass'
    gravelFilter.frequency.value = 1400
    this.gravelGain.gain.value = 0
    this.noise
      .connect(gravelFilter)
      .connect(this.gravelGain)
      .connect(this.master)
    const scrubFilter = ctx.createBiquadFilter()
    scrubFilter.type = 'bandpass'
    scrubFilter.frequency.value = 1100
    scrubFilter.Q.value = 0.65
    this.scrubGain.gain.value = 0
    this.noise.connect(scrubFilter).connect(this.scrubGain).connect(this.master)
    this.engine.start()
    this.lowEngine.start()
    this.noise.start()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.syncPlayback()
  }

  setActive(active: boolean) {
    clearTimeout(this.finishTimer)
    this.active = active
    this.syncPlayback()
  }

  private syncPlayback() {
    if (this.closed) return
    clearTimeout(this.suspendTimer)
    const ctx = this.context
    this.master.gain.cancelScheduledValues(ctx.currentTime)
    this.master.gain.setTargetAtTime(
      this.active && !this.muted ? 0.65 : 0,
      ctx.currentTime,
      0.012,
    )
    if (this.active && !this.muted) {
      void ctx.resume().catch(() => {
        if (!this.closed) this.onUnavailable()
      })
    } else {
      this.stopCues()
      this.suspendTimer = setTimeout(() => {
        if (!this.closed && (!this.active || this.muted))
          void ctx.suspend().catch(() => {})
      }, 70)
    }
  }

  update(car: Car, input: Controls, dt: number) {
    if (this.closed || !this.active) return
    const time = this.context.currentTime
    const voice = stepEngine(this.drive, car, input, dt)
    if (this.muted) return
    this.engine.frequency.setTargetAtTime(voice.frequency, time, 0.025)
    this.lowEngine.frequency.setTargetAtTime(voice.frequency * 2, time, 0.04)
    this.engineFilter.frequency.setTargetAtTime(voice.cutoff, time, 0.06)
    this.engineGain.gain.setTargetAtTime(voice.engine, time, 0.06)
    this.intakeGain.gain.setTargetAtTime(
      0.08 + this.drive.throttle * 0.12,
      time,
      0.06,
    )
    this.turboGain.gain.setTargetAtTime(voice.turbo, time, 0.12)
    this.turboFilter.frequency.setTargetAtTime(
      1800 + this.drive.boost * 1800,
      time,
      0.1,
    )
    this.gravelGain.gain.setTargetAtTime(voice.gravel, time, 0.08)
    this.scrubGain.gain.setTargetAtTime(voice.scrub, time, 0.05)
    if (voice.lift) this.releaseTurbo()
  }

  reset() {
    this.drive = startingEngine()
    this.stopCues()
  }

  private releaseTurbo() {
    const ctx = this.context,
      start = ctx.currentTime
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain()
    source.buffer = this.noise.buffer
    filter.type = 'bandpass'
    filter.Q.value = 0.7
    filter.frequency.setValueAtTime(3200, start)
    filter.frequency.exponentialRampToValueAtTime(900, start + 0.22)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(this.drive.boost * 0.16, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25)
    source.connect(filter).connect(gain).connect(this.master)
    this.cues.add(source)
    source.onended = () => {
      source.disconnect()
      filter.disconnect()
      gain.disconnect()
      this.cues.delete(source)
    }
    source.start(start)
    source.stop(start + 0.26)
  }

  countdown(number: number) {
    if (number === 0) this.tone(880, 0.3)
    else this.tone(440, 0.1)
  }

  finish() {
    if (this.closed) return
    const time = this.context.currentTime
    for (const gain of [
      this.engineGain,
      this.gravelGain,
      this.scrubGain,
      this.turboGain,
    ]) {
      gain.gain.cancelScheduledValues(time)
      gain.gain.setTargetAtTime(0, time, 0.06)
    }
    ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) =>
      this.tone(frequency, 0.22, i * 0.13),
    )
    clearTimeout(this.finishTimer)
    this.finishTimer = setTimeout(() => this.setActive(false), 1000)
  }

  private tone(frequency: number, duration: number, delay = 0) {
    if (this.closed || this.muted || !this.active) return
    const ctx = this.context,
      start = ctx.currentTime + delay
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.16, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    oscillator.connect(gain).connect(this.master)
    this.cues.add(oscillator)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
      this.cues.delete(oscillator)
    }
    oscillator.start(start)
    oscillator.stop(start + duration + 0.01)
  }

  private stopCues() {
    for (const cue of this.cues) cue.stop()
    this.cues.clear()
  }

  dispose() {
    if (this.closed) return
    this.closed = true
    clearTimeout(this.suspendTimer)
    clearTimeout(this.finishTimer)
    this.stopCues()
    this.engine.stop()
    this.lowEngine.stop()
    this.noise.stop()
    this.master.disconnect()
    void this.context.close().catch(() => {})
  }
}
