# PWA Store — Documentation de référence

État au 12 octobre 2026. Ce document est le point d’entrée : il résume chaque domaine et renvoie vers le document détaillé. Le français est la langue de référence.

| Projet                        | Emplacement                                        | Abrégé |
| ----------------------------- | -------------------------------------------------- | ------ |
| API Laravel 13                | `/Users/apple/LaravelProjects/oneapp`              | **B/** |
| Frontend Quasar / Vue 3 (PWA) | `/Users/apple/Documents/Quasar Projects/oneappapp` | **F/** |

Documents détaillés : [Architecture](PWASTORE_ARCHITECTURE.md) · [Contrat d’API](PWASTORE_API_CONTRACT.md) · [Processus de publication](PWASTORE_PUBLICATION_WORKFLOW.md) · [Audit de la publication](PWASTORE_PUBLICATION_AUDIT.md) · [Hébergement des builds](PWASTORE_BUILD_HOSTING.md) · [Déploiement](PWASTORE_DEPLOYMENT.md) · [Plan de tests](PWASTORE_TEST_PLAN.md) · [Roadmap](PWASTORE_ROADMAP.md) · [Mouvement](PWASTORE_MOTION.md) · [Ressources externes](project-audit/07_PWA_STORE_EXTERNAL_RESOURCES.md) · [Changelog](PWASTORE_CHANGELOG.md) · [Revue de sécurité et de qualité](PWASTORE_SECURITY_REVIEW.md).
Guides : [utilisateur FR](PWASTORE_USER_GUIDE_FR.md) / [EN](PWASTORE_USER_GUIDE_EN.md) · [développeur FR](PWASTORE_DEVELOPER_GUIDE_FR.md) / [EN](PWASTORE_DEVELOPER_GUIDE_EN.md).
Documents historiques : [`docs/archive/`](archive/) (audit initial du 10 octobre 2026).

---

## 1. Présentation

PWA Store est un magasin de **Progressive Web Apps**. Le public y découvre, ouvre, met en favori et note des applications Web installables. Les développeurs vérifiés y publient leurs PWA en **référençant leur adresse HTTPS (mode lien, par défaut)** ; le **dépôt d’un build ZIP** existe mais est **désactivé par défaut** (`PWA_BUILD_UPLOADS=false`). Chaque application et chaque modification sont examinées par un modérateur avant d’être visibles ; l’approbation publie automatiquement.

## 2. Vision

- Un canal complémentaire de découverte, de pré-lancement et de distribution Web, qui ne remplace ni Google Play ni l’App Store.
- Le parcours de publication : **le développeur prépare → PWA Store analyse → le développeur soumet → l’administrateur décide → PWA Store publie.**
- Aucune donnée inventée (statistiques mesurées uniquement) ; aucune promesse de sécurité absolue : les analyses réduisent des risques, elles ne les éliminent pas.

## 3. Architecture Laravel / Quasar

- **Laravel** : API JSON (`/api`), authentification Sanctum par jeton Bearer, règles métier côté serveur (droits, quotas, transitions de statut), e-mails par file d’attente, tâches planifiées, et service des builds sur des origines isolées (middleware `ServePwaRuntime`).
- **Quasar** : SPA/PWA statique en mode `history`, trois layouts (public, authentification, développeur), back-office dans le layout principal. Elle affiche les capacités et motifs de blocage renvoyés par l’API.
- Le frontend envoie `Accept-Language` (fr/en) ; l’API répond en conséquence pour les messages déjà traduits.

Détails : [PWASTORE_ARCHITECTURE.md](PWASTORE_ARCHITECTURE.md).

## 4. Organisation des dossiers

| Dossier                                  | Contenu                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B/`app/Models`                           | Modèles Eloquent (§5)                                                                                                                                                                                                                                                                                                                                                                                    |
| B/`app/Services`                         | Logique métier : `PublicationWorkflow`, `ApplicationLifecycle`, `PwaPackageAnalyzer`, `ExternalResourceDetector`, `BuildDeployer`, `PwaRuntime`, `UrlMonitor`, `ExternalPwaChecker`, `SdkInstallCheck`, `ContentRating`, `CountryAvailability`, `CoverImage`, `ImageReencoder`, `ApplicationMedia`, `MediaGarbageCollector`, `DataRetention`, `DeveloperStats`, `Notifier`, `PublicationQuota`, `PwaLab` |
| B/`app/Http/Controllers/Api`             | Contrôleurs de l’API                                                                                                                                                                                                                                                                                                                                                                                     |
| B/`app/Http/Middleware`                  | `ServePwaRuntime`, `SecurityHeaders`, `SetRequestLocale`                                                                                                                                                                                                                                                                                                                                                 |
| B/`routes/api.php`, `routes/console.php` | Routes de l’API, tâches planifiées                                                                                                                                                                                                                                                                                                                                                                       |
| B/`tests/Feature`, `tests/Unit`          | Tests PHPUnit                                                                                                                                                                                                                                                                                                                                                                                            |
| F/`src/pages`                            | `store/`, `account/`, `auth/`, `developer/`, `admin/`, `static/`                                                                                                                                                                                                                                                                                                                                         |
| F/`src/components`                       | Composants partagés (`HostingBadge`, `BuildUploader`, `ExternalResourcesReport`, `AppCard`…)                                                                                                                                                                                                                                                                                                             |
| F/`src/i18n`                             | Traductions `fr.js` / `en.js` (clés) et `ui.en.json` (textes source français → anglais, y compris les pages statiques)                                                                                                                                                                                                                                                                                   |
| F/`src/content/pages.js`                 | Contenu des pages statiques (français, brouillons juridiques)                                                                                                                                                                                                                                                                                                                                            |
| F/`src/services`, `src/stores`           | Appels API par domaine, stores Pinia                                                                                                                                                                                                                                                                                                                                                                     |
| F/`test/unit`, `test/e2e`                | Vitest, Playwright                                                                                                                                                                                                                                                                                                                                                                                       |
| F/`docs`                                 | Cette documentation                                                                                                                                                                                                                                                                                                                                                                                      |

## 5. Modèles et relations

Principaux modèles : `User`, `Country`, `AuthChallenge`, `DeveloperProfile` (+ `DeveloperProfileEvent`, `DeveloperDocument`), `Application`, `Category`, `Collection`, `AppVersion`, `PublicationRequest`, `PublicationEvent`, `UrlCheck`, `ApplicationExternalResource`, `ExternalResourceObservation`, `Review`, `ReviewReply`, `Report`, `Installation`, `InstallIntent`, `AnalyticsEvent`, `LabAnalysis`, `AuditLog`, `Setting`. Tables sans modèle : `application_views` (vues uniques), `application_daily_views`, `app_install_signals` (signaux du script de mesure), `application_country` (pays de distribution), `recent_views`.

- Un `User` a au plus un `DeveloperProfile` ; il édite des `Application`.
- Une `Application` a des `AppVersion` (builds), des `PublicationRequest` (dossiers de publication), des `PublicationEvent` (historique), des `UrlCheck`, des avis et des signalements.
- Une `AppVersion` a ses `ApplicationExternalResource`, elles-mêmes annotées par des `ExternalResourceObservation`.
- Une `PublicationRequest` contient l’instantané figé de ce qui a été soumis.

Schéma : [PWASTORE_ARCHITECTURE.md §3](PWASTORE_ARCHITECTURE.md#3-modèle-de-données-cible).

## 6. Authentification et permissions

- Inscription avec pays, confirmation de l’e-mail par **code à 6 chiffres** (OTP), double authentification par e-mail facultative, mot de passe oublié par code, sessions listables et révocables, verrou après échecs répétés, désactivation du compte puis anonymisation à 30 jours.
- Rôles : `user` et `admin`. L’accès développeur dépend du profil développeur, pas d’un rôle.
- Administrateurs : permissions granulaires (`developers.review`, `apps.moderate`, `reviews.moderate`, `reports.handle`, `catalog.manage`, `users.manage`, `settings.manage`, `audit.view`). Un administrateur ne revoit jamais son propre profil, sa propre application ou sa propre version.
- Le portail développeur et le back-office ne s’affichent qu’à partir de 768 px de large.

Détails : [Architecture §5–6](PWASTORE_ARCHITECTURE.md#5-rôles-et-permissions), [Contrat d’API §1](PWASTORE_API_CONTRACT.md#1-identité-et-compte).

## 7. Parcours utilisateur

Accueil (à la une, populaires, nouveautés, mises à jour, sélections, catégories) → recherche et catégories → fiche d’application (badge d’hébergement, langues, captures, avis, apps similaires, éditeur public) → **Ouvrir** / **Ouvrir pour installer** → favoris, bibliothèque, avis, signalement. Espace personnel : bibliothèque, favoris, mes avis et signalements, préférences et données (export), sécurité du compte, notifications.

**Pays.** Le catalogue dépend du pays : connecté, celui du profil (modifiable une fois tous les 30 jours, chaque changement journalisé avec l’IP) ; visiteur, le pays qu’il choisit dans le Store (en-tête `X-Country`, mémorisé dans le navigateur, jamais déduit de l’IP). Sans pays, seules les applications disponibles partout sont listées ; une fiche hors pays répond 403. Chaque application est disponible dans **tous les pays** ou dans **des pays sélectionnés** (`availability`, onglet Informations).

**Vues.** Une consultation de fiche est comptée **une seule fois par compte et par application** ; pour un visiteur, une empreinte à clé de l’IP propre à chaque application. L’éditeur et les modérateurs ne sont pas comptés.

Guide public : [PWASTORE_USER_GUIDE_FR.md](PWASTORE_USER_GUIDE_FR.md).

## 8. Activation développeur

Depuis son compte (e-mail confirmé), l’utilisateur active gratuitement un profil **individuel** ou **organisation** (`POST /developer/activate`). La page `/developers` présente le portail.

Menu du portail développeur : Vue d’ensemble (`/developer`), **Mes applications** (`/developer/apps`), **Suivi des validations** (`/developer/requests`), Statistiques (`/developer/stats`), **Mesure des installations** (`/developer/measure`), Avis et retours (`/developer/reviews`), PWA Lab (`/developer/lab`), **Guide du développeur** (`/developer/guide`, contenu `developer-guide` de `src/content/pages.js`), Règles de publication, Paramètres du compte. Chaque entrée mène à une fonction réelle.

## 9. Vérification des développeurs

Statuts du profil : `draft`, `pending_verification`, `verified`, `rejected`, `suspended`. Le développeur complète son profil, dépose une **pièce d’identité** (stockage privé, purge automatique), puis soumet. Un administrateur (`developers.review`) vérifie ou refuse avec motif ; il peut demander des justificatifs. Tant que le profil n’est pas vérifié, ou si la pièce a expiré, la soumission d’applications est bloquée avec le motif affiché (`publication_blockers`). Une application n’est visible que si son éditeur est vérifié.

## 10. Création des applications

`/developer/apps/create` (`NewAppPage`) ne demande que l’essentiel : **nom**, **lien HTTPS de la PWA** et, facultativement, la catégorie. Le choix du ZIP n’apparaît que si `GET /platform` renvoie `build_uploads: true`. Un brouillon est créé ; rien n’est publié. Le reste se complète dans l’espace de l’application `/developer/apps/:id` (`AppWorkspacePage`), onglets **Informations**, **Images**, **Confidentialité**, **Contenu**, **Version**, **Récapitulatif**, **Suivi**, avec une aide « Comment ça marche ? ».

Informations requises avant soumission (contrôlées par Laravel, `Application::listingGapFields`) : **image de couverture** (16:9, ≥ 1280 × 720, ≤ 3 Mo, recodée en variantes AVIF/WebP/JPEG), catégorie, description courte, description ≥ 30 caractères, **icône déposée** (carrée, ≥ 192 px, ≤ 1 Mo, PNG/JPG/WebP), 1 à 8 captures, au moins une langue, lien officiel de la PWA, e-mail de contact, URL de politique de confidentialité, données collectées déclarées, **accès pour la vérification**, **présence d’annonces** et **classification du contenu**. Icônes et captures sont recodées sans métadonnées (GPS, appareil).

**Onglet Contenu** (`AppContentPanel`) :

- **Accès pour la vérification** (`GET/PUT /apps/{id}/review-access`) : accès libre, ou instructions et identifiants de test. Stockés **chiffrés** (`encrypted:array`), jamais renvoyés avec l’application ; un modérateur les affiche à la demande depuis le dossier, chaque lecture est journalisée (`publication_request.credentials_viewed`).
- **Annonces** (`contains_ads`) : affichées « Contient des annonces » sur la fiche.
- **Classification du contenu** (`content_rating`) : six questions (violence, sexuel, langage, drogues, jeux d’argent, peur) et éléments interactifs ; l’âge (3+ à 18+) est **calculé par le serveur** (`ContentRating`, réponse la plus restrictive). Ce n’est **pas** une classification officielle IARC/PEGI/ESRB.

## 11. Publication par URL

Mode par défaut. La PWA reste hébergée par son éditeur. L’adresse HTTPS (port 443, IP publique) est contrôlée par un client anti-SSRF (DNS épinglé, réseaux privés refusés, redirections revalidées, 2 Mo max) : accès, manifeste, **empreinte limitée à l’identité du manifeste** (nom, icônes, adresse de départ, portée). Le contrôle est **relancé automatiquement à la soumission** (réutilisé s’il a réussi il y a moins d’une heure). Une fois publiée, l’application est recontrôlée toutes les 6 heures : un changement de manifeste est **signalé aux modérateurs** (plus de suspension automatique) ; seule l’indisponibilité répétée suspend ; un contrôle manuel ne suspend jamais. Limite : un script modifié après l’approbation n’est pas détecté. Historique dans `url_checks`. Badge public : **« Hébergée par l’éditeur »**.

### Mesure des installations

Onglet **Version** et page `/developer/measure` : le développeur colle la ligne `<script src="{PWA_PUBLIC_API_URL}/sdk.js" data-app="{clé}" async></script>` dans sa PWA, puis clique **« Vérifier mon site »** (`POST /apps/{id}/install-signals/check`, `SdkInstallCheck`) : état `connected`, `missing`, `wrong_key`, `wrong_host` ou `unreachable`, et directives CSP qui bloqueraient le script. Le script envoie seulement `installed` et `launch` (`POST /sdk/events`), avec un identifiant pseudonyme d’appareil stocké en empreinte à clé propre à l’application, accepté uniquement depuis l’adresse déclarée de l’application publiée, avec un plafond journalier. Signal forgeable hors navigateur : c’est un **indicateur**, montré au seul développeur, à côté des **installations déclarées** (comptes du Store, une fois par compte). L’éditeur doit informer ses utilisateurs.

## 12. Publication par ZIP

**Désactivée par défaut** (`PWA_BUILD_UPLOADS=false`) : une nouvelle application ne peut pas choisir ce mode (`PUT /apps/{id}/source` → 422) ; les applications déjà fournies par ZIP continuent de fonctionner. Une fois activée, le développeur dépose le dossier de production compressé (50 Mo par défaut, `PWA_BUILD_MAX_KB`) via le composant unique `BuildUploader`. Le ZIP est signé (SHA-256 + HMAC), analysé immédiatement (§14), puis, après approbation, déployé sur une **origine isolée** `pwa-{id}.<PWA_RUNTIME_DOMAIN>`. Badge public : **« Hébergée par PWA Store »**.

Hébergement, CSP et configuration : [PWASTORE_BUILD_HOSTING.md](PWASTORE_BUILD_HOSTING.md).

## 13. Détection des domaines externes

Les ressources externes (scripts, styles, polices, API, WebSockets, iframes, médias…) sont **détectées automatiquement** dans le build ; **aucune déclaration manuelle** n’est demandée. Chaque ressource est classée (type, catégorie, niveau de risque), comparée à la dernière version approuvée, et peut recevoir des observations de l’administrateur (internes ou visibles par le développeur). Une correction demandée non traitée bloque l’approbation.

Détails : [07_PWA_STORE_EXTERNAL_RESOURCES.md](project-audit/07_PWA_STORE_EXTERNAL_RESOURCES.md).

## 14. Analyse technique et sécurité

Analyse statique synchrone, sans exécution ni accès réseau (`PwaPackageAnalyzer`) :

- **Structure** : `index.html` à la racine, chemins dangereux, liens symboliques, taux de compression excessif, 10 000 fichiers et 200 Mo décompressés au plus.
- **Exécutables interdits** (`.php`, `.exe`, `.sh`, `.apk`…) → refus.
- **Manifeste** (`name`, `short_name`, `start_url`, `display`, `icons`) et **service worker** ; s’ils manquent, le développeur peut accepter qu’ils soient générés.
- **Fonctions sensibles** (`eval()`, `new Function()`, `document.write()`) → **quarantaine** : non bloquant, mais l’administrateur doit cocher une reconnaissance explicite avant d’approuver.
- Résultats : `passed`, `quarantined` ou refus immédiat (422) avec la raison.

Builds servis avec une **CSP de compatibilité** : tout HTTPS/WSS autorisé, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`, `'unsafe-eval'` seulement si reconnu lors de la levée de quarantaine. Pas d’antivirus à ce jour.

## 15. Gestion des versions

Chaque envoi crée une version analysée. Statuts affichés : Brouillon, Analyse en cours, Prête à soumettre, Soumise, En examen, Approuvée, Refusée, En ligne. Une version non approuvée n’est jamais servie et aucune version n’est approuvée hors dossier. Pour une application en ligne, une nouvelle version passe par une **demande de mise à jour** ; **l’ancienne version reste en ligne** jusqu’à l’approbation. Le développeur peut remettre en ligne une version antérieure approuvée par une demande.

## 16. Validation administrative

Le développeur soumet un **dossier** (`publication_requests`) : instantané figé de la fiche, de la source, de la version (hash), de l’analyse et du statut du développeur. Une seule demande ouverte par application ; fiche et version soumises verrouillées pendant l’examen ; le développeur peut **retirer** sa demande. Types : `initial` (première publication) et `update` (fiche et/ou nouvelle version d’une app en ligne).

L’administrateur traite la file `/admin/requests` (de la plus ancienne à la plus récente, alertes quarantaine et ressources à risque) et décide dans un seul écran `/admin/requests/:id` :

- **Approuver et publier** (motif facultatif) : approuve l’application et sa version ensemble et **publie automatiquement** ; refusé si la fiche ou le ZIP ont changé depuis la soumission. Pour une app suspendue, la case « lever la suspension » est obligatoire et journalisée. La notification d’une mise à jour est envoyée après la mise en ligne, selon son résultat.
- **Demander une correction** (motif obligatoire).
- **Refuser** (motif obligatoire).

Le dossier montre aussi le profil vérifié de l’éditeur, la fiche figée, la classification, les annonces et, sur demande journalisée, les identifiants de test. Notes internes et historique dans le dossier. L’administrateur **n’agit plus à la place du développeur** (ni édition de fiche, ni dépôt, ni soumission, ni publication pour lui).

Conception et décisions : [PWASTORE_PUBLICATION_WORKFLOW.md](PWASTORE_PUBLICATION_WORKFLOW.md).

## 17. Publication et suspension

Statuts d’une application : `draft` → `submitted` → `in_review` → `approved` → `published`, avec `changes_requested`, `rejected`, `suspended`, `archived` (service unique `ApplicationLifecycle`, transitions interdites → 409, chaque transition historisée). L’approbation publie aussitôt ; si la mise en ligne échoue (hébergement indisponible), l’application reste approuvée et le développeur choisit « Publier maintenant ». Une application en ligne **reste en ligne** pendant l’examen de ses modifications, conservées dans `pending_changes`. Le modérateur peut suspendre ou archiver (l’archivage retire la demande ouverte) ; le contrôle automatique des URL ne suspend qu’après des indisponibilités répétées. « En examen » est impossible sans demande ouverte. Une application **suspendue** sort de deux façons : le modérateur la **« Rétablit »** directement (avec motif), ou le développeur **demande un réexamen** (soumission possible même sans modification) que le modérateur approuve en levant explicitement la suspension. Une application archivée peut être réactivée en brouillon (`POST /apps/{id}/restore`).

## 18. Avis et signalements

Avis : compte avec e-mail confirmé, un avis par application, 2000 caractères, modifiable et supprimable ; réponse unique de l’éditeur ; avis masqués par la modération exclus de la note. Signalements d’une application ou d’un avis (motifs : logiciel malveillant, fraude, contenu illégal, vie privée, contenu offensant, spam, application cassée, usurpation, autre), traités par l’administration (`reports.handle`) ; l’auteur suit leur issue.

## 19. Notifications

Notifications dans l’application (immédiates) et par e-mail (file `database`, worker requis) : bienvenue, activation et vérification développeur, soumission (aux modérateurs), décisions sur les demandes, mise en ligne différée, avis reçus (résumé quotidien), signalements, suspension, indisponibilité, sécurité, quota. Préférences par type et canal, sauf sécurité. Cloche avec compteur non lu. La langue du compte (`users.locale`, `PUT /account/locale`) est enregistrée ; l’envoi des e-mails dans cette langue fait partie du lot de correction H11 (en cours).

## 20. Administration

Back-office : tableau de bord (compteurs réels), **file des demandes** `/admin/requests` et **dossier** `/admin/requests/:id`, applications (catalogue, mise en avant, suspension, archivage), revue des développeurs, utilisateurs (recherche, suspension motivée, permissions), catégories, sélections éditoriales, signalements, avis, paramètres (quotas, devise, contribution ; paiements désactivés), journal d’audit, vue par pays.

## 21. Configuration et déploiement

Variables principales du backend :

| Variable                               | Local                     | Production                                    |
| -------------------------------------- | ------------------------- | --------------------------------------------- |
| `APP_URL`                              | `https://oneapp.test`     | `https://pwastore.online`                     |
| `PWA_PUBLIC_API_URL` (ligne de mesure) | `https://oneapp.test/api` | `https://pwastore.online/api`                 |
| `PWA_RUNTIME_DOMAIN` (builds ZIP)      | `oneapp-pwa.test`         | domaine distinct, ex. `pwastore-apps.online`  |
| `PWA_BUILD_UPLOADS`                    | `false`                   | `false` tant que l’hébergement n’est pas prêt |

Autres : `PWA_FRONTEND_URL`, `PWA_CORS_ORIGINS`, `PWA_SUPPORT_EMAIL`, `PWA_BUILD_MAX_KB`, `PWA_SESSION_DAYS`, `PWA_ANONYMIZE_AFTER_DAYS`, `PWA_DOCUMENT_RETENTION_DAYS`, `PWA_RETENTION_MEASUREMENT_MONTHS` (13), `PWA_RETENTION_AUDIT_IP_MONTHS` (12), `PWA_RETENTION_TECHNICAL_MONTHS` (12), `PWA_RETENTION_NOTIFICATIONS_MONTHS` (6), `QUEUE_CONNECTION=database`. Frontend : `VITE_API_URL` au build (`npm run build:pwa`). Cron `schedule:run` chaque minute et worker `queue:work` obligatoires. En local : `valet link oneapp-pwa`, `valet secure oneapp-pwa`, `PWA_RUNTIME_DOMAIN=oneapp-pwa.test`.

**Tâches planifiées** : `pwa:check-external` (6 h), `pwa:purge-documents`, `pwa:purge-auth-challenges`, `pwa:anonymize-accounts` (quotidiennes), `pwa:purge-data` (03:00 : vues, signaux, événements après 13 mois ; IP du journal effacées après 12 mois ; contrôles d’URL et analyses Lab après 12 mois ; notifications lues après 6 mois), `pwa:purge-media` (03:30 : images et dossiers d’hébergement que plus rien ne référence, après 7 jours), `pwa:review-digest` (08:00). Ces durées sont celles de la politique de confidentialité.

Détails : [PWASTORE_DEPLOYMENT.md](PWASTORE_DEPLOYMENT.md), [PWASTORE_BUILD_HOSTING.md](PWASTORE_BUILD_HOSTING.md). Aucun secret ne figure dans la documentation.

## 22. Gestion des erreurs

Conventions de l’API : `422` validation (`{ message, errors }`), `403` droit refusé avec message lisible, `409` conflit d’état (transition interdite, demande déjà ouverte, dossier modifié depuis la soumission), `429` trop de requêtes, `202` code OTP requis. Les manques de soumission et les blocages éditeur sont renvoyés dans la langue demandée ; les autres messages restent en français. L’interface affiche le message du serveur et pointe vers l’onglet à compléter.

## 23. Tests

| Suite                       | Commande              | Résultat (12 octobre 2026, 17 h 57 GMT) |
| --------------------------- | --------------------- | --------------------------------------- |
| Laravel (SQLite en mémoire) | `php artisan test`    | 169 tests (1 288 assertions)            |
| Laravel (MySQL)             | `composer test:mysql` | même suite                              |
| Frontend unitaire (Vitest)  | `npm run test:unit`   | 56 tests                                |
| Bout en bout (Playwright)   | `npm run test:e2e`    | 13 scénarios, sans accès Internet       |

Détails et mode d’emploi : [PWASTORE_TEST_PLAN.md](PWASTORE_TEST_PLAN.md).

## 24. Fonctionnalités existantes

- Comptes, OTP e-mail, 2FA, sessions, désactivation et anonymisation, export des données.
- Activation et vérification des développeurs avec pièce d’identité.
- Catalogue, accueil, catégories, sélections, recherche, fiches, éditeur public, pages statiques.
- Publication par lien (par défaut) et par ZIP (désactivée par défaut), analyse automatique, quarantaine, détection automatique des ressources externes.
- Couverture obligatoire, onglet Contenu (accès pour la vérification chiffré, annonces, classification calculée), distribution par pays (tous / sélectionnés, choix du pays par le visiteur, pays du profil modifiable tous les 30 jours), vues uniques, mesure des installations avec « Vérifier mon site ».
- Espace de l’application, demandes de publication, file et dossier administrateur, modifications en attente sur une app en ligne, badge d’hébergement.
- Hébergement isolé des builds avec CSP de compatibilité et mise en ligne à l’approbation.
- Avis, réponses, signalements, modération.
- Notifications in-app et e-mail, statistiques développeur, PWA Lab, pages développeur (applications, suivi des validations, mesure, guide).
- Revue de sécurité : lots 1 et 2 corrigés (compteurs, fuites, permissions, impasses de publication, médias, conservation) — suivi dans [PWASTORE_SECURITY_REVIEW.md](PWASTORE_SECURITY_REVIEW.md).
- Sélecteur de langue FR/EN dans tous les layouts.
- Signature de mouvement ([PWASTORE_MOTION.md](PWASTORE_MOTION.md)).

## 25. Fonctionnalités en développement

- **Traduction des messages serveur et des e-mails** (H11) : l’interface et les pages statiques sont traduites (`ui.en.json`), une partie des messages de l’API et les e-mails restent en français.
- **Conformité** (H8) : politique de confidentialité à compléter (exploitant, hébergeur, prestataire d’e-mails, bases légales, formalité ARTCI) et à faire relire par un juriste.
- Hébergement des builds en production : domaine d’exécution à fournir ([PWASTORE_BUILD_HOSTING.md](PWASTORE_BUILD_HOSTING.md)).

## 26. Fonctionnalités prévues

- Corrections restantes de la revue de sécurité (lots 3 et 4) : voir [PWASTORE_SECURITY_REVIEW.md](PWASTORE_SECURITY_REVIEW.md#6-plan-de-correction-proposé).
- Activation de l’hébergement des builds ZIP en production ([PWASTORE_BUILD_HOSTING.md](PWASTORE_BUILD_HOSTING.md)).
- Reportés : antivirus des archives (ClamAV), Lighthouse dans PWA Lab, intégration push réelle, facturation, revue juridique des textes.

## 27. Historique des évolutions

Voir [PWASTORE_CHANGELOG.md](PWASTORE_CHANGELOG.md) et le journal de [PWASTORE_ROADMAP.md](PWASTORE_ROADMAP.md#journal).
