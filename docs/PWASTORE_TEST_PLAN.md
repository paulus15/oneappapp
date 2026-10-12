# PWA Store — Plan de tests

Règle : un test n'est déclaré réussi que s'il a été exécuté, avec sa commande et son résultat consignés dans la section « Journal d'exécution » du lot concerné (`PWASTORE_ROADMAP.md`).

## 1. État initial (11 octobre 2026, historique)

> Section conservée pour l’historique ; l’état à jour est au §7.

**Backend** : `php artisan test` → **59 tests, 286 assertions, tous passants**.

| Fichier                                                                               | Couvre                                                                                                             |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `EmailOtpTest`                                                                        | OTP inscription, connexion 2FA, renvoi, expiration, tentatives, changement d'e-mail                                |
| `DeveloperAccountTest`                                                                | Inscription sans rôle, activation idempotente, soumission, pièce d'identité, revue admin, suspension, accès croisé |
| `DeveloperDocumentTest`                                                               | Justificatifs : demande, dépôt, accès, suppression                                                                 |
| `PublicationWorkflowTest`                                                             | Soumission, revue indépendante, versions, quotas, source URL                                                       |
| `CountryAndDashboardTest`                                                             | Référentiel pays, résumé admin, tableau de bord, bibliothèque par appareil, pays des installations                 |
| `AppVersionExtractionRouteTest`, `IsolatedRuntimeTest`                                | Déploiement de version, origine isolée                                                                             |
| `StorefrontTest`, `LegacyPharmaAppUrlTest`                                            | Vitrine Blade, ancienne URL                                                                                        |
| Unit : `ExternalPwaCheckerTest`, `PwaPackageAnalyzerTest`, `AppVersionControllerTest` | Anti-SSRF, analyse ZIP, chemins de build                                                                           |

Base de test : `RefreshDatabase` (voir `phpunit.xml`), e-mails via `Mail::fake()`, stockage via `Storage::fake()`.

**Limite connue** : la suite tourne sous SQLite en mémoire. Un bug propre à MySQL (alias d’agrégat absent dans `ORDER BY`) n’a été détecté que par un appel réel au Lot 3. Ajouter au Lot 12 une exécution de la suite sur une base MySQL de test, et garder un appel réel des routes modifiées à chaque lot.

**Frontend** (à cette date) : aucun test. Depuis : Vitest et Playwright, voir §7.

## 2. Outils à ajouter

| Outil                                          | Usage                                                                                       | Lot                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| Vitest + `@vue/test-utils` + `jsdom`           | Composants, stores, formulaires, gardes de route                                            | 1                       |
| Playwright                                     | Parcours de bout en bout sur backend réel (base de test dédiée) et vues 390 / 768 / 1440 px | 1 (socle), 12 (complet) |
| `php artisan test --coverage` (Xdebug ou PCOV) | Mesure de couverture backend                                                                | 12                      |

Scripts à ajouter au `package.json` du frontend : `test:unit`, `test:e2e`.

## 3. Backend — tests à écrire par lot

| Lot | Tests                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mot de passe oublié (réponse identique e-mail connu/inconnu, jeton unique, expiration, révocation des sessions) ; changement de mot de passe ; sessions (liste, révocation, expiration) ; verrou après échecs ; désactivation de compte |
| 2   | Non-régression vérification éditeur ; renouvellement de pièce ; un admin ne revoit pas son profil ; permissions `developers.review`                                                                                                     |
| 3   | Visibilité publique unique (éditeur suspendu masqué partout) ; `/home` ; apps similaires ; profil public sans donnée privée ; pas de N+1 (compteur de requêtes)                                                                         |
| 4   | Historique `url_checks` ; SSRF (IP privées, redirections, DNS rebinding) ; échecs consécutifs → alerte                                                                                                                                  |
| 5   | ZIP malveillants (zip slip, liens symboliques, bombe de décompression, extensions interdites) ; rollback ; hébergement indisponible = message clair                                                                                     |
| 6   | Machine à états : toutes les transitions autorisées et interdites ; migration des statuts ; permissions granulaires ; journal d'audit écrit à chaque action sensible ; suspension d'utilisateur révoque ses jetons                      |
| 7   | Avis : e-mail vérifié, longueur, throttle, réponse développeur unique, masquage ; signalements ; export de données                                                                                                                      |
| 8   | Vues dédupliquées ; analytics restreints aux apps publiées + throttle ; tableau de bord sans données d'autres développeurs                                                                                                              |
| 9   | PWA Lab : rapport sur manifeste valide/invalide/absent, HTTP, timeouts ; throttle                                                                                                                                                       |
| 10  | Notifications émises par événement ; préférences respectées ; sécurité non désactivable ; file d'attente ; quotas et `payments_enabled = false`                                                                                         |
| 12  | Revue sécurité complète, en-têtes HTTP, purge et rétention                                                                                                                                                                              |

## 4. Frontend — tests à écrire

| Domaine         | Cas                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Store `auth`    | Ouverture de session, OTP en attente, réhydratation, déconnexion, jeton invalide                                                              |
| Gardes de route | Invité, connecté, admin, développeur, mobile < 768 px (pas d'accès `/developer*`)                                                             |
| Formulaires     | Inscription, connexion, OTP (6 chiffres, renvoi temporisé), mot de passe oublié, profil développeur, pièce d'identité, création d'application |
| États           | Chargement (skeleton), vide, erreur API (message serveur affiché), 403 avec motifs `publication_blockers`                                     |
| Composants      | `CountrySelect`, `AccountSecurity`, `DeveloperOverview`, `PersonalLibrary`, `DeveloperDocuments`                                              |
| Responsive      | Captures Playwright à 390, 768 et 1440 px, thèmes clair et sombre, `prefers-reduced-motion`                                                   |

## 5. Parcours de bout en bout (Playwright)

Exécutés contre le backend Laravel réel sur une base de test, e-mails capturés (`MAIL_MAILER=log` ou Mailpit) pour lire les codes OTP.

1. Un visiteur crée un compte et confirme son e-mail par OTP.
2. Il active son profil développeur (individuel), complète le profil, dépose une pièce d'identité et soumet.
3. Un administrateur vérifie le profil.
4. Le développeur crée une application, choisit la source URL, lance le contrôle et soumet.
5. L'administrateur approuve le dossier, ce qui publie l'application automatiquement.
6. L'application apparaît dans le catalogue et dans la recherche.
7. Un autre utilisateur la découvre, l'ajoute en favori, laisse un avis ; le développeur répond.
8. Le développeur voit l'avis et la vue de fiche dans son tableau de bord.

Variantes négatives :

- Profil refusé, corrigé, resoumis.
- Pièce d'identité expirée : publication bloquée avec motif affiché.
- Application refusée puis correction demandée.
- Suspension de l'éditeur : l'application disparaît du catalogue, de la fiche et du lancement.
- Doublon d'identifiant d'application ; doublon d'avis.
- Accès direct aux routes admin et développeur par un utilisateur simple (API et UI).
- Développeur sur mobile : fonctions développeur invisibles.

## 6. Critères de sortie d'un lot

- `php artisan test` vert, nouveaux tests du lot inclus.
- `npx oxlint` sans erreur, `npx oxfmt --check` propre sur les fichiers modifiés.
- `quasar build -m pwa` réussi.
- `php artisan migrate` exécuté en local sans perte de données (sauvegarde préalable si migration de données).
- Parcours du lot vérifié dans le navigateur (390 et 1440 px) ou par Playwright une fois installé.
- Résultats consignés dans la roadmap.

## 7. Exécution (état au 12 octobre 2026)

Relevé le 12 octobre 2026 vers 17 h 57 (GMT), pendant que d’autres lots de correction ajoutaient des tests : les nombres peuvent avoir augmenté depuis.

| Suite                            | Commande              | Résultat                                              |
| -------------------------------- | --------------------- | ----------------------------------------------------- |
| Backend (SQLite en mémoire)      | `php artisan test`    | 169/169 (1 288 assertions)                            |
| Backend (MySQL `oneapp_testing`) | `composer test:mysql` | même suite (162/162 au lot 2 de la revue de sécurité) |
| Frontend unitaire                | `npm run test:unit`   | 56/56, 15 fichiers (dont parité des traductions)      |
| Bout en bout                     | `npm run test:e2e`    | 13/13 (sans accès Internet, voir ci-dessous)          |

Tests ajoutés par la revue de sécurité : `SecurityLotOneTest` (compteurs, fuites de champs, permissions, impasses de publication), `UrlMonitoringTest` (empreinte du manifeste, signalement au lieu de suspension), `MediaAndRetentionTest` (recodage des images, purges `pwa:purge-media` et `pwa:purge-data`), `SecurityLotThreeTest`, `AppContentTest` (accès pour la vérification chiffré, annonces, classification), `CountryDistributionTest`, `InstallSignalTest`, `CoverImageTest`, `LocalizationTest`.

### Lancer les tests de bout en bout

`npm run test:e2e` démarre tout seul :

- l’API Laravel (`test/e2e/backend.sh`) sur `127.0.0.1:8011`, avec une base dédiée **`oneapp_e2e` recréée à chaque lancement**, les e-mails écrits dans `storage/logs/laravel.log` (aucun envoi) et un administrateur de test ;
- un build SPA du frontend pointé sur cette API, servi sur `127.0.0.1:9124` ;
- le Chrome installé sur la machine (aucun navigateur téléchargé).

Le chemin du backend se change avec `E2E_BACKEND_DIR`.

**Aucune dépendance à un site réel.** La PWA du développeur est une petite PWA de test (`test/e2e/fixtures/pwa/` : page, manifeste, script, politique de confidentialité) publiée à l’adresse réservée `https://demo.pwastore-e2e.example/` (le domaine `.example` ne se résout jamais sur Internet). Le backend de test est servi par `php -S` avec le routeur `test/e2e/backend-router.php`, équivalent de `php artisan serve`, qui remplace **uniquement dans ce processus de test** le client `ExternalPwaChecker` par une sous-classe : les requêtes vers ce seul hôte sont lues dans le dossier de fixtures, toutes les autres passent par le client réel. Le code du backend n’est pas modifié et ses protections anti-SSRF (HTTPS, port 443, IP publiques, DNS épinglé, redirections revalidées) restent actives en production et dans les tests PHPUnit. Le journal de connexion du serveur intégré est écrit dans `storage/logs/e2e-server.log`.

Ce que couvrent les scénarios : inscription par l’interface et code OTP, activation développeur, profil, dépôt de la pièce d’identité, vérification par un administrateur, référencement par URL avec contrôle du lien (PWA de test), couverture, icône et capture, onglet Contenu (accès pour la vérification, annonces, classification 3+), passage en anglais et retour, soumission, approbation qui publie automatiquement, visibilité dans le Store avec le badge d’hébergement, avis d’un autre utilisateur et réponse de l’éditeur, animations avec mouvement complet ; dépôt d’un build ZIP (activé pour ce test par `PWA_BUILD_UPLOADS=true` dans `backend.sh`) avec détection automatique des domaines externes et observation interne d’un administrateur ; refus : pages privées pour un visiteur, compte non confirmé, back-office réservé, outils développeur masqués sur mobile sans débordement horizontal.

Défauts trouvés par ces tests et corrigés : la pièce d’identité et les justificatifs ne pouvaient pas être envoyés depuis l’interface (FormData sérialisé en JSON), et la CSP de la page n’autorisait que l’API `https://oneapp.test` et deux domaines d’images.
