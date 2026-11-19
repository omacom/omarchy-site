/**
 * The release ISOs the homepage offers, one per architecture, in the order
 * of its buttons.
 */
export const ISO_ARCHES = ['x86_64', 'aarch64']

/** The short architecture name an ISO's file name carries. */
const ISO_ARCH_NAMES = { x86_64: 'x86', aarch64: 'aarch64' }

/**
 * The names an architecture's ISO may have on iso.omarchy.org, newest
 * first. From 4.5.0 every ISO names its architecture,
 * omarchy-4.5.0-x86.iso and omarchy-4.5.0-aarch64.iso. The x86_64 ISOs
 * before it have the plain name, omarchy-4.0.6.iso.
 */
export const isoUrls = (version, arch) => [
  `https://iso.omarchy.org/omarchy-${version}-${ISO_ARCH_NAMES[arch]}.iso`,
  ...(arch === 'x86_64'
    ? [`https://iso.omarchy.org/omarchy-${version}.iso`]
    : []),
]

/** Whether iso.omarchy.org serves the ISO and both files that verify it:
 *  true, false when any of them is missing, or null when it never said. */
export async function served(url) {
  const statuses = await Promise.all(
    [url, `${url}.sha256`, `${url}.sig`].map((file) =>
      fetch(file, { method: 'HEAD' }).then(
        (res) => res.status,
        () => 0,
      ),
    ),
  )
  if (statuses.every((status) => status >= 200 && status < 300)) return true
  if (statuses.includes(404)) return false
  return null
}

/**
 * The ISOs to list for a version, as version.json's `isos`: each
 * architecture's download URL, under the first of its names that is
 * served with its checksum and signature. An architecture is listed only
 * while that holds, so its button appears with the first refresh after the
 * ISO is published, and never points at a file that is not there. When a
 * check gets no answer, the previous answer for the same version stands,
 * so a network failure does not take a button away.
 */
export async function releaseIsos(version, previous, isServed = served) {
  const isos = {}
  for (const arch of ISO_ARCHES) {
    const answers = new Map()
    let url
    for (const candidate of isoUrls(version, arch)) {
      const answer = await isServed(candidate)
      answers.set(candidate, answer)
      if (answer) {
        url = candidate
        break
      }
    }
    if (!url && previous?.version === version) {
      // version.json from before `isos` named only the x86_64 ISO, as isoUrl.
      const last =
        previous.isos?.[arch]?.url ??
        (arch === 'x86_64' ? previous.isoUrl : undefined)
      // Only its own check going unanswered keeps the last link: a 404 for it
      // means it is gone, whatever another name's check said.
      if (answers.get(last) === null) url = last
    }
    if (url) isos[arch] = { url }
  }
  return isos
}
