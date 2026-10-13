# Frontend PWAStore — GitHub Actions et VPS LWS

Ce guide concerne uniquement le frontend de `https://pwastore.online` sur Debian 12 (`213.156.133.235`). L’API Laravel, Pharma24, SmartBiz, les bases de données et les autres sites ne sont pas gérés par ce workflow. Pour cette infrastructure, ce document remplace les exemples frontend de `PWASTORE_DEPLOYMENT.md`.

## Audit du dépôt

- npm, `package-lock.json` et `src-pwa/package-lock.json` ; le fichier `pnpm-workspace.yaml` n’est pas utilisé par la CI.
- Versions verrouillées lors de l’audit : Quasar 2.35.0, Vue 3.5.43, `@quasar/app-vite` 3.10.2. Node 24.14.1 dans `.nvmrc`, compatible avec `package.json`.
- `npm run build:pwa` exécute `quasar build -m pwa`. Aucun `build.distDir` personnalisé ; la configuration effective de Quasar utilise `dist/<mode>`, donc `dist/pwa`. Le build et le script de validation contrôlent ce résultat.
- Routeur en mode `history`, Workbox `GenerateSW`, `sw.js`, `manifest.json`, icônes locales. Le HTML référence explicitement le manifeste en mode PWA.
- Contrôles existants : `npm run lint:check`, `npm run test:unit`, `npm run test:e2e`. Aucun workflow préexistant.
- **À la demande du propriétaire, les E2E Laravel restent manuels** : leur script requiert un autre dépôt et recrée une base `oneapp_e2e`. Il ne doit jamais être exécuté sur le backend de production. Voir `PWASTORE_TEST_PLAN.md`.
- La base Axios utilise `import.meta.env.PWA_API_URL`, définie depuis `VITE_API_URL`. La valeur de production est `https://api.pwastore.online/api` : le suffixe `/api` est nécessaire aux routes Laravel (endpoint public `/api/categories` vérifié).

## 1. Préparer le VPS une seule fois

Exécuter ces commandes dans une session administrateur. Vérifier les permissions existantes du parent avant de les adapter ; ne jamais faire de `chown -R` sur `/var/www/apps/pwastore`.

```sh
sudo apt-get update
sudo apt-get install --yes python3 rsync openssh-server ca-certificates acl
sudo groupadd --system pwastore-frontend
sudo useradd --create-home --shell /bin/bash --gid pwastore-frontend pwastore-deploy
sudo passwd -l pwastore-deploy
sudo install -d -o pwastore-deploy -g pwastore-frontend -m 0755 /var/www/apps/pwastore/releases
sudo install -d -o root -g root -m 0755 /var/www/apps/pwastore/shared
sudo install -d -o pwastore-deploy -g pwastore-frontend -m 0755 /var/www/apps/pwastore/shared/frontend
sudo install -d -o pwastore-deploy -g pwastore-frontend -m 0755 /var/www/apps/pwastore/shared/frontend/incoming
sudo install -d -o pwastore-deploy -g pwastore-frontend -m 0755 /var/www/apps/pwastore/shared/frontend/healthy
sudo install -o pwastore-deploy -g pwastore-frontend -m 0600 /dev/null /var/www/apps/pwastore/shared/frontend/deploy.lock
```

Le parent `/var/www/apps/pwastore` doit appartenir à `root`, jamais à l’utilisateur de déploiement. Le compte doit pouvoir y remplacer **son lien `app`**. Après vérification des propriétaires existants, donner uniquement cette permission au compte et activer le sticky bit :

```sh
sudo setfacl -m u:pwastore-deploy:rwx /var/www/apps/pwastore
sudo chmod +t /var/www/apps/pwastore
```

Le sticky bit interdit à ce compte de supprimer/renommer les entrées appartenant aux autres utilisateurs (notamment `api`). Vérifier que `api` appartient à son utilisateur backend et que ses permissions/ACL ne donnent aucun accès en écriture à `pwastore-deploy`. Le compte ne doit pas avoir de droit sudo, ni appartenir au groupe d’écriture du backend. Nginx (`www-data`) doit pouvoir traverser les parents et lire les releases. Le parent, `shared` et `releases` doivent être de vrais répertoires sur le même système de fichiers.

Node, npm et PHP ne sont pas nécessaires sur le VPS pour ce frontend statique.

### Migration de l’actuel répertoire `app`

Suspendre les déploiements pendant cette opération. Depuis une copie du dépôt sur le VPS, après inspection du contenu actuel :

```sh
sudo python3 scripts/deploy/migrate.py
sudo -u pwastore-deploy test -w /var/www/apps/pwastore/shared/frontend/deploy.lock
readlink -f /var/www/apps/pwastore/app
```

Le script copie le site dans `releases/legacy-<date>`, puis échange atomiquement le répertoire `app` avec un lien symbolique grâce à `renameat2` (Linux). L’original est conservé intégralement dans `shared/frontend/original-<date>`. En cas d’échec avant l’échange, `app` reste intact. La release legacy et la sauvegarde initiale ne sont jamais purgées automatiquement. Si `app` est déjà un lien, inspecter sa cible : elle doit être un répertoire directement sous `releases`, et le lien doit appartenir à `pwastore-deploy`.

Pour une première installation sans site existant, créer un répertoire `releases/legacy-initial` contenant une page de maintenance `index.html`, puis créer `app` pointant sur ce répertoire avec le compte de déploiement. Cela fournit une cible de retour arrière dès le premier déploiement.

## 2. Clé SSH dédiée

Sur une machine d’administration, créer une clé dédiée, sans réutiliser une clé personnelle :

```sh
ssh-keygen -t ed25519 -C github-pwastore-frontend -f ./pwastore-deploy -N ''
```

Installer le contenu du fichier `.pub` dans `/home/pwastore-deploy/.ssh/authorized_keys`, précédé de `restrict ` (désactive transfert de ports, agent et terminal tout en permettant les commandes SSH/rsync). Répertoire `.ssh` : propriétaire `pwastore-deploy`, mode `0700` ; `authorized_keys` : même propriétaire, mode `0600`. Conserver la clé privée dans GitHub Secrets et dans votre stockage sécurisé, jamais dans le dépôt.

Vérifier la clé d’hôte **via la console LWS ou une session administrateur déjà fiable** :

```sh
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Sur la machine d’administration, récupérer la clé publique puis comparer cette empreinte avant de l’enregistrer :

```sh
ssh-keyscan -p PORT_SSH -t ed25519 213.156.133.235 > pwastore-known-hosts
ssh-keygen -lf pwastore-known-hosts
```

Ne pas faire confiance à un `ssh-keyscan` non vérifié. Pour un port différent de 22, l’entrée utilise `[213.156.133.235]:PORT_SSH`.

## 3. GitHub : environnement et secrets

Créer l’environnement `production` dans **Settings → Environments**, limiter ses déploiements à `main`, puis renseigner ses secrets :

| Secret                | Valeur                                          |
| --------------------- | ----------------------------------------------- |
| `VPS_HOST`            | `213.156.133.235`                               |
| `VPS_PORT`            | Port SSH réel du serveur                        |
| `VPS_USER`            | `pwastore-deploy`                               |
| `VPS_SSH_KEY`         | Clé privée complète, lignes BEGIN/END comprises |
| `VPS_SSH_KNOWN_HOSTS` | Contenu vérifié de `pwastore-known-hosts`       |

Les cinq secrets sont obligatoires. La clé privée est écrite temporairement avec des permissions `0600`, puis supprimée en fin d’étape. Les actions GitHub sont épinglées à des SHA complets ; les credentials de checkout ne sont pas conservés. Les permissions du workflow sont `contents: read`.

## 4. Nginx et API

Sauvegarder **le seul vhost de `pwastore.online`**, puis intégrer les directives de `deploy/nginx/pwastore-frontend.conf` dans son bloc HTTPS existant, en remplaçant ses anciens blocs `root` et `location` correspondants. Conserver `listen`, `server_name`, les certificats TLS et les éventuels headers de sécurité. Ce fichier est un fragment, pas un vhost autonome. Ne pas l’inclure dans le vhost de l’API.

Installer également le snippet partagé **avant** de valider la configuration :

```sh
sudo install -m 0644 deploy/nginx/pwastore-security-headers.conf /etc/nginx/snippets/pwastore-security-headers.conf
sudo nginx -t
# Exécuter seulement si le contrôle précédent réussit :
sudo systemctl reload nginx
```

Cela se fait une seule fois. Aucun reload/redémarrage Nginx pendant les déploiements statiques. Vérifier aussi l’absence de `open_file_cache` conservant l’ancienne cible et la compatibilité de tout `disable_symlinks` hérité. Les routes Vue utilisent le fallback `index.html` ; les assets inexistants répondent 404. `index.html` n’est pas stocké ; le worker, le manifeste et les métadonnées sont revalidés. Seuls les assets fingerprintés ont un cache immutable d’un an.

L’API doit déjà autoriser `https://pwastore.online` dans son CORS, avec les méthodes et headers utilisés (`X-PWA-Auth`, `Content-Type`, `Accept-Language`, `X-Country`). Le workflow ne modifie pas Laravel. Le contrôle complémentaire `python3 scripts/deploy/check_runtime.py` utilise `X-PWA-Auth: cookie`, vérifie une réponse JSON, `Access-Control-Allow-Origin: https://pwastore.online` et `Access-Control-Allow-Credentials: true` sur `/api/categories`, ainsi que la prérequête OPTIONS. L’API doit définir `PWA_FRONTEND_URL=https://pwastore.online` exactement. Le navigateur utilise un cookie HttpOnly/Secure ; les parcours login, OTP, réinitialisation, justificatif, expiration et déconnexion doivent être validés manuellement. Voir [le guide de validation cookie](AUTH_COOKIE.md).

Chaque `location` qui définit `add_header` inclut explicitement `pwastore-security-headers.conf`, car Nginx 1.22 n’hérite plus des `add_header` du bloc parent dans ce cas. Le snippet fournit HSTS, nosniff, la protection anti-iframe, Referrer-Policy et Permissions-Policy, avec `always`, y compris sur les réponses d’erreur. Ne pas supprimer ces includes en adaptant le vhost.

État observé le 13 octobre 2026 pendant la préparation : `/api/categories` a d’abord répondu 200, puis 500 avec et sans l’en-tête `Origin`. Vérifier et résoudre cette erreur serveur avant le premier déploiement ; aucune modification du backend n’a été effectuée ici.

Aucun secret n’est injecté au frontend ; l’URL publique de l’API est intégrée au build et à la CSP. Les mises à jour du service worker sont vérifiées à l’ouverture, au retour sur l’onglet et toutes les heures. L’utilisateur accepte un rechargement pour activer une version en attente ; s’il refuse, fermer tous les onglets de l’ancienne version permet l’activation normale.

## 5. Fonctionnement du workflow

`.github/workflows/deploy-production.yml` démarre sur push vers `main` ou manuellement. `concurrency` sérialise le workflow sans interrompre un déploiement actif ; un verrou serveur protège aussi l’activation et les rollbacks manuels.

1. Installation avec les deux fichiers lock, lint sans modification et tests unitaires du frontend.
2. Build PWA ; vérification HTML/JS/CSS/manifeste/worker/icônes ; ajout d’un `release.json` contenant le commit et les empreintes SHA-256 des fichiers.
3. Tests de sécurité du déploiement ; artifact contenant exclusivement `dist/pwa` et ses métadonnées publiques, sans code source ni outils de déploiement.
4. Job `deploy` uniquement sur `main`, dépendant de `build`. Transfert vers `shared/frontend/incoming/<SHA>-<run>-<attempt>` par SSH vérifié/rsync. Aucun `rsync --delete`.
5. Validation du manifeste contre l’empreinte calculée sur le runner, du commit, de l’ensemble exact des fichiers et de leurs empreintes. Déplacement vers `releases`, puis remplacement atomique du lien `app`.
6. Vérifications HTTPS du commit, du contenu des JS/CSS/icônes/worker/manifeste et des routes principales. Les contrôles de sécurité, cache et API/CORS se lancent séparément avec `python3 scripts/deploy/check_runtime.py`. Trois tentatives ; restauration de l’ancien lien sur échec détecté. Un simple HTTP 200 ne suffit pas.
7. Marquage de la version saine, conservation des cinq versions saines les plus récentes, toujours en protégeant la version active. Les releases échouées et transferts interrompus restent disponibles pour diagnostic, hors de la purge automatique.

Dans **Actions → Deploy frontend production → Run workflow**, sélectionner `main`. Un lancement sur une autre branche compile seulement et ne déploie pas.

## 6. Rollback manuel

Depuis une copie fiable du dépôt sur votre machine, utiliser une configuration SSH locale `production` avec les mêmes contrôles de clé d’hôte. Lister les versions validées :

```sh
ssh production 'ls -lt /var/www/apps/pwastore/shared/frontend/healthy'
ssh production 'readlink -f /var/www/apps/pwastore/app'
```

Remplacer l’identifiant ci-dessous par une version de cette liste :

```sh
ssh production 'python3 - rollback SHA_COMPLET-RUN-ATTEMPT' < scripts/deploy/remote.py
```

Le rollback vérifie les fichiers, active la cible, effectue les contrôles HTTP/API puis restaure le lien initial s’ils échouent. Il partage le verrou des déploiements. Un push suivant sur `main` redéploiera le code actuel.

Pour restaurer exceptionnellement la sauvegarde legacy (sans `release.json`), suspendre les workflows et utiliser une session administrateur : prendre le verrou `shared/frontend/deploy.lock`, vérifier la cible `releases/legacy-<date>`, créer un lien temporaire vers cette cible puis remplacer `app` avec `mv -Tf`. Ne jamais supprimer une release active. Vérifier ensuite HTTPS et remettre le propriétaire du lien à `pwastore-deploy` avec `chown -h`.

## 7. Logs et dépannage

- **GitHub Actions** : logs `build`/`deploy` et résumé de déploiement ; `ROLLBACK: restored …` confirme la restauration. La release exacte apparaît dans `https://pwastore.online/release.json` (la PWA en cache peut encore présenter la version précédente jusqu’à son actualisation).
- **VPS** : journaux access/error du vhost Nginx, `journalctl -u ssh`, cible de `app`, marqueurs `shared/frontend/healthy`.
- **Exit code 1 sans détail avec l’ancien script** : les validations initiales pouvaient échouer silencieusement, notamment avec `VPS_USER=root`, un hôte contenant `https://` ou un secret avec des espaces. Pousser la version corrigée de `scripts/deploy/upload.sh` et lancer une **nouvelle exécution sur le nouveau commit** ; « Re-run jobs » sur une ancienne exécution reprend l’ancien commit. Les annotations indiquent désormais la variable ou la phase fautive sans afficher les valeurs secrètes. Ne jamais ajouter `set -x`.
- **VPS_USER=root** : la version actuelle accepte ce compte avec un avertissement. Le compte dédié décrit dans ce guide reste préférable pour limiter les permissions. L’ancienne version du script le refusait silencieusement.
- **Host key verification failed** : comparer la nouvelle empreinte dans la console LWS avant toute mise à jour du secret.
- **Permission denied** : vérifier clé publique, utilisateur, port, droits SSH, ACL du parent, propriétaire du lien et sticky bit. Ne pas donner sudo au compte.
- **app must be a symlink** : effectuer la migration initiale documentée.
- **Missing or redirected directory** : créer les répertoires exacts, sans liens intermédiaires.
- **API CORS origin mismatch** : corriger le CORS du backend séparément ; le contrôle complémentaire échoue même si l’API répond 200.
- **HTTP content mismatch** : inspecter racine Nginx, DNS, proxy/CDN et cache ; le domaine doit réellement servir la nouvelle release. Tous les headers hérités doivent rester cohérents.
- **Stale .app-next** : inspecter ce lien et l’actuel `app`, puis retirer uniquement le lien temporaire confirmé, sous verrou, avant de relancer.
- **Arrêt brutal du VPS ou SIGKILL** : aucun script ne peut garantir un rollback après un arrêt matériel ; comparer le lien actif aux marqueurs sains et lancer le rollback manuel. Les interruptions normales sont traitées.
- **Ancien onglet / chargement différé après déploiement** : accepter la mise à jour ou recharger. Les anciennes releases sont conservées pour rollback, mais Nginx sert uniquement la release active ; elles ne constituent pas un CDN historique des chunks.

Avant le premier push, terminer la préparation VPS, les secrets et Nginx. Après le premier déploiement, tester manuellement installation PWA, mise à jour entre deux versions, navigation, connexion/déconnexion, e-mail et redirections. Les contrôles automatisés ne remplacent pas ces parcours avec un véritable compte.
