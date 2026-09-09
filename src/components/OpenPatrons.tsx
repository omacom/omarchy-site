import { locale, t } from '@/i18n/site'
import patronage from '@/data/open-patrons.json'
import { PATRONAGE_URL, PATRON_CLASSES } from '@/lib/patronage'
import { PatronageTotal, patronageAmount } from '@/components/PatronInvitation'
import { ArrowUpRightIcon } from '@/components/icons'
import { buttonVariants } from '@/components/ui/button'

const stages = {
  'Night Stage': t('Night Stage'),
  'Service Park': t('Service Park'),
  'Mountain Hairpin': t('Mountain Hairpin'),
  'Forest Stage': t('Forest Stage'),
}

export function OpenPatrons() {
  return (
    <section
      id="everyone"
      className="open-patrons"
      aria-labelledby="open-patrons-heading"
    >
      <header className="open-patrons__header">
        <div>
          <h2 id="open-patrons-heading">
            {t('Every patron moves us forward.')}
          </h2>
          <PatronageTotal summary={patronage.summary} />
          <p>
            {t(
              'Four classes, one mission. Each class reflects total contributions under the same displayed name.',
            )}
          </p>
        </div>
        <a href={PATRONAGE_URL} className={buttonVariants({ size: 'lg' })}>
          {t('Become a patron')} <ArrowUpRightIcon aria-hidden="true" />
        </a>
      </header>
      {patronage.tiers.map((group) => {
        const tier = PATRON_CLASSES.find((tier) => tier.id === group.id)
        if (!tier && !group.names.length && !group.anonymousDonations)
          return null
        const name = tier
          ? t('Class {class}').replace('{class}', tier.badge)
          : t('Other patrons')
        return (
          <section
            id={`class-${group.id}`}
            key={group.id}
            className="patron-class"
            aria-labelledby={`class-${group.id}-heading`}
          >
            <div className="patron-class__identity">
              {tier && (
                <a
                  href={`/patrons/badges/#${tier.id}`}
                  aria-label={t('Get the Class {class} badge').replace(
                    '{class}',
                    tier.badge,
                  )}
                >
                  <img
                    src={`/assets/images/badges/${tier.badge}/preview.webp`}
                    alt=""
                    width={640}
                    height={640}
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              )}
              <div>
                <h3 id={`class-${group.id}-heading`}>{name}</h3>
                {tier && (
                  <p className="patron-class__stage">{stages[tier.stage]}</p>
                )}
                <p className="patron-class__amount">
                  {tier
                    ? `${patronageAmount(tier.minimum)}+`
                    : t('Every contribution counts.')}
                </p>
                {tier && (
                  <a href={PATRONAGE_URL} className="patronage-link">
                    {t('Join this class')}{' '}
                    <ArrowUpRightIcon aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
            <div className="patron-class__roll">
              <p className="patron-class__count">
                {group.names.length === 1
                  ? t('1 named patron')
                  : t('{count} named patrons').replace(
                      '{count}',
                      group.names.length.toLocaleString(locale.formatLocale),
                    )}
              </p>
              {group.names.length > 0 ? (
                <ul aria-label={name}>
                  {group.names.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : (
                <p className="patron-class__empty">
                  {t('Your name could be here.')}
                </p>
              )}
              {group.anonymousDonations > 0 && (
                <p className="patron-class__anonymous">
                  {group.anonymousDonations === 1
                    ? t('With thanks for one anonymous contribution.')
                    : t(
                        'With thanks for {count} anonymous contributions.',
                      ).replace(
                        '{count}',
                        group.anonymousDonations.toLocaleString(
                          locale.formatLocale,
                        ),
                      )}
                </p>
              )}
            </div>
          </section>
        )
      })}
      <p className="open-patrons__updated">
        {t('Updated {date}.').replace(
          '{date}',
          new Date(`${patronage.checked}T00:00:00Z`).toLocaleDateString(
            locale.formatLocale,
            { dateStyle: 'long', timeZone: 'UTC' },
          ),
        )}{' '}
        {t('Anonymous contributions are included in the total.')}
      </p>
      <div className="open-patrons__footer">
        <p>{t('Ready to join the team?')}</p>
        <a href={PATRONAGE_URL} className={buttonVariants({ size: 'lg' })}>
          {t('Become a patron')} <ArrowUpRightIcon aria-hidden="true" />
        </a>
        <a href="/patrons/badges/" className="patronage-link">
          {t('Explore the badges')}
        </a>
      </div>
    </section>
  )
}
