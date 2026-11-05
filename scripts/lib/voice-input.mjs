/** Network-provided handles are used as filenames: reject, never strip, separators. */
export function voiceHandle(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_]{1,15}$/.test(value)) {
    throw new Error('Invalid X handle')
  }
  return value
}

export function tweetId(value) {
  const url = new URL(value)
  if (
    url.protocol !== 'https:' ||
    !['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(
      url.hostname,
    ) ||
    url.username ||
    url.password
  ) {
    throw new Error('Expected an HTTPS X or Twitter post URL')
  }
  const match = /^\/[a-zA-Z0-9_]{1,15}\/status\/(\d{1,25})\/?$/.exec(
    url.pathname,
  )
  if (!match) throw new Error('Invalid X post URL')
  return match[1]
}
