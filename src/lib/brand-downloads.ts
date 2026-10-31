import { DEFAULT_THEME, THEME_EVENT } from '@/lib/theme'

function downloadName(link: HTMLAnchorElement) {
  const theme = document.documentElement.dataset.theme || DEFAULT_THEME
  return link.pathname
    .split('/')
    .pop()!
    .replace(/\.(svg|png)$/, `-${theme}.$1`)
}

const SVG_NS = 'http://www.w3.org/2000/svg'

async function themedAsset(link: HTMLAnchorElement, preview: HTMLElement) {
  // Capture the visible palette before fetching, even if the theme changes later.
  const style = getComputedStyle(preview)
  const colors = ['crest', 'hover', 'lit', 'mid', 'dim'].map((band) =>
    style.getPropertyValue(`--t-field-${band}`).trim(),
  )
  const filename = downloadName(link)
  const source = link.pathname.startsWith('/brand/oma-logo.')
    ? '/brand/oma-logo-mask.svg'
    : link.pathname.replace(/\.png$/, '.svg')
  const response = await fetch(source)
  if (!response.ok) throw new Error('Could not load logo')
  const svg = new DOMParser().parseFromString(
    await response.text(),
    'image/svg+xml',
  ).documentElement
  const [x, y, width, height] = svg
    .getAttribute('viewBox')!
    .split(/\s+/)
    .map(Number)
  const defs = document.createElementNS(SVG_NS, 'defs')
  const gradient = document.createElementNS(SVG_NS, 'linearGradient')
  gradient.id = 'download-theme'
  gradient.setAttribute('gradientUnits', 'userSpaceOnUse')
  gradient.setAttribute('x1', String(x))
  gradient.setAttribute('x2', String(x))
  gradient.setAttribute('y1', String(y))
  gradient.setAttribute('y2', String(y + height))
  const boundaries = [0, 26.316, 36.842, 57.895, 73.684, 100]
  colors.forEach((color, index) => {
    for (const offset of [boundaries[index], boundaries[index + 1]]) {
      const stop = document.createElementNS(SVG_NS, 'stop')
      stop.setAttribute('offset', `${offset}%`)
      stop.setAttribute('stop-color', color)
      gradient.append(stop)
    }
  })
  defs.append(gradient)
  svg.prepend(defs)
  svg
    .querySelectorAll('path, rect, circle, polygon, ellipse')
    .forEach((shape) => {
      shape.setAttribute('fill', 'url(#download-theme)')
    })
  svg.setAttribute('width', '4096')
  svg.setAttribute('height', String(Math.round((4096 * height) / width)))
  const vector = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: 'image/svg+xml',
  })
  if (filename.endsWith('.svg')) return { blob: vector, filename }

  const url = URL.createObjectURL(vector)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 4096
    canvas.height = Math.round((4096 * height) / width)
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error('Could not export PNG')),
        'image/png',
      )
    })
    return { blob, filename }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function watchBrandDownloads() {
  const updateLabels = () => {
    document
      .querySelectorAll<HTMLAnchorElement>('.brand__files a[download]')
      .forEach((link) => {
        link.textContent = downloadName(link)
        link.download = downloadName(link)
      })
  }
  updateLabels()
  document.addEventListener('astro:page-load', updateLabels)
  window.addEventListener(THEME_EVENT, updateLabels)

  document.addEventListener('click', async (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      '.brand__files a[download]',
    )
    const preview = link
      ?.closest('.brand__section')
      ?.querySelector<HTMLElement>('.brand__preview')
    if (!link || !preview) return
    event.preventDefault()
    try {
      const { blob, filename } = await themedAsset(link, preview)
      const url = URL.createObjectURL(blob)
      const download = document.createElement('a')
      download.href = url
      download.download = filename
      document.body.append(download)
      download.click()
      download.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      console.error('Theme logo download failed', error)
      alert('Could not prepare your themed logo. Please try again.')
    }
  })
}
