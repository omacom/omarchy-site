"""The zh-CN build is checked before rclone runs, and rclone runs in the right passes."""
import contextlib
import importlib.util
import io
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('deploy_zh_cn', Path(__file__).with_name('deploy-zh-cn.py'))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


def build(directory, cname=None, omit=(), symlink=False):
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


class CheckTest(unittest.TestCase):
    def test_a_complete_build_is_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            deploy.check(build(directory))  # must not raise

    def test_cname_must_match_the_locale_registry(self):
        with tempfile.TemporaryDirectory() as directory:
            root = build(directory, cname='example.invalid')
            with self.assertRaisesRegex(ValueError, 'CNAME'):
                deploy.check(root)

    def test_missing_required_files_are_refused(self):
        for key in ('index.html', '404.html', 'news/rss.xml'):
            with self.subTest(missing=key), tempfile.TemporaryDirectory() as directory:
                root = build(directory, omit=(key,))
                with self.assertRaisesRegex(ValueError, 'Missing required build file'):
                    deploy.check(root)

    def test_symlinks_are_refused(self):
        # rclone skips them, so a linked page would go missing without an error.
        with tempfile.TemporaryDirectory() as directory:
            root = build(directory, symlink=True)
            with self.assertRaisesRegex(ValueError, 'symlink'):
                deploy.check(root)


class ExpectedDomainTest(unittest.TestCase):
    def test_domain_comes_from_the_locale_registry(self):
        registry = json.loads((deploy.ROOT / 'src' / 'i18n' / 'locales.json').read_text())
        self.assertIn(deploy.expected_domain(), registry[deploy.LOCALE]['domain'])


class ParseHostTest(unittest.TestCase):
    def test_host_splits_into_bucket_and_endpoint(self):
        self.assertEqual(deploy.parse_host('omarchy-site-cn.oss-cn-shanghai.aliyuncs.com'),
                         ('omarchy-site-cn', 'oss-cn-shanghai.aliyuncs.com'))

    def test_anything_else_is_refused(self):
        for host in ('', None, 'oss-cn-shanghai.aliyuncs.com', 'omarchy.cn',
                     'https://omarchy-site-cn.oss-cn-shanghai.aliyuncs.com',
                     'omarchy-site-cn.oss-cn-shanghai.aliyuncs.com/'):
            with self.subTest(host=host), self.assertRaisesRegex(ValueError, 'bucket domain'):
                deploy.parse_host(host)


class DeployTest(unittest.TestCase):
    HOST = 'omarchy-site-cn.oss-cn-shanghai.aliyuncs.com'

    def deploy(self, root, returncodes=(), calls=None):
        """Run deploy() against a fake rclone, returning each (argv, env) it saw."""
        calls = [] if calls is None else calls
        codes = list(returncodes)
        def run(argv, env):
            calls.append((argv, env))
            return subprocess.CompletedProcess(argv, codes.pop(0) if codes else 0)
        with contextlib.redirect_stdout(io.StringIO()):
            deploy.deploy(root, self.HOST, run=run)
        return calls

    def test_assets_then_other_files_then_html_then_an_unfiltered_sync(self):
        with tempfile.TemporaryDirectory() as directory:
            calls = self.deploy(build(directory))
        argvs = [argv for argv, _ in calls]
        self.assertEqual([argv[1] for argv in argvs], ['copy', 'copy', 'copy', 'sync'])
        self.assertEqual([argv[-1] for argv in argvs[:3]], [
            'Cache-Control: public, max-age=31536000, immutable',
            'Cache-Control: public, max-age=300',
            'Cache-Control: no-cache',
        ])
        for flag in ('--include', '--exclude', '--header-upload', '--delete-excluded'):
            self.assertNotIn(flag, argvs[3])
        for argv in argvs:
            self.assertEqual(argv[2:4], [directory, 'oss:omarchy-site-cn'])
            self.assertIn('--checksum', argv)

    def test_the_remote_comes_from_the_environment(self):
        with tempfile.TemporaryDirectory() as directory:
            calls = self.deploy(build(directory))
        for argv, env in calls:
            self.assertEqual(env['RCLONE_CONFIG_OSS_TYPE'], 's3')
            self.assertEqual(env['RCLONE_CONFIG_OSS_PROVIDER'], 'Alibaba')
            self.assertEqual(env['RCLONE_CONFIG_OSS_ENDPOINT'], 'oss-cn-shanghai.aliyuncs.com')
            self.assertEqual(env['PATH'], os.environ['PATH'])

    def test_a_broken_build_never_reaches_rclone(self):
        with tempfile.TemporaryDirectory() as directory:
            root = build(directory, omit=('index.html',))
            calls = []
            with self.assertRaisesRegex(ValueError, 'Missing required build file'):
                deploy.deploy(root, self.HOST, run=lambda argv, env: calls.append(argv))
        self.assertEqual(calls, [])

    def test_a_failed_pass_stops_the_rest(self):
        # Above all the sync: deleting after a failed upload would take pages
        # down that the build still has.
        with tempfile.TemporaryDirectory() as directory:
            calls = []
            with self.assertRaisesRegex(RuntimeError, 'rclone copy failed'):
                self.deploy(build(directory), returncodes=(0, 1), calls=calls)
        self.assertEqual(len(calls), 2)
