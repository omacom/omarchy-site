import { localizedHref } from '@/i18n/site'
import React, { createContext, useContext, useSyncExternalStore } from 'react'
import { navigate } from 'astro:transitions/client'

// Astro static-render stand-in for @tanstack/react-router. Every Link below
// renders the same <a> the router would have prerendered; the router hooks
// read from the contexts the Astro page wrappers provide.

export const LoaderDataCtx = createContext<unknown>(null)
export const RouteParamsCtx = createContext<Record<string, string>>({})
export const ActivePathCtx = createContext<string>('/')
export const OutletCtx = createContext<React.ReactNode>(null)

export function LoaderProvider({
  value,
  params,
  activePath,
  outlet,
  children,
}: {
  value: unknown
  params?: Record<string, string>
  activePath?: string
  outlet?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <LoaderDataCtx.Provider value={value}>
      <RouteParamsCtx.Provider value={params ?? {}}>
        <ActivePathCtx.Provider value={activePath ?? '/'}>
          <OutletCtx.Provider value={outlet ?? null}>
            {children}
          </OutletCtx.Provider>
        </ActivePathCtx.Provider>
      </RouteParamsCtx.Provider>
    </LoaderDataCtx.Provider>
  )
}

type HrefOpts = {
  to?: string
  params?: Record<string, string>
  hash?: string
  search?: string | Record<string, string>
}

// Fills $placeholders the way the file routes do. A bare `$` is the
// catch-all's splat (named `_splat`); every other `to` in the tree already
// ends in '/'.
export function resolveHref({ to, params, hash, search }: HrefOpts): string {
  let href = to ?? '/'
  if (params) {
    const splat = String(params._splat ?? '').replace(/^\/+|\/+$/g, '')
    href = href.replace(/(^|\/)\$(?=\/|$)/g, `$1${splat}`)
    href = href.replace(
      /\$_splat|\$([A-Za-z_]\w*)/g,
      (m, name: string | undefined) =>
        String(params[name ?? '_splat'] ?? m).replace(/^\/+|\/+$/g, ''),
    )
  }
  if (search) {
    const q =
      typeof search === 'string'
        ? search
        : new URLSearchParams(search).toString()
    if (q) href += (href.includes('?') ? '&' : '?') + q
  }
  if (hash) href += `#${hash}`
  return localizedHref(href)
}

const bare = (p: string) => (p === '/' ? p : p.replace(/\/+$/, ''))

type LinkProps = {
  to?: string
  params?: Record<string, string>
  hash?: string
  search?: string | Record<string, string>
  activeProps?: { className?: string }
  activeOptions?: unknown
  inactiveProps?: unknown
  preload?: unknown
  preloadDelay?: unknown
  preloadStaleTime?: unknown
  replace?: unknown
  resetScroll?: unknown
  state?: unknown
  from?: unknown
  mask?: unknown
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
    onClick?: React.MouseEventHandler<HTMLAnchorElement>
  }

export function Link({
  to,
  params,
  hash,
  search,
  activeProps,
  activeOptions: _activeOptions,
  inactiveProps: _inactiveProps,
  preload: _preload,
  preloadDelay: _preloadDelay,
  preloadStaleTime: _preloadStaleTime,
  replace: _replace,
  resetScroll: _resetScroll,
  state: _state,
  from: _from,
  mask: _mask,
  className,
  onClick,
  ...rest
}: LinkProps) {
  const activePath = useContext(ActivePathCtx)
  const href = resolveHref({ to, params, hash, search })
  // Prerendered active state, exact: the manual sidebar's current chapter.
  const active =
    activeProps?.className && bare(href.split(/[?#]/)[0]) === bare(activePath)
  return (
    <a
      href={href}
      className={
        active ? `${className ?? ''} ${activeProps.className}` : className
      }
      onClick={onClick}
      {...rest}
    />
  )
}

type NavigateOptions = HrefOpts & { replace?: boolean; resetScroll?: boolean }

export function useNavigate() {
  return (opts?: string | NavigateOptions) => {
    if (typeof window === 'undefined') return Promise.resolve()
    const href =
      typeof opts === 'string'
        ? opts
        : resolveHref({
            to: opts?.to ?? window.location.pathname,
            params: opts?.params,
            hash: opts?.hash,
            search: opts?.search,
          })
    const replace = typeof opts === 'object' && opts.replace === true
    // These callers already placed the scroll. Preserve Astro's history
    // metadata so back/forward restoration still works.
    if (
      typeof opts === 'object' &&
      opts.resetScroll === false &&
      bare(href.split(/[?#]/)[0]) === bare(window.location.pathname)
    ) {
      if (replace) window.history.replaceState(window.history.state, '', href)
      else window.history.pushState(window.history.state, '', href)
      window.dispatchEvent(new Event('omarchy:location'))
      return Promise.resolve()
    }
    return navigate(href, { history: replace ? 'replace' : 'push' })
  }
}

type Location = { pathname: string; href: string; search: string; hash: string }

function subscribeLocation(onChange: () => void) {
  document.addEventListener('astro:after-swap', onChange)
  window.addEventListener('popstate', onChange)
  window.addEventListener('hashchange', onChange)
  window.addEventListener('omarchy:location', onChange)
  return () => {
    document.removeEventListener('astro:after-swap', onChange)
    window.removeEventListener('popstate', onChange)
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('omarchy:location', onChange)
  }
}

export function useLocation<T = Location>(options?: {
  select?: (location: Location) => T
  serverPath?: string
}): T {
  const active = useContext(ActivePathCtx)
  const href = useSyncExternalStore(
    subscribeLocation,
    () => window.location.href,
    () => options?.serverPath ?? active,
  )
  const url = new URL(href, 'https://omarchy.org')
  const location = {
    pathname: url.pathname,
    href,
    search: url.search,
    hash: url.hash,
  }
  return options?.select ? options.select(location) : (location as T)
}

export function useParams() {
  return useContext(RouteParamsCtx)
}

export function useSearch(): Record<string, string> {
  return {}
}

export function useRouter() {
  return { navigate: useNavigate() }
}

export function Outlet() {
  return <>{useContext(OutletCtx)}</>
}

export function notFound(): never {
  throw Object.assign(new Error('Not Found'), { isNotFound: true })
}

export function isNotFound(e: unknown) {
  return (
    e instanceof Error && (e as { isNotFound?: boolean }).isNotFound === true
  )
}

export function redirect(opts: string | HrefOpts): never {
  throw Object.assign(new Error(`Redirect: ${JSON.stringify(opts)}`), {
    isRedirect: true,
  })
}

function makeRouteFactory() {
  return (_path?: string) => (config: Record<string, unknown>) => ({
    ...config,
    useLoaderData: () => useContext(LoaderDataCtx),
    useParams: () => useContext(RouteParamsCtx),
    useSearch: () => ({}),
  })
}

export const createFileRoute = makeRouteFactory()
export const createRootRoute = makeRouteFactory()

export function createRouter(_opts?: unknown) {
  return { subscribe: () => () => {}, navigate: () => Promise.resolve() }
}

export function HeadContent() {
  return null
}

export function Scripts() {
  return null
}

export function getRouteApi() {
  return {
    useLoaderData: () => useContext(LoaderDataCtx),
    useParams: () => useContext(RouteParamsCtx),
  }
}

export type AnyRouter = {
  subscribe: (...args: Array<unknown>) => () => void
}
