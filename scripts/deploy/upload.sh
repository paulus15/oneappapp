#!/usr/bin/env bash
set -Eeuo pipefail

deployment_step='validation de la configuration'
ssh_dir=''
fail() { printf '::error::%s\n' "$1" >&2; exit 1; }
log() { printf '\n[deploy] %s\n' "$1"; }
cleanup() { if [[ -n "$ssh_dir" && -d "$ssh_dir" ]]; then rm -rf -- "$ssh_dir"; fi; }
trap cleanup EXIT
# Never print BASH_COMMAND or enable set -x: commands can contain credentials.
trap 'status=$?; printf "::error::Échec pendant %s (ligne %s, code %s).\n" "$deployment_step" "$LINENO" "$status" >&2; exit "$status"' ERR

for name in VPS_HOST VPS_PORT VPS_USER VPS_SSH_KEY VPS_SSH_KNOWN_HOSTS; do
  [[ -n "${!name:-}" ]] || fail "Secret $name absent ou vide dans l’environnement GitHub production."
done
[[ "$VPS_HOST" =~ ^[a-zA-Z0-9.-]+$ && "$VPS_HOST" != -* ]] || fail 'VPS_HOST invalide : utiliser uniquement une IPv4 ou un nom DNS, sans https://, port ni espace.'
[[ "$VPS_PORT" =~ ^[0-9]{1,5}$ ]] || fail 'VPS_PORT invalide : saisir uniquement le numéro du port SSH, sans espace ni retour à la ligne.'
(( 10#$VPS_PORT >= 1 && 10#$VPS_PORT <= 65535 )) || fail 'VPS_PORT doit être compris entre 1 et 65535.'
[[ "$VPS_USER" =~ ^[a-z_][a-z0-9_-]*$ ]] || fail 'VPS_USER invalide : saisir uniquement le nom Linux, sans @, espace ni retour à la ligne.'
if [[ "$VPS_USER" == root ]]; then
  printf '::warning::Déploiement avec root : un compte dédié limiterait l’impact d’une fuite de VPS_SSH_KEY (voir docs/DEPLOYMENT.md).\n'
fi
[[ "${GITHUB_SHA:-}" =~ ^[a-f0-9]{40}$ ]] || fail 'GITHUB_SHA absent ou invalide.'
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ && "${GITHUB_RUN_ATTEMPT:-}" =~ ^[0-9]+$ ]] || fail 'Identifiant GitHub Actions absent ou invalide.'
for command in ssh rsync ssh-keygen sha256sum; do
  command -v "$command" >/dev/null || fail "Commande requise introuvable : $command."
done
for file in index.html sw.js manifest.json release.json; do
  [[ -f "artifact/$file" && ! -L "artifact/$file" ]] || fail "Artifact compilé incomplet : artifact/$file absent ou invalide. Vérifier le téléchargement de dist/pwa."
done
[[ -d artifact/assets ]] || fail 'Artifact compilé incomplet : dossier assets absent.'
log 'Configuration et contenu compilé vérifiés. Cible active : /var/www/apps/pwastore/app.'

release="${GITHUB_SHA}-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
deployment_step='préparation de la connexion SSH'
ssh_dir=$(mktemp -d)
chmod 700 "$ssh_dir"
printf '%s\n' "$VPS_SSH_KEY" | tr -d '\r' > "$ssh_dir/key"
printf '%s\n' "$VPS_SSH_KNOWN_HOSTS" | tr -d '\r' > "$ssh_dir/known_hosts"
chmod 600 "$ssh_dir/key" "$ssh_dir/known_hosts"
ssh-keygen -y -P '' -f "$ssh_dir/key" >/dev/null 2>&1 || fail 'VPS_SSH_KEY illisible ou protégée par une passphrase : fournir la clé privée dédiée complète, avec de vrais retours à la ligne.'
host_entry="$VPS_HOST"
if (( 10#$VPS_PORT != 22 )); then host_entry="[$VPS_HOST]:$VPS_PORT"; fi
ssh-keygen -F "$host_entry" -f "$ssh_dir/known_hosts" >/dev/null || fail 'VPS_SSH_KNOWN_HOSTS ne contient pas le couple hôte/port attendu. Vérifier l’empreinte via la console LWS avant de corriger le secret.'
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
deployment_step='connexion SSH et préparation du dossier temporaire'
log "$deployment_step"
ssh -F "$ssh_dir/config" production "python3 - prepare $release" < scripts/deploy/remote.py
deployment_step='transfert des fichiers compilés'
log "$deployment_step"
# artifact/ contains ONLY dist/pwa/ contents downloaded from the build job.
rsync -rt --chmod=D755,F644 -e "ssh -F $ssh_dir/config" artifact/ \
  "production:/var/www/apps/pwastore/shared/frontend/incoming/$release/"
deployment_step='vérification, activation et contrôles HTTPS'
log "$deployment_step"
ssh -F "$ssh_dir/config" production "python3 - deploy $release $checksum $GITHUB_SHA" < scripts/deploy/remote.py
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  printf '### Frontend déployé\n\n- Commit : `%s`\n- Release : `%s`\n- Chemin actif : `/var/www/apps/pwastore/app`\n- URL : https://pwastore.online\n- Intégrité et routes HTTPS du frontend vérifiées. Contrôle complémentaire : `python3 scripts/deploy/check_runtime.py`.\n' \
    "$GITHUB_SHA" "$release" >> "$GITHUB_STEP_SUMMARY"
fi
log 'Déploiement terminé.'
