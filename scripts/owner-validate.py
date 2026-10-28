#!/usr/bin/env python3
"""Validate one language owner's workspace output against its English sources.

This file is copied into each owner's workspace as tools/validate.py, next to
copies of translate-news.py and translate-site.py, so the Muse agent can check
its own work with the same validators the repository uses. It reads:

    sources/messages.json   {"English string": null, ...}
    sources/blocks.json     {"<p>English HTML</p>": null, ...}
    sources/news/<slug>.json {"title": ..., "html": ...}
    out/messages.json       {"English string": "translation", ...}
    out/blocks.json         {"<p>English HTML</p>": "<p>translated HTML</p>", ...}
    out/news/<slug>.json    {"title": ..., "html": ...}

and prints a report of what is done, missing, and invalid. Exit status 0 means
every source has a valid translation. Run it as often as you like; it changes
nothing. Pass --json for machine-readable output.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
WORKSPACE = HERE.parent


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), HERE / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read_json(path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except ValueError as exc:
        raise SystemExit(f'{path.relative_to(WORKSPACE)} is not valid JSON: {exc}')


def check_catalogue(kind, validate):
    sources = read_json(WORKSPACE / 'sources' / f'{kind}.json', {})
    out_path = WORKSPACE / 'out' / f'{kind}.json'
    out = read_json(out_path, {})
    if not isinstance(out, dict):
        raise SystemExit(f'out/{kind}.json must be a JSON object mapping each English source to its translation')
    report = {'total': len(sources), 'done': 0, 'missing': [], 'invalid': {}, 'unknown': [], 'unchanged': []}
    for key in out:
        if key not in sources:
            report['unknown'].append(key)
    for key in sources:
        value = out.get(key)
        if value is None or (isinstance(value, str) and not value.strip()):
            report['missing'].append(key)
            continue
        try:
            validate(key, value)
            report['done'] += 1
            if value == key and len(key) > 24 and ' ' in key:
                # Valid, but identical to English: fine for names and titles, worth a second look otherwise.
                report['unchanged'].append(key)
        except Exception as exc:  # TranslationError
            report['invalid'][key] = str(exc)
    return report


def check_news(validate_translation):
    source_dir = WORKSPACE / 'sources' / 'news'
    out_dir = WORKSPACE / 'out' / 'news'
    report = {'total': 0, 'done': 0, 'missing': [], 'invalid': {}, 'unknown': []}
    slugs = sorted(p.stem for p in source_dir.glob('*.json')) if source_dir.exists() else []
    report['total'] = len(slugs)
    if out_dir.exists():
        report['unknown'] = sorted(p.stem for p in out_dir.glob('*.json') if p.stem not in slugs)
    for slug in slugs:
        post = read_json(source_dir / f'{slug}.json', None)
        value = read_json(out_dir / f'{slug}.json', None)
        if value is None:
            report['missing'].append(slug)
            continue
        try:
            validate_translation(post, value)
            report['done'] += 1
        except Exception as exc:
            report['invalid'][slug] = str(exc)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--json', action='store_true', help='print the full report as JSON')
    parser.add_argument('--show', type=int, default=12, help='how many missing keys to list per section')
    args = parser.parse_args()
    news = load('translate-news')
    site = load('translate-site')
    report = {
        'messages': check_catalogue('messages', site.validate_value),
        'blocks': check_catalogue('blocks', site.validate_value),
        'news': check_news(news.validate_translation),
    }
    complete = all(r['done'] == r['total'] and not r['unknown'] for r in report.values())
    report['complete'] = complete
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=1))
    else:
        for kind, r in report.items():
            if kind == 'complete':
                continue
            print(f"{kind}: {r['done']}/{r['total']} valid, {len(r['missing'])} missing, {len(r['invalid'])} invalid"
                  + (f", {len(r['unknown'])} unknown keys (not in sources; remove them)" if r['unknown'] else ''))
            for key in r['missing'][:args.show]:
                print(f'  missing: {key[:100]!r}')
            if len(r['missing']) > args.show:
                print(f'  ... and {len(r["missing"]) - args.show} more missing')
            for key, error in list(r['invalid'].items())[:args.show]:
                print(f'  invalid: {key[:80]!r}: {error}')
            if len(r['invalid']) > args.show:
                print(f'  ... and {len(r["invalid"]) - args.show} more invalid')
            if r.get('unchanged'):
                print(f"  note: {len(r['unchanged'])} entries are identical to English; fine for names and titles, otherwise translate them:")
                for key in r['unchanged'][:args.show]:
                    print(f'    {key[:100]!r}')
        print('COMPLETE: every source has a valid translation.' if complete else 'INCOMPLETE: keep going.')
    return 0 if complete else 1


if __name__ == '__main__':
    sys.exit(main())
