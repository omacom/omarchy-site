import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PageWordmark } from '@/components/PageWordmark'

export function PageHeading({
  title,
  brand = 'omarchy',
  as: Title = 'h1',
  className,
  children,
}: {
  title: string
  brand?: 'omarchy' | 'oma'
  as?: 'h1' | 'p'
  className?: string
  children?: ReactNode
}) {
  return (
    <header className={cn('pb-8 sm:pb-10', className)}>
      <PageWordmark brand={brand} />
      <Title className="page-subtitle text-center text-xs font-medium tracking-[0.18em] text-brand uppercase sm:text-sm">
        {title}
      </Title>
      {children}
    </header>
  )
}
