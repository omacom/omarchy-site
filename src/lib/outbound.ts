/**
 * Keep ordinary link clicks in the current tab, including links in ported
 * HTML that explicitly request another window. Modifier and middle clicks
 * remain under the browser's control.
 */
export function watchOutbound() {
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) return
    const el = event.target instanceof Element ? event.target : null
    const a = el?.closest<HTMLAnchorElement>('a[href]')
    if (a?.target && a.target !== '_self') a.target = '_self'
  }
  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
