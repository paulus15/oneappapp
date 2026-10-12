# Audit du processus de publication

Date : 12 octobre 2026. Audit en lecture seule des deux projets (aucune modification de code pendant l’audit).

- Backend : `/Users/apple/LaravelProjects/oneapp` (noté **B/**)
- Frontend : `/Users/apple/Documents/Quasar Projects/oneappapp` (noté **F/**)

Organisation : quatre agents d’audit en parallèle (backend publication et sécurité, portail développeur, back-office de modération, documentation et traductions), consolidés par l’architecte. Les rôles QA et DevOps ont été couverts dans ces quatre audits (tests existants, protections, déploiement des builds).

Objectif visé : **le développeur prépare → PWA Store analyse → le développeur soumet → l’administrateur décide → PWA Store publie.**

---

## 1. Ce qui fonctionne et doit être conservé

| Domaine                         | État                                                                                                                                                   | Où                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Vérification des développeurs   | Profil complet + pièce d’identité + validation admin requis pour soumettre                                                                             | B/app/Models/User.php (`publicationBlockers`, `canSubmitApps`), `DeveloperReviewPage`     |
| Cycle de vie de l’application   | Machine à états centralisée, transitions verrouillées (`lockForUpdate`), événements et journal d’audit                                                 | B/app/Services/ApplicationLifecycle.php                                                   |
| Analyse automatique des ZIP     | Structure, chemins dangereux, exécutables, manifeste, service worker, fonctions sensibles → `passed` / `quarantined` ; refus immédiat (422) si erreur  | B/app/Services/PwaPackageAnalyzer.php                                                     |
| Ressources externes             | Détection automatique, classification, risques, comparaison avec la version approuvée précédente, observations admin ; **aucune déclaration manuelle** | B/app/Services/ExternalResourceDetector.php, F/src/components/ExternalResourcesReport.vue |
| Référencement par URL           | Contrôle HTTPS, manifeste, historique, surveillance planifiée avec suspension automatique                                                              | B/app/Services/UrlMonitor.php, ExternalPwaChecker.php                                     |
| Intégrité des builds            | SHA-256 + signature HMAC à l’import, hash revérifié et nouvelle analyse au déploiement                                                                 | B/AppVersionController.php:66-79, B/app/Services/BuildDeployer.php                        |
| Revue indépendante              | Un éditeur ne peut pas approuver sa propre app ni sa version ; quarantaine levée seulement après reconnaissance explicite                              | B/PublicationController.php (`review`, `reviewVersion`)                                   |
| Hébergement isolé               | Une origine par app (`pwa-{id}.<domaine>`), sans accès à l’API du Store ; la publication met en ligne la dernière version approuvée                    | B/app/Http/Middleware/ServePwaRuntime.php, BuildDeployer.php                              |
| Maintien de la version en ligne | L’ancienne version reste servie jusqu’au basculement vers la nouvelle                                                                                  | BuildDeployer.php (bascule transactionnelle)                                              |
| Notifications                   | Soumission → modérateurs ; décisions → développeur (dans l’app + e-mail)                                                                               | B/app/Services/Notifier.php, Notifications/UserNotice.php                                 |
| Langue                          | vue-i18n en place (fr/en), sélecteur dans les trois layouts, `Accept-Language` vers l’API                                                              | F/src/i18n, B/app/Http/Middleware/SetRequestLocale.php                                    |
| Tests                           | 127 tests Laravel, 26 tests unitaires front, 13 scénarios de bout en bout                                                                              | B/tests/Feature, F/test                                                                   |

---

## 2. Écarts avec le processus cible

### 2.1 Critiques (comportement incorrect ou risqué)

| #   | Constat                                                                                                                                                                                                                         | Preuve                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Modifier le texte d’une app publiée la retire du Store** : elle repasse en « soumise », disparaît du catalogue et de son adresse jusqu’à une nouvelle approbation puis republication.                                         | B/ApplicationController.php:303-305, Application.php:95 (`publiclyVisible`), ServePwaRuntime.php:20                                                 |
| C2  | **Aucun instantané à la soumission** : la fiche reste modifiable pendant `submitted` / `in_review` ; l’admin peut approuver autre chose que ce qui a été soumis.                                                                | B/ApplicationController.php:225-309 (aucune garde de statut) ; seul `source` est verrouillé                                                         |
| C3  | **L’administrateur peut agir à la place du développeur** : modifier la fiche, déposer et déployer des builds, soumettre, publier, archiver. Ses modifications de fiche ne déclenchent pas de revue et ne sont pas journalisées. | B/PublicationController.php:202 (`owner()` accepte `apps.moderate`), ApplicationController.php:231,291,300-302, AppVersionController.php:36,112,133 |
| C4  | **Message faux à la création** : « En attente de validation » alors que l’app est un brouillon non soumis.                                                                                                                      | F/src/pages/developer/CreateAppPage.vue:661                                                                                                         |

### 2.2 Parcours développeur

| #   | Constat                                                                                                                                                                       | Preuve                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| D1  | Pas de brouillon à la création : tout est perdu si on quitte l’assistant en cours.                                                                                            | F/CreateAppPage.vue (création en une seule requête à la fin)    |
| D2  | Choix URL / ZIP absent de la création (ZIP supposé), caché sur un troisième écran (Publication).                                                                              | F/CreateAppPage.vue:19,352 ; PublicationPage.vue (carte Source) |
| D3  | **Trois endroits pour déposer un build**, au code copié-collé et aux comportements différents (seule la console gère `auto_generate_pwa`).                                    | CreateAppPage:378, EditAppPage:680, DeveloperConsolePage:194    |
| D4  | Champs manquants : e-mail de contact, informations de confidentialité (seule l’URL de politique existe), langues sans contrôle ; icône uniquement par URL.                    | B/migrations `2026_07_18_090000`, F/CreateAppPage.vue:148       |
| D5  | Exigences de soumission incomplètes : ni captures, ni politique de confidentialité, ni contact ne sont exigés côté serveur.                                                   | B/Application.php `listingGaps`                                 |
| D6  | Pas de récapitulatif avant soumission (l’aperçu montre la fiche, pas la source, la version, l’analyse ni les domaines).                                                       | F/PublicationPage.vue (dialogue d’aperçu)                       |
| D7  | « Correction demandée » : motif affiché dans un bandeau sans contexte ; observations destinées au développeur enfouies dans le rapport des ressources.                        | F/PublicationPage.vue:29, ExternalResourcesReport.vue:98-120    |
| D8  | Nouvelle version d’une app publiée : aucune action « soumettre cette version », rien n’indique qu’elle attend une revue ; le bouton « Enregistrer & Publier » ne publie rien. | F/EditAppPage.vue:747, appStatus.js `EDITABLE_STATUSES`         |
| D9  | La fiche reste modifiable pendant la revue et après publication (aucun verrouillage dans l’écran d’édition).                                                                  | F/EditAppPage.vue                                               |
| D10 | Le bouton « Modifier » de la console mène à la page Publication, pas au formulaire.                                                                                           | F/DeveloperConsolePage.vue:64,141                               |
| D11 | Deux modèles de progression concurrents (assistant de création et checklist de publication) ; aucune vue d’ensemble du parcours.                                              | CreateApp/EditApp (stepper) vs PublicationPage (checklist)      |
| D12 | L’étape « aperçu vu » est mémorisée dans le navigateur seulement.                                                                                                             | F/PublicationPage.vue (localStorage)                            |

### 2.3 Parcours administrateur

| #   | Constat                                                                                                                                                                                                | Preuve                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| A1  | **Pas d’écran « dossier »** : la décision se répartit entre la console admin et la page Publication du développeur (route réservée aux développeurs, bloquée sur mobile).                              | F/AdminConsolePage.vue:130-131 ; routes.js:217-219               |
| A2  | La file n’est qu’un filtre `submitted` : les apps prises en charge (`in_review`) disparaissent ; les nouvelles versions d’apps publiées n’apparaissent nulle part ; tri du plus récent au plus ancien. | F/AdminConsolePage.vue:277 ; B/ApplicationController.php:345-349 |
| A3  | Une fois l’app soumise, l’admin **ne peut plus voir la description ni les captures** (l’aperçu n’existe que pour les brouillons). Les erreurs et avertissements de l’analyse ne sont jamais affichés.  | F/PublicationPage.vue:33,506,561                                 |
| A4  | **Deux décisions, deux motifs** pour une première publication par build : approuver la version, puis l’application. « Approuver » échoue tard (409) si la version n’est pas approuvée.                 | B/PublicationController.php:125 ; F/AdminConsolePage.vue:139-149 |
| A5  | Pas de « demander une correction » au niveau de la version ; les corrections sur les ressources externes forment un troisième circuit.                                                                 | B/PublicationController.php:174,179                              |
| A6  | Pour une app par URL, l’admin doit relancer lui-même un contrôle de moins de 24 h.                                                                                                                     | B/Application.php `sourceGaps`                                   |
| A7  | Statut de vérification et identité du développeur absents du dossier ; pas de notes internes au niveau de l’app.                                                                                       | —                                                                |
| A8  | Les compteurs du tableau de bord ne correspondent pas à la liste ouverte (`in_review` exclus, versions sans liste).                                                                                    | F/AdminDashboardPage.vue:93-115 ; B/AdminController.php:36-41    |
| A9  | Un motif est exigé même pour approuver (3 caractères minimum).                                                                                                                                         | B/PublicationController.php:119,174                              |

### 2.4 Statuts

| #   | Constat                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | `app_versions.moderation_status = pending` confond « déposée, non soumise » et « soumise, en attente ».                                                                            |
| S2  | `app_versions.status` mélange résultat d’analyse (`quarantined`, `validated`) et mise en ligne (`active`) ; les valeurs `archived` / `suspended` prévues ne sont jamais utilisées. |
| S3  | Une app suspendue ne peut que repasser en examen ou être archivée : le développeur ne peut pas corriger et resoumettre lui-même.                                                   |
| S4  | Aucun contrôle d’unicité du numéro de version ; dépôt possible dans n’importe quel statut de l’app.                                                                                |

### 2.5 Sécurité et robustesse

| #   | Constat                                                                                                                  | Gravité |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------- |
| P1  | C2 et C3 (dossier modifiable pendant la revue, admin opérateur) : l’élément approuvé peut différer de l’élément examiné. | Haute   |
| P2  | Le hash du ZIP est revérifié au déploiement mais pas au moment de l’approbation.                                         | Moyenne |
| P3  | Certaines routes admin testent `role === 'admin'` au lieu d’une permission.                                              | Faible  |
| P4  | Pas d’antivirus sur les archives (limite déjà documentée) ; l’analyse ne constitue pas une certification de sécurité.    | Connue  |

### 2.6 Documentation et traductions

| #   | Constat                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | Seule la page Publication est traduite. Environ **700 à 900 textes français codés en dur** dans 58 des 61 fichiers `.vue`, plus environ 70 dans les fichiers JS (titres de routes, services) ; contenu des pages statiques en français seulement.                                                                   |
| T2  | 24 formats de date ou de nombre figés en `fr-FR` ; aucun utilitaire de formatage commun.                                                                                                                                                                                                                            |
| T3  | Backend : environ 180 messages français codés en dur ; e-mails et notifications en français uniquement, construits sans gabarits ; aucune préférence de langue enregistrée sur l’utilisateur.                                                                                                                       |
| T4  | Aucun contrôle automatique de cohérence des clés fr/en.                                                                                                                                                                                                                                                             |
| T5  | Documentation obsolète : `docs/project-audit/00–06` (ancien nom « TWA Store », déclaration manuelle des domaines), B/docs/pwa-distribution.md (« OneApp », domaines déclarés), B/README.md (gabarit Laravel). Règles de publication (`src/content/pages.js:113-114`) contradictoires avec la détection automatique. |
| T6  | Aucun guide utilisateur ni guide développeur ; pas de document maître.                                                                                                                                                                                                                                              |

---

## 3. Inventaire des fichiers concernés

**Backend** — modèles `Application`, `AppVersion`, `User`, `PublicationEvent`, `ApplicationExternalResource` ; services `ApplicationLifecycle`, `PwaPackageAnalyzer`, `ExternalResourceDetector`, `ExternalResourceReport`, `BuildDeployer`, `PwaRuntime`, `UrlMonitor`, `ExternalPwaChecker`, `Notifier`, `PublicationQuota` ; contrôleurs `ApplicationController`, `AppVersionController`, `PublicationController`, `ExternalResourceController`, `AdminController` ; middleware `ServePwaRuntime`, `SetRequestLocale` ; notification `UserNotice`.

**Frontend** — pages développeur `CreateAppPage`, `EditAppPage`, `DeveloperConsolePage`, `PublicationPage` ; pages admin `AdminConsolePage`, `AdminDashboardPage`, `DeveloperReviewPage` ; composants `ExternalResourcesReport`, `DeveloperOverview` ; `utils/appStatus.js`, `services/account.js`, `services/admin.js`, `src/i18n/*`.

**Routes API principales** — `POST /apps`, `PUT /apps/{id}`, `PUT /apps/{id}/source`, `POST /apps/{id}/check-url`, `GET /apps/{id}/readiness`, `POST /apps/{id}/submit`, `POST /admin/apps/{id}/review`, `POST /admin/versions/{id}/review`, `POST /apps/{id}/publish`, `POST /versions`, `POST /versions/{id}/extract`, `GET|POST /versions/{id}/external-resources[/reanalyze]`, `POST /admin/external-resources/{id}/review`.

Suite : le parcours cible et le plan sont dans [PWASTORE_PUBLICATION_WORKFLOW.md](PWASTORE_PUBLICATION_WORKFLOW.md).
