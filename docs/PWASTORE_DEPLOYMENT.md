# Déployer PWA Store

Guide de mise en production des deux projets : l’API Laravel (`oneapp`) et le frontend Quasar (`oneappapp`). Aucun déploiement public ne doit avoir lieu sans validation explicite du porteur de projet.

## Architecture

| Élément                        | Rôle                                                                     | Exemple d’adresse                                                           |
| ------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| API Laravel                    | Comptes, catalogue, publication, administration, e-mails                 | `https://api.pwastore.example`                                              |
| Frontend Quasar (PWA statique) | Interface publique, espace utilisateur, portail développeur, back-office | `https://pwastore.example`                                                  |
| Origines isolées (optionnel)   | Builds de PWA hébergés, une origine par application                      | `https://pwa-{id}.pwastore-apps.example` — voir `PWASTORE_BUILD_HOSTING.md` |

## Prérequis

- PHP 8.3 ou plus avec les extensions `pdo_mysql`, `curl`, `zip`, `dom`, `fileinfo`, `mbstring`, `openssl`.
- MySQL 8 (ou MariaDB compatible), base en `utf8mb4`.
- Composer 2, Node 20 ou plus pour construire le frontend.
- Un serveur SMTP. **Le mot de passe SMTP communiqué pendant le développement doit être changé avant la mise en ligne.**

## 1. API Laravel

### Variables d’environnement (`.env` du serveur, jamais commité)

| Variable                                                                                                                            | Valeur en production                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `APP_ENV`                                                                                                                           | `production`                                                                           |
| `APP_DEBUG`                                                                                                                         | `false` — indispensable : sinon les erreurs affichent le détail interne                |
| `APP_URL`                                                                                                                           | `https://api.pwastore.example`                                                         |
| `APP_KEY`                                                                                                                           | généré une fois (`php artisan key:generate`), puis conservé                            |
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`                                                  | base de production                                                                     |
| `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | SMTP                                                                                   |
| `QUEUE_CONNECTION`                                                                                                                  | `database`                                                                             |
| `CACHE_STORE`                                                                                                                       | `database` ou `redis`                                                                  |
| `PWA_FRONTEND_URL`                                                                                                                  | `https://pwastore.example` (liens des e-mails, redirections)                           |
| `PWA_CORS_ORIGINS`                                                                                                                  | `https://pwastore.example` (liste séparée par des virgules)                            |
| `PWA_SUPPORT_EMAIL`                                                                                                                 | adresse qui reçoit le formulaire de contact                                            |
| `PWA_RUNTIME_DOMAIN`                                                                                                                | domaine des origines isolées, ou vide tant que l’hébergement des builds n’est pas prêt |
| `PWA_SESSION_DAYS`                                                                                                                  | durée d’une session « Rester connecté » (30 par défaut)                                |
| `PWA_ANONYMIZE_AFTER_DAYS`                                                                                                          | délai avant anonymisation d’un compte désactivé (30)                                   |
| `PWA_DOCUMENT_RETENTION_DAYS`                                                                                                       | conservation des justificatifs (30)                                                    |

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

Elle déclenche : contrôle des PWA par URL (toutes les 6 h), purge des justificatifs et des codes expirés, anonymisation des comptes désactivés (quotidien), résumé des avis (8 h). Vérifier avec `php artisan schedule:list`.

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
VITE_API_URL=https://api.pwastore.example/api npm run build:pwa
```

Déployer le contenu de `dist/pwa/` sur un hébergement statique HTTPS avec :

- **repli SPA** : toute route inconnue sert `index.html` (le routeur est en mode `history`) ;
- **cache** : `assets/*` en `Cache-Control: public, max-age=31536000, immutable` ; `index.html`, `sw.js` et `manifest.json` en `no-cache` pour que les mises à jour soient prises immédiatement.

## 3. Sauvegardes

| Quoi                                          | Fréquence                              | Remarque                                                                                                                |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Base MySQL (`mysqldump --single-transaction`) | quotidienne, et avant chaque migration | conserver 30 jours, une copie hors serveur                                                                              |
| `storage/app/private` (builds, justificatifs) | quotidienne                            | les justificatifs sont purgés automatiquement ; ne pas les conserver au-delà de leur durée dans les sauvegardes longues |
| `storage/app/public` (captures d’écran)       | quotidienne                            |                                                                                                                         |
| `.env` du serveur                             | à chaque modification                  | dans un coffre de secrets, jamais dans Git                                                                              |

Tester une restauration complète sur un environnement de préproduction au moins une fois avant l’ouverture.

## 4. Vérifications avant ouverture

- [ ] `APP_DEBUG=false`, `APP_ENV=production`, HTTPS partout.
- [ ] `PWA_CORS_ORIGINS` limité à l’adresse du frontend.
- [ ] Mot de passe SMTP changé ; envoi d’un code d’inscription reçu.
- [ ] `php artisan schedule:list` liste les 5 tâches ; le worker tourne (`queue:work`).
- [ ] Les comptes administrateurs ont des permissions limitées à leur rôle (back-office → Utilisateurs).
- [ ] Les textes légaux (CGU, confidentialité, règles de publication) ont été validés par un juriste et les parties « À compléter » renseignées.
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
