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

SPEC = importlib.util.spec_from_file_location('translate_site', Path(__file__).with_name('translate-site.py'))
worker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(worker)


def entry(source, kind='messages', locale='da'):
    return {'locale': locale, 'kind': kind, 'source': source}


class ValidationTests(unittest.TestCase):
    def test_fragments_allow_translation_but_preserve_markup(self):
        source = '<a href="/news" title="News">Read <strong>more</strong></a>'
        value = '<a href="/news" title="Nyheder">Læs <strong>mere</strong></a>'
        self.assertEqual(worker.validate_value(source, value), value)
        for invalid in [value.replace('/news', '/other'), value + '<script>x()</script>',
                        value.replace('title=', 'onclick='), value.replace('strong', 'em')]:
            with self.subTest(value=invalid), self.assertRaises(worker.TranslationError):
                worker.validate_value(source, invalid)

    def test_plain_text_cannot_introduce_html(self):
        with self.assertRaises(worker.TranslationError):
            worker.validate_value('Hello', '<b>Hej</b>')
        with self.assertRaises(worker.TranslationError):
            worker.validate_value('Hello', '')

    def test_placeholder_counts_and_commands_are_preserved(self):
        source = 'Run `omarchy-update` for {name}: %s ${version} {{count}} %(other)s %1$d'
        value = 'Kør `omarchy-update` for {name}: %s ${version} {{count}} %(other)s %1$d'
        self.assertEqual(worker.validate_value(source, value), value)
        for bad in [value.replace('{name}', '{navn}'), value + ' %s',
                    value.replace('omarchy-update', 'omarchy-opdater'), value.replace('%1$d', '%2$d')]:
            with self.subTest(value=bad), self.assertRaises(worker.TranslationError):
                worker.validate_value(source, bad)

    def test_localized_numeric_formatting_is_allowed_but_value_changes_fail(self):
        worker.validate_value('Over 1,000 downloads', 'Over 1.000 downloads')
        worker.validate_value('29 languages', '٢٩ لغة')
        worker.validate_value('Over 1,000 downloads', 'Plus de 1 000 téléchargements')
        with self.assertRaises(worker.TranslationError):
            worker.validate_value('29 languages', '28 sprog')
        with self.assertRaises(worker.TranslationError):
            worker.validate_value('29 languages', 'sprog')

    def test_spelled_out_numbers_may_become_numerals(self):
        worker.validate_value('ten principles', '10の原則')
        worker.validate_value('more than twenty years', '20年以上')
        worker.validate_value('29 languages and ten themes', '29言語と10テーマ')

    def test_code_and_empty_paragraphs_rejected(self):
        with self.assertRaises(worker.TranslationError):
            worker.validate_value('<p>Hello</p><p><code>ls</code></p>', '<p>Hej</p><p><code>cd</code></p>')
        with self.assertRaises(worker.TranslationError):
            worker.validate_value('<p>Hello</p><p>World</p>', '<p>Hej</p><p> </p>')

    def test_batch_decoding_retains_valid_items(self):
        items = {'0': 'Hello', '1': 'World'}
        valid, errors = worker.decode_batch('{"0":"Hej","1":""}', items)
        self.assertEqual(valid, {'0': 'Hej'})
        self.assertEqual(set(errors), {'1'})
        valid, errors = worker.decode_batch('[{"id":"0","translation":"Hej"},{"id":"1","translation":"Verden"}]', items)
        self.assertEqual(valid, {'0': 'Hej', '1': 'Verden'})
        self.assertFalse(errors)
        with self.assertRaises(worker.TranslationError):
            worker.decode_batch('{"2":"Hej"}', items)

    def test_retries_only_invalid_items_and_retains_partial_success(self):
        responses = [subprocess.CompletedProcess([], 0, '{"0":"Hej","1":""}', ''),
                     subprocess.TimeoutExpired(['muse'], 300),
                     subprocess.CompletedProcess([], 0, '{"1":""}', '')]
        prompts = []

        def run(command, **kwargs):
            prompts.append(Path(command[command.index('--prompt-file') + 1]).read_text())
            value = responses.pop(0)
            if isinstance(value, Exception):
                raise value
            return value

        batch = worker.batch_jobs([entry('Hello'), entry('World')])[0]
        with patch.object(worker.subprocess, 'run', side_effect=run) as invoked, patch.object(worker.time, 'sleep'):
            valid, errors = worker.muse_translate(batch, 'Dansk', 'test')
        self.assertEqual(valid, {'0': 'Hej'})
        self.assertEqual(set(errors), {'1'})
        self.assertEqual(invoked.call_count, 3)
        self.assertNotIn('"0":', prompts[1])
        self.assertEqual(invoked.call_args.kwargs['timeout'], 300)


class BatchTests(unittest.TestCase):
    def test_batches_by_locale_kind_count_and_size(self):
        pending = [entry(f'String {n}') for n in range(21)] + [entry('Other', 'blocks'), entry('Other', locale='fr')]
        batches = worker.batch_jobs(pending)
        self.assertEqual([len(batch['items']) for batch in batches], [20, 1, 1, 1])
        sized = worker.batch_jobs([entry('a' * 5000), entry('b' * 5000)])
        self.assertEqual(len(sized), 2)
        self.assertEqual(len(worker.batch_jobs([entry('a' * 9000)])), 1)

    def test_duplicate_sources_are_not_queued_twice(self):
        self.assertEqual(len(worker.batch_jobs([entry('Hello'), entry('Hello')])[0]['items']), 1)


class ProcessingTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.path = self.root / 'src/i18n/messages/da.json'
        self.path.parent.mkdir(parents=True)
        self.path.write_text(json.dumps({'Existing': 'Eksisterende'}))

    def test_parallel_merges_and_partial_failure(self):
        pending = [entry('Hello'), entry('World'), entry('Broken')]
        batches = [worker.batch_jobs([e])[0] for e in pending]
        barrier = threading.Barrier(2)

        def translate(batch, *args):
            source = batch['items']['0']
            if source == 'Broken':
                return {}, {'0': 'empty translation'}
            barrier.wait(timeout=5)
            return {'0': {'Hello': 'Hej', 'World': 'Verden'}[source]}, {}

        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            saved, failed = worker.process_batches(self.root, batches, {'da': 'Dansk'}, 3, 'test', translate,
                                                    lambda root: pending)
        self.assertEqual((saved, failed), (2, 1))
        self.assertEqual(json.loads(self.path.read_text()), {'Existing': 'Eksisterende', 'Hello': 'Hej', 'World': 'Verden'})

    def test_recollection_discards_removed_sources_and_filled_values(self):
        batch = worker.batch_jobs([entry('Removed'), entry('Existing'), entry('Hello')])[0]
        with patch.object(worker, 'collect_pending'):
            saved = worker.save_batch(self.root, batch, {'0': 'Fjernet', '1': 'Changed', '2': 'Hej'},
                                      threading.Lock(), lambda root: [entry('Existing'), entry('Hello')])
        self.assertEqual(saved, 1)
        self.assertEqual(json.loads(self.path.read_text()), {'Existing': 'Eksisterende', 'Hello': 'Hej'})

    def test_source_recollection_failure_leaves_catalogue_untouched(self):
        batch = worker.batch_jobs([entry('Hello')])[0]

        def fail(root):
            raise subprocess.TimeoutExpired(['node'], 60)

        with self.assertRaises(subprocess.TimeoutExpired):
            worker.save_batch(self.root, batch, {'0': 'Hej'}, threading.Lock(), fail)
        self.assertEqual(json.loads(self.path.read_text()), {'Existing': 'Eksisterende'})

    def test_blocks_write_to_separate_catalogue(self):
        batch = worker.batch_jobs([entry('<em>Hello</em>', 'blocks')])[0]
        pending = [entry('<em>Hello</em>', 'blocks')]
        worker.save_batch(self.root, batch, {'0': '<em>Hej</em>'}, threading.Lock(), lambda root: pending)
        self.assertEqual(json.loads((self.root / 'src/i18n/da/blocks.json').read_text()), {'<em>Hello</em>': '<em>Hej</em>'})


if __name__ == '__main__':
    unittest.main()
