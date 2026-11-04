import { useEffect, useRef } from 'react'

/** Base milliseconds per keystroke, plus up to this much again at random. */
const KEY_MS = 58
const KEY_JITTER = 60
const WORD_PAUSE = 95
const ENDING_PAUSE = 70
/** How often a keystroke catches, and for how long. */
const HESITATE_ODDS = 0.07
const HESITATE_MS = 140
const DELETE_MS = 27
const HOLD_MS = 2100
const TURN_MS = 420

export function TypewriterTail({ phrases }: { phrases: readonly string[] }) {
  const text = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = text.current
    if (!el) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still || phrases.length === 0) {
      el.textContent = phrases[0] ?? ''
      return
    }

    const host = el.parentElement
    const block = el.closest<HTMLElement>('[data-typed-block]')
    const after = (i: number) => (i + 1) % phrases.length
    /** How much of the front of these two the reader would not see change. */
    const shared = (a: string, b: string) => {
      let i = 0
      while (i < a.length && i < b.length && a[i] === b[i]) i++
      return i
    }

    let timer = 0
    let index = 0
    let length = 0
    let deleting = false
    let running = false

    /** Holds the block at its tallest phrase, so no phrase can resize it. */
    const reserve = () => {
      if (!block) return
      const before = el.textContent
      block.style.minHeight = ''
      let tallest = 0
      for (const phrase of phrases) {
        el.textContent = phrase
        tallest = Math.max(tallest, block.getBoundingClientRect().height)
      }
      el.textContent = before
      block.style.minHeight = `${Math.ceil(tallest)}px`
    }

    const wait = () => {
      const phrase = phrases[index]
      if (deleting) return DELETE_MS
      let ms = KEY_MS + Math.random() * KEY_JITTER
      if (phrase[length - 1] === ' ') ms += WORD_PAUSE
      if (length >= phrase.length - 2) ms += ENDING_PAUSE
      if (Math.random() < HESITATE_ODDS) ms += HESITATE_MS
      return ms
    }

    const step = () => {
      const phrase = phrases[index]
      el.textContent = phrase.slice(0, length)

      let next = wait()
      if (!deleting && length === phrase.length) {
        deleting = true
        next = HOLD_MS
      } else if (deleting && length === shared(phrase, phrases[after(index)])) {
        deleting = false
        index = after(index)
        next = TURN_MS
      } else {
        length += deleting ? -1 : 1
      }

      host?.setAttribute(
        'data-typing',
        next > HOLD_MS - 1 || next === TURN_MS ? '0' : '1',
      )
      timer = window.setTimeout(step, next)
    }

    const start = () => {
      if (running) return
      running = true
      step()
    }
    const stop = () => {
      running = false
      window.clearTimeout(timer)
    }

    const watching = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '96px' },
    )

    let cancelled = false
    const begin = () => {
      if (cancelled) return
      reserve()
      watching.observe(block ?? el)
    }
    // Measured against the real webfont, or the reservation is a fallback's.
    // document.fonts is absent in some embedded browsers, whatever lib.dom
    // claims, and this runs before anything is painted.
    if (document.fonts?.ready) void document.fonts.ready.then(begin)
    else begin()

    const relayout = () => {
      if (running) reserve()
    }
    window.addEventListener('resize', relayout)
    return () => {
      cancelled = true
      stop()
      watching.disconnect()
      window.removeEventListener('resize', relayout)
      if (block) block.style.minHeight = ''
    }
  }, [phrases])

  return (
    <span data-typing="0">
      <span ref={text} />
      <span className="typed-caret" aria-hidden="true" />
    </span>
  )
}
