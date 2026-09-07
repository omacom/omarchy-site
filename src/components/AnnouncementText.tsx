import { useEffect, useMemo, useRef } from 'react'
import { HERO_READY_EVENT } from '@/lib/etch'
import {
  SCRAMBLE_IN_TICKS,
  SCRAMBLE_TICK_MS,
  announcementMarkup,
  scrambleGlyph,
} from '@/lib/announcement-scramble'

const REPEAT_INTERVAL_MS = 6_000

/**
 * The registry's ASCII scramble, including the highlighted amount. Each
 * position resolves independently over 26 ticks. Starts are six seconds
 * apart while visible, with no per-session cap. Keyboard pause, hover,
 * focus, hidden tabs and reduced motion keep the complete message still.
 * The real message remains available to screen readers and without JS.
 * `html` is trusted repository content, not user input.
 */
export function AnnouncementText({
  html,
  identity,
  paused = false,
}: {
  html: string
  identity: string
  paused?: boolean
}) {
  const visual = useRef<HTMLSpanElement>(null)
  // Parent renders must not rewrite the opaque HTML subtree while its
  // decorative character spans are active.
  const markup = useMemo(() => ({ __html: announcementMarkup(html) }), [html])

  useEffect(() => {
    const element = visual.current
    if (
      !element ||
      paused ||
      typeof IntersectionObserver === 'undefined' ||
      typeof Intl.Segmenter !== 'function'
    )
      return

    const interaction =
      element.closest('.hero-announcement-frame') ?? element.closest('a')
    const hero = element.closest('[data-hero-sentinel]')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    const replacements: Array<{ wrapper: HTMLSpanElement; text: Text }> = []
    let disposed = false
    let visible = false
    let playing = false
    let plays = 0
    let lastStartedAt = 0
    let ready = !hero || hero.hasAttribute('data-hero-ready')
    let timer: number | undefined
    let ticker: number | undefined

    const canPlay = () =>
      !disposed &&
      visible &&
      !document.hidden &&
      !motion.matches &&
      !interaction?.matches(':hover, :focus-within')

    const clearTimer = () => {
      window.clearTimeout(timer)
      timer = undefined
    }

    const restore = () => {
      window.clearInterval(ticker)
      ticker = undefined
      for (const { wrapper, text } of replacements) wrapper.replaceWith(text)
      replacements.length = 0
      element.dataset.announcementPhase = 'idle'
      playing = false
    }

    const schedule = () => {
      if (!canPlay() || !ready || playing || timer !== undefined) return
      timer = window.setTimeout(
        () => {
          timer = undefined
          play()
        },
        plays === 0
          ? 180
          : Math.max(
              0,
              REPEAT_INTERVAL_MS - (performance.now() - lastStartedAt),
            ),
      )
    }

    const play = () => {
      if (!canPlay() || playing) return
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      const chunks: Array<{
        text: Text
        characters: string[]
        emphasized: boolean
      }> = []
      let count = 0
      while (walker.nextNode()) {
        const text = walker.currentNode as Text
        const characters = Array.from(
          segmenter.segment(text.data),
          (part) => part.segment,
        )
        count += characters.length
        if (count > 200) return
        chunks.push({
          text,
          characters,
          emphasized: !!text.parentElement?.closest('strong'),
        })
      }
      if (!count) return

      const cells: Array<{
        element: HTMLSpanElement
        original: string
        settlesAt: number
        emphasized: boolean
      }> = []
      for (const { text, characters, emphasized } of chunks) {
        const wrapper = document.createElement('span')
        text.replaceWith(wrapper)
        replacements.push({ wrapper, text })
        let word: HTMLSpanElement | undefined
        for (const character of characters) {
          if (/\s/u.test(character)) {
            wrapper.append(document.createTextNode(character))
            word = undefined
            continue
          }
          if (!word) {
            word = document.createElement('span')
            word.style.whiteSpace = 'nowrap'
            wrapper.append(word)
          }
          // Keep extended graphemes intact rather than narrowing an emoji
          // or separating a combining mark into a one-column ASCII cell.
          if (!/^[\x21-\x7e]$/u.test(character)) {
            word.append(document.createTextNode(character))
            continue
          }
          const cell = document.createElement('span')
          cell.style.display = 'inline-block'
          cell.style.width = '1ch'
          word.append(cell)
          cells.push({
            element: cell,
            original: character,
            settlesAt: 1 + Math.floor(Math.random() * SCRAMBLE_IN_TICKS),
            emphasized,
          })
        }
      }
      if (!cells.length) {
        restore()
        return
      }
      playing = true
      plays += 1
      lastStartedAt = performance.now()
      element.dataset.announcementPhase = 'scrambling'
      element.dataset.announcementPlay = String(plays)
      let tick = 0
      const paint = () => {
        for (const cell of cells) {
          const settled = tick >= cell.settlesAt
          cell.element.textContent = scrambleGlyph(
            cell.original,
            tick,
            cell.settlesAt,
          )
          cell.element.style.color =
            settled || cell.emphasized
              ? 'inherit'
              : Math.random() < 0.24
                ? 'var(--color-brand)'
                : 'var(--color-text-muted)'
        }
      }
      paint()
      ticker = window.setInterval(() => {
        if (!canPlay()) {
          sync()
          return
        }
        tick += 1
        if (tick > SCRAMBLE_IN_TICKS) {
          restore()
          schedule()
        } else {
          paint()
        }
      }, SCRAMBLE_TICK_MS)
    }

    const sync = () => {
      if (!canPlay()) {
        clearTimer()
        if (playing) restore()
      } else {
        schedule()
      }
    }
    const afterFocus = () => queueMicrotask(sync)
    const onReady = () => {
      ready = true
      window.clearTimeout(fallback)
      sync()
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.5
        sync()
      },
      { threshold: 0.5 },
    )
    // Even a late/unavailable canvas must not suppress every play. The full
    // message stays readable while waiting; later plays are logo-independent.
    const fallback = window.setTimeout(onReady, 8000)
    observer.observe(element)
    hero?.addEventListener(HERO_READY_EVENT, onReady)
    interaction?.addEventListener('pointerenter', sync)
    interaction?.addEventListener('pointerleave', sync)
    interaction?.addEventListener('focusin', sync)
    interaction?.addEventListener('focusout', afterFocus)
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      disposed = true
      clearTimer()
      window.clearTimeout(fallback)
      restore()
      observer.disconnect()
      hero?.removeEventListener(HERO_READY_EVENT, onReady)
      interaction?.removeEventListener('pointerenter', sync)
      interaction?.removeEventListener('pointerleave', sync)
      interaction?.removeEventListener('focusin', sync)
      interaction?.removeEventListener('focusout', afterFocus)
      motion.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [html, identity, paused])

  return (
    <span className="hero-announcement__text">
      <span className="sr-only" dangerouslySetInnerHTML={markup} />
      <span
        ref={visual}
        aria-hidden="true"
        data-announcement-visual
        data-announcement-phase="idle"
        data-announcement-play="0"
        dangerouslySetInnerHTML={markup}
      />
    </span>
  )
}
