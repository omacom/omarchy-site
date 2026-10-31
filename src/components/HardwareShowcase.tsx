import { t, localizedHref } from '@/i18n/site'
import { SectionHeading } from '@/components/SectionHeading'
import { AppleIcon, ArrowRightIcon, DisplayIcon } from '@/components/icons'

const examples = [
  {
    title: t('The latest laptops'),
    description: t(
      'Ready for something new? Laptops like the latest Dell XPS make amazing Omarchy machines, with our core team helping the newest hardware work properly.',
    ),
    icon: DisplayIcon,
    href: '/news/2026/09/the-omarchy-core-team/',
    link: t('Meet the team behind it'),
  },
  {
    title: t('Vintage Macs'),
    description: t(
      'Give that old Intel Mac a second life. Omarchy brings a fresh desktop to the hardware you already love.',
    ),
    icon: AppleIcon,
    href: '/manual/mac-support/',
    link: t('Mac support'),
  },
  {
    title: t('Potato PCs'),
    description: t(
      'Even a 2011 ThinkPad X220 with 2GB of RAM can run Omarchy, with room to spare. Your old PC might have plenty left to give.',
    ),
    icon: DisplayIcon,
    href: '/potato/',
    link: t('Watch the potato run'),
  },
]

export function HardwareShowcase() {
  return (
    <>
      <SectionHeading
        anchor="hardware"
        title={t('It runs on almost anything')}
        description={t(
          "You don't need a new machine to try Omarchy. But if you get one, today's laptops are amazing.",
        )}
      />
      <div className="mt-6 grid gap-6 md:grid-cols-3 lg:mt-10 lg:gap-8">
        {examples.map(({ title, description, icon: Icon, href, link }) => (
          <div
            key={title}
            className="flex min-w-0 flex-col border-t border-border-strong pt-4"
          >
            <div className="flex items-center gap-2.5">
              <Icon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <h3 className="text-lg font-medium tracking-tight text-text">
                {title}
              </h3>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
              {description}
            </p>
            <a
              href={localizedHref(href)}
              className="mt-auto inline-flex min-h-10 items-center gap-2 self-start pt-4 text-sm font-medium text-text underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&:hover_span]:decoration-current"
            >
              <span className="underline decoration-current">{link}</span>
              <ArrowRightIcon className="size-5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </div>
        ))}
      </div>
    </>
  )
}
