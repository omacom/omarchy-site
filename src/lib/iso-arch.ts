export type IsoArch = 'x86_64' | 'aarch64'

/** What Chromium's User-Agent Client Hints say about the machine, from
 *  navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness']). */
export interface ArchHints {
  architecture?: string
  bitness?: string
}

/**
 * The ISO the visitor's own machine most likely boots, from what the
 * browser says about itself: aarch64 when it runs on 64-bit ARM, x86_64
 * otherwise. Firefox names the CPU in its user agent on Linux; Chromium
 * reports x86_64 there and on Windows whatever the CPU, so only its client
 * hints tell. Macs, iPhones, iPads and Android phones stay on x86_64: an
 * Apple Silicon Mac installs from macOS, not from the ISO, and a phone is
 * not the machine being installed.
 */
export function isoArch(userAgent: string, hints?: ArchHints): IsoArch {
  if (/Mac|iPhone|iPad|Android/.test(userAgent)) return 'x86_64'
  if (/\b(aarch64|arm64)\b/i.test(userAgent)) return 'aarch64'
  if (hints?.architecture === 'arm' && hints.bitness === '64') return 'aarch64'
  return 'x86_64'
}
