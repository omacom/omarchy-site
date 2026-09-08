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
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'html':
            self.root = attrs
        elif tag == 'meta':
            self.meta[attrs.get('property', attrs.get('name'))] = attrs.get('content')
        elif tag == 'link':
            self.links.append(attrs)
        elif tag == 'a':
            self.anchors.append(attrs.get('href', ''))


registry = json.loads(Path('src/i18n/locales.json').read_text())
posts = json.loads(Path('src/data/news-posts.json').read_text())
manual = json.loads(Path('src/data/manual.json').read_text())
ported = json.loads(Path('src/data/pages.json').read_text())
paths = ['/', '/news/', '/themes/'] + [f'/{path}/' for path in ported]
paths += [post['path'] for post in posts]
codes = sys.argv[1:] or [code for code in registry if code != 'en']
for code in codes:
    locale = registry[code]
    domain = locale['domain']
    output = Path('dist/client' if code == 'en' else f'dist/{code}')
    assert (output / 'CNAME').read_text().strip() == urlsplit(domain).hostname, code
    pages = list(paths)
    if locale['manual']:
        pages += ['/manual/'] + [f"/manual/{c['slug']}/" for c in manual if c['slug'] != 'index']
    for path in pages:
        page = Page((output / path.strip('/') / 'index.html').read_text())
        assert page.root.get('lang') == code, (code, path, 'lang')
        assert page.root.get('dir') == locale.get('direction', 'ltr'), (code, path, 'dir')
        canonical = [link.get('href') for link in page.links if link.get('rel') == 'canonical']
        assert canonical == [domain + path], (code, path, 'canonical', canonical)
        assert page.meta.get('og:url') == domain + path, (code, path, 'og:url')
        assert page.meta.get('og:locale') == locale['ogLocale'], (code, path, 'og:locale')
        for other, destination in registry.items():
            # Manual pages only point at editions that carry a translated manual.
            if path.startswith('/manual') and not destination['manual']:
                continue
            assert any(link.get('hreflang') == other and link.get('href') == destination['domain'] + path for link in page.links), (code, path, 'alternate', other)
        for destination in registry.values():
            navigation = destination['domain']
            if path.startswith('/manual') and not destination['manual']:
                continue
            assert navigation + path in page.anchors, (code, path, 'footer language destination', navigation)
        if not locale['manual']:
            assert not any(href == '/manual' or href.startswith(('/manual/', '/manual#', '/manual?')) for href in page.anchors), (code, path, 'local manual link')
    feed = ET.parse(output / 'news/rss.xml').getroot().find('channel')
    assert feed is not None and feed.findtext('link', '').rstrip('/') == domain + '/news', (code, 'RSS channel')
    items = feed.findall('item')
    assert len(items) == len(posts), (code, 'RSS count')
    for item, post in zip(items, posts):
        assert item.findtext('link', '').rstrip('/') == (domain + post['path']).rstrip('/'), (code, 'RSS link')
        assert parsedate_to_datetime(item.findtext('pubDate')) == datetime.fromisoformat(post['date']), (code, 'RSS date')
    print(f'{code}: {len(pages)} pages and {len(items)} RSS articles verified')
