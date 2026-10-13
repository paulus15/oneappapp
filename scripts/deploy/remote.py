#!/usr/bin/env python3
"""Executed over verified SSH; only manages the frontend's reserved directories."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import sys
import time
import urllib.request

BASE = Path('/var/www/apps/pwastore')
RELEASES = BASE / 'releases'
INCOMING = BASE / 'shared/frontend/incoming'
HEALTHY = BASE / 'shared/frontend/healthy'
APP = BASE / 'app'
ORIGIN = 'https://pwastore.online'
API = 'https://api.pwastore.online/api/categories'


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def release_path(identifier):
    require(re.fullmatch(r'[a-f0-9]{40}-[0-9]+-[0-9]+', identifier), 'Invalid release ID')
    return RELEASES / identifier


def verify(folder, expected=None, commit=None):
    raw = (folder / 'release.json').read_bytes()
    if expected:
        require(digest(raw) == expected, 'Release manifest checksum mismatch')
    metadata = json.loads(raw)
    if commit:
        require(metadata['commit'] == commit, 'Commit mismatch')
    files = metadata['files']
    require({'index.html', 'sw.js', 'manifest.json'} <= files.keys(), 'Incomplete PWA')
    actual = set()
    for item in folder.rglob('*'):
        require(not item.is_symlink(), 'Symlinks forbidden in artifacts')
        if item.is_file():
            actual.add(item.relative_to(folder).as_posix())
    require(actual == set(files) | {'release.json'}, 'Unexpected or missing files')
    for name, checksum in files.items():
        require(re.fullmatch(r'[a-zA-Z0-9_./@-]+', name) and not name.startswith('/')
                and '..' not in Path(name).parts, 'Unsafe artifact path')
        require(digest((folder / name).read_bytes()) == checksum, 'Corrupt file: ' + name)
    return metadata, raw


def request(url, headers=None, method=None, statuses=(200,)):
    req = urllib.request.Request(url, headers=headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=15) as response:
        require(response.status in statuses and response.url.split('?')[0] == url.split('?')[0],
                'Unexpected status or redirect: ' + url)
        return response.read(), response.headers


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
    allowed_headers = {h.strip().lower() for h in headers.get('Access-Control-Allow-Headers', '').split(',')}
    require({'content-type', 'x-pwa-auth', 'x-country'} <= allowed_headers, 'API preflight headers refused')
    require('POST' in {m.strip() for m in headers.get('Access-Control-Allow-Methods', '').split(',')},
            'API preflight POST refused')


def health(metadata, raw):
    files = metadata['files']
    checks = {'release.json': digest(raw)}
    checks.update({name: checksum for name, checksum in files.items()
                   if name.endswith(('.js', '.css', '.json', '.png')) or name == 'index.html'})
    for name, checksum in checks.items():
        body, headers = request(ORIGIN + '/' + name + '?deploy=' + metadata['commit'])
        require(digest(body) == checksum, 'HTTP content mismatch: ' + name)
        security_headers(headers)
        if name in ('index.html', 'sw.js', 'manifest.json', 'release.json'):
            require('no-cache' in headers.get('Cache-Control', '') or
                    'no-store' in headers.get('Cache-Control', ''), 'Unsafe cache: ' + name)
    for route in ('/', '/applications', '/login', '/developer'):
        body, headers = request(ORIGIN + route)
        require(digest(body) == files['index.html'], 'SPA route mismatch: ' + route)
        security_headers(headers)
    api_health()


def switch(target):
    temporary = BASE / '.app-next'
    require(not temporary.exists() and not temporary.is_symlink(), 'Stale .app-next; inspect first')
    try:
        temporary.symlink_to(target)
        os.replace(temporary, APP)
    finally:
        if temporary.is_symlink():
            temporary.unlink()


def activate(target, metadata, raw):
    require(APP.is_symlink(), 'app must be a symlink: perform the documented initial migration')
    previous = APP.resolve(strict=True)
    require(previous.parent == RELEASES.resolve() and previous.is_dir(), 'Invalid active release')
    try:
        switch(target)
        for attempt in range(3):
            try:
                health(metadata, raw)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(3)
        (HEALTHY / target.name).touch()
    except BaseException:
        if APP.resolve() == target:
            switch(previous)
            print('ROLLBACK: restored ' + previous.name, flush=True)
        raise
    print('SUCCESS: active release ' + target.name, flush=True)


def prune():
    active = APP.resolve(strict=True)
    markers = sorted(HEALTHY.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)
    kept = {active.name}
    for marker in markers:
        if len(kept) < 5:
            kept.add(marker.name)
    for marker in markers:
        if marker.name in kept:
            continue
        folder = release_path(marker.name)
        require(not folder.is_symlink(), 'Refusing symlink release deletion')
        if folder.exists():
            shutil.rmtree(folder)
        marker.unlink()


def interrupted(signum, frame):
    raise InterruptedError('Deployment interrupted: ' + str(signum))


def main():
    mode, identifier = sys.argv[1:3]
    target = release_path(identifier)
    for directory in (RELEASES, INCOMING, HEALTHY):
        require(directory.is_dir() and directory.resolve() == directory, 'Missing or redirected directory: ' + str(directory))
    with (BASE / 'shared/frontend/deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if mode == 'prepare':
            require(not target.exists(), 'Release already exists')
            (INCOMING / identifier).mkdir(mode=0o755)
            return
        for sig in (signal.SIGTERM, signal.SIGHUP, signal.SIGINT):
            signal.signal(sig, interrupted)
        if mode == 'deploy':
            stage = INCOMING / identifier
            require(stage.is_dir() and not stage.is_symlink(), 'Invalid staging directory')
            metadata, raw = verify(stage, sys.argv[3], sys.argv[4])
            require(not target.exists(), 'Release already exists')
            stage.rename(target)
            activate(target, metadata, raw)
        elif mode == 'rollback':
            require((HEALTHY / identifier).is_file() and not target.is_symlink(), 'Not a known healthy release')
            metadata, raw = verify(target)
            activate(target, metadata, raw)
        else:
            raise RuntimeError('Unknown command')
        # Cleanup failure must not roll back an already validated release.
        try:
            prune()
        except Exception as error:
            print('WARNING: retention cleanup failed: ' + str(error), flush=True)


if __name__ == '__main__':
    main()
