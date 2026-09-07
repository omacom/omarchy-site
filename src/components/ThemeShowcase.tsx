import { t } from '@/i18n/site'
import { useEffect, useState } from 'react'
import { SITE_THEMES, THEME_EVENT, chooseTheme, readTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

/** A theme's desktop screenshot, the same one the picker shows. */
const previewSrc = (id: string) => `/assets/images/theme-previews/${id}.webp`

/** The theme the site wears right now, kept current as it changes. Null
 *  until the page is live, since the server cannot know which one the
 *  head script drew. */
function useWornTheme() {
  const [worn, setWorn] = useState<string | null>(null)
  useEffect(() => {
    setWorn(readTheme())
    const onTheme = (event: Event) =>
      setWorn((event as CustomEvent<string>).detail)
    window.addEventListener(THEME_EVENT, onTheme)
    return () => window.removeEventListener(THEME_EVENT, onTheme)
  }, [])
  return worn
}

/** Fade in each screenshot once it loads, keeping the previous one below. */
function Preview({ id, name }: { id: string; name: string }) {
  const [ready, setReady] = useState(false)
  return (
    <img
      src={previewSrc(id)}
      alt={`${name} on the desktop`}
      width={1200}
      height={675}
      decoding="async"
      onLoad={() => setReady(true)}
      ref={(img) => {
        if (img?.complete) setReady(true)
      }}
      className={cn(
        'img-outlined absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none',
        ready ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}

/** The selected desktop above a compact list of theme alternatives. */
export function ThemeShowcase() {
  const worn = useWornTheme()
  const [shown, setShown] = useState<string[]>([])
  useEffect(() => {
    if (!worn) return
    setShown((list) =>
      list.at(-1) === worn ? list : [...list.slice(-1), worn],
    )
  }, [worn])

  return (
    <div className="mt-6 lg:mt-10">
      <figure className="ring-elevation overflow-hidden rounded-xl bg-bg-deep">
        <div className="relative aspect-video bg-bg-deep">
          {shown.map((id) => (
            <Preview
              key={id}
              id={id}
              name={SITE_THEMES.find((theme) => theme.id === id)?.name ?? id}
            />
          ))}
        </div>
      </figure>
      <ul
        className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm leading-relaxed lg:mt-6"
        aria-label={t('Choose a theme')}
      >
        {SITE_THEMES.map((theme, index) => {
          const selected = theme.id === worn
          return (
            <li key={theme.id} className="inline-flex items-baseline gap-2">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => chooseTheme(theme.id)}
                className={cn(
                  'whitespace-nowrap underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
                  selected
                    ? 'text-brand underline'
                    : 'text-text-secondary hover:text-text',
                )}
              >
                {theme.name}
              </button>
              {index < SITE_THEMES.length - 1 && (
                <span aria-hidden="true" className="text-text-muted">
                  /
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
