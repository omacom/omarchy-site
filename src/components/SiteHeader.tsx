import { t } from '@/i18n/site'
import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactElement, RefObject } from 'react'
import {
  DownloadIcon,
  GithubIcon,
  MENU_BARS_FOLD_MS,
  MenuBarsIcon,
  PaletteIcon,
  RssIcon,
  SearchIcon,
} from '@/components/icons'
import { OmarchyMarkDrawn, OmarchyWordmark } from '@/components/Brand'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
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
import { OPEN_PICKER_EVENT, THEME_EVENT, groundOf } from '@/lib/theme'
import { OPEN_SEARCH_EVENT } from '@/lib/search'
import { cn } from '@/lib/utils'

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
          <kbd className="ml-1 rounded border border-current/25 px-1 font-mono text-[11px] opacity-75">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

const navLinks = [
  { to: '/news/', label: t('News') },
  { to: '/manual/', label: t('Manual') },
  // Old /plugins/ addresses redirect to the standalone directory.
  { href: 'https://plugins.omarchy.org', label: t('Plugins') },
  { to: '/themes/', label: t('Themes') },
] as const

/** Observe the live hero sentinel; the header and blended labels share this state. */
/** Choose the visible label layer before paint to prevent a navigation flash. */
const useBeforePaint =
  typeof document === 'undefined' ? useEffect : useLayoutEffect

function useHeroInView(seed: boolean) {
  const [heroInView, setHeroInView] = useState(seed)

  useBeforePaint(() => {
    let observer: IntersectionObserver | null = null
    let sizeWatcher: ResizeObserver | null = null
    let settling = 0
    /** The sentinel currently being observed - the element, not the route.
     *  On a client-side navigation the pathname changes before the DOM does:
     *  the outgoing page is still mounted, so an effect keyed on the route
     *  attaches to the outgoing page's sentinel, and when that node is
     *  removed a moment later its observer fires one last time with
     *  isIntersecting false. That false was permanent - the route never
     *  changes again, so nothing re-attached, and the bar arrived at every
     *  hero page unblended. Tracking the element makes the swap visible:
     *  the live sentinel is no longer the watched one, so watch it instead.
     */
    let watched: Element | null | undefined

    // The same question the observer answers, asked directly: is the hero's
    // bottom edge still below the bar's? Asking it at once matters because
    // the answer is needed on the first frame, and an observer's first
    // callback is not guaranteed to have arrived by then - or at all, while
    // the tab is not being rendered. The observer then keeps it current.
    //
    // null where nothing has been laid out: an unrendered tab measures every
    // box at zero, and zero is not "the hero has scrolled away", it is "no
    // one has asked yet". Answering it would put the bar in the wrong state
    // with no second measurement coming to correct it.
    const covers = (hero: Element, bar: Element) => {
      const barBox = bar.getBoundingClientRect()
      if (barBox.height === 0) return null
      return hero.getBoundingClientRect().bottom > barBox.height
    }

    /**
     * Take the measurement, and if there is nothing to measure yet, come back
     * for it. Bounded, because a tab that is never rendered never lays
     * anything out and would otherwise be asked forever; the observer is
     * still watching either way, and answers as soon as it is shown.
     */
    const settle = (hero: Element, bar: Element, tries = 3) => {
      const covered = covers(hero, bar)
      if (covered !== null) {
        setHeroInView(covered)
        return
      }
      if (tries > 0)
        settling = requestAnimationFrame(() => settle(hero, bar, tries - 1))
    }

    const watch = (hero: Element, bar: Element) => {
      observer?.disconnect()
      // The moment to swap is when the bar's bottom edge meets the hero's,
      // which is the one border the hero and the section under it share.
      // Inset the root by the bar's measured height so the two edges are
      // compared directly: hardcoding it went off by the bar's border, and
      // by a whole row on the narrow layout where the nav wraps under.
      const height = bar.getBoundingClientRect().height
      observer = new IntersectionObserver(
        ([entry]) => setHeroInView(entry.isIntersecting),
        { rootMargin: `-${height}px 0px 0px 0px` },
      )
      observer.observe(hero)
    }

    /**
     * Point everything at whatever sentinel the page has right now. A no-op
     * while the watched one is still the live one; a teardown-and-reattach
     * the moment it is not, whether the page swapped its hero for another or
     * for nothing. Disconnecting the old observer first also discards any
     * report it has queued about the node that just left.
     */
    const sync = () => {
      const hero = document.querySelector('[data-hero-sentinel]')
      if (hero === watched) return
      observer?.disconnect()
      sizeWatcher?.disconnect()
      cancelAnimationFrame(settling)
      watched = hero
      const bar = document.querySelector('header')
      if (!hero || !bar) {
        // Nothing over the bar right now - which is the right answer both on
        // a page with no hero and on one whose chunk is still loading, since
        // the arrivals watcher below re-runs this when a hero does mount.
        setHeroInView(false)
        return
      }
      settle(hero, bar)
      watch(hero, bar)
      // The bar grows a second row of links on narrow screens, so the edge
      // it is measured against moves with the layout.
      sizeWatcher = new ResizeObserver(() => watch(hero, bar))
      sizeWatcher.observe(bar)
    }

    // Every arrival and departure funnels through sync, which is what lets
    // this run once for the life of the header instead of once per route:
    // the DOM says when the hero changes, and the DOM is what is being
    // watched, so there is nothing for the route to add.
    const arrivals = new MutationObserver(sync)
    arrivals.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
    sync()

    return () => {
      cancelAnimationFrame(settling)
      observer?.disconnect()
      sizeWatcher?.disconnect()
      arrivals.disconnect()
    }
  }, [])

  return heroInView
}

/** Write surface opacity to CSS while scrolling; measure section geometry once per layout. */
function useNavSurface(
  sheetOpen: boolean,
  /** The blended ghost is up behind the bar, so the real labels stand aside. */
  blended: boolean,
  bar: RefObject<HTMLElement | null>,
  /** Re-surveyed on arrival at a new page, whose sections are its own. */
  pathname: string,
) {
  const wasOpen = useRef(sheetOpen)
  useEffect(() => {
    const el = bar.current
    if (!el) return
    const justClosed = wasOpen.current && !sheetOpen
    wasOpen.current = sheetOpen
    // Keep real labels visible until the menu toggle finishes its closing animation.
    let holding = blended && justClosed

    const solid = (on: boolean) => {
      // Render the label state as an attribute so it also applies before hydration.
      if (!on && holding) return
      if (on) el.removeAttribute('data-nav-blend')
      else el.setAttribute('data-nav-blend', '')
      const ghost = document.querySelector<HTMLElement>('[data-nav-ghost]')
      if (ghost) ghost.style.opacity = on ? '0' : '1'
    }

    type Ground = { top: number; bottom: number; colour: string }
    let grounds: Ground[] = []
    let height = 0
    /** The hero bottom in page coordinates. */
    let heroBottom = 0
    /** The <main> the last survey read. The route changes before the DOM
     *  does, so the one mounted when this effect runs may be the outgoing
     *  page's; comparing identities is how the swap is noticed. */
    let surveyed: Element | null = null
    let heroUp = false
    // Read hover state immediately on navigation; only mouse pointers have persistent hover.
    let hovering =
      window.matchMedia('(hover: hover)').matches && el.matches(':hover')

    const survey = () => {
      // Keep the size watcher pointed at whichever <main> is actually
      // mounted; the one this effect started with may already be gone.
      const main = document.querySelector('main')
      if (main !== surveyed) {
        surveyed = main
        sizes.disconnect()
        if (main) sizes.observe(main)
      }
      const hero = document.querySelector('[data-hero-sentinel]')
      heroUp = hero !== null
      heroBottom = hero
        ? hero.getBoundingClientRect().bottom + window.scrollY
        : 0
      height = el.getBoundingClientRect().height
      const sections = document.querySelectorAll<HTMLElement>(
        'main > section, main [data-ground]',
      )
      const nodes = sections.length
        ? [...sections]
        : [...document.querySelectorAll<HTMLElement>('main')]

      const footer = document.querySelector<HTMLElement>('footer')
      if (footer) nodes.push(footer)

      grounds = nodes
        .filter((node) => !node.hasAttribute('data-hero-sentinel'))
        .map((node) => {
          const box = node.getBoundingClientRect()
          return {
            top: box.top + window.scrollY,
            bottom: box.bottom + window.scrollY,
            colour: groundOf(node) ?? 'var(--color-bg)',
          }
        })
      return grounds.length > 0
    }

    /**
     * The bar carries a section's colour only while it is wholly inside that
     * section: from the moment its own top edge meets the section's top, to
     * the moment its bottom edge meets the section's bottom. Outside that -
     * which is exactly while a boundary is crossing it - it carries nothing.
     *
     * Both switches happen at the instant the fill and the thing behind it are
     * the same colour, so neither is visible. What you see instead is a bar
     * that hides the page sliding under it, and lets a section edge pass
     * through in the open.
     *
     * Cheap enough to run straight from the scroll event: it reads scrollY,
     * which costs no layout, and compares it against numbers taken once.
     */
    /** The innermost ground at a point down the page, or none. */
    const groundAt = (y: number) => {
      let found: Ground | null = null
      for (const g of grounds) if (y >= g.top && y < g.bottom) found = g
      return found
    }

    // On a phone the bar is never bare past the hero. Going bare lets
    // whatever is scrolling under the bar show straight through it for the
    // moment a section edge is crossing, which behind the wordmark read as
    // a leak. The edge still passes through pixel by pixel: while it is
    // inside the bar, the bar paints the upper section's colour down to the
    // edge and the lower section's below it, both at the usual 90% over the
    // blur, and the split moves with the scroll.
    const phone = window.matchMedia('(max-width: 639.98px)')
    const wash = (colour: string) =>
      `color-mix(in srgb, ${colour} 90%, transparent)`

    const paint = () => {
      const y = window.scrollY
      const top = groundAt(y)
      const bottom = groundAt(y + height)
      const whole = top && top === bottom ? top : null
      const here = phone.matches ? (top ?? bottom) : whole
      let image = ''
      let fill = '1'
      if (phone.matches && !sheetOpen && top !== bottom) {
        const edge =
          top && bottom
            ? Math.min(top.bottom, bottom.top > y ? bottom.top : Infinity)
            : top
              ? top.bottom
              : bottom!.top
        const split = Math.round(edge - y)
        const above = top ? wash(top.colour) : 'transparent'
        const below = bottom ? wash(bottom.colour) : 'transparent'
        image = `linear-gradient(to bottom, ${above} ${split}px, ${below} ${split}px)`
        fill = '0'
      }
      el.style.backgroundImage = image
      el.style.setProperty('--nav-fill', fill)
      if (here) el.style.setProperty('--nav-ground', here.colour)
      else if (!heroUp) el.style.setProperty('--nav-ground', 'var(--color-bg)')
      el.style.setProperty('--nav-surface', here || !heroUp ? '1' : '0')
      el.toggleAttribute(
        'data-nav-past-hero',
        !heroUp || (phone.matches ? y + height : y) >= heroBottom,
      )
      // The ghost holds the labels for as long as it is up, and hovering hands
      // them over early: it sits under the bar and cannot answer a pointer.
      solid(sheetOpen || !blended || hovering)
    }

    const hold = holding
      ? window.setTimeout(() => {
          holding = false
          paint()
        }, MENU_BARS_FOLD_MS)
      : 0

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      hovering = true
      paint()
    }
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      hovering = false
      paint()
    }

    const relayout = () => {
      survey()
      paint()
    }

    // Arriving at /#install, the page is moved to the anchor by whatever
    // handles the hash, which may be before this attaches - and a scroll that
    // has already happened sends no event to catch up on. One more pass once
    // the current task is done reads wherever the page actually ended up.
    const settle = window.setTimeout(relayout, 0)

    // Sections grow as images and fonts land, which moves every edge below.
    // survey() points this at the mounted <main>, and re-points it when the
    // page under the bar is swapped for another.
    const sizes = new ResizeObserver(relayout)

    // The page mounts async on a client-side navigation, so wait for it.
    let probe = 0
    const wait = () => {
      if (survey()) {
        paint()
        return
      }
      probe = requestAnimationFrame(wait)
    }
    wait()

    // Observe DOM swaps because route updates can precede the incoming page mounting.
    const arrivals = new MutationObserver(() => {
      if (document.querySelector('main') !== surveyed) relayout()
    })
    arrivals.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    phone.addEventListener('change', paint)
    window.addEventListener('scroll', paint, { passive: true })
    window.addEventListener('resize', relayout)
    // Each ground's colour is read once and held, so a theme has to say when
    // it has changed or the bar keeps the last one until the next scroll.
    window.addEventListener(THEME_EVENT, relayout)
    return () => {
      cancelAnimationFrame(probe)
      window.clearTimeout(settle)
      window.clearTimeout(hold)
      arrivals.disconnect()
      sizes.disconnect()
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      phone.removeEventListener('change', paint)
      el.style.backgroundImage = ''
      el.style.removeProperty('--nav-fill')
      window.removeEventListener('scroll', paint)
      window.removeEventListener('resize', relayout)
      window.removeEventListener(THEME_EVENT, relayout)
    }
  }, [sheetOpen, blended, bar, pathname])
}

export function SiteHeader({ path = '/' }: { path?: string }) {
  const { pathname } = useLocation({ serverPath: path })
  const heroInView = useHeroInView(pathname === '/')
  const [menuOpen, setMenuOpen] = useState(false)
  const installLink = useHashLink('install')
  const homeLink = useTopLink()
  const transparent = heroInView

  useEffect(() => setMenuOpen(false), [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])
  useEffect(() => {
    const root = document.documentElement
    if (menuOpen) root.dataset.navMenu = 'open'
    else delete root.dataset.navMenu
    return () => {
      delete root.dataset.navMenu
    }
  }, [menuOpen])
  const bar = useRef<HTMLDivElement>(null)
  // Continue tracking section colors after the hero leaves the viewport.
  useNavSurface(menuOpen, transparent, bar, pathname)

  const glyph = (
    <Link
      to="/"
      aria-label={t('Omarchy home')}
      onClick={homeLink}
      className="mark-draw-trigger relative flex items-center"
    >
      <OmarchyMarkDrawn className="size-[22px] shrink-0 transition-opacity duration-150 ease-out max-sm:group-data-[nav-past-hero]/bar:opacity-0 lg:size-[calc(var(--pxc)*2)]" />
      <OmarchyWordmark className="absolute top-1/2 left-0 w-28 -translate-y-1/2 text-brand opacity-0 transition-opacity duration-150 ease-out group-data-[nav-past-hero]/bar:opacity-100 sm:hidden" />
    </Link>
  )

  const search = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('Search Omarchy')}
      data-nav-glyph
      className="relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))}
    >
      <SearchIcon className="size-5" />
    </Button>
  )

  const theme = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('Change website theme')}
      data-nav-glyph
      className="relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT))}
    >
      <PaletteIcon className="size-5" />
    </Button>
  )

  const install = (
    <Button
      className="relative h-8 px-4 before:absolute before:-inset-y-1.5 lg:h-[calc(var(--pxr)*3)]"
      nativeButton={false}
      onClick={installLink}
      render={<Link to="/" hash="install" />}
    >
      {t('Install')}
    </Button>
  )

  return (
    <header dir="ltr" className="pixel-container sticky top-0 z-(--z-nav)">
      <div
        ref={bar}
        data-nav-blend={transparent ? '' : undefined}
        // With the sheet down, the bar is the top of the sheet and wears its
        // ground rather than the section's: taking a colour from the page
        // behind it would put a seam across the one surface being looked at.
        className={cn('group/bar', menuOpen && 'bg-bg/95 backdrop-blur-lg')}
        style={{
          // On the bar rather than the header, so both the surface it paints
          // and the height the hooks measure include the strip above it.
          paddingTop: 'env(safe-area-inset-top)',
          backgroundColor: menuOpen
            ? undefined
            : 'color-mix(in srgb, var(--nav-ground, var(--color-bg)) calc(var(--nav-surface, 0) * var(--nav-fill, 1) * 90%), transparent)',
          // Keep blur off over the hero so its pixels stay sharp.
          backdropFilter: menuOpen
            ? undefined
            : 'blur(calc(var(--nav-surface, 0) * 12px))',
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          {glyph}

          <nav
            data-nav-links
            aria-label={t('Main')}
            className="hidden items-center sm:flex"
          >
            {navLinks.map((link) =>
              'href' in link ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3 py-1.5 text-sm whitespace-nowrap text-text-secondary transition-[background-color] duration-150 ease-out hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className="px-3 py-1.5 text-sm whitespace-nowrap text-text-secondary transition-[background-color] duration-150 ease-out hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  activeProps={{ className: 'text-text bg-surface-2' }}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden items-center gap-1 sm:flex">
              <TooltipProvider delay={300}>
                <NavTooltip label={t('Search Omarchy')} shortcut="⌘K / Ctrl+K">
                  {search}
                </NavTooltip>
                <NavTooltip label={t('Change website theme')} shortcut="T">
                  {theme}
                </NavTooltip>
                <LanguageSwitcher path={pathname} />
                <NavTooltip label={t('Subscribe via RSS')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('Omarchy RSS feed')}
                    data-nav-glyph
                    className="relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]"
                    nativeButton={false}
                    render={<a href="/news/rss.xml" />}
                  >
                    <RssIcon className="size-5" />
                  </Button>
                </NavTooltip>
                <NavTooltip label={t('View Omarchy on GitHub')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('Omarchy on GitHub')}
                    data-nav-glyph
                    className="relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]"
                    nativeButton={false}
                    render={<a href="https://github.com/omacom/omarchy" />}
                  >
                    <GithubIcon className="size-5" />
                  </Button>
                </NavTooltip>
              </TooltipProvider>
              <span className="ml-2 flex">{install}</span>
            </div>
            <div className="flex items-center gap-1 sm:hidden">
              {theme}
              <LanguageSwitcher path={pathname} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              data-nav-toggle
              className="relative size-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 sm:hidden"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? 'Close menu' : 'Menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MenuBarsIcon open={menuOpen} className="size-[22px]" />
            </Button>
          </div>
        </div>
      </div>
      {/* Tapping the page behind the sheet closes it. The header is an
          inline-size container, so it is the containing block for fixed
          children as well - bottom-0 would resolve to the bar's own 56px, and
          the scrim is sized explicitly instead. Dimmed and blurred the way
          the search and the theme picker dim the page, so the three open
          alike; a wash of the page's own colour barely showed on a dark
          theme. */}
      {menuOpen ? (
        <div
          data-menu-scrim
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          className="absolute inset-x-0 top-(--nav-h) h-svh bg-black/55 supports-backdrop-filter:backdrop-blur-xs sm:hidden"
        />
      ) : null}

      {/* Overlaid, not stacked: pushing the page down would change the bar's
          height and with it the hero's offsets. */}

      <div
        id="site-menu"
        hidden={!menuOpen}
        className="absolute inset-x-0 top-(--nav-h) border-b border-border-subtle bg-bg/95 backdrop-blur-lg sm:hidden"
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
                className="py-3 text-[15px] text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-[15px] text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                activeProps={{ className: 'text-text font-medium' }}
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
            className="mt-2 flex items-center gap-2.5 border-t border-border-subtle py-3 pt-4 text-left text-[15px] text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
            className="flex items-center gap-2.5 py-3 text-left text-[15px] text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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

/** Render inside the hero stacking context so labels can blend with its canvas. */
export function HeroNavGhost() {
  // Use the header's shared hero state to keep both label layers synchronized.
  return (
    <div
      aria-hidden="true"
      dir="ltr"
      data-nav-ghost
      className="pointer-events-none fixed inset-x-0 top-0 z-(--z-nav) mix-blend-difference"
      // The header hydrates before the hero does, and its effect writes this
      // node's opacity in between - 1 with the hero up, 0 with the page
      // reloaded further down, or the pointer already resting on the bar, or
      // on a phone. React then hydrates this node against whichever value it
      // found. Declaring the property keeps React from reporting an inline
      // style it never rendered; suppressing the warning covers the loads
      // where the effect's answer was 0. React does not patch attributes on
      // a mismatch, so the effect's value, the right one, is what stays.
      style={{ paddingTop: 'env(safe-area-inset-top)', opacity: 1 }}
      suppressHydrationWarning
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <span className="flex items-center">
          <span className="block size-[22px] shrink-0 lg:size-[calc(var(--pxc)*2)]" />
        </span>

        <span className="hidden items-center sm:flex">
          {navLinks.map((link) => (
            <span
              key={link.label}
              className="px-3 py-1.5 text-sm whitespace-nowrap"
              style={{ color: 'var(--t-hdr-text-2)' }}
            >
              {link.label}
            </span>
          ))}
        </span>

        <span className="ml-auto flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1 sm:flex"
            style={{ color: 'var(--t-hdr-text-2)' }}
          >
            <span className="flex h-8 w-8 items-center justify-center lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]">
              <SearchIcon className="size-5" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]">
              <PaletteIcon className="size-5" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]">
              <GlobeIcon className="size-5" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]">
              <RssIcon className="size-5" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]">
              <GithubIcon className="size-5" />
            </span>
            {/* Install holds its own colours, so the ghost only holds its
                place - same box, same type metrics, nothing painted. The
                border is part of the box: the real button wears a 1px
                transparent one, and without it here the ghost's icons sat
                2px to the right of the real ones, so every swap between
                the two layers read as a wiggle. */}
            <span
              aria-hidden="true"
              className="ml-2 inline-flex h-8 items-center border border-transparent px-4 text-sm font-medium lg:h-[calc(var(--pxr)*3)]"
              style={{ color: 'transparent' }}
            >
              {t('Install')}
            </span>
          </span>

          <span
            className="flex size-8 items-center justify-center sm:hidden"
            style={{ color: 'var(--t-hdr-text-2)' }}
          >
            <MenuBarsIcon className="size-[22px]" />
          </span>
        </span>
      </div>
    </div>
  )
}
