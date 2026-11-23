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
  ['Muse Code', 'meta.svg', 'https://dev.meta.ai'],
].sort(([a], [b]) => a.localeCompare(b, 'en'))

const features = [
  {
    title: t('Any harness, one keystroke away'),
    description: t(
      'Pick your default from twenty-four coding agents on first boot — Claude Code, Codex, OpenCode, Pi, Antigravity, Grok, and more. Press Super + ~ to drop it over any workspace in a Quake-style console.',
    ),
  },
  {
    title: t('Limits and multiple subscriptions'),
    description: t(
      'The agents panel tracks session limits, weekly quotas, and prepaid balances across providers, and keeps multiple Claude, Codex, and Grok subscriptions signed in on one machine with shared history.',
    ),
  },
  {
    title: t('Private local AI models'),
    description: t(
      'Run open-weight coding models sized to your GPU and RAM with one click, or generate images, video, and endless music locally in Fantasi and Flowtunes. Nothing leaves your machine.',
    ),
  },
  {
    title: t('Click to diagnose a crash'),
    description: t(
      'When an app dumps core, click the notification to send your agent straight into the crash dump. It inspects the trace, explains what broke, and helps file the bug upstream.',
    ),
  },
  {
    title: t('Build apps, plugins, themes, and games'),
    description: t(
      'Built-in skills teach your agent to build native apps, shell plugins, full-system themes, and 3D games for Game Vibes. Describe what you want, try what it builds, and share it with everyone.',
    ),
  },
  {
    title: t('Shared rules, synced themes'),
    description: t(
      'Keep one personal AGENTS.md and shared skills folder linked into every harness automatically, while switching themes restyles your agents right alongside the rest of the desktop.',
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
          'Your agent should feel at home on your computer. Omarchy wires in your favorite harnesses, local models, usage tracking, and system skills so it can understand, fix, and shape the whole desktop.',
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
