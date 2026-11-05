import { test } from 'node:test'
import assert from 'node:assert/strict'
import { setupWorkstationLightbox } from '../astro/workstation-lightbox.ts'

// Test the controller's event handling; modal focus trapping and Escape are
// provided by the browser's native <dialog> implementation.
test('photo viewer navigates, wraps, closes, and restores the triggering link', (context) => {
  class ElementStub extends EventTarget {
    src = ''
    alt = ''
    href = ''
    textContent = ''
    focused = false
    open = false
    image: ElementStub | null = null
    children = new Map<string, ElementStub>()
    querySelector(selector: string) {
      return selector === 'img' ? this.image : this.children.get(selector)
    }
    closest() {
      return this
    }
    focus() {
      this.focused = true
    }
    removeAttribute(name: string) {
      if (name === 'src') this.src = ''
    }
    showModal() {
      this.open = true
    }
    close() {
      this.open = false
      this.dispatchEvent(new Event('close'))
    }
  }
  class Click extends Event {
    button = 0
    metaKey = false
    ctrlKey = false
    shiftKey = false
    altKey = false
    constructor() {
      super('click', { cancelable: true })
    }
  }
  const links = [0, 1, 2].map((number) => {
    const link = new ElementStub()
    link.href = `/photo-${number}.webp`
    link.image = new ElementStub()
    link.image.alt = `Photo ${number}`
    return link
  })
  const dialog = new ElementStub()
  const photo = new ElementStub()
  for (const name of ['close', 'previous', 'next'])
    dialog.children.set(`.workstation-lightbox__${name}`, new ElementStub())
  dialog.children.set('.workstation-lightbox__photo', photo)
  dialog.children.set('[data-photo-position]', new ElementStub())
  const gallery = Object.assign(new ElementStub(), {
    querySelectorAll: () => links,
  })
  const style = { overflow: 'auto' }
  const documentStub = {
    documentElement: { style },
    querySelector: (selector: string) =>
      selector === '.workstation-lightbox' ? dialog : gallery,
  }
  for (const [name, value] of Object.entries({
    document: documentStub,
    Element: ElementStub,
    MouseEvent: Click,
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { configurable: true, value })
    context.after(() => {
      if (original) Object.defineProperty(globalThis, name, original)
      else Reflect.deleteProperty(globalThis, name)
    })
  }
  setupWorkstationLightbox()
  setupWorkstationLightbox() // Repeated Astro page-load initialization is harmless.
  function clickPhoto(modified = false) {
    const event = new Click()
    event.ctrlKey = modified
    Object.defineProperty(event, 'target', { value: links[1] })
    gallery.dispatchEvent(event)
    return event
  }
  assert.equal(clickPhoto(true).defaultPrevented, false)
  assert.equal(dialog.open, false)
  assert.equal(clickPhoto().defaultPrevented, true)
  assert.equal(dialog.open, true)
  assert.equal(style.overflow, 'hidden')
  assert.equal(photo.src, '/photo-1.webp')
  const arrow = (key: string) => {
    const event = new Event('keydown', { cancelable: true })
    Object.defineProperty(event, 'key', { value: key })
    dialog.dispatchEvent(event)
    assert.equal(event.defaultPrevented, true)
  }
  arrow('ArrowRight')
  assert.equal(photo.src, '/photo-2.webp')
  arrow('ArrowRight')
  assert.equal(photo.src, '/photo-0.webp')
  arrow('ArrowLeft')
  assert.equal(photo.src, '/photo-2.webp')
  dialog.children
    .get('.workstation-lightbox__previous')!
    .dispatchEvent(new Click())
  assert.equal(photo.src, '/photo-1.webp')
  dialog.children.get('.workstation-lightbox__next')!.dispatchEvent(new Click())
  assert.equal(photo.src, '/photo-2.webp')
  dialog.children
    .get('.workstation-lightbox__close')!
    .dispatchEvent(new Click())
  assert.equal(dialog.open, false)
  assert.equal(photo.src, '')
  assert.equal(style.overflow, 'auto')
  assert.equal(links[1].focused, true)
})
