import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const MESSAGES = path.join(ROOT, 'src/i18n/messages/pl.json')
const BLOCKS = path.join(ROOT, 'src/i18n/pl/blocks.json')
const NEWS_JSON = path.join(ROOT, 'src/i18n/pl/news.json')
const NEWS_DIR = path.join(ROOT, 'src/i18n/pl/news')

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

async function writeJson(file, data) {
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type })
  res.end(type === 'application/json' ? JSON.stringify(body) : body)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

const PAGE = `<!doctype html>
<meta charset="utf-8">
<title>Edytor pl</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 1.5rem; background: #111; color: #eee; }
  h1 { font-size: 1.2rem; }
  nav { display: flex; gap: .5rem; margin-bottom: 1rem; }
  nav button { padding: .4rem .8rem; cursor: pointer; }
  nav button.active { background: #4a7; color: #000; }
  input[type=search] { width: 100%; padding: .5rem; margin-bottom: 1rem; box-sizing: border-box; }
  .row { border: 1px solid #333; border-radius: 6px; padding: .6rem; margin-bottom: .6rem; }
  .en { font-size: .8rem; opacity: .6; margin-bottom: .3rem; }
  .slug { font-size: .75rem; opacity: .5; }
  textarea, input[type=text] { width: 100%; box-sizing: border-box; background: #1a1a1a; color: #eee; border: 1px solid #333; border-radius: 4px; padding: .4rem; font: inherit; }
  textarea { min-height: 2.4em; resize: vertical; }
  textarea.big { min-height: 10em; }
  .row.saved { border-color: #4a7; }
  .row.dirty { border-color: #c93; }
  .status { font-size: .7rem; opacity: .6; margin-top: .2rem; }
  section[hidden] { display: none; }
</style>
<h1>Edytor tłumaczeń PL</h1>
<nav>
  <button data-tab="messages" class="active">Messages</button>
  <button data-tab="blocks">Blocks</button>
  <button data-tab="news">News</button>
</nav>
<input type="search" id="filter" placeholder="Szukaj...">
<section id="tab-messages"></section>
<section id="tab-blocks" hidden></section>
<section id="tab-news" hidden></section>
<script>
let data = null
let active = 'messages'

function debounce(fn, ms) {
  let t
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

async function load() {
  data = await fetch('/__pl-editor/data').then(r => r.json())
  render()
}

async function save(file, key, value) {
  const res = await fetch('/__pl-editor/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, key, value }),
  })
  return res.ok
}

const saveDebounced = debounce(async (row, file, key, value) => {
  row.classList.remove('dirty')
  const ok = await save(file, key, value)
  row.classList.toggle('saved', ok)
  row.querySelector('.status').textContent = ok ? 'Zapisano' : 'Błąd zapisu'
}, 500)

function messageRow(en, pl) {
  const row = document.createElement('div')
  row.className = 'row'
  row.innerHTML = \`<div class="en"></div><textarea></textarea><div class="status"></div>\`
  row.querySelector('.en').textContent = en
  const ta = row.querySelector('textarea')
  ta.value = pl
  ta.addEventListener('input', () => {
    row.classList.add('dirty')
    row.classList.remove('saved')
    saveDebounced(row, active, en, ta.value)
  })
  return row
}

function newsRow(slug, entry) {
  const row = document.createElement('div')
  row.className = 'row'
  row.innerHTML = \`<div class="slug"></div><input type="text"><textarea class="big"></textarea><div class="status"></div>\`
  row.querySelector('.slug').textContent = slug
  const titleInput = row.querySelector('input')
  const htmlArea = row.querySelector('textarea')
  titleInput.value = entry.title
  htmlArea.value = entry.html
  const mark = () => { row.classList.add('dirty'); row.classList.remove('saved') }
  const doSave = debounce(async () => {
    row.classList.remove('dirty')
    const res = await fetch('/__pl-editor/save-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title: titleInput.value, html: htmlArea.value }),
    })
    row.classList.toggle('saved', res.ok)
    row.querySelector('.status').textContent = res.ok ? 'Zapisano' : 'Błąd zapisu'
  }, 500)
  titleInput.addEventListener('input', () => { mark(); doSave() })
  htmlArea.addEventListener('input', () => { mark(); doSave() })
  return row
}

function render() {
  const filter = document.getElementById('filter').value.toLowerCase()
  for (const tab of ['messages', 'blocks']) {
    const el = document.getElementById('tab-' + tab)
    el.innerHTML = ''
    for (const [en, pl] of Object.entries(data[tab])) {
      if (filter && !en.toLowerCase().includes(filter) && !pl.toLowerCase().includes(filter)) continue
      el.appendChild(messageRow(en, pl))
    }
  }
  const newsEl = document.getElementById('tab-news')
  newsEl.innerHTML = ''
  for (const [slug, entry] of Object.entries(data.news)) {
    if (filter && !slug.includes(filter) && !entry.title.toLowerCase().includes(filter) && !entry.html.toLowerCase().includes(filter)) continue
    newsEl.appendChild(newsRow(slug, entry))
  }
}

document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    active = btn.dataset.tab
    document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b === btn))
    document.querySelectorAll('section').forEach(s => s.hidden = s.id !== 'tab-' + active)
  })
})
document.getElementById('filter').addEventListener('input', render)

load()
</script>
`

export function devPlEditor() {
  return {
    name: 'omarchy-pl-editor',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, 'http://localhost')
          if (url.pathname === '/__pl-editor' && req.method === 'GET')
            return send(res, 200, PAGE, 'text/html; charset=utf-8')

          if (url.pathname === '/__pl-editor/data' && req.method === 'GET') {
            const [messages, blocks, newsMeta] = await Promise.all([
              readJson(MESSAGES),
              readJson(BLOCKS),
              readJson(NEWS_JSON),
            ])
            const news = {}
            for (const [slug, meta] of Object.entries(newsMeta)) {
              const html = await readFile(
                path.join(NEWS_DIR, `${slug}.html`),
                'utf8',
              ).catch(() => '')
              news[slug] = { title: meta.title, html }
            }
            return send(res, 200, { messages, blocks, news })
          }

          if (url.pathname === '/__pl-editor/save' && req.method === 'POST') {
            const { file, key, value } = await readBody(req)
            if (file !== 'messages' && file !== 'blocks')
              return send(res, 400, { error: 'bad file' })
            const target = file === 'messages' ? MESSAGES : BLOCKS
            const data = await readJson(target)
            if (!Object.hasOwn(data, key))
              return send(res, 404, { error: 'unknown key' })
            data[key] = value
            await writeJson(target, data)
            return send(res, 200, { ok: true })
          }

          if (
            url.pathname === '/__pl-editor/save-news' &&
            req.method === 'POST'
          ) {
            const { slug, title, html } = await readBody(req)
            const news = await readJson(NEWS_JSON)
            if (!Object.hasOwn(news, slug))
              return send(res, 404, { error: 'unknown slug' })
            news[slug].title = title
            await writeJson(NEWS_JSON, news)
            await writeFile(path.join(NEWS_DIR, `${slug}.html`), html, 'utf8')
            return send(res, 200, { ok: true })
          }

          next()
        } catch (error) {
          send(res, 500, { error: String(error) })
        }
      })
    },
  }
}
