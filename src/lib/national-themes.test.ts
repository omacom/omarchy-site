import assert from 'node:assert/strict'
import { test } from 'node:test'
import locales from '../i18n/locales.json' with { type: 'json' }
import { nationalThemeOf } from './national-sites.ts'
import { contrast, NATIONAL_THEMES, themeTokens } from './national-themes.ts'

test('every language site but the English one wears a national theme', () => {
  const worn = new Set<string>()
  for (const code of Object.keys(locales)) {
    const theme = nationalThemeOf(code)
    if (code === 'en') assert.equal(theme, null)
    else assert.ok(theme, `${code} has no national theme`)
    if (theme) worn.add(theme.id)
  }
  assert.equal(worn.size, NATIONAL_THEMES.length, 'a theme no site wears')
})

test('every national theme reads at 4.5:1', () => {
  for (const theme of NATIONAL_THEMES) {
    const t = themeTokens(theme)
    const pairs = [
      ['text', t.text, t.bg],
      ['text', t.text, t.surface],
      ['secondary text', t['text-secondary'], t.bg],
      ['muted text', t['text-muted'], t.bg],
      ['muted text', t['text-muted'], t['surface-2']],
      ['brand', t.brand, t.bg],
      ['button label', t['brand-ink'], t.brand],
    ]
    for (const [what, fg, bg] of pairs)
      assert.ok(
        contrast(fg, bg) >= 4.5,
        `${theme.id}: ${what} ${fg} on ${bg} is ${contrast(fg, bg).toFixed(2)}:1`,
      )
  }
})
