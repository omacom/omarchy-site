import { useEffect, useRef } from 'react'
import { PICKER_STATE_EVENT, THEME_EVENT } from '@/lib/theme'
import { GRID_CLEAR_EVENT, GRID_EVENT } from '@/lib/pixel-grid'
import {
  WORDMARK_HEIGHT,
  WORDMARK_ROWS,
  WORDMARK_WIDTH,
} from '@/data/wordmark-bitmap'
import {
  ETCH_EVENT,
  effectFromLocation,
  resolveEffect,
  startEtch,
} from '@/lib/etch'
import { BANDS, loadMusic, music } from '@/lib/music'
import type { Etch } from '@/lib/etch'

export type FieldGlyph = {
  rows: readonly string[]
  width: number
  height: number
}

export const WORDMARK_GLYPH: FieldGlyph = {
  rows: WORDMARK_ROWS,
  width: WORDMARK_WIDTH,
  height: WORDMARK_HEIGHT,
}

/** The field's colors come from the active theme's --t-field-* tokens. */
function readPalette() {
  const style = getComputedStyle(document.documentElement)
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback
  return {
    bg: token('--t-field-bg', '#0e0e14'),
    dim: token('--t-field-dim', '#39482e'),
    mid: token('--t-field-mid', '#678549'),
    lit: token('--t-field-lit', '#9ece6a'),
    hover: token('--t-field-hover', '#bbdd97'),
    crest: token('--t-field-crest', '#daecc6'),
  }
}

/** Classic 8x8 ordered dither matrix, 0..63. */
const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36,
  14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23,
  61, 29, 53, 21,
]

const NOISE_SIZE = 128
/** Grid cells per unit of noise: how big the drifting blobs read. */
const CELLS_PER_NOISE = 9
/** Cursor reach, in grid cells. */
const CURSOR_CELLS = 12

/** How much of the field's height the loudest band may climb. */
const SPECTRUM_REACH = 0.92
/** How dense a column gets, and how much of it wears the main ink. */
const SPECTRUM_DENSITY = 0.7
const SPECTRUM_HEAT = 0.5
/** Below this a band is resting and its column shows nothing extra. */
const SPECTRUM_FLOOR = 0.08
/** How bright the sprite's glow is, against the pointer's. */
const SPRITE_STRENGTH = 0.7
/** Seconds the sprite flies before its first stamp, and between stamps. */
const SPRITE_FIRST_STAMP_WAIT = [1, 2] as const
const SPRITE_STAMP_WAIT = [2, 3] as const
const SPRITE_CHARGE_GLOW = 0.4
/** How far the sprite charges a stamp, as a share of a full hold: a
 * quick click's worth, never the bloom a long hold makes. */
const SPRITE_STAMP_CHARGE = [0, 0.2] as const
/**
 * Whether the head script kept the server-rendered word out of sight for
 * an effect to make it. Read from the mark the script leaves, not from the
 * hiding class, since the page lets that class go as soon as the word's own
 * hidden class is in place, and this field may well arrive later than that
 * when its chunk comes over the network. Read once, so the answer holds
 * for the page however many times the field is set up.
 */
let heldAnswer: boolean | null = null
function wordWasHeld() {
  if (heldAnswer === null)
    heldAnswer = document.documentElement.hasAttribute('data-etch-held')
  return heldAnswer
}

const LASER_BANDS = [
  'crest',
  'crest',
  'crest',
  'crest',
  'crest',
  'hover',
  'hover',
  'lit',
  'lit',
  'lit',
  'lit',
  'mid',
  'mid',
  'mid',
  'dim',
  'dim',
  'dim',
  'dim',
  'dim',
] as const

/** How much of a band's height a beat adds, and how fast that fades. */
const BEAT_REACH = 0.8
const BEAT_DECAY = 0.84

/**
 * The square-spiral logo glyph as a 15x15 bitmap, taken from
 * omarchy-logo.svg, whose every path coordinate is a multiple of 80 in a
 * 1200 viewBox. A click stamps this glyph onto the field grid, growing
 * from under a cell per logo pixel to a few, dissolving through the
 * dither as it fades. Tempo and final size jitter a little per click so
 * no two stamps are quite twins, while every stamp is the same mark.
 */
const LOGO_SIZE = 15
const LOGO_ROWS = [
  '111111111111111',
  '100000010000001',
  '101111110001101',
  '101000000000101',
  '101000000000101',
  '101000000000101',
  '101000000000101',
  '111000000000101',
  '101000000000101',
  '101000000000101',
  '101000000000101',
  '101000000000101',
  '101111111111101',
  '100000010000001',
  '111111110111111',
]

const CHARGE_TIME = 1.1
const CHARGE_FROM = 0.45
const CHARGE_GROWTH = 1.6

type Ping = {
  x: number
  y: number
  born: number
  /** Cells per logo pixel at launch and at full bloom. */
  from: number
  to: number
  /** Seconds the stamp takes to bloom out and dissolve. */
  life: number
}

function buildNoise(seed: number) {
  const size = NOISE_SIZE
  let state = seed >>> 0
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }

  let field = new Float32Array(size * size)
  for (let i = 0; i < field.length; i++) field[i] = random()

  // A couple of box passes turn white noise into soft blobs.
  for (let pass = 0; pass < 2; pass++) {
    const next = new Float32Array(size * size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const sx = (x + dx + size) % size
            const sy = (y + dy + size) % size
            sum += field[sy * size + sx]
          }
        }
        next[y * size + x] = sum / 9
      }
    }
    field = next
  }

  // Box blurring collapses the range, so stretch it back out.
  let min = Infinity
  let max = -Infinity
  for (const v of field) {
    if (v < min) min = v
    if (v > max) max = v
  }
  const span = max - min || 1
  for (let i = 0; i < field.length; i++) field[i] = (field[i] - min) / span

  return field
}

/** A fixed 64x64 tile of per-cell threshold offsets, tiled over the grid. */
function buildJitter(seed: number) {
  let state = seed >>> 0
  const tile = new Float32Array(64 * 64)
  for (let i = 0; i < tile.length; i++) {
    state = (state * 1664525 + 1013904223) >>> 0
    tile[i] = state / 4294967296
  }
  return tile
}

function sample(field: Float32Array, x: number, y: number) {
  const size = NOISE_SIZE
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const x0 = ((xi % size) + size) % size
  const y0 = ((yi % size) + size) % size
  const x1 = (x0 + 1) % size
  const y1 = (y0 + 1) % size
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const a = field[y0 * size + x0]
  const b = field[y0 * size + x1]
  const c = field[y1 * size + x0]
  const d = field[y1 * size + x1]
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy
}

const FIELD_DENSITY = 0.3

/* Match the hero slot width when rendering a field without a wordmark. */
const SLOT_INSET = 48
const SLOT_FRACTION = 0.88
const SLOT_MAX = 896
const CLEAR_REACH = 150
const HUSH_REACH = 96
const CLEAR_CURVE = 3

type Props = {
  /** Fired once the field has painted, so the SSR wordmark can step aside. */
  onPainted?: () => void
  /**
   * 'hero' draws the wordmark into the field, publishes the lattice for the
   * DOM to snap to, and treats a press on the logo as the theme picker.
   * 'field' is the same drifting texture, the same cursor response and the
   * same click stamps, with none of that: a ground, not a signature.
   */
  variant?: 'hero' | 'field'
  /** The word the field resolves into. Ignored by 'field'. */
  glyph?: FieldGlyph
  /**
   * What a press on the word does. The hero opens the theme picker; the 404
   * goes home. The hover glow and the pointer cursor come with it either way.
   */
  onGlyphPress?: () => void
}

export function HeroPixelField({
  onPainted,
  variant = 'hero',
  glyph = WORDMARK_GLYPH,
  onGlyphPress,
}: Props) {
  // The press handler is read from inside an effect that must outlive every
  // render, so it arrives by ref: putting it in the dependency list would
  // tear down and rebuild the canvas whenever the parent re-rendered.
  const press = useRef(onGlyphPress)
  press.current = onGlyphPress

  const isHero = variant === 'hero'

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paintedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const finePointer = window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches
    const noise = buildNoise(0x9ece6a)
    const jitter = buildJitter(0x0a1f14)

    let palette = readPalette()

    /** A CSS colour as [r, g, b], or null if it is not a plain hex/rgb. */
    const parse = (css: string): [number, number, number] | null => {
      const hex = /^#([0-9a-f]{6})$/i.exec(css.trim())
      if (hex) {
        const n = parseInt(hex[1], 16)
        return [n >> 16, (n >> 8) & 255, n & 255]
      }
      const rgb = /^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(css.trim())
      return rgb ? [+rgb[1], +rgb[2], +rgb[3]] : null
    }
    const luma = ([r, g, b]: [number, number, number]) =>
      (r * 299 + g * 587 + b * 114) / 255000
    // The theme's inks for the word, sorted by brightness, so any colour
    // an effect paints - its own blues, oranges, whites - lands on the
    // nearest ink of the theme instead. Rebuilt when the theme changes.
    let inks: { css: string; rgb: [number, number, number]; l: number }[] = []
    const buildRamp = () => {
      inks = []
      for (const css of [
        palette.dim,
        palette.mid,
        palette.lit,
        palette.hover,
        palette.crest,
      ]) {
        const rgb = parse(css)
        if (rgb) inks.push({ css, rgb, l: luma(rgb) })
      }
      inks.sort((a, b) => a.l - b.l)
    }
    buildRamp()
    /** The theme ink nearest in brightness to a packed 0xRRGGBB. */
    const themeInk = (packed: number) => {
      if (inks.length === 0) return palette.lit
      const l = luma([packed >> 16, (packed >> 8) & 255, packed & 255])
      let best = inks[0]
      for (const ink of inks)
        if (Math.abs(ink.l - l) < Math.abs(best.l - l)) best = ink
      return best.css
    }
    /** The resting ink of each row of the word, in this theme. A word of
     *  another height (the 404's) takes the bands in proportion. */
    let restInks: string[] = []
    const buildRestInks = () => {
      restInks = []
      for (let row = 0; row < glyph.height; row++) {
        const band = Math.floor((row / glyph.height) * LASER_BANDS.length)
        restInks.push(palette[LASER_BANDS[band]])
      }
    }
    buildRestInks()
    /** The resting ink at a device-px height within the word. */
    const restInkAt = (cy: number) => {
      const row = Math.floor((cy - wmY) / wmCH)
      return restInks[Math.max(0, Math.min(restInks.length - 1, row))]
    }
    /** A colour part way from one CSS colour to another. */
    const mix = (from: string, to: string, t: number) => {
      if (t <= 0) return from
      if (t >= 1) return to
      const a = parse(from)
      const b = parse(to)
      if (!a || !b) return t < 0.5 ? from : to
      const c = a.map((v, i) => Math.round(v + (b[i] - v) * t))
      return `rgb(${c[0]},${c[1]},${c[2]})`
    }

    let etch: Etch | null = null
    let etchPending = false
    // The entrance plays only if the word has been kept out of sight since
    // the first paint (see etchInitScript). If the scripts arrived so late
    // that the word had to be shown already, there is nothing to reveal,
    // and the effects wait for a theme change instead. Answered once for
    // the page: this setup runs again whenever the home page re-renders.
    const held = wordWasHeld()
    /** Until the first cut has begun, the word's cells stay dark. */
    let awaitingFirstEtch = isHero && !reducedMotion && held
    let etchToken = 0
    let disposed = false
    const spectrumOn = isHero && !reducedMotion
    if (spectrumOn) void loadMusic()
    const bandsNow = new Float32Array(BANDS)
    let beatPulse = 0

    let effect = effectFromLocation()
    const beginEtch = () => {
      const token = ++etchToken
      etch?.free()
      etch = null
      void startEtch(
        glyph.rows,
        glyph.width,
        glyph.height,
        [palette.lit, palette.hover, palette.crest],
        resolveEffect(effect),
      )
        .then((next) => {
          if (token !== etchToken || disposed) {
            next.free()
            return
          }
          etch = next
          awaitingFirstEtch = false
        })
        .catch((error: unknown) => {
          console.warn('etch: not played', error)
          awaitingFirstEtch = false
        })
    }
    if (awaitingFirstEtch) beginEtch()

    const onEtch = (event: Event) => {
      const wanted = (event as CustomEvent<string>).detail
      if (!isHero || reducedMotion || typeof wanted !== 'string') return
      effect = wanted
      etchPending = false
      beginEtch()
    }
    window.addEventListener(ETCH_EVENT, onEtch)

    const onTheme = () => {
      palette = readPalette()
      buildRamp()
      buildRestInks()
      if (reducedMotion) draw(lastDraw)
      else if (isHero) {
        if (pickerOpen) etchPending = true
        else beginEtch()
      }
    }
    window.addEventListener(THEME_EVENT, onTheme)

    const onPickerState = (event: Event) => {
      pickerOpen = Boolean((event as CustomEvent).detail?.open)
      if (!pickerOpen && etchPending) {
        etchPending = false
        beginEtch()
      }
      if (pickerOpen) {
        targetStrength = 0
        if (sectionEl) sectionEl.style.cursor = ''
      }
    }
    window.addEventListener(PICKER_STATE_EVENT, onPickerState)

    // Device-pixel geometry, recomputed on resize. Everything is drawn on
    // whole device pixels so cell edges stay razor sharp at any DPR.
    let dpr = 1
    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    // One grid for everything, anchored on the wordmark: the slot rect in
    // device px, divided into fractional cells. Field cells are the same
    // cells as logo pixels, addressed by the same indices, with the
    // wordmark occupying columns 0..80 and rows 0..18; the rest of the
    // field runs into negative and larger indices. Every drawn edge rounds
    // the same grid line, so cells butt pixel-perfectly everywhere.
    let wmX = 0
    let wmY = 0
    let wmCW = 10
    let wmCH = 10
    let cMin = 0
    let rMin = 0
    let ramp = new Float32Array(0)
    let publishedGrid = ''

    // The quiet block's own box is much taller and wider than the words in
    // it, so the ramp is measured from each line of copy instead. Those
    // boxes hug their text, being centred flex children.
    // Everything the field should stand clear of. On the hero that is the
    // bar's controls and every line the hero itself puts on the page; in the
    // footer it is the blocks marked as readable.
    const quietElements = isHero
      ? [
          ...document.querySelectorAll<HTMLElement>('header a, header button'),
          ...[
            ...document.querySelectorAll<HTMLElement>('[data-hero-quiet]'),
          ].flatMap((el) => [...el.children] as HTMLElement[]),
        ]
      : [...host.parentElement!.querySelectorAll<HTMLElement>('[data-quiet]')]

    const clearReachCss = CLEAR_REACH
    const sectionEl = host.closest<HTMLElement>('section, main')
    const pointer = { x: -1e4, y: -1e4 }
    /** The sprite: where it is and how brightly it glows this frame. */
    const sprite = { x: -1e4, y: -1e4, strength: 0 }
    let visible = true
    let strength = 0
    let targetStrength = 0
    let pings: Ping[] = []
    let holding: { x: number; y: number; start: number } | null = null
    /** A stamp the sprite is charging: where, since when, and how far. */
    let spriteHold: {
      x: number
      y: number
      start: number
      charge: number
    } | null = null
    /** When the sprite next starts charging a stamp. */
    let spriteStampAt = Infinity
    let logoPending = false
    let pickerOpen = false

    /** Test the whole wordmark box to avoid hover flicker between letters. */
    const onLogoAt = (px: number, py: number) =>
      isHero &&
      px >= wmX &&
      py >= wmY &&
      px < wmX + glyph.width * wmCW &&
      py < wmY + glyph.height * wmCH

    /** Exclude interactive controls from field press handling. */
    const onControl = (target: EventTarget | null) =>
      target instanceof Element &&
      target.closest(
        'a, button, input, select, textarea, label, [role="button"], header, [data-no-stamp]',
      ) !== null

    /** 0..1: how far a held press has charged. */
    const chargeOf = (now: number, start: number) =>
      Math.min((now - start) / 1000 / CHARGE_TIME, 1)

    const launch = (x: number, y: number, charge: number, now: number) => {
      const from = CHARGE_FROM + CHARGE_GROWTH * charge
      pings = [
        ...pings.slice(-3),
        {
          x,
          y,
          born: now,
          from,
          to: (from + 1.0 + 3.2 * charge) * (0.92 + Math.random() * 0.16),
          life: (0.65 + 0.55 * charge) * (0.92 + Math.random() * 0.16),
        },
      ]
    }

    const between = ([lo, hi]: readonly [number, number]) =>
      lo + Math.random() * (hi - lo)

    const measure = () => {
      const box = host.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) return false

      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const nextWidth = Math.round(box.width * dpr)
      const nextHeight = Math.round(box.height * dpr)
      // Assigning canvas.width wipes the buffer, so only do it when the size
      // has actually changed. A drag-resize fires this observer continuously
      // and every needless reset shows up as a flash of empty background.
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth
        height = nextHeight
        canvas.width = width
        canvas.height = height
      }
      canvas.style.width = `${box.width}px`
      canvas.style.height = `${box.height}px`

      // Scope slot measurements to this hero so the footer cannot use its geometry.
      const slot = isHero
        ? document.querySelector<HTMLElement>('[data-hero-wordmark]')
        : null
      const slotBox = slot?.getBoundingClientRect()
      const slotWidth =
        (slotBox?.width ??
          Math.min(SLOT_FRACTION * (box.width - SLOT_INSET), SLOT_MAX)) * dpr
      // Align the slotless field to the hero lattice horizontally.
      wmX = slotBox ? (slotBox.left - box.left) * dpr : (width - slotWidth) / 2
      wmY = ((slotBox?.top ?? box.top) - box.top) * dpr
      wmCW = (slotBox ? slotBox.width * dpr : slotWidth) / glyph.width
      wmCH =
        (slotBox
          ? slotBox.height * dpr
          : (slotWidth * glyph.height) / glyph.width) / glyph.height

      // Publish the lattice so DOM controls over the hero (the CTAs, the
      // floating navbar) can snap themselves onto the same grid. Publishing
      // only on change lets the snapper's re-measure requests converge.
      const gridKey = `${wmX},${wmY},${wmCW},${wmCH}`
      if (isHero && gridKey !== publishedGrid) {
        publishedGrid = gridKey
        window.dispatchEvent(
          new CustomEvent(GRID_EVENT, {
            detail: {
              x: slotBox?.left ?? 0,
              y: slotBox?.top ?? 0,
              cw: wmCW / dpr,
              ch: wmCH / dpr,
            },
          }),
        )
      }

      cMin = -Math.ceil(wmX / wmCW) - 1
      rMin = -Math.ceil(wmY / wmCH) - 1
      cols = Math.ceil((width - wmX) / wmCW) - cMin + 1
      rows = Math.ceil((height - wmY) / wmCH) - rMin + 1

      const quietBoxes = isHero
        ? []
        : quietElements
            .map((el) => el.getBoundingClientRect())
            .filter((rect) => rect.width >= 1 && rect.height >= 1)
            .map((rect) => ({
              l: (rect.left - box.left) * dpr,
              t: (rect.top - box.top) * dpr,
              r: (rect.right - box.left) * dpr,
              b: (rect.bottom - box.top) * dpr,
            }))
      const clearReach = CLEAR_REACH * dpr
      const clearOf = (x: number, y: number) => {
        if (quietBoxes.length === 0) return 1
        let nearest = Infinity
        for (const q of quietBoxes) {
          const dx = Math.max(q.l - x, 0, x - q.r)
          const dy = Math.max(q.t - y, 0, y - q.b)
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < nearest) nearest = dist
        }
        if (nearest >= clearReach) return 1
        return (nearest / clearReach) ** CLEAR_CURVE
      }

      ramp = new Float32Array(cols * rows)
      for (let r = 0; r < rows; r++) {
        const y = wmY + (rMin + r + 0.5) * wmCH
        const ny = (y / height) * 2 - 1
        const clear = isHero
          ? Math.min(1, Math.max(0.16, (y / dpr - 24) / 130))
          : FIELD_DENSITY
        for (let c = 0; c < cols; c++) {
          const x = wmX + (cMin + c + 0.5) * wmCW
          const nx = (x / width) * 2 - 1
          const rr = Math.sqrt(nx * nx + ny * ny * 0.82)
          const eased = Math.min(1, Math.max(0, (rr - 0.42) / 0.85))
          const shape = isHero ? eased * eased : 1
          ramp[r * cols + c] = shape * clear * clearOf(x, y)
        }
      }
      return true
    }

    const draw = (time: number) => {
      const t = reducedMotion ? 0 : time / 1000

      let spriteGoal = 0
      if (isHero && !reducedMotion) {
        const ts = time / 1000
        const rx = 0.44 * (1 + 0.1 * Math.sin(ts * 0.11))
        const ry = 0.38 * (1 + 0.1 * Math.sin(ts * 0.09 + 2))
        sprite.x = width * (0.5 + rx * Math.sin(ts * 0.65))
        sprite.y = height * (0.48 + ry * Math.sin(ts * 0.39 + 1.1))
        const box = host.getBoundingClientRect()
        spriteGoal =
          strengthAt(box.left + sprite.x / dpr, box.top + sprite.y / dpr) *
          SPRITE_STRENGTH

        // Delay sprite stamps until the wordmark entrance has finished.
        const wordBusy = etch !== null || awaitingFirstEtch
        if (wordBusy) {
          spriteHold = null
          spriteStampAt = Infinity
        } else if (spriteStampAt === Infinity) {
          spriteStampAt = time + between(SPRITE_FIRST_STAMP_WAIT) * 1000
        }
        if (!wordBusy && !spriteHold && time >= spriteStampAt) {
          spriteHold = {
            x: sprite.x,
            y: sprite.y,
            start: time,
            charge: between(SPRITE_STAMP_CHARGE),
          }
        }
        if (spriteHold) {
          spriteHold.x = sprite.x
          spriteHold.y = sprite.y
          spriteGoal *= SPRITE_CHARGE_GLOW
          if (chargeOf(time, spriteHold.start) >= spriteHold.charge) {
            launch(spriteHold.x, spriteHold.y, spriteHold.charge, time)
            spriteHold = null
            spriteStampAt = time + between(SPRITE_STAMP_WAIT) * 1000
          }
        }
      }
      sprite.strength += (spriteGoal - sprite.strength) * 0.08

      // The pointer itself is never smoothed: the cells under the cursor are
      // the cells that light. Only the fade in and out of the field's
      // response is eased.
      strength += (targetStrength - strength) * 0.3

      ctx.fillStyle = palette.bg
      ctx.fillRect(0, 0, width, height)

      let beatNow = 0
      let listening = false
      if (spectrumOn) {
        const heard = music.sample(time)
        for (let i = 0; i < BANDS; i++) {
          const rise = heard.bands[i] > bandsNow[i]
          bandsNow[i] += (heard.bands[i] - bandsNow[i]) * (rise ? 0.7 : 0.14)
          if (bandsNow[i] > 0.01) listening = true
        }
        beatNow = heard.beat
        beatPulse = Math.max(beatPulse * BEAT_DECAY, beatNow)
        if (beatPulse < 0.005) beatPulse = 0
      }

      const reachOf = (level: number) =>
        CURSOR_CELLS *
        wmCW *
        (0.45 + 0.55 * level) *
        (1 + BEAT_REACH * beatPulse)
      /** The glows alive this frame: the pointer's and the sprite's. */
      const glows: { x: number; y: number; strength: number; reach: number }[] =
        []
      if (strength > 0.01)
        glows.push({
          x: pointer.x,
          y: pointer.y,
          strength,
          reach: reachOf(strength),
        })
      if (sprite.strength > 0.01)
        glows.push({
          x: sprite.x,
          y: sprite.y,
          strength: sprite.strength,
          reach: reachOf(sprite.strength),
        })

      // Resolve each live click stamp once per frame, not once per cell.
      const stamps: {
        x: number
        y: number
        cellPx: number
        amp: number
      }[] = []
      if (pings.length > 0) {
        pings = pings.filter((ping) => (time - ping.born) / 1000 < ping.life)
        for (const ping of pings) {
          const age = (time - ping.born) / 1000 / ping.life
          const grow = 1 - (1 - age) ** 3
          stamps.push({
            x: ping.x,
            y: ping.y,
            cellPx: wmCW * (ping.from + (ping.to - ping.from) * grow),
            amp: (1 - age) ** 1.7,
          })
        }
      }
      for (const charging of [holding, spriteHold]) {
        if (!charging) continue
        stamps.push({
          x: charging.x,
          y: charging.y,
          cellPx:
            wmCW *
            (CHARGE_FROM + CHARGE_GROWTH * chargeOf(time, charging.start)),
          amp: 0.9,
        })
      }

      if (etch && !etch.advance(time)) {
        etch.free()
        etch = null
      }
      const etching = etch !== null || awaitingFirstEtch

      /** The strongest live stamp covering a device-px point, if any. */
      const stampAt = (cx: number, cy: number) => {
        let amp = 0
        for (const stamp of stamps) {
          const lx = Math.floor((cx - stamp.x) / stamp.cellPx + LOGO_SIZE / 2)
          const ly = Math.floor((cy - stamp.y) / stamp.cellPx + LOGO_SIZE / 2)
          if (lx < 0 || ly < 0 || lx >= LOGO_SIZE || ly >= LOGO_SIZE) continue
          if (LOGO_ROWS[ly][lx] === '1' && stamp.amp > amp) amp = stamp.amp
        }
        return amp
      }

      for (let r = 0; r < rows; r++) {
        const row = rMin + r
        const yTop = wmY + row * wmCH
        const y = Math.round(yTop)
        const cellH = Math.round(yTop + wmCH) - y
        const cy = yTop + wmCH / 2
        for (let c = 0; c < cols; c++) {
          const col = cMin + c
          if (
            isHero &&
            col >= 0 &&
            col < glyph.width &&
            row >= 0 &&
            row < glyph.height &&
            glyph.rows[row][col] === '1'
          ) {
            continue
          }

          const shade = ramp[r * cols + c]
          let lum = 0

          if (shade > 0.002) {
            const u = col / CELLS_PER_NOISE
            const v = row / CELLS_PER_NOISE
            const base =
              0.6 * sample(noise, u + t * 0.14, v - t * 0.055) +
              0.4 * sample(noise, u * 0.55 - t * 0.08, v * 0.55 + t * 0.06)

            const twinkle =
              0.5 +
              0.5 *
                Math.sin(t * 1.1 + jitter[(row * 37 + col * 11) & 4095] * 6.283)

            lum = shade * (0.3 + 0.52 * base * base + 0.18 * twinkle) * 0.62
          }

          const xLeft = wmX + col * wmCW
          const cx = xLeft + wmCW / 2

          let glowAmount = 0
          for (const glow of glows) {
            const dx = cx - glow.x
            const dy = cy - glow.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < glow.reach) {
              const falloff = 1 - dist / glow.reach
              const amount = falloff * falloff * glow.strength
              if (amount > glowAmount) glowAmount = amount
            }
          }
          lum += glowAmount * 0.6

          let waveAmount = 0
          if (stamps.length > 0) {
            waveAmount = stampAt(cx, cy)
            lum += waveAmount * 1.15
          }

          let specAmount = 0
          if (listening && shade > 0.002) {
            const across = (c + 0.5) / cols
            const side = Math.abs(across - 0.5) * 2
            const bandPos = (1 - side) * BANDS - 0.5
            const b0 = Math.max(0, Math.min(BANDS - 1, Math.floor(bandPos)))
            const b1 = Math.min(BANDS - 1, b0 + 1)
            const mixB = Math.max(0, Math.min(1, bandPos - b0))
            const raw = bandsNow[b0] * (1 - mixB) + bandsNow[b1] * mixB
            const level = Math.max(
              0,
              (raw - SPECTRUM_FLOOR) / (1 - SPECTRUM_FLOOR),
            )
            const fromBottom = rows - 1 - r
            const tall = level * rows * SPECTRUM_REACH
            if (level > 0 && fromBottom < tall) {
              specAmount = level * (1 - fromBottom / tall) ** 0.85
              lum += specAmount * SPECTRUM_DENSITY * Math.min(1, shade * 3)
            }
          }

          // Pure Bayer would light the same low-index cells everywhere and
          // read as a regular lattice at this density, so a fixed per-cell
          // offset scatters the resting field while the ordered structure
          // still shows up where the cursor pushes luminance high.
          const threshold =
            0.78 * ((BAYER[(row & 7) * 8 + (col & 7)] + 0.5) / 64) +
            0.22 * jitter[(row & 63) * 64 + (col & 63)]
          if (lum <= threshold) continue

          const heat = Math.max(
            glowAmount,
            waveAmount,
            specAmount * SPECTRUM_HEAT,
          )
          ctx.fillStyle =
            heat > 0.34 ? palette.lit : heat > 0.1 ? palette.mid : palette.dim
          const x = Math.round(xLeft)
          ctx.fillRect(x, y, Math.round(xLeft + wmCW) - x, cellH)
        }
      }

      const glowsOnWordmark = isHero
        ? glows.filter(
            (glow) =>
              glow.x > wmX - glow.reach &&
              glow.x < wmX + glyph.width * wmCW + glow.reach &&
              glow.y > wmY - glow.reach &&
              glow.y < wmY + glyph.height * wmCH + glow.reach,
          )
        : []
      const cursorOnWordmark = glowsOnWordmark.length > 0

      /**
       * The ink a wordmark cell takes at a device-px centre: lit at rest,
       * lifted by a stamp washing over it or the cursor passing near it.
       * Shared by the resting word and the
       * metal the laser has cut, so the word answers the pointer while it
       * is still being made.
       */
      const wordmarkInk = (cx: number, cy: number) => {
        let crest = stamps.length > 0 ? stampAt(cx, cy) : 0

        for (const glow of glowsOnWordmark) {
          const dx = cx - glow.x
          const dy = cy - glow.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < glow.reach) {
            const falloff = 1 - dist / glow.reach
            const hit = falloff * falloff * glow.strength
            if (hit > crest) crest = hit
          }
        }

        return crest > 0.45
          ? palette.crest
          : crest > 0.12
            ? palette.hover
            : restInkAt(cy)
      }

      // Cell edges snap to whole device px with rounding against the shared
      // fractional grid, so adjacent cells always meet exactly: no seams
      // inside letters, and the outer edge lands on the same pixels as the
      // SSR fallback the canvas replaces.
      for (let row = 0; isHero && !etching && row < glyph.height; row++) {
        const bits = glyph.rows[row]
        const yTop = wmY + row * wmCH
        const y = Math.round(yTop)
        const rowHeight = Math.round(yTop + wmCH) - y

        if (stamps.length === 0 && !cursorOnWordmark) {
          ctx.fillStyle = restInks[row]
          let run = 0
          for (let col = 0; col <= glyph.width; col++) {
            if (bits[col] === '1') {
              run++
              continue
            }
            if (run > 0) {
              const x = Math.round(wmX + (col - run) * wmCW)
              ctx.fillRect(x, y, Math.round(wmX + col * wmCW) - x, rowHeight)
              run = 0
            }
          }
          continue
        }

        for (let col = 0; col < glyph.width; col++) {
          if (bits[col] !== '1') continue
          const xLeft = wmX + col * wmCW
          const x = Math.round(xLeft)

          const cx = xLeft + wmCW / 2
          const cy = yTop + wmCH / 2

          ctx.fillStyle = wordmarkInk(cx, cy)
          ctx.fillRect(x, y, Math.round(xLeft + wmCW) - x, rowHeight)
        }
      }

      // The effect's frame on the lattice. A block is a whole cell in the
      // word's own ink, answering the pointer like the resting word. A line
      // is drawn thin, corner to corner so rows join. Any other character is
      // a smaller square, sized by the ink the character carries. Colours
      // for everything but blocks are the effect's, built from the theme's
      // inks. Marks land on the field around the word too; those cells are
      // simply painted over.
      if (etch) {
        const stroke = Math.max(1, Math.round(wmCW / 5))
        const settle = etch.settle()
        ctx.lineCap = 'butt'
        for (const cell of etch.cells()) {
          const xLeft = wmX + cell.col * wmCW
          const yTop = wmY + cell.row * wmCH
          const x = Math.round(xLeft)
          const y = Math.round(yTop)
          const cw = Math.round(xLeft + wmCW) - x
          const ch = Math.round(yTop + wmCH) - y
          const rest = restInkAt(yTop + wmCH / 2)
          const resting = wordmarkInk(xLeft + wmCW / 2, yTop + wmCH / 2)
          const effectInk = themeInk(cell.rgb)
          const ink =
            cell.kind === 'block' && resting !== rest
              ? resting
              : mix(effectInk, cell.kind === 'block' ? rest : effectInk, settle)
          if (cell.kind === 'block') {
            ctx.fillStyle = ink
            ctx.fillRect(x, y, cw, ch)
            continue
          }
          if (settle > 0) continue
          if (cell.kind === 'line') {
            ctx.strokeStyle = ink
            ctx.lineWidth = stroke
            ctx.beginPath()
            if (cell.line === 'bar') {
              ctx.moveTo(x + cw / 2, y)
              ctx.lineTo(x + cw / 2, y + ch)
            } else if (cell.line === 'dash') {
              ctx.moveTo(x, y + ch / 2)
              ctx.lineTo(x + cw, y + ch / 2)
            } else if (cell.line === 'down') {
              ctx.moveTo(x, y)
              ctx.lineTo(x + cw, y + ch)
            } else {
              ctx.moveTo(x, y + ch)
              ctx.lineTo(x + cw, y)
            }
            ctx.stroke()
            continue
          }
          ctx.fillStyle = ink
          if (cell.kind === 'part' && cell.parts) {
            for (const [px, py, pw, ph] of cell.parts) {
              const x0 = Math.round(xLeft + px * wmCW)
              const y0 = Math.round(yTop + py * wmCH)
              ctx.fillRect(
                x0,
                y0,
                Math.max(1, Math.round(xLeft + (px + pw) * wmCW) - x0),
                Math.max(1, Math.round(yTop + (py + ph) * wmCH) - y0),
              )
            }
            continue
          }
          const sym = cell.symbol
          const size = Math.max(1, Math.round(cw * Math.sqrt(cell.weight)))
          const low = sym === 0x2c || sym === 0x2e || sym === 0x5f
          const high = sym === 0x27 || sym === 0x60 || sym === 0x22
          const sx = x + Math.round((cw - size) / 2)
          const sy = low
            ? y + ch - size
            : high
              ? y
              : y + Math.round((ch - size) / 2)
          ctx.fillRect(sx, sy, size, size)
        }
      }

      if (!paintedRef.current) {
        paintedRef.current = true
        onPainted?.()
      }
    }

    let frame = 0
    let lastDraw = 0
    const loop = (time: number) => {
      frame = requestAnimationFrame(loop)
      if (time - lastDraw < 25) return
      lastDraw = time
      draw(time)
    }

    /** Distance to the nearest text or control, used to attenuate the pointer glow. */
    const nearestTo = (
      list: HTMLElement[],
      clientX: number,
      clientY: number,
    ) => {
      let nearest = Infinity
      for (const el of list) {
        const rect = el.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) continue
        const dx = Math.max(rect.left - clientX, 0, clientX - rect.right)
        const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom)
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < nearest) nearest = dist
      }
      return nearest
    }

    const reach = isHero ? HUSH_REACH : clearReachCss

    const strengthAt = (clientX: number, clientY: number) => {
      const dist = nearestTo(quietElements, clientX, clientY)
      return dist >= reach ? 1 : (dist / reach) ** CLEAR_CURVE
    }

    const locate = (event: PointerEvent) => {
      const box = host.getBoundingClientRect()
      const inside =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom
      return {
        inside,
        strength: strengthAt(event.clientX, event.clientY),
        x: (event.clientX - box.left) * dpr,
        y: (event.clientY - box.top) * dpr,
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!visible) return
      const { inside, strength: level, x, y } = locate(event)
      // While a press is held or the picker is up, the glow stays muted no
      // matter where the cursor wanders; only a move after both are done
      // wakes it back up.
      if (!holding && !pickerOpen) targetStrength = inside ? level : 0
      // Restore logo hover only after the picker closes and the pointer moves.
      const pressable = Boolean(press.current) || (isHero && !reducedMotion)
      const onLogo = pressable && !pickerOpen && inside && onLogoAt(x, y)
      if (sectionEl) sectionEl.style.cursor = onLogo ? 'pointer' : ''
      if (!inside) return
      pointer.x = x
      pointer.y = y
      if (reducedMotion) draw(0)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!visible) return
      const { inside, x, y } = locate(event)
      if (!inside) return
      pointer.x = x
      pointer.y = y
      if (onLogoAt(x, y)) {
        logoPending = true
        return
      }
      logoPending = false
      if (reducedMotion || onControl(event.target)) return
      targetStrength = 0
      holding = { x, y, start: performance.now() }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (logoPending) {
        logoPending = false
        const { inside, x, y } = locate(event)
        if (inside && onLogoAt(x, y)) {
          if (press.current) press.current()
          else if (isHero && !reducedMotion) beginEtch()
        }
        return
      }
      if (!holding) return
      if (finePointer) {
        const { inside, strength: level } = locate(event)
        targetStrength = inside ? level : 0
      }
      const now = performance.now()
      launch(holding.x, holding.y, chargeOf(now, holding.start), now)
      holding = null
    }

    // Losing the pointer, or the right-click theme picker opening over a
    // held press, cancels the charge rather than firing it.
    const onPointerCancel = () => {
      holding = null
      logoPending = false
    }

    // Keep observing zero-size hosts so drawing can start when they become visible.
    let drawing = false
    const startDrawing = () => {
      if (drawing) return
      drawing = true
      if (reducedMotion) draw(0)
      else frame = requestAnimationFrame(loop)
    }
    if (measure()) startDrawing()

    // Pause drawing while the field is outside the viewport.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (reducedMotion) return
        if (visible && frame === 0) {
          frame = requestAnimationFrame(loop)
        } else if (!visible && frame !== 0) {
          cancelAnimationFrame(frame)
          frame = 0
        }
      },
      { rootMargin: '64px' },
    )
    visibility.observe(host)

    if (finePointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
    }
    // Always attached: the wordmark click must work on touch and under
    // reduced motion too. Stamps gate themselves inside the handlers.
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('pointercancel', onPointerCancel, {
      passive: true,
    })
    window.addEventListener('contextmenu', onPointerCancel, {
      passive: true,
    })
    const observer = new ResizeObserver(() => {
      if (!measure()) return
      startDrawing()
      // Repaint in the same tick as the resize. Waiting for the throttled
      // frame would leave a just-cleared buffer on screen mid-drag.
      draw(reducedMotion ? 0 : lastDraw)
    })
    observer.observe(host)
    const slot = isHero ? document.querySelector('[data-hero-wordmark]') : null
    if (slot) observer.observe(slot)

    return () => {
      disposed = true
      etch?.free()
      etch = null
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      window.removeEventListener(THEME_EVENT, onTheme)
      window.removeEventListener(ETCH_EVENT, onEtch)
      window.removeEventListener(PICKER_STATE_EVENT, onPickerState)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
      window.removeEventListener('contextmenu', onPointerCancel)
      if (isHero) window.dispatchEvent(new CustomEvent(GRID_CLEAR_EVENT))
    }
  }, [onPainted, isHero])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="hero-canvas-in absolute inset-0 h-full w-full select-none"
    />
  )
}
