import { t, language } from '@/i18n/site'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons'
import { NewsHeader } from '@/components/NewsHeader'
import type { NewsPost, NewsSummary } from '@/lib/news'

export function NewsIndexPage({ news }: { news: Array<NewsSummary> }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <NewsHeader />

      <ul className="divide-y divide-border-subtle [&>li:first-child>a]:pt-0">
        {news.map((post) => {
          return (
            <li key={post.slug}>
              <Link
                to="/news/$year/$month/$slug/"
                params={{ year: post.year, month: post.month, slug: post.slug }}
                className="group flex flex-col gap-1.5 py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <time
                  dateTime={post.date}
                  className="font-mono text-xs text-text-muted"
                >
                  {post.dateStr}
                </time>
                <span className="flex items-baseline gap-1.5 font-sans text-lg font-medium text-text transition-colors duration-150 ease-out group-hover:text-brand">
                  {post.title}
                  <ArrowRightIcon className="size-5 shrink-0 self-center text-text-muted transition-[color,translate] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-brand" />
                </span>
                {post.excerpt ? (
                  <span className="text-sm leading-relaxed text-text-secondary [text-wrap:pretty]">
                    {post.excerpt}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

export function NewsPostPage({ post }: { post: NewsPost }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <NewsHeader article />
      <article>
        <header>
          <p className="font-mono text-xs text-text-muted">
            {t('By')}{' '}
            <a
              href="https://dhh.dk"
              rel="author"
              className="text-text-secondary"
            >
              DHH
            </a>{' '}
            {language === 'zh-CN' ? '\u3000' : `${t('on')} `}
            <time dateTime={post.date}>{post.dateStr}</time>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">
            {post.title}
          </h1>
        </header>
        <div
          className="prose mt-8"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>

      <Link
        to="/news/"
        className="mt-10 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors duration-150 ease-out hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeftIcon className="size-5" />
        {t('All news')}
      </Link>
    </main>
  )
}
