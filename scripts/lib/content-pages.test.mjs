import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { renderPage, collectContentPages } from './content-pages.mjs'
import { collectSources } from '../translation-sources.mjs'

test('new nested Markdown pages are discovered and translated without registration', (t) => {
  const root = mkdtempSync(path.join(tmpdir(), 'omarchy-pages-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const content = path.join(root, 'content')
  mkdirSync(path.join(content, 'guides'), { recursive: true })
  mkdirSync(path.join(content, 'news'), { recursive: true })
  writeFileSync(
    path.join(content, 'guides', 'example.md'),
    '---\ntitle: Example\nseoTitle: Example page\ndescription: A new page.\n---\n\n## Welcome\n\nA [link](/staff).\n',
  )
  writeFileSync(
    path.join(content, 'news', 'ignored.md'),
    'News uses its own pipeline',
  )
  const pages = collectContentPages(content)
  assert.deepEqual(Object.keys(pages), ['guides/example'])
  mkdirSync(path.join(root, 'src/data'), { recursive: true })
  writeFileSync(path.join(root, 'src/data/pages.json'), JSON.stringify(pages))
  assert.deepEqual(collectSources(root), {
    messages: ['A new page.', 'Example', 'Example page'],
    blocks: ['A <a href="/staff">link</a>.', 'Welcome'],
  })
})

test('principle headings keep stable anchors without numbering or periods', () => {
  const source =
    "---\ntitle: Principles\npresentation: principles\n---\n\n## 10. You're somebody now.\n\n[Staff](/staff).\n"
  const page = renderPage(source)
  assert.equal(
    page.html,
    '<h2 id="youre-somebody-now"><a href="#youre-somebody-now">You&#39;re somebody now</a></h2>\n<p><a href="/staff">Staff</a>.</p>\n',
  )
  assert.equal(page.html, renderPage(source.replace('10.', '3.')).html)
})

test('missing metadata and duplicate routes fail instead of silently omitting pages', (t) => {
  assert.throws(() => renderPage('## No title'), /require a title/)
  const root = mkdtempSync(path.join(tmpdir(), 'omarchy-duplicates-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(path.join(root, 'example'))
  for (const file of ['example.md', 'example/index.md'])
    writeFileSync(path.join(root, file), '---\ntitle: Example\n---\nBody')
  assert.throws(() => collectContentPages(root), /Duplicate content page/)
})

test('Astro routes cannot bypass the content pipeline with direct Markdown imports', async () => {
  const { globSync, readFileSync } = await import('node:fs')
  const root = new URL('../../', import.meta.url)
  for (const file of globSync('src/pages/**/*.astro', { cwd: root })) {
    const source = readFileSync(new URL(file, root), 'utf8')
    assert.doesNotMatch(
      source,
      /(?:from\s*|import\s*\()\s*['"][^'"]+\.md['"]/,
      file,
    )
  }
})

test('heading anchors use text tokens and cannot contain HTML attribute syntax', () => {
  const prefix = '---\ntitle: Principles\npresentation: principles\n---\n\n'
  const formatted = renderPage(
    prefix + '## 1. <em>Unite</em> the <strong>nerds</strong>.\n',
  )
  assert.match(
    formatted.html,
    /<h2 id="unite-the-nerds"><a href="#unite-the-nerds">/,
  )
  for (const heading of [
    '<scr<script>ipt>alert(1)</script>',
    '<span title="a > b">Hello</span>',
    '&quot; onclick=&quot;alert(1)',
  ]) {
    const page = renderPage(prefix + `## 1. ${heading}.\n`)
    const match = page.html.match(/^<h2 id="([\w-]+)"><a href="#([\w-]+)">/)
    assert.ok(match, page.html)
    assert.equal(match[1], match[2])
  }
})
