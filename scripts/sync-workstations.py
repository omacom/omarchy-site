"""Download new Discord showcase attachments and update the workstation gallery.

Requires DISCORD_BOT_TOKEN with View Channel, Read Message History, and the
Message Content intent. Only reads Discord; never sends messages or changes it.
"""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
GUILD = '1390012484194275541'
CHANNEL = '1430672374159773707'
API = 'https://discord.com/api/v10'


def request(url, token=None):
    headers = {'User-Agent': 'DiscordBot (https://omarchy.org, 1.0)' if token else 'Mozilla/5.0'}
    if token:
        headers['Authorization'] = f'Bot {token}'
    for attempt in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as response:
                data = response.read()
                # Respect Discord's per-route limit before making another call.
                if response.headers.get('X-RateLimit-Remaining') == '0':
                    time.sleep(float(response.headers.get('X-RateLimit-Reset-After', '1')))
                return data
        except urllib.error.HTTPError as error:
            if error.code == 429:
                delay = float(json.loads(error.read()).get('retry_after', 1))
            elif error.code >= 500:
                delay = 2 ** attempt
            else:
                # Don't print signed CDN URLs or authorization headers in CI.
                raise RuntimeError(f'HTTP {error.code} while reading {urllib.parse.urlsplit(url).path}') from None
        except (urllib.error.URLError, TimeoutError):
            delay = 2 ** attempt
        if attempt < 5:
            time.sleep(delay)
    raise RuntimeError(f'Request failed after retries: {urllib.parse.urlsplit(url).path}')


def collect_threads(api):
    threads = {thread['id']: thread for thread in api(f'/guilds/{GUILD}/threads/active')['threads']
               if thread['parent_id'] == CHANNEL}
    before = None
    while True:
        query = {'limit': 100}
        if before:
            query['before'] = before
        page = api(f'/channels/{CHANNEL}/threads/archived/public?{urllib.parse.urlencode(query)}')
        threads.update((thread['id'], thread) for thread in page['threads'])
        if not page['has_more']:
            break
        next_before = page['threads'][-1]['thread_metadata']['archive_timestamp'] if page['threads'] else None
        if not next_before or next_before == before:
            raise RuntimeError('Discord archive pagination did not advance')
        before = next_before
    return sorted(threads.values(), key=lambda thread: int(thread['id']))


def collect_attachments(api, threads):
    attachments = {}
    for index, thread in enumerate(threads):
        before = None
        while True:
            query = {'limit': 100}
            if before:
                query['before'] = before
            messages = api(f"/channels/{thread['id']}/messages?{urllib.parse.urlencode(query)}")
            for message in messages:
                for attachment in message.get('attachments', []):
                    content_type = attachment.get('content_type', '')
                    if content_type.startswith(('image/', 'video/')):
                        attachments[attachment['id']] = {
                            'id': attachment['id'], 'content_type': content_type,
                            'title': thread['name'], 'post': thread['id'],
                            'message': message['id'], 'url': attachment['url'],
                        }
            if len(messages) < 100:
                break
            next_before = messages[-1]['id']
            if next_before == before:
                raise RuntimeError('Discord message pagination did not advance')
            before = next_before
        if (index + 1) % 25 == 0:
            print(f'Read {index + 1}/{len(threads)} forum posts', flush=True)
    return sorted(attachments.values(), key=lambda attachment: int(attachment['id']))


def main():
    token = os.environ.get('DISCORD_BOT_TOKEN')
    if not token:
        raise SystemExit('Set DISCORD_BOT_TOKEN before running the workstation sync.')
    def api(endpoint):
        return json.loads(request(API + endpoint, token))
    # Without this intent Discord silently strips attachment information.
    application = api('/oauth2/applications/@me')
    if not application.get('flags', 0) & ((1 << 18) | (1 << 19)):
        raise SystemExit('Enable Message Content Intent for the Discord bot.')
    channel = api(f'/channels/{CHANNEL}')
    if channel.get('guild_id') != GUILD or channel.get('type') != 15:
        raise RuntimeError('Expected the Omacom workstation forum')
    threads = collect_threads(api)
    if not threads:
        raise RuntimeError('No forum posts are visible; check the bot permissions')
    manifest = collect_attachments(api, threads)
    if not manifest:
        raise RuntimeError('No media is visible; check Read Message History and Message Content Intent')
    existing = json.loads((ROOT / 'scripts/data/workstations-media.json').read_text())
    excluded = json.loads((ROOT / 'scripts/data/workstations-excluded.json').read_text())
    known = {entry.get('attachment') for entry in existing + excluded}
    new = [item for item in manifest if item['id'] not in known]
    print(f'{len(threads)} posts, {len(manifest)} media attachments, {len(new)} new attachments', flush=True)
    with tempfile.TemporaryDirectory(prefix='omarchy-workstations-') as temp:
        directory = Path(temp)
        for index, item in enumerate(new):
            if not item['id'].isdigit():
                raise RuntimeError('Invalid attachment ID')
            url = urllib.parse.urlsplit(item['url'])
            if url.scheme != 'https' or url.hostname not in {'cdn.discordapp.com', 'media.discordapp.net'}:
                raise RuntimeError('Unexpected attachment host')
            (directory / item['id']).write_bytes(request(item['url']))
            print(f'Downloaded {index + 1}/{len(new)}', flush=True)
        # Only IDs and source metadata go to the importer; signed URLs stay temporary.
        (directory / 'manifest.json').write_text(json.dumps([
            {key: value for key, value in item.items() if key != 'url'} for item in manifest
        ]))
        environment = {key: value for key, value in os.environ.items() if key != 'DISCORD_BOT_TOKEN'}
        subprocess.run(['node', 'scripts/import-workstations.mjs', str(directory)], cwd=ROOT,
                       env=environment, check=True)


if __name__ == '__main__':
    main()
