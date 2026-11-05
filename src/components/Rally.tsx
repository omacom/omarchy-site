import { useEffect, useState } from 'react'
import { advanceKonami } from '@/lib/konami'

type Game = typeof import('./RallyGame').RallyGame

/** Only the code listener ships initially; the game loads after the secret. */
export function Rally() {
  const [Game, setGame] = useState<Game | null>(null)
  useEffect(() => {
    let keys: string[] = [],
      loading = false,
      alive = true
    let lastKey = 0
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (Game || loading || event.repeat || event.isComposing) return
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target?.closest(
          'input, textarea, select, [contenteditable], [role="dialog"]',
        ) ||
        document.querySelector('dialog[open]')
      ) {
        keys = []
        return
      }
      if (performance.now() - lastKey > 3000) keys = []
      lastKey = performance.now()
      const result = advanceKonami(keys, event.key)
      keys = result.keys
      if (!result.hit) return
      event.preventDefault()
      loading = true
      void import('./RallyGame')
        .then((module) => {
          if (alive) setGame(() => module.RallyGame)
        })
        .catch(() => {
          loading = false
        })
    }
    window.addEventListener('keydown', listener)
    return () => {
      alive = false
      window.removeEventListener('keydown', listener)
    }
  }, [Game])
  return Game ? <Game onClose={() => setGame(null)} /> : null
}
