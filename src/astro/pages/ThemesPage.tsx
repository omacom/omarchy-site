import { t } from '@/i18n/site'
import { PageHeading } from '@/components/PageHeading'
import themes from '@/data/themes.json'

export function ThemesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeading title={t('Community themes')}>
        <div className="mx-auto mt-6 max-w-xl text-center">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-text-secondary sm:text-sm">
            <span>{t('Make it yours:')}</span>
            <span className="inline-flex items-center gap-2 font-mono text-text">
              <span>Install</span>
              <span aria-hidden="true" className="text-text-muted">
                →
              </span>
              <span className="sr-only">{t('then')}</span>
              <span>Style</span>
              <span aria-hidden="true" className="text-text-muted">
                →
              </span>
              <span className="sr-only">{t('then')}</span>
              <span>Themes</span>
            </span>
          </p>
          <a
            href="https://github.com/omacom/omarchy-site#adding-your-theme"
            className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-xs text-text-secondary underline decoration-border-strong underline-offset-4 transition-colors hover:text-brand hover:decoration-brand sm:text-sm"
          >
            {t('Share your theme')}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </PageHeading>

      <ul className="grid gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
          <li key={theme.name}>
            <a
              href={theme.repo}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <img
                src={theme.image}
                alt={`${theme.name} theme screenshot`}
                width={1200}
                height={675}
                loading="lazy"
                decoding="async"
                className="img-outlined aspect-video w-full rounded-lg bg-bg-deep object-cover"
              />
              <span className="mt-2.5 block font-mono text-[13px] text-text-secondary transition-colors duration-150 ease-out group-hover:text-text">
                {theme.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
