#!/usr/bin/env python3
"""One-time Debian/Linux migration, run by an administrator with deployments paused."""
import ctypes
import datetime
import fcntl
import os
import pwd
import grp
from pathlib import Path
import shutil

base = Path('/var/www/apps/pwastore')
app = base / 'app'
state = base / 'shared/frontend'
assert os.geteuid() == 0, 'Run as administrator'
deploy_uid = pwd.getpwnam('pwastore-deploy').pw_uid
deploy_gid = grp.getgrnam('pwastore-frontend').gr_gid
assert app.is_dir() and not app.is_symlink(), 'app must be an existing real directory'
assert (app / 'index.html').is_file(), 'Existing index.html required'
assert not any(path.is_symlink() for path in app.rglob('*')), 'Inspect existing symlinks manually'
assert all(path.is_dir() and path.resolve() == path for path in (base / 'releases', state)), 'Prepare directories first'
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
release = base / 'releases' / ('legacy-' + stamp)
backup = state / ('original-' + stamp)
with (state / 'deploy.lock').open('a') as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)
    shutil.copytree(app, release)
    for path in [release, *release.rglob('*')]:
        path.chmod(0o755 if path.is_dir() else 0o644)
    # Exchange the original directory and the new symlink atomically (Linux).
    backup.symlink_to(release)
    os.chown(backup, deploy_uid, deploy_gid, follow_symlinks=False)
    libc = ctypes.CDLL(None, use_errno=True)
    if libc.renameat2(-100, os.fsencode(app), -100, os.fsencode(backup), 2) != 0:
        backup.unlink()
        raise OSError(ctypes.get_errno(), 'Atomic migration failed; original app preserved')
print('Active baseline:', release)
print('Original preserved:', backup)
print('No Nginx reload required for this symlink exchange.')
