"""Input diagnostics must fail before SSH and must never expose secrets."""
import os
from pathlib import Path
import subprocess
import unittest

SCRIPT = Path(__file__).resolve().parents[2] / 'scripts/deploy/upload.sh'


class UploadDiagnosticsTests(unittest.TestCase):
    def environment(self):
        return {**os.environ, 'VPS_HOST': '213.156.133.235', 'VPS_PORT': '22',
                'VPS_USER': 'pwastore-deploy', 'VPS_SSH_KEY': 'PRIVATE-KEY-TEST-DO-NOT-PRINT',
                'VPS_SSH_KNOWN_HOSTS': 'KNOWN-HOSTS-TEST-DO-NOT-PRINT',
                'GITHUB_SHA': 'a' * 40, 'GITHUB_RUN_ID': '1', 'GITHUB_RUN_ATTEMPT': '1'}

    def check_failure(self, override, expected):
        env = self.environment()
        env.update(override)
        result = subprocess.run(['bash', str(SCRIPT)], env=env, text=True,
                                capture_output=True, timeout=10)
        self.assertNotEqual(result.returncode, 0)
        output = result.stdout + result.stderr
        self.assertIn('::error::', output)
        self.assertIn(expected, output)
        self.assertNotIn('PRIVATE-KEY-TEST-DO-NOT-PRINT', output)
        self.assertNotIn('KNOWN-HOSTS-TEST-DO-NOT-PRINT', output)

    def test_root_is_accepted_with_a_warning(self):
        env = self.environment()
        env['VPS_USER'] = 'root'
        result = subprocess.run(['bash', str(SCRIPT)], env=env, text=True,
                                capture_output=True, timeout=10)
        self.assertIn('::warning::Déploiement avec root', result.stdout)
        self.assertNotIn('VPS_USER', result.stderr)

    def test_empty_secret_names_the_missing_variable(self):
        self.check_failure({'VPS_SSH_KEY': ''}, 'VPS_SSH_KEY absent')

    def test_malformed_host_and_username_are_explained(self):
        self.check_failure({'VPS_HOST': 'https://example.test'}, 'VPS_HOST invalide')
        self.check_failure({'VPS_USER': 'deploy\n'}, 'VPS_USER invalide')

    def test_invalid_port_is_explained(self):
        for port in ('22\n', '0', '65536', '99999999999999999', '-p22'):
            self.check_failure({'VPS_PORT': port}, 'VPS_PORT')

    def test_invalid_commit_is_explained(self):
        self.check_failure({'GITHUB_SHA': ''}, 'GITHUB_SHA')
