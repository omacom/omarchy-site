import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { collectContentPages } from './lib/content-pages.mjs'

const root = new URL('../', import.meta.url)
const destination = new URL('src/data/pages.json', root)
const pages = JSON.parse(readFileSync(destination, 'utf8'))
const content = collectContentPages(fileURLToPath(new URL('content/', root)))
for (const slug of Object.keys(content)) {
  if (
    existsSync(new URL(`src/pages/${slug}.astro`, root)) ||
    existsSync(new URL(`src/pages/${slug}/index.astro`, root)) ||
    slug.startsWith('manual/') ||
    slug.startsWith('news/')
  )
    throw new Error(`Content page conflicts with dedicated route: ${slug}`)
  if (pages[slug])
    throw new Error(`Content page conflicts with imported page: ${slug}`)
}
writeFileSync(destination, JSON.stringify({ ...pages, ...content }) + '\n')
