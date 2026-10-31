import { t } from '@/i18n/site'
import { Link } from '@tanstack/react-router'
import { PageHeading } from '@/components/PageHeading'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons'
import { chapterLink } from '@/components/ManualLayout'
import type { getManualChapter } from '@/astro/data'

type ChapterData = Awaited<ReturnType<typeof getManualChapter>>

/** Chapter HTML is trusted first-party content. */
export function ManualChapterView({ data }: { data: ChapterData }) {
  const { chapter, prev, next } = data
  if (!chapter) return null

  return (
    <div className="manual-chapter">
      <article>
        <PageHeading title={t('Manual')} as="p" />
        <h1 className="mx-auto w-full max-w-(--measure) text-3xl font-semibold tracking-tight text-text">
          {chapter.title}
        </h1>
        <div
          className="prose mt-6"
          dangerouslySetInnerHTML={{ __html: chapter.html }}
        />
      </article>

      <nav
        aria-label="Chapter pagination"
        className="mt-14 flex flex-wrap justify-between gap-3 border-t border-border-subtle pt-6"
      >
        {prev ? (
          <Link
            {...chapterLink(prev.slug)}
            className="group flex items-center gap-2 text-sm text-text-secondary transition-colors duration-150 ease-out hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeftIcon className="size-5" />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            {...chapterLink(next.slug)}
            className="group ml-auto flex items-center gap-2 text-sm text-text-secondary transition-colors duration-150 ease-out hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {next.title}
            <ArrowRightIcon className="size-5" />
          </Link>
        ) : null}
      </nav>
    </div>
  )
}
