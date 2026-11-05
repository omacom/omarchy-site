import type { ReactNode } from 'react'
import { useHashLink } from '@/lib/hash-scroll'

/** A homepage permalink with the heading's normal appearance. */
export function SectionAnchor({
  anchor,
  children,
}: {
  anchor: string
  children: ReactNode
}) {
  const onClick = useHashLink(anchor)
  return (
    <a
      href={`/#${anchor}`}
      onClick={onClick}
      className="text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      {children}
    </a>
  )
}

export function SectionHeading({
  title,
  description,
  action,
  level = 2,
  anchor,
  wide = false,
  roomy = false,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  level?: 2 | 3
  anchor?: string
  wide?: boolean
  /** A wider measure for a long description that a narrow action beside it
   *  leaves room for, so it holds to two lines instead of three. */
  roomy?: boolean
}) {
  const Heading = level === 3 ? 'h3' : 'h2'
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className={wide ? 'min-w-0' : roomy ? 'max-w-2xl' : 'max-w-xl'}>
        <Heading className="text-2xl font-semibold tracking-tight text-text sm:text-[1.75rem]">
          {anchor ? (
            <SectionAnchor anchor={anchor}>{title}</SectionAnchor>
          ) : (
            title
          )}
        </Heading>
        {description ? (
          <p className="mt-2 text-[15px] leading-relaxed text-text-secondary [text-wrap:pretty]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="hidden shrink-0 sm:block">{action}</div> : null}
    </div>
  )
}

/**
 * The heading's action, repeated at the end of the section for the narrow
 * layout. Only one of the two is ever shown.
 */
export function SectionActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-wrap gap-2 sm:hidden">{children}</div>
}
