# PWA Store — Documentation de référence

État au 12 octobre 2026. Ce document est le point d’entrée : il résume chaque domaine et renvoie vers le document détaillé. Le français est la langue de référence.

| Projet                        | Emplacement                                        | Abrégé |
| ----------------------------- | -------------------------------------------------- | ------ |
| API Laravel 13                | `/Users/apple/LaravelProjects/oneapp`              | **B/** |
| Frontend Quasar / Vue 3 (PWA) | `/Users/apple/Documents/Quasar Projects/oneappapp` | **F/** |

Documents détaillés : [Architecture](PWASTORE_ARCHITECTURE.md) · [Contrat d’API](PWASTORE_API_CONTRACT.md) · [Processus de publication](PWASTORE_PUBLICATION_WORKFLOW.md) · [Audit de la publication](PWASTORE_PUBLICATION_AUDIT.md) · [Hébergement des builds](PWASTORE_BUILD_HOSTING.md) · [Déploiement](PWASTORE_DEPLOYMENT.md) · [Plan de tests](PWASTORE_TEST_PLAN.md) · [Roadmap](PWASTORE_ROADMAP.md) · [Mouvement](PWASTORE_MOTION.md) · [Ressources externes](project-audit/07_PWA_STORE_EXTERNAL_RESOURCES.md) · [Changelog](PWASTORE_CHANGELOG.md).
Guides : [utilisateur FR](PWASTORE_USER_GUIDE_FR.md) / [EN](PWASTORE_USER_GUIDE_EN.md) · [développeur FR](PWASTORE_DEVELOPER_GUIDE_FR.md) / [EN](PWASTORE_DEVELOPER_GUIDE_EN.md).
Documents historiques : [`docs/archive/`](archive/) (audit initial du 10 octobre 2026).

---

## 1. Présentation

PWA Store est un magasin de **Progressive Web Apps**. Le public y découvre, ouvre, met en favori et note des applications Web installables. Les développeurs vérifiés y publient leurs PWA, soit en **déposant leur build (ZIP)**, soit en **référençant leur adresse (URL)**. Chaque application et chaque modification sont examinées par un administrateur avant d’être visibles.

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

| Dossier                                  | Contenu                                                                                                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B/`app/Models`                           | Modèles Eloquent (§5)                                                                                                                                                                                                         |
| B/`app/Services`                         | Logique métier : `PublicationWorkflow`, `ApplicationLifecycle`, `PwaPackageAnalyzer`, `ExternalResourceDetector`, `BuildDeployer`, `PwaRuntime`, `UrlMonitor`, `ExternalPwaChecker`, `Notifier`, `PublicationQuota`, `PwaLab` |
| B/`app/Http/Controllers/Api`             | Contrôleurs de l’API                                                                                                                                                                                                          |
| B/`app/Http/Middleware`                  | `ServePwaRuntime`, `SecurityHeaders`, `SetRequestLocale`                                                                                                                                                                      |
| B/`routes/api.php`, `routes/console.php` | Routes de l’API, tâches planifiées                                                                                                                                                                                            |
| B/`tests/Feature`, `tests/Unit`          | Tests PHPUnit                                                                                                                                                                                                                 |
| F/`src/pages`                            | `store/`, `account/`, `auth/`, `developer/`, `admin/`, `static/`                                                                                                                                                              |
| F/`src/components`                       | Composants partagés (`HostingBadge`, `BuildUploader`, `ExternalResourcesReport`, `AppCard`…)                                                                                                                                  |
| F/`src/i18n`                             | Traductions `fr.js` / `en.js`                                                                                                                                                                                                 |
| F/`src/content/pages.js`                 | Contenu des pages statiques (français, brouillons juridiques)                                                                                                                                                                 |
| F/`src/services`, `src/stores`           | Appels API par domaine, stores Pinia                                                                                                                                                                                          |
| F/`test/unit`, `test/e2e`                | Vitest, Playwright                                                                                                                                                                                                            |
| F/`docs`                                 | Cette documentation                                                                                                                                                                                                           |

## 5. Modèles et relations

Principaux modèles : `User`, `Country`, `AuthChallenge`, `DeveloperProfile` (+ `DeveloperProfileEvent`, `DeveloperDocument`), `Application`, `Category`, `Collection`, `AppVersion`, `PublicationRequest`, `PublicationEvent`, `UrlCheck`, `ApplicationExternalResource`, `ExternalResourceObservation`, `Review`, `ReviewReply`, `Report`, `Installation`, `InstallIntent`, `AnalyticsEvent`, `LabAnalysis`, `AuditLog`, `Setting`.

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

Guide public : [PWASTORE_USER_GUIDE_FR.md](PWASTORE_USER_GUIDE_FR.md).

## 8. Activation développeur

Depuis son compte (e-mail confirmé), l’utilisateur active gratuitement un profil **individuel** ou **organisation** (`POST /developer/activate`). La page `/developers` présente le portail et les deux modes de publication.

## 9. Vérification des développeurs

Statuts du profil : `draft`, `pending_verification`, `verified`, `rejected`, `suspended`. Le développeur complète son profil, dépose une **pièce d’identité** (stockage privé, purge automatique), puis soumet. Un administrateur (`developers.review`) vérifie ou refuse avec motif ; il peut demander des justificatifs. Tant que le profil n’est pas vérifié, ou si la pièce a expiré, la soumission d’applications est bloquée avec le motif affiché (`publication_blockers`). Une application n’est visible que si son éditeur est vérifié.

## 10. Création des applications

`/developer/apps/create` (`NewAppPage`) ne demande que l’essentiel : **nom**, **catégorie**, et le mode de fourniture (**ZIP** ou **lien**). Un brouillon est créé ; rien n’est publié. Le reste se complète dans l’espace de l’application `/developer/apps/:id` (`AppWorkspacePage`), onglets **Informations**, **Images**, **Confidentialité**, **Version**, **Récapitulatif**, **Suivi**, avec une aide « Comment ça marche ? ».

Informations requises avant soumission (contrôlées par Laravel, `Application::listingGapFields`) : catégorie, description courte, description ≥ 30 caractères, **icône déposée** (carrée, ≥ 192 px, ≤ 1 Mo, PNG/JPG/WebP), au moins une capture, au moins une langue, lien officiel de la PWA, e-mail de contact, URL de politique de confidentialité, données collectées déclarées.

## 11. Publication par URL

La PWA reste hébergée par son éditeur. L’adresse HTTPS est contrôlée par un client anti-SSRF (DNS épinglé, réseaux privés refusés, redirections validées) : accès, manifeste, empreinte. Le contrôle est **relancé automatiquement à la soumission** (réutilisé s’il a réussi il y a moins d’une heure). Une fois publiée, l’application est recontrôlée toutes les 6 heures ; deux échecs consécutifs ou un changement de contenu entraînent une suspension. Historique dans `url_checks`. Badge public : **« Hébergée par l’éditeur »**.

## 12. Publication par ZIP

Le développeur dépose le dossier de production compressé (50 Mo par défaut, `PWA_BUILD_MAX_KB`) via le composant unique `BuildUploader`. Le ZIP est signé (SHA-256 + HMAC), analysé immédiatement (§14), puis, après approbation, déployé sur une **origine isolée** `pwa-{id}.<PWA_RUNTIME_DOMAIN>`. Badge public : **« Hébergée par PWA Store »**.

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

Chaque envoi crée une version analysée. Statuts affichés : Brouillon, Analyse en cours, Prête à soumettre, Soumise, En examen, Approuvée, Refusée, En ligne. Une version non approuvée n’est jamais servie. Pour une application en ligne, une nouvelle version passe par une **demande de mise à jour** ; **l’ancienne version reste en ligne** jusqu’à l’approbation. Le développeur peut remettre en ligne une version antérieure approuvée.

## 16. Validation administrative

Le développeur soumet un **dossier** (`publication_requests`) : instantané figé de la fiche, de la source, de la version (hash), de l’analyse et du statut du développeur. Une seule demande ouverte par application ; fiche et version soumises verrouillées pendant l’examen ; le développeur peut **retirer** sa demande. Types : `initial` (première publication) et `update` (fiche et/ou nouvelle version d’une app en ligne).

L’administrateur traite la file `/admin/requests` (de la plus ancienne à la plus récente, alertes quarantaine et ressources à risque) et décide dans un seul écran `/admin/requests/:id` :

- **Approuver** (motif facultatif) : approuve l’application et sa version ensemble et **publie immédiatement** ; refusé si la fiche ou le ZIP ont changé depuis la soumission.
- **Demander une correction** (motif obligatoire).
- **Refuser** (motif obligatoire).

Notes internes et historique dans le dossier. L’administrateur **n’agit plus à la place du développeur** (ni édition de fiche, ni dépôt, ni soumission, ni publication pour lui).

Conception et décisions : [PWASTORE_PUBLICATION_WORKFLOW.md](PWASTORE_PUBLICATION_WORKFLOW.md).

## 17. Publication et suspension

Statuts d’une application : `draft` → `submitted` → `in_review` → `approved` → `published`, avec `changes_requested`, `rejected`, `suspended`, `archived` (service unique `ApplicationLifecycle`, transitions interdites → 409, chaque transition historisée). L’approbation publie aussitôt ; si la mise en ligne échoue (hébergement indisponible), l’application reste approuvée et le développeur choisit « Publier maintenant ». Une application en ligne **reste en ligne** pendant l’examen de ses modifications, conservées dans `pending_changes`. L’administrateur peut suspendre ou archiver ; le contrôle automatique des URL peut suspendre.

## 18. Avis et signalements

Avis : compte avec e-mail confirmé, un avis par application, 2000 caractères, modifiable et supprimable ; réponse unique de l’éditeur ; avis masqués par la modération exclus de la note. Signalements d’une application ou d’un avis (motifs : logiciel malveillant, fraude, contenu illégal, vie privée, contenu offensant, spam, application cassée, usurpation, autre), traités par l’administration (`reports.handle`) ; l’auteur suit leur issue.

## 19. Notifications

Notifications dans l’application (immédiates) et par e-mail (file `database`, worker requis) : bienvenue, activation et vérification développeur, soumission (aux modérateurs), décisions sur les demandes, mise en ligne différée, avis reçus (résumé quotidien), signalements, suspension, indisponibilité, sécurité, quota. Préférences par type et canal, sauf sécurité. Cloche avec compteur non lu. Les e-mails sont **en français uniquement** pour l’instant.

## 20. Administration

Back-office : tableau de bord (compteurs réels), **demandes de publication**, applications (catalogue, mise en avant, suspension, archivage), revue des développeurs, utilisateurs (recherche, suspension motivée, permissions), catégories, sélections éditoriales, signalements, avis, paramètres (quotas, devise, contribution ; paiements désactivés), journal d’audit, vue par pays.

## 21. Configuration et déploiement

Variables principales du backend : `APP_URL`, `PWA_FRONTEND_URL`, `PWA_CORS_ORIGINS`, `PWA_SUPPORT_EMAIL`, `PWA_RUNTIME_DOMAIN`, `PWA_BUILD_MAX_KB`, `PWA_SESSION_DAYS`, `PWA_ANONYMIZE_AFTER_DAYS`, `PWA_DOCUMENT_RETENTION_DAYS`, `QUEUE_CONNECTION=database`. Frontend : `VITE_API_URL` au build (`npm run build:pwa`). Cron `schedule:run` chaque minute et worker `queue:work` obligatoires. En local : `valet link oneapp-pwa`, `valet secure oneapp-pwa`, `PWA_RUNTIME_DOMAIN=oneapp-pwa.test`.

Détails : [PWASTORE_DEPLOYMENT.md](PWASTORE_DEPLOYMENT.md), [PWASTORE_BUILD_HOSTING.md](PWASTORE_BUILD_HOSTING.md). Aucun secret ne figure dans la documentation.

## 22. Gestion des erreurs

Conventions de l’API : `422` validation (`{ message, errors }`), `403` droit refusé avec message lisible, `409` conflit d’état (transition interdite, demande déjà ouverte, dossier modifié depuis la soumission), `429` trop de requêtes, `202` code OTP requis. Les manques de soumission et les blocages éditeur sont renvoyés dans la langue demandée ; les autres messages restent en français. L’interface affiche le message du serveur et pointe vers l’onglet à compléter.

## 23. Tests

| Suite                       | Commande              | Résultat (12 octobre 2026) |
| --------------------------- | --------------------- | -------------------------- |
| Laravel (SQLite en mémoire) | `php artisan test`    | 134 tests                  |
| Laravel (MySQL)             | `composer test:mysql` | même suite                 |
| Frontend unitaire (Vitest)  | `npm run test:unit`   | 26 tests                   |
| Bout en bout (Playwright)   | `npm run test:e2e`    | 13 scénarios               |

Détails et mode d’emploi : [PWASTORE_TEST_PLAN.md](PWASTORE_TEST_PLAN.md).

## 24. Fonctionnalités existantes

- Comptes, OTP e-mail, 2FA, sessions, désactivation et anonymisation, export des données.
- Activation et vérification des développeurs avec pièce d’identité.
- Catalogue, accueil, catégories, sélections, recherche, fiches, éditeur public, pages statiques.
- Publication par URL et par ZIP, analyse automatique, quarantaine, détection automatique des ressources externes.
- Espace de l’application, demandes de publication, file et dossier administrateur, modifications en attente sur une app en ligne, badge d’hébergement.
- Hébergement isolé des builds avec CSP de compatibilité et mise en ligne à l’approbation.
- Avis, réponses, signalements, modération.
- Notifications in-app et e-mail, statistiques développeur, PWA Lab.
- Sélecteur de langue FR/EN dans tous les layouts.
- Signature de mouvement ([PWASTORE_MOTION.md](PWASTORE_MOTION.md)).

## 25. Fonctionnalités en développement

- **Traduction de l’interface** : seuls le parcours de publication (développeur et administrateur), la navigation et les statuts sont traduits. Le reste de l’interface (environ 700 à 900 textes) et les pages statiques sont encore en français.
- **Langue du compte** : la colonne `users.locale` existe mais n’est pas encore utilisée pour les e-mails et notifications.
- Hébergement des builds en production : domaine d’exécution à fournir ([PWASTORE_BUILD_HOSTING.md](PWASTORE_BUILD_HOSTING.md)).

## 26. Fonctionnalités prévues

- Refonte du Store inspirée de Google Play, avec **image de couverture obligatoire** — plan à valider : [PWASTORE_STORE_REDESIGN_PLAN.md](PWASTORE_STORE_REDESIGN_PLAN.md).
- **Filtrage de la distribution par pays** (le champ « Pays de disponibilité » est saisi mais pas encore appliqué au catalogue) — plan à valider : [PWASTORE_GEO_DISTRIBUTION_PLAN.md](PWASTORE_GEO_DISTRIBUTION_PLAN.md).
- Traduction du reste de l’interface et des pages statiques.
- **E-mails et notifications localisés** selon la langue du compte.
- Reportés : antivirus des archives (ClamAV), Lighthouse dans PWA Lab, intégration push réelle, facturation, revue juridique des textes.

## 27. Historique des évolutions

Voir [PWASTORE_CHANGELOG.md](PWASTORE_CHANGELOG.md) et le journal de [PWASTORE_ROADMAP.md](PWASTORE_ROADMAP.md#journal).
