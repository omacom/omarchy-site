const WEBP = /\.webp(?=$|["')])/
const ATTRIBUTES = ['src', 'href', 'poster'] as const

// Safari on macOS < 11 can't decode WebP. Alpha images only have a PNG copy.
function swap(root: ParentNode) {
  for (const name of ATTRIBUTES)
    for (const el of Array.from(root.querySelectorAll(`[${name}$=".webp"]`))) {
      const value = el.getAttribute(name)!
      if (el instanceof HTMLImageElement)
        el.addEventListener('error', () => (el.src = `${value}.png`), {
          once: true,
        })
      el.setAttribute(name, `${value}.jpg`)
    }
  for (const el of Array.from(
    root.querySelectorAll<HTMLElement>('[style*=".webp"]'),
  ))
    el.style.backgroundImage = el.style.backgroundImage.replace(
      WEBP,
      '.webp.jpg',
    )
}

export function watchWebpFallback() {
  const probe = new Image()
  probe.onerror = () => {
    swap(document)
    new MutationObserver(() => swap(document)).observe(
      document.documentElement,
      { childList: true, subtree: true, attributeFilter: [...ATTRIBUTES] },
    )
  }
  probe.src =
    'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
}
