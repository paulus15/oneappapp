# TWA Store — Synthèse de l’audit

> Audit du code accessible au 10 octobre 2026. **EXISTANT** : mécanisme constaté dans le code ; cela ne vaut pas recette en production. **PARTIEL** : chaîne incomplète ou incohérente. **ABSENT** : aucun mécanisme trouvé dans le périmètre examiné. **RECOMMANDÉ** : évolution proposée, non réalisée. **NON VÉRIFIÉ** : état inaccessible ou non testé.
>
> Références : **F:** = `/Users/apple/Documents/Quasar Projects/oneappapp/` ; **B:** = `/Users/apple/LaravelProjects/oneapp/`. Les chemins sont relatifs à ces racines. `Api/…Controller` désigne `B:app/Http/Controllers/Api/…Controller.php`. « TWA Store » est le nom demandé pour cette documentation ; le frontend affiche **PWA Store** et la vitrine Laravel **OneApp**. Aucun projet Android Trusted Web Activity n'a été identifié.

## Résumé exécutif

Le projet possède un socle fonctionnel substantiel : catalogue, comptes à trois rôles, gestion des applications, réception de ZIP, analyse statique des paquets, extraction, avis et primitives de bibliothèque. **Le lancement public n’est pas recommandé en l’état** : l’installation Quasar appelle une opération réservée aux propriétaires, trois contrats de la console administrative divergent de l’API et le confinement des applications tierces doit être renforcé.

Deux interfaces consomment le même backend : une SPA Quasar rebrandée PWA Store et une vitrine Blade encore nommée OneApp. Le lien Valet local `oneapp.test` pointe sur le backend Laravel. Consulter cette adresse peut donc montrer une interface différente du frontend Quasar modifié ; l’adresse effectivement consultée par le porteur de projet est **NON VÉRIFIÉE**.

Le modèle produit décrit dans la demande — référencement par URL et vérification des éditeurs — ne correspond que partiellement à l’implémentation. Le code privilégie le dépôt et l’hébergement de ZIP. L’URL officielle est une métadonnée, sans vérification distante ni preuve de propriété du domaine.

## Périmètre et méthode

**EXISTANT — dépôts accessibles.** Frontend F et backend B inspectés ensemble : sources applicatives, routes, configurations non secrètes, manifestes et fichiers de verrouillage des dépendances, modèles, services, migrations, vues, ressources publiques, tests et scripts. Les dépendances tierces n’ont pas fait l’objet d’un audit intégral ; seules certaines configurations de framework ont été consultées pour confirmer des comportements. Aucun autre backend manquant n’a été identifié dans les chemins examinés.

**NON VÉRIFIÉ.** Base effectivement déployée, données réelles, variables `.env`, domaines et infrastructure de production, certificats, backups, journaux d’exploitation, résultat d’une installation sur téléphone et comportement complet en navigateur. Les tables décrites sont celles des migrations, pas un relevé SQL d’une base en service. Les données des seeders et factories sont des démonstrations.

**Contraintes respectées.** Audit en lecture seule hors création de ces sept documents. Aucune migration, modification de base, installation de dépendance, correction applicative, suppression ou publication. Les changements déjà présents dans les deux arbres de travail ne sont pas attribués à cet audit. Aucune valeur de secret n’est reproduite.

## Architecture détectée

| Couche                | État observé                                                                                         | Sources                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Frontend principal    | Quasar 2, Vue 3, Pinia, Axios, routeur history ; SPA et configuration PWA                            | F:package.json, package-lock.json, quasar.config.js, src/router                                |
| Interface alternative | Blade, JavaScript natif, CSS et assets Vite ; marque OneApp                                          | B:routes/web.php, app/Http/Controllers/StorefrontController.php, resources/views, resources/js |
| API                   | Laravel 13, Sanctum, contrôleurs REST ; autorisations dans les méthodes                              | B:routes/api.php, bootstrap/app.php, app/Http/Controllers/Api                                  |
| Distribution          | ZIP privé, analyse locale, extraction vers le répertoire public du backend                           | B:app/Services/PwaPackageAnalyzer.php, Api/AppVersionController                                |
| Persistance           | Eloquent ; 17 tables définies par 16 fichiers de migration ; SQLite par défaut dans la configuration | B:database/migrations, config/database.php                                                     |
| Exécution différée    | Infrastructure de queue présente, aucun job métier ni planification métier trouvé                    | B:config/queue.php, routes/console.php, app                                                    |

## Fonctionnalités disponibles et limites

| Capacité                                 | État     | Preuve et portée                                                                                        |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| Inscription, connexion, déconnexion      | EXISTANT | AuthController, F:src/stores/auth.js ; tokens persistés côté client                                     |
| Rôles user/developer/admin               | EXISTANT | Garde frontend et contrôles backend ; pas de vérification d’identité de l’éditeur                       |
| Catalogue, recherche, catégories, tri    | EXISTANT | ApplicationController::index, CategoryController ; pagination API non exposée dans les pages            |
| Fiche et avis                            | PARTIEL  | Consultation et création/mise à jour d’avis ; captures de démonstration et erreurs peu visibles         |
| Création et édition d’une application    | PARTIEL  | Métadonnées et ZIP disponibles ; chaîne des captures d’écran non persistée correctement                 |
| Analyse ZIP                              | EXISTANT | Contrôles structure, traversée d’archive, extensions et heuristiques ; aucune certification de sécurité |
| Modération                               | PARTIEL  | Statuts et score modifiables par API admin ; boutons Quasar appellent des routes absentes               |
| Installation et ouverture publiques      | PARTIEL  | Extraction réservée propriétaire/admin, couplée au bouton public Quasar                                 |
| Bibliothèque et mises à jour             | PARTIEL  | API et écran Blade ; absence de raccordement complet aux installations effectives                       |
| Notifications push                       | PARTIEL  | Enregistrement simulé « sent » ; aucun fournisseur ni livraison réelle                                  |
| Mesures d’usage                          | PARTIEL  | Réception et agrégats API ; instrumentation cliente et fiabilité métier incomplètes                     |
| Contrôle d’URL et vérification d’éditeur | ABSENT   | Aucune sonde distante, preuve de domaine, KYC ni circuit de validation d’identité trouvé                |
| Paiement, contribution, abonnement       | ABSENT   | Prix descriptif possible ; aucune commande, transaction, passerelle ou facturation                      |
| Réinitialisation de mot de passe         | ABSENT   | Table technique présente, mais aucun flux API/UI opérationnel trouvé                                    |

## Registre des constats prioritaires

La priorité P0–P3 indique l’ordre de traitement ; la sévérité de sécurité exprime le risque technique. Une analyse statique identifie des chemins à corriger, pas la preuve d’une exploitation en production.

| ID  | État / priorité                                            | Constat, conséquence et preuve                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | PARTIEL / P0 ; sécurité élevée                             | `identifier` accepte une chaîne libre puis entre dans `public_path('apps/'.$identifier)` ; le déploiement supprime le dossier avant extraction. Risque de sortie du dossier autorisé selon l’identifiant et les droits du processus. `ApplicationController::store`, `AppVersionController::deployVersion`, `destroy`.       |
| R02 | PARTIEL / P0 ; sécurité élevée                             | Les PWA tierces sont servies sous l’origine du backend, également utilisée par la vitrine et ses tokens. Leur JS partage cette origine. Les workers peuvent interférer ; le worker racine cache aussi des GET API authentifiés et ne cloisonne pas les comptes. `AppVersionController`, B:public/oneapp-sw.js, resources/js. |
| R03 | PARTIEL / P0                                               | Le bouton public Quasar extrait une version avant de l’ouvrir ; l’API exige propriétaire/admin. Visiteur : 401 ; utilisateur ordinaire : 403. `F:src/pages/store/AppDetailsPage.vue`, `AppVersionController::extract`.                                                                                                       |
| R04 | PARTIEL / P0                                               | Admin : routes `/apps/{id}/status`, `/apps/{id}/trust`, `/analytics/apps/{id}` absentes. L’API utilise `PUT /apps/{id}` et `/analytics/summary/{app_id}` ; `crash_rate` diffère de `crashes_ratio`. `F:src/pages/admin/AdminConsolePage.vue`, B:routes/api.php, AnalyticsController.                                         |
| R05 | PARTIEL / P0 ; sécurité élevée                             | Approbation, activation et état de version ne sont pas appliqués uniformément au détail, téléchargement, extraction et autres accès. Une PWA déjà déployée reste un fichier public après désactivation. ApplicationController, AppVersionController, StorefrontController, InstallationController.                           |
| R06 | PARTIEL / P1                                               | Les fichiers de captures reçus dans `media` n’ont pas de stockage durable ni conversion en URL ; l’édition ne représente pas les suppressions existantes. ApplicationController::store/update ; F:src/pages/developer/CreateAppPage.vue, EditAppPage.vue.                                                                    |
| R07 | PARTIEL / P1                                               | CSP sans `frame-src` adapté ni `img-src` pour le backend/blob ; messages d’iframe attendus depuis l’origine Quasar alors que la PWA vient du backend ; statut installé insuffisamment vérifié. F:index.html, AppDetailsPage.vue.                                                                                             |
| R08 | PARTIEL / P1 ; sécurité moyenne à élevée selon le contexte | Sérialisation publique de relations User/Version : emails et métadonnées internes exposables ; chaîne d’injection HTML dans le guide iOS et attribut d’icône injecté au déploiement. ApplicationController::show, B:resources/js/app.js, AppVersionController.                                                               |
| R09 | PARTIEL / P1                                               | Édition : erreur de sauvegarde capturée sans interrompre `saveAll`. Reprise ZIP attend `MISSING_PWA_FILES`, backend renvoie `PACKAGE_VALIDATION_FAILED`. F:src/pages/developer/EditAppPage.vue, DeveloperConsolePage.vue ; AppVersionController::store.                                                                      |
| R10 | PARTIEL / P1                                               | Tokens localStorage, état Pinia non purgé par l’intercepteur 401, réhydratation serveur non appelée ; absence de limite API explicite et expiration Sanctum par défaut nulle. F:src/stores/auth.js, src/boot/axios.js ; B:bootstrap/app.php, config/sanctum.php.                                                             |
| R11 | PARTIEL / P1                                               | Deux vitrines et trois noms, deux clés de token, travailleurs et données de navigation distincts. Risque de validation sur la mauvaise interface et de divergence produit. F:layouts ; B:routes/web.php, views, resources/js.                                                                                                |
| R12 | PARTIEL / P2                                               | Pagination ignorée, note zéro affichée parfois 5, captures/tailles fictives, « tendances » fondées sur volumes cumulés, instrumentation incomplète. F:src/pages/store/StoreCatalogPage.vue, AppListPage.vue, AppDetailsPage.vue ; ApplicationController::index.                                                              |

## Points forts et dette technique

**EXISTANT.** Le serveur limite les opérations de gestion par rôle et propriétaire, utilise le hachage Laravel des mots de passe et des validations de requêtes. L’analyseur détecte les chemins d’archive dangereux et plusieurs anomalies de structure. L’unicité d’une installation par utilisateur/application/appareil est portée en base. Le frontend possède des layouts séparés, des composants de marque et des variables de thème communes. Quelques tests ciblent les droits d’extraction, les chemins de build et les archives.

**PARTIEL.** La logique de distribution et la génération de HTML/JS sont concentrées dans AppVersionController. Les autorisations sont répétées dans les contrôleurs, les réponses exposent des modèles directement et l’interface Blade duplique des parcours Quasar. Plusieurs éléments de scaffold et liens inactifs restent présents. Le vocabulaire « sécurité », « sandbox » ou « mises à jour » dépasse les garanties effectivement démontrées.

## Vérifications réalisées pendant cet audit

| Vérification                                                         | Résultat                                                | Limite                                                                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint:check` avec Node 24.14.1                               | Réussi ; formatage de 44 fichiers et oxlint sans erreur | Pas de recette fonctionnelle ni de test d’accessibilité                                                                             |
| `php -l` sur app/routes/config/migrations/tests/bootstrap hors cache | 63 fichiers valides                                     | Analyse syntaxique uniquement                                                                                                       |
| PHPUnit `--testsuite Unit --do-not-cache-result`                     | 4 tests, 14 assertions, réussis sous PHP CLI 8.5.7      | Ne charge pas le schéma réel ni les parcours HTTP complets                                                                          |
| Inventaire des tests backend                                         | 14 méthodes de test : 4 Unit et 10 Feature              | Les Feature n’ont pas été exécutés : certains utilisent RefreshDatabase, incompatible avec l’interdiction de migration de cet audit |

Les builds ou essais évoqués dans le README et les travaux antérieurs ne sont pas présentés comme des validations effectuées durant cet audit. Aucun build, audit de dépendances distant, test de charge ni installation sur appareil n’a été exécuté ici.

## Préparation au lancement et décisions

**PARTIEL — prototype avancé, recette et durcissement nécessaires.** Aucun pourcentage d’avancement n’est donné : le périmètre MVP, les critères de sécurité et les résultats de recette n’ont pas encore de référentiel accepté.

Décisions du porteur de projet : nom canonique ; Quasar, Blade ou coexistence assumée ; référencement externe par URL, hébergement ZIP ou les deux ; preuve d’identité minimale des éditeurs ; autorité et délai de modération ; gratuité et conditions d’une contribution ; données conservées et durée ; domaines d’hébergement isolés. Ces décisions n’empêchent pas la documentation, mais certaines conditionnent l’implémentation.

Les cinq actions prioritaires sont : **contenir les chemins de déploiement (C01)** ; **isoler les PWA et exclure les données privées du cache (C02)** ; **séparer déploiement et ouverture publique, avec politique de retrait (A03/C03)** ; **réparer les contrats de modération (A02)** ; **fiabiliser la persistance des médias et la sauvegarde (A04/A05)**. Le [plan](./06_TWA_STORE_IMPLEMENTATION_PLAN.md) détaille leurs critères de réception.

## Points d’entrée pour vérifier les constats

- [Routeur Quasar](../../src/router/routes.js) et [fiche avec installation](../../src/pages/store/AppDetailsPage.vue).
- [Console administrative](../../src/pages/admin/AdminConsolePage.vue) et [formulaire d’édition](../../src/pages/developer/EditAppPage.vue).
- [Routes API Laravel](/Users/apple/LaravelProjects/oneapp/routes/api.php), [contrôleur de distribution](/Users/apple/LaravelProjects/oneapp/app/Http/Controllers/Api/AppVersionController.php) et [analyseur ZIP](/Users/apple/LaravelProjects/oneapp/app/Services/PwaPackageAnalyzer.php).
- [Contrôleur des fiches](/Users/apple/LaravelProjects/oneapp/app/Http/Controllers/Api/ApplicationController.php), [worker de la vitrine](/Users/apple/LaravelProjects/oneapp/public/oneapp-sw.js) et [JavaScript Blade](/Users/apple/LaravelProjects/oneapp/resources/js/app.js).

Le contrôle d’intégrité des instantanés pris avant l’audit ne relève aucune modification parmi les 66 fichiers frontend et 75 fichiers backend suivis pour ce contrôle. Ce contrôle exclut notamment dépendances, sorties de build et données d’exécution ; il complète le périmètre documentaire, sans prétendre vérifier l’ensemble du disque.

## Prise en compte explicite des fonctionnalités du backend

Le [catalogue fonctionnel Laravel du PRD](./01_TWA_STORE_PRD.md#catalogue-fonctionnel-laravel-et-intégration-dans-quasar) recense BF01–BF13 et sépare **capacité serveur** et **raccordement Quasar**. Il inclut les fonctions peu visibles dans l’interface : administration des catégories, bibliothèque personnelle, archivage/désarchivage, suivi par appareil, calcul des mises à jour, intentions avec expiration, téléchargement ZIP et agrégats d’usage.

Ces capacités ne sont pas classées absentes parce que leur écran Quasar manque. Le backend comprend également une vitrine Blade et ses aides d’installation. Les limites restent explicites : push simulé, absence de preuve d’installation, reprise d’intention incomplète et calcul des mises à jour à fiabiliser. Les [parcours API](./03_TWA_STORE_APP_FLOW.md#15-parcours-des-capacités-laravel-non-complètement-exposées-dans-quasar) et le [plan de raccordement](./06_TWA_STORE_IMPLEMENTATION_PLAN.md#raccordement-des-fonctionnalités-laravel-existantes) expliquent comment exploiter cet existant.

## Documents associés

[00](./00_TWA_STORE_AUDIT_SUMMARY.md) · [01](./01_TWA_STORE_PRD.md) · [02](./02_TWA_STORE_TRD.md) · [03](./03_TWA_STORE_APP_FLOW.md) · [04](./04_TWA_STORE_UX_UI.md) · [05](./05_TWA_STORE_BACKEND_SCHEMA.md) · [06](./06_TWA_STORE_IMPLEMENTATION_PLAN.md)
