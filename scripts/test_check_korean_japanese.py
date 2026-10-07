import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('check_korean_japanese', Path(__file__).with_name('check-korean-japanese.py'))
checker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checker)


class JapaneseScriptTests(unittest.TestCase):
    def test_original_mixed_phrase_and_script_variants(self):
        cases = [('7년近い 경력을 바탕으로 만들었습니다.', ['い']),
                 ('설명에 カタカナ가 남았습니다.', ['カタカナ']),
                 ('설명에 ｶﾅ가 남았습니다.', ['ｶﾅ']),
                 ('경력은 7년近<strong>い</strong>입니다.', ['い']),
                 ('경력은 7년近&#x3044;입니다.', ['い'])]
        for text, evidence in cases:
            with self.subTest(text=text):
                result = list(checker.candidates(text))
                self.assertEqual(len(result), 1)
                self.assertEqual(result[0]['kana'], evidence)
        self.assertEqual(list(checker.candidates('7년에 가까운 경력입니다.')), [])

    def test_code_urls_attributes_and_placeholders_are_not_prose(self):
        text = '''<p>정상 문장. <a href="https://example.org/かな">링크</a>
        https://example.org/カナ `かな` {かな} ${かな} {{かな}}
        <pre><code>かな</code></pre><script>かな</script><style>かな</style>
        <!-- かな --> 한자 漢字 · 中國 ・ 브랜드 Oligarchy.</p>'''
        self.assertEqual(list(checker.candidates(text)), [])
        self.assertEqual(list(checker.candidates('<img src="/かな.png" alt="사진に 설명" />'))[0]['kana'], ['に'])

    def test_block_boundaries_sentences_and_line_locations(self):
        text = '<p>정상 문장.</p>\n<p>첫 문장. 혼입い 문장.</p>\n<p>정상입니다.</p>'
        self.assertEqual(list(checker.candidates(text)), [
            {'line': 2, 'sentence': '혼입い 문장.', 'kana': ['い']}])

    def test_canonical_scope_cli_exit_status_and_no_writes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = {
                'src/i18n/messages/ko.json': {'かな English key': '정상', 'Bad': 'UI에 い 혼입'},
                'src/i18n/ko/blocks.json': {'Bio': '7년近い 경력'},
                'src/i18n/ko/news.json': {'story': {'title': '제목に 혼입', 'sourceHash': 'かな'}},
            }
            for relative, value in data.items():
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
            article = root / 'src/i18n/ko/news/story.html'
            article.parent.mkdir()
            article.write_text('<p>기사カ 혼입</p>', encoding='utf-8')
            before = {p: p.read_bytes() for p in root.rglob('*') if p.is_file()}
            units, findings = checker.scan(root)
            self.assertEqual(units, 5)
            self.assertEqual([f['key'] for f in findings], ['Bad', 'Bio', 'story', 'story'])
            result = subprocess.run(['python3', str(Path(checker.__file__)), '--root', directory, '--json'],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            self.assertEqual(json.loads(result.stdout)['candidates'], findings)
            self.assertEqual(before, {p: p.read_bytes() for p in root.rglob('*') if p.is_file()})
            for path in before:
                path.write_text('{}' if path.suffix == '.json' else '<p>정상</p>', encoding='utf-8')
            result = subprocess.run(['python3', str(Path(checker.__file__)), '--root', directory], capture_output=True)
            self.assertEqual(result.returncode, 0)


if __name__ == '__main__':
    unittest.main()
