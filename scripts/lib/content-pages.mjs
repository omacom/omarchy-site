import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { marked, Lexer, Parser, TextRenderer } from 'marked'
import { parseFrontmatter } from 'astro/markdown'

const headingText = new TextRenderer()
headingText.html = () => ''

export function renderPage(source) {
  const { frontmatter, content } = parseFrontmatter(source)
  if (typeof frontmatter.title !== 'string' || !frontmatter.title.trim())
    throw new Error('Content pages require a title in their frontmatter')
  const page = { title: frontmatter.title }
  for (const key of ['seoTitle', 'description', 'presentation']) {
    if (frontmatter[key] !== undefined) {
      if (typeof frontmatter[key] !== 'string')
        throw new Error(`Invalid ${key}`)
      page[key] = frontmatter[key]
    }
  }
  if (page.presentation && page.presentation !== 'principles')
    throw new Error(`Unknown presentation: ${page.presentation}`)
  page.html = marked.parse(content, { async: false })
  if (page.presentation === 'principles')
    page.html = page.html.replace(
      /<h2>(\d+\. )?([\s\S]*?)<\/h2>/g,
      (_, _number, heading) => {
        const title = heading.replace(/\.$/, '')
        const slug = new Parser()
          .parseInline(Lexer.lexInline(title), headingText)
          .replace(/&#39;|&quot;/g, '')
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
        return `<h2 id="${slug}"><a href="#${slug}">${title}</a></h2>`
      },
    )
  return page
}

// News has its own dated routes and translation pipeline. Every other Markdown
// file under content becomes a standalone page, including nested directories.
export function collectContentPages(directory) {
  const pages = {}
  function walk(current, prefix = '') {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      if (entry.name.startsWith('.') || (!prefix && entry.name === 'news'))
        continue
      const file = path.join(current, entry.name)
      const relative = prefix + entry.name
      if (entry.isDirectory()) walk(file, relative + '/')
      else if (entry.name.endsWith('.md')) {
        const slug = relative.replace(/\.md$/, '').replace(/\/index$/, '')
        if (pages[slug]) throw new Error(`Duplicate content page: ${slug}`)
        pages[slug] = renderPage(readFileSync(file, 'utf8'))
      }
    }
  }
  walk(directory)
  return pages
}
