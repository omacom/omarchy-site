const initialized = new WeakSet<HTMLDialogElement>()

/** Enhance the photo links while retaining their no-JavaScript fallback. */
export function setupWorkstationLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>(
    '.workstation-lightbox',
  )
  const gallery = document.querySelector('.workstations__images')
  if (!dialog || !gallery || initialized.has(dialog)) return
  initialized.add(dialog)

  const links = Array.from(
    gallery.querySelectorAll<HTMLAnchorElement>('a[href]'),
  ).filter((link) => link.querySelector('img'))
  const photo = dialog.querySelector<HTMLImageElement>(
    '.workstation-lightbox__photo',
  )!
  const position = dialog.querySelector<HTMLElement>('[data-photo-position]')!
  let current = 0
  let opener: HTMLAnchorElement | undefined
  let previousOverflow = ''

  function show(index: number) {
    current = (index + links.length) % links.length
    const link = links[current]
    photo.src = link.href
    photo.alt = link.querySelector('img')?.alt ?? ''
    position.textContent = `${current + 1} / ${links.length}`
  }

  gallery.addEventListener('click', (event) => {
    if (
      !(event instanceof MouseEvent) ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a')
        : null
    const index = link ? links.indexOf(link) : -1
    if (index < 0) return
    event.preventDefault()
    opener = links[index]
    show(index)
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    dialog.showModal()
  })

  dialog
    .querySelector('.workstation-lightbox__close')!
    .addEventListener('click', () => dialog.close())
  dialog
    .querySelector('.workstation-lightbox__previous')!
    .addEventListener('click', () => show(current - 1))
  dialog
    .querySelector('.workstation-lightbox__next')!
    .addEventListener('click', () => show(current + 1))
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      show(current + (event.key === 'ArrowLeft' ? -1 : 1))
    }
  })
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close()
  })
  // Native dialog handles Escape, focus trapping, and inert background content.
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow
    photo.removeAttribute('src')
    opener?.focus({ preventScroll: true })
  })
}
