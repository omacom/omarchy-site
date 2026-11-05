import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('translate_news', Path(__file__).with_name('translate-news.py'))
worker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(worker)


class ValidationTests(unittest.TestCase):
    def setUp(self):
        self.post = {'title': 'Hello', 'html': '<p>Hello <a href="/one" title="More">world</a>.</p>\n<p><img src="/a.png" alt="Picture" /></p>'}
        self.value = {'title': 'Hej', 'html': '<p>Hej <a href="/one" title="Mere">verden</a>.</p>\n<p><img src="/a.png" alt="Billede" /></p>'}

    def test_accepts_translated_text_and_accessible_attributes(self):
        self.assertEqual(worker.validate_translation(self.post, self.value), self.value)

    def test_rejects_changed_structure_links_and_executable_attributes(self):
        for html in [self.value['html'].replace('/one', '/two'),
                     self.value['html'].replace('/a.png', '/b.png'),
                     self.value['html'].replace('<p>', '<div>', 1),
                     self.value['html'].replace('alt="Billede"', 'alt="Billede" onerror="alert(1)"'),
                     self.value['html'] + '<script>alert(1)</script>',
                     self.value['html'].replace('title="Mere"', 'title="Mere" title="Other"'),
                     self.value['html'].replace('Hej ', '').replace('verden', '').replace('.</p>', '</p>')]:
            with self.subTest(html=html), self.assertRaises(worker.TranslationError):
                worker.validate_translation(self.post, {**self.value, 'html': html})

    def test_rejects_empty_title_and_code_changes(self):
        with self.assertRaises(worker.TranslationError):
            worker.validate_translation(self.post, {**self.value, 'title': ' '})
        with self.assertRaises(worker.TranslationError):
            worker.validate_translation({'html': '<p><code>rm file</code></p>'},
                                        {'title': 'Hej', 'html': '<p><code>rm other</code></p>'})

    def test_parses_plain_and_fenced_json_only(self):
        for text in [json.dumps(self.value), '```json\n' + json.dumps(self.value) + '\n```']:
            self.assertEqual(worker.parse_response(text), self.value)
        with self.assertRaises(worker.TranslationError):
            worker.parse_response('Some explanation ' + json.dumps(self.value))

    def test_retries_invalid_output_and_timeout_without_logging_output(self):
        responses = [subprocess.TimeoutExpired(['muse'], 300),
                     subprocess.CompletedProcess([], 0, 'private invalid output', ''),
                     subprocess.CompletedProcess([], 0, json.dumps(self.value), '')]
        with patch.object(worker.subprocess, 'run', side_effect=responses) as run, patch.object(worker.time, 'sleep'):
            self.assertEqual(worker.muse_translate(self.post, 'da', 'Dansk', 'test-model'), self.value)
        self.assertEqual(run.call_count, 3)
        self.assertEqual(run.call_args.kwargs['timeout'], 300)
        command = run.call_args.args[0]
        for flag in ['--disable-write', '--disable-shell', '--disable-web-tools', '--no-foreign-personal-context', '--no-session-log']:
            self.assertIn(flag, command)

    def test_retry_budget_is_bounded(self):
        with patch.object(worker.subprocess, 'run', return_value=subprocess.CompletedProcess([], 1, '', 'secret')) as run, patch.object(worker.time, 'sleep'):
            with self.assertRaisesRegex(worker.TranslationError, 'status 1'):
                worker.muse_translate(self.post, 'da', 'Dansk', 'test-model')
        self.assertEqual(run.call_count, 3)


class ProcessingTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'src/data').mkdir(parents=True)
        (self.root / 'src/i18n/da').mkdir(parents=True)
        self.posts = {slug: {'slug': slug, 'title': slug, 'html': '<p>Hello</p>'} for slug in ['one', 'two', 'broken']}
        self.source_path = self.root / 'src/data/news-posts.json'
        self.source_path.write_text(json.dumps(list(self.posts.values())))
        self.metadata_path = self.root / 'src/i18n/da/news.json'
        self.metadata_path.write_text(json.dumps({'existing': {'title': 'Existing', 'sourceHash': 'old'}}))
        self.jobs = [{'locale': 'da', 'slug': slug, 'sourceHash': worker.source_hash(post)} for slug, post in self.posts.items()]

    def test_partial_success_and_concurrent_metadata_merges(self):
        barrier = threading.Barrier(2)

        def translate(post, *args):
            if post['slug'] == 'broken':
                raise worker.TranslationError('invalid translation')
            barrier.wait(timeout=5)
            return {'title': 'Hej ' + post['slug'], 'html': '<p>Hej</p>'}

        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            failures = worker.process_jobs(self.root, self.jobs, self.posts, {'da': 'Dansk'}, 3, 'test', translate)
        self.assertEqual(failures, 1)
        metadata = json.loads(self.metadata_path.read_text())
        self.assertEqual(set(metadata), {'existing', 'one', 'two'})
        for job in self.jobs[:2]:
            self.assertEqual(metadata[job['slug']]['sourceHash'], job['sourceHash'])
            self.assertTrue((self.root / f"src/i18n/da/news/{job['slug']}.html").exists())

    def test_source_change_during_generation_prevents_write(self):
        def translate(post, *args):
            updated = [dict(p, title='Changed') for p in self.posts.values()]
            self.source_path.write_text(json.dumps(updated))
            return {'title': 'Hej', 'html': '<p>Hej</p>'}

        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            failures = worker.process_jobs(self.root, self.jobs[:1], self.posts, {'da': 'Dansk'}, 1, 'test', translate)
        self.assertEqual(failures, 1)
        self.assertEqual(set(json.loads(self.metadata_path.read_text())), {'existing'})
        self.assertFalse((self.root / 'src/i18n/da/news/one.html').exists())

    def test_failed_html_write_never_marks_metadata_fresh(self):
        with patch.object(worker, 'atomic_write', side_effect=OSError('disk full')):
            with self.assertRaises(OSError):
                worker.save_translation(self.root, self.jobs[0], {'title': 'Hej', 'html': '<p>Hej</p>'}, threading.Lock())
        self.assertEqual(set(json.loads(self.metadata_path.read_text())), {'existing'})


if __name__ == '__main__':
    unittest.main()
