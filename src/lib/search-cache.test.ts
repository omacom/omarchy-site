import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSearchIndex } from '../astro/content-client.ts'

test('search retries failures and shares a successful fetch across opens and pages', async (t) => {
  const original = globalThis.fetch
  t.after(() => {
    globalThis.fetch = original
  })
  let requests = 0
  globalThis.fetch = async () => {
    requests++
    return requests === 1
      ? new Response('unavailable', { status: 503 })
      : Response.json([
          {
            kind: 'theme',
            slug: 'test',
            title: 'Test',
            meta: 'Theme',
            text: 'Test',
          },
        ])
  }
  await assert.rejects(getSearchIndex(), /unavailable/)
  const first = getSearchIndex()
  assert.equal(first, getSearchIndex())
  const index = await first
  assert.equal(await getSearchIndex(), index)
  assert.equal(requests, 2)
})
