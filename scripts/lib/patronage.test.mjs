import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchPatronage } from './patronage.mjs'

const response = (data) => Response.json({ result: { data } })

test('follows numeric cursors to the omitted final cursor and deduplicates overlapping pages', async () => {
  const cursors = []
  const result = await fetchPatronage(async (url) => {
    const input = JSON.parse(url.searchParams.get('input'))
    assert.equal(input.limit, 100)
    assert.equal(input.direction, 'forward')
    cursors.push(input.cursor)
    return input.cursor === undefined
      ? response({ items: [{ id: 'a' }, { id: 'b' }], nextCursor: 100 })
      : response({ items: [{ id: 'b' }, { id: 'c' }] })
  })
  assert.deepEqual(cursors, [undefined, 100])
  assert.deepEqual(
    result.map((row) => row.id),
    ['a', 'b', 'c'],
  )
})

test('accepts an explicit null final cursor, including an empty feed', async () => {
  assert.deepEqual(
    await fetchPatronage(async () => response({ items: [], nextCursor: null })),
    [],
  )
})

test('a failed later page rejects the whole refresh instead of returning partial totals', async () => {
  let calls = 0
  await assert.rejects(
    fetchPatronage(async () =>
      ++calls === 1
        ? response({ items: [{ id: 'a' }], nextCursor: 100 })
        : new Response('', { status: 503 }),
    ),
    /503/,
  )
})

test('malformed pages and non-progressing pagination fail instead of replacing the snapshot', async () => {
  for (const data of [
    {},
    { items: [], nextCursor: '100' },
    { items: [{}] },
    { items: [], nextCursor: 100 },
  ])
    await assert.rejects(fetchPatronage(async () => response(data)))
  await assert.rejects(
    fetchPatronage(async () =>
      response({
        items: [{ id: 'a' }],
        nextCursor: 100,
      }),
    ),
    /progress/,
  )
})
