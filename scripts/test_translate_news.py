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

    def test_accepts_inline_markup_reordered_within_its_paragraph(self):
        # A verb-final language moves a sentence's links and code to where its grammar puts them.
        post = {'title': 'Thanks', 'html': '<p>Thanks to <a href="/a">@one</a> and <a href="/b">@two</a> for <code>x</code>.</p>\n<p>See <a href="/c">this</a>.</p>'}
        value = {'title': 'ありがとう', 'html': '<p><code>x</code>について<a href="/b">@two</a>と<a href="/a">@one</a>に感謝します。</p>\n<p><a href="/c">こちら</a>を参照。</p>'}
        self.assertEqual(worker.validate_translation(post, value), value)

    def test_rejects_inline_markup_that_leaves_its_paragraph_or_breaks(self):
        post = {'title': 'Thanks', 'html': '<p>Thanks to <a href="/a">@one</a> and <a href="/b"><strong>@two</strong></a>.</p>\n<p>See <code>x</code>.</p>'}
        for html in ['<p>感謝 <a href="/a">@one</a>.</p>\n<p><a href="/b"><strong>@two</strong></a> <code>x</code>.</p>',
                     '<p><a href="/a">@one</a> <a href="/b"><strong>@two</strong></a> <a href="/b">@two</a>.</p>\n<p><code>x</code>.</p>',
                     '<p><a href="/a">@one</a> <strong><a href="/b">@two</strong></a>.</p>\n<p><code>x</code>.</p>',
                     '<p><a href="/a">@one</a> <a href="/b"><strong>@two</strong></a>.</p>\n<p><code>y</code>.</p>',
                     '<p><a href="/a" class="x">@one</a> <a href="/b"><strong>@two</strong></a>.</p>\n<p><code>x</code>.</p>']:
            with self.subTest(html=html), self.assertRaises(worker.TranslationError):
                worker.validate_translation(post, {'title': 'ありがとう', 'html': html})

    def test_translated_attribute_text_and_prose_may_use_any_script(self):
        post = {'title': 'T', 'html': '<p>Less &lt; more <img src="/a.png" alt="Picture" /></p>'}
        value = {'title': 'T', 'html': '<p>少ない &lt; 多い <img src="/a.png" alt="写真" /></p>'}
        self.assertEqual(worker.validate_translation(post, value), value)
        post = {'title': 'T', 'html': '<p title="Text">Hello</p>'}
        value = {'title': 'T', 'html': '<p title="写真 > 説明">こんにちは</p>'}
        self.assertEqual(worker.validate_translation(post, value), value)

    def test_reordering_never_reaches_inside_code_or_across_parents(self):
        cases = [
            # Code keeps its text and tags in order, so a command cannot be rearranged.
            ('<p><code>rm <b>safe</b></code></p>', '<p><code>safe<b>rm </b></code></p>'),
            ('<p><code>a</code> and <code>b</code></p>', '<p><code>a<code>b</code></code></p>'),
            # Each parent keeps its own inline children, whatever the parent is.
            ('<main><a href="/a">one</a></main><main><a href="/b">two</a></main>',
             '<main><a href="/a">eins</a><a href="/b">zwei</a></main><main></main>'),
            # Unusual markup elsewhere does not switch nesting checks off.
            ('<a href="/a"><div>Hello</div></a><p><b>one</b><i>two</i></p>',
             '<a href="/a"><div>Hej</div></a><p><b>en<i>to</b></i></p>'),
            # A self-closed non-void tag opens an element in a browser.
            ('<p><a href="/a">x</a><b>one</b></p>', '<p><b><a href="/a"/>en</b></p>'),
            ('<p><a href="/a">x</a></p>', '<p><a href="/a">x</a onclick="alert(1)"></p>'),
            ('<p><a href="/a">x</a></p>', '<p><a href="/a">x</a/onclick="alert(1)"></p>'),
            # A tag left unfinished at the end becomes an element once the page closes around it.
            ('<p>Hello</p>', '<p>Hej</p><img src=x onerror=alert(1) '),
            ('<p>Hello', '<p>Hej<img src=x onerror=alert(1) '),
            # U+212A, the Kelvin sign, lowercases to k in Python and to nothing in a browser.
            ('<blockquote><code>x</code></blockquote><a href="/a">Read</a>',
             '<blockquote><code>x</code></blocKquote><a href="/a">Læs</a>'),
            ('<blockquote>Hi</blockquote>', '<blocKquote>Hej</blocKquote>'),
            # A link wrapping a block is not sentence markup, so its block cannot move with it.
            ('<main><a href="/a"><div>A</div></a><a href="/b"><div>B</div></a></main>',
             '<main><a href="/b"><div>B</div></a><a href="/a"><div>A</div></a></main>'),
        ]
        for source, html in cases:
            with self.subTest(html=html), self.assertRaises(worker.TranslationError):
                worker.validate_translation({'title': 'T', 'html': source}, {'title': 'T', 'html': html})

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
