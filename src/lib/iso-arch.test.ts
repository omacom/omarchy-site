import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isoArch } from './iso-arch.ts'

const UA = {
  firefoxLinuxArm:
    'Mozilla/5.0 (X11; Linux aarch64; rv:144.0) Gecko/20100101 Firefox/144.0',
  firefoxLinuxX86:
    'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
  chromeLinux:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  chromeOsArm:
    'Mozilla/5.0 (X11; CrOS aarch64 16404.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  chromeMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  safariIpad:
    'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
}
const arm64 = { architecture: 'arm', bitness: '64' }

test('the user agent names an ARM CPU', () => {
  assert.equal(isoArch(UA.firefoxLinuxArm), 'aarch64')
  assert.equal(isoArch(UA.chromeOsArm), 'aarch64')
  assert.equal(isoArch(UA.firefoxLinuxX86), 'x86_64')
})

test('Chromium tells ARM only through its client hints', () => {
  assert.equal(isoArch(UA.chromeLinux), 'x86_64')
  assert.equal(isoArch(UA.chromeLinux, arm64), 'aarch64')
  assert.equal(isoArch(UA.chromeWindows, arm64), 'aarch64')
  assert.equal(
    isoArch(UA.chromeWindows, { architecture: 'x86', bitness: '64' }),
    'x86_64',
  )
  // There is no 32-bit ARM ISO.
  assert.equal(
    isoArch(UA.chromeLinux, { architecture: 'arm', bitness: '32' }),
    'x86_64',
  )
})

test('Macs and phones stay on x86_64 even on ARM', () => {
  assert.equal(isoArch(UA.chromeMac, arm64), 'x86_64')
  assert.equal(isoArch(UA.chromeAndroid, arm64), 'x86_64')
  assert.equal(isoArch(UA.safariIpad), 'x86_64')
})
