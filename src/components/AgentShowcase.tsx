import { t, localizedHref } from '@/i18n/site'
import { SectionActions, SectionHeading } from '@/components/SectionHeading'
import { ArrowRightIcon } from '@/components/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const monochrome = new Set([
  'opencode.svg',
  'github-copilot.svg',
  'grok.svg',
  'pi.svg',
  'ori.svg',
  'hermes.svg',
])

// The launchers documented in /manual/ai/. Logos reuse the Herdr agent assets,
// with Oh My Pi and Crush from their upstream repositories and OpenRouter's
// mark (via Lobe Icons) for Ori.
const agents = [
  ['Claude Code', 'claude.svg', 'https://code.claude.com/'],
  ['Codex', 'codex.svg', 'https://github.com/openai/codex'],
  ['OpenCode', 'opencode.svg', 'https://opencode.ai/'],
  [
    'Antigravity',
    'antigravity.svg',
    'https://github.com/google-antigravity/antigravity-cli',
  ],
  ['Copilot', 'github-copilot.svg', 'https://github.com/github/copilot-cli'],
  ['Crush', 'crush.png', 'https://github.com/charmbracelet/crush'],
  ['Grok', 'grok.svg', 'https://x.ai/'],
  ['Pi', 'pi.svg', 'https://github.com/badlogic/pi-mono'],
  ['Oh My Pi', 'oh-my-pi.svg', 'https://github.com/can1357/oh-my-pi'],
  ['Ori', 'ori.svg', 'https://openrouter.ai/docs/guides/ori/harness'],
  ['Hermes', 'hermes.svg', 'https://hermes-agent.nousresearch.com/'],
  ['OpenClaw', 'openclaw.svg', 'https://openclaw.ai/'],
  [
    'Meta Code',
    'meta.svg',
    'https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2',
  ],
].sort(([a], [b]) => a.localeCompare(b, 'en'))

const features = [
  {
    title: t('Choose your agent'),
    description: t(
      'On first boot, Omarchy invites you to set up a default agent. Pick your favorite, sign in, and put it to work on your computer.',
    ),
  },
  {
    title: t('Make sense of a crash'),
    description: t(
      'When an app crashes, click the notification to send your agent on the case. It can examine the crash dump, diagnose what went wrong, and help report the bug.',
    ),
  },
  {
    title: t('Make it your own'),
    description: t(
      'Omarchy ships with skills to help your agent make apps, plugins, and themes. Describe what you want, try what it builds, and share it with everyone.',
    ),
  },
]

export function AgentShowcase() {
  const action = (
    <a
      href={localizedHref('/manual/ai/')}
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 py-2 text-sm font-medium whitespace-nowrap text-text underline decoration-current underline-offset-4 transition-colors duration-150 hover:text-brand hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_svg]:size-5 [&_svg]:shrink-0"
    >
      {t('Meet your new agent')}
      <ArrowRightIcon className="rtl:-scale-x-100" aria-hidden="true" />
    </a>
  )
  return (
    <>
      <SectionHeading
        action={action}
        anchor="agents"
        title={t('The agentic OS for the age of agents')}
        description={t(
          'Your agent should feel at home on your computer. Omarchy gives it the tools and skills to help you understand, fix, and shape the whole system.',
        )}
      />
      <div className="mt-6 grid gap-6 md:grid-cols-3 lg:mt-10 lg:gap-8">
        {features.map(({ title, description }) => (
          <div
            key={title}
            className="min-w-0 border-t border-border-strong pt-4"
          >
            <h3 className="text-lg font-medium tracking-tight text-text">
              {title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
              {description}
            </p>
          </div>
        ))}
      </div>
      <TooltipProvider>
        <ul
          aria-label={t('Supported agent harnesses')}
          className="mt-6 flex flex-wrap gap-3 lg:mt-8"
        >
          {agents.map(([name, logo, href]) => (
            <li key={name}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <a
                      href={localizedHref(href)}
                      aria-label={name}
                      className="flex size-10 items-center justify-center text-text-secondary hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                      {monochrome.has(logo) ? (
                        <span
                          aria-hidden="true"
                          className="block size-6 shrink-0 bg-current"
                          style={{
                            mask: `url(/images/agents/${logo}) center / contain no-repeat`,
                          }}
                        />
                      ) : (
                        <img
                          src={`/images/agents/${logo}`}
                          alt=""
                          width={24}
                          height={24}
                          className="size-6 object-contain"
                        />
                      )}
                    </a>
                  }
                />
                <TooltipContent>{name}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </TooltipProvider>
      <SectionActions>{action}</SectionActions>
    </>
  )
}
