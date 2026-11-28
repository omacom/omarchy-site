import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('port_content', Path(__file__).with_name('port_content.py'))
port = importlib.util.module_from_spec(spec)
spec.loader.exec_module(port)


class PageDiscoveryTest(unittest.TestCase):
    def test_new_html_pages_are_discovered_without_an_allowlist(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for slug in ['new-page', 'new-page/details', 'manual', 'news', 'themes', 'discord']:
                source = root / slug / 'index.html'
                source.parent.mkdir(parents=True, exist_ok=True)
                source.write_text('<main><p>New content</p></main>' if slug != 'discord' else '<meta http-equiv="refresh"><main>Redirecting</main>')
            self.assertEqual(sorted(slug for slug, _ in port.page_sources(root)), ['new-page', 'new-page/details'])


class ThemesGalleryTest(unittest.TestCase):
    def test_parses_a_single_line_figure_block(self):
        html = '''<figure class="themes__theme">
  <a href="https://github.com/you/your-theme"><img src="/assets/themes/your-theme.webp" alt="Your Theme theme" loading="lazy" decoding="async"></a>
  <figcaption><a href="https://github.com/you/your-theme">Your Theme</a></figcaption>
</figure>'''
        self.assertEqual(port.parse_themes(html), [{
            'repo': 'https://github.com/you/your-theme',
            'image': '/assets/themes/your-theme.webp',
            'name': 'Your Theme',
        }])

    def test_parses_a_prettier_wrapped_figure_block(self):
        html = '''<figure class="themes__theme">
  <a href="https://github.com/you/your-theme"
    ><img
      src="/assets/themes/your-theme.webp"
      alt="Your Theme theme"
      loading="lazy"
      decoding="async"
  /></a>
  <figcaption>
    <a href="https://github.com/you/your-theme">Your Theme</a>
  </figcaption>
</figure>'''
        self.assertEqual(port.parse_themes(html), [{
            'repo': 'https://github.com/you/your-theme',
            'image': '/assets/themes/your-theme.webp',
            'name': 'Your Theme',
        }])

