/** Decode iCalendar TEXT escapes in one pass, preserving literal backslashes. */
export function decodeCalendarText(value) {
  return value.replace(/\\([nN,;\\])/g, (_, char) =>
    char === 'n' || char === 'N' ? '\n' : char,
  )
}
