import { t, localizedHref } from '@/i18n/site'
import { SectionHeading } from '@/components/SectionHeading'
import { ArrowRightIcon } from '@/components/icons'

const highlights = [
  {
    title: t('Flexible workspaces & dock'),
    description: t(
      'Cycle any workspace between tiling, scrolling, and traditional floating windows with Super + L. Floating workspaces add themed titlebars and a dock, and every monitor keeps its own workspaces.',
    ),
    href: '/manual/navigation/',
    link: t('Master navigation'),
  },
  {
    title: t('Handcrafted native apps'),
    description: t(
      'Native, theme-synced apps built for everyday work: Folio for files, Hype for slides, Signed for PDFs, Omaview for media, Monologue and Omacut for video, and Gliff for remote desktop over SSH.',
    ),
    href: '/manual/guis/',
    link: t('Browse the apps'),
  },
  {
    title: t('An instant, malleable shell'),
    description: t(
      'Built on Quickshell: drag the bar to any edge, rearrange widgets on the fly, and summon keyboard-driven panels for audio, Wi-Fi and captive portals, Bluetooth, displays, and Tailscale.',
    ),
    href: '/manual/the-top-bar/',
    link: t('Explore the top bar'),
  },
  {
    title: t('Dictation, OCR, and sharing'),
    description: t(
      'Dictate anywhere with Superwhisper, Voxtype, or Hex using Alt + Space, extract text from any screen region with built-in OCR, and send files to phones or nearby machines over LocalSend.',
    ),
    href: '/manual/text-extraction-dictation/',
    link: t('See dictation and OCR'),
  },
  {
    title: t('Encrypted and snapshot-safe'),
    description: t(
      'Full-disk LUKS encryption and a locked-down firewall are on by default. Every update saves a bootable snapshot so you can roll back from the boot menu, with fingerprint and YubiKey support built in.',
    ),
    href: '/manual/security/',
    link: t('Read about security'),
  },
  {
    title: t('50 languages, 5 input methods'),
    description: t(
      'Switch the desktop, menus, and notifications across fifty languages without reinstalling, complete with built-in input methods and fonts for Chinese, Japanese, and Korean.',
    ),
    href: '/manual/getting-started/#language',
    link: t('See language setup'),
  },
]

export function DesktopShowcase() {
  return (
    <>
      <SectionHeading
        anchor="desktop"
        title={t('Tile, scroll, or float')}
        description={t(
          'Omarchy ships as a complete, cohesive desktop: flexible workspaces, handcrafted native apps, instant panels, and serious security from the first boot.',
        )}
      />
      <div className="mt-6 grid gap-6 md:grid-cols-3 lg:mt-10 lg:gap-8">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="flex min-w-0 flex-col border-t border-border-strong pt-4"
          >
            <h3 className="text-lg font-medium tracking-tight text-text">
              {item.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
              {item.description}
            </p>
            <a
              href={localizedHref(item.href)}
              className="mt-auto inline-flex min-h-10 items-center gap-2 self-start pt-4 text-sm font-medium text-text underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&:hover_span]:decoration-current"
            >
              <span className="underline decoration-current">{item.link}</span>
              <ArrowRightIcon
                className="size-5 shrink-0 rtl:-scale-x-100"
                aria-hidden="true"
              />
            </a>
          </div>
        ))}
      </div>
    </>
  )
}
