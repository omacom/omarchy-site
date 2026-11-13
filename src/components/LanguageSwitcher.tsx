import { Popover } from '@base-ui/react/popover'
import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
import { SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { flag, language, locale, t } from '@/i18n/site'
import { languageMenuCopy, localeHref } from '@/lib/menu'
import {
  flattenSections,
  moveActive,
  scriptName,
  switcherSections,
} from '@/lib/language-switcher'

/**
 * The globe in the header: a popup that lists every edition by its own name,
 * with a field on top that finds one among a hundred by that name, its
 * English name or its code. The field is a combobox over the list, so the
 * arrows move a cursor down the rows while typing continues, and Enter goes
 * where the cursor is; the rows are still real links for Tab and the pointer.
 */
export function LanguageSwitcher({ path }: { path: string }) {
  const [open, setOpen] = useState(false)
  const [suffix, setSuffix] = useState('')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const listId = `${id}-list`
  const optionId = (code: string) => `${id}-${code}`

  const sections = useMemo(() => switcherSections(query), [query])
  const rows = useMemo(() => flattenSections(sections), [sections])
  const indexOf = useMemo(
    () => new Map(rows.map(([code], at) => [code, at])),
    [rows],
  )
  const activeCode = rows[active]?.[0]

  useEffect(() => setActive(0), [query])

  // Keep the cursor's row in view as the arrows move it past the edge.
  useEffect(() => {
    if (!open || !activeCode) return
    document
      .getElementById(`${id}-${activeCode}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeCode, id])

  const hrefFor = (code: string) => localeHref(code, path, suffix)

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Home and End belong to the caret once there is text to move it through.
    if ((event.key === 'Home' || event.key === 'End') && query) return
    const moved = moveActive(active, rows.length, event.key)
    if (moved !== null) {
      event.preventDefault()
      setActive(moved)
      return
    }
    if (event.key === 'Enter') {
      if (!activeCode) return
      event.preventDefault()
      window.location.assign(hrefFor(activeCode))
      return
    }
    // Esc drops the query first and the popup second, so a mistyped filter
    // costs one key rather than reopening the switcher.
    if (event.key === 'Escape' && query) {
      event.preventDefault()
      event.stopPropagation()
      setQuery('')
    }
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setSuffix(window.location.search + window.location.hash)
          setQuery('')
          setActive(0)
        }
        setOpen(next)
      }}
    >
      <Popover.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t('Language')}: ${locale.name}`}
            data-nav-glyph
            className="relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]"
          />
        }
      >
        <GlobeIcon className="size-5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={10}
          className="z-[100]"
        >
          {/* The list scrolls inside the same ScrollArea the manual's chapter
              list uses, so the bar is the site's thin one rather than the
              browser's. The popup is a column of a set height, which the
              area needs to know how far it may scroll. The positioner's
              available height has a fallback so the height never resolves
              to nothing before the variable is set. The popup reads in the
              sans stack, so a name in a script the brand faces do not carry
              falls to a proportional system face rather than the generic
              monospace one. */}
          <Popover.Popup
            initialFocus={input}
            style={{ fontFamily: 'var(--font-sans), system-ui' }}
            className="flex h-[min(70svh,var(--available-height,70svh))] w-80 max-w-[calc(100vw-2rem)] flex-col border border-border-subtle bg-bg text-text shadow-xl"
          >
            <Popover.Title className="sr-only">{t('Language')}</Popover.Title>
            <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-border-subtle px-4">
              <SearchIcon className="size-4 shrink-0 text-text-muted" />
              <input
                ref={input}
                type="search"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={
                  activeCode ? optionId(activeCode) : undefined
                }
                aria-autocomplete="list"
                aria-label={languageMenuCopy.search}
                dir="auto"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={languageMenuCopy.search}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
              />
            </div>

            <div className="sr-only" aria-live="polite">
              {query.trim()
                ? rows.length === 0
                  ? languageMenuCopy.none
                  : `${rows.length} ${rows.length === 1 ? 'result' : 'results'}`
                : ''}
            </div>

            {/* A gutter for the bar, so the rows end before it rather than
                running underneath it. */}
            <ScrollArea scrollbarGutter>
              <nav aria-label={t('Language')}>
                {rows.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-text-muted">
                    {languageMenuCopy.none}
                  </p>
                ) : (
                  <ul
                    id={listId}
                    role="listbox"
                    aria-label={t('Language')}
                    className="py-1"
                  >
                    {sections.map((section) => {
                      const heading =
                        section.kind === 'current'
                          ? languageMenuCopy.current
                          : section.kind === 'script'
                            ? scriptName(section.script!)
                            : null
                      return (
                        <Fragment key={section.script ?? section.kind}>
                          {heading ? (
                            <li
                              role="presentation"
                              className="px-4 pt-3 pb-1 text-[11px] text-text-muted"
                            >
                              {heading}
                            </li>
                          ) : null}
                          {section.rows.map(([code, entry]) => {
                            const at = indexOf.get(code)!
                            return (
                              <li
                                key={code}
                                id={optionId(code)}
                                role="option"
                                aria-selected={at === active}
                                onPointerMove={() => setActive(at)}
                                className={
                                  at === active
                                    ? 'bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] text-brand'
                                    : undefined
                                }
                              >
                                <a
                                  href={hrefFor(code)}
                                  hrefLang={code}
                                  lang={code}
                                  aria-current={
                                    code === language ? 'true' : undefined
                                  }
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring aria-current:bg-surface-2"
                                >
                                  <span
                                    aria-hidden="true"
                                    className="w-6 shrink-0 text-center text-xl leading-none"
                                  >
                                    {flag(entry.domain, entry.flag)}
                                  </span>
                                  <span dir="auto" className="min-w-0 flex-1">
                                    {entry.name}
                                  </span>
                                </a>
                              </li>
                            )
                          })}
                        </Fragment>
                      )
                    })}
                  </ul>
                )}
              </nav>
            </ScrollArea>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
