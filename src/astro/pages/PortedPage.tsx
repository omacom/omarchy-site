import { t } from '@/i18n/site'
import { cn } from '@/lib/utils'
import { PageHeading } from '@/components/PageHeading'
import { PatronInvitation } from '@/components/PatronInvitation'
import { OpenPatrons } from '@/components/OpenPatrons'
import patronage from '@/data/open-patrons.json'

/**
 * Serves every standalone page ported from omarchy.org: /air, /foundation,
 * /meetups, /patrons, /security, /security/credits, /sponsorships,
 * /workstations, /potato, /server, /omakub, /brand. Unknown paths 404. The
 * teams page has a route of its own, built from teams.json.
 */
const NARROW = new Set([
  'patrons/badges',
  'server',
  'meetups',
  'air',
  'foundation',
  'sponsorships',
  'security',
  'security/credits',
  'brand',
  'omakub',
])

export interface PortedPageData {
  title: string
  html: string
}

export function PortedPage({
  page,
  slug,
}: {
  page: PortedPageData
  slug: string
}) {
  const path = (slug ?? '').replace(/\/+$/, '')
  const narrow = NARROW.has(path)

  return (
    <main
      className={cn(
        'mx-auto px-4 py-8 sm:px-6',
        narrow ? 'max-w-3xl' : 'max-w-6xl',
      )}
    >
      {path === 'brand' ? (
        <h1 className="sr-only">{page.title}</h1>
      ) : (
        <PageHeading
          title={path === 'patrons' ? t('Patrons') : page.title}
          brand={path === 'foundation' ? 'oma' : 'omarchy'}
        />
      )}
      {path === 'patrons' && (
        <PatronInvitation summary={patronage.summary} onPatronsPage />
      )}
      <div
        className="prose ported"
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
      {path === 'patrons' && <OpenPatrons />}
    </main>
  )
}
