"""A build that is not publishable must fail before ossutil is ever invoked."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('deploy_zh_cn', Path(__file__).with_name('deploy-zh-cn.py'))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class CheckTest(unittest.TestCase):
    def build(self, directory, cname=None, omit=(), symlink=False):
        """Write a minimal build that check() should accept unless sabotaged."""
        root = Path(directory)
        for key in deploy.REQUIRED:
            if key in omit:
                continue
            path = root / key
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(key)
        (root / 'CNAME').write_text((cname or deploy.expected_domain()) + '\n')
        if symlink:
            (root / 'link.html').symlink_to(root / 'index.html')
        return root

    def test_a_complete_build_is_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            deploy.check(self.build(directory))  # must not raise

    def test_cname_must_match_the_locale_registry(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.build(directory, cname='example.invalid')
            with self.assertRaisesRegex(ValueError, 'CNAME'):
                deploy.check(root)

    def test_missing_required_files_are_refused(self):
        for key in ('index.html', '404.html', 'news/rss.xml'):
            with self.subTest(missing=key), tempfile.TemporaryDirectory() as directory:
                root = self.build(directory, omit=(key,))
                with self.assertRaisesRegex(ValueError, 'Missing required build file'):
                    deploy.check(root)

    def test_symlinks_are_refused(self):
        # ossutil follows them, so a link could publish something outside the build.
        with tempfile.TemporaryDirectory() as directory:
            root = self.build(directory, symlink=True)
            with self.assertRaisesRegex(ValueError, 'symlink'):
                deploy.check(root)


class ExpectedDomainTest(unittest.TestCase):
    def test_domain_comes_from_the_locale_registry(self):
        registry = json.loads((deploy.ROOT / 'src' / 'i18n' / 'locales.json').read_text())
        self.assertIn(deploy.expected_domain(), registry[deploy.LOCALE]['domain'])
