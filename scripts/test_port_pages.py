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


class GalleryThemesTest(unittest.TestCase):
    ROOT = Path(__file__).resolve().parent.parent

    def test_the_readme_example_is_read(self):
        example = (self.ROOT / 'README.md').read_text().split('```html\n', 1)[1].split('```', 1)[0]
        self.assertEqual(port.gallery_themes(example), [
            {'repo': 'https://github.com/you/your-theme', 'image': '/assets/themes/your-theme.webp', 'name': 'Your Theme'},
        ])

    def test_two_entries_left_in_one_figure_both_show(self):
        html = '''<figure class="themes__theme">
  <a href="https://github.com/a/one"><img src="/assets/themes/one.webp" alt="One theme"></a>
  <figcaption><a href="https://github.com/a/one">One</a></figcaption>

  <a href="https://github.com/b/two"><img src="/assets/themes/two.webp" alt="Two theme"></a>
  <figcaption><a href="https://github.com/b/two">Two</a></figcaption>
</figure>'''
        self.assertEqual([theme['name'] for theme in port.gallery_themes(html)], ['One', 'Two'])

    def test_an_entry_that_does_not_parse_fails_the_build(self):
        html = '''<figure class="themes__theme">
  <a href="https://github.com/a/one"><span>no screenshot</span></a>
  <figcaption><a href="https://github.com/a/one">One</a></figcaption>
</figure>'''
        with self.assertRaises(ValueError):
            port.gallery_themes(html)

    def test_every_theme_has_its_own_figure(self):
        html = (self.ROOT / 'themes' / 'index.html').read_text()
        themes = port.gallery_themes(html)
        self.assertEqual(len(themes), html.count('<figure class="themes__theme">'))
        self.assertEqual(len(themes), html.count('</figure>'))
