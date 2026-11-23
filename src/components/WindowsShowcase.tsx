import { t, localizedHref } from '@/i18n/site'
import { SectionActions, SectionHeading } from '@/components/SectionHeading'
import { ArrowRightIcon } from '@/components/icons'

export function WindowsShowcase() {
  const action = (
    <a
      href={localizedHref('/manual/windows-vm/')}
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 py-2 text-sm font-medium whitespace-nowrap text-text underline decoration-current underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_svg]:size-5 [&_svg]:shrink-0"
    >
      {t('Set up Windows')}
      <ArrowRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
    </a>
  )
  return (
    <>
      <SectionHeading
        action={action}
        anchor="windows"
        title={t('It even runs Windows!')}
        description={t(
          "Keep the Windows apps you can't leave behind, right inside Omarchy. Spin up a full Windows 11 VM for native Office and legacy software, or install Microsoft 365 web apps in one click.",
        )}
      />
      <img
        src="/manual/images/windows-vm.webp"
        alt={t(
          'Windows 11 running Outlook inside Omarchy, with the Omarchy desktop bar visible above it',
        )}
        width={1600}
        height={1067}
        loading="lazy"
        decoding="async"
        className="mt-6 h-auto w-full lg:mt-10"
      />
      <div className="mt-6 grid gap-6 md:grid-cols-3 lg:gap-8">
        <div>
          <h3 className="text-lg font-medium text-text">
            {t('Your Windows apps, at home')}
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
            {t('Choose')} <em>Install &gt; Windows</em>{' '}
            {t(
              'from the Omarchy menu. KVM virtualization delivers near-native CPU performance with sound, microphone, HiDPI scaling, a shared clipboard, and a shared folder for moving files between Windows and Linux.',
            )}
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium text-text">
            {t('Bring your license, or skip the VM')}
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
            {t(
              'The VM installs Windows 11 Pro unactivated, so bring your own license key. Only need Word, Excel, Outlook, or Teams? Choose',
            )}{' '}
            <em>Install &gt; Service &gt; Microsoft</em>{' '}
            {t('for Microsoft 365 web apps instead.')}
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium text-text">
            {t('For work, not gaming')}
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
            {t(
              "This VM runs without GPU passthrough. It's a great home for spreadsheets, documents, and Windows-only work apps, not gaming or heavy 3D graphics.",
            )}
          </p>
        </div>
      </div>
      <SectionActions>{action}</SectionActions>
    </>
  )
}
