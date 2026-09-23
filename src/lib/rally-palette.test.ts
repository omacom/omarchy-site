import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createRallyPalette, FIELD_COLORS, luminance } from './rally-palette.ts'
import type { RallyColors, RGB } from './rally-palette.ts'
import { SITE_THEMES } from './site-themes.ts'

const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')
const blocks = new Map(
  [...styles.matchAll(/\[data-theme='([^']+)'\]\s*\{([^}]+)\}/g)].map(
    (match) => [match[1], match[2]],
  ),
)
const rgb = (value: string): RGB => {
  if (value.startsWith('#'))
    return [1, 3, 5].map((at) =>
      parseInt(value.slice(at, at + 2), 16),
    ) as unknown as RGB
  return value
    .match(/[\d.]+/g)!
    .slice(0, 3)
    .map(Number) as unknown as RGB
}

// Iterates the registry, so a new theme is covered without touching this file.
test('all shipped themes keep shadows dark and highlights light', () => {
  for (const { id: name, light: isLight } of SITE_THEMES) {
    const body = blocks.get(name)
    assert.ok(body, `${name}: no [data-theme] block in styles.css`)
    const token = (key: string) => {
      const value = body.match(
        new RegExp(`--t-${key}:\\s*(#[a-fA-F0-9]{6});`),
      )?.[1]
      assert.ok(value, `${name}: missing ${key}`)
      return rgb(value)
    }
    const colors: RallyColors = {
      ...(Object.fromEntries(
        FIELD_COLORS.map((key) => [key, token(`field-${key}`)]),
      ) as Record<(typeof FIELD_COLORS)[number], RGB>),
      brand: token('brand'),
      brandInk: token('brand-ink'),
      paper: token('bg'),
      ink: token('text'),
    }
    const palette = createRallyPalette(colors)
    const light = (key: Exclude<keyof typeof palette, 'daylight'>) =>
      luminance(rgb(palette[key]))
    assert.equal(palette.daylight, Boolean(isLight), name)
    assert.ok(
      light('dark') < light('ground'),
      `${name}: shadows must darken the ground`,
    )
    assert.ok(
      light('dark') < light('road'),
      `${name}: tyre marks must darken the road`,
    )
    assert.ok(
      light('treeTop') > light('treeBase'),
      `${name}: treetops must catch the light`,
    )
    assert.ok(
      light('roadInner') > light('road'),
      `${name}: worn gravel must be lighter`,
    )
    assert.ok(
      light('road') > light('ground'),
      `${name}: distinguish road from forest`,
    )
    assert.ok(
      (light('text') + 0.05) / (light('dark') + 0.05) > 4.5,
      `${name}: car markings must stay legible`,
    )
    assert.deepEqual(
      rgb(palette.accent),
      colors.brand,
      `${name}: preserve the theme accent`,
    )
  }
})
