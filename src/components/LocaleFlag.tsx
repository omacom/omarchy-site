import { CatalanIcon } from '@/components/icons/CatalanIcon'
import { flag } from '@/i18n/site'
import type { Locale } from '@/i18n/site'

/** Render a locale's flag, including flags without an emoji equivalent. */
export function LocaleFlag({ locale, imageClassName }: { locale: Locale imageClassName?: string }) {
  if (locale.flag === 'ES-CT') {
    return <CatalanIcon className={imageClassName} />
  }

  return flag(locale.domain, locale.flag)
}
