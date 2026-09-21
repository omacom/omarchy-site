#!/usr/bin/env python3
"""Check the zh-CN build before ossutil publishes it.

omarchy.cn serves traffic from mainland China, so its build is published to an
Aliyun OSS bucket in a mainland region. Every other locale keeps using
deploy:locale.

Transferring the files is ossutil's job -- the official OSS tool -- so this
script does only what ossutil does not: refuse a build that is not publishable,
before anything is uploaded.

  --check   validate dist/zh-CN (no network, no credentials)
"""
import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlparse

LOCALE = 'zh-CN'
ROOT = Path(__file__).resolve().parent.parent
REQUIRED = ('index.html', '404.html', 'news/index.html', 'news/rss.xml', 'themes/index.html')


def expected_domain():
    """The locale's domain from the registry, rather than a hardcoded host.

    The build writes CNAME from the same source, so this check stays honest
    when the registry changes and needs no edit alongside it.
    """
    registry = json.loads((ROOT / 'src' / 'i18n' / 'locales.json').read_text())
    return urlparse(registry[LOCALE]['domain']).hostname


def check(directory):
    domain = expected_domain()
    cname = (directory / 'CNAME').read_text().strip()
    if cname != domain:
        raise ValueError(f'Build CNAME is {cname}, expected {domain}')
    for key in REQUIRED:
        if not (directory / key).is_file():
            raise ValueError(f'Missing required build file: {key}')
    files = [path for path in directory.rglob('*') if not path.is_dir()]
    # ossutil follows symlinks; a link escaping the build would publish
    # whatever it points at.
    for path in files:
        if path.is_symlink():
            raise ValueError(f'Build contains a symlink: {path}')
    total = sum(path.stat().st_size for path in files)
    print(f'{len(files)} files, {total} bytes, CNAME {cname}: publishable', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', required=True,
                        help='validate the build')
    parser.parse_args()
    check(Path('dist') / LOCALE)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        sys.exit(f'zh-CN deployment check failed: {error}')
