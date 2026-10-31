import { t } from '@/i18n/site'
import { PageHeading } from '@/components/PageHeading'

export function NewsHeader({ article = false }: { article?: boolean }) {
  return <PageHeading title={t('News')} as={article ? 'p' : 'h1'} />
}
