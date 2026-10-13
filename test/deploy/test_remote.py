import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('remote', Path(__file__).resolve().parents[2] / 'scripts/deploy/remote.py')
remote = importlib.util.module_from_spec(spec)
spec.loader.exec_module(remote)


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name).resolve()
        for name, value in {'BASE': root, 'RELEASES': root / 'releases',
                            'APP': root / 'app', 'HEALTHY': root / 'healthy'}.items():
            change = patch.object(remote, name, value)
            change.start()
            self.addCleanup(change.stop)
        remote.RELEASES.mkdir()
        remote.HEALTHY.mkdir()
        self.old = self.release(1)
        remote.APP.symlink_to(self.old)

    def release(self, number):
        folder = remote.release_path('a' * 40 + '-' + str(number) + '-1')
        folder.mkdir()
        files = {}
        for name in ('index.html', 'sw.js', 'manifest.json'):
            (folder / name).write_text(name)
            files[name] = remote.digest(name.encode())
        (folder / 'release.json').write_text(json.dumps({'commit': 'a' * 40, 'files': files}))
        return folder

    def test_corrupt_transfer_is_rejected(self):
        metadata, raw = remote.verify(self.old)
        (self.old / 'sw.js').write_text('corrupted')
        with self.assertRaisesRegex(RuntimeError, 'Corrupt file'):
            remote.verify(self.old, remote.digest(raw), metadata['commit'])

    def test_manifest_tampering_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, 'checksum mismatch'):
            remote.verify(self.old, '0' * 64)

    def test_symlink_and_extra_file_are_rejected(self):
        (self.old / 'secret').symlink_to('/etc/passwd')
        with self.assertRaisesRegex(RuntimeError, 'Symlinks forbidden'):
            remote.verify(self.old)
        (self.old / 'secret').unlink()
        (self.old / 'extra').write_text('unexpected')
        with self.assertRaisesRegex(RuntimeError, 'Unexpected or missing'):
            remote.verify(self.old)

    def test_health_failure_restores_previous_release(self):
        new = self.release(2)
        with patch.object(remote, 'health', side_effect=RuntimeError('HTTP failure')), patch.object(remote.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, 'HTTP failure'):
                remote.activate(new, *remote.verify(new))
        self.assertEqual(remote.APP.resolve(), self.old)
        self.assertFalse((remote.HEALTHY / new.name).exists())

    def test_success_marks_release_healthy(self):
        new = self.release(2)
        with patch.object(remote, 'health'):
            remote.activate(new, *remote.verify(new))
        self.assertEqual(remote.APP.resolve(), new)
        self.assertTrue((remote.HEALTHY / new.name).is_file())

    def test_real_app_directory_is_never_overwritten(self):
        remote.APP.unlink()
        remote.APP.mkdir()
        new = self.release(2)
        with self.assertRaisesRegex(RuntimeError, 'initial migration'):
            remote.activate(new, *remote.verify(new))
        self.assertTrue(remote.APP.is_dir())

    def test_bootstrap_migrates_real_app_directory(self):
        incoming = remote.BASE / 'shared/frontend/incoming'
        with patch.object(remote, 'INCOMING', incoming):
            remote.APP.unlink()
            remote.APP.mkdir()
            (remote.APP / 'index.html').write_text('legacy site')
            remote.bootstrap()
            self.assertTrue(incoming.is_dir())
        self.assertTrue(remote.APP.is_symlink())
        active = remote.APP.resolve()
        self.assertEqual(active.parent, remote.RELEASES)
        self.assertTrue(active.name.startswith('legacy-'))
        self.assertEqual((active / 'index.html').read_text(), 'legacy site')
        originals = list(incoming.parent.glob('original-*'))
        self.assertEqual(len(originals), 1)
        self.assertEqual((originals[0] / 'index.html').read_text(), 'legacy site')

    def test_bootstrap_keeps_existing_symlink(self):
        with patch.object(remote, 'INCOMING', remote.BASE / 'shared/frontend/incoming'):
            remote.bootstrap()
        self.assertEqual(remote.APP.resolve(), self.old)

    def test_retention_keeps_five_and_protects_active(self):
        for i in range(2, 9):
            folder = self.release(i)
            (remote.HEALTHY / folder.name).touch()
        (remote.HEALTHY / self.old.name).touch()
        remote.prune()
        self.assertEqual(len(list(remote.RELEASES.iterdir())), 5)
        self.assertTrue(self.old.exists())

    def test_unsafe_identifier_is_rejected(self):
        for identifier in ('../api', '', '/var/www', 'legacy'):
            with self.assertRaisesRegex(RuntimeError, 'Invalid release ID'):
                remote.release_path(identifier)

    def test_http_200_with_wrong_content_is_rejected(self):
        with patch.object(remote, 'request', return_value=(b'wrong page', {})):
            with self.assertRaisesRegex(RuntimeError, 'content mismatch'):
                remote.health(*remote.verify(self.old))


if __name__ == '__main__':
    unittest.main()
