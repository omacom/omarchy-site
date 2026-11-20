/** A box on the map, in its units, to glide onto. */
export type MapBox = { x: number; y: number; width: number; height: number }

export function wholeMap(width: number, height: number): MapBox {
  return { x: 0, y: 0, width, height }
}

/**
 * Slide a frame back onto the map. A city in a corner used to be framed
 * with the padding hanging off the edge, so the glide landed on empty
 * space and the dot sat against the side of the window.
 */
export function fitOnMap(
  box: MapBox,
  width: number,
  height: number,
): MapBox {
  if (!(width > 0) || !(height > 0)) return box
  if (box.width >= width || box.height >= height) return wholeMap(width, height)
  let x = box.x
  let y = box.y
  if (x < 0) x = 0
  if (y < 0) y = 0
  if (x + box.width > width) x = width - box.width
  if (y + box.height > height) y = height - box.height
  return { x, y, width: box.width, height: box.height }
}

/** The box around a set of points, with room to breathe and never so
 *  small that a dot would be huge. Empty means the whole map. */
export function boxAround(
  points: { x: number; y: number }[],
  width: number,
  height: number,
): MapBox {
  if (points.length === 0) return wholeMap(width, height)
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const pad = 40
  let x0 = Math.min(...xs) - pad
  let x1 = Math.max(...xs) + pad
  let y0 = Math.min(...ys) - pad
  let y1 = Math.max(...ys) + pad
  const minW = width / 4
  const minH = height / 4
  if (x1 - x0 < minW) {
    const c = (x0 + x1) / 2
    x0 = c - minW / 2
    x1 = c + minW / 2
  }
  if (y1 - y0 < minH) {
    const c = (y0 + y1) / 2
    y0 = c - minH / 2
    y1 = c + minH / 2
  }
  const ratio = width / height
  if ((x1 - x0) / (y1 - y0) > ratio) {
    const h = (x1 - x0) / ratio
    const c = (y0 + y1) / 2
    y0 = c - h / 2
    y1 = c + h / 2
  } else {
    const w = (y1 - y0) * ratio
    const c = (x0 + x1) / 2
    x0 = c - w / 2
    x1 = c + w / 2
  }
  return fitOnMap(
    { x: x0, y: y0, width: x1 - x0, height: y1 - y0 },
    width,
    height,
  )
}
