// Registry PR #10 glyph pool, with a slightly slower reveal cadence.
export const SCRAMBLE_GLYPHS =
  '░▒▓/\\<>+=*#%&@$0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const SCRAMBLE_TICK_MS = 60
export const SCRAMBLE_IN_TICKS = 26

/** Decorate translated plain text, not the source lookup key or authored markup. */
export function announcementMarkup(html: string): string {
  if (html.includes('<')) return html
  return html.replace(
    /\$\d+(?:[.,]\d+)*(?:\s+million\b)?/gu,
    '<strong>$&</strong>',
  )
}

export function scrambleGlyph(
  character: string,
  tick: number,
  settlesAt: number,
  random: () => number = Math.random,
): string {
  if (/\s/u.test(character) || tick >= settlesAt) return character
  return SCRAMBLE_GLYPHS[Math.floor(random() * SCRAMBLE_GLYPHS.length)]
}
