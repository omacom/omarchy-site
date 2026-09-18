import { useEffect, useRef, useState } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { PICKER_STATE_EVENT, THEME_EVENT } from '@/lib/theme'
import { t } from '@/i18n/site'
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { PixelLabel } from '@/components/PixelLabel'
import { VolumeIcon, VolumeOffIcon } from '@/components/icons'
import { DRIVING_KEYS, RallyEngine } from '@/lib/rally-engine'
import type { View } from '@/lib/rally-engine'
import {
  STAGE,
  STAGE_LENGTH,
  formatTime,
  paceNote,
  stageKm,
} from '@/lib/rally-stage'
// Astro hoists CSS from dynamic imports into every page. Inlining keeps it
// in the lazy chunk so only players download it.
import rallyStyles from './rally.css?inline'

const INITIAL: View = {
  phase: 'ready',
  countdown: 3,
  time: 0,
  speed: 0,
  progress: 0,
  offroad: false,
  penalty: false,
  best: null,
  record: false,
  muted: false,
  audioAvailable: true,
}
const MAP_PATH = STAGE.filter((_, i) => i % 3 === 0)
  .map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`)
  .join(' ')
// The stage library stays free of the catalogue so Node can test it.
const PACE_NOTES: Record<string, string> = {
  'Finish ahead': t('Finish ahead'),
  'Flat out': t('Flat out'),
  'Tight left': t('Tight left'),
  'Tight right': t('Tight right'),
  'Easy left': t('Easy left'),
  'Easy right': t('Easy right'),
}

export function RallyGame({ onClose }: { onClose: () => void }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const engine = useRef<RallyEngine | null>(null)
  const [view, setView] = useState<View>(INITIAL)
  const pickerOpenRef = useRef(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [restoreFocus] = useState(
    () => document.activeElement as HTMLElement | null,
  )
  // Whichever card is showing, its primary action takes focus so Enter and
  // Space act on it without reaching for the mouse.
  const primaryRef = useRef<HTMLButtonElement | null>(null)
  const settled =
    view.phase === 'ready' ||
    view.phase === 'paused' ||
    view.phase === 'finished'
  useEffect(() => {
    if (settled && !pickerOpenRef.current)
      primaryRef.current?.focus({ preventScroll: true })
  }, [settled, view.phase])

  useEffect(() => {
    if (!canvas) return
    // An easter egg that cannot draw should get out of the way, not explain.
    const fail = (error: unknown) => {
      console.error('Rally could not draw', error)
      onClose()
    }
    let game: RallyEngine
    try {
      game = new RallyEngine(canvas, setView, fail)
    } catch (error) {
      fail(error)
      return
    }
    engine.current = game
    setView(game.view)

    let pickerFocusFrame = 0
    const onPickerState = (event: Event) => {
      const { open } = (event as CustomEvent<{ open: boolean }>).detail
      pickerOpenRef.current = open
      setPickerOpen(open)
      if (open) game.pause()
      // The picker focuses itself. Closing it returns to the paused game once
      // the rally's focus trap is back; resuming is an explicit action.
      cancelAnimationFrame(pickerFocusFrame)
      if (!open)
        pickerFocusFrame = requestAnimationFrame(() =>
          (primaryRef.current ?? canvas).focus({ preventScroll: true }),
        )
    }
    const refreshTheme = () => game.refreshPalette()
    const themeObserver = new MutationObserver(refreshTheme)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    const keydown = (event: KeyboardEvent) => {
      if (pickerOpenRef.current) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) {
        game.releaseAll()
        return
      }
      const key = event.key.toLowerCase()
      if (key === 'escape') {
        game.releaseAll()
        return
      }
      // Let focused buttons keep their native Space and Enter behaviour.
      if (
        (key === ' ' || key === 'enter') &&
        (event.target as HTMLElement)?.closest('button')
      )
        return
      if (key === 'enter') {
        if (!event.repeat && game.proceed()) event.preventDefault()
        return
      }
      if (!DRIVING_KEYS.has(key) && key !== 'p' && key !== 'r') return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.repeat) return
      if (key === 'p') {
        if (game.view.phase === 'paused') game.resume()
        else game.pause()
      } else if (key === 'r') game.recover()
      else if (key === ' ') {
        // Space starts or resumes from a card and is the handbrake while driving.
        if (!game.proceed()) game.press(key)
      } else game.press(key)
    }
    const keyup = (event: KeyboardEvent) =>
      game.release(event.key.toLowerCase())
    const pause = () => game.pause()
    const visibility = () => {
      if (document.hidden) game.pause()
    }
    window.addEventListener(PICKER_STATE_EVENT, onPickerState)
    window.addEventListener(THEME_EVENT, refreshTheme)
    window.addEventListener('keydown', keydown, true)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      game.dispose()
      engine.current = null
      cancelAnimationFrame(pickerFocusFrame)
      themeObserver.disconnect()
      window.removeEventListener(PICKER_STATE_EVENT, onPickerState)
      window.removeEventListener(THEME_EVENT, refreshTheme)
      window.removeEventListener('keydown', keydown, true)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', pause)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [canvas])

  const touch = (key: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      if (pickerOpenRef.current) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      engine.current?.press(key)
    },
    onPointerUp: () => engine.current?.release(key),
    onPointerCancel: () => engine.current?.release(key),
    onLostPointerCapture: () => engine.current?.release(key),
  })
  const note = paceNote(view.progress)
  const isDriving = view.phase === 'racing' || view.phase === 'countdown'
  const point = STAGE[view.progress]
  const completion = Math.min(100, (point.distance / STAGE_LENGTH) * 100)

  return (
    <Dialog
      open
      modal={!pickerOpen}
      disablePointerDismissal={pickerOpen}
      onOpenChange={(open, details) => {
        if (pickerOpenRef.current) {
          details.cancel()
          details.allowPropagation()
          return
        }
        if (!open) onClose()
      }}
    >
      <DialogPortal>
        <style>{rallyStyles}</style>
        <DialogOverlay className="rally-backdrop" />
        <DialogPrimitive.Popup
          className="rally-dialog"
          initialFocus={primaryRef}
          finalFocus={() => restoreFocus}
        >
          <header className="rally-header">
            <div className="rally-brand">
              <span className="rally-checker" aria-hidden="true" />
              <DialogTitle>
                OMARCHY <span>RALLY</span>
              </DialogTitle>
            </div>
            <span className="rally-edition">QUATTRO / 04</span>
            <button
              className="rally-sound"
              onClick={() => engine.current?.toggleSound()}
              disabled={!view.audioAvailable}
              aria-label={
                !view.audioAvailable
                  ? t('Rally sound unavailable')
                  : view.muted
                    ? t('Unmute rally sound')
                    : t('Mute rally sound')
              }
              aria-pressed={!view.muted && view.audioAvailable}
              title={
                !view.audioAvailable
                  ? t('Sound unavailable')
                  : view.muted
                    ? t('Sound off')
                    : t('Sound on')
              }
            >
              {view.muted || !view.audioAvailable ? (
                <VolumeOffIcon />
              ) : (
                <VolumeIcon />
              )}
            </button>
            <DialogClose className="rally-exit" aria-label={t('Close rally')}>
              ESC <span aria-hidden="true">×</span>
            </DialogClose>
          </header>
          <DialogDescription className="sr-only">
            {t(
              'A timed gravel rally. Use W or up to accelerate, S or down to brake and reverse, A/D or left/right to steer, Space for the handbrake, P to pause, R to recover with a three-second penalty, Enter to start or resume, and Escape to exit.',
            )}
          </DialogDescription>
          <div className={`rally-stage rally-stage--${view.phase}`}>
            <canvas
              ref={setCanvas}
              className="rally-canvas"
              tabIndex={0}
              aria-label={t(
                'Rally course. Driving controls are described above.',
              )}
            />
            <div className="rally-grain" aria-hidden="true" />
            {view.phase === 'ready' && (
              <div className="rally-intro">
                <div className="rally-eyebrow">
                  <span /> {t('Secret stage unlocked')}
                </div>
                <h2>
                  <span className="sr-only">Omarchy Rally</span>
                  <span aria-hidden="true">
                    <PixelLabel text="OMARCHY" cell={6} />
                    <PixelLabel text="RALLY" cell={9} />
                  </span>
                </h2>
                <p>
                  {t('A gravel sprint through the pines.')}
                  <br />
                  {t('Keep it tidy. Or take it sideways.')}
                </p>
                <div className="rally-stage-label">
                  <span>01</span>
                  <div>
                    <strong>{t('North Forest')}</strong>
                    <small>
                      {stageKm} km <b>·</b> {t('Gravel')} <b>·</b>{' '}
                      {t('Time attack')}
                    </small>
                  </div>
                </div>
                <button
                  ref={primaryRef}
                  className="rally-primary"
                  onClick={() => engine.current?.start()}
                >
                  {t('Start your engine')} <span aria-hidden="true">↗</span>
                </button>
                <div className="rally-best">
                  {view.best
                    ? `${t('Personal best')}  ${formatTime(view.best)}`
                    : t('No record. Your road.')}
                </div>
              </div>
            )}
            {isDriving && (
              <>
                <div className="rally-clock">
                  <span>{t('Stage time')}</span>
                  <strong>{formatTime(view.time)}</strong>
                  <small>
                    {view.best
                      ? `${t('Best')} ${formatTime(view.best)}`
                      : t('Set the first time')}
                  </small>
                </div>
                <div className="rally-pace">
                  <strong aria-hidden="true">{note.arrow}</strong>
                  <span>{PACE_NOTES[note.text] ?? note.text}</span>
                </div>
                <button
                  className="rally-pause"
                  onClick={() => engine.current?.pause()}
                  aria-label={t('Pause rally')}
                >
                  Ⅱ
                </button>
                <div className="rally-speed">
                  <strong>{String(view.speed).padStart(3, '0')}</strong>
                  <span>{t('km/h')}</span>
                  <div className="rally-revs">
                    {Array.from({ length: 12 }, (_, i) => (
                      <i key={i} className={view.speed > i * 13 ? 'lit' : ''} />
                    ))}
                  </div>
                </div>
                <div
                  className="rally-map"
                  aria-label={`${t('Stage progress')}: ${Math.round(completion)}%`}
                >
                  <svg viewBox="-100 -3950 1900 4300" aria-hidden="true">
                    <path
                      d={MAP_PATH}
                      fill="none"
                      stroke="var(--rally-text)"
                      strokeOpacity="0.25"
                      strokeWidth="55"
                      strokeLinecap="round"
                    />
                    <path
                      d={MAP_PATH}
                      fill="none"
                      stroke="var(--rally-text)"
                      strokeWidth="32"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray={`${completion} 100`}
                    />
                    <circle
                      cx={STAGE.at(-1)!.x}
                      cy={STAGE.at(-1)!.y}
                      r="64"
                      fill="var(--rally-text)"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="83"
                      fill="var(--rally-accent)"
                      stroke="var(--rally-bg)"
                      strokeWidth="30"
                    />
                  </svg>
                  <span>
                    {(
                      Math.max(0, STAGE_LENGTH - point.distance) / 3000
                    ).toFixed(1)}{' '}
                    {t('km to go')}
                  </span>
                </div>
                {(view.offroad || view.penalty) && (
                  <div className="rally-warning" role="status">
                    {view.penalty ? (
                      t('+3 sec · Back on track')
                    ) : (
                      <button onClick={() => engine.current?.recover()}>
                        {t('Off road · Recover +3s')}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            {view.phase === 'countdown' && (
              <div className="rally-countdown" aria-live="polite">
                <strong>{view.countdown}</strong>
                <span>{t('Get ready')}</span>
              </div>
            )}
            {view.phase === 'paused' && (
              <div className="rally-scrim">
                <div className="rally-card">
                  <div className="rally-eyebrow">{t('Take a breather')}</div>
                  <h2>{t('In the service park.')}</h2>
                  <p>{t('The clock is stopped.')}</p>
                  <button
                    ref={primaryRef}
                    className="rally-primary"
                    onClick={() => engine.current?.resume()}
                  >
                    {t('Back to the stage')} <span>↗</span>
                  </button>
                  <button
                    className="rally-secondary"
                    onClick={() => engine.current?.start()}
                  >
                    {t('Restart stage')}
                  </button>
                </div>
              </div>
            )}
            {view.phase === 'finished' && (
              <div className="rally-scrim">
                <div className="rally-card">
                  <div className="rally-eyebrow">
                    {view.record ? t('New personal best') : t('Stage complete')}
                  </div>
                  <h2>{t('That’s a wrap.')}</h2>
                  <div className="rally-result">{formatTime(view.time)}</div>
                  <p>
                    {t('North Forest')} <b>·</b> {stageKm} {t('km of gravel')}
                  </p>
                  <button
                    ref={primaryRef}
                    className="rally-primary"
                    onClick={() => engine.current?.start()}
                  >
                    {t('One more run')} <span>↗</span>
                  </button>
                  <DialogClose className="rally-secondary">
                    {t('Back to Omarchy')}
                  </DialogClose>
                </div>
              </div>
            )}
            {isDriving && (
              <div
                className="rally-touch"
                aria-label={t('Touch driving controls')}
              >
                <div>
                  <button aria-label={t('Steer left')} {...touch('a')}>
                    ←
                  </button>
                  <button aria-label={t('Steer right')} {...touch('d')}>
                    →
                  </button>
                </div>
                <div>
                  <button className="rally-touch-drift" {...touch(' ')}>
                    {t('Drift')}
                  </button>
                  <button aria-label={t('Brake and reverse')} {...touch('s')}>
                    ↓
                  </button>
                  <button aria-label={t('Accelerate')} {...touch('w')}>
                    ↑
                  </button>
                </div>
              </div>
            )}
          </div>
          <footer className="rally-footer">
            <span>
              <kbd>WASD</kbd> / <kbd>↑ ↓ ← →</kbd> {t('Drive')}
            </span>
            <span>
              <kbd>SPACE</kbd> {t('Handbrake')}
            </span>
            <span>
              <kbd>R</kbd> {t('Recover')} +3s
            </span>
            <span>
              <kbd>P</kbd> {t('Pause')}
            </span>
            <span>
              <kbd>ENTER</kbd> {t('Start')}
            </span>
            <span className="rally-footer-tag">
              {t('Built for the detour.')}
            </span>
          </footer>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  )
}
