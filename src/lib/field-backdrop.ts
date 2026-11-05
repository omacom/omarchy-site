export type FieldPaint = {
  canvas: HTMLCanvasElement
  host: HTMLElement
  quiet: readonly HTMLElement[]
  background: string
  ready: boolean
  hasDamage: (x: number, y: number, width: number, height: number) => boolean
}

const listeners = new Set<(frame: FieldPaint) => void>()

/** Share an existing field frame without starting another animation loop. */
export function onFieldPaint(listener: (frame: FieldPaint) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function paintFieldBackdrops(frame: FieldPaint) {
  for (const listener of listeners) listener(frame)
}
