#!/usr/bin/env python3
"""Pass disjoint language changes from matrix runners to one commit job."""
import argparse
import json
import os
from pathlib import Path
import subprocess


def git(*args, **kwargs):
    return subprocess.run(['git', *args], check=True, **kwargs)


def language_paths(locale):
    registry = json.loads(Path('src/i18n/locales.json').read_text())
    if locale == 'en' or locale not in registry or registry[locale].get('contentLocale', locale) != locale:
        raise ValueError('Unknown content language')
    return [f'src/i18n/messages/{locale}.json', f'src/i18n/{locale}/blocks.json',
            f'src/i18n/{locale}/news.json', f'src/i18n/{locale}/news']


def pack(locale, directory):
    paths = [path for path in language_paths(locale) if Path(path).exists()]
    if paths:
        git('add', '--', *paths)
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / f'{locale}.patch').open('wb') as out:
        git('diff', '--cached', '--binary', '--no-renames', '--', *language_paths(locale), stdout=out)


def collect(directory, expected):
    patches = sorted(directory.glob('*.patch'))
    if any(path.stem not in expected for path in patches):
        raise ValueError('Unexpected language artifact')
    for patch in patches:
        allowed = language_paths(patch.stem)
        if not patch.stat().st_size:
            continue
        result = git('apply', '--numstat', '-z', str(patch), capture_output=True)
        for record in result.stdout.split(b'\0'):
            if not record:
                continue
            path = record.decode().split('\t', 2)[2]
            if path not in allowed[:3] and not (path.startswith(allowed[3] + '/') and
                                               Path(path).suffix == '.html' and
                                               '..' not in Path(path).parts):
                raise ValueError('Artifact contains a path outside its language')
        git('apply', '--index', str(patch))
    missing = sorted(set(expected) - {path.stem for path in patches})
    summary = f'Collected {len(patches)} language results. Missing runners: {", ".join(missing) or "none"}.\n'
    print(summary, end='')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as out:
            out.write(summary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    pack_parser = sub.add_parser('pack')
    pack_parser.add_argument('locale')
    pack_parser.add_argument('directory', type=Path)
    collect_parser = sub.add_parser('collect')
    collect_parser.add_argument('directory', type=Path)
    args = parser.parse_args()
    if args.command == 'pack':
        pack(args.locale, args.directory)
    else:
        collect(args.directory, json.loads(os.environ['EXPECTED_LOCALES']))


if __name__ == '__main__':
    main()
