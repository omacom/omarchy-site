import { t, localizedHref } from '@/i18n/site'
import { SectionHeading } from '@/components/SectionHeading'
import { ArrowRightIcon } from '@/components/icons'

const tools = [
  {
    title: t('Your editor, integrated'),
    description: t(
      'Neovim is the default, with VSCode, Cursor, Zed, Sublime Text, Helix, Vim, and Emacs ready to install. Pick your favorite and make it the system-wide default.',
    ),
    href: '/manual/development-tools/#alternative-editors',
    link: t('Choose your editor'),
  },
  {
    title: t('Your stack, ready to go'),
    description: t(
      'Install Ruby on Rails, Laravel, Node.js, and a long list of other development environments from the Omarchy menu. Mise handles language versions, so each project can use what it needs.',
    ),
    href: '/manual/development-tools/#environment',
    link: t('Set up your stack'),
  },
  {
    title: t('Four terminals, one choice'),
    description: t(
      'Foot is the fast, lightweight default. Prefer Alacritty, Ghostty, or Kitty? All four are integrated, and switching your default keeps the same keyboard shortcuts working.',
    ),
    href: '/manual/terminal/',
    link: t('Pick your terminal'),
  },
]

export function DeveloperShowcase() {
  return (
    <>
      <SectionHeading
        anchor="developers"
        title={t('Developed by developers for developers')}
        description={t(
          'The tools you know, set up to work together. Bring your projects, choose your favorites, and get straight to building.',
        )}
      />
      <div className="mt-6 grid gap-6 md:grid-cols-3 lg:mt-10 lg:gap-8">
        {tools.map((tool) => (
          <div
            key={tool.title}
            className="flex min-w-0 flex-col border-t border-border-strong pt-4"
          >
            <h3 className="text-lg font-medium tracking-tight text-text">
              {tool.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
              {tool.description}
            </p>
            <a
              href={localizedHref(tool.href)}
              className="mt-auto inline-flex min-h-10 items-center gap-2 self-start pt-4 text-sm font-medium text-text underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&:hover_span]:decoration-current"
            >
              <span className="underline decoration-current">{tool.link}</span>
              <ArrowRightIcon className="size-5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
            </a>
          </div>
        ))}
      </div>
      <p className="mt-10 text-[15px] leading-relaxed text-text-secondary">
        {t('Also available:')}{' '}
        {[
          ['Herdr', '/manual/tuis/#herdr'],
          ['Tmux', '/manual/terminal/#tmux'],
          ['Docker', '/manual/development-tools/#docker'],
          ['Lazygit', '/manual/tuis/#lazygit'],
          [t('the best shell tools'), '/manual/shell-tools/'],
        ].map(([name, href], index) => (
          <span key={href}>
            {index > 0 && (index === 4 ? t(', and ') : ', ')}
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
    </>
  )
}
