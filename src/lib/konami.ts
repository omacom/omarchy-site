const codes = [
  [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ],
  ['k', 'k', 'j', 'j', 'h', 'l', 'h', 'l', 'b', 'a'],
]

/** Retain the matching suffix, including overlapping starts such as up/up/up. */
export function advanceKonami(buffer: string[], key: string) {
  const keys = [...buffer, key.length === 1 ? key.toLowerCase() : key].slice(
    -10,
  )
  const hit = codes.some((code) =>
    code.every((value, index) => keys[index] === value),
  )
  return { keys: hit ? [] : keys, hit }
}
