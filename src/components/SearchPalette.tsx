import { t } from '@/i18n/site'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  AgentsIcon,
  BankIcon,
  BrushIcon,
  ChevronRightIcon,
  DiscordIcon,
  DownloadIcon,
  GithubIcon,
  HeartIcon,
  MapPinIcon,
  PageIcon,
  PaletteIcon,
  PluginsIcon,
  RssIcon,
  ShieldIcon,
  StarIcon,
  StoreIcon,
} from '@/components/icons'
import { OmarchyMark } from '@/components/Brand'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
import type { SearchEntry } from '@/lib/content'
import { getSearchIndex } from '@/lib/content'
import type { SearchHit } from '@/lib/search'
import { KIND_LABEL, OPEN_SEARCH_EVENT, searchAll } from '@/lib/search'
import type { MenuIcon, MenuItem } from '@/lib/menu'
import {
  childrenOf,
  everyRow,
  filterRows,
  localeHref,
  menuItem,
  menuParent,
  menuTitle,
  opensMenu,
  providerRows,
} from '@/lib/menu'

/**
 * Site-wide command menu, built to read like the one SUPER+SPACE opens on the
 * desktop: a narrow card, mono throughout, a prompt line instead of a field,
 * and the destinations already on screen before anything is typed. Typing
 * filters the current menu; at the root it searches the whole site as well.
 */

const typing = (el: HTMLElement | null) =>
  !!el &&
  (el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable)

const ICONS: Record<MenuIcon, typeof PageIcon> = {
  home: OmarchyMark,
  manual: PageIcon,
  news: RssIcon,
  themes: PaletteIcon,
  plugins: PluginsIcon,
  install: DownloadIcon,
  language: GlobeIcon,
  community: AgentsIcon,
  foundation: BankIcon,
  project: StarIcon,
  page: PageIcon,
  meetups: MapPinIcon,
  teams: HeartIcon,
  discord: DiscordIcon,
  github: GithubIcon,
  security: ShieldIcon,
  patrons: HeartIcon,
  brand: BrushIcon,
  merch: StoreIcon,
}

/** A row is either a menu entry or a search hit; both navigate on Enter. */
type Row = { sort: 'menu'; item: MenuItem } | { sort: 'hit'; hit: SearchHit }

export function SearchPalette() {
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  // Where the pointer last was: a row picks itself only when it moved there.
  const pointer = useRef({ x: -1, y: -1 })
  const scroller = useRef<HTMLDivElement>(null)
  const restore = useRef<HTMLElement | null>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menu, setMenu] = useState('root')
  const [index, setIndex] = useState<SearchEntry[] | null>(null)
  const [active, setActive] = useState(0)

  const show = useCallback(() => {
    restore.current = document.activeElement as HTMLElement | null
    setOpen(true)
    setQuery('')
    setMenu('root')
    setActive(0)
    void getSearchIndex().then(setIndex)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    restore.current?.focus({ focusVisible: false })
  }, [])

  /**
   * The rows under the cursor. A submenu lists its own entries and nothing
   * else - walking into Manual and typing means "which chapter", not "search
   * the site". The root is where a query reaches the whole tree, so Doctrine
   * is found without knowing it sits under Community, and past the menu into
   * the index.
   */
  const searching = menu === 'root' && query.trim().length > 0
  const rows = useMemo<Row[]>(() => {
    const own = searching
      ? everyRow()
      : [...childrenOf(menu), ...providerRows(menuItem(menu)?.provider, index)]
    const entries: Row[] = filterRows(own, query).map((row) => ({
      sort: 'menu',
      item: row,
    }))
    if (!searching || !index) return entries
    const hits = searchAll(index, query)
    return [...entries, ...hits.map((hit) => ({ sort: 'hit' as const, hit }))]
  }, [searching, menu, query, index])

  useEffect(() => setActive(0), [menu, query])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (open) return
      if (typing(event.target as HTMLElement)) return
      const command = (event.metaKey || event.ctrlKey) && event.key === 'k'
      // Cmd-K belongs to the palette everywhere. A bare slash belongs to the
      // page when the page has a field of its own - on the plugin directory
      // it means "filter this list", and taking it to search the manual
      // instead would be answering a different question.
      const slash =
        event.key === '/' &&
        !document.querySelector('main input[type="search"]')
      if (command || slash) {
        event.preventDefault()
        show()
      }
    }
    const onRequest = () => show()
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_SEARCH_EVENT, onRequest)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_SEARCH_EVENT, onRequest)
    }
  }, [open, show])

  // Focus lands in the field, which is also the palette's only tab stop, so
  // there is nowhere for focus to wander off to while it is up.
  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  // The arrows move a selection, not focus, so nothing scrolls the list on
  // their own. scrollIntoView would, but it scrolls every scrollable ancestor
  // to satisfy the request and rounds the row to its own idea of "nearest",
  // which is why the list appeared to jump several rows at a time. This moves
  // the list by exactly the amount the row is outside it, and touches nothing
  // else on the page.
  useEffect(() => {
    const box = scroller.current
    const row = list.current?.children[active] as HTMLElement | undefined
    if (!box || !row) return
    const view = box.getBoundingClientRect()
    const rect = row.getBoundingClientRect()
    if (rect.top < view.top) box.scrollTop -= view.top - rect.top
    else if (rect.bottom > view.bottom)
      box.scrollTop += rect.bottom - view.bottom
  }, [active, rows])

  if (!open) return null

  const goHit = (hit: SearchHit) => {
    close()
    if (hit.kind === 'manual') {
      void navigate(
        hit.slug === 'index'
          ? { to: '/manual/', hash: hit.hash ?? undefined }
          : {
              to: '/manual/$slug/',
              params: { slug: hit.slug },
              hash: hit.hash ?? undefined,
            },
      )
      return
    }
    if (hit.kind === 'news') {
      void navigate({
        to: '/news/$year/$month/$slug/',
        params: { year: hit.year, month: hit.month, slug: hit.slug },
      })
      return
    }
    void navigate({ to: '/themes/' })
  }

  const goItem = (item: MenuItem) => {
    if (opensMenu(item)) {
      setMenu(item.id)
      setQuery('')
      return
    }
    close()
    if (item.locale) {
      window.location.href = localeHref(
        item.locale,
        window.location.pathname,
        window.location.search + window.location.hash,
      )
      return
    }
    if (item.href) {
      window.location.href = item.href
      return
    }
    if (item.to) void navigate({ to: item.to, hash: item.hash })
  }

  const goRow = (row: Row) =>
    row.sort === 'menu' ? goItem(row.item) : goHit(row.hit)

  /** Backing out of a submenu, the way Backspace does on the desktop menu. */
  const back = () => {
    setQuery('')
    setMenu((at) =>
      at.includes('.') ? at.slice(0, at.lastIndexOf('.')) : 'root',
    )
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      // Esc drops the query first and the menu second, so a mistyped filter
      // costs one key rather than reopening the palette.
      if (query) setQuery('')
      else if (menu !== 'root') back()
      else close()
      return
    }
    if (
      (event.key === 'Backspace' || event.key === 'ArrowLeft') &&
      !query &&
      menu !== 'root'
    ) {
      event.preventDefault()
      back()
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (rows.length === 0) return
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((at) => Math.min(rows.length - 1, Math.max(0, at + step)))
    } else if (event.key === 'Enter' || event.key === 'ArrowRight') {
      // active can outrun the list between a keystroke and a re-render;
      // without noUncheckedIndexedAccess the compiler cannot see that.
      const row = rows[active] as Row | undefined
      if (!row) return
      // Right only walks into a submenu; on a leaf it belongs to the caret.
      if (
        event.key === 'ArrowRight' &&
        !(row.sort === 'menu' && opensMenu(row.item))
      )
        return
      event.preventDefault()
      goRow(row)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('Search Omarchy')}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-(--z-modal) flex items-center justify-center px-4"
    >
      <div
        aria-hidden="true"
        onClick={close}
        // Same backdrop treatment the theme picker uses, so the two things the
        // site puts over the page dim it the same way.
        className="absolute inset-0 bg-bg/60 supports-backdrop-filter:backdrop-blur-xs"
      />

      {/* 2px, the width the desktop menu draws its own card border at. The rows
          are the desktop's 50px scaled to this label size; the padding and
          header are its own. */}
      <div className="relative flex max-h-[70vh] w-full max-w-[340px] flex-col border-2 border-border-strong bg-surface p-[18px]">
        {/*
          The prompt line, not a field. It carries the caret and the typing,
          but it is drawn as the menu's own header: the name of where you are,
          dimmed, until you replace it with a query.
        */}
        <div className="flex h-[34px] shrink-0 items-center gap-2">
          {menu !== 'root' ? (
            <button
              type="button"
              // Pressing keeps focus in the field; the click is what backs out, so
              // an assistive click, which sends no pointer event, works the same.
              onPointerDown={(event) => event.preventDefault()}
              onClick={back}
              aria-label={t('Back')}
              tabIndex={-1}
              className="-ml-1 shrink-0 text-text-muted transition-colors duration-150 ease-out hover:text-text"
            >
              <ChevronRightIcon className="size-4 rotate-180" />
            </button>
          ) : null}
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`${menuTitle(menu)}…`}
            aria-label={t('Search Omarchy')}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-text outline-none pointer-coarse:text-base placeholder:text-text placeholder:opacity-60 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        <div className="sr-only" aria-live="polite">
          {query.trim() && index
            ? rows.length === 0
              ? 'No matches'
              : `${rows.length} ${rows.length === 1 ? 'result' : 'results'}`
            : ''}
        </div>

        <div
          ref={scroller}
          className="scroll-accent -mx-1 mt-1.5 min-h-0 flex-1 overflow-y-auto px-1"
        >
          {rows.length === 0 ? (
            <p className="px-2 py-6 font-mono text-[13px] text-text-muted">
              {index ? (
                <>
                  {t('Nothing matches')}{' '}
                  <span className="text-text-secondary">{query.trim()}</span>.
                </>
              ) : (
                'Reading…'
              )}
            </p>
          ) : (
            <ul
              ref={list}
              role="listbox"
              aria-label={t('Search results')}
              className="space-y-[2px]"
            >
              {rows.map((row, at) => (
                <li key={rowKey(row, at)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={at === active}
                    // Arrow keys move the selection; rows are excluded from the tab order.
                    tabIndex={-1}
                    // Pressing keeps focus in the field; the click is what acts, so
                    // a finger scrolling the list does not open the row it lands on.
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => goRow(row)}
                    onPointerMove={(event) => {
                      // Arrowing scrolls the list under a still pointer, and the
                      // row that slides under it would take the selection back.
                      if (
                        event.clientX === pointer.current.x &&
                        event.clientY === pointer.current.y
                      )
                        return
                      pointer.current = { x: event.clientX, y: event.clientY }
                      setActive(at)
                    }}
                    className={
                      'flex w-full items-center gap-3 px-3 text-left ' +
                      (row.sort === 'hit' ? 'py-2.5 ' : 'h-[40px] ') +
                      // The desktop menu fills the selected row with its
                      // foreground at 8%. surface-2 collapses onto surface in
                      // several themes, which leaves the cursor invisible.
                      (at === active
                        ? 'bg-[color-mix(in_srgb,var(--color-text)_8%,transparent)] text-brand'
                        : 'text-text')
                    }
                  >
                    {row.sort === 'menu' ? (
                      <MenuRow
                        item={row.item}
                        crumb={
                          searching ? menuParent(row.item)?.label : undefined
                        }
                      />
                    ) : (
                      <HitRow hit={row.hit} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

const rowKey = (row: Row, at: number) =>
  row.sort === 'menu' ? row.item.id : `${row.hit.kind}-${row.hit.slug}-${at}`

/** `crumb` names the submenu a row was found in, when found from the root. */
function MenuRow({ item, crumb }: { item: MenuItem; crumb?: string }) {
  const Icon = ICONS[item.icon]
  return (
    <>
      {item.glyph ? (
        <span
          aria-hidden="true"
          className="w-4 shrink-0 text-center leading-none"
        >
          {item.glyph}
        </span>
      ) : (
        <Icon className="size-4 shrink-0 opacity-80" />
      )}
      <span
        dir="auto"
        className="min-w-0 flex-1 truncate font-mono text-[13px]"
      >
        {item.label}
      </span>
      {crumb ? (
        <span className="ml-auto shrink-0 font-mono text-[10px] tracking-wide text-text-muted uppercase">
          {crumb}
        </span>
      ) : null}
      {opensMenu(item) ? (
        <ChevronRightIcon className="size-3.5 shrink-0 opacity-50" />
      ) : null}
    </>
  )
}

function HitRow({ hit }: { hit: SearchHit }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="flex items-baseline gap-2">
        <span className="truncate font-mono text-[13px]">
          {hit.kind === 'manual' ? (hit.heading ?? hit.title) : hit.title}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10px] tracking-wide text-text-muted uppercase">
          {t(KIND_LABEL[hit.kind])}
        </span>
      </span>
      {hit.snippet ? (
        <span className="mt-1 line-clamp-2 block text-[12px] leading-relaxed text-text-secondary">
          {hit.snippet.before}
          <mark className="bg-transparent font-medium text-brand">
            {hit.snippet.match}
          </mark>
          {hit.snippet.after}
        </span>
      ) : null}
    </span>
  )
}
