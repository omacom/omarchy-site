import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { getManualToc } from '@/astro/data'

type Toc = Awaited<ReturnType<typeof getManualToc>>

export function chapterLink(slug: string) {
  return slug === 'index'
    ? ({ to: '/manual/' } as const)
    : ({ to: '/manual/$slug/', params: { slug } } as const)
}

const chapterPath = (slug: string) =>
  slug === 'index' ? '/manual/' : `/manual/${slug}/`

/** Sticky chapter navigation and the chapter content slot. */
export function ManualLayout({
  toc,
  activePath,
  children,
}: {
  toc: Toc
  activePath: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-8">
        <nav
          aria-label="Manual chapters"
          data-manual-toc
          className="hidden self-start border-r border-border-subtle lg:sticky lg:top-[calc(var(--nav-h)+3rem)] lg:block"
        >
          {/* The scroll viewport needs a definite height to constrain its contents. */}
          <ScrollArea className="h-[calc(100dvh-var(--nav-h)-6rem)]" scrollFade>
            <ol className="flex flex-col pr-6">
              {toc.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    {...chapterLink(entry.slug)}
                    className="block truncate px-2 py-1.5 text-[13px] leading-snug text-text-secondary transition-colors duration-150 ease-out hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    activeProps={{
                      className: 'bg-surface-2 text-text font-medium',
                    }}
                    activeOptions={{ exact: true }}
                    aria-current={
                      chapterPath(entry.slug) === activePath
                        ? 'page'
                        : undefined
                    }
                    title={entry.title}
                  >
                    {entry.title}
                  </Link>
                </li>
              ))}
            </ol>
          </ScrollArea>
        </nav>

        <div className="min-w-0 lg:ml-auto lg:w-full lg:max-w-(--measure)">
          {/* Mobile chapter picker */}
          <details className="mb-8 border border-border-subtle lg:hidden">
            <summary className="cursor-pointer px-4 py-2.5 font-mono text-[13px] text-text-secondary select-none">
              Chapters
            </summary>
            <ol className="scroll-accent max-h-80 overflow-y-auto border-t border-border-subtle p-2">
              {toc.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    {...chapterLink(entry.slug)}
                    className="block px-2 py-1.5 text-[13px] text-text-secondary"
                    activeProps={{ className: 'text-text font-medium' }}
                    activeOptions={{ exact: true }}
                  >
                    {entry.title}
                  </Link>
                </li>
              ))}
            </ol>
          </details>

          {children}
        </div>
      </div>
    </main>
  )
}
