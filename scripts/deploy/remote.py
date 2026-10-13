#!/usr/bin/env python3
"""Executed over verified SSH; only manages the frontend's reserved directories."""
import ctypes
import datetime
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


def health(metadata, raw):
    files = metadata['files']
    checks = {'release.json': digest(raw)}
    checks.update({name: checksum for name, checksum in files.items()
                   if name.endswith(('.js', '.css', '.json', '.png')) or name == 'index.html'})
    for name, checksum in checks.items():
        body, _ = request(ORIGIN + '/' + name + '?deploy=' + metadata['commit'])
        require(digest(body) == checksum, 'HTTP content mismatch: ' + name)
    for route in ('/', '/applications', '/login', '/developer'):
        body, _ = request(ORIGIN + route)
        require(digest(body) == files['index.html'], 'SPA route mismatch: ' + route)


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


def discard_failed(target):
    """A release that never became healthy and is not active is removed (it would fill the disk)."""
    if target.is_dir() and not target.is_symlink() and APP.resolve() != target.resolve() \
            and not (HEALTHY / target.name).exists():
        shutil.rmtree(target)
        print('CLEANUP: removed failed release ' + target.name, flush=True)


def purge_stale_incoming(max_age=86400):
    """Uploads interrupted before deploy (rsync failure, cancelled run) are removed after a day."""
    limit = time.time() - max_age
    for folder in INCOMING.iterdir():
        if re.fullmatch(r'[a-f0-9]{40}-[0-9]+-[0-9]+', folder.name) and folder.is_dir() \
                and not folder.is_symlink() and folder.stat().st_mtime < limit:
            shutil.rmtree(folder)


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


def exchange(first, second):
    """Atomically swap two paths (Linux renameat2); plain renames elsewhere."""
    renameat2 = getattr(ctypes.CDLL(None, use_errno=True), 'renameat2', None)
    if renameat2 is not None:
        if renameat2(-100, os.fsencode(first), -100, os.fsencode(second), 2) != 0:
            raise OSError(ctypes.get_errno(), 'Atomic exchange failed; app preserved')
        return
    parked = first.with_name(first.name + '.exchange')
    os.rename(first, parked)
    os.rename(second, first)
    os.rename(parked, second)


def bootstrap():
    """First deployment: create the reserved layout and turn app into a release symlink."""
    for directory in (RELEASES, INCOMING, HEALTHY):
        directory.mkdir(mode=0o755, parents=True, exist_ok=True)
    if APP.is_symlink():
        return
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    baseline = RELEASES / ('legacy-' + stamp)
    if not APP.exists():
        baseline.mkdir(mode=0o755)
        (baseline / 'index.html').write_text('<!doctype html><title>PWAStore</title><p>Maintenance</p>\n')
        APP.symlink_to(baseline)
        print('BOOTSTRAP: created ' + baseline.name, flush=True)
        return
    require(APP.is_dir(), 'app exists but is neither a directory nor a symlink; inspect first')
    shutil.copytree(APP, baseline, symlinks=True)
    require(not any(path.is_symlink() for path in baseline.rglob('*')),
            'Existing app contains symlinks; inspect manually')
    for path in [baseline, *baseline.rglob('*')]:
        path.chmod(0o755 if path.is_dir() else 0o644)
    # The original directory ends up at original-<stamp>, untouched.
    backup = INCOMING.parent / ('original-' + stamp)
    backup.symlink_to(baseline)
    exchange(APP, backup)
    print('BOOTSTRAP: app migrated to ' + baseline.name + ', original kept at ' + str(backup), flush=True)


def interrupted(signum, frame):
    raise InterruptedError('Deployment interrupted: ' + str(signum))


def main():
    mode, identifier = sys.argv[1:3]
    target = release_path(identifier)
    if mode == 'prepare':
        INCOMING.mkdir(mode=0o755, parents=True, exist_ok=True)
        with (INCOMING.parent / 'deploy.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            bootstrap()
    for directory in (RELEASES, INCOMING, HEALTHY):
        require(directory.is_dir() and directory.resolve() == directory, 'Missing or redirected directory: ' + str(directory))
    with (BASE / 'shared/frontend/deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if mode == 'prepare':
            require(not target.exists(), 'Release already exists')
            purge_stale_incoming()
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
            try:
                activate(target, metadata, raw)
            except BaseException:
                discard_failed(target)
                raise
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
