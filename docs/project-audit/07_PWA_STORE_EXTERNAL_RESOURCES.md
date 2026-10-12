# Détection automatique des ressources externes — 12 octobre 2026

## Audit avant correction

Le backend effectif est `/Users/apple/LaravelProjects/oneapp` (le chemin `LaravelPorjects` du document comporte une coquille). Le frontend est le dépôt Quasar courant.

| Fichier existant                                                          | Constat                                                                                                                                                                                              | Correction                                                                                                                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Laravel `app/Services/PwaPackageAnalyzer.php`                             | Analyse ZIP déjà exécutée à l’import et au déploiement. Expression régulière limitée à HTTP(S), sans provenance détaillée. Tout domaine absent de `domains_whitelist` ajoutait une erreur bloquante. | Réutilisation de l’analyse ; détection détaillée, normalisation, déduplication, suppression du seul rejet pour domaine non déclaré.        |
| `app/Http/Controllers/Api/AppVersionController.php`                       | Validation de la liste manuelle, analyse synchrone, signature du ZIP et stockage du rapport dans la version.                                                                                         | Suppression de la dépendance à la liste ; stockage automatique des ressources dans la transaction de création de version.                  |
| `app/Models/AppVersion.php`, migrations de versions                       | `analysis_report`, `detected_domains` et `domains_whitelist` existaient déjà. Aucune table de ressources ni d’observations dédiée.                                                                   | Conservation de ces données historiques ; ajout de relations et de deux tables.                                                            |
| `app/Http/Controllers/Api/PublicationController.php`                      | Revue indépendante de chaque version, avec administrateur, date, motif et audit.                                                                                                                     | Réutilisation de cette revue ; une correction de ressource non résolue empêche l’approbation. Décisions sérialisées par verrou de version. |
| `app/Http/Middleware/ServePwaRuntime.php`                                 | La liste manuelle alimentait indistinctement plusieurs directives CSP.                                                                                                                               | Pour les nouveaux rapports, directives limitées aux usages détectés.                                                                       |
| Quasar `CreateAppPage.vue`, `EditAppPage.vue`, `DeveloperConsolePage.vue` | Champ manuel de domaines et panneau d’erreur « non déclarés ».                                                                                                                                       | Suppression du champ et du message ; indication d’analyse automatique ; redirection vers le rapport de publication après import.           |
| `PublicationPage.vue`, lien « Fiche détaillée » d’`AdminConsolePage.vue`  | Suivi et revue de versions déjà partagés entre propriétaire et modérateur.                                                                                                                           | Intégration d’un composant de rapport commun, sans nouvelle console parallèle.                                                             |

Les routes existantes, signatures, contrôles d’identité du développeur, quotas, analyse des fonctions sensibles, détection des chemins dangereux, liens symboliques, exécutables et bombes ZIP restent utilisés. Il n’existe pas de job d’analyse ZIP à remplacer : l’analyse reste synchrone, bornée et sans accès réseau.

## Nouveau parcours

Import ZIP → analyse automatique → stockage associé à la version → consultation du rapport → observations administratives → approbation/refus par le processus existant.

Le profil développeur doit toujours être complet et validé avant toute création d’application, même en brouillon.

### Détection

`ExternalResourceDetector` analyse HTML, JS/MJS/CJS (y compris workers), CSS, JSON, manifests, SVG et configurations YAML/TOML/INI/CONF. Il extrait HTTP, HTTPS, WS, WSS et les références relatives au protocole. Il normalise les échappements courants, la casse du nom d’hôte et les ports standards. Une ressource est dédupliquée par URL normalisée et type, avec conservation des fichiers sources et du nombre d’occurrences.

Les types comprennent scripts, styles, polices, images, API/WebSockets, iframes, médias, manifests et workers. Les catégories distinguent services reconnus, API présumées, inconnus, locaux/privés et indéterminés. Elles restent indicatives : aucun service n’est considéré sûr parce qu’il est connu.

Les chaînes dynamiques ou mal formées restent des résultats indéterminés sans hostname ni autorisation CSP. Les suffixes HTML et les antislashs ne deviennent pas des domaines. Les noms d’hôtes privés et les protocoles non chiffrés sont signalés à risque élevé sans rejet automatique du ZIP. L’analyse n’effectue ni résolution DNS ni requête HTTP vers les références.

Limites affichées : une analyse statique n’exécute pas l’application, ne résout pas toutes les concaténations et ne garantit pas l’exhaustivité des URL. La classification d’usage reste une heuristique ; les usages indéterminés nécessitent une vérification. Les limites de fichiers/volume ZIP restent actives ; l’analyse refuse aussi un nombre excessif de références ou des URL de plus de 4096 caractères.

### Stockage et traçabilité

Migration additive : `2026_10_12_000009_create_external_resources.php`.

- `application_external_resources` : application, version exacte, empreinte unique par version/URL/type, URL originale et normalisée, hôte/origine/protocole, type/catégorie/risque, méthode, fichiers, occurrences, présence dans l’analyse, statut d’examen, administrateur et date.
- `external_resource_observations` : historique append-only, texte, visibilité `internal` ou `developer`, statut, identifiant et nom de l’administrateur, dates.

`ExternalResourceReport` réutilise les lignes d’une analyse identique sans doublons ni perte des observations. Une modification de provenance/classement remet l’examen de la ressource en attente. Les résultats devenus absents sont conservés avec `is_present=false`. Chaque version possède ses propres lignes et son propre rapport.

La comparaison porte sur la version antérieure la plus récente ayant le statut approuvé : domaines ajoutés/supprimés, changements de types et nouveaux risques élevés. Les anciens rapports limités aux noms de domaines servent de référence partielle, explicitement signalée.

### Contrats API

| Route authentifiée                                          | Accès                                                                 | Résultat                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `POST /api/versions`                                        | Développeur validé et autorisé sur l’application                      | Analyse et ressources enregistrées automatiquement ; aucune liste de domaines requise.           |
| `GET /api/versions/{version}/external-resources`            | Propriétaire ou modérateur habilité                                   | Ressources, observations autorisées, compteurs, comparaison, limites et proposition CSP.         |
| `POST /api/versions/{version}/external-resources/reanalyze` | Même accès, limité à 3/minute                                         | Réanalyse du ZIP dont l’empreinte doit correspondre à celle enregistrée.                         |
| `POST /api/admin/external-resources/{resource}/review`      | Permission `apps.moderate`, sans auto-examen de sa propre application | `status`: `reviewed` ou `correction_requested`, `body`, `visibility`: `internal` ou `developer`. |

Une demande de correction doit être visible par le développeur. Les notes internes ne sont ni retournées au propriétaire ni envoyées dans ses notifications. Les observations communiquées utilisent le système de notifications existant. Une correction ne peut pas être demandée sur une version approuvée/active sans revenir à la modération.

Une réanalyse qui changerait le rapport d’une version approuvée/active renvoie 409 : il faut importer une nouvelle version pour préserver le rapport approuvé et le runtime en service. Une analyse identique reste idempotente.

### CSP

Pour les nouveaux rapports, la CSP part de `self`, conserve l’interdiction des objets et de l’encapsulation, et associe chaque origine uniquement à la directive de son usage identifié. Les WebSockets WSS alimentent seulement `connect-src`. Aucune étoile n’est ajoutée. Les origines privées, HTTP/WS et les références indéterminées ne sont pas autorisées automatiquement.

La proposition est visible dans le rapport et devient celle du runtime après l’approbation de la version. Les anciennes versions approuvées sans nouveau rapport conservent leur CSP historique afin de ne pas modifier silencieusement une publication existante. Leur passage au nouveau mécanisme demande une nouvelle version analysée et approuvée.

### Frontend

Le composant `ExternalResourcesReport.vue` affiche les compteurs, nouveaux domaines, types, risques, fichiers, occurrences, URL et observations. Il filtre par niveau de risque et permet au modérateur d’enregistrer une observation avec visibilité explicite. Le backend détermine `can_review` et applique lui-même les autorisations.

La fiche publique `AppDetailsPage.vue` affiche les domaines détectés et ne déduit plus un fonctionnement hors ligne de l’absence de déclaration manuelle.

Le chargement du détail se fait à l’ouverture de la section d’une version pour éviter de charger simultanément tous les historiques. Les contenus et URL sont rendus comme texte, jamais comme HTML provenant du build.

## Vérifications

Les tests `ExternalResourceDetectorTest`, `ExternalResourcesTest`, `PwaPackageAnalyzerTest` et `external-resources.spec.js` couvrent :

1. Absence de références externes.
2. Google Fonts, y compris l’ordre des attributs HTML.
3. Plusieurs API et classification des connexions.
4. Plusieurs CDN, sans les déclarer sûrs.
5. WebSockets.
6. Références dynamiques indéterminées.
7. Faux positifs, antislashs et délimiteurs HTML.
8. Adresses locales/privées et absence d’autorisation CSP.
9. Déduplication et provenance multi-fichiers.
10. Nouveaux domaines, domaines supprimés, types et risques modifiés entre versions.
11. Réanalyse idempotente, conservant les observations.
12. Consultation autorisée et refus des accès tiers.
13. Observations datées et attribuées, confidentialité des notes internes, blocage de l’approbation lorsqu’une correction est demandée.
14. Import sans déclaration manuelle, maintien des contrôles de sécurité ZIP et des fonctionnalités de publication existantes.

Les résultats finaux de tests, compilation et migration sont consignés après vérification.
