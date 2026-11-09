"""The retired online installers point at the ISO and fail, without downloading anything."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
INSTALLERS = ('install', 'install-dev', 'install-rc')
ISO_PAGE = 'https://omarchy.org/#install'


class InstallerTest(unittest.TestCase):
    def setUp(self):
        # curl and wget stand-ins that record a call and serve nothing, so an
        # installer that still downloads is caught without touching the network.
        self.bin = tempfile.TemporaryDirectory()
        self.calls = Path(self.bin.name) / 'calls'
        for tool in ('curl', 'wget'):
            stub = Path(self.bin.name) / tool
            stub.write_text(f'#!/bin/bash\necho {tool} >> {self.calls}\n')
            stub.chmod(0o755)
        self.env = dict(os.environ, PATH=f'{self.bin.name}:{os.environ["PATH"]}')

    def tearDown(self):
        self.bin.cleanup()

    def run_bash(self, *argv, stdin=None):
        return subprocess.run(['bash', *argv], input=stdin, env=self.env,
                              capture_output=True, text=True)

    def test_piped_to_bash_it_points_at_the_iso_and_fails(self):
        for name in INSTALLERS:
            with self.subTest(installer=name):
                # As run by `curl -fsSL https://omarchy.org/install | bash`.
                result = self.run_bash(stdin=(ROOT / name).read_text())
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(ISO_PAGE, result.stderr)
                self.assertFalse(self.calls.exists(), 'the installer downloaded something')

    def test_an_evaluating_shell_stays_open(self):
        for name in INSTALLERS:
            with self.subTest(installer=name):
                result = self.run_bash('-c', 'eval "$(cat "$1")"; echo "status $?"', 'bash',
                                       str(ROOT / name))
                self.assertEqual(result.stdout, 'status 1\n')


if __name__ == '__main__':
    unittest.main()
