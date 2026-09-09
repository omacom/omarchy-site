import { locale, t } from '@/i18n/site'
import patrons from '@/data/patrons.json'
import { TeamClusters } from '@/components/TeamClusters'
import { PATRONAGE_URL } from '@/lib/patronage'
import type { PatronageSummary } from '@/lib/patronage'

const membersOf = (...ids: string[]) =>
  patrons
    .filter((group) => ids.includes(group.id))
    .flatMap((group) => group.members)

const groups = [
  {
    id: 'founding-patrons',
    name: t('Founding Patrons'),
    description: t('$1,000,000 from each'),
    members: membersOf('founding-patrons'),
  },
  {
    id: 'founding-corporate-patrons',
    name: t('Founding Corporate Patrons'),
    description: t('$1,000,000/year x 3 or $1,500,000 in tokens'),
    members: membersOf('founding-token-patrons'),
  },
  {
    id: 'distinguished-patrons',
    name: t('Distinguished Patrons'),
    description: t('$100,000 from each'),
    members: membersOf('distinguished-patrons'),
  },
  {
    id: 'distinguished-corporate-patrons',
    name: t('Distinguished Corporate Patrons'),
    description: t('$100,000/year x 3 or $150,000 in tokens'),
    members: membersOf('distinguished-corporate-patrons'),
  },
]

export function PatronHighlights({ summary }: { summary: PatronageSummary }) {
  const total = t('{count} patrons contributing {amount}.')
    .replace(
      '{count}',
      summary.namedPatrons.toLocaleString(locale.formatLocale),
    )
    .replace(
      '{amount}',
      new Intl.NumberFormat(locale.formatLocale, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(summary.totalAmount / 100),
    )
  const quietLink =
    'underline decoration-border-strong underline-offset-4 hover:text-text hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'

  return (
    <div>
      <TeamClusters
        groups={groups}
        maxFaces={12}
        className="sm:grid-cols-1 lg:grid-cols-2 lg:gap-y-2 lg:[&_.team-cluster>p]:h-8"
      />
      <p className="mt-4 font-mono text-xs text-text-muted">
        <a
          href="https://oligarchy.fyi"
          className="underline decoration-border-strong underline-offset-4 hover:text-text hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {t('Our shadowy agenda? Better Linux.')}
        </a>
      </p>
      <div className="mt-5 font-mono text-xs leading-relaxed text-text-muted">
        <p>{total}</p>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <a href="/patrons/#everyone" className={quietLink}>
            {t('Meet the patrons')}
          </a>
          <a href={PATRONAGE_URL} className={quietLink}>
            {t('Become a patron')}
          </a>
        </p>
      </div>
    </div>
  )
}
