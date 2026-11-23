import { t, localizedHref } from '@/i18n/site'
import { SectionActions, SectionHeading } from '@/components/SectionHeading'
import { ArrowRightIcon } from '@/components/icons'

const games = [
  {
    name: 'Steam',
    image: 'gaming-steam.webp',
    alt: t('Steam showing its game store on Omarchy'),
    section: 'steam',
    description: t(
      'Your PC library, right at home on Linux. Steam and Proton bring tens of thousands of modern games straight to Omarchy.',
    ),
  },
  {
    name: 'RetroArch',
    image: 'gaming-retroarch.webp',
    alt: t('A classic arcade game running with RetroArch’s CRT shader'),
    section: 'retroarch',
    description: t(
      'Revisit the classics with a full set of emulator cores and the CRT Royale shader, already configured for that authentic retro glow.',
    ),
  },
  {
    name: 'Minecraft',
    image: 'gaming-minecraft.webp',
    alt: t('Minecraft running on Omarchy'),
    section: 'minecraft',
    description: t(
      'Install Minecraft straight from the Omarchy gaming menu and jump right into building, exploring, or surviving.',
    ),
  },
]

const extraGaming: ReadonlyArray<readonly [string, string]> = [
  ['Game Vibes', '/manual/guis/#game-vibes'],
  ['Battle.net', '/manual/gaming/#battlenet'],
  ['Lutris', '/manual/gaming/#lutris-windows-games'],
  ['Heroic', '/manual/gaming/#heroic-launcher-epic-games'],
  ['Moonlight', '/manual/gaming/#moonlight-game-streaming-from-a-pc'],
  ['GeForce NOW', '/manual/gaming/#nvidia-geforce-now'],
  ['Xbox Cloud Gaming', '/manual/gaming/#xbox-cloud-gaming'],
]

export function GamingShowcase() {
  const action = (
    <a
      href={localizedHref('/manual/gaming/')}
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 py-2 text-sm font-medium whitespace-nowrap text-text underline decoration-current underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_svg]:size-5 [&_svg]:shrink-0"
    >
      {t('Get your game on')}
      <ArrowRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
    </a>
  )
  return (
    <>
      <SectionHeading
        action={action}
        anchor="gaming"
        title={t('All work and all play is all good')}
        description={t(
          'Omarchy comes ready for Steam, RetroArch, and everything from indie classics to cloud streaming. Graphics drivers, including NVIDIA on supported hardware, are sorted during installation.',
        )}
      />
      <div className="mt-6 grid gap-6 md:grid-cols-3 lg:mt-10 lg:gap-8">
        {games.map((game) => (
          <a
            key={game.name}
            href={localizedHref(`/manual/gaming/#${game.section}`)}
            className="group block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <img
              src={`/manual/images/${game.image}`}
              alt={game.alt}
              width={1600}
              height={1200}
              loading="lazy"
              decoding="async"
              className="aspect-4/3 w-full object-cover"
            />
            <h3 className="mt-4 text-lg font-medium tracking-tight text-text group-hover:text-brand">
              {game.name}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
              {game.description}
            </p>
          </a>
        ))}
      </div>
      <p className="mt-6 text-[15px] leading-relaxed text-text-secondary">
        {t('Also available:')}{' '}
        {extraGaming.map(([name, href], index) => (
          <span key={href}>
            {index > 0 &&
              (index === extraGaming.length - 1 ? t(', and ') : ', ')}
            <a
              href={localizedHref(href)}
              className="whitespace-nowrap underline decoration-border-strong underline-offset-4 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {name}
            </a>
          </span>
        ))}
        .
      </p>
      <SectionActions>{action}</SectionActions>
    </>
  )
}
