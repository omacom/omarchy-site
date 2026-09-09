import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

// Runtime translateHtml uses these exact innerHTML keys, including whitespace.
const PROSE = /<(p|h2|h3|figcaption|li)\b([^>]*)>([\s\S]*?)<\/\1>/g
const literal = (node) =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
const unwrap = (node) => {
  while (
    node &&
    (ts.isAsExpression(node) ||
      ts.isParenthesizedExpression(node) ||
      ts.isSatisfiesExpression(node))
  )
    node = node.expression
  return node
}

/** Current English copy only. Dynamic sources are explicitly enumerated here;
 * never traverse arbitrary JSON strings (people, events and products are data).
 * Run npm run port first to refresh the authored page/banner/team source data.
 */
export function collectSources(root = process.cwd()) {
  const messages = new Set()
  const blocks = new Set()
  const add = (value) => {
    if (
      typeof value === 'string' &&
      value.trim() &&
      !/^(?:#[\w-]+|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(value)
    )
      messages.add(value)
  }
  const readJson = (name, fallback) => {
    const file = path.join(root, name)
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback
  }
  const featured = new Set()
  function walk(directory) {
    if (!existsSync(directory)) return
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (['parked', 'i18n', 'node_modules'].includes(entry.name)) continue
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        walk(file)
        continue
      }
      if (!/\.(tsx?|astro)$/.test(file) || /\.test\.[^.]+$/.test(file)) continue
      const relative = path.relative(root, file).split(path.sep).join('/')
      const source = readFileSync(file, 'utf8')
      // Parse Astro frontmatter separately: the --- delimiters otherwise cause
      // TypeScript to swallow some leading expressions during error recovery.
      const parts =
        relative.endsWith('.astro') && source.startsWith('---')
          ? [
              source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '',
              source.replace(/^---\r?\n[\s\S]*?\r?\n---/, ''),
            ]
          : [source]
      for (const part of parts) {
        const tree = ts.createSourceFile(
          file,
          part,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        )
        function withinManual(node) {
          for (let parent = node.parent; parent; parent = parent.parent) {
            if (
              ts.isFunctionDeclaration(parent) &&
              ['manualIndexSeo', 'chapterSeo'].includes(parent.name?.text)
            )
              return true
          }
          return false
        }
        function visit(node) {
          if (
            ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === 't' &&
            literal(node.arguments[0])
          )
            add(node.arguments[0].text)
          if (
            relative === 'src/astro/page-seo.ts' &&
            !withinManual(node) &&
            ts.isPropertyAssignment(node) &&
            ['title', 'description'].includes(node.name.getText(tree)) &&
            literal(node.initializer)
          )
            add(node.initializer.text)
          if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
            const value = unwrap(node.initializer)
            if (
              relative === 'src/lib/seo.ts' &&
              node.name.text === 'SITE_DESCRIPTION' &&
              literal(value)
            )
              add(value.text)
            if (
              relative === 'src/lib/regions.ts' &&
              node.name.text === 'REGIONS' &&
              value &&
              ts.isArrayLiteralExpression(value)
            )
              for (const item of value.elements)
                if (literal(item)) add(item.text)
            if (
              relative === 'src/lib/search.ts' &&
              node.name.text === 'KIND_LABEL' &&
              value &&
              ts.isObjectLiteralExpression(value)
            )
              for (const item of value.properties)
                if (ts.isPropertyAssignment(item) && literal(item.initializer))
                  add(item.initializer.text)
            if (
              relative === 'src/astro/data.ts' &&
              node.name.text === 'FEATURED_PLUGIN_IDS' &&
              value &&
              ts.isArrayLiteralExpression(value)
            )
              for (const item of value.elements)
                if (literal(item)) featured.add(item.text)
          }
          ts.forEachChild(node, visit)
        }
        visit(tree)
      }
    }
  }
  walk(path.join(root, 'src'))
  add(readJson('src/data/banner.json', null)?.html)
  for (const team of readJson('src/data/teams.json', [])) {
    add(team.name?.replace(/^Omarchy /, ''))
    add(team.description)
    add(team.note?.text)
    add(team.note?.linkText)
    // A member's countries are copy; their name is not. "USA/Denmark"
    // is two of them, translated one at a time.
    for (const member of team.members ?? [])
      for (const country of member.meta?.split('/') ?? []) add(country)
  }
  for (const plugin of readJson('src/data/plugins.json', {}).plugins ?? [])
    if (featured.has(plugin.id)) {
      add(plugin.description)
      add(plugin.category)
    }
  for (const period of readJson('src/data/momentum.json', {}).downloads
    ?.periods ?? [])
    add(period.label)
  for (const [slug, page] of Object.entries(
    readJson('src/data/pages.json', {}),
  )) {
    // These routes render dedicated React pages, not the imported page HTML.
    if (['teams', 'meetups'].includes(slug)) continue
    add(page.title)
    const html = (page.html ?? '').replace(
      /<ul\b[^>]*class="[^"]*\bpatrons__supporters\b[^"]*"[^>]*>[\s\S]*?<\/ul>/g,
      '',
    )
    for (const [, , attrs, inner] of html.matchAll(PROSE)) {
      if (
        /\b(?:member__(?:name|meta)|resident__name|sponsorship__name|badge__name)\b/.test(
          attrs,
        )
      )
        continue
      if (/\bdownload(?:\s|>|=)/.test(inner)) continue
      if (!inner.replace(/<[^>]*>/g, ' ').trim()) continue
      blocks.add(inner)
    }
  }
  return { messages: [...messages].sort(), blocks: [...blocks].sort() }
}
