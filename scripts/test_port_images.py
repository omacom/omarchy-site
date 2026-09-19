import importlib.util
from pathlib import Path
import re
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('port_content', Path(__file__).with_name('port_content.py'))
assert spec and spec.loader
port = importlib.util.module_from_spec(spec)
spec.loader.exec_module(port)


def webp(chunk, payload):
    body = b'WEBP' + chunk + len(payload).to_bytes(4, 'little') + payload
    return b'RIFF' + len(body).to_bytes(4, 'little') + body


class WebpSizeTest(unittest.TestCase):
    def test_lossy_vp8(self):
        payload = (b'\x00\x00\x00' + b'\x9d\x01\x2a'
                   + (320).to_bytes(2, 'little') + (200).to_bytes(2, 'little'))
        data = webp(b'VP8 ', payload)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'a.webp'
            path.write_bytes(data)
            self.assertEqual(port.webp_size(path), (320, 200))

    def test_lossless_vp8l(self):
        bits = (639 | (399 << 14)).to_bytes(4, 'little')
        data = webp(b'VP8L', b'\x2f' + bits)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'a.webp'
            path.write_bytes(data)
            self.assertEqual(port.webp_size(path), (640, 400))

    def test_extended_vp8x(self):
        payload = (b'\x00\x00\x00\x00' + (1199).to_bytes(3, 'little')
                   + (675).to_bytes(3, 'little'))
        data = webp(b'VP8X', payload)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'a.webp'
            path.write_bytes(data)
            self.assertEqual(port.webp_size(path), (1200, 676))

    def test_unknown_returns_none(self):
        with tempfile.TemporaryDirectory() as directory:
            missing = Path(directory) / 'missing.webp'
            self.assertIsNone(port.webp_size(missing))
            broken = Path(directory) / 'broken.webp'
            broken.write_bytes(b'not a webp file at all, just text')
            self.assertIsNone(port.webp_size(broken))


class SizeImagesTest(unittest.TestCase):
    def test_stamps_dimensions_and_loading(self):
        payload = b'\x00\x00\x00' + b'\x9d\x01\x2a' + (320).to_bytes(2, 'little') + (200).to_bytes(2, 'little')
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'manual' / 'images').mkdir(parents=True)
            (root / 'manual' / 'images' / 'shot.webp').write_bytes(webp(b'VP8 ', payload))
            html = '<p><img src="/manual/images/shot.webp" alt="shot" /></p>'
            out = port.size_images(html, root)
            self.assertIn('width="320" height="200"', out)
            self.assertIn('loading="lazy" decoding="async"', out)
            found = re.search(r'<img\b[^>]*>', out)
            assert found
            self.assertTrue(found.group(0).endswith('/>'))

    def test_leaves_others_alone(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            kept = '<img src="/manual/images/gone.webp" alt="gone" />'
            self.assertEqual(port.size_images(kept, root), kept)
            sized = '<img src="/manual/images/shot.webp" width="1" height="1" />'
            self.assertEqual(port.size_images(sized, root), sized)


if __name__ == '__main__':
    unittest.main()
