import sys
from pathlib import Path
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/deploy'))
import check_runtime as checks


class ApiCookieHealthTests(unittest.TestCase):
    def test_cookie_headers_and_preflight_are_checked(self):
        headers = {'Content-Type': 'application/json',
                   'Access-Control-Allow-Origin': checks.ORIGIN,
                   'Access-Control-Allow-Credentials': 'true',
                   'Access-Control-Allow-Headers': 'Content-Type, X-PWA-Auth, X-Country',
                   'Access-Control-Allow-Methods': 'GET, POST'}
        with patch.object(checks, 'request', return_value=(b'[]', headers)) as request:
            checks.api_health()
        self.assertEqual(request.call_args_list[0].args[1]['X-PWA-Auth'], 'cookie')
        self.assertEqual(request.call_args_list[1].kwargs['method'], 'OPTIONS')

    def test_cors_without_credentials_is_rejected(self):
        headers = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': checks.ORIGIN}
        with patch.object(checks, 'request', return_value=(b'[]', headers)):
            with self.assertRaisesRegex(RuntimeError, 'credentials missing'):
                checks.api_health()

    def test_missing_security_headers_are_rejected(self):
        with self.assertRaisesRegex(RuntimeError, 'nosniff'):
            checks.security_headers({})

