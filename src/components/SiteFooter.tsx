import { t, language, sortedLocales, hasTranslation } from '@/i18n/site'
import { Link } from '@tanstack/react-router'
import { OmarchyWordmark } from '@/components/Brand'
import { PixelBackdrop } from '@/components/HeroShader'
import {
  CloudflareMark,
  DigitalOceanMark,
  ThirtySevenSignalsMark,
} from '@/components/PartnerLogos'
import { useTopLink } from '@/lib/hash-scroll'

const columns = [
  {
    title: t('Explore'),
    links: [
      { label: t('News'), to: '/news/' },
      { label: t('Manual'), to: '/manual/' },
      { label: t('Plugins'), href: 'https://plugins.omarchy.org' },
      { label: t('Themes'), to: '/themes/' },
    ],
  },
  {
    title: t('Community'),
    links: [
      { label: 'Discord', href: 'https://discord.gg/tXFUdasqhY' },
      { label: t('Meetups'), to: '/meetups/' },
      { label: t('Teams'), to: '/teams/' },
      { label: t('Workstations'), splat: 'workstations' },
      { label: t('Doctrine'), to: '/doctrine/' },
    ],
  },
  {
    title: t('Foundation'),
    links: [
      { label: t('About'), splat: 'foundation' },
      { label: t('Staff'), splat: 'staff' },
      { label: t('Patrons'), splat: 'patrons' },
      { label: t('Sponsorships'), splat: 'sponsorships' },
      { label: 'AIR', splat: 'air' },
    ],
  },
  {
    title: t('Project'),
    links: [
      { label: t('Security'), splat: 'security' },
      { label: 'GitHub', href: 'https://github.com/omacom/omarchy' },
      { label: t('Brand'), splat: 'brand' },
      {
        label: t('Merch'),
        href: 'https://supply.37signals.com/collections/omarchy',
      },
    ],
  },
] as const

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const footerLink = `text-text-secondary underline decoration-transparent underline-offset-4 transition-colors duration-150 ease-out hover:text-brand hover:decoration-current ${focusRing}`

export function SiteFooter({ path }: { path: string }) {
  const homeLink = useTopLink()
  const currentPath = path
  return (
    <footer
      className="relative isolate overflow-hidden border-t border-border-subtle"
      style={{
        // The field paints this itself; declared here so the ground is
        // already right for the frame before the canvas warms up.
        background: 'var(--t-field-bg)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <PixelBackdrop className="footer-rise" />

      <div className="footer-rise relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="flex w-full shrink-0 flex-col sm:w-max lg:w-96 lg:self-start">
            <Link
              to="/"
              aria-label={t('Omarchy home')}
              onClick={homeLink}
              data-quiet
              className={`group block ${focusRing}`}
            >
              <OmarchyWordmark className="h-6 w-auto text-brand transition-colors duration-150 ease-out group-hover:text-(--t-field-hover)" />
            </Link>
            <p
              data-quiet
              className="mt-4 text-sm leading-relaxed text-text-muted [text-wrap:pretty]"
            >
              <span className="block">
                {language === 'zh-CN' ? (
                  <>
                    {t('Beautiful, fun & agentic Linux')}
                    <a href="https://dhh.dk" className={`block ${footerLink}`}>
                      {t('By DHH')}
                    </a>
                  </>
                ) : (
                  <>
                    {t('Beautiful, fun & agentic Linux')}{' '}
                    <span className="whitespace-nowrap">
                      {t('by')}{' '}
                      <a href="https://dhh.dk" className={footerLink}>
                        DHH
                      </a>
                    </span>
                  </>
                )}
              </span>
              <span className="block">
                {t('The malleable OS for the age of agents.')}
              </span>
            </p>

            <div className="mt-4 flex flex-col text-sm leading-relaxed text-text-muted [text-wrap:pretty]">
              <p data-quiet>
                {t('Incubated at')}{' '}
                {/* Keep the link inline to preserve the paragraph baseline. */}
                <a href="https://37signals.com" className={footerLink}>
                  <ThirtySevenSignalsMark className="mr-[3px] inline-block size-4 shrink-0 align-[-0.28em]" />
                  37signals
                </a>
              </p>
              <p data-quiet>
                {t('Hosting by')}{' '}
                <a href="https://cloudflare.com" className={footerLink}>
                  <CloudflareMark className="mr-[5px] inline-block h-3 w-auto shrink-0 align-[-0.15em]" />
                  Cloudflare
                </a>
              </p>
              <p data-quiet>
                {t('Compute by')}{' '}
                <a href="https://www.digitalocean.com" className={footerLink}>
                  <DigitalOceanMark className="mr-[5px] inline-block size-4 shrink-0 align-[-0.2em]" />
                  DigitalOcean
                </a>
              </p>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 xl:gap-x-10">
            {columns.map((col) => (
              <nav key={col.title} data-quiet aria-label={col.title}>
                <h2 className="font-sans text-xs tracking-widest text-text-muted uppercase">
                  {col.title}
                </h2>
                <ul className="mt-3.5 flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {'splat' in link ? (
                        <Link
                          to="/$/"
                          params={{ _splat: link.splat }}
                          className={`text-sm ${footerLink}`}
                        >
                          {link.label}
                        </Link>
                      ) : 'to' in link ? (
                        <Link to={link.to} className={`text-sm ${footerLink}`}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className={`text-sm ${footerLink}`}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <nav
          aria-label={t('Language')}
          className="mt-12 flex flex-wrap gap-x-4 gap-y-2 text-sm"
        >
          {sortedLocales
            .filter(([code]) => hasTranslation(code, currentPath))
            .map(([code, entry]) => (
              <a
                key={code}
                href={`${entry.domain}${currentPath}`}
                hrefLang={code}
                lang={code}
                aria-current={language === code ? 'page' : undefined}
                className={footerLink}
              >
                {entry.name}
              </a>
            ))}
        </nav>
        <div className="mt-12 flex flex-col gap-2 border-t border-border-subtle pt-6 text-[13px] text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p data-quiet>
            <Link to="/$/" params={{ _splat: 'brand' }} className={footerLink}>
              Omarchy™
            </Link>
            {t('. All rights reserved.')}
          </p>
          <p data-quiet>
            {t('Partner inquiries:')}{' '}
            <a href="mailto:foundation@omarchy.org" className={footerLink}>
              foundation@omarchy.org
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
