# PWA Store — État des lieux

Audit réalisé le 11 octobre 2026 sur le code réel des deux projets, après les livraisons Country, OTP e-mail et pièce d'identité (commits backend `a61010e`, frontend `e7bd455`).

- Backend : `/Users/apple/LaravelProjects/oneapp`
- Frontend : `/Users/apple/Documents/Quasar Projects/oneappapp`
- Documents antérieurs conservés : `docs/project-audit/00` à `06`. Ce document les remplace pour l'état actuel ; ils restent la source pour l'historique des décisions.

Aucun secret n'est recopié ici. Les variables d'environnement sont citées par leur nom uniquement.

---

## 1. Socle technique

| Élément           | Backend                                                                 | Frontend                                        |
| ----------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Langage / runtime | PHP 8.5.7 (contrainte `^8.3`)                                           | Node, Vite via `@quasar/app-vite` 3             |
| Framework         | Laravel 13.20                                                           | Quasar 2.21, Vue 3.5, Vue Router 5              |
| Auth              | Sanctum 4, jetons Bearer, sans expiration (`sanctum.expiration = null`) | Jeton en `localStorage` (`auth_token`)          |
| État              | —                                                                       | Pinia 3 (un seul store : `auth`)                |
| HTTP              | —                                                                       | Axios 1.18, instance unique `src/boot/axios.js` |
| Animation         | —                                                                       | GSAP 3.15 chargé à la demande (`usePageMotion`) |
| Base              | MySQL 9.7 locale, base `oneapp` (23 migrations)                         | —                                               |
| Qualité           | PHPUnit 12, Pint                                                        | oxlint + oxfmt (`npm run lint:check`)           |
| Tests             | 59 tests, 286 assertions, **tous passants**                             | **Aucun test** (ni unitaire ni E2E)             |

## 2. Données présentes (base locale)

| Table              | Lignes | Remarque                                                                                          |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------- |
| users              | 61     | 1 admin, 12 `developer` (rôle historique), 48 `user`                                              |
| applications       | 15     | 10 approuvées, 3 en attente, 2 refusées ; toutes en `source_type = build`                         |
| app_versions       | 32     |                                                                                                   |
| developer_profiles | 1      | 1 brouillon. **Les 12 comptes `developer` n'ont pas de profil**                                   |
| reviews            | 50     | Données de démonstration probables                                                                |
| installations      | 124    |                                                                                                   |
| analytics_events   | 391    |                                                                                                   |
| push_notifications | 57     | Marquées `sent` sans envoi réel                                                                   |
| categories         | 9      | Communication, Divertissement, Éducation, Finance, Jeux, Productivité, Santé, Social, Utilitaires |
| countries          | 249    | Référentiel ISO                                                                                   |
| publication_events | 0      | Le journal existe mais aucune décision n'a encore été tracée                                      |

Conséquence : les 10 applications approuvées appartiennent à des développeurs qui ne peuvent plus publier selon la règle actuelle (profil vérifié + pièce d'identité). Elles restent visibles. Leur sort est une décision à prendre (voir §7).

## 3. Backend — inventaire

**Contrôleurs API (15)** : Account, Analytics, AppVersion, Application, Auth, Category, Country, DeveloperDashboard, DeveloperDocument, DeveloperProfile, InstallIntent, Installation, Publication, PushNotification, Review. Plus `StorefrontController` (vitrine Blade).

**Services (7)** : `EmailOtp`, `ExternalPwaChecker` (contrôle d'URL anti-SSRF), `PwaPackageAnalyzer` (analyse ZIP), `PwaRuntime` (URL d'origine isolée), `PublicationQuota`, `ApplicationMedia`.

**Modèles (14)** : User, Country, DeveloperProfile, DeveloperProfileEvent, DeveloperDocument, AuthChallenge, Application, AppVersion, Category, Installation, InstallIntent, Review, AnalyticsEvent, PushNotification.

**Absents** : `app/Http/Requests` (validation inline dans les contrôleurs), `app/Policies` (autorisations par `abort_unless` et `role`), `app/Jobs`, `app/Notifications`, `app/Events`. Une seule classe Mail : `AuthenticationCode`.

**Tâches planifiées (3)** : `pwa:check-external` (quotidien, met en quarantaine les PWA URL modifiées), `pwa:purge-documents`, `pwa:purge-auth-challenges`. Elles exigent un cron `schedule:run` en production.

**Variables d'environnement utilisées** (noms) : `APP_*`, `DB_*`, `MAIL_*`, `QUEUE_CONNECTION` (database), `CACHE_STORE`, `SESSION_*`, `FILESYSTEM_DISK`, `PWA_DOCUMENT_RETENTION_DAYS`, `PWA_FRONTEND_URL`, `PWA_FREE_APPLICATIONS`, `PWA_MAX_APPLICATIONS`, `PWA_STORAGE_BYTES`, `PWA_BUILD_MAX_KB`, `PWA_CONTRIBUTION_AMOUNT`, `PWA_CURRENCY`, `PWA_RUNTIME_DOMAIN`.
**`PWA_RUNTIME_DOMAIN` n'est pas défini** : aucun build ne peut être servi (`launch` répond 503).

**Intégrations externes** : SMTP uniquement. Aucun fournisseur push, paiement, antivirus, stockage objet ou monitoring.

**Double frontal** : une vitrine Blade (`resources/views/apps/*`, `resources/js/app.js`, routes `web.php` `/`, `/apps/{slug}`, `/library`, `/developer/publish`) coexiste avec le frontend Quasar. Elle duplique le catalogue et la connexion.

## 4. Frontend — inventaire

**Layouts** : `MainLayout` (store, compte, admin), `AuthLayout`, `DeveloperLayout`.

**Pages (21)** :

| Zone        | Pages                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Store       | `StoreCatalogPage` (accueil + catalogue, 1768 lignes), `AppListPage` (recommandées / tendances / populaires), `AppDetailsPage`             |
| Auth        | `LoginPage`, `RegisterPage`, `VerifyEmailPage`                                                                                             |
| Compte      | `AccountPage` (+ composants `PersonalLibrary`, `DeveloperOverview`, `AccountSecurity`)                                                     |
| Développeur | `DeveloperProfilePage` (activation + profil + pièce d'identité), `DeveloperConsolePage`, `CreateAppPage`, `EditAppPage`, `PublicationPage` |
| Admin       | `AdminConsolePage` (modération apps), `DeveloperReviewPage`, `CountryOverviewPage`                                                         |
| Divers      | `ErrorNotFound` ; `IndexPage` et `SecondPage` sont des restes du gabarit, non routés                                                       |

**Thème** : couleurs de la charte appliquées (`#075BFF`, `#08C8F8`, `#FF9416`, `#08132D`, `#F6F9FF`), thèmes clair et sombre, `prefers-reduced-motion` respecté (4 occurrences). La police passe par `--pwa-font-sans` (police système) : **Inter / Inter Tight ne sont pas chargées**.

**PWA** : `src-pwa/manifest.json` complet (nom, couleurs, icônes `any` + `maskable`), Workbox `GenerateSW`. Build `quasar build -m pwa` OK.

**Données statiques** : l'accueil code en dur 4 catégories (`StoreCatalogPage.vue:701`) et 4 arguments marketing (`features`, dont « Mises à jour auto » et « Sécurisé et fiable », formulations à revoir au regard de la règle « ne pas promettre la sécurité »). Le reste des listes provient de l'API.

**Lint** : oxlint sans erreur. oxfmt signale 3 fichiers à reformater (`DeveloperProfilePage.vue` et deux docs), formatage seulement.

## 5. Audit croisé par module

Légende Fonctionnel : ✅ opérationnel de bout en bout · 🟡 partiel · ❌ absent · ⚠️ défaut constaté.

| Module                                                                  | Backend                                                                                                                      | Frontend                                        | Fonctionnel | Action nécessaire                                                                                                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Inscription + OTP e-mail                                                | `register`, `otp/verify`, `otp/resend`, tests                                                                                | Register, VerifyEmail                           | ✅          | —                                                                                                                                                      |
| Connexion + 2FA e-mail                                                  | `login` (202 si OTP), `account/two-factor`                                                                                   | Login, AccountSecurity                          | ✅          | Limiter les tentatives par compte, pas seulement par IP                                                                                                |
| Mot de passe oublié / réinitialisation                                  | ❌ (table `password_reset_tokens` vide, aucune route)                                                                        | ⚠️ bouton « Mot de passe oublié ? » sans action | ❌          | Lot 1                                                                                                                                                  |
| Changement de mot de passe                                              | ❌                                                                                                                           | ❌                                              | ❌          | Lot 1                                                                                                                                                  |
| Changement d'e-mail                                                     | `PUT /account` + OTP                                                                                                         | AccountPage                                     | ✅          | —                                                                                                                                                      |
| Session                                                                 | Jetons sans expiration, révocation du jeton courant                                                                          | `localStorage`, réhydratation `/auth/me`        | 🟡          | Expiration, liste/révocation des sessions, « Rester connecté » sans effet                                                                              |
| Suppression / désactivation de compte                                   | ❌                                                                                                                           | ❌                                              | ❌          | Lot 1 (règles de conservation à décider)                                                                                                               |
| Préférences                                                             | ❌                                                                                                                           | ❌                                              | ❌          | Lot 7                                                                                                                                                  |
| Pays (Country)                                                          | Référentiel, liens user/profil/app/installation/événement                                                                    | CountrySelect, page admin                       | ✅          | —                                                                                                                                                      |
| Activation développeur                                                  | `developer/activate` idempotent                                                                                              | DeveloperProfilePage                            | ✅          | CTA accueil « Devenez développeur » à vérifier                                                                                                         |
| Profil + vérification développeur                                       | 5 statuts, historique, revue admin, pièce d'identité obligatoire                                                             | DeveloperProfilePage, DeveloperReviewPage       | ✅          | Notifications de décision absentes                                                                                                                     |
| Justificatifs                                                           | Privés, purge, journal de consultation                                                                                       | DeveloperDocuments                              | ✅          | —                                                                                                                                                      |
| Catalogue public                                                        | `GET /apps` filtres, tri, pagination 12                                                                                      | StoreCatalogPage, AppListPage                   | 🟡 ⚠️       | N+1 sur notes ; ne masque pas les éditeurs suspendus (contrairement à `launch`) ; recherche `LIKE` ; catégories d'accueil en dur                       |
| Fiche application                                                       | `GET /apps/{id}`                                                                                                             | AppDetailsPage                                  | 🟡          | Pas de partage, signalement, apps similaires, profil éditeur ; avis non paginés                                                                        |
| Catégories                                                              | CRUD admin                                                                                                                   | Lecture seule                                   | 🟡          | Écran d'administration absent ; suppression sans contrôle des apps liées                                                                               |
| Mise en avant                                                           | Champ `is_featured`, filtre public                                                                                           | Section « À la une »                            | 🟡          | Aucun moyen admin de mettre en avant                                                                                                                   |
| Brouillon d'application                                                 | `POST/PUT /apps`, médias                                                                                                     | CreateApp, EditApp                              | ✅          | —                                                                                                                                                      |
| Publication par URL                                                     | `source`, `check-url` (SSRF), soumission, contrôle quotidien                                                                 | PublicationPage                                 | ✅          | Historique des contrôles non conservé (seul le dernier rapport)                                                                                        |
| Publication par build                                                   | Upload, analyse ZIP, versions, modération, déploiement isolé, rollback                                                       | CreateApp, EditApp, PublicationPage             | 🟡          | **`PWA_RUNTIME_DOMAIN` non configuré** → aucune app build lançable ; pas d'infra d'origines isolées                                                    |
| Statuts d'application                                                   | `draft, pending, approved, rejected, quarantined`                                                                            | Libellés FR                                     | 🟡          | Cible : soumise, en analyse, correction demandée, publiée, suspendue, archivée. « Approuvée » = « publiée » aujourd'hui                                |
| Traçabilité publication                                                 | Table `publication_events`                                                                                                   | ❌ non affichée                                 | 🟡          | Exposer l'historique                                                                                                                                   |
| Modération applications                                                 | `admin/apps/review`, `admin/versions/review`, revue indépendante                                                             | AdminConsolePage, PublicationPage               | 🟡          | `GET /admin/apps` non paginé ; pas de « demande de correction » ; pas de file filtrée                                                                  |
| Administration utilisateurs                                             | ❌                                                                                                                           | ❌                                              | ❌          | Lot 6                                                                                                                                                  |
| Journal d'audit admin                                                   | 🟡 événements profil + publication seulement                                                                                 | ❌                                              | ❌          | Lot 6                                                                                                                                                  |
| Permissions                                                             | Colonne `role` (user/developer/admin) + `capabilities` calculées                                                             | Gardes de route                                 | 🟡          | Pas de permissions granulaires ni de Policies                                                                                                          |
| Avis et notes                                                           | `POST /reviews` (création/modification)                                                                                      | Formulaire sur la fiche                         | 🟡 ⚠️       | Pas de liste paginée, réponse développeur, signalement, modération ; commentaire sans longueur max ; pas de throttle ; pas d'exigence d'e-mail vérifié |
| Favoris                                                                 | CRUD                                                                                                                         | AccountPage, fiche                              | ✅          | —                                                                                                                                                      |
| Bibliothèque / installations                                            | `library`, `installations` par appareil                                                                                      | PersonalLibrary                                 | ✅          | L'installation est déclarative (pas mesurable de façon fiable), c'est assumé dans l'UI                                                                 |
| Intentions d'installation                                               | `install-intents`                                                                                                            | Utilisé par la vitrine Blade                    | 🟡          | Non utilisé par Quasar                                                                                                                                 |
| Statistiques développeur                                                | `developer/dashboard`, `analytics/summary`                                                                                   | DeveloperOverview, PublicationPage              | 🟡 ⚠️       | Vues de fiche non mesurées ; **`POST /analytics/events` accepte n'importe quelle app pour tout compte, sans throttle** → statistiques gonflables       |
| Notifications in-app / e-mail                                           | ❌ (hors OTP)                                                                                                                | ❌                                              | ❌          | Lot 10                                                                                                                                                 |
| Push                                                                    | ⚠️ `POST /push-notifications` simule un envoi (`status = sent`) et laisse un développeur cibler **n'importe quel `user_id`** | ❌                                              | ⚠️          | Désactiver ou restreindre avant toute mise en ligne                                                                                                    |
| PWA Lab                                                                 | 🟡 `ExternalPwaChecker` réservé aux apps du développeur                                                                      | ❌                                              | ❌          | Lot 9                                                                                                                                                  |
| Surveillance de disponibilité                                           | 🟡 contrôle quotidien des URL approuvées                                                                                     | ❌                                              | 🟡          | Historique, alertes, notification du développeur                                                                                                       |
| Quotas                                                                  | `PublicationQuota`, config                                                                                                   | Profil, tableau de bord                         | ✅          | Valeurs commerciales non fixées (volontaire)                                                                                                           |
| Facturation / paiements                                                 | ❌ (désactivé par conception)                                                                                                | ❌                                              | ❌          | Lot 10, sans encaissement réel                                                                                                                         |
| Pages statiques (CGU, confidentialité, règles, aide, contact, à propos) | ❌                                                                                                                           | ❌                                              | ❌          | Lot 3 (contenus à fournir)                                                                                                                             |
| Profil public développeur                                               | ❌                                                                                                                           | ❌                                              | ❌          | Lot 3                                                                                                                                                  |
| Responsive mobile/desktop                                               | —                                                                                                                            | Gating développeur < 768 px                     | ✅          | —                                                                                                                                                      |
| Motion design                                                           | —                                                                                                                            | GSAP à la demande, reduced-motion               | 🟡          | Lot 11                                                                                                                                                 |

## 6. Défauts et risques constatés

Classés par gravité. Aucun n'a été corrigé pendant cet audit.

| #   | Gravité | Constat                                                                                                                                | Emplacement                                      |
| --- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| D1  | Haute   | Un développeur peut créer une notification push vers n'importe quel utilisateur, présentée comme « envoyée » sans envoi réel           | `PushNotificationController@store`               |
| D2  | Haute   | Tout compte peut enregistrer des événements analytics sur n'importe quelle application, sans limite → statistiques manipulables        | `AnalyticsController@store`, route sans throttle |
| D3  | Haute   | Aucune réinitialisation de mot de passe ; le lien « Mot de passe oublié ? » ne fait rien                                               | `LoginPage.vue:67`                               |
| D4  | Moyenne | Le catalogue public liste les apps d'un éditeur suspendu alors que `launch` et `install-intents` les bloquent                          | `ApplicationController@index`, `@show`           |
| D5  | Moyenne | Avis : pas de longueur max, pas de throttle, pas d'exigence d'e-mail vérifié                                                           | `ReviewController@store`                         |
| D6  | Moyenne | Jetons Sanctum sans expiration, stockés en `localStorage` (exposés en cas de XSS)                                                      | `config/sanctum.php`, `stores/auth.js`           |
| D7  | Moyenne | Suppression de catégorie sans vérifier les applications rattachées                                                                     | `CategoryController@destroy`                     |
| D8  | Moyenne | `GET /admin/apps` charge toutes les apps, versions et développeurs sans pagination                                                     | `ApplicationController@adminApps`                |
| D9  | Basse   | N+1 : deux requêtes par app pour la note dans le catalogue                                                                             | `ApplicationController@index`                    |
| D10 | Basse   | Suppression définitive d'une application par l'admin (fichiers inclus), contraire à la règle « ne supprime aucune donnée » si utilisée | `ApplicationController@destroy`                  |
| D11 | Basse   | Vitrine Blade dupliquée avec le frontend Quasar                                                                                        | `routes/web.php`, `resources/views/apps`         |
| D12 | Info    | Inter / Inter Tight non chargées ; arguments marketing en dur                                                                          | `css/`, `StoreCatalogPage.vue`                   |
| D13 | Info    | Pages du gabarit inutilisées                                                                                                           | `IndexPage.vue`, `SecondPage.vue`                |

## 7. Décisions à prendre avant développement

1. **Applications historiques** : les 10 apps approuvées de comptes `developer` sans profil vérifié restent-elles publiques, ou passent-elles en suspension jusqu'à vérification de leur éditeur ?
2. **Vitrine Blade** : la retirer au profit de Quasar (recommandé), ou la conserver pour le SEO ?
3. **Hébergement des builds** : domaine des origines isolées (`pwa-{id}.<domaine>`), DNS wildcard et certificat wildcard. Sans cela, la méthode B ne peut pas fonctionner en production.
4. **Statuts d'application** : adopter la machine à états cible (§ Architecture) avec migration des statuts existants.
5. **Conservation des données** : durée de conservation après suppression de compte, et traitement des avis d'un compte supprimé (anonymisation recommandée).
6. **Outils de test frontend** : ajouter Vitest + Vue Test Utils et Playwright (dépendances de développement).
7. **Contenus légaux** : CGU, politique de confidentialité et règles de publication doivent être rédigés ou validés par un juriste. La plateforme ne doit pas être déclarée conforme sans cette revue.
