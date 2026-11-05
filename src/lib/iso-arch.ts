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

export type IsoLinks = Array<[string, { url: string }]>

/**
 * The ISOs a build links, in version.json's order. A build can name the
 * host they come from: omarchy.cn's copy of the zh-CN edition serves
 * mainland China, so it links iso.omarchy.cn. The refresh checks only
 * iso.omarchy.org before it lists an architecture, and that mirror is only
 * known to carry the x86_64 ISO, so a build with its own host offers
 * x86_64 alone rather than a download that may not be there.
 */
export function isoLinks(
  isos: Record<string, { url: string }>,
  origin?: string,
): IsoLinks {
  return Object.entries(isos)
    .filter(([arch]) => !origin || arch === 'x86_64')
    .map(([arch, iso]) => [
      arch,
      { url: new URL(new URL(iso.url).pathname, origin || iso.url).href },
    ])
}
