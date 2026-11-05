import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createServer } from 'node:http'
import { devPassthrough } from '../dev-passthrough.mjs'

test('development serves published files and redirects without exposing source paths', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'omarchy-passthrough-'))
  const outside = await mkdtemp(path.join(tmpdir(), 'omarchy-outside-'))
  t.after(async () => {
    await rm(root, { recursive: true, force: true })
    await rm(outside, { recursive: true, force: true })
  })
  await mkdir(path.join(root, 'assets'))
  await mkdir(path.join(root, 'manual'))
  await mkdir(path.join(root, 'screensaver'))
  await writeFile(path.join(root, 'install'), '#!/bin/bash\necho installer\n')
  await writeFile(path.join(root, 'manual', 'chapter.webp'), 'picture')
  await writeFile(path.join(root, 'manual', 'index.html'), 'old manual design')
  await writeFile(
    path.join(root, 'screensaver', 'index.html'),
    '<html>screensaver</html>',
  )
  await writeFile(path.join(root, 'package.json'), 'not a public file')
  await writeFile(path.join(outside, 'secret'), 'outside the checkout')
  await symlink(
    path.join(outside, 'secret'),
    path.join(root, 'assets', 'escape'),
  )
  const middlewares = { stack: [] }
  const setup = await devPassthrough().configureServer({
    config: { root },
    middlewares,
  })
  setup()
  const middleware = middlewares.stack[0].handle
  const server = createServer((req, res) =>
    middleware(req, res, () => {
      res.writeHead(404)
      res.end()
    }),
  )
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  const get = (url, init) =>
    fetch(`http://127.0.0.1:${server.address().port}${url}`, init)
  const installer = await get('/install')
  assert.equal(installer.status, 200)
  assert.equal(await installer.text(), '#!/bin/bash\necho installer\n')
  assert.equal(
    (await get('/install', { method: 'HEAD' })).headers.get('content-length'),
    '27',
  )
  assert.equal(
    (await get('/manual/chapter.webp')).headers.get('content-type'),
    'image/webp',
  )
  assert.equal(
    await (await get('/screensaver/')).text(),
    '<html>screensaver</html>',
  )
  for (const url of [
    '/manual/index.html',
    '/package.json',
    '/assets/..%2fpackage.json',
    '/assets/escape',
  ]) {
    assert.equal((await get(url)).status, 404, url)
  }
  const redirect = await get('/plugins/', { redirect: 'manual' })
  assert.equal(redirect.status, 302)
  assert.equal(redirect.headers.get('location'), 'https://plugins.omarchy.org/')
  const toc = await get('/manual/toc/', { redirect: 'manual' })
  assert.equal(toc.headers.get('location'), '/manual/')
})
