import type { ReactNode } from 'react'
import { LoaderProvider } from './router-shim'
import { ManualLayout } from '../components/ManualLayout'
import type { getManualToc } from './data'

export function ManualIsland({
  toc,
  activePath,
  children,
}: {
  toc: ReturnType<typeof getManualToc>
  activePath: string
  children: ReactNode
}) {
  return (
    <LoaderProvider value={null} activePath={activePath}>
      <ManualLayout toc={toc} activePath={activePath}>
        {children}
      </ManualLayout>
    </LoaderProvider>
  )
}
