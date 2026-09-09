import { t, tCountries } from '@/i18n/site'
import { Link } from '@tanstack/react-router'
import { ArrowUpRightIcon, DiscordIcon, GithubIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import teams from '@/data/teams.json'
import { PageHeading } from '@/components/PageHeading'

/** The line under a team, with its one link live: the security page for
 *  the Security team, the address to apply at for the Rangers. */
function TeamNote({
  note,
}: {
  note: { text: string; href: string | null; linkText: string | null }
}) {
  note = {
    ...note,
    text: t(note.text),
    linkText: note.linkText ? t(note.linkText) : null,
  }
  if (!note.href || !note.linkText) return note.text
  const at = note.text.indexOf(note.linkText)
  if (at < 0) return note.text
  const link = note.href.startsWith('/') ? (
    <Link
      to="/$/"
      params={{ _splat: note.href.replace(/^\/|\/$/g, '') }}
      className={noteLink}
    >
      {note.linkText}
    </Link>
  ) : (
    <a href={note.href} className={noteLink}>
      {note.linkText}
    </a>
  )
  return (
    <>
      {note.text.slice(0, at)}
      {link}
      {note.text.slice(at + note.linkText.length)}
    </>
  )
}

const noteLink =
  'text-text underline decoration-border-strong underline-offset-4 transition-colors duration-150 ease-out hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function TeamsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeading title={t('Teams')} />

      {teams.map((team) => (
        <section
          key={team.id}
          id={team.id}
          aria-labelledby={`team-${team.id}-name`}
          className="relative mt-12 scroll-mt-[calc(var(--nav-h)+2rem)] border-t border-border-subtle pt-8 first-of-type:mt-0 first-of-type:border-0 first-of-type:pt-0"
        >
          {/* Keep existing team anchor URLs working. */}
          <span
            id={`team-${team.id}`}
            aria-hidden="true"
            className="absolute top-0 scroll-mt-[calc(var(--nav-h)+2rem)]"
          />
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2
              id={`team-${team.id}-name`}
              className="font-sans text-lg font-medium text-text"
            >
              {t(team.name.replace(/^Omarchy /, ''))}
            </h2>
            <p className="font-mono text-xs text-text-muted">
              {t(team.description)}
            </p>
          </div>
          <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]">
            {team.members.map((member) => {
              const face = (
                <>
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt=""
                      width={240}
                      height={240}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full object-cover ring-1 ring-border-subtle"
                    />
                  ) : null}
                  <span className="block">
                    <span className="flex items-center gap-1 font-sans text-sm font-medium text-text underline decoration-transparent underline-offset-[3px] transition-colors duration-150 ease-out group-hover:decoration-brand">
                      {member.name}
                      {member.href ? (
                        <ArrowUpRightIcon className="size-3.5 shrink-0 text-text-muted opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100" />
                      ) : null}
                    </span>
                    <span className="block font-mono text-xs text-text-muted">
                      {tCountries(member.meta)}
                    </span>
                  </span>
                </>
              )
              const profile =
                'group flex h-full flex-col items-start gap-3 rounded-xl py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
              return (
                <li key={member.name}>
                  {member.href ? (
                    <a href={member.href} className={profile}>
                      {face}
                    </a>
                  ) : (
                    <div className={profile}>{face}</div>
                  )}
                </li>
              )
            })}
          </ul>
          {team.note ? (
            <p className="mt-8 font-mono text-xs text-text-muted">
              <TeamNote note={team.note} />
            </p>
          ) : null}
        </section>
      ))}

      <section className="mt-14 border-t border-border-subtle pt-10">
        <div className="ring-elevation flex flex-col gap-6 bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-lg font-medium tracking-tight text-text">
              {t('Not on a team? Neither is almost everyone.')}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
              <span className="md:block">
                {t('Most of Omarchy happens in the Discord and on GitHub:')}
              </span>{' '}
              {t('Questions, themes, plugins, pull requests.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              nativeButton={false}
              render={<a href="https://discord.gg/tXFUdasqhY" />}
            >
              <DiscordIcon data-icon="inline-start" />
              {t('Join the Discord')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<a href="https://github.com/omacom/omarchy" />}
            >
              <GithubIcon data-icon="inline-start" />
              Open GitHub
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
