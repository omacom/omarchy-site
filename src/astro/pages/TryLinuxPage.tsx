import { useState } from 'react'
import { t } from '@/i18n/site'
import { LINUX_INSTALLER, LINUX_REPO } from '@/lib/try-linux'
import { SectionHeading } from '@/components/SectionHeading'
import {
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
} from '@/components/icons'
import { LinuxIcon } from '@/components/icons/LinuxIcon'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const HELP = `${LINUX_REPO}/blob/master/docs/LINUX-HELP.md`
const TESTING = `${LINUX_REPO}/blob/master/docs/LINUX-HARDWARE-TESTING.md`
const wrap = 'mx-auto max-w-6xl px-5 sm:px-8'
const section = 'border-t border-border-subtle py-14 sm:py-20'
const link =
  'inline-flex min-h-11 items-center gap-2 text-sm text-text-secondary underline underline-offset-4 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'
const inlineLink = 'text-text underline underline-offset-4'

function Command({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mt-3 flex items-stretch border border-border-subtle bg-bg-deep">
      <pre className="min-w-0 flex-1 overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-text sm:text-sm">
        <code>{text}</code>
      </pre>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          })
        }
        className="flex min-h-11 min-w-11 items-center justify-center border-l border-border-subtle text-text-secondary hover:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        aria-label={copied ? t('Copied') : t('Copy command')}
      >
        {copied ? (
          <CheckIcon className="size-4" />
        ) : (
          <CopyIcon className="size-4" />
        )}
      </button>
    </div>
  )
}

function Steps({ steps }: { steps: React.ReactNode[] }) {
  return (
    <ol className="mt-6 space-y-5">
      {steps.map((step, index) => (
        <li
          key={index}
          className="flex gap-4 text-sm leading-relaxed text-text-secondary"
        >
          <span aria-hidden="true" className="font-mono text-brand">
            0{index + 1}
          </span>
          <div className="min-w-0 flex-1">{step}</div>
        </li>
      ))}
    </ol>
  )
}

const openApp = (
  <>
    {t(
      'Open Try Omarchy from your app menu, choose Set up Omarchy, then Set up my own account. It downloads Omarchy (about 2 GB) and starts it, and Omarchy’s normal setup asks for your username and password.',
    )}
    <span className="mt-2 block">
      {t(
        'Just want a quick look? Choose Quick start as omarchy instead. It skips the account form and signs you in as omarchy, with the password omarchy. Customize lets you pick where to store Omarchy first.',
      )}
    </span>
  </>
)

const requirements = [
  t(
    'A 64-bit x86 PC with hardware virtualization (KVM). ARM is not supported.',
  ),
  t(
    'About 15 GB of free disk space. The VM’s disk is 24 GB, but it only takes up the space Omarchy actually uses.',
  ),
  t(
    '8 GB of memory is recommended. The app sizes Omarchy to your PC, and you can change its memory in Settings.',
  ),
  t(
    'A Wayland or X11 desktop. Tested on Ubuntu, Fedora, Linux Mint and NixOS, and with KDE Plasma and Xfce.',
  ),
  t(
    'The app runs in the Flatpak sandbox with no access to your home folder. Files reach it through your desktop’s file chooser or a shared folder you pick.',
  ),
]

const questions: Array<[string, React.ReactNode]> = [
  [
    t('Is this the full Omarchy or a trial version?'),
    <>
      {t(
        'It is the full Omarchy desktop, running in a virtual machine. Nothing expires, and what you install and change stays. The quick-start account is a regular Omarchy user too. The differences are that sudo does not ask it for a password and SSH accepts only keys for it, since its password is public.',
      )}
      <span className="mt-3 block">
        {t(
          'You choose the account once, when Omarchy is first set up: Set up my own account, or Quick start as omarchy. To start over with a VM in the app’s default storage, back up anything you want to keep, choose Delete this VM in the app’s home screen menu, and set it up again. This action does not delete a VM in a folder you chose yourself.',
        )}
      </span>
    </>,
  ],
  [
    t('How do I know my PC can run it?'),
    <>
      {t(
        'You need a 64-bit x86 PC with hardware virtualization turned on and permission to use KVM. This command checks for the KVM device. If it is missing, check virtualization (Intel VT-x or AMD-V/SVM) in your firmware settings. Try Omarchy also checks whether your account can use it and explains what to change if access is denied.',
      )}
      <Command text="ls -l /dev/kvm" />
    </>,
  ],
  [
    t('How do updates work?'),
    t(
      'The installer adds the Try Omarchy update source, so new versions of the app arrive through your software center like your other apps, or with flatpak update. Your VM and files carry over. Omarchy itself updates from its own menu, under Update, the same as on any Omarchy install.',
    ),
  ],
  [
    t('How do I get my keyboard back?'),
    t(
      'On Wayland, Super and your other shortcuts go to Omarchy while its window is focused. On X11, Omarchy captures the keyboard only while the pointer is over its window; move it out to use your desktop’s shortcuts. Ctrl+Alt+G releases the keyboard until you click the window again. Ctrl+Alt+F switches fullscreen.',
    ),
  ],
  [
    t('What happens if I uninstall it?'),
    t(
      'Uninstalling keeps your VM unless you also delete the app’s data, so reinstalling picks up where you left off. Delete this VM in the app’s home screen menu removes a VM in the app’s default storage. A VM in a folder you chose yourself stays there even if you uninstall the app and delete its data.',
    ),
  ],
  [
    t('Is it finished?'),
    <>
      {t(
        'The app is a preview. Omarchy inside it is the regular desktop. Core use, files, backups and recovery work. Camera, live audio switching, gestures, USB passthrough and bridged networking are not in this release yet. Reports from real hardware help.',
      )}{' '}
      <a className={inlineLink} href={TESTING}>
        {t('See the hardware testing checklist.')}
      </a>
    </>,
  ],
]

export function TryLinuxPage() {
  const download = (
    <a className={inlineLink} href={LINUX_INSTALLER}>
      {t('Download TryOmarchy.flatpakref')}
    </a>
  )
  return (
    <main>
      <section className={`${wrap} pt-16 pb-10 text-center sm:pt-24 sm:pb-14`}>
        <p className="mb-6 font-mono text-xs tracking-widest text-text-secondary">
          {t('TRY OMARCHY FOR LINUX')}
        </p>
        <h1
          style={{ fontFamily: 'var(--font-mono)' }}
          className="mx-auto max-w-3xl text-2xl leading-snug font-medium tracking-tight text-text sm:text-3xl"
        >
          {t('The full Omarchy desktop.')}
          <br />
          {t('In a window on your Linux PC.')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
          {t(
            'Omarchy runs in a virtual machine, so you can use its apps, themes and keyboard-first workflow without replacing your distro or repartitioning a drive. Install it like any other app.',
          )}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            render={<a href={LINUX_INSTALLER} />}
            size="lg"
          >
            <LinuxIcon />
            {t('Download for Linux')}
            <DownloadIcon />
          </Button>
          <Button
            nativeButton={false}
            render={<a href="#install" />}
            size="lg"
            variant="outline"
          >
            {t('How to install')}
          </Button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-text-secondary">
          {t('Free & open source')} · x86_64 · KVM · Flatpak · {t('Preview')}
        </p>
      </section>
      <section
        className={`${wrap} pb-14 sm:pb-20`}
        aria-label={t('Product preview')}
      >
        <figure>
          <img
            src="/images/try/linux.webp"
            width="1920"
            height="1080"
            className="aspect-video w-full border border-border-subtle bg-bg-deep object-contain"
            alt={t(
              'Try Omarchy in a window on Ubuntu, with fastfetch and btop running in Omarchy.',
            )}
          />
          <figcaption className="mt-3 text-xs text-text-secondary">
            {t('Omarchy on Ubuntu. Your distro stays as it is.')}
          </figcaption>
        </figure>
      </section>
      <section className={`${section} bg-surface`} id="install">
        <div className={wrap}>
          <SectionHeading
            title={t('Install in three steps.')}
            description={t(
              'Install with your software center or the terminal. Ubuntu and NixOS need Flatpak support enabled first.',
            )}
          />
          <Tabs defaultValue="desktop" className="mt-8 flex-col">
            <TabsList
              aria-label={t('Install method')}
              className="h-11! self-start"
            >
              <TabsTrigger value="desktop" className="px-4">
                {t('Software')}
              </TabsTrigger>
              <TabsTrigger value="ubuntu" className="px-4">
                Ubuntu
              </TabsTrigger>
              <TabsTrigger value="terminal" className="px-4">
                {t('Terminal')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="desktop" className="max-w-2xl">
              <Steps
                steps={[
                  <>
                    {download}.{' '}
                    {t(
                      'Open it in your software center, such as GNOME Software, KDE Discover, or Software Manager on Linux Mint, and choose Install.',
                    )}
                  </>,
                  openApp,
                  t(
                    'Click the Omarchy window and press Super+Space for Omarchy’s menu. App updates arrive through your software center.',
                  ),
                ]}
              />
              <p className="mt-6 text-xs leading-relaxed text-text-secondary">
                {t(
                  'On Fedora, choose Enable if Software asks about third-party repositories, since the app’s runtime comes from Flathub. No Flatpak support yet?',
                )}{' '}
                <a
                  className="underline underline-offset-4 hover:text-text"
                  href="https://flathub.org/en/setup"
                >
                  {t('Set up Flatpak for your distribution')}
                </a>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-text-secondary">
                {t(
                  'NixOS needs Flatpak enabled first. Linux Mint may show an Unverified Flatpak badge before installation because the app comes from its own repository.',
                )}{' '}
                <a
                  className="underline underline-offset-4 hover:text-text"
                  href={HELP}
                >
                  {t('See the distribution setup notes.')}
                </a>
              </p>
            </TabsContent>
            <TabsContent value="ubuntu" className="max-w-2xl">
              <Steps
                steps={[
                  <>
                    {t(
                      'Ubuntu’s App Center does not install Flatpaks. Add Software with Flatpak support, then log out and back in:',
                    )}
                    <Command text="sudo apt update && sudo apt install flatpak gnome-software gnome-software-plugin-flatpak" />
                  </>,
                  <>
                    {download}. {t('Open it with Software and choose Install.')}
                  </>,
                  <>
                    {openApp}{' '}
                    {t(
                      'On Ubuntu 24.04, Software’s Open button can fail with an ldconfig error, so use the app menu.',
                    )}
                  </>,
                ]}
              />
            </TabsContent>
            <TabsContent value="terminal" className="max-w-2xl">
              <Steps
                steps={[
                  <>
                    {t('With Flatpak installed, run:')}
                    <Command
                      text={`flatpak install --user ${LINUX_INSTALLER}`}
                    />
                  </>,
                  openApp,
                  t(
                    'Update the app later with flatpak update, or from your software center.',
                  ),
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <section className={section}>
        <div className={`${wrap} grid gap-8 md:grid-cols-[1fr_2fr]`}>
          <SectionHeading title={t('Before you start.')} />
          <ul className="divide-y divide-border-subtle text-sm leading-relaxed text-text-secondary">
            {requirements.map((item) => (
              <li key={item} className="flex gap-3 py-3 first:pt-0">
                <span aria-hidden="true" className="text-brand">
                  +
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className={`${section} bg-surface`}>
        <div className={`${wrap} grid gap-8 md:grid-cols-[1fr_2fr]`}>
          <SectionHeading title={t('Questions.')} />
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
                <div className="mt-4 text-sm leading-relaxed text-text-secondary">
                  {answer}
                </div>
              </details>
            ))}
            <div className="mt-4 flex flex-wrap gap-x-6">
              <a className={link} href={HELP}>
                {t('Help and troubleshooting')}
                <ArrowUpRightIcon className="size-4" />
              </a>
              <a className={link} href={`${LINUX_REPO}/releases`}>
                {t('Release notes')}
              </a>
              <a className={link} href={LINUX_REPO}>
                {t('Source code')}
              </a>
              <a className={link} href={`${LINUX_REPO}/issues`}>
                {t('Report a problem')}
              </a>
              <a className={link} href="/try/">
                {t('Mac and Windows')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
