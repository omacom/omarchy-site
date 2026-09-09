import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('artifact', Path(__file__).with_name('translation-artifact.py'))
artifact = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(artifact)
NEWS = importlib.util.spec_from_file_location('worker', Path(__file__).with_name('translate-news.py'))
worker = importlib.util.module_from_spec(NEWS)
NEWS.loader.exec_module(worker)


class QueueTests(unittest.TestCase):
    def test_locale_filter_precedes_limit(self):
        jobs = [{'locale': code, 'slug': str(i)} for i, code in enumerate(['nl', 'da', 'da'])]
        self.assertEqual(worker.select_jobs(jobs, {'da': 'Danish'}, 'da', 1), [jobs[1]])
        self.assertEqual(worker.select_jobs(jobs, {'da': 'Danish'}, 'da'), jobs[1:])
        self.assertEqual(worker.select_jobs(jobs, {}, limit=1), jobs[:1])
        self.assertEqual(worker.select_jobs([], {'da': 'Danish'}, 'da'), [])
        with self.assertRaises(worker.TranslationError):
            worker.select_jobs(jobs, {'da': 'Danish'}, 'unknown')


class ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        cwd = os.getcwd()
        self.addCleanup(os.chdir, cwd)
        os.chdir(self.temp.name)
        subprocess.run(['git', 'init', '-q'], check=True)
        self.write('src/i18n/locales.json', {'en': {}, 'da': {}, 'nl': {}})
        for code in ['da', 'nl']:
            self.write(f'src/i18n/messages/{code}.json', {'Hello': 'old'})
            self.write(f'src/i18n/{code}/news.json', {})
        artifact.git('add', '.')
        artifact.git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'base')

    def write(self, path, data):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data))

    def restore(self):
        artifact.git('reset', '--hard', '-q', 'HEAD')

    def test_disjoint_results_new_files_and_partial_failure(self):
        self.write('src/i18n/messages/da.json', {'Hello': 'Hej'})
        self.write('src/i18n/messages/nl.json', {'Hello': 'must not escape'})
        self.write('src/i18n/da/news/new.html', 'article')
        artifact.pack('da', Path('artifacts'))
        self.restore()
        artifact.collect(Path('artifacts'), ['da', 'nl'])
        self.assertEqual(json.loads(Path('src/i18n/messages/da.json').read_text()), {'Hello': 'Hej'})
        self.assertEqual(json.loads(Path('src/i18n/messages/nl.json').read_text()), {'Hello': 'old'})
        self.assertTrue(Path('src/i18n/da/news/new.html').exists())

    def test_collects_multiple_languages(self):
        for code in ['da', 'nl']:
            self.write(f'src/i18n/messages/{code}.json', {'Hello': code})
            artifact.pack(code, Path('artifacts'))
            self.restore()
        artifact.collect(Path('artifacts'), ['da', 'nl'])
        for code in ['da', 'nl']:
            self.assertEqual(json.loads(Path(f'src/i18n/messages/{code}.json').read_text()), {'Hello': code})

    def test_empty_and_absent_results(self):
        artifact.pack('da', Path('artifacts'))
        artifact.collect(Path('artifacts'), ['da', 'nl'])
        artifact.collect(Path('absent'), [])

    def test_rejects_unexpected_language_and_foreign_paths(self):
        self.write('src/i18n/messages/nl.json', {'Hello': 'Hallo'})
        artifact.pack('nl', Path('artifacts'))
        self.restore()
        with self.assertRaisesRegex(ValueError, 'Unexpected'):
            artifact.collect(Path('artifacts'), ['da'])
        Path('artifacts/nl.patch').rename('artifacts/da.patch')
        with self.assertRaisesRegex(ValueError, 'outside'):
            artifact.collect(Path('artifacts'), ['da'])

    def test_rejects_unknown_or_english_language(self):
        for code in ['en', '../../bad', 'xx']:
            with self.subTest(code=code), self.assertRaises(ValueError):
                artifact.pack(code, Path('artifacts'))


if __name__ == '__main__':
    unittest.main()
