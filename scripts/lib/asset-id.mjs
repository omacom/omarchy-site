/** Identifiers become filenames and redirect directories, never paths. */
export function assetId(value) {
  if (
    typeof value !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/.test(value)
  ) {
    throw new Error('Invalid asset identifier')
  }
  return value
}
