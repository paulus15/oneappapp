# PWA Store — Contrat d'API

Base : `{APP_URL}/api`. Format JSON. Authentification : `Authorization: Bearer <jeton Sanctum>`.

Légende statut : **E** existe et testé · **E\*** existe, à corriger · **N** nouveau (lot indiqué).
Auth : `—` public · `U` compte connecté · `D` profil développeur · `A` administrateur (permission indiquée).

## Conventions

- Erreurs de validation : `422` avec `{ message, errors: { champ: [..] } }`.
- Refus de droit : `403` avec `message` en français, lisible par l'utilisateur.
- Conflit d'état (transition interdite, quota) : `409` avec `message`.
- Trop de requêtes : `429`.
- OTP requis : `202` avec `{ requires_otp: true, challenge_id, purpose, channel, destination, expires_at, retry_after, code_sent, message }`.
- Listes paginées : format Laravel `{ data, current_page, last_page, per_page, total }`.
- Session ouverte : `{ user, access_token, token_type: "Bearer" }`. `user` = `accountPayload` : attributs du compte, `country`, `developer_profile`, `capabilities`, `publication_blockers`.

## 1. Identité et compte

| Méthode      | Route                    | Auth | Statut | Notes                                                                                                    |
| ------------ | ------------------------ | ---- | ------ | -------------------------------------------------------------------------------------------------------- |
| POST         | `/auth/register`         | —    | E      | `name, email, password, password_confirmation, country_id, two_factor_enabled?` → 201 OTP `verify_email` |
| POST         | `/auth/login`            | —    | E\*    | 200 session, ou 202 OTP (e-mail non vérifié ou 2FA). À ajouter : verrou par compte (Lot 1)               |
| POST         | `/auth/otp/verify`       | —    | E      | `challenge_id, code` → session, ou 202 étape suivante                                                    |
| POST         | `/auth/otp/resend`       | —    | E      | `challenge_id`                                                                                           |
| POST         | `/auth/logout`           | U    | E      | Révoque le jeton courant                                                                                 |
| GET          | `/auth/me`               | U    | E      | `accountPayload`                                                                                         |
| POST         | `/auth/email/resend`     | U    | E      | Nouvel OTP `verify_email`                                                                                |
| POST         | `/auth/password/forgot`  | —    | E      | `email` → 202 toujours identique                                                                         |
| POST         | `/auth/password/reset`   | —    | E      | `email, token, password, password_confirmation` ; révoque tous les jetons                                |
| PUT          | `/account`               | U    | E      | `name, email, country_id, current_password?` ; changement d'e-mail → 202 OTP                             |
| PUT          | `/account/password`      | U    | E      | `current_password, password, password_confirmation` ; révoque les autres jetons                          |
| POST         | `/account/two-factor`    | U    | E      | `enabled, channel=email, current_password` → 202 OTP                                                     |
| GET          | `/account/sessions`      | U    | E      | Jetons actifs (nom, dernière utilisation, courant)                                                       |
| DELETE       | `/account/sessions/{id}` | U    | E      | Révoquer une session                                                                                     |
| POST         | `/account/deactivate`    | U    | E      | `current_password` → 202 OTP, puis désactivation                                                         |
| GET          | `/account/export`        | U    | E      | Export JSON des données personnelles                                                                     |
| GET / PUT    | `/account/preferences`   | U    | E      | Langue, notifications, consentement « vus récemment »                                                    |
| GET / DELETE | `/account/recent`        | U    | E      | Consultations récentes (si consentement) ; effacement                                                    |
| POST         | `/apps/{id}/view`        | —    | E      | Enregistre une consultation uniquement pour un compte ayant consenti (compteurs agrégés : Lot 8)         |
| GET          | `/account/reports`       | U    | E      | Mes signalements et leur issue                                                                           |
| GET          | `/countries`             | —    | E      | Pays actifs                                                                                              |

## 2. Éditeurs

| Méthode             | Route                                     | Auth                  | Statut | Notes                                                 |
| ------------------- | ----------------------------------------- | --------------------- | ------ | ----------------------------------------------------- |
| POST                | `/developer/activate`                     | U                     | E      | `type: individual\|organization`, idempotent          |
| GET                 | `/developer/profile`                      | U                     | E      | Profil + historique                                   |
| PUT                 | `/developer/profile`                      | D                     | E      | Statuts `draft`, `rejected` uniquement                |
| POST                | `/developer/profile/identity`             | D                     | E      | Multipart `type, expires_at, file`                    |
| POST                | `/developer/profile/submit`               | D                     | E      | Profil complet + pièce valide + e-mail vérifié        |
| GET                 | `/developer/dashboard`                    | D                     | E\*    | À enrichir : vues, avis, signalements (Lot 8)         |
| GET                 | `/developer/quotas`                       | U                     | E      |                                                       |
| GET                 | `/publishers/{id}`                        | —                     | E      | Profil public : nom public, pays, site, apps publiées |
| GET                 | `/developer-profiles/{profile}/documents` | U/A                   | E      | Propriétaire ou admin                                 |
| POST                | `/developer-profiles/{profile}/documents` | A `developers.review` | E      | Demande motivée                                       |
| POST / GET / DELETE | `/developer-documents/{document}`         | U/A                   | E      | Dépôt, téléchargement journalisé, suppression         |
| GET                 | `/admin/developers`                       | A `developers.review` | E\*    | À ajouter : filtre par statut, recherche (Lot 6)      |
| POST                | `/admin/developers/{profile}/review`      | A `developers.review` | E      | `status, reason`                                      |

## 3. Catalogue public

| Méthode    | Route                                          | Auth | Statut | Notes                                                                                                        |
| ---------- | ---------------------------------------------- | ---- | ------ | ------------------------------------------------------------------------------------------------------------ |
| GET        | `/apps`                                        | —    | E\*    | `search, category, sort_by, filter, page`. À corriger : visibilité unique (D4), N+1 (D9)                     |
| GET        | `/apps/suggestions`                            | —    | E      |                                                                                                              |
| GET        | `/apps/{id}`                                   | —    | E\*    | À ajouter : éditeur public, langues, apps similaires ; avis retirés de la réponse (paginés à part)           |
| GET        | `/apps/{id}/reviews`                           | —    | E      | Avis visibles paginés + réponse développeur                                                                  |
| GET        | `/apps/{id}/similar`                           | —    | E      | Même catégorie, publiées                                                                                     |
| GET        | `/apps/{application}/launch`                   | —    | E      | URL d'ouverture                                                                                              |
| POST       | `/apps/{id}/views`                             | —    | N (8)  | Vue de fiche, dédupliquée par appareil et par heure                                                          |
| GET        | `/home`                                        | —    | E      | Sections d'accueil : mises en avant, nouveautés, populaires, récemment mises à jour, collections, catégories |
| GET        | `/categories`                                  | —    | E      | `?all=1` pour l'admin                                                                                        |
| GET        | `/categories/{id\|slug}`                       | —    | E      |                                                                                                              |
| GET        | `/collections/{slug}`                          | —    | E      | Sélection éditoriale                                                                                         |
| POST       | `/contact`                                     | —    | E      | `name, email, subject, message` ; envoi au support, champ piège anti-robot, 3 envois / 10 min                |
| GET        | `/media/screenshots/{file}`                    | —    | E      |                                                                                                              |
| GET        | `/versions/{id}/download`                      | —/D  | E      | Réservé aux versions publiées, ou propriétaire/admin                                                         |
| POST / GET | `/install-intents`, `/install-intents/{token}` | —    | E      |                                                                                                              |

## 4. Espace utilisateur

| Méthode      | Route                           | Auth | Statut | Notes                                                          |
| ------------ | ------------------------------- | ---- | ------ | -------------------------------------------------------------- |
| GET          | `/favorites`                    | U    | E      |                                                                |
| PUT / DELETE | `/favorites/{application}`      | U    | E      |                                                                |
| GET          | `/library`                      | U    | E      | `device_uuid?`                                                 |
| GET          | `/library/updates`              | U    | E      |                                                                |
| POST         | `/installations`                | U    | E      | Déclaratif                                                     |
| PATCH        | `/installations/{installation}` | U    | E      |                                                                |
| GET          | `/account/reviews`              | U    | E      | Mes avis                                                       |
| POST         | `/reviews`                      | U    | E\*    | À ajouter : e-mail vérifié, 2000 car. max, throttle (D5)       |
| DELETE       | `/reviews/{review}`             | U    | E      | Auteur                                                         |
| POST         | `/reviews/{review}/reply`       | D    | E      | Développeur propriétaire, une réponse                          |
| DELETE       | `/reviews/{review}/reply`       | D    | E      | Retirer sa réponse                                             |
| POST         | `/reports`                      | U    | E      | `target_type: application\|review, target_id, reason, details` |
| GET          | `/notifications`                | U    | N (10) | Paginé                                                         |
| POST         | `/notifications/read`           | U    | N (10) | `ids[]` ou toutes                                              |
| GET          | `/notifications/unread-count`   | U    | N (10) |                                                                |

## 5. Publication (développeur)

| Méthode | Route                            | Auth | Statut | Notes                                                                                                                                             |
| ------- | -------------------------------- | ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/developer/apps`                | D    | E      |                                                                                                                                                   |
| POST    | `/apps`                          | D    | E      | Brouillon, multipart médias                                                                                                                       |
| PUT     | `/apps/{id}`                     | D    | E      | Modifier une app publiée la renvoie en revue                                                                                                      |
| PUT     | `/apps/{application}/source`     | D    | E      | `source_type: url\|build, external_url?`                                                                                                          |
| POST    | `/apps/{application}/check-url`  | D    | E      | Contrôle SSRF-sûr                                                                                                                                 |
| GET     | `/apps/{application}/url-checks` | D    | E      | Historique des contrôles                                                                                                                          |
| GET     | `/apps/{application}/readiness`  | D    | E      | `{ gaps[], blockers[], ready }` : ce qui manque à la fiche ou à la source, et les blocages de l'éditeur ; la soumission applique les mêmes règles |
| POST    | `/versions`                      | D    | E      | Upload ZIP + analyse                                                                                                                              |
| POST    | `/apps/{application}/submit`     | D    | E      |                                                                                                                                                   |
| POST    | `/apps/{application}/publish`    | D    | E      | `approved → published`                                                                                                                            |
| POST    | `/apps/{application}/archive`    | D    | E      | Retrait volontaire                                                                                                                                |
| GET     | `/apps/{application}/events`     | D    | E      | Historique de publication                                                                                                                         |
| POST    | `/versions/{version}/extract`    | D    | E      | Déploiement isolé d'une version approuvée (rollback inclus)                                                                                       |
| GET     | `/analytics/summary/{app_id}`    | D/A  | E      |                                                                                                                                                   |
| POST    | `/analytics/events`              | U    | E\*    | Restreindre aux apps publiées + throttle (D2)                                                                                                     |
| POST    | `/push-notifications`            | D    | E\*    | Désactivé (410) jusqu'à intégration réelle (D1)                                                                                                   |

## 6. PWA Lab

| Méthode | Route                | Auth | Statut | Notes                                                                                                                                     |
| ------- | -------------------- | ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| POST    | `/lab/analyses`      | D    | N (9)  | `url` → rapport : HTTPS, manifeste, icônes, service worker déclaré, métadonnées, critères d'installation, recommandations. Throttle 5/min |
| GET     | `/lab/analyses`      | D    | N (9)  | Historique de l'utilisateur                                                                                                               |
| GET     | `/lab/analyses/{id}` | D    | N (9)  |                                                                                                                                           |

Performance et accessibilité nécessitent un navigateur headless (Lighthouse). Hors périmètre tant que l'infrastructure n'est pas décidée ; le rapport l'indique.

## 7. Administration

| Méthode             | Route                                       | Permission         | Statut | Notes                                                                   |
| ------------------- | ------------------------------------------- | ------------------ | ------ | ----------------------------------------------------------------------- |
| GET                 | `/admin/stats`                              | `audit.view`       | E      | Compteurs réels                                                         |
| GET                 | `/admin/users`                              | `users.manage`     | E      | Recherche, filtre statut/rôle/pays, pagination                          |
| GET                 | `/admin/users/{user}`                       | `users.manage`     | E      |                                                                         |
| POST                | `/admin/users/{user}/status`                | `users.manage`     | E      | `status, reason` ; suspension révoque les jetons                        |
| PUT                 | `/admin/users/{user}/permissions`           | `settings.manage`  | E      |                                                                         |
| GET                 | `/admin/apps`                               | `apps.moderate`    | E\*    | Pagination + filtres (D8)                                               |
| POST                | `/admin/apps/{application}/review`          | `apps.moderate`    | E\*    | Étendre aux statuts cibles, dont `changes_requested`, `suspended`       |
| POST                | `/admin/versions/{version}/review`          | `apps.moderate`    | E      |                                                                         |
| PUT                 | `/apps/{id}` (`trust_score`, `is_featured`) | `catalog.manage`   | E\*    | `is_featured` à rendre modifiable                                       |
| POST / PUT / DELETE | `/categories`, `/categories/{id}`           | `catalog.manage`   | E\*    | Refuser la suppression d'une catégorie utilisée (D7)                    |
| CRUD                | `/admin/collections`                        | `catalog.manage`   | E      |                                                                         |
| GET                 | `/admin/reports`                            | `reports.handle`   | E      |                                                                         |
| POST                | `/admin/reports/{report}/resolve`           | `reports.handle`   | E      | `decision, reason`                                                      |
| POST                | `/admin/reviews/{review}/moderate`          | `reviews.moderate` | E      | `status: visible\|hidden, reason`                                       |
| GET                 | `/admin/audit-logs`                         | `audit.view`       | E      | Filtres acteur, action, période                                         |
| GET                 | `/admin/countries/summary`                  | `audit.view`       | E      |                                                                         |
| GET / PUT           | `/admin/settings`                           | `settings.manage`  | N (10) | Quotas, devise, montant de contribution (paiements toujours désactivés) |
| DELETE              | `/apps/{id}`                                | —                  | E\*    | Suppression définitive : remplacée par l'archivage (D10)                |

## 8. Compatibilité

- Les routes existantes gardent leur forme. Les changements de réponse sont additifs (nouveaux champs).
- `applications.status` : pendant la migration, l'API renvoie le nouveau statut et un champ `legacy_status` pour la vitrine Blade, jusqu'à son retrait.
- Toute route modifiée reçoit un test de non-régression avant d'être changée.
