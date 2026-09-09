import { locale, t } from '@/i18n/site'
import { ArrowRightIcon, ArrowUpRightIcon } from '@/components/icons'
import { buttonVariants } from '@/components/ui/button'
import { PATRONAGE_URL, PATRON_CLASSES } from '@/lib/patronage'
import type { PatronageSummary } from '@/lib/patronage'

export function patronageAmount(cents: number) {
  return new Intl.NumberFormat(locale.formatLocale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

export function PatronageTotal({ summary }: { summary: PatronageSummary }) {
  const message = summary.anonymousDonations
    ? t('{count} named patrons and anonymous supporters contributing {amount}.')
    : t('{count} patrons contributing {amount}.')
  return (
    <p className="patronage-total">
      {message
        .replace(
          '{count}',
          summary.namedPatrons.toLocaleString(locale.formatLocale),
        )
        .replace('{amount}', patronageAmount(summary.totalAmount))}
    </p>
  )
}

export function PatronInvitation({
  summary,
  onPatronsPage = false,
}: {
  summary: PatronageSummary
  onPatronsPage?: boolean
}) {
  return (
    <div className="patron-invitation">
      <div className="patron-invitation__copy">
        <PatronageTotal summary={summary} />
        <h2>{t('You can be a patron, too.')}</h2>
        <p>
          {t(
            'Pick your class. Back the people building Omarchy. Find your name on the team.',
          )}
        </p>
        <div className="patron-invitation__actions">
          <a href={PATRONAGE_URL} className={buttonVariants({ size: 'lg' })}>
            {t('Become a patron')}
            <ArrowUpRightIcon aria-hidden="true" />
          </a>
          <a
            href={onPatronsPage ? '#everyone' : '/patrons/#everyone'}
            className="patronage-link"
          >
            {t('Meet the patrons')} <ArrowRightIcon aria-hidden="true" />
          </a>
        </div>
      </div>
      <ul
        className="patron-invitation__badges"
        aria-label={t('Patron classes')}
      >
        {[...PATRON_CLASSES].reverse().map((tier) => (
          <li key={tier.id}>
            <a href={`${onPatronsPage ? '' : '/patrons/'}#class-${tier.id}`}>
              <img
                src={`/assets/images/badges/${tier.badge}/preview.webp`}
                alt=""
                width={640}
                height={640}
                loading="lazy"
                decoding="async"
              />
              <span>{t('Class {class}').replace('{class}', tier.badge)}</span>
              <span>{patronageAmount(tier.minimum)}+</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
