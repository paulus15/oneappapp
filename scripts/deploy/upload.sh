#!/usr/bin/env bash
set -euo pipefail
: "${VPS_HOST:?}" "${VPS_PORT:?}" "${VPS_USER:?}" "${VPS_SSH_KEY:?}" "${VPS_SSH_KNOWN_HOSTS:?}"
[[ "$VPS_HOST" =~ ^[a-zA-Z0-9.-]+$ && "$VPS_PORT" =~ ^[0-9]+$ && "$VPS_USER" =~ ^[a-z_][a-z0-9_-]*$ ]]
[[ "$VPS_USER" != root && "$GITHUB_SHA" =~ ^[a-f0-9]{40}$ ]]
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ && "$GITHUB_RUN_ATTEMPT" =~ ^[0-9]+$ ]]
release="${GITHUB_SHA}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
ssh_dir=$(mktemp -d)
trap 'rm -rf -- "$ssh_dir"' EXIT
chmod 700 "$ssh_dir"
printf '%s\n' "$VPS_SSH_KEY" > "$ssh_dir/key"
printf '%s\n' "$VPS_SSH_KNOWN_HOSTS" > "$ssh_dir/known_hosts"
chmod 600 "$ssh_dir/key" "$ssh_dir/known_hosts"
cat > "$ssh_dir/config" <<CONFIG
Host production
  HostName $VPS_HOST
  Port $VPS_PORT
  User $VPS_USER
  IdentityFile $ssh_dir/key
  UserKnownHostsFile $ssh_dir/known_hosts
  StrictHostKeyChecking yes
  IdentitiesOnly yes
  BatchMode yes
  ConnectTimeout 15
  ServerAliveInterval 15
  ServerAliveCountMax 4
CONFIG
checksum=$(sha256sum artifact/release.json | cut -d ' ' -f 1)
ssh -F "$ssh_dir/config" production "python3 - prepare $release" < scripts/deploy/remote.py
rsync -rt --chmod=D755,F644 -e "ssh -F $ssh_dir/config" artifact/ \
  "production:/var/www/apps/pwastore/shared/frontend/incoming/$release/"
ssh -F "$ssh_dir/config" production "python3 - deploy $release $checksum $GITHUB_SHA" < scripts/deploy/remote.py
printf '### Frontend déployé\n\n- Commit : `%s`\n- Release : `%s`\n- URL : https://pwastore.online\n- Intégrité, routes, cache PWA et API/CORS vérifiés.\n' \
  "$GITHUB_SHA" "$release" >> "$GITHUB_STEP_SUMMARY"
