import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isoUrls, releaseIsos } from './release-isos.mjs'

const x86 = { url: 'https://iso.omarchy.org/omarchy-4.5.0-x86.iso' }
const arm = { url: 'https://iso.omarchy.org/omarchy-4.5.0-aarch64.iso' }
const plain = (version) => ({
  url: `https://iso.omarchy.org/omarchy-${version}.iso`,
})

/** A server that has exactly these URLs, and answers for every other one. */
const serving =
  (...urls) =>
  async (url) =>
    urls.includes(url)

test('ISO names carry the architecture, and x86_64 also the plain name', () => {
  assert.deepEqual(isoUrls('4.5.0', 'x86_64'), [x86.url, plain('4.5.0').url])
  assert.deepEqual(isoUrls('4.5.0', 'aarch64'), [arm.url])
})

test('4.5.0 on lists each ISO under the name that carries its architecture', async () => {
  assert.deepEqual(
    await releaseIsos('4.5.0', null, serving(x86.url, arm.url)),
    {
      x86_64: x86,
      aarch64: arm,
    },
  )
})

test('a release before 4.5.0 lists its x86_64 ISO under the plain name', async () => {
  assert.deepEqual(
    await releaseIsos('4.0.6', null, serving(plain('4.0.6').url)),
    { x86_64: plain('4.0.6') },
  )
})

test('an ISO that is not served is not listed, x86_64 included', async () => {
  assert.deepEqual(await releaseIsos('4.5.0', null, serving(x86.url)), {
    x86_64: x86,
  })
  assert.deepEqual(await releaseIsos('4.5.0', null, serving()), {})
})

test('a check without an answer keeps the last answer for that version', async () => {
  const listed = { version: '4.5.0', isos: { x86_64: x86, aarch64: arm } }
  const unknown = async () => null
  assert.deepEqual(await releaseIsos('4.5.0', listed, unknown), {
    x86_64: x86,
    aarch64: arm,
  })
  // A new release starts again: last release's ISOs say nothing about
  // this one's.
  assert.deepEqual(await releaseIsos('4.5.1', listed, unknown), {})
  // A definite no takes the button away, as when an ISO is withdrawn.
  assert.deepEqual(await releaseIsos('4.5.0', listed, serving(x86.url)), {
    x86_64: x86,
  })
})

test('a listed link stays only while its own check goes unanswered', async () => {
  const before = { version: '4.0.6', isos: { x86_64: plain('4.0.6') } }
  const answers = (byUrl) => async (url) => (url in byUrl ? byUrl[url] : false)
  const x86Name = 'https://iso.omarchy.org/omarchy-4.0.6-x86.iso'
  // No answer for the new name, a definite 404 for the listed one.
  assert.deepEqual(
    await releaseIsos(
      '4.0.6',
      before,
      answers({ [x86Name]: null, [plain('4.0.6').url]: false }),
    ),
    {},
  )
  // A 404 for the new name, no answer for the listed one.
  assert.deepEqual(
    await releaseIsos(
      '4.0.6',
      before,
      answers({ [x86Name]: false, [plain('4.0.6').url]: null }),
    ),
    { x86_64: plain('4.0.6') },
  )
})

test('the version.json from before isos existed keeps its x86_64 ISO', async () => {
  const before = { version: '4.0.6', isoUrl: plain('4.0.6').url }
  assert.deepEqual(await releaseIsos('4.0.6', before, async () => null), {
    x86_64: plain('4.0.6'),
  })
})
