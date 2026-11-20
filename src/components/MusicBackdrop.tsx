import { useEffect, useRef } from 'react'
import { onFieldPaint } from '@/lib/field-backdrop'

const BLUR = 8
const PAD = BLUR * 3

/** Cache just the field patch under the card, with its original blur.
 * Native backdrop filtering remains for content, scrolling and entrances. */
export function MusicBackdrop() {
  const surface = useRef<HTMLSpanElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const tint = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const box = surface.current
    const image = canvas.current
    const wash = tint.current
    if (!box || !image || !wash) return
    const ctx = image.getContext('2d', { alpha: false })
    if (
      !ctx ||
      !('filter' in ctx) ||
      !CSS.supports('backdrop-filter', `blur(${BLUR}px)`)
    )
      return

    let rect = box.getBoundingClientRect()
    let dirty = true
    let sampled = false
    let source: HTMLCanvasElement | null = null
    let scrolling = false
    let scrollEnd = 0
    let crop = { x: 0, y: 0, width: 0, height: 0 }
    let scale = 0
    const show = (next: boolean) => {
      if (next === sampled) return
      sampled = next
      image.style.visibility = next ? 'visible' : 'hidden'
      wash.style.backdropFilter = next ? 'none' : ''
    }
    const measure = () => {
      rect = box.getBoundingClientRect()
      dirty = true
      // Restore the real page backdrop immediately while scrolling.
      show(false)
    }
    const onScroll = () => {
      scrolling = true
      measure()
      window.clearTimeout(scrollEnd)
      scrollEnd = window.setTimeout(() => {
        scrolling = false
      }, 150)
    }
    const resize = new ResizeObserver(measure)
    resize.observe(box)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', onScroll, { passive: true })

    const unsubscribe = onFieldPaint((frame) => {
      if (
        source &&
        (!source.isConnected || (source === frame.canvas && !frame.ready))
      ) {
        show(false)
        source = null
        image.width = image.height = 1
      }
      if (scrolling || !frame.ready || rect.width < 1 || rect.height < 1) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const clip = frame.host.getBoundingClientRect()
      if (
        rect.left - PAD < clip.left ||
        rect.top - PAD < clip.top ||
        rect.right + PAD > clip.right ||
        rect.bottom + PAD > clip.bottom
      ) {
        if (source === frame.canvas) show(false)
        return
      }
      // A field texture contains its pixels, not the text layered above it.
      // Keep native blur whenever that text reaches the card's blur kernel.
      for (const element of [
        ...frame.quiet,
        ...(frame.host.parentElement?.querySelectorAll<HTMLElement>(
          '[data-backdrop-obstacle]',
        ) ?? []),
      ]) {
        if (box.parentElement?.contains(element)) continue
        const obstacle = element.getBoundingClientRect()
        if (
          obstacle.width > 0 &&
          obstacle.height > 0 &&
          obstacle.left < rect.right + PAD &&
          obstacle.right > rect.left - PAD &&
          obstacle.top < rect.bottom + PAD &&
          obstacle.bottom > rect.top - PAD
        ) {
          show(false)
          return
        }
      }

      if (
        source === frame.canvas &&
        sampled &&
        !dirty &&
        scale === dpr &&
        !frame.hasDamage(crop.x, crop.y, crop.width, crop.height)
      )
        return

      const field = frame.canvas.getBoundingClientRect()
      const width = Math.round(rect.width * dpr)
      const height = Math.round(rect.height * dpr)
      if (image.width !== width) image.width = width
      if (image.height !== height) image.height = height
      crop = {
        x: ((rect.left - PAD - field.left) / field.width) * frame.canvas.width,
        y: ((rect.top - PAD - field.top) / field.height) * frame.canvas.height,
        width: ((rect.width + PAD * 2) / field.width) * frame.canvas.width,
        height: ((rect.height + PAD * 2) / field.height) * frame.canvas.height,
      }
      ctx.filter = 'none'
      ctx.fillStyle = frame.background
      ctx.fillRect(0, 0, width, height)
      ctx.imageSmoothingEnabled = false
      ctx.filter = `blur(${BLUR * dpr}px)`
      ctx.drawImage(
        frame.canvas,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        -PAD * dpr,
        -PAD * dpr,
        (rect.width + PAD * 2) * dpr,
        (rect.height + PAD * 2) * dpr,
      )
      source = frame.canvas
      scale = dpr
      dirty = false
      show(true)
    })
    return () => {
      unsubscribe()
      resize.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(scrollEnd)
      source = null
      image.width = image.height = 1
      show(false)
    }
  }, [])

  return (
    <span
      ref={surface}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
    >
      <canvas
        ref={canvas}
        data-music-backdrop
        width={1}
        height={1}
        className="invisible absolute inset-0 h-full w-full"
      />
      <span
        ref={tint}
        className="absolute inset-0 bg-bg/85 supports-backdrop-filter:backdrop-blur-sm"
      />
    </span>
  )
}
