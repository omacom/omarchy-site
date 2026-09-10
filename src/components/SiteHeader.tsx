import { locale, t } from '@/i18n/site'
import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import {
  DownloadIcon,
  GithubIcon,
  MenuBarsIcon,
  PaletteIcon,
  RssIcon,
  SearchIcon,
} from '@/components/icons'
import { OmarchyMarkDrawn } from '@/components/Brand'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MusicMenuControl } from '@/components/MusicControl'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useHashLink, useTopLink } from '@/lib/hash-scroll'
import { OPEN_PICKER_EVENT } from '@/lib/theme'
import { OPEN_SEARCH_EVENT } from '@/lib/search'

function NavTooltip({
  children,
  label,
  shortcut,
}: {
  children: ReactElement
  label: string
  shortcut?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="bottom" sideOffset={10}>
        {label}
        {shortcut && (
          <kbd className="ml-1 border border-current/25 px-1 font-mono text-[11px] opacity-75">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The desktop's clock: the weekday and the hour in the visitor's own time,
 * written the way the site's language writes them, which is what Waybar
 * shows with `{:L%A %H:%M}`. Rendered empty on the server and filled on the
 * client, since the server does not know the visitor's zone.
 */
function BarClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    let timer = 0
    const tick = () => {
      const date = new Date()
      setNow(date)
      // Wake on the next whole minute rather than every second.
      timer = window.setTimeout(
        tick,
        60_000 - (date.getSeconds() * 1000 + date.getMilliseconds()),
      )
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [])
  if (!now) return <span className="site-bar__clock" aria-hidden="true" />
  const day = new Intl.DateTimeFormat(locale.formatLocale, {
    weekday: 'long',
  }).format(now)
  // 24 hours whatever the language, as the desktop's clock has it.
  const time = new Intl.DateTimeFormat(locale.formatLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)
  return (
    <time className="site-bar__clock" dateTime={now.toISOString()}>
      {day} {time}
    </time>
  )
}

const navLinks = [
  { to: '/news/', label: t('News') },
  { to: '/manual/', label: t('Manual') },
  // Old /plugins/ addresses redirect to the standalone directory.
  { href: 'https://plugins.omarchy.org', label: t('Plugins') },
  { to: '/themes/', label: t('Themes') },
] as const

/**
 * The desktop's bar, brought to the web: the mark and the page links on the
 * left like workspaces, a tray of actions on the right. One opaque surface
 * in the theme's own colours at every scroll position, over the hero too.
 */
export function SiteHeader({ path = '/' }: { path?: string }) {
  const { pathname } = useLocation({ serverPath: path })
  const [menuOpen, setMenuOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const installLink = useHashLink('install')
  const homeLink = useTopLink()

  const currentPage = (to: string) => {
    const current = pathname.replace(/\/+$/, '') || '/'
    const target = to.replace(/\/+$/, '') || '/'
    if (current === target) return 'page' as const
    if (current.startsWith(`${target}/`)) return 'location' as const
    return undefined
  }

  useEffect(() => setMenuOpen(false), [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      toggle.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])
  // The sheet only exists on a phone; widening past it leaves it closed.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 640px)')
    const sync = () => {
      if (wide.matches) setMenuOpen(false)
    }
    wide.addEventListener('change', sync)
    return () => wide.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    const root = document.documentElement
    if (menuOpen) root.dataset.navMenu = 'open'
    else delete root.dataset.navMenu
    return () => {
      delete root.dataset.navMenu
    }
  }, [menuOpen])

  const search = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('Search Omarchy')}
      className="site-bar__icon"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))}
    >
      <SearchIcon />
    </Button>
  )

  const theme = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('Change website theme')}
      className="site-bar__icon"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT))}
    >
      <PaletteIcon />
    </Button>
  )

  return (
    <header dir="ltr" className="site-bar sticky top-0 z-(--z-nav)">
      <div className="site-bar__row">
        <Link
          to="/"
          aria-label={t('Omarchy home')}
          onClick={(event) => {
            setMenuOpen(false)
            homeLink(event)
          }}
          className="site-bar__home mark-draw-trigger"
        >
          <OmarchyMarkDrawn className="site-bar__mark" />
        </Link>

        <nav aria-label={t('Main')} className="site-bar__pages hidden sm:flex">
          {navLinks.map((link) =>
            'href' in link ? (
              <a key={link.label} href={link.href} className="site-bar__page">
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className="site-bar__page"
                aria-current={currentPage(link.to)}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="site-bar__center" aria-hidden="true">
          <BarClock />
        </div>

        <div className="site-bar__tray ml-auto hidden sm:flex">
          <TooltipProvider delay={300}>
            <NavTooltip label={t('Search Omarchy')} shortcut="⌘K / Ctrl+K">
              {search}
            </NavTooltip>
            <NavTooltip label={t('Change website theme')} shortcut="T">
              {theme}
            </NavTooltip>
            <LanguageSwitcher
              path={pathname}
              triggerClassName="site-bar__icon"
            />
            <NavTooltip label={t('Subscribe via RSS')}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('Omarchy RSS feed')}
                className="site-bar__icon"
                nativeButton={false}
                render={<a href="/news/rss.xml" />}
              >
                <RssIcon />
              </Button>
            </NavTooltip>
            <NavTooltip label={t('View Omarchy on GitHub')}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('Omarchy on GitHub')}
                className="site-bar__icon"
                nativeButton={false}
                render={<a href="https://github.com/omacom/omarchy" />}
              >
                <GithubIcon />
              </Button>
            </NavTooltip>
          </TooltipProvider>
          <span className="site-bar__separator" aria-hidden="true" />
          <Button
            variant="ghost"
            className="site-bar__install"
            nativeButton={false}
            onClick={installLink}
            render={<Link to="/" hash="install" />}
          >
            <DownloadIcon aria-hidden="true" />
            {t('Install')}
          </Button>
        </div>

        <div className="ml-auto flex items-center sm:hidden">
          {theme}
          <LanguageSwitcher path={pathname} triggerClassName="site-bar__icon" />
          <Button
            ref={toggle}
            variant="ghost"
            size="icon"
            className="site-bar__toggle"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuBarsIcon open={menuOpen} className="size-5" />
          </Button>
        </div>
      </div>

      {/* Tapping the page behind the sheet closes it. */}
      {menuOpen ? (
        <div
          data-menu-scrim
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-x-0 top-(--nav-h) bottom-0 bg-black/55 supports-backdrop-filter:backdrop-blur-xs sm:hidden"
        />
      ) : null}

      {/* Overlaid, not stacked: pushing the page down would change the bar's
          height and with it the hero's offsets. */}
      <div
        id="site-menu"
        hidden={!menuOpen}
        className="site-bar__menu absolute inset-x-0 top-full border-b border-border-subtle bg-bg sm:hidden"
      >
        <nav
          aria-label={t('Main pages')}
          className="mx-auto flex max-w-6xl flex-col px-4 py-2"
        >
          {navLinks.map((link) =>
            'href' in link ? (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="site-bar__menu-link"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="site-bar__menu-link"
                aria-current={currentPage(link.to)}
              >
                {link.label}
              </Link>
            ),
          )}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))
            }}
            className="site-bar__menu-link mt-2 flex items-center gap-2.5 border-t border-border-subtle"
          >
            <SearchIcon className="size-5" />
            {t('Search Omarchy')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT))
            }}
            className="site-bar__menu-link flex items-center gap-2.5"
          >
            <PaletteIcon className="size-5" />
            {t('Change the theme')}
          </button>
          <MusicMenuControl open={menuOpen} path={pathname} />
          <div className="mt-2 flex flex-wrap items-center gap-2.5 border-t border-border-subtle pt-4 pb-2">
            <Button
              className="flex-1"
              nativeButton={false}
              onClick={(event) => {
                setMenuOpen(false)
                installLink(event)
              }}
              render={<Link to="/" hash="install" />}
            >
              <DownloadIcon className="size-5" />
              {t('Install')}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              nativeButton={false}
              render={<a href="/news/rss.xml" />}
            >
              <RssIcon className="size-5" />
              RSS
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              nativeButton={false}
              render={<a href="https://github.com/omacom/omarchy" />}
            >
              <GithubIcon className="size-5" />
              GitHub
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
