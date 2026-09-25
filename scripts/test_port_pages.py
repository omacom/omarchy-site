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
