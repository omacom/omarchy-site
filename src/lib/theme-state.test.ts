import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import {
  DEFAULT_THEME,
  THEME_KEY,
  readTheme,
  saveTheme,
  themeForNavigation,
  themeInitScript,
} from './theme-state.ts'
import { SITE_THEMES } from './site-themes.ts'

function visit(
  search = '',
  stored: string | null = 'nord',
  blocked = false,
  light = false,
) {
  const writes: string[] = []
  const document = {
    documentElement: { dataset: {} as Record<string, string> },
    querySelector: () => ({}),
  }
  const location = new URL(`https://omarchy.org/doctrine/${search}`)
  const state = { index: 7, scrollY: 350 }
  const history = {
    state,
    replaceState(next: typeof state, _: string, url: URL) {
      assert.equal(next, state, 'preserve Astro history state')
      location.href = url.href
    },
  }
  const localStorage = {
    getItem(key: string) {
      assert.equal(key, THEME_KEY)
      if (blocked) throw new Error('storage unavailable')
      return stored
    },
    setItem(key: string, value: string) {
      assert.equal(key, THEME_KEY)
      if (blocked) throw new Error('storage unavailable')
      writes.push(value)
      stored = value
    },
  }
  const matchMedia = () => ({ matches: light })
  const context = {
    document,
    location,
    history,
    localStorage,
    URLSearchParams,
    window: { matchMedia },
    matchMedia,
  }
  const initialize = () => runInNewContext(themeInitScript, context)
  const run = (fn: () => void) => {
    const originals = Object.getOwnPropertyDescriptors(globalThis)
    try {
      for (const [key, value] of Object.entries(context)) {
        Object.defineProperty(globalThis, key, { value, configurable: true })
      }
      fn()
    } finally {
      for (const key of Object.keys(context)) {
        if (originals[key])
          Object.defineProperty(globalThis, key, originals[key])
        else Reflect.deleteProperty(globalThis, key)
      }
    }
  }
  return { document, location, writes, initialize, run }
}

test('every supported URL theme wins before paint without saving', () => {
  for (const { id } of SITE_THEMES) {
    const page = visit(`?theme=${id}&source=cli#beauty-is-truth`)
    page.initialize()
    assert.equal(page.document.documentElement.dataset.theme, id)
    assert.deepEqual(page.writes, [])
    page.run(() => assert.equal(readTheme(), id))
    assert.equal(page.location.search, `?theme=${id}&source=cli`)
    assert.equal(page.location.hash, '#beauty-is-truth')
  }
})

test('missing, empty and unsupported values preserve saved preference', () => {
  for (const query of ['', '?theme=', '?theme=unknown', '?theme=CATPPUCCIN']) {
    const page = visit(query)
    page.initialize()
    page.run(() => assert.equal(readTheme(), 'nord'))
    assert.deepEqual(page.writes, [])
  }
})

test('a fresh visit retains random system palette selection and persistence', () => {
  for (const stored of [null, 'unsupported']) {
    const page = visit('', stored)
    page.initialize()
    const selected = page.document.documentElement.dataset.theme
    assert.ok(SITE_THEMES.some((t) => t.id === selected && !t.light))
    assert.deepEqual(page.writes, [selected])
  }
})

test('unavailable storage does not block a URL theme or the existing fallback', () => {
  for (const query of ['?theme=catppuccin', '', '?theme=', '?theme=invalid']) {
    const page = visit(query, null, true)
    page.initialize()
    page.run(() =>
      assert.equal(
        readTheme(),
        query === '?theme=catppuccin' ? 'catppuccin' : DEFAULT_THEME,
      ),
    )
    assert.deepEqual(page.writes, [])
  }
})

test('explicit choices, including the URL theme, save and preserve other URL and history state', () => {
  for (const chosen of ['catppuccin', 'nord']) {
    const page = visit(
      '?source=cli&theme=catppuccin&tag=a&tag=b#beauty-is-truth',
    )
    page.initialize()
    page.run(() => saveTheme(chosen))
    assert.deepEqual(page.writes, [chosen])
    assert.equal(page.location.search, '?source=cli&tag=a&tag=b')
    assert.equal(page.location.hash, '#beauty-is-truth')
  }
})

test('choices still clear the URL when storage is blocked; plain URLs stay intact', () => {
  for (const query of [
    '?theme=catppuccin&source=cli#beauty-is-truth',
    '?source=cli#beauty-is-truth',
  ]) {
    const page = visit(query, null, true)
    page.initialize()
    page.run(() => saveTheme('catppuccin'))
    assert.equal(page.location.search, '?source=cli')
    assert.equal(page.location.hash, '#beauty-is-truth')
  }
})

test('Astro carries the active palette, accepts explicit destinations, and revisits URL themes', () => {
  const page = visit('?theme=catppuccin')
  page.initialize()
  page.run(() => {
    for (const [path, expected] of [
      ['/manual/', 'catppuccin'],
      ['/manual/?theme=', 'catppuccin'],
      ['/manual/?theme=unknown', 'catppuccin'],
      ['/doctrine/?theme=white#beauty-is-truth', 'white'],
      ['/manual/', 'white'],
      ['/doctrine/?theme=catppuccin', 'catppuccin'],
    ]) {
      const destination = new URL(path, page.location)
      const incoming = themeForNavigation(destination)
      assert.equal(incoming, expected)
      page.document.documentElement.dataset.theme = incoming
      page.location.href = destination.href
      page.initialize() // Astro reruns the head script after swapping.
      assert.equal(readTheme(), expected)
    }
    saveTheme('nord')
    page.document.documentElement.dataset.theme = 'nord'
    assert.equal(themeForNavigation(new URL('/manual/', page.location)), 'nord')
  })
  assert.deepEqual(page.writes, ['nord'])
  const fresh = visit('', 'nord')
  fresh.initialize()
  fresh.run(() => assert.equal(readTheme(), 'nord'))
})

test('the fresh fallback still follows a light system color scheme', () => {
  const page = visit('', null, false, true)
  page.initialize()
  const selected = page.document.documentElement.dataset.theme
  assert.ok(SITE_THEMES.some((theme) => theme.id === selected && theme.light))
  assert.deepEqual(page.writes, [selected])
})
