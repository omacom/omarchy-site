#!/usr/bin/env python3
"""Find kana in Korean translation prose; report candidates, never edit files."""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
# Shared CJK ideographs alone cannot distinguish Korean, Chinese and Japanese.
# Exclude shared punctuation such as the middle dot and long dash.
KANA = re.compile(r'[\u3041-\u3096\u3099-\u309f\u30a1-\u30fa\u30fd-\u30ff'
                  r'\u31f0-\u31ff\uff66-\uff9f\U0001aff0-\U0001afff\U0001b000-\U0001b16f]+')
LITERALS = re.compile(r'```[\s\S]*?```|`[^`\n]*`|(?:https?://|mailto:)[^\s<>]+|\$?\{\{?[^{}\n]+\}\}?')
BLOCKS = {'p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'figcaption'}
PROTECTED = {'code', 'pre', 'script', 'style'}


class Prose(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.units = []
        self.chunks = []
        self.protected_depth = 0
        self.feed(text)
        self.close()
        self.flush()

    def flush(self):
        if self.chunks:
            self.units.append((self.chunks[0][0], ''.join(text for _, text in self.chunks)))
            self.chunks = []

    def handle_starttag(self, tag, attrs):
        if tag in BLOCKS and not self.protected_depth:
            self.flush()
        if tag in PROTECTED:
            self.protected_depth += 1
            # Keep the prose on either side from joining into one word.
            self.chunks.append((self.getpos()[0], ' '))
        if not self.protected_depth:
            for name, value in attrs:
                if name in {'alt', 'title', 'aria-label'} and value:
                    self.units.append((self.getpos()[0], value))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag in PROTECTED:
            self.protected_depth -= 1

    def handle_endtag(self, tag):
        if tag in PROTECTED:
            self.protected_depth -= 1
        if tag in BLOCKS and not self.protected_depth:
            self.flush()

    def handle_data(self, text):
        if not self.protected_depth:
            self.chunks.append((self.getpos()[0], text))


def candidates(text):
    for line, prose in Prose(text).units:
        cleaned = ' '.join(LITERALS.sub(' ', prose).split())
        for sentence in re.split(r'(?<=[.!?。！？])\s+', cleaned):
            evidence = KANA.findall(sentence)
            if evidence:
                yield {'line': line, 'sentence': sentence, 'kana': evidence}


def scan(root):
    findings = []
    units = 0

    def check(path, key, text, line=1):
        nonlocal units
        units += 1
        for finding in candidates(text):
            findings.append({'source': str(path.relative_to(root)), 'key': key,
                             **finding, 'line': line + finding['line'] - 1})

    for relative in ['src/i18n/messages/ko.json', 'src/i18n/ko/blocks.json', 'src/i18n/ko/news.json']:
        path = root / relative
        source = path.read_text(encoding='utf-8')
        for key, value in json.loads(source).items():
            text = value['title'] if path.name == 'news.json' else value
            # Location is the start of the JSON entry, or of the HTML prose block.
            start = source.index(json.dumps(key, ensure_ascii=False))
            check(path, key, text, source.count('\n', 0, start) + 1)
    for path in sorted((root / 'src/i18n/ko/news').glob('*.html')):
        check(path, path.stem, path.read_text(encoding='utf-8'))
    return units, findings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Repository root (default: this checkout)')
    parser.add_argument('--json', action='store_true', help='Machine-readable source/key/line/sentence/kana results')
    args = parser.parse_args()
    units, findings = scan(args.root.resolve())
    if args.json:
        print(json.dumps({'checked': units, 'candidates': findings}, ensure_ascii=False, indent=2))
    else:
        for finding in findings:
            print(f"{finding['source']}:{finding['line']} [{finding['key']}]")
            print(f"  Kana: {', '.join(finding['kana'])} | {finding['sentence']}")
        print(f'Korean Japanese-script check: {units} source units; {len(findings)} candidates.')
        if findings:
            print('Human review required: Japanese names/quotes may be intentional. No files changed.')
    return 1 if findings else 0


if __name__ == '__main__':
    raise SystemExit(main())
