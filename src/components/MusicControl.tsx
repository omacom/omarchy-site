import { t } from '@/i18n/site'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { VolumeIcon, VolumeOffIcon } from '@/components/icons'
import { MusicBackdrop } from '@/components/MusicBackdrop'
import { MUSIC_EVENT, TRACK, loadMusic, music } from '@/lib/music'
import type { MusicState } from '@/lib/music'

/** Bars in the little meter, and the pixel steps each can climb. */
const METER_BARS = 4
const METER_STEPS = 5
const METER_TRANSFORMS = Array.from(
  { length: METER_STEPS + 1 },
  (_, step) => `scaleY(${step / METER_STEPS})`,
)

const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** What the sound is doing, kept in step with the track, and whether this
 *  page shows a control at all: always on the home page, elsewhere only once
 *  the sound has been touched. */
function useMusicState(path = '/') {
  const home = useLocation({
    serverPath: path,
    select: (at) => at.pathname === '/',
  })
  // Starts from what the sound is doing now, not from "muted": the
  // control can be mounted fresh while the sound is already on.
  const [state, setState] = useState<MusicState>(() => music.state)
  useEffect(() => {
    const onState = (event: Event) =>
      setState((event as CustomEvent<MusicState>).detail)
    window.addEventListener(MUSIC_EVENT, onState)
    if (home) void loadMusic()
    return () => window.removeEventListener(MUSIC_EVENT, onState)
  }, [home])

  return {
    state,
    on: state === 'playing' || state === 'loading',
    shown: home || music.touched,
    untouched: !music.touched,
  }
}

export function MusicMenuControl({
  open,
  path,
}: {
  open: boolean
  path: string
}) {
  const { state, on, shown } = useMusicState(path)
  const bars = useRef<Array<HTMLSpanElement | null>>([])
  useEffect(() => {
    if (!open || !on) return
    const levels = new Float32Array(METER_BARS)
    const shownLevels = new Float32Array(METER_BARS)
    let frame = 0
    const tick = () => {
      if (document.hidden) return
      frame = requestAnimationFrame(tick)
      music.meter(levels)
      for (let i = 0; i < METER_BARS; i++) {
        const rise = levels[i] > shownLevels[i]
        shownLevels[i] += (levels[i] - shownLevels[i]) * (rise ? 0.7 : 0.2)
        const bar = bars.current[i]
        const transform =
          METER_TRANSFORMS[
            Math.max(1, Math.round(shownLevels[i] * METER_STEPS))
          ]
        if (bar && bar.style.transform !== transform)
          bar.style.transform = transform
      }
    }
    const resume = () => {
      cancelAnimationFrame(frame)
      if (!document.hidden) frame = requestAnimationFrame(tick)
    }
    resume()
    document.addEventListener('visibilitychange', resume)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [open, on])
  if (!shown) return null
  const title = TRACK.title.replace(/ \(.*\)$/, '')
  return (
    <button
      type="button"
      onClick={() => music.toggle()}
      aria-pressed={on}
      data-no-stamp
      className="flex h-[47px] w-full items-center gap-2.5 text-left text-[15px] text-text-secondary touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {on ? (
        <VolumeIcon className="size-5 shrink-0" />
      ) : (
        <VolumeOffIcon className="size-5 shrink-0" />
      )}
      <span className="relative flex h-full min-w-0 flex-1 items-center leading-tight">
        <span
          className={
            'motion-reduce:transition-none ' +
            (on
              ? '-translate-y-3 transition-transform duration-200 ease-in-out'
              : 'translate-y-0 transition-transform duration-150 ease-in')
          }
        >
          {state === 'failed'
            ? 'Sound unavailable'
            : on
              ? 'Sound on'
              : 'Sound off'}
        </span>
        <span
          aria-hidden={!on}
          className={
            'absolute inset-x-0 top-[27px] flex items-center gap-1.5 text-[12px] leading-tight motion-reduce:transition-none ' +
            (on
              ? 'translate-y-0 opacity-100 blur-none [transition:translate_200ms_ease-in-out,opacity_200ms_ease-in,filter_200ms_ease-in]'
              : '-translate-y-2 opacity-0 blur-[2px] [transition:translate_150ms_ease-in,opacity_150ms_ease-out,filter_150ms_ease-out]')
          }
        >
          <img
            src={TRACK.art}
            alt=""
            width={18}
            height={18}
            className="size-[18px] shrink-0 object-cover"
          />
          <span className="min-w-0 truncate font-sans text-text">
            {TRACK.artist} - {title}
          </span>
        </span>
      </span>
      <span
        aria-hidden="true"
        className={
          'flex w-[18px] shrink-0 items-end gap-[2px] motion-reduce:transition-none ' +
          (on
            ? 'opacity-100 transition-opacity duration-200 ease-in-out'
            : 'opacity-0 transition-opacity duration-150 ease-in')
        }
        style={{ height: METER_STEPS * 2 + 2 }}
      >
        {Array.from({ length: METER_BARS }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              bars.current[i] = el
            }}
            className="block w-[3px] origin-bottom shrink-0 bg-brand"
            style={{ height: METER_STEPS * 2, transform: METER_TRANSFORMS[1] }}
          />
        ))}
      </span>
    </button>
  )
}

export function MusicControl({ path = '/' }: { path?: string }) {
  const { state, on, shown, untouched } = useMusicState(path)

  // Keep the silent timeline's animation too, updating DOM values only
  // when they change. Replacing an identical clock text every frame forces
  // needless layout work beneath the card's backdrop filter.
  const line = useRef<HTMLSpanElement>(null)
  const range = useRef<HTMLInputElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const bars = useRef<Array<HTMLSpanElement | null>>([])
  const scrubbing = useRef(false)
  const paintProgress = useRef<(at: number) => void>(() => {})
  useEffect(() => {
    if (!shown) return
    const levels = new Float32Array(METER_BARS)
    const smoothed = new Float32Array(METER_BARS)
    let progressWidth = 0
    let paintedPixel = -1
    let paintedWidth = 0
    paintProgress.current = (at) => {
      if (!line.current || progressWidth === 0) return
      const width = Math.max(
        1,
        Math.round(progressWidth * (window.devicePixelRatio || 1)),
      )
      const pixel = Math.round(at * width)
      if (pixel === paintedPixel && width === paintedWidth) return
      paintedPixel = pixel
      paintedWidth = width
      line.current.style.transform = `scaleX(${pixel / width})`
    }
    const resize = new ResizeObserver(([entry]) => {
      // Observe the unscaled box: getBoundingClientRect includes scaleX.
      progressWidth = entry.contentRect.width
      paintProgress.current(music.progress)
    })
    if (line.current) resize.observe(line.current)
    let frame = 0
    const tick = () => {
      if (document.hidden) return
      frame = requestAnimationFrame(tick)
      if (!scrubbing.current) {
        const at = music.progress
        // Subpixel progress changes cannot advance a visible pixel. Retain
        // those frames rather than invalidating the card every display tick.
        paintProgress.current(at)
        const position = String(Math.round(at * 1000))
        if (range.current && range.current.value !== position)
          range.current.value = position
        const text = `${clock(music.time)} / ${clock(music.duration)}`
        if (readout.current && readout.current.textContent !== text)
          readout.current.textContent = text
      }
      music.meter(levels)
      for (let i = 0; i < METER_BARS; i++) {
        const rise = levels[i] > smoothed[i]
        smoothed[i] += (levels[i] - smoothed[i]) * (rise ? 0.7 : 0.2)
        const bar = bars.current[i]
        const transform =
          METER_TRANSFORMS[Math.max(1, Math.round(smoothed[i] * METER_STEPS))]
        if (bar && bar.style.transform !== transform)
          bar.style.transform = transform
      }
    }
    const resume = () => {
      cancelAnimationFrame(frame)
      tick()
    }
    resume()
    document.addEventListener('visibilitychange', resume)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      paintProgress.current = () => {}
      document.removeEventListener('visibilitychange', resume)
    }
  }, [shown])

  /** The range moved, by hand or key: show it at once, and go there. */
  const onScrub = (value: number) => {
    const at = value / 1000
    paintProgress.current(at)
    if (readout.current)
      readout.current.textContent = `${clock(at * music.duration)} / ${clock(music.duration)}`
    music.seek(at * music.duration)
  }

  if (!shown) return null
  const title = TRACK.title.replace(/ \(.*\)$/, '')

  return (
    <div
      data-hero-quiet
      data-no-stamp
      data-music-control
      className="group/card pointer-events-auto fixed bottom-5 left-5 z-(--z-dropdown) isolate hidden h-[46px] items-stretch border border-border-subtle sm:flex"
    >
      <MusicBackdrop />
      <button
        type="button"
        onClick={() => music.toggle()}
        aria-pressed={on}
        aria-label={on ? 'Turn the sound off' : 'Turn the sound on'}
        title={on ? 'Sound off' : 'Sound on'}
        className="relative size-11 shrink-0 self-center border-r border-border-subtle bg-cover bg-center text-white touch-manipulation focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        style={{ backgroundImage: `url(${TRACK.art})` }}
      >
        {untouched ? (
          <span
            aria-hidden="true"
            className="music-ring pointer-events-none absolute -inset-px border border-brand"
          />
        ) : null}
        <span
          className={
            'absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity duration-150 ease-out ' +
            (on
              ? 'opacity-0 group-hover/card:opacity-100 group-has-[:focus-visible]/card:opacity-100 pointer-coarse:opacity-100'
              : 'opacity-100')
          }
        >
          {on ? (
            <VolumeIcon className="size-[18px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
          ) : (
            <VolumeOffIcon className="size-[18px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
          )}
        </span>
      </button>
      <span className="flex flex-col justify-center pr-4 pl-3 leading-tight">
        <span className="font-sans text-[12px] font-medium text-text">
          {state === 'failed' ? 'The sound could not start' : title}
        </span>
        <span className="relative mt-0.5 font-mono text-[12px] text-text-secondary">
          <span className="transition-opacity duration-150 ease-out group-has-[input:hover]/card:opacity-0 group-has-[input:focus-visible]/card:opacity-0 group-has-[input:active]/card:opacity-0">
            {TRACK.artist}
          </span>
          <span
            ref={readout}
            aria-hidden="true"
            className="absolute inset-0 opacity-0 transition-opacity duration-150 ease-out group-has-[input:hover]/card:opacity-100 group-has-[input:focus-visible]/card:opacity-100 group-has-[input:active]/card:opacity-100"
          />
        </span>
      </span>
      <span
        aria-hidden="true"
        className="mr-3 flex w-[18px] items-end gap-[2px] self-center"
        style={{ height: METER_STEPS * 2 + 2 }}
      >
        {Array.from({ length: METER_BARS }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              bars.current[i] = el
            }}
            className="block w-[3px] origin-bottom shrink-0 bg-brand"
            style={{ height: METER_STEPS * 2, transform: METER_TRANSFORMS[1] }}
          />
        ))}
      </span>
      {/* Progress and seeking, along the foot of the card. The painted line
          is the span; the range on top of it is the control, with a hit
          area a good deal taller than the line it draws and no handle of
          its own: the end of the line is the handle. */}
      <span
        ref={line}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-brand transition-[height] duration-150 ease-out group-hover/card:h-[4px] group-has-[:focus-visible]/card:h-[4px]"
        style={{ transform: 'scaleX(0)' }}
      />
      <input
        ref={range}
        type="range"
        min={0}
        max={1000}
        step={5}
        defaultValue={0}
        aria-label={t('Position in the track')}
        onPointerDown={() => {
          scrubbing.current = true
        }}
        onPointerUp={() => {
          scrubbing.current = false
        }}
        onPointerCancel={() => {
          scrubbing.current = false
        }}
        onInput={(event) => onScrub(Number(event.currentTarget.value))}
        className="music-seek absolute inset-x-0 -bottom-[6px] h-[14px] w-full cursor-pointer touch-none appearance-none bg-transparent focus-visible:outline-none"
      />
    </div>
  )
}
