import {
  flag,
  hasTranslation,
  locales,
  sortedLocales,
  t,
} from '../i18n/site.ts'
import type { SearchEntry } from '@/lib/content'

/**
 * The palette's standing menu, shaped like the one SUPER+SPACE opens on the
 * desktop: a short root of destinations you can walk into, rather than an
 * empty field that asks you to already know what you want.
 *
 * Ids are dotted the way omarchy-menu's are, so a child names its parent and
 * the tree needs no nesting to read. A row either goes somewhere (`to`, `href`)
 * or opens a submenu; the one that lists content, Manual, is filled in from
 * the search index once it arrives, since it already carries every chapter.
 */

export type MenuIcon =
  | 'home'
  | 'manual'
  | 'news'
  | 'themes'
  | 'plugins'
  | 'install'
  | 'language'
  | 'community'
  | 'foundation'
  | 'project'
  | 'page'
  | 'meetups'
  | 'teams'
  | 'discord'
  | 'github'
  | 'security'
  | 'patrons'
  | 'brand'
  | 'merch'

export type MenuItem = {
  id: string
  label: string
  icon: MenuIcon
  /** In-site destination, handed to the router. */
  to?: string
  /** Anchor to scroll to once `to` has rendered. */
  hash?: string
  /** External destination, opened in this tab like every link on the site. */
  href?: string
  /** Filled in from the search index rather than listed here. */
  provider?: 'manual'
  /** Header shown while the submenu is open; defaults to the label. */
  title?: string
  /** A locale to switch to, keeping the page where that site has it. */
  locale?: string
  /** A text glyph drawn in place of the icon: a locale's flag. */
  glyph?: string
}

/** The whole tree, flat. `parentOf` reads the hierarchy back out of the ids. */
const ITEMS: Array<MenuItem> = [
  // Root
  { id: 'home', label: t('Home'), icon: 'home', to: '/' },
  { id: 'manual', label: t('Manual'), icon: 'manual', provider: 'manual' },
  { id: 'news', label: t('News'), icon: 'news', to: '/news/' },
  {
    id: 'plugins',
    label: t('Plugins'),
    icon: 'plugins',
    href: 'https://plugins.omarchy.org',
  },
  { id: 'themes', label: t('Themes'), icon: 'themes', to: '/themes/' },
  { id: 'language', label: t('Language'), icon: 'language' },
  {
    id: 'github',
    label: 'GitHub',
    icon: 'github',
    href: 'https://github.com/omacom/omarchy',
  },
  {
    id: 'install',
    label: t('Install'),
    icon: 'install',
    to: '/',
    hash: 'install',
  },
  { id: 'community', label: t('Community'), icon: 'community' },
  { id: 'foundation', label: t('Foundation'), icon: 'foundation' },
  { id: 'project', label: t('Project'), icon: 'project' },

  // Community, in the footer's order
  {
    id: 'community.discord',
    label: 'Discord',
    icon: 'discord',
    href: 'https://discord.gg/tXFUdasqhY',
  },
  {
    id: 'community.meetups',
    label: t('Meetups'),
    icon: 'meetups',
    to: '/meetups/',
  },
  { id: 'community.teams', label: t('Teams'), icon: 'teams', to: '/teams/' },
  {
    id: 'community.workstations',
    label: t('Workstations'),
    icon: 'page',
    to: '/workstations/',
  },
  {
    id: 'community.doctrine',
    label: t('Doctrine'),
    icon: 'page',
    to: '/doctrine/',
  },

  // Foundation. Its first row is the footer's "About", which is the
  // foundation page itself; the submenu header says which About that is.
  {
    id: 'foundation.about',
    label: t('About'),
    icon: 'foundation',
    to: '/foundation/',
  },
  { id: 'foundation.staff', label: t('Staff'), icon: 'teams', to: '/staff/' },
  {
    id: 'foundation.patrons',
    label: t('Patrons'),
    icon: 'patrons',
    to: '/patrons/',
  },
  {
    id: 'foundation.sponsorships',
    label: t('Sponsorships'),
    icon: 'patrons',
    to: '/sponsorships/',
  },
  { id: 'foundation.air', label: 'AIR', icon: 'page', to: '/air/' },

  // Project
  {
    id: 'project.security',
    label: t('Security'),
    icon: 'security',
    to: '/security/',
  },
  {
    id: 'project.github',
    label: 'GitHub',
    icon: 'github',
    href: 'https://github.com/omacom/omarchy',
  },
  { id: 'project.brand', label: t('Brand'), icon: 'brand', to: '/brand/' },
  {
    id: 'project.merch',
    label: t('Merch'),
    icon: 'merch',
    href: 'https://supply.37signals.com/collections/omarchy',
  },

  // Language: the header's switcher as rows, every locale by its own name.
  ...sortedLocales.map(([code, entry]) => ({
    id: `language.${code}`,
    label: entry.name,
    icon: 'language' as const,
    glyph: flag(entry.domain, entry.flag),
    locale: code,
  })),
]

/**
 * The same page on another locale's site, or its front page where that site
 * does not have the page, as the header's switcher links.
 */
export function localeHref(code: string, path: string, suffix = '') {
  return `${locales[code].domain}${hasTranslation(code, path) ? path + suffix : '/'}`
}

const parentOf = (id: string) =>
  id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : 'root'

/** Rows shown for a menu id, in the order they are declared. */
export function childrenOf(menu: string): Array<MenuItem> {
  return ITEMS.filter((item) => parentOf(item.id) === menu)
}

export const menuItem = (id: string) => ITEMS.find((item) => item.id === id)

/**
 * Every row a query typed at the root can reach, root first. A destination
 * listed twice, GitHub at the root and again under Project, is one row here.
 */
export function everyRow(): Array<MenuItem> {
  const seen = new Set<string>()
  return ITEMS.filter((item) => {
    const destination =
      item.href ?? item.locale ?? (item.to && item.to + (item.hash ?? ''))
    if (!destination) return true
    if (seen.has(destination)) return false
    seen.add(destination)
    return true
  })
}

/** The submenu a row sits in; nothing for a root row. */
export const menuParent = (item: MenuItem) => menuItem(parentOf(item.id))

/** A row opens a submenu when it has children of its own or a provider. */
export const opensMenu = (item: MenuItem) =>
  !!item.provider || childrenOf(item.id).length > 0

export const menuTitle = (menu: string) => {
  const item = menuItem(menu)
  return item?.title ?? item?.label ?? t('Go')
}

/**
 * Index entries dressed as menu rows. One row per manual chapter: the index
 * carries an entry per section, and a chapter that opens with a heading has
 * no headingless entry of its own, so the first entry for a slug stands in.
 * Themes are not here: each is one destination, so a submenu of them was a
 * list whose every row went to the same page. Nor is the news: its index page
 * is already the list. Both stay reachable by search, which is where a
 * specific theme or post was always found. Plugins are not searched at all;
 * the directory has a search of its own.
 */
export function providerRows(
  provider: MenuItem['provider'],
  index: Array<SearchEntry> | null,
): Array<MenuItem> {
  if (!provider || !index) return []
  const seen = new Set<string>()
  const chapters: Array<MenuItem> = []
  for (const entry of index) {
    if (entry.kind !== 'manual' || seen.has(entry.slug)) continue
    seen.add(entry.slug)
    chapters.push({
      id: `manual.${entry.slug}`,
      label: entry.title,
      icon: 'manual',
      to: entry.slug === 'index' ? '/manual/' : `/manual/${entry.slug}/`,
    })
  }
  return chapters
}

/** Substring match on the label, the way the desktop menu filters a submenu. */
export function filterRows(rows: Array<MenuItem>, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return rows
  return rows.filter((row) => {
    const label = row.label.toLowerCase()
    return terms.every((term) => label.includes(term))
  })
}
