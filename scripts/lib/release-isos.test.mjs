import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isoUrl, releaseIsos } from './release-isos.mjs'

const x86 = { url: 'https://iso.omarchy.org/omarchy-4.5.0.iso' }
const arm = { url: 'https://iso.omarchy.org/omarchy-4.5.0-aarch64.iso' }

test('ISO names follow omarchy-iso-release', () => {
  assert.equal(isoUrl('4.5.0', 'x86_64'), x86.url)
  assert.equal(isoUrl('4.5.0', 'aarch64'), arm.url)
})

test('x86_64 is listed without asking, ARM only once it is served', async () => {
  const asked = []
  const isos = await releaseIsos('4.5.0', null, async (url) => {
    asked.push(url)
    return false
  })
  assert.deepEqual(isos, { x86_64: x86 })
  assert.deepEqual(asked, [arm.url])

  assert.deepEqual(await releaseIsos('4.5.0', null, async () => true), {
    x86_64: x86,
    aarch64: arm,
  })
})

test('a check without an answer keeps the last answer for that version', async () => {
  const listed = { version: '4.5.0', isos: { x86_64: x86, aarch64: arm } }
  const unknown = async () => null
  assert.deepEqual(await releaseIsos('4.5.0', listed, unknown), {
    x86_64: x86,
    aarch64: arm,
  })
  // A new release starts again: last release's ARM ISO says nothing about
  // this one's.
  assert.deepEqual(await releaseIsos('4.5.1', listed, unknown), {
    x86_64: { url: 'https://iso.omarchy.org/omarchy-4.5.1.iso' },
  })
  // A definite no takes the button away, as when an ISO is withdrawn.
  assert.deepEqual(await releaseIsos('4.5.0', listed, async () => false), {
    x86_64: x86,
  })
})

test('the version.json from before isos existed reads as no ARM ISO', async () => {
  const before = {
    version: '4.0.6',
    isoUrl: 'https://iso.omarchy.org/omarchy-4.0.6.iso',
  }
  assert.deepEqual(await releaseIsos('4.0.6', before, async () => null), {
    x86_64: { url: before.isoUrl },
  })
})
