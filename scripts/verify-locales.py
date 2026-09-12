#!/usr/bin/env python3
"""Check observable metadata, links and news feeds in built country editions."""
import json
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.root = {}
        self.meta = {}
        self.links = []
        self.anchors = []
        # Every <nav>, with its attributes and the anchors it contains. Nested
        # navs each keep their own anchors; the open ones are on the stack.
        self.navs = []
        self.open_navs = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html':
            self.root = attrs
        elif tag == 'meta':
            self.meta[attrs.get('property', attrs.get('name'))] = attrs.get('content')
        elif tag == 'link':
            self.links.append(attrs)
        elif tag == 'nav':
            nav = {'attrs': attrs, 'anchors': []}
            self.navs.append(nav)
            self.open_navs.append(nav)
        elif tag == 'a':
            self.anchors.append(attrs.get('href', ''))
            for nav in self.open_navs:
                nav['anchors'].append(attrs)

    def handle_endtag(self, tag):
        if tag == 'nav' and self.open_navs:
            self.open_navs.pop()


def check(condition, *context):
    """A failed check names the edition, page and what was expected."""
    if not condition:
        raise AssertionError(' | '.join(str(part) for part in context))


def check_language_nav(page, code, path, expected):
    """The footer's language navigation: a labelled <nav> holding one anchor
    per reachable edition, each to the same page on that edition's domain,
    declaring its language, with the current edition marked and no other."""
    labelled = [nav for nav in page.navs if nav['attrs'].get('aria-label')]
    language_navs = [nav for nav in labelled if any('hreflang' in a for a in nav['anchors'])]
    check(language_navs, code, path, 'no <nav aria-label> with hreflang anchors; the footer language nav is missing')
    problems = []
    for nav in language_navs:
        by_code = {}
        wrong = []
        for anchor in nav['anchors']:
            other = anchor.get('hreflang')
            if other is None:
                wrong.append(f'anchor without hreflang: {anchor.get("href")}')
                continue
            if anchor.get('lang') != other:
                wrong.append(f'{other}: lang={anchor.get("lang")!r}, expected {other!r}')
            wanted = expected.get(other)
            if wanted is None:
                wrong.append(f'{other}: not a published edition (or a draft another edition must not link)')
            elif anchor.get('href') != wanted:
                wrong.append(f'{other}: href={anchor.get("href")!r}, expected {wanted!r}')
            by_code.setdefault(other, []).append(anchor)
        missing = sorted(set(expected) - set(by_code))
        if missing:
            wrong.append(f'no anchor for: {", ".join(missing)}')
        duplicated = sorted(other for other, anchors in by_code.items() if len(anchors) > 1)
        if duplicated:
            wrong.append(f'more than one anchor for: {", ".join(duplicated)}')
        current = [a.get('hreflang') for a in nav['anchors'] if a.get('aria-current')]
        if current != [code]:
            wrong.append(f'aria-current on {current or "nothing"}, expected exactly {code}')
        if not wrong:
            return
        problems.append(f'<nav aria-label={nav["attrs"]["aria-label"]!r}>: ' + '; '.join(wrong))
    check(False, code, path, 'footer language nav', *problems)


registry = json.loads(Path('src/i18n/locales.json').read_text())
published = {code: locale for code, locale in registry.items() if not locale.get('draft')}
posts = json.loads(Path('src/data/news-posts.json').read_text())
ported = json.loads(Path('src/data/pages.json').read_text())
paths = ['/', '/news/', '/themes/'] + [f'/{path}/' for path in ported]
paths += [post['path'] for post in posts]
# Drafts are verified only by name: nothing deploys them until published.
codes = sys.argv[1:] or [code for code in published if code != 'en']
for code in codes:
    check(code in registry, code, 'not in src/i18n/locales.json')
    locale = registry[code]
    domain = locale['domain']
    # An edition links to every published one, and a draft to itself as well.
    reachable = dict(published, **{code: locale})
    output = Path('dist/client' if code == 'en' else f'dist/{code}')
    check(output.is_dir(), code, f'{output} is not built; run npm run build:locale -- {code}')
    check((output / 'CNAME').read_text().strip() == urlsplit(domain).hostname, code, 'CNAME')
    for path in paths:
        page = Page((output / path.strip('/') / 'index.html').read_text())
        check(page.root.get('lang') == code, code, path, 'lang', page.root.get('lang'))
        check(page.root.get('dir') == locale.get('direction', 'ltr'), code, path, 'dir', page.root.get('dir'))
        canonical = [link.get('href') for link in page.links if link.get('rel') == 'canonical']
        check(canonical == [domain + path], code, path, 'canonical', canonical)
        check(page.meta.get('og:url') == domain + path, code, path, 'og:url', page.meta.get('og:url'))
        check(page.meta.get('og:locale') == locale['ogLocale'], code, path, 'og:locale', page.meta.get('og:locale'))
        alternates = {link.get('hreflang'): link.get('href') for link in page.links if link.get('rel') == 'alternate' and link.get('hreflang')}
        for other, destination in reachable.items():
            check(alternates.get(other) == destination['domain'] + path, code, path, 'alternate', other, alternates.get(other))
        for other in set(alternates) - set(reachable) - {'x-default'}:
            check(False, code, path, 'alternate to an edition this one must not link', other)
        expected = {other: destination['domain'] + path for other, destination in reachable.items()}
        for other, destination in expected.items():
            check(destination in page.anchors, code, path, 'footer language destination', destination)
        check_language_nav(page, code, path, expected)
        if not locale['manual']:
            check(not any(href == '/manual' or href.startswith(('/manual/', '/manual#', '/manual?')) for href in page.anchors), code, path, 'local manual link')
    feed = ET.parse(output / 'news/rss.xml').getroot().find('channel')
    check(feed is not None and feed.findtext('link', '').rstrip('/') == domain + '/news', code, 'RSS channel')
    items = feed.findall('item')
    check(len(items) == len(posts), code, 'RSS count', len(items), len(posts))
    for item, post in zip(items, posts):
        check(item.findtext('link', '').rstrip('/') == (domain + post['path']).rstrip('/'), code, 'RSS link', item.findtext('link'))
        check(parsedate_to_datetime(item.findtext('pubDate')) == datetime.fromisoformat(post['date']), code, 'RSS date', post['path'])
    print(f'{code}: {len(paths)} pages and {len(items)} RSS articles verified')
