import { SITE_DESCRIPTION, excerptFromHtml, seo } from '../lib/seo'
import type { NewsPost } from '../lib/news'
import type { getManualChapter } from './data'

type ChapterData = Awaited<ReturnType<typeof getManualChapter>>

export function homeSeo() {
  return seo({
    title: 'Omarchy - Beautiful, fun & agentic Linux by DHH',
    description: SITE_DESCRIPTION,
    path: '/',
  })
}

export function newsIndexSeo() {
  return seo({
    title: 'News - Omarchy',
    description:
      'Announcements, releases, and other news from the Omarchy project.',
    path: '/news',
  })
}

export function newsPostSeo(post: NewsPost) {
  return seo({
    title: `${post.title} - Omarchy News`,
    description: post.excerpt || SITE_DESCRIPTION,
    path: post.path,
    type: 'article',
    published: post.date,
  })
}

export function manualIndexSeo() {
  return seo({
    title: 'The Manual - Omarchy',
    description:
      'The Omarchy manual: installation, navigation, hotkeys, themes, plugins, and everything else about running the OS.',
    path: '/manual',
  })
}

const WRITTEN: Partial<Record<string, string>> = {
  faq: 'Answers to what comes up most: keyboard layouts, the clock format, timezones, DNS and Wi-Fi, printers, and where screenshots end up.',
}

export function chapterSeo(data: ChapterData, slug: string) {
  return seo({
    title: `${data.chapter?.title ?? 'Manual'} - Omarchy Manual`,
    description:
      WRITTEN[slug] ??
      ((data.chapter && excerptFromHtml(data.chapter.html)) ||
        SITE_DESCRIPTION),
    path: `/manual/${slug}`,
  })
}

export function teamsSeo() {
  return seo({
    title: 'Teams - Omarchy',
    description:
      'The people guiding Omarchy: Core sets the direction, Security keeps the system safe, Design shapes how it looks and feels, and the Rangers help everyone else find their way.',
    path: '/teams',
  })
}

export function themesSeo() {
  return seo({
    title: 'Themes - Omarchy',
    description:
      'Community themes for Omarchy. Install them via Install > Style > Themes in Omarchy.',
    path: '/themes',
  })
}

export function notFoundSeo() {
  return seo({
    title: 'Not found - Omarchy',
    description: 'There is nothing at this address.',
    path: '/404/',
    robots: 'noindex',
  })
}

export function meetupsSeo() {
  return seo({
    title: 'Meetups - Omarchy',
    description:
      'Omarchy meetups around the world, and how to run your own: about Omarchy, Linux and adjacent hacker culture, open to everyone, and run by the community.',
    path: '/meetups',
  })
}

const PORTED: Partial<Record<string, { title: string; description: string }>> =
  {
    air: {
      title: 'Artists in Residence - Omarchy',
      description:
        'A six-month residency for artists who make Omarchy beautiful: themes, plugins, and whatever else. Up to five seats at any one time, supported by the Omacom Foundation.',
    },
    brand: {
      title: 'Brand - Omarchy',
      description:
        'The Omarchy wordmark and logo, as vectors and at 4096px, and the terms for using them. Omarchy is a pending trademark.',
    },
    staff: {
      title: 'Omacom Foundation Staff - Omarchy',
      description:
        'The employees of the Omacom Foundation, working full time on Omarchy.',
    },
    foundation: {
      title: 'Omacom Foundation - Omarchy',
      description:
        'The nonprofit behind Omarchy. It holds the trademarks, funds the infrastructure, promotes the work, and supports the open-source projects and developers it is built on.',
    },
    omakub: {
      title: 'Omakub - Omarchy',
      description:
        'The road to Omarchy started with Omakub, which proved the thesis: give developers a beautiful, complete Linux out of the box and they show up.',
    },
    patrons: {
      title: 'Patrons - Omarchy',
      description:
        'The people and companies funding the Omacom Foundation. Founding patrons contribute $1,000,000 to the mission; distinguished patrons, $100,000.',
    },
    'patrons/badges': {
      title: 'Patron badges - Omarchy',
      description:
        'Every patron of the Omacom Foundation gets a digital rally credential: a badge, a social card, and wallpapers, in four classes, one for each tier of patronage.',
    },
    potato: {
      title: 'Ancient Hardware - Omarchy',
      description: 'Omarchy runs great on ancient hardware.',
    },
    security: {
      title: 'Security - Omarchy',
      description:
        'How to report a vulnerability in Omarchy - tell the Security Team privately at security@omarchy.org - and the people credited for doing exactly that.',
    },
    'security/credits': {
      title: 'Security Credits - Omarchy',
      description:
        'The people who responsibly disclosed security vulnerabilities in Omarchy.',
    },
    server: {
      title: 'Server - Omarchy',
      description: 'Omarchy Server 4.0, coming in 2026.',
    },
    sponsorships: {
      title: 'Sponsorships - Omarchy',
      description:
        'How the Omacom Foundation funds the projects Omarchy is built on, starting with an exclusive three-year sponsorship of Hyprland.',
    },
    workstations: {
      title: 'Workstations - Omarchy',
      description:
        'Desks and machines running Omarchy, shared under #omarchy-workstations.',
    },
  }

export function portedSeo(
  page: {
    title: string
    html: string
    seoTitle?: string
    description?: string
  } | null,
  path: string,
) {
  const written = PORTED[path]
  return seo({
    title:
      page?.seoTitle ??
      written?.title ??
      `${page?.title ?? 'Omarchy'} - Omarchy`,
    description:
      page?.description ??
      written?.description ??
      ((page && excerptFromHtml(page.html)) || SITE_DESCRIPTION),
    path: `/${path}`,
  })
}
