import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { legacyInitScript } from './legacy.ts'

/** Runs the inline script against a minimal stand-in for a browser. */
function run({ search = '', modern = true, stored = null as string | null }) {
  const appended: Array<{ id: string }> = []
  const sheets = [{ ownerNode: {}, disabled: false }]
  const storage = new Map<string, string>(
    stored ? [['omarchy-legacy', stored]] : [],
  )
  const html = { className: '' }
  const window: Record<string, unknown> = {
    CSS: { supports: () => modern },
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    addEventListener() {},
  }
  if (modern) window.CSSLayerBlockRule = function () {}
  const document = {
    readyState: 'complete',
    documentElement: html,
    head: { appendChild: (node: { id: string }) => appended.push(node) },
    styleSheets: sheets,
    getElementById: (id: string) =>
      appended.find((node) => node.id === id) ?? null,
    createElement: () => ({ id: '', appendChild() {} }),
    createTextNode: (text: string) => text,
    addEventListener() {},
  }
  window.window = window
  window.document = document
  window.location = { search }
  window.setTimeout = () => {}
  runInNewContext(legacyInitScript('/font.woff2'), window)
  return { html, appended, sheets, storage }
}

test('a modern browser is left exactly as it was', () => {
  const { html, appended, sheets } = run({})
  assert.equal(html.className, '')
  assert.equal(appended.length, 0)
  assert.equal(sheets[0].disabled, false)
})

test('an old browser gets the compatible sheet in place of the others', () => {
  const { html, appended, sheets } = run({ modern: false })
  assert.match(html.className, /\blegacy\b/)
  assert.equal(appended.length, 1)
  assert.equal(sheets[0].disabled, true)
})

test('?legacy forces the mode for the session and ?legacy=0 ends it', () => {
  const forced = run({ search: '?legacy' })
  assert.match(forced.html.className, /\blegacy\b/)
  assert.equal(forced.storage.get('omarchy-legacy'), '1')
  assert.match(run({ stored: '1' }).html.className, /\blegacy\b/)
  const ended = run({ search: '?legacy=0', stored: '1' })
  assert.equal(ended.html.className, '')
  assert.equal(ended.storage.has('omarchy-legacy'), false)
})
