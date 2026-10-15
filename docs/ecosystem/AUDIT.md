# Écosystème développeur — audit initial et étapes de validation

Audit des dépôts `oneappapp` (Quasar/Vue) et `oneapp` (Laravel 13/PHP 8.4), branches `feat/developer-ecosystem`. Aucune publication ni fusion automatique. Les modules sont livrés successivement, avec validation avant le suivant.

## Matrice de départ

| Fonctionnalité | Backend | Frontend | État | Action |
|---|---|---|---|---|
| Monitoring | `UrlMonitor`, `ExternalPwaChecker`, `UrlCheck`, `pwa:check-external` toutes les 6 heures | Contrôles dans le dossier application | Partiel | Étendre le moteur sécurisé et l’historique ; jobs différés, incidents confirmés, paramètres et page Monitor |
| Analytics | `DeveloperStats`, `AnalyticsEvent`, vues quotidiennes, installations déclarées, SDK et références signées d’ouverture | `DeveloperStatsPage`, graphiques, périodes/application | Présent, extensible | Préserver les définitions, ajouter attribution et agrégats de campagne puis analytics avancé |
| Labo PWA | `PwaLab`, `LabAnalysis`, `/lab/analyses` | `PwaLabPage`, rapport et historique | Présent | Entrée centrale, pagination et erreurs, comparaisons puis diagnostics approfondis |
| Beta Testing | Aucun domaine campagne de test identifié | Aucune page | Absent | Nouveau domaine protégé ; ne pas réutiliser la publication pour contourner la modération |
| Growth | Références SDK et vues existantes, aucune campagne promotionnelle | Aucun générateur de campagne/QR/badge | Absent | Campagnes à identifiants aléatoires, attribution contrôlée, outils de promotion |
| Feedback Hub | `Suggestion`, pièces jointes privées, policy, statuts/réponses | Suggestions développeur et utilisateur, avis publics séparés | Partiel | Étendre les suggestions : priorité, catégorie, version, doublons et historique |
| DevOps | Auth Sanctum utilisateur, workflows de déploiement plateforme | Pas d’interface intégrations | Plateforme seulement | Jetons applicatifs limités, webhooks signés et documentation sans publication automatique |
| Assistant IA | Aucun fournisseur/assistant métier identifié | Aucun assistant | Absent | Intégration facultative après validation des diagnostics, avec quotas et filtrage des données |

## Invariants inspectés

- `Application::publiclyVisible` et `visibleToViewer`, `CountryAvailability` : publication active, compte actif, développeur vérifié, disponibilité géographique. Les nouveaux liens publics doivent appliquer les mêmes règles.
- `User::hasDeveloperAccess`, capacités du compte, `publicationBlockers`, workflow de demandes et modération : garder les droits existants ; le rôle seul ne suffit pas à autoriser une publication.
- Authentification frontend par cookie HttpOnly avec client Axios limité à l’API HTTPS ; OTP et révocation des sessions existent.
- `ExternalPwaChecker` valide HTTPS/443, refuse les IP et domaines locaux, valide les résolutions DNS, épingle l’adresse cURL, contrôle les redirections et borne corps/temps. Tout contrôle supplémentaire réutilise ce transport. Aucun JavaScript distant n’est exécuté dans PHP.
- `UrlMonitor` conserve les contrôles dans `url_checks` et peut suspendre après deux échecs planifiés. Cette règle de publication reste distincte des incidents informatifs du nouveau Monitor.
- `Notifier`, `UserNotice`, préférences et déduplication existent. Les e-mails transactionnels actuels sont forcés : les alertes Monitor doivent respecter leurs propres préférences explicites.
- Suggestions privées : validation, policy et téléchargement authentifié ; pas de publication automatique des retours ni de leurs captures.
- Statistiques : consultations de fiche, clics, événements SDK, installations déclarées et activations sont différents. Les conversions de campagne ne prouvent pas une installation.
- Rétention centralisée dans `DataRetention`, Scheduler et queue base de données disponibles. Pas de Redis/Kubernetes imposé.
- Hébergement ZIP désactivé par défaut via `PWA_BUILD_UPLOADS` ; ne pas l’activer pour les nouveaux outils.
- Mobile : règle historique frontend redirigeant `/developer` vers `/account` ; son retrait est intentionnel pour répondre au nouveau cahier, avec conservation des autorisations et tests.
- Aucun fichier d’agent spécialisé existant identifié dans les deux dépôts. Les fichiers `agentdb.rvf` ne sont pas une définition d’agents métier.

## Architecture et activation

Réutiliser les dossiers Laravel existants (Models, Services, Jobs, Controllers, Resources, Policies) et les composants Quasar (`EmptyState`, `LoadMore`, `useLoadMore`, `TrendChart`). Aucun changement silencieux des réponses existantes, notamment le tableau `/developer/apps`.

`GET /platform` expose `tools` : `monitor`, `growth`, `feedback_hub`, `lab_pro`, `beta`, `integrations`, `assistant`. Tous sont désactivés par défaut. Le backend contrôle lui-même les flags, les droits et la propriété des ressources ; masquer une page ne constitue pas une autorisation. Les fonctionnalités existantes restent accessibles même si leur extension est désactivée.

Le Labo conserve son diagnostic actuel et devient la porte d’entrée vers les outils activés. Les routes restent partageables. Les nouveaux outils respectent mode sombre, clavier, mobile, erreurs explicites, chargement et pagination serveur.

## Ordre de livraison et preuves

1. Fondations : audit, flags, accès mobile et contrat commun. Valider les tests existants avant les modules.
2. PWA Monitor : backend + frontend + tests d’isolation, SSRF, incidents/rétablissement, queue et pagination. Valider avant Growth.
3. PWA Growth : campagnes, attribution, promotion, tests de disponibilité/pays et absence de redirection arbitraire. Valider avant Feedback.
4. Feedback Hub : extensions compatibles du système privé, tests de confidentialité et transitions.
5. Labo Pro, Beta Testing puis Analytics avancé : chacun avec son propre point de validation.
6. Intégrations/API/workflow/webhooks, puis assistant IA : contrôles de secrets, limites, validation avant activation.
7. Dashboard unifié, revue de sécurité, documentation d’exploitation/migrations/retour arrière et préparation d’intégration.

## Agents et responsabilités

- Coordination/intégration : matrice, contrats, flags, revue des changements, validation de chaque module et commits sur branches dédiées.
- Frontend UX : navigation mobile, pages Quasar, accessibilité, états réseau, traductions et tests UI.
- Monitoring/backend : moteur HTTP, queue, incidents, paramètres, rétention, tests de sécurité et isolation.
- Growth/Feedback : attribution exacte, extensions des suggestions privées, migrations compatibles et tests métier.
- QA/revue : contrôle indépendant des contrats, régressions, états désactivés et risques avant chaque module suivant.

Aucun agent ne démarre un module suivant avant validation du précédent. Les travaux backend/frontend d’un même module peuvent être menés en parallèle sur un contrat partagé et des fichiers distincts.

## Validation initiale

- Frontend : 148 tests réussis (28 fichiers).
- Backend : première exécution sous sandbox affectée par les interdictions d’écriture des fichiers de test/logs ; ne constitue pas une régression applicative. Nouvelle exécution hors sandbox avec SQLite en mémoire : **311 tests réussis, 2 546 assertions**.
- CI frontend : audit dépendances, lint, tests unitaires, build PWA, vérification package/déploiement. CI backend : audit Composer, Pint, PHPUnit. Pas de déploiement exécuté pour cet audit.

## Complément audit backend

Les vues de fiche et activations actuelles dédupliquent l’audience sur toute la durée de vie de l’application, pas par jour. `AnalyticsEvent(open)` n’est pas le clic « Ouvrir ». Growth doit donc enregistrer ses propres événements attribués et leurs agrégats, sans modifier rétroactivement ces compteurs. Aucun statut métier d’« application vérifiée » n’existe : un badge de vérification ne sera pas inventé à partir de la seule publication.

Le SDK possède déjà une clé publique, un contrôle d’origine et une référence aléatoire liée à l’application/au compte, utilisable une fois pendant dix minutes. Il mesure des signaux réellement reçus, sans garantie universelle d’installation. Les pays des mesures correspondent actuellement aux pays déclarés, pas à une géolocalisation.

Les statuts des suggestions `new/read/planned/done/declined` seront conservés ; `in_progress` complète le cycle sans migration destructrice. `read` sera présenté comme « À étudier », `done` comme « Résolu ». Les métadonnées internes (priorité, doublon, version, historique de tri) restent protégées par les mêmes autorisations.

Les API développeur techniques, campagnes bêta, webhooks et fournisseurs IA n’existent pas : ils doivent être ajoutés explicitement, derrière leurs flags. Aucune intégration IA ne peut être déclarée opérationnelle sans configuration d’un fournisseur réel. Les contrôles nécessitant un navigateur devront rester signalés comme non mesurés tant qu’un worker isolé n’est pas disponible.
