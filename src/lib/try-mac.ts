/** Mac releases name the DMG after their tag (TryOmarchy-v0.5.0.dmg), so
 *  there is no stable releases/latest/download URL. The download button looks
 *  up the latest release on click and falls back to its release page. */
export const MAC_RELEASES =
  'https://github.com/omacom/try-omarchy/releases/latest'
const API = 'https://api.github.com/repos/omacom/try-omarchy/releases/latest'

interface Release {
  tag_name: string
  assets: { name: string; browser_download_url: string }[]
}

export function macDownloadFromRelease(release: Release): string {
  const versionedName = `TryOmarchy-${release.tag_name}.dmg`
  const asset =
    release.assets.find(({ name }) => name === versionedName) ??
    release.assets.find(({ name }) => name === 'TryOmarchy.dmg')
  return asset?.browser_download_url || MAC_RELEASES
}

export async function latestMacDownload(signal?: AbortSignal): Promise<string> {
  try {
    const response = await fetch(API, { signal })
    if (!response.ok) return MAC_RELEASES
    return macDownloadFromRelease(await response.json())
  } catch {
    // Rate limits, offline clients, and unexpected API payloads still leave
    // a working link to GitHub's latest release page.
    return MAC_RELEASES
  }
}
