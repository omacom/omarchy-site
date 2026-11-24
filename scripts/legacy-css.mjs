import cascadeLayers from '@csstools/postcss-cascade-layers'

// Safari < 15.4: vh fallback, real unit behind @supports (var() defeats plain fallbacks).
const viewportUnit = /(\d)[dsl]vh\b/g
const viewportFallback = {
  postcssPlugin: 'viewport-fallback',
  Declaration(decl, { AtRule }) {
    const rule = decl.parent
    if (
      !/\d[dsl]vh\b/.test(decl.value) ||
      rule.type !== 'rule' ||
      rule.parent.params === '(height: 1dvh)'
    )
      return
    const supports = new AtRule({ name: 'supports', params: '(height: 1dvh)' })
    supports.append(rule.clone({ nodes: [decl.clone()] }))
    rule.after(supports)
    decl.value = decl.value.replace(viewportUnit, '$1vh')
  },
}

// Safari 14 drops padding-inline etc. when the value holds var().
const logicalShorthand =
  /^(padding|margin|inset|scroll-padding|scroll-margin|border)-(inline|block)(-width|-style|-color)?$/
const logicalLonghands = {
  postcssPlugin: 'logical-longhands',
  Declaration(decl, { list }) {
    const m = decl.prop.match(logicalShorthand)
    if (!m || !decl.value.includes('var(')) return
    const [prop, box, axis, part = ''] = m
    const [start, end = start] =
      prop === `border-${axis}` ? [decl.value] : list.space(decl.value)
    decl.cloneBefore({ prop: `${box}-${axis}-start${part}`, value: start })
    decl.cloneBefore({ prop: `${box}-${axis}-end${part}`, value: end })
    decl.remove()
  },
}

// Tailwind's no-@property reset hits every element (~8x slower styling); scope it to readers.
const unsupportedSelector =
  /:has\(|:focus-visible|:dir\(|::backdrop|:popover-open|:modal|:open\b|:user-|:host/
const scopedPropertyReset = {
  postcssPlugin: 'scoped-property-reset',
  Once(root) {
    let reset
    const groups = new Map()
    root.walkRules((rule) => {
      if (rule.selector.includes('*,') && rule.first?.prop?.startsWith('--tw-'))
        return void (reset = rule)
      if (rule.parent.name?.endsWith('keyframes')) return
      const read = new Set()
      rule.walkDecls((d) => {
        for (const [, name] of d.value.matchAll(/var\((--tw-[\w-]+)/g))
          read.add(name)
      })
      if (!read.size) return
      const key = [...read].sort().join(' ')
      if (!groups.has(key)) groups.set(key, new Set())
      for (const s of rule.selectors)
        if (!unsupportedSelector.test(s)) groups.get(key).add(s)
    })
    if (!reset) return
    const initial = new Map(reset.nodes.map((d) => [d.prop, d]))
    for (const [key, selectors] of groups) {
      const decls = key.split(' ').filter((prop) => initial.has(prop))
      if (decls.length && selectors.size)
        reset.before(
          reset.clone({
            selectors: [...selectors],
            nodes: decls.map((prop) => initial.get(prop).clone()),
          }),
        )
    }
    reset.remove()
  },
}

// Translucent rgb() fallback for /NN opacity utilities on hex variables.
const translucent =
  /^color-mix\(in \w+, ?var\((--[\w-]+)\) ([\d.]+%), ?transparent\)$/
const channels = (hex) => {
  const h =
    hex.length === 4
      ? [...hex.slice(1)].map((c) => c + c).join('')
      : hex.slice(1)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')
}
const colorMixFallback = {
  postcssPlugin: 'color-mix-fallback',
  Once(root) {
    const defs = new Map()
    root.walkDecls(/^--/, (d) =>
      defs.set(d.prop, [...(defs.get(d.prop) ?? []), d.value]),
    )
    const hexSource = (name, depth = 0) => {
      const values = defs.get(name) ?? []
      if (!values.length || depth > 4) return null
      if (values.every((v) => /^#([\da-f]{3}|[\da-f]{6})$/i.test(v)))
        return name
      const alias =
        values.every((v) => v === values[0]) &&
        values[0].match(/^var\((--[\w-]+)\)$/)
      return alias ? hexSource(alias[1], depth + 1) : null
    }
    const used = new Set()
    root.walkDecls((d) => {
      const [, name, amount] = d.value.match(translucent) ?? []
      const source = name && hexSource(name)
      const supports = source && d.parent?.parent
      if (supports?.name !== 'supports') return
      used.add(source)
      supports.before(
        d.parent
          .clone({ nodes: [] })
          .append(d.clone({ value: `rgb(var(${source}-rgb) / ${amount})` })),
      )
    })
    root.walkDecls(/^--/, (d) => {
      if (used.has(d.prop))
        d.cloneAfter({ prop: `${d.prop}-rgb`, value: channels(d.value) })
    })
  },
}

// Read by src/lib/aspect-ratio-fallback.ts.
const aspectRatioMarker = {
  postcssPlugin: 'aspect-ratio-marker',
  Declaration: {
    'aspect-ratio': (decl) => {
      if (decl.value !== 'auto')
        decl.cloneBefore({ prop: '--aspect-ratio', value: decl.value })
    },
  },
}

export default [
  scopedPropertyReset,
  colorMixFallback,
  cascadeLayers(),
  viewportFallback,
  logicalLonghands,
  aspectRatioMarker,
]
