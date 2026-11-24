import type { CSSProperties } from 'react'

const INLINE = '[style*="--aspect-ratio"]'

const parse = (value: string) => {
  const variable = value.match(/^\s*var\((--[\w-]+)\)/)?.[1]
  if (variable)
    value = getComputedStyle(document.documentElement).getPropertyValue(
      variable,
    )
  const [w, h = 1] = value.split('/').map(Number)
  return w && h ? w / h : 0
}

export const aspectRatio = (ratio: string) =>
  ({ aspectRatio: ratio, '--aspect-ratio': ratio }) as CSSProperties

// Safari < 15 has no aspect-ratio.
export function watchAspectRatioFallback() {
  if (CSS.supports('aspect-ratio: 1')) return
  const rules: Array<[selector: string, ratio: number]> = []
  const collect = (list: CSSRuleList) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSStyleRule) {
        const ratio = parse(rule.style.getPropertyValue('--aspect-ratio'))
        if (ratio) rules.push([rule.selectorText, ratio])
      } else if ('cssRules' in rule) collect((rule as CSSGroupingRule).cssRules)
    }
  }
  for (const sheet of Array.from(document.styleSheets))
    try {
      collect(sheet.cssRules)
    } catch {
      // Cross-origin sheets are unreadable.
    }

  const ratios = new WeakMap<Element, number>()
  const fit = (box: Element) =>
    ((box as HTMLElement).style.height =
      `${(box as HTMLElement).offsetWidth / ratios.get(box)!}px`)
  const resize = new ResizeObserver((entries) =>
    requestAnimationFrame(() => entries.forEach(({ target }) => fit(target))),
  )
  const track = (box: Element, ratio: number) => {
    if (!ratio || ratios.get(box) === ratio) return
    ratios.set(box, ratio)
    fit(box)
    resize.observe(box)
  }
  let queued = false
  const scan = () => {
    queued = false
    for (const [selector, ratio] of rules)
      for (const box of Array.from(document.querySelectorAll(selector)))
        track(box, ratio)
    for (const box of Array.from(
      document.querySelectorAll<HTMLElement>(INLINE),
    ))
      track(box, parse(box.style.getPropertyValue('--aspect-ratio')))
  }
  scan()
  new MutationObserver(() => {
    if (!queued) queued = !!requestAnimationFrame(scan)
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributeFilter: ['style'],
  })
}
