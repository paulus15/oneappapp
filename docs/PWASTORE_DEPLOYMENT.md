# Déployer PWA Store

Guide de mise en production des deux projets : l’API Laravel (`oneapp`) et le frontend Quasar (`oneappapp`). Aucun déploiement public ne doit avoir lieu sans validation explicite du porteur de projet.

## Architecture

| Élément                        | Rôle                                                                       | Exemple d’adresse                                                           |
| ------------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| API Laravel                    | Comptes, catalogue, publication, administration, e-mails, script de mesure | `https://pwastore.online/api` (`APP_URL=https://pwastore.online`)           |
| Frontend Quasar (PWA statique) | Interface publique, espace utilisateur, portail développeur, back-office   | adresse définie par `PWA_FRONTEND_URL`                                      |
| Origines isolées (optionnel)   | Builds ZIP hébergés, une origine par application (désactivé par défaut)    | `https://pwa-{id}.pwastore-apps.example` — voir `PWASTORE_BUILD_HOSTING.md` |

## Prérequis

- PHP 8.3 ou plus avec les extensions `pdo_mysql`, `curl`, `zip`, `dom`, `fileinfo`, `mbstring`, `openssl`.
- MySQL 8 (ou MariaDB compatible), base en `utf8mb4`.
- Composer 2, Node 20 ou plus pour construire le frontend.
- Un serveur SMTP. **Le mot de passe SMTP communiqué pendant le développement doit être changé avant la mise en ligne.**

## 1. API Laravel

### Variables d’environnement (`.env` du serveur, jamais commité)

| Variable                                                                                                                            | Valeur en production                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `APP_ENV`                                                                                                                           | `production`                                                                                                                                           |
| `APP_DEBUG`                                                                                                                         | `false` — indispensable : sinon les erreurs affichent le détail interne                                                                                |
| `APP_URL`                                                                                                                           | `https://pwastore.online` (local : `https://oneapp.test`)                                                                                              |
| `PWA_PUBLIC_API_URL`                                                                                                                | `https://pwastore.online/api` (local : `https://oneapp.test/api`) ; adresse du script de mesure donnée aux développeurs. Par défaut `APP_URL` + `/api` |
| `APP_KEY`                                                                                                                           | généré une fois (`php artisan key:generate`), puis conservé                                                                                            |
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`                                                  | base de production                                                                                                                                     |
| `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | SMTP                                                                                                                                                   |
| `QUEUE_CONNECTION`                                                                                                                  | `database`                                                                                                                                             |
| `CACHE_STORE`                                                                                                                       | `database` ou `redis`                                                                                                                                  |
| `PWA_FRONTEND_URL`                                                                                                                  | adresse publique du frontend (liens des e-mails, redirections) — obligatoire                                                                           |
| `PWA_CORS_ORIGINS`                                                                                                                  | adresse du frontend (liste séparée par des virgules) ; jamais `*` en production                                                                        |
| `PWA_SUPPORT_EMAIL`                                                                                                                 | adresse qui reçoit le formulaire de contact                                                                                                            |
| `PWA_BUILD_UPLOADS`                                                                                                                 | `false` (défaut) : publication en mode lien uniquement ; `true` seulement si l’hébergement des builds est prêt                                         |
| `PWA_RUNTIME_DOMAIN`                                                                                                                | domaine des origines isolées, ou vide tant que l’hébergement des builds n’est pas prêt                                                                 |
| `PWA_BUILD_MAX_KB`                                                                                                                  | taille maximale d’un ZIP (50000 par défaut)                                                                                                            |
| `PWA_SESSION_DAYS`                                                                                                                  | durée d’une session « Rester connecté » (30 par défaut)                                                                                                |
| `PWA_ANONYMIZE_AFTER_DAYS`                                                                                                          | délai avant anonymisation d’un compte désactivé (30)                                                                                                   |
| `PWA_DOCUMENT_RETENTION_DAYS`                                                                                                       | conservation des justificatifs (30)                                                                                                                    |
| `PWA_RETENTION_MEASUREMENT_MONTHS`                                                                                                  | vues, signaux d’installation, événements d’usage (13 mois)                                                                                             |
| `PWA_RETENTION_AUDIT_IP_MONTHS`                                                                                                     | adresses IP du journal d’audit, effacées ensuite (12 mois)                                                                                             |
| `PWA_RETENTION_TECHNICAL_MONTHS`                                                                                                    | contrôles d’URL et analyses PWA Lab (12 mois)                                                                                                          |
| `PWA_RETENTION_NOTIFICATIONS_MONTHS`                                                                                                | notifications lues (6 mois)                                                                                                                            |
| `PWA_RETENTION_AUDIT_MONTHS`                                                                                                        | journal d’audit : vide = conservé ; durée à fixer avec la revue juridique (ex. `60` pour cinq ans)                                                     |
| `LOG_LEVEL`                                                                                                                         | `warning`                                                                                                                                              |
| `TRUSTED_PROXIES`                                                                                                                   | vide si nginx parle directement à PHP-FPM ; adresses d’un répartiteur de charge ou d’un CDN placé devant nginx (séparées par des virgules)             |
| `PWA_API_PER_MINUTE`                                                                                                                | plafond global de requêtes par compte ou par adresse (300)                                                                                             |
| `PWA_HASH_KEY`                                                                                                                      | clé des empreintes pseudonymes (vues, appareils, activations), distincte d’`APP_KEY` ; une fois fixée, ne plus la changer                              |

Les durées de conservation sont celles annoncées dans la politique de confidentialité (`src/content/pages.js` du frontend) : les modifier impose de mettre la politique à jour.

Les quotas, la contribution et la devise se règlent ensuite dans le back-office (Paramètres). Les paiements restent désactivés.

### Installation et mise à jour

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force          # sauvegarder la base avant (voir § Sauvegardes)
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

Droits d’écriture pour l’utilisateur PHP : `storage/` et `bootstrap/cache/`.

### Tâches planifiées (cron)

Une seule entrée cron, toutes les minutes :

```
* * * * * cd /var/www/oneapp && php artisan schedule:run >> /dev/null 2>&1
```

Elle déclenche sept tâches. Vérifier avec `php artisan schedule:list`.

| Commande                     | Fréquence      | Rôle                                                                                                                        |
| ---------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pwa:check-external`         | toutes les 6 h | Contrôle des PWA par lien ; un changement de manifeste est signalé aux modérateurs, seule l’indisponibilité répétée suspend |
| `pwa:purge-documents`        | quotidienne    | Suppression des justificatifs et pièces d’identité arrivés au terme de leur conservation                                    |
| `pwa:purge-auth-challenges`  | quotidienne    | Suppression des codes de confirmation expirés                                                                               |
| `pwa:anonymize-accounts`     | quotidienne    | Anonymisation des comptes désactivés depuis `PWA_ANONYMIZE_AFTER_DAYS` jours                                                |
| `pwa:purge-data`             | 03:00          | Durées de conservation : vues, signaux, événements, IP du journal, contrôles d’URL, analyses Lab, notifications lues        |
| `pwa:purge-media {--days=7}` | 03:30          | Images et dossiers d’hébergement que plus rien ne référence (fiches, modifications en attente, demandes, versions)          |
| `pwa:review-digest`          | 08:00          | Résumé quotidien des avis aux développeurs                                                                                  |

### File d’attente (e-mails)

Les e-mails partent par la file `database`. Un worker doit tourner en permanence, par exemple avec Supervisor :

```ini
[program:pwastore-worker]
command=php /var/www/oneapp/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
stopwaitsecs=3600
stdout_logfile=/var/log/pwastore-worker.log
```

Après chaque déploiement : `php artisan queue:restart`. Les échecs sont visibles avec `php artisan queue:failed`.

### Serveur web

HTTPS obligatoire. Racine sur `public/`, réécriture vers `index.php` (configuration Laravel standard). L’API ajoute ses propres en-têtes de sécurité (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS en HTTPS).

## 2. Frontend Quasar

L’adresse de l’API est fixée à la construction ; elle sert aussi à la politique de sécurité (CSP) de la page, qui n’autorise les appels qu’à cette origine.

```bash
npm ci
VITE_API_URL=https://pwastore.online/api npm run build:pwa
```

Déployer le contenu de `dist/pwa/` sur un hébergement statique HTTPS avec :

- **repli SPA** : toute route inconnue sert `index.html` (le routeur est en mode `history`) ;
- **cache** : `assets/*` en `Cache-Control: public, max-age=31536000, immutable` ; `index.html`, `sw.js` et `manifest.json` en `no-cache` pour que les mises à jour soient prises immédiatement.
- **en-têtes de sécurité** (une balise `<meta>` ne peut pas interdire l’affichage dans un cadre) :

```nginx
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Exemple : sans `frame-ancestors`, un site tiers peut afficher le Store dans un cadre invisible et faire cliquer « Supprimer » à la place d’un autre bouton (clickjacking).

### Hébergement des builds (si `PWA_BUILD_UPLOADS=true`)

Les applications hébergées vivent sur `pwa-{id}.<PWA_RUNTIME_DOMAIN>`. Avant d’activer le dépôt ZIP, inscrire ce domaine à la [Public Suffix List](https://publicsuffix.org/submit/) : chaque `pwa-{id}` devient alors un site distinct, et une application ne peut plus poser de cookie lu par les autres. Le domaine doit rester différent de celui du Store.

## 3. Sauvegardes

| Quoi                                                 | Fréquence                              | Remarque                                                                                                                |
| ---------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Base MySQL (`mysqldump --single-transaction`)        | quotidienne, et avant chaque migration | conserver 30 jours, une copie hors serveur                                                                              |
| `storage/app/private` (builds, justificatifs)        | quotidienne                            | les justificatifs sont purgés automatiquement ; ne pas les conserver au-delà de leur durée dans les sauvegardes longues |
| `storage/app/public` (icônes, couvertures, captures) | quotidienne                            | les images retirées sont supprimées sept jours après qu’elles ne sont plus utilisées                                    |
| `.env` du serveur                                    | à chaque modification                  | dans un coffre de secrets, jamais dans Git                                                                              |

Tester une restauration complète sur un environnement de préproduction au moins une fois avant l’ouverture.

## 4. Vérifications avant ouverture

- [ ] `APP_DEBUG=false`, `APP_ENV=production`, HTTPS partout.
- [ ] `PWA_CORS_ORIGINS` limité à l’adresse du frontend ; `PWA_FRONTEND_URL` et `PWA_PUBLIC_API_URL` renseignés.
- [ ] `PWA_BUILD_UPLOADS=false` tant que l’hébergement des builds n’est pas prêt (voir `PWASTORE_BUILD_HOSTING.md`).
- [ ] Mot de passe SMTP changé ; envoi d’un code d’inscription reçu.
- [ ] `php artisan schedule:list` liste les 7 tâches ; le worker tourne (`queue:work`).
- [ ] Les comptes administrateurs ont des permissions limitées à leur rôle (back-office → Utilisateurs).
- [ ] Les textes légaux (CGU, confidentialité, règles de publication) ont été validés par un juriste et les parties « À compléter » renseignées (exploitant, hébergeur, prestataire d’e-mails, bases légales, formalité ARTCI).
- [ ] `composer audit` et `npm audit` sans vulnérabilité.
- [ ] Suites de tests au vert : `php artisan test`, `composer test:mysql`, `npm run test:unit`, `npm run test:e2e` (sur la préproduction ou en local).
- [ ] Sauvegarde et restauration testées.

## 5. Après une mise à jour

```bash
php artisan down
git pull && composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan event:cache
php artisan queue:restart
php artisan up
```

Puis redéployer le frontend construit avec la même `VITE_API_URL`.

Le dépôt backend contient aussi un déploiement automatisé vers un VPS (`.github/workflows/vps-deploy.yml`, `scripts/deploy-vps.sh`), décrit dans son `README.md`.

## Adresses (local et production)

| Variable                                                                                 | Local                                         | Production                                    |
| ---------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| Backend `APP_URL`                                                                        | `https://oneapp.test`                         | `https://pwastore.online`                     |
| Backend `PWA_PUBLIC_API_URL` (ligne de mesure des installations donnée aux développeurs) | `https://oneapp.test/api`                     | `https://pwastore.online/api`                 |
| Frontend `VITE_API_URL` (au build)                                                       | `https://oneapp.test/api` (valeur par défaut) | `https://pwastore.online/api`                 |
| Backend `PWA_RUNTIME_DOMAIN` (builds ZIP, domaine distinct)                              | `oneapp-pwa.test`                             | un domaine séparé, ex. `pwastore-apps.online` |

Changer `PWA_PUBLIC_API_URL` après la mise en production oblige les développeurs à recoller la ligne de mesure : la vérification « Vérifier mon site » signale alors « une autre adresse de PWA Store ».
