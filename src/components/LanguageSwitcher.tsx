import { Popover } from '@base-ui/react/popover'
import { useState } from 'react'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { hasTranslation, language, locale, sortedLocales, t } from '@/i18n/site'

function flag(domain: string, countryCode?: string) {
  const country = countryCode ?? new URL(domain).hostname.split('.').at(-1)!
  return country.length === 2
    ? [...country.toUpperCase()]
        .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
        .join('')
    : '🌐'
}

export function LanguageSwitcher({
  path,
  triggerClassName,
}: {
  path: string
  triggerClassName?: string
}) {
  const [suffix, setSuffix] = useState('')

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (open) {
          setSuffix(window.location.search + window.location.hash)
        }
      }}
    >
      <Popover.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t('Language')}: ${locale.name}`}
            className={cn(
              'relative h-8 w-8 text-text-secondary transition-[background-color,transform] hover:text-text before:absolute before:-inset-1 lg:h-[calc(var(--pxr)*3)] lg:w-[calc(var(--pxr)*3)]',
              triggerClassName,
            )}
          />
        }
      >
        <GlobeIcon className="size-5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={10}
          className="z-[100]"
        >
          {/* The list scrolls inside the same ScrollArea the manual's chapter
              list uses, so the bar is the site's thin one rather than the
              browser's. The popup is a column of a set height, which the
              area needs to know how far it may scroll. The positioner's
              available height has a fallback so the height never resolves
              to nothing before the variable is set. */}
          <Popover.Popup className="flex h-[min(70svh,var(--available-height,70svh))] w-72 max-w-[calc(100vw-2rem)] flex-col border border-border-subtle bg-bg text-text shadow-xl">
            <Popover.Title className="shrink-0 px-4 py-2.5 text-sm text-text-muted">
              {t('Language')}
            </Popover.Title>
            {/* A gutter for the bar, so the rows end before it rather than
                running underneath it. */}
            <ScrollArea scrollbarGutter>
              <nav aria-label={t('Language')}>
                {sortedLocales.map(([code, entry]) => {
                  const destination = entry.domain
                  return (
                    <a
                      key={code}
                      href={`${destination}${hasTranslation(code, path) ? path + suffix : '/'}`}
                      hrefLang={code}
                      lang={code}
                      aria-current={code === language ? 'true' : undefined}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring aria-current:bg-surface-2"
                    >
                      <span aria-hidden="true" className="text-xl">
                        {flag(entry.domain, entry.flag)}
                      </span>
                      <span dir="auto">{entry.name}</span>
                    </a>
                  )
                })}
              </nav>
            </ScrollArea>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
