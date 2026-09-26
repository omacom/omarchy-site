import { useState } from 'react'
import { t } from '@/i18n/site'
import { scrollToAnchor } from '@/lib/anchor-scroll'
import { OmarchyWordmark, WORDMARK_BANDS } from '@/components/Brand'
import { HeroNavGhost } from '@/components/SiteHeader'
import { HeroShader } from '@/components/HeroShader'
import { SectionHeading } from '@/components/SectionHeading'
import {
  AppleIcon,
  WindowsIcon,
  DownloadIcon,
  ArrowUpRightIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const MAC = 'https://github.com/omacom/try-omarchy'
const WINDOWS = 'https://github.com/omacom/try-omarchy-windows'
const wrap = 'mx-auto max-w-6xl px-5 sm:px-8'
const section = 'border-t border-border-subtle py-14 sm:py-20'
const link =
  'inline-flex min-h-11 items-center gap-2 text-sm text-text-secondary underline underline-offset-4 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'

const platforms = [
  {
    id: 'mac',
    name: t('Try Omarchy for Mac'),
    icon: AppleIcon,
    requirements: t('Apple Silicon · macOS 15+'),
    description: t('Omarchy in a native Mac app, built for Apple Silicon.'),
    features: [
      t('Hardware-accelerated graphics'),
      t('Shared clipboard and an optional shared Mac folder'),
      t('Open the DMG and drag the app to Applications'),
    ],
    note: t(
      'Allow at least 8 GB of free disk space to get started. Intel Macs are not supported.',
    ),
    download: `${MAC}/releases/latest/download/TryOmarchy.dmg`,
    label: t('Download for Mac'),
    source: MAC,
    guide: `${MAC}#quick-start`,
    guideLabel: t('Mac quick start'),
    quickStart: [
      t('Download TryOmarchy.dmg and open it.'),
      t('Drag Try Omarchy to Applications, then open it.'),
      t(
        'Start Omarchy and follow the account setup. The first launch takes longer while it prepares Linux.',
      ),
    ],
  },
  {
    id: 'windows',
    name: t('Try Omarchy for Windows'),
    icon: WindowsIcon,
    requirements: t('Windows 10 & 11 · x86_64'),
    description: t(
      'Omarchy in a Windows app, with guided setup and GPU acceleration.',
    ),
    features: [
      t('GPU acceleration with a CPU fallback'),
      t('Clipboard, file transfers, and shared folders'),
      t('Setup may enable virtualization and require a restart'),
    ],
    note: t(
      'Hardware virtualization is required. Setup downloads several GB. Windows on ARM is not supported.',
    ),
    download: `${WINDOWS}/releases/latest/download/TryOmarchy.exe`,
    label: t('Download for Windows'),
    source: WINDOWS,
    guide: `${WINDOWS}#try-it`,
    guideLabel: t('Windows quick start'),
    quickStart: [
      t('Download TryOmarchy.exe and open it.'),
      t(
        'Choose where to store Omarchy. If prompted, allow Windows Hypervisor Platform, restart, and reopen the app.',
      ),
      t(
        'Let setup download Linux, then choose an instant trial account or create your own.',
      ),
    ],
  },
]

const benefits = [
  [
    t('Keep your current setup.'),
    t(
      'Omarchy runs in an app on your Mac or PC. Your existing operating system stays in place.',
    ),
  ],
  [
    t('The whole Linux desktop.'),
    t('Tile your windows. Find your theme. Install Linux apps. Make it yours.'),
  ],
  [
    t('Move between desktops.'),
    t(
      'Copy text and images between desktops. Share a folder with your Mac or Windows PC.',
    ),
  ],
]
const questions = [
  [
    t('Does this replace macOS or Windows?'),
    t(
      'No. Omarchy runs in a virtual machine inside an app. There is no repartitioning or dual boot. Windows setup may enable its virtualization feature and ask for a restart.',
    ),
  ],
  [
    t('Is this the full Omarchy desktop?'),
    t(
      'Yes. You get the Omarchy desktop, themes, and Linux apps. Hardware support and host integration differ between Mac and Windows. Performance depends on your computer; video decoding on Mac is currently CPU-only.',
    ),
  ],
  [
    t('Will my Linux files stay between sessions?'),
    t(
      'Yes, when using a persistent VM. Windows keeps the Linux disk in the folder you chose during setup. Mac saves changes by default; disposable mode discards them when you close the app.',
    ),
  ],
]

function scrollToDownload(event: React.MouseEvent, id: string) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  // Keep repeated clicks on this page, without invoking the homepage hash helper.
  window.history.replaceState(window.history.state, '', `#${id}`)
  scrollToAnchor(target, true)
}

export function TryPage() {
  const [painted, setPainted] = useState(false)
  return (
    <main>
      <section
        data-hero-sentinel
        className="pixel-container relative -mt-(--nav-h) flex min-h-svh flex-col overflow-hidden border-b border-border-subtle pt-(--nav-h)"
        style={{ background: 'var(--t-field-bg)' }}
      >
        <HeroShader onPainted={() => setPainted(true)} />
        <HeroNavGhost />
        <div
          className={`${wrap} pointer-events-none relative flex w-full flex-1 flex-col items-center justify-center py-12 text-center sm:py-16`}
        >
          <p
            data-hero-quiet
            className="mb-7 font-mono text-xs tracking-widest text-text-secondary"
          >
            {t('TRY OMARCHY')}
          </p>
          <OmarchyWordmark
            data-hero-wordmark
            className={`w-full max-w-4xl${painted ? ' invisible' : ''}`}
            background={WORDMARK_BANDS}
          />
          <div data-hero-quiet className="pointer-events-auto mt-8 max-w-3xl">
            <h1
              style={{ fontFamily: 'var(--font-mono)' }}
              className="text-2xl leading-snug font-medium tracking-tight text-text sm:text-3xl"
            >
              {t('A taste of Omarchy.')}
              <br />
              {t('On your Mac or Windows PC.')}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
              {t(
                'The Omarchy desktop, running in a virtual machine. No repartitioning. No dual boot.',
              )}
            </p>
            <div
              data-hero-cta
              className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"
            >
              {platforms.map(({ id, icon: Icon, label }) => (
                <Button
                  key={id}
                  nativeButton={false}
                  render={
                    <a
                      href={`#${id}`}
                      onClick={(event) => scrollToDownload(event, id)}
                    />
                  }
                  size="lg"
                  variant="outline"
                >
                  <Icon />
                  {label}
                  <DownloadIcon />
                </Button>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-text-secondary">
              {t('Free & open source')} · {t('Apple Silicon')} ·{' '}
              {t('Windows 10 & 11')}
            </p>
          </div>
        </div>
      </section>
      <section
        className={`${wrap} py-10 sm:py-14`}
        aria-label={t('Product preview')}
      >
        <Tabs defaultValue="mac" className="flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-text-secondary">
              {t('See it in action')}
            </h2>
            <TabsList aria-label={t('Preview platform')} className="h-11!">
              <TabsTrigger value="mac" className="px-4">
                <AppleIcon />
                {t('Mac')}
              </TabsTrigger>
              <TabsTrigger value="windows" className="px-4">
                <WindowsIcon />
                {t('Windows')}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="mac">
            <figure>
              <img
                src="/images/try/mac.webp"
                width="1280"
                height="803"
                className="aspect-[1280/803] w-full border border-border-subtle bg-bg-deep object-contain"
                alt={t(
                  'Try Omarchy running in a macOS window, showing the Quattro wallpaper.',
                )}
              />
              <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 text-xs text-text-secondary">
                <span>
                  {t('Omarchy on macOS. Your Mac is still your Mac.')}
                </span>
                <a className={link} href={MAC}>
                  {t('Mac on GitHub')}
                  <ArrowUpRightIcon className="size-4" />
                </a>
              </figcaption>
            </figure>
          </TabsContent>
          <TabsContent value="windows">
            <figure>
              <video
                controls
                playsInline
                preload="none"
                poster="/images/try/windows.webp"
                width="1366"
                height="720"
                className="aspect-[1280/803] w-full border border-border-subtle bg-bg-deep object-contain"
                aria-label={t('Try Omarchy on Windows demonstration')}
              >
                <source src="/images/try/windows.mp4" type="video/mp4" />
                <a href="/images/try/windows.mp4">
                  {t('Download the Windows demo')}
                </a>
              </video>
              <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 text-xs text-text-secondary">
                <span>
                  {t('Omarchy on Windows. Your Windows setup stays in place.')}
                </span>
                <a className={link} href={WINDOWS}>
                  {t('Windows on GitHub')}
                  <ArrowUpRightIcon className="size-4" />
                </a>
              </figcaption>
            </figure>
          </TabsContent>
        </Tabs>
      </section>
      <section className={section}>
        <div className={wrap}>
          <SectionHeading
            title={t('The full desktop. In a window.')}
            description={t(
              'Get to know Omarchy without leaving your current operating system.',
            )}
          />
          <div className="mt-9 grid gap-8 md:grid-cols-3">
            {benefits.map(([title, body]) => (
              <article
                key={title}
                className="border-t border-border-subtle pt-5"
              >
                <h3 className="text-base font-semibold text-text">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className={`${section} bg-surface`} id="download">
        <div className={wrap}>
          <SectionHeading
            title={t('Try Omarchy on your computer')}
            description={t('Download the app for your Mac or Windows PC.')}
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {platforms.map(
              ({
                id,
                name,
                icon: Icon,
                requirements,
                description,
                features,
                note,
                download,
                label,
                source,
                guideLabel,
              }) => (
                <article
                  key={id}
                  id={id}
                  className="flex min-w-0 scroll-mt-24 flex-col border border-border-subtle bg-bg p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-7 shrink-0 text-brand" />
                    <div>
                      <h3 className="text-lg font-semibold text-text">
                        {name}
                      </h3>
                      <p className="mt-1 text-xs text-text-secondary">
                        {requirements}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-text-secondary">
                    {description}
                  </p>
                  <ul className="my-6 divide-y divide-border-subtle text-sm text-text-secondary">
                    {features.map((feature) => (
                      <li key={feature} className="flex gap-3 py-3">
                        <span aria-hidden="true" className="text-brand">
                          +
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <p className="mb-6 text-xs leading-relaxed text-text-secondary">
                    {note}
                  </p>
                  <Button
                    nativeButton={false}
                    render={<a href={download} />}
                    className="mt-auto w-full"
                    size="lg"
                  >
                    <DownloadIcon />
                    {label}
                  </Button>
                  <a
                    className={`${link} mt-3 justify-center text-center`}
                    href={`#${id}-quick-start`}
                  >
                    {guideLabel}
                    <ArrowUpRightIcon className="size-4 shrink-0" />
                  </a>
                  <div className="mt-1 flex justify-center gap-5">
                    <a className={link} href={`${source}/releases`}>
                      {t('Release notes')}
                    </a>
                    <a className={link} href={source}>
                      {t('Source code')}
                    </a>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      </section>
      <section className={section}>
        <div className={wrap}>
          <SectionHeading
            title={t('Up and running.')}
            description={t('Three steps to your Linux desktop.')}
          />
          <div className="mt-9 grid gap-10 md:grid-cols-2">
            {platforms.map(
              ({ id, icon: Icon, guideLabel, quickStart, guide }) => (
                <article
                  key={id}
                  id={`${id}-quick-start`}
                  className="min-w-0 scroll-mt-24"
                >
                  <h3 className="flex items-center gap-3 border-b border-border-subtle pb-4 text-lg font-semibold text-text">
                    <Icon className="size-5 text-brand" />
                    {guideLabel}
                  </h3>
                  <ol className="mt-5 space-y-5">
                    {quickStart.map((step, index) => (
                      <li
                        key={step}
                        className="flex gap-4 text-sm leading-relaxed text-text-secondary"
                      >
                        <span
                          aria-hidden="true"
                          className="font-mono text-brand"
                        >
                          0{index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <a className={`${link} mt-4`} href={guide}>
                    {t('Full setup instructions')}
                    <ArrowUpRightIcon className="size-4" />
                  </a>
                </article>
              ),
            )}
          </div>
        </div>
      </section>
      <section className={`${section} bg-surface`}>
        <div className={`${wrap} grid gap-8 md:grid-cols-[1fr_2fr]`}>
          <SectionHeading title={t('Before you jump in.')} />
          <div>
            {questions.map(([question, answer], index) => (
              <details
                key={question}
                open={index === 0}
                className="border-b border-border-subtle py-5 first:pt-0"
              >
                <summary className="cursor-pointer text-sm font-medium text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                  {question}
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                  {answer}
                </p>
              </details>
            ))}
            <details className="border-b border-border-subtle py-5">
              <summary className="cursor-pointer text-sm font-medium text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                {t('What if I’m ready to install Omarchy directly?')}
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                {t(
                  'The installation guide covers hardware, setup, and running Omarchy directly on your computer.',
                )}
              </p>
              <a
                className={link}
                href="https://omarchy.org/manual/getting-started/"
              >
                {t('Full installation guide')}
                <ArrowUpRightIcon className="size-4" />
              </a>
            </details>
          </div>
        </div>
      </section>
    </main>
  )
}
