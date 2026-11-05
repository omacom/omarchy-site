import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import urllib.error

spec = importlib.util.spec_from_file_location('sync_workstations', Path(__file__).with_name('sync-workstations.py'))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class SyncTests(unittest.TestCase):
    def test_active_and_archived_posts_are_paginated_and_deduplicated(self):
        responses = [
            {'threads': [{'id': '3', 'parent_id': sync.CHANNEL}, {'id': '9', 'parent_id': 'other'}]},
            {'threads': [{'id': '3', 'thread_metadata': {'archive_timestamp': '2026-09-02'}}], 'has_more': True},
            {'threads': [{'id': '1', 'thread_metadata': {'archive_timestamp': '2026-09-01'}}], 'has_more': False},
        ]
        calls = []
        def api(endpoint):
            calls.append(endpoint)
            return responses.pop(0)
        self.assertEqual([t['id'] for t in sync.collect_threads(api)], ['1', '3'])
        self.assertIn('before=2026-09-02', calls[-1])

    def test_messages_paginate_and_ignore_non_media(self):
        first = [{'id': str(i), 'attachments': []} for i in range(200, 100, -1)]
        first[0]['attachments'] = [{'id': '300', 'content_type': 'image/jpeg', 'url': 'https://cdn.discordapp.com/first'}]
        second = [{'id': '100', 'attachments': [
            {'id': '301', 'content_type': 'video/mp4', 'url': 'https://cdn.discordapp.com/second'},
            {'id': '302', 'content_type': 'text/plain', 'url': 'https://cdn.discordapp.com/text'},
        ]}]
        responses = [first, second]
        calls = []
        def api(endpoint):
            calls.append(endpoint)
            return responses.pop(0)
        result = sync.collect_attachments(api, [{'id': '10', 'name': 'Desk'}])
        self.assertEqual([a['id'] for a in result], ['300', '301'])
        self.assertIn('before=101', calls[-1])
        self.assertEqual(result[1]['message'], '100')

    def test_permission_errors_fail_without_retry_or_token_in_error(self):
        error = urllib.error.HTTPError('https://discord.com/api/v10/test', 403, 'Forbidden', {}, None)
        with patch.object(sync.urllib.request, 'urlopen', side_effect=error), patch.object(sync.time, 'sleep') as sleep:
            with self.assertRaisesRegex(RuntimeError, 'HTTP 403 while reading /api/v10/test'):
                sync.request('https://discord.com/api/v10/test', 'secret-token')
            sleep.assert_not_called()

    def test_rate_limit_is_retried(self):
        import io
        error = urllib.error.HTTPError('https://discord.com/api/v10/test', 429, 'Limited', {}, io.BytesIO(json.dumps({'retry_after': 0.5}).encode()))
        class Response:
            headers = {}
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b'[]'
        with patch.object(sync.urllib.request, 'urlopen', side_effect=[error, Response()]), patch.object(sync.time, 'sleep') as sleep:
            self.assertEqual(sync.request('https://discord.com/api/v10/test', 'token'), b'[]')
            sleep.assert_called_once_with(0.5)


if __name__ == '__main__':
    unittest.main()
