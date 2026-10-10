import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  latestMacDownload,
  macDownloadFromRelease,
  MAC_RELEASES,
} from './try-mac.ts'

const download = (tag: string, name: string) =>
  `https://github.com/omacom/try-omarchy/releases/download/${tag}/${name}`
const asset = (tag: string, name: string) => ({
  name,
  browser_download_url: download(tag, name),
})

test('downloads v0.5.0 and future numbered releases without a site rebuild', () => {
  for (const tag_name of ['v0.5.0', 'v0.6.0', 'v1.2.3']) {
    const name = `TryOmarchy-${tag_name}.dmg`
    assert.equal(
      macDownloadFromRelease({ tag_name, assets: [asset(tag_name, name)] }),
      download(tag_name, name),
    )
  }
})

test('prefers the current numbered DMG over legacy and unrelated assets', () => {
  const tag_name = 'v0.5.0'
  const name = `TryOmarchy-${tag_name}.dmg`
  assert.equal(
    macDownloadFromRelease({
      tag_name,
      assets: [
        asset(tag_name, 'TryOmarchy.dmg'),
        asset(tag_name, 'Other.dmg'),
        asset(tag_name, 'TryOmarchy-v0.4.1.dmg'),
        asset(tag_name, name),
      ],
    }),
    download(tag_name, name),
  )
})

test('supports releases using the legacy filename', () => {
  assert.equal(
    macDownloadFromRelease({
      tag_name: 'v0.4.1',
      assets: [asset('v0.4.1', 'TryOmarchy.dmg')],
    }),
    download('v0.4.1', 'TryOmarchy.dmg'),
  )
})

test('opens the latest release page when no matching DMG exists', () => {
  for (const assets of [[], [asset('v0.5.0', 'Other.dmg')]]) {
    assert.equal(
      macDownloadFromRelease({ tag_name: 'v0.5.0', assets }),
      MAC_RELEASES,
    )
  }
})

test('resolves the API download and falls back on lookup failures', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch')
  const signal = new AbortController().signal
  mock.mock.mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          tag_name: 'v0.5.0',
          assets: [asset('v0.5.0', 'TryOmarchy-v0.5.0.dmg')],
        }),
      ),
  )
  assert.equal(
    await latestMacDownload(signal),
    download('v0.5.0', 'TryOmarchy-v0.5.0.dmg'),
  )
  assert.equal(
    mock.mock.calls[0].arguments[0],
    'https://api.github.com/repos/omacom/try-omarchy/releases/latest',
  )
  assert.equal(mock.mock.calls[0].arguments[1]?.signal, signal)

  for (const status of [403, 404, 429, 500]) {
    mock.mock.mockImplementation(async () => new Response(null, { status }))
    assert.equal(await latestMacDownload(), MAC_RELEASES)
  }
  for (const body of ['not json', '{}', '{"assets":null}']) {
    mock.mock.mockImplementation(async () => new Response(body))
    assert.equal(await latestMacDownload(), MAC_RELEASES)
  }
  mock.mock.mockImplementation(async () => {
    throw new TypeError('Network unavailable')
  })
  assert.equal(await latestMacDownload(), MAC_RELEASES)
})

test('falls back when the download lookup is aborted', async (t) => {
  const signal = AbortSignal.abort(
    new DOMException('Timed out', 'TimeoutError'),
  )
  t.mock.method(
    globalThis,
    'fetch',
    async (_url: RequestInfo | URL, options?: RequestInit) => {
      options?.signal?.throwIfAborted()
      throw new Error('Expected an aborted signal')
    },
  )
  assert.equal(await latestMacDownload(signal), MAC_RELEASES)
})
