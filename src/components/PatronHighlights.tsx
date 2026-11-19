import { t } from '@/i18n/site'
import patrons from '@/data/patrons.json'
import { TeamClusters } from '@/components/TeamClusters'

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

export function PatronHighlights() {
  return (
    <div>
      <TeamClusters
        groups={groups}
        maxFaces={12}
        className="team-clusters-wrap sm:grid-cols-1 lg:grid-cols-2 lg:gap-y-2 lg:[&_.team-cluster>p]:h-8"
      />
      <p className="mt-4 font-mono text-xs text-text-muted">
        <a
          href="https://oligarchy.fyi"
          className="underline decoration-border-strong underline-offset-4 hover:text-text hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          {t('Our shadowy agenda? Better Linux.')}
        </a>
      </p>
    </div>
  )
}
