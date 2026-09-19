import { Link, resolveHref, useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { getManualToc } from '@/astro/data'

type Toc = Awaited<ReturnType<typeof getManualToc>>

export function chapterLink(slug: string) {
  return slug === 'index'
    ? ({ to: '/manual/' } as const)
    : ({ to: '/manual/$slug/', params: { slug } } as const)
}

/** Plain href for a chapter, for Astro templates that cannot use the Link. */
export function chapterHref(slug: string): string {
  return resolveHref(
    slug === 'index'
      ? { to: '/manual/' }
      : { to: '/manual/$slug/', params: { slug } },
  )
}

// No color transition here: this nav persists across chapter swaps, so the
// active pill would crossfade for 150ms on every click and read as a blink.
// (Freshly mounted links never transition, which is why only the persisted
// sidebar needs this.)
const sidebarLinkClassName =
  'block truncate px-2 py-1.5 text-[13px] leading-snug text-text-secondary hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Trailing-slash-insensitive pathname, for comparing an href to a route. */
export function pathOf(href: string): string {
  const path = href.split(/[?#]/)[0]
  return path === '/' ? path : path.replace(/\/+$/, '')
}

/** Sidebar link with a live active state. The sidebar persists across chapter
 *  swaps, so the prerendered active state would go stale; the live pathname
 *  keeps the highlight on the chapter actually being read. */
function SidebarLink({
  slug,
  title,
  pathname,
}: {
  slug: string
  title: string
  pathname: string
}) {
  const active = pathOf(chapterHref(slug)) === pathOf(pathname)
  return (
    <Link
      {...chapterLink(slug)}
      data-astro-prefetch="hover"
      className={
        active
          ? `${sidebarLinkClassName} bg-surface-2 text-text font-medium`
          : sidebarLinkClassName
      }
      title={title}
    >
      {title}
    </Link>
  )
}

/** Desktop chapter navigation. Rendered as a persisted island by the manual
 *  pages (see ManualShell), so chapter changes swap only the chapter: this
 *  node's scroll position survives and nothing above the content remounts. */
export function ManualSidebar({
  toc,
  activePath,
}: {
  toc: Toc
  activePath: string
}) {
  const { pathname } = useLocation({ serverPath: activePath })
  const rootRef = useRef<HTMLElement>(null)
  const scroll = useRef(0)

  // The persisted node travels through a detached tree on swap, which zeroes
  // its scroller. Carry the position across instead.
  useEffect(() => {
    const viewport = () =>
      rootRef.current?.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      )
    const save = () => {
      scroll.current = viewport()?.scrollTop ?? 0
    }
    const restore = () => {
      const node = viewport()
      if (node) node.scrollTop = scroll.current
    }
    document.addEventListener('astro:before-swap', save)
    document.addEventListener('astro:after-swap', restore)
    return () => {
      document.removeEventListener('astro:before-swap', save)
      document.removeEventListener('astro:after-swap', restore)
    }
  }, [])

  return (
    <nav
      ref={rootRef}
      aria-label="Manual chapters"
      className="hidden self-start border-r border-border-subtle lg:sticky lg:top-[calc(var(--nav-h)+3rem)] lg:block"
    >
      {/* The scroll viewport needs a definite height to constrain its contents. */}
      <ScrollArea className="h-[calc(100dvh-var(--nav-h)-6rem)]" scrollFade>
        <ol className="flex flex-col pr-6">
          {toc.map((entry) => (
            <li key={entry.slug}>
              <SidebarLink
                slug={entry.slug}
                title={entry.title}
                pathname={pathname}
              />
            </li>
          ))}
        </ol>
      </ScrollArea>
    </nav>
  )
}
