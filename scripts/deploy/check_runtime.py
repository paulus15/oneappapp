#!/usr/bin/env python3
"""Read-only cookie/CORS and frontend security checks, run after Nginx setup."""
import json
from remote import ORIGIN, request, require

API = 'https://api.pwastore.online/api/categories'


def security_headers(headers):
    require(headers.get('X-Content-Type-Options') == 'nosniff', 'Missing Nginx nosniff header')
    require(headers.get('X-Frame-Options') == 'DENY', 'Missing Nginx frame protection')
    require("frame-ancestors 'none'" in headers.get('Content-Security-Policy', ''),
            'Missing CSP frame-ancestors header')
    require('max-age=31536000' in headers.get('Strict-Transport-Security', ''), 'Missing HSTS header')
    require(headers.get('Referrer-Policy') == 'strict-origin-when-cross-origin', 'Missing Referrer-Policy')


def api_health():
    body, headers = request(API, {'Origin': ORIGIN, 'Accept': 'application/json', 'X-PWA-Auth': 'cookie'})
    require('application/json' in headers.get('Content-Type', ''), 'API did not return JSON')
    require(headers.get('Access-Control-Allow-Origin') == ORIGIN, 'API CORS origin mismatch')
    require(headers.get('Access-Control-Allow-Credentials') == 'true', 'API CORS credentials missing')
    require(isinstance(json.loads(body), (dict, list)), 'Invalid API response')
    _, headers = request(API, {
        'Origin': ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-pwa-auth,x-country',
    }, method='OPTIONS', statuses=(200, 204))
    require(headers.get('Access-Control-Allow-Origin') == ORIGIN and
            headers.get('Access-Control-Allow-Credentials') == 'true', 'API preflight credentials refused')
    allowed = {h.strip().lower() for h in headers.get('Access-Control-Allow-Headers', '').split(',')}
    require({'content-type', 'x-pwa-auth', 'x-country'} <= allowed, 'API preflight headers refused')
    require('POST' in {m.strip() for m in headers.get('Access-Control-Allow-Methods', '').split(',')},
            'API preflight POST refused')


def main():
    for route in ('/', '/index.html', '/login', '/sw.js', '/manifest.json'):
        _, headers = request(ORIGIN + route)
        security_headers(headers)
        require('no-cache' in headers.get('Cache-Control', '') or
                'no-store' in headers.get('Cache-Control', ''), 'Unsafe cache: ' + route)
    api_health()
    print('Frontend security headers, PWA cache and cookie CORS/preflight passed.')


if __name__ == '__main__':
    main()
