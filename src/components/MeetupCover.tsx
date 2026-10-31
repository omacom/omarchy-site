import { t } from '@/i18n/site'
import { OmarchyWordmark } from '@/components/Brand'
import { cn } from '@/lib/utils'

/** Theme-aware event artwork for meetups without a cover of their own. */
export function MeetupCover({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label={t('Omarchy Meetup')}
      className={cn(
        '@container relative flex h-full w-full flex-col items-center justify-center gap-[8%] overflow-hidden bg-bg-deep px-[10%] text-brand',
        className,
      )}
    >
      <svg
        viewBox="0 0 600 600"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <path
          d="M0 105H105V0M0 135H135V0M465 600V465H600M495 600V495H600"
          stroke="currentColor"
          strokeWidth="2"
          opacity=".22"
        />
        <path
          d="M35 225V35H225M375 565H565V375"
          stroke="currentColor"
          strokeWidth="2"
          opacity=".35"
        />
        <g fill="currentColor" opacity=".2">
          <path d="M465 65h20v20h-20zM495 95h20v20h-20zM525 65h20v20h-20zM65 465h20v20H65zM95 495h20v20H95zM65 525h20v20H65z" />
        </g>
      </svg>
      <OmarchyWordmark className="relative w-full" />
      <span className="relative pl-[0.28em] font-mono text-[clamp(1.5rem,9cqw,4rem)] leading-none tracking-[0.28em]">
        MEETUP
      </span>
    </div>
  )
}
