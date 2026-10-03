#!/usr/bin/env python3
"""Deploy the zh-CN build to an Aliyun OSS bucket.

omarchy.cn serves traffic from mainland China, so its build is deployed to an
Aliyun OSS bucket in a mainland region. Every other locale keeps using
deploy:locale.

  --check        validate dist/zh-CN (no network, no credentials)
  --deploy HOST  check, then upload dist/zh-CN with rclone and delete what the
                 build dropped

HOST is the bucket domain, <bucket>.oss-<region>.aliyuncs.com. rclone reads the
credentials from RCLONE_CONFIG_OSS_ACCESS_KEY_ID and
RCLONE_CONFIG_OSS_SECRET_ACCESS_KEY; this script never handles them.
ref: https://rclone.org/s3/
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

LOCALE = 'zh-CN'
ROOT = Path(__file__).resolve().parent.parent
REQUIRED = ('index.html', '404.html', 'news/index.html', 'news/rss.xml', 'themes/index.html')
HOST = re.compile(r'^([a-z0-9][a-z0-9-]{1,61}[a-z0-9])\.(oss-[a-z0-9-]+\.aliyuncs\.com)$')

# Three copies then one sync, because --header-upload takes one value per
# invocation. Assets go up before HTML, so a page never references an asset
# that is not there yet. The sync carries no filter and no header: it copies
# nothing, since the copies already did, and exists to delete what the build
# dropped. It must stay unfiltered for that to be complete -- rclone ignores
# excluded files on both sides, so a filtered sync would leave stale objects
# outside its filter in place.
# ref: https://rclone.org/filtering/
PASSES = (
    ('copy', ('--include', '/_astro/**'), 'public, max-age=31536000, immutable'),
    ('copy', ('--exclude', '/_astro/**', '--exclude', '*.html'), 'public, max-age=300'),
    ('copy', ('--include', '*.html'), 'no-cache'),
    ('sync', (), None),
)

# --checksum compares the MD5 rclone reads from the bucket listing, so an
# unchanged file is skipped without a request of its own; every object is
# written whole, so its ETag is that MD5. --size-only would be cheaper still but
# cannot see an edit that leaves a file the same length. Stats are logged at
# INFO, below rclone's default NOTICE, so without --stats-log-level the log
# records nothing about what was copied.
# ref: https://rclone.org/docs/#c-checksum
COMMON = ('--checksum', '--fast-list', '--transfers', '32', '--checkers', '32',
          '--stats-log-level', 'NOTICE')


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
    # rclone skips symlinks unless told to follow them, and the deploy still
    # succeeds, so a linked page would go missing without anything failing.
    for path in files:
        if path.is_symlink():
            raise ValueError(f'Build contains a symlink: {path}')
    total = sum(path.stat().st_size for path in files)
    print(f'{len(files)} files, {total} bytes, CNAME {cname}: deployable', flush=True)


def parse_host(host):
    """Split the bucket domain into the bucket and the endpoint rclone needs."""
    match = HOST.match(host or '')
    if not match:
        raise ValueError(f'{host!r} is not a bucket domain, <bucket>.oss-<region>.aliyuncs.com')
    return match.group(1), match.group(2)


def commands(directory, bucket):
    for verb, selection, cache_control in PASSES:
        argv = ['rclone', verb, str(directory), f'oss:{bucket}', *COMMON, *selection]
        if cache_control:
            argv += ['--header-upload', f'Cache-Control: {cache_control}']
        yield argv


def deploy(directory, host, run=subprocess.run):
    check(directory)
    bucket, endpoint = parse_host(host)
    # The remote is defined entirely in the environment, so no config file is
    # written and no credential appears in argv.
    # ref: https://rclone.org/docs/#config-file
    env = dict(os.environ,
               RCLONE_CONFIG_OSS_TYPE='s3',
               RCLONE_CONFIG_OSS_PROVIDER='Alibaba',
               RCLONE_CONFIG_OSS_ENDPOINT=endpoint)
    print(f'deploying {directory} to oss:{bucket} via {endpoint}', flush=True)
    for argv in commands(directory, bucket):
        print('+', ' '.join(argv), flush=True)
        if run(argv, env=env).returncode != 0:
            raise RuntimeError(f'rclone {argv[1]} failed')


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--check', action='store_true', help='validate the build')
    group.add_argument('--deploy', metavar='HOST', help='check, then deploy to the bucket at HOST')
    args = parser.parse_args()
    directory = Path('dist') / LOCALE
    if args.deploy:
        deploy(directory, args.deploy)
    else:
        check(directory)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        sys.exit(f'zh-CN deployment failed: {error}')
