/**
 * The release ISOs the homepage offers, one per architecture, in the order
 * of its buttons. The names are the ones omarchy-iso's
 * bin/omarchy-iso-release uploads: x86_64 keeps the plain name every older
 * link already uses, and any other architecture carries its own suffix.
 */
export const ISO_ARCHES = ['x86_64', 'aarch64']

export const isoUrl = (version, arch) =>
  `https://iso.omarchy.org/omarchy-${version}${arch === 'x86_64' ? '' : `-${arch}`}.iso`

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
 * architecture's download URL. x86_64 is listed as it always was. Any
 * other architecture is listed only while its ISO, checksum and signature
 * are all served, so its button appears with the first refresh after the
 * ISO is published, and never points at a file that is not there. When
 * the check gets no answer, the previous answer for the same version
 * stands, so a network failure does not take a button away.
 */
export async function releaseIsos(version, previous, isServed = served) {
  const isos = {}
  for (const arch of ISO_ARCHES) {
    const url = isoUrl(version, arch)
    const listed =
      arch === 'x86_64' ||
      ((await isServed(url)) ??
        (previous?.version === version && previous.isos?.[arch]?.url === url))
    if (listed) isos[arch] = { url }
  }
  return isos
}
