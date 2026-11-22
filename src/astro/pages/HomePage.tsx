import { t, language, locale } from '@/i18n/site'
import { Link } from '@tanstack/react-router'
import {
  useEffect,
  useLayoutEffect,
  useState,
  type ComponentProps,
} from 'react'
import {
  AppleIcon,
  ArrowRightIcon,
  XIcon,
  ArrowUpRightIcon,
  BankIcon,
  CalendarFilledIcon,
  DiscordIcon,
  DownloadIcon,
  GithubIcon,
  UsbIcon,
  PlayIcon,
  WindowsIcon,
} from '@/components/icons'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
import {
  OmarchyMark,
  OmarchyWordmark,
  WORDMARK_BANDS,
} from '@/components/Brand'
import { HeroNavGhost } from '@/components/SiteHeader'
import { HeroShader } from '@/components/HeroShader'
import { EtchPicker } from '@/components/EtchPicker'
import { CardRail } from '@/components/CardRail'
import { Figures } from '@/components/Figures'
import { AgentShowcase } from '@/components/AgentShowcase'
import { WindowsShowcase } from '@/components/WindowsShowcase'
import { GamingShowcase } from '@/components/GamingShowcase'
import { DeveloperShowcase } from '@/components/DeveloperShowcase'
import { TypewriterTail } from '@/components/TypewriterTail'
import { PluginCard } from '@/components/PluginCard'
import {
  SectionActions,
  SectionAnchor,
  SectionHeading,
} from '@/components/SectionHeading'
import { TeamClusters } from '@/components/TeamClusters'
import { PatronHighlights } from '@/components/PatronHighlights'
import { MeetupShowcase } from '@/components/MeetupShowcase'
import { ThemeShowcase } from '@/components/ThemeShowcase'
import { VideoCarousel } from '@/components/VideoCarousel'
import { Voices } from '@/components/Voices'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useHashLink } from '@/lib/hash-scroll'
import { cn } from '@/lib/utils'
import { isoArch, isoLinks, type ArchHints, type IsoArch } from '@/lib/iso-arch'
import bannerData from '@/data/banner.json'
import type { CatalogueEntry } from '@/lib/plugin-filter'
import type { NewsSummary } from '@/lib/news'

export interface HomeData {
  top: Array<CatalogueEntry>
  total: number
  news: Array<NewsSummary>
}
import releaseData from '@/data/version.json'

/** The release and its ISOs by architecture. The refresh lists an
 *  architecture once its ISO is served, and its button appears with it. */
type Download = { url: string; sha256?: string | null }
const release: {
  version: string
  isos: Record<string, Download>
  mac?: Download & { version: string }
} = releaseData
const ISOS = isoLinks(release.isos, import.meta.env?.PUBLIC_ISO_ORIGIN)
const ISO_LABEL: Record<string, string> = { x86_64: 'x86', aarch64: 'ARM' }

/** The brand mark padded to the 15px glyph of WindowsIcon. */
function TryLinuxMark(props: ComponentProps<typeof OmarchyMark>) {
  return <OmarchyMark viewBox="-200 -200 1600 1600" {...props} />
}

type TryOption = {
  key: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  platform: string
  lead: string
  action: { label: string; href: string; icon: typeof DownloadIcon }
  links: ReadonlyArray<{ label: string; href: string }>
}

/** Ways to try Omarchy without installing it: the Try Omarchy apps from
 *  tryomarchy.com, and a desktop streamed to a browser tab from
 *  tryomarchy.dev. */
const TRY: ReadonlyArray<TryOption> = [
  {
    key: 'mac',
    icon: AppleIcon,
    title: t('Mac'),
    platform: t('Apple Silicon · macOS 15+'),
    lead: t(
      'A native app with accelerated graphics and a shared clipboard. Needs about 15 GB free.',
    ),
    action: {
      label: t('Try on Mac'),
      // GitHub answers this with Content-Disposition: attachment, so the click
      // saves the DMG. The asset name has been TryOmarchy.dmg since v0.2.0.
      href: 'https://github.com/omacom/try-omarchy/releases/latest/download/TryOmarchy.dmg',
      icon: DownloadIcon,
    },
    links: [
      {
        label: t('Quick start'),
        href: 'https://tryomarchy.com/#mac-quick-start',
      },
      { label: t('Source'), href: 'https://github.com/omacom/try-omarchy' },
    ],
  },
  {
    key: 'windows',
    icon: WindowsIcon,
    title: t('Windows'),
    platform: t('Windows 10 & 11 · x86_64'),
    lead: t(
      'Guided setup with GPU acceleration. Needs hardware virtualization and about 2 GB.',
    ),
    action: {
      label: t('Try on Windows'),
      href: 'https://github.com/omacom/try-omarchy-windows/releases/latest/download/TryOmarchy.exe',
      icon: DownloadIcon,
    },
    links: [
      {
        label: t('Quick start'),
        href: 'https://tryomarchy.com/#windows-quick-start',
      },
      {
        label: t('Source'),
        href: 'https://github.com/omacom/try-omarchy-windows',
      },
    ],
  },
  {
    key: 'linux',
    icon: TryLinuxMark,
    title: t('Linux'),
    platform: t('x86_64 · KVM · Flatpak'),
    lead: t(
      'Omarchy in a Flatpak app for your Linux desktop, with guided setup.',
    ),
    action: {
      label: t('Try on Linux'),
      // The Flatpak installer, the link the Try Omarchy for Linux README uses.
      href: 'https://tryomarchy.com/linux.flatpakref',
      icon: DownloadIcon,
    },
    links: [
      {
        label: t('Quick start'),
        href: 'https://tryomarchy.com/#linux-quick-start',
      },
      {
        label: t('Source'),
        href: 'https://github.com/btsouth/try-omarchy-linux',
      },
    ],
  },
  {
    key: 'web',
    icon: GlobeIcon,
    title: t('Web'),
    platform: t('Any desktop browser'),
    lead: t(
      'A fresh Omarchy streamed to your tab. Nothing to install, gone when you close it.',
    ),
    action: {
      label: t('Try on Web'),
      href: 'https://tryomarchy.dev/',
      icon: PlayIcon,
    },
    links: [],
  },
]

/** One way into Omarchy, as a compact card: what it is, a single button,
 *  and a row of small links beneath. Cards sit in an OptionGrid, whose
 *  subgrid lines their headers, leads, buttons, and links up across a row
 *  however long each one's copy runs. */
function OptionCard({
  icon: Icon,
  title,
  platform,
  lead,
  action,
  footer,
  heading: Heading = 'h4',
}: {
  heading?: 'h4' | 'h5'
  icon: React.ComponentType<{ className?: string }>
  title: string
  platform: string
  lead: string
  action: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <article className="row-span-4 grid min-w-0 grid-rows-subgrid gap-y-0 border border-border-subtle bg-bg p-5">
      <div className="flex items-center gap-2.5">
        <Icon className="size-5 shrink-0 text-brand" />
        <Heading className="text-base font-semibold text-text">{title}</Heading>
        <p className="ml-auto truncate text-xs text-text-muted">{platform}</p>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-text-secondary [text-wrap:pretty]">
        {lead}
      </p>
      <div className="mt-4">{action}</div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-text-muted">
        {footer}
      </div>
    </article>
  )
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 grid gap-4 lg:mt-8 lg:grid-cols-3">{children}</div>
  )
}

/** Omarchy without installing it: an app on the Mac or Windows PC you
 *  already have, or a desktop streamed to a browser tab. Sits under the
 *  install cards, in the same section. */
function TryOmarchy() {
  return (
    <div id="try" className="mt-12 scroll-mt-24 lg:mt-16">
      <h4 className="text-lg font-semibold tracking-tight text-text">
        {t('Try it first')}
      </h4>
      <p className="mt-1 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
        {t(
          'Get a taste of Omarchy without leaving the computer you already use.',
        )}
      </p>
      <OptionGrid>
        {TRY.map((app) => (
          <OptionCard
            key={app.key}
            heading="h5"
            icon={app.icon}
            title={app.title}
            platform={app.platform}
            lead={app.lead}
            action={
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href={app.action.href} />}
                className="w-full"
              >
                <app.action.icon
                  data-icon="inline-start"
                  className={
                    app.action.icon === PlayIcon ? 'size-4' : undefined
                  }
                />
                {app.action.label}
              </Button>
            }
            footer={app.links.map((link) => (
              <a key={link.href} className={smallLink} href={link.href}>
                {link.label}
              </a>
            ))}
          />
        ))}
      </OptionGrid>
    </div>
  )
}

/** The release's ISOs with the visitor's own architecture first, read after
 *  mount; x86_64 first until then. */
function useIsos() {
  const [arch, setArch] = useState<IsoArch>('x86_64')
  useEffect(() => {
    if (ISOS.length < 2) return
    const ua = navigator.userAgent
    const hints = (
      navigator as Navigator & {
        userAgentData?: {
          getHighEntropyValues(keys: Array<string>): Promise<ArchHints>
        }
      }
    ).userAgentData
    setArch(isoArch(ua))
    hints?.getHighEntropyValues(['architecture', 'bitness']).then(
      (values) => setArch(isoArch(ua, values)),
      () => {},
    )
  }, [])
  return [...ISOS].sort(([a], [b]) => Number(b === arch) - Number(a === arch))
}

const FIXES = [
  t('thing.'),
  t(' missing app.'),
  t(' incompatibility.'),
  t(' paper cut.'),
] as const

/**
 * Han and kana editions set no space between words and close a sentence with
 * their own full-width stop, so the joins the English copy makes with a space
 * and a period are made differently there. The registry's script says which
 * editions those are, so a Traditional Chinese or Japanese edition needs no
 * branch of its own.
 */
const ideographic = ['Hans', 'Hant', 'Jpan'].includes(locale.script)

const noteLink =
  'text-text-secondary underline decoration-border-strong underline-offset-4 transition-colors duration-150 ease-out hover:text-text hover:decoration-brand'

const sectionLink =
  'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 py-2 text-sm font-medium whitespace-nowrap text-text underline decoration-current underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_svg]:size-5 [&_svg]:shrink-0'

const smallLink =
  'cursor-pointer underline decoration-border-strong underline-offset-4 transition-colors duration-150 ease-out hover:text-text hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Under a download: copy its SHA-256, and fetch its signature when it has
 *  one. Each says what it does on hover, so the hash itself stays out of
 *  sight until someone wants it. */
function Verify({ sha256, sig }: { sha256?: string | null; sig?: string }) {
  const [copied, setCopied] = useState(false)
  if (!sha256 && !sig) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(sha256 ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (permissions, http): nothing to copy into.
    }
  }

  return (
    <span className="flex gap-4">
      {sha256 ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <button type="button" onClick={copy} className={smallLink} />
            }
          >
            {copied ? t('Copied') : 'SHA-256'}
          </TooltipTrigger>
          <TooltipContent>{t('Copy the SHA-256 checksum')}</TooltipContent>
        </Tooltip>
      ) : null}
      {sig ? (
        <Tooltip>
          <TooltipTrigger render={<a href={sig} className={smallLink} />}>
            {t('Signature')}
          </TooltipTrigger>
          <TooltipContent>{t('Download the GPG signature')}</TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  )
}

function ManualLink({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  return (
    <Link to="/manual/$slug/" params={{ slug }} className={noteLink}>
      {children}
    </Link>
  )
}

const videos = [
  {
    id: 'F7fe9pa8OeE',
    title: 'Omarchy Quattro by David Heinemeier Hansson',
    channel: 'DHH',
    thumb: '/assets/images/video/omarchy-quattro.webp',
  },
  {
    id: '9SDkU5VDQEQ',
    title: 'You need to switch to Linux RIGHT NOW!!',
    channel: 'NetworkChuck',
    thumb: '/assets/images/video/networkchuck.webp',
  },
  {
    id: '5JPYJfN7HY0',
    title: 'They finally fixed linux',
    channel: 'typecraft',
    thumb: '/assets/images/video/typecraft.webp',
  },
  {
    id: 'qBKMe8AatY0',
    title: "I Didn't Expect Omarchy 4 to Be This Good",
    channel: 'LinuxBTW',
    thumb: '/assets/images/video/linuxbtw.webp',
  },
  {
    id: 'KO2T0oET9go',
    title: 'If you use AI, switch to Omarchy immediately',
    channel: 'Alex Finn',
    thumb: '/assets/images/video/alex-finn.webp',
  },
  {
    id: '2IDjteRQgMQ',
    title: 'Omarchy Can Do WHAT?! 50 Features You’re Missing',
    channel: 'NetworkChuck',
    thumb: '/images/video/networkchuck-50-features.webp',
  },
  {
    id: 'NYFGCESmikA',
    title:
      'DHH: Future of Programming, AI, Agentic Engineering, Vibe Coding & Linux | Lex Fridman Podcast #501',
    channel: 'Lex Fridman',
    thumb: '/images/video/lex-fridman-dhh.webp',
    start: 2326,
  },
]

const communityCards = [
  {
    icon: DiscordIcon,
    title: 'Discord',
    body: t(
      'Daily chatter, support, and show-and-tell with thousands of Omarchs.',
    ),
    href: 'https://discord.gg/tXFUdasqhY',
    cta: t('Join the server'),
  },
  {
    icon: CalendarFilledIcon,
    title: t('Meetups'),
    body: t(
      'Omarchy meetups are popping up around the world. Find one near you, or start one.',
    ),
    to: '/meetups/',
    cta: t('Find a meetup'),
  },
  {
    icon: GithubIcon,
    title: t('Contribute'),
    body: t('File issues, fix bugs, and submit features.'),
    href: 'https://github.com/omacom/omarchy',
    cta: t('Contribute on GitHub'),
  },
  {
    icon: BankIcon,
    title: t('Donate'),
    body: t(
      'Help fund the people and projects making Omarchy better for everyone.',
    ),
    href: 'https://donate.omarchy.org',
    cta: t('Become a patron'),
  },
]

/** The site's callout, or null when banner.json carries none; the JSON's
 *  type only ever sees one of the two. */
const banner = bannerData as typeof bannerData | null

const NEWS_PATH = /^\/news\/(\d{4})\/(\d{2})\/([^/]+)\/?$/

function HeroCallout({ href, html }: { href: string; html: string }) {
  const className =
    'group inline-flex max-w-full items-center gap-2 border border-brand/40 bg-bg/60 px-3.5 py-1.5 text-left font-mono text-[13px] leading-snug text-brand transition-colors duration-150 ease-out hover:border-brand hover:bg-brand hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
  const inner = (
    <>
      <span
        className="min-w-0 [&_s]:text-current/60"
        dangerouslySetInnerHTML={{ __html: t(html) }}
      />
      <ArrowRightIcon className="size-4 shrink-0 transition-transform duration-150 ease-out group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
    </>
  )
  const news = NEWS_PATH.exec(href)
  if (news)
    return (
      <Link
        to="/news/$year/$month/$slug/"
        params={{ year: news[1], month: news[2], slug: news[3] }}
        className={className}
      >
        {inner}
      </Link>
    )
  return (
    <a href={href} className={className}>
      {inner}
    </a>
  )
}

export function HomePage({ data }: { data: HomeData }) {
  const { top, news } = data
  const isos = useIsos()
  const [intro, setIntro] = useState(false)
  const installLink = useHashLink('install')
  const watchLink = useHashLink('watch')
  const [painted, setPainted] = useState(false)
  const [etchAsked, setEtchAsked] = useState(false)
  useEffect(() => {
    setEtchAsked(new URLSearchParams(window.location.search).has('etch'))
  }, [])
  // The canvas cuts the word in as an entrance, so when it is going to, the
  // server-rendered word steps aside at once rather than showing whole and
  // then vanishing to be redrawn. Reduced motion keeps the plain handover.
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      setPainted(true)
  }, [])
  // The class from the head kept the word hidden until now. It can only go
  // once the word's own hidden class is in the DOM, before the next paint,
  // or the word shows for a frame in between.
  useLayoutEffect(() => {
    if (painted) document.documentElement.classList.remove('etch-pending')
  }, [painted])

  // Intro stagger plays once per session; returning within the session
  // renders the resting state immediately.
  useEffect(() => {
    if (!sessionStorage.getItem('omarchy-intro-seen')) {
      sessionStorage.setItem('omarchy-intro-seen', 'true')
      setIntro(true)
    }
  }, [])

  const allPlugins = (
    <a href="https://plugins.omarchy.org" className={sectionLink}>
      {t('All plugins')}
      <ArrowRightIcon className="rtl:-scale-x-100" />
    </a>
  )
  const extraThemes = (
    <Link to="/themes/" className={sectionLink}>
      {t('More community themes')}
      <ArrowRightIcon className="rtl:-scale-x-100" />
    </Link>
  )
  const allNews = (
    <Link to="/news/" className={sectionLink}>
      {t('All news')}
      <ArrowRightIcon className="rtl:-scale-x-100" />
    </Link>
  )
  const installGuide = (
    <Link
      to="/manual/$slug/"
      params={{ slug: 'getting-started' }}
      className={sectionLink}
    >
      {t('Full installation guide')}
      <ArrowRightIcon className="rtl:-scale-x-100" />
    </Link>
  )
  const moreOnX = (
    <a
      href="https://x.com/search?q=omarchy&f=live"
      target="_blank"
      rel="noopener noreferrer"
      className={sectionLink}
    >
      {t('More on')} <XIcon aria-label="X" />
      <ArrowUpRightIcon />
    </a>
  )
  const allTeams = (
    <Link to="/teams/" className={sectionLink}>
      {t('All teams')}
      <ArrowRightIcon className="rtl:-scale-x-100" />
    </Link>
  )
  const allPatrons = (
    <Link to="/$/" params={{ _splat: 'patrons' }} className={sectionLink}>
      {t('All patrons')}
      <ArrowRightIcon className="rtl:-scale-x-100" />
    </Link>
  )
  const allMeetups = (
    <Link to="/meetups/" className={sectionLink}>
      {t('All meetups')}
      <ArrowRightIcon className="rtl:-scale-x-100" />
    </Link>
  )

  return (
    <main className="home">
      <section
        id="home"
        data-hero-sentinel
        className={
          'pixel-container relative -mt-(--nav-h) flex min-h-svh flex-col overflow-hidden border-b border-border-subtle pt-(--nav-h) select-none [-webkit-touch-callout:none]' +
          (intro ? ' hero-intro' : '')
        }
        style={{ background: 'var(--t-field-bg)' }}
      >
        <HeroShader onPainted={() => setPainted(true)} />
        {etchAsked ? <EtchPicker /> : null}

        {/* The bar's labels, blended against the canvas. They have to live in
            here to reach it: the real header is sticky, and a sticky element
            isolates everything inside it from the page behind. */}
        <HeroNavGhost />

        <div className="pointer-events-none relative flex flex-1 flex-col items-center px-6">
          <div className="flex-1" />
          {banner ? (
            <div
              data-hero-quiet
              className="pointer-events-auto mb-12 flex w-full justify-center lg:mb-[calc(var(--pxr)*5)]"
            >
              <HeroCallout href={banner.href} html={banner.html} />
            </div>
          ) : null}
          {/* The slot the field measures its cell size from. Server-rendered
              as the SVG so the wordmark is there before any script runs, then
              handed over to the canvas once it has painted the same pixels. */}
          <OmarchyWordmark
            data-hero-wordmark
            className={
              'w-[88%] max-w-4xl text-[color:var(--t-field-lit)]' +
              (painted ? ' invisible' : '')
            }
            background={WORDMARK_BANDS}
          />
          <div
            data-hero-quiet
            className="pointer-events-auto mt-12 flex w-full max-w-2xl flex-col items-center text-center lg:mt-[calc(var(--pxr)*5)]"
          >
            <h1
              data-hero-stagger
              style={
                {
                  '--stagger': 0,
                  fontFamily: 'var(--font-mono)',
                } as React.CSSProperties
              }
              className="text-2xl font-medium tracking-tight text-text [text-wrap:balance] sm:text-3xl"
            >
              {ideographic ? (
                <>
                  <span className="block">
                    <SectionAnchor anchor="home">
                      <span className="sr-only">Omarchy: </span>
                      {t('Beautiful, fun & agentic Linux')}
                    </SectionAnchor>
                  </span>
                  <a
                    href="https://dhh.dk"
                    className="mt-2 block text-lg underline decoration-transparent underline-offset-[6px] transition-colors duration-150 ease-out hover:decoration-brand sm:text-xl"
                  >
                    {t('By DHH')}
                  </a>
                </>
              ) : (
                <>
                  <SectionAnchor anchor="home">
                    <span className="sr-only">Omarchy: </span>
                    {t('Beautiful, fun & agentic Linux')}
                  </SectionAnchor>{' '}
                  {t('by')}{' '}
                  <a
                    href="https://dhh.dk"
                    className="underline decoration-transparent underline-offset-[6px] transition-colors duration-150 ease-out hover:decoration-brand"
                  >
                    DHH
                  </a>
                </>
              )}
            </h1>
            <p
              data-hero-stagger
              style={{ '--stagger': 1 } as React.CSSProperties}
              className="mt-4 text-[15px] leading-relaxed text-text-secondary"
            >
              <span className="block [text-wrap:balance]">
                {t('The malleable OS for the age of agents.')}
              </span>
              <span className="block [text-wrap:balance]">
                {t(
                  'Vibe your way through every alteration, tweak, or trouble.',
                )}
              </span>
            </p>

            <div
              data-hero-stagger
              data-hero-cta
              style={{ '--stagger': 2 } as React.CSSProperties}
              className="mt-9 flex w-full max-w-xs flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row lg:gap-[calc(var(--pxc)*2)]"
            >
              {/* Both stay fully opaque, hover included: the default hover
                  drops the fill to 80% and the outline variant is a tinted
                  translucent panel, which lets the field show through the
                  one place on the site with a moving background. Both are
                  40px tall, the pill above the word 32px: two heights on
                  one 8px grid, and the pill stays a line, not a third
                  button. Width follows the label. The padding is set by
                  eye: 16px on the text side, 12px on the icon side, since
                  the glyphs leave white space inside their own box and the
                  eye adds it to the padding. The play triangle also moves a
                  pixel toward its point. */}
              <Button
                size="lg"
                className="h-10 pr-4 has-data-[icon=inline-start]:pl-3"
                nativeButton={false}
                onClick={installLink}
                render={<Link to="/" hash="install" />}
              >
                <DownloadIcon data-icon="inline-start" />
                {t('Get Omarchy')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-10 pr-4 has-data-[icon=inline-start]:pl-3"
                nativeButton={false}
                onClick={watchLink}
                render={<Link to="/" hash="watch" />}
              >
                <PlayIcon data-icon="inline-start" className="mr-0.5" />
                {t('See it in action')}
              </Button>
            </div>
          </div>
          <div className="flex-1" />
        </div>
      </section>

      <section id="about">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
            <div>
              <h2
                data-typed-block
                className="text-2xl font-semibold tracking-tight text-text [contain:layout] [text-wrap:balance] sm:text-[1.75rem]"
              >
                <SectionAnchor anchor="about">
                  <span className="sr-only">{t('We can fix everything.')}</span>
                  <span aria-hidden="true">
                    {t('We can fix every')}
                    <TypewriterTail phrases={FIXES} />
                  </span>
                </SectionAnchor>
              </h2>
              <p
                className={`mt-6 max-w-[35.5rem] text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty] ${ideographic ? 'whitespace-pre-line' : ''}`}
              >
                {t(
                  'Linux used to be a chore to setup, difficult to debug, and full of confusing upfront choices. Omarchy solves all of it with a lightning fast installation, agents that debug all issues, and fantastic defaults that give you a fully functioning system that looks amazing out of the box.',
                )}
              </p>
              <p
                className={`mt-5 max-w-[35.5rem] text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty] ${ideographic ? 'whitespace-pre-line' : ''}`}
              >
                {t(
                  "Oma is for omakase, chef's choice: we pick the tools and tune the details, so you can get straight to work. But this is your computer. You're free to change everything.",
                )}
              </p>
              <p className="mt-5 max-w-[35.5rem] text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                {t('Behind it all is the')}{' '}
                <Link
                  to="/doctrine/"
                  className="underline decoration-border-strong underline-offset-4 hover:decoration-current"
                >
                  {t('Omarchy Doctrine')}
                </Link>
                {t(
                  ": ten principles for uniting the nerds, welcoming the agents, and building the perfect computer. We're not there yet, but",
                )}
                {ideographic ? '' : ' '}
                <a
                  href="https://wecanfixeverything.com/"
                  className="underline decoration-border-strong underline-offset-4 hover:decoration-current"
                >
                  {t('we can fix everything now.')}
                </a>
                {ideographic && '。'}
              </p>
            </div>

            <div className="lg:justify-self-end lg:self-center lg:[&>figure]:-mt-[3px]">
              <DhhQuote />
            </div>
          </div>
        </div>

        <div
          id="watch"
          data-ground
          className="border-y border-border-subtle bg-bg-deep py-12 lg:py-24"
        >
          <VideoCarousel
            anchor="watch"
            level={3}
            title={t('See it in action')}
            description={t('Experience a transfer of enthusiasm.')}
            videos={videos}
          />
        </div>

        <div
          id="install"
          className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6"
        >
          <SectionHeading
            level={3}
            anchor="install"
            roomy
            title={t('Install Omarchy (or try it first)')}
            description={t(
              'Be up and running in as little as seven seconds on the fastest machines, and in less than two minutes on the majority of computers.',
            )}
            action={installGuide}
          />

          {/* Each way in as a card, the visitor's own architecture first,
              with the ways to try it first in the same cards beneath. */}
          <TooltipProvider delay={300}>
            <OptionGrid>
              {isos.map(([arch, iso]) => (
                <OptionCard
                  key={arch}
                  icon={UsbIcon}
                  title={arch === 'aarch64' ? t('ARM PCs') : t('x86 PCs')}
                  platform={`${arch} · ISO`}
                  lead={
                    arch === 'aarch64'
                      ? t(
                          'Preliminary support for NVIDIA DGX Spark and N1X. Write the ISO to a USB stick and answer five questions.',
                        )
                      : t(
                          'Write the ISO to a USB stick and answer five questions. Full-disk or dual-boot, it hands back a finished desktop.',
                        )
                  }
                  action={
                    <Button
                      nativeButton={false}
                      render={<a href={iso.url} />}
                      className="w-full"
                    >
                      <DownloadIcon data-icon="inline-start" />
                      Omarchy {release.version}{' '}
                      {ideographic
                        ? `（${ISO_LABEL[arch] ?? arch}）`
                        : `(${ISO_LABEL[arch] ?? arch})`}
                    </Button>
                  }
                  footer={
                    <Verify
                      sha256={release.isos[arch]?.sha256}
                      sig={`${iso.url}.sig`}
                    />
                  }
                />
              ))}
              {release.mac ? (
                <OptionCard
                  icon={AppleIcon}
                  title={t('Apple Silicon Macs')}
                  platform={t('M1, M2, M3, Neo')}
                  lead={t(
                    'The native Omarchy M installer puts Omarchy right next to macOS. No USB stick needed.',
                  )}
                  action={
                    <Button
                      nativeButton={false}
                      render={<a href={release.mac.url} />}
                      className="w-full"
                    >
                      <DownloadIcon data-icon="inline-start" />
                      {t('Omarchy M Installer')}
                    </Button>
                  }
                  footer={<Verify sha256={release.mac.sha256} />}
                />
              ) : null}
            </OptionGrid>
          </TooltipProvider>

          <p className="mt-6 text-[13px] leading-relaxed text-text-muted [text-wrap:pretty]">
            {t('The manual also covers')}{' '}
            <ManualLink slug="dual-boot-install">
              {t('dual booting beside Windows')}
            </ManualLink>{' '}
            {t('and')}{' '}
            <ManualLink slug="unattended-installs">
              {t('unattended installs')}
            </ManualLink>
            {ideographic ? t(' detailed guides.') : '.'}
          </p>
          <TryOmarchy />
          <SectionActions>{installGuide}</SectionActions>
        </div>
      </section>

      {/* plugins */}
      <section id="plugins" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="plugins"
            title={t('A plugin for every dream, every desire')}
            description={t(
              "Thousands of community plugins are available for Omarchy. Don't find what you need? Just put your agent on the job, then share when done.",
            )}
            action={allPlugins}
          />
          <CardRail className="mt-6 lg:mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </CardRail>
          <SectionActions>{allPlugins}</SectionActions>
        </div>
      </section>

      <section id="agents" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <AgentShowcase />
        </div>
      </section>

      <section id="themes" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="themes"
            title={t('Pick a theme, change everything')}
            description={
              <>
                {t(
                  'A theme restyles the whole system at once: terminal, bar, notifications, wallpaper. Pick one and this site wears it too.',
                )}
                {ideographic && (
                  <>
                    <span className="sm:hidden">。</span>
                    <span className="hidden sm:inline">；</span>
                  </>
                )}
                <span className="hidden sm:inline">
                  {' '}
                  {t('Or press')}{' '}
                  <kbd className="border border-border-strong px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">
                    T
                  </kbd>{' '}
                  {t('to flip through them.')}
                </span>
              </>
            }
            action={extraThemes}
          />
          <ThemeShowcase />
          <SectionActions>{extraThemes}</SectionActions>
        </div>
      </section>

      <section id="developers" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <DeveloperShowcase />
        </div>
      </section>

      <section id="gaming" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <GamingShowcase />
        </div>
      </section>

      <section id="windows" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <WindowsShowcase />
        </div>
      </section>

      <section id="news" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="news"
            title={t("What's been happening")}
            action={allNews}
          />
          <ul className="mt-6 lg:mt-8 grid border-t border-border-subtle sm:grid-cols-2 sm:gap-x-10">
            {news.slice(0, 6).map((post, i) => (
              <li
                key={post.slug}
                className={cn(
                  'border-b border-border-subtle',
                  i >= 3 && 'hidden sm:block',
                )}
              >
                <Link
                  to="/news/$year/$month/$slug/"
                  params={{
                    year: post.year,
                    month: post.month,
                    slug: post.slug,
                  }}
                  className="group flex h-full flex-col gap-1.5 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <time
                    dateTime={post.date}
                    className="font-mono text-xs text-text-muted"
                  >
                    {post.dateStr}
                  </time>
                  <span className="font-sans text-base font-medium text-text transition-colors duration-150 ease-out group-hover:text-brand">
                    {post.title}
                  </span>
                  <span className="line-clamp-2 text-[13px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                    {post.excerpt}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <SectionActions>{allNews}</SectionActions>
        </div>
      </section>

      <section id="figures" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="figures"
            title={t('Momentum by the numbers')}
            description={t(
              'Donations, downloads, and contributions. Momentum is based on all of it.',
            )}
          />
          <Figures />
        </div>
      </section>

      <section id="voices" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="voices"
            title={t('People love Omarchy')}
            description={t('What people posted on X after installing it.')}
            action={moreOnX}
          />
          {language !== 'en' && (
            <p className="mt-3 text-xs text-text-muted">
              {t('Posts are shown in their original language.')}
            </p>
          )}
          <Voices />
          <SectionActions>{moreOnX}</SectionActions>
        </div>
      </section>

      <section id="teams" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="teams"
            title={t('It takes a village to raise a distro')}
            description={t(
              'Omarchy Core sets the direction, the Security team keeps your system safe, Design shapes how it looks and feels, Omarchy M brings it to the Mac, and the Rangers help others find their way.',
            )}
            action={allTeams}
          />
          <TeamClusters />
          <SectionActions>{allTeams}</SectionActions>
        </div>
      </section>

      <section id="patrons" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="patrons"
            title={t('Backed by the oligarchy')}
            description={t(
              "The billionaires, mere millionaires, and corporations funding the lion's share of the development, maintenance, and spread of Omarchy.",
            )}
            action={allPatrons}
          />
          <PatronHighlights />
          <SectionActions>{allPatrons}</SectionActions>
        </div>
      </section>

      <section
        id="meetups"
        className="border-t border-border-subtle py-12 lg:py-24"
      >
        <MeetupShowcase action={allMeetups} />
      </section>

      {/* community */}
      <section id="community" className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-24 sm:px-6">
          <SectionHeading
            anchor="community"
            title={t('Get involved with Omarchy')}
            description={t(
              'Command your agent, and hang out with the people doing the same.',
            )}
          />
          <div className="mt-6 lg:mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {communityCards.map((card) => {
              const inner = (
                <>
                  <card.icon className="size-5 text-brand" />
                  <h3 className="mt-3.5 text-[15px] font-medium text-text">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary [text-wrap:pretty]">
                    {card.body}
                  </p>
                  <span className="mt-auto flex items-center gap-1 pt-4 text-[13px] font-medium text-brand">
                    {card.cta}
                    <ArrowRightIcon className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </>
              )
              const className =
                'ring-elevation ring-elevation-hover group flex flex-col bg-surface p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
              return 'href' in card ? (
                <a key={card.title} href={card.href} className={className}>
                  {inner}
                </a>
              ) : (
                <Link key={card.title} to={card.to} className={className}>
                  {inner}
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

const DHH_QUOTE_URL = 'https://youtu.be/NYFGCESmikA?t=7104'

function DhhQuote() {
  return (
    <figure className="group relative max-w-md border border-border-subtle bg-surface p-5 transition-colors duration-150 ease-out hover:border-border-strong lg:p-7 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <div
        aria-hidden="true"
        className="h-10 font-sans text-6xl leading-none font-bold text-brand"
      >
        &ldquo;
      </div>
      <blockquote
        cite={DHH_QUOTE_URL}
        className="font-sans text-xl leading-snug font-medium text-text [text-wrap:balance]"
      >
        {t(
          'When you can vibe code whatever app comes to your mind, you should be able to vibe code your operating system.',
        )}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3.5">
        <img
          src="/assets/images/team/dhh.webp"
          alt=""
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className="size-12 shrink-0 border border-border-subtle object-cover"
        />
        <span className="flex flex-col font-mono leading-snug">
          <span className="text-[15px] font-medium text-text">
            David Heinemeier Hansson
          </span>
          <span className="text-[13px] text-text-muted">
            {t('Creator of Omarchy')}
          </span>
        </span>
        <a
          href={DHH_QUOTE_URL}
          target="_blank"
          rel="noreferrer"
          aria-label={t('Watch him say it, on YouTube')}
          className="ml-auto text-text-muted transition-colors duration-150 ease-out group-hover:text-text focus-visible:outline-none before:absolute before:inset-0"
        >
          <PlayIcon className="size-5" />
        </a>
      </figcaption>
    </figure>
  )
}
