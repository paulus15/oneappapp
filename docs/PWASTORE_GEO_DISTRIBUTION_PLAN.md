# Distribution par pays — audit et plan

Date : 12 octobre 2026. Statut : **plan à valider** (aucun code modifié pour ce chantier).
Agents mobilisés : architecte, Laravel, Quasar, sécurité, publication, UX/UI, QA, DevOps, documentation, médias.

Deux notions **indépendantes** :

- **Pays du développeur** : où il réside ou est enregistré (profil développeur).
- **Pays de distribution** : où son application est proposée. Un développeur ivoirien peut viser la France, le Sénégal ou le monde entier.

---

## 1. Audit

| Élément                    | État actuel                                                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table `countries`          | 249 pays, code **ISO 3166-1 alpha-2**, nom FR et EN, `is_active`                                                                                                                                                      |
| Pays de l’utilisateur      | `users.country_id`, **obligatoire à l’inscription**, mais **facultatif dans le profil** (on peut l’effacer) ; les anciens comptes peuvent ne pas en avoir                                                             |
| Pays du développeur        | `developer_profiles.country_id`, obligatoire                                                                                                                                                                          |
| Pays de distribution       | Déjà en place : liste de codes `applications.countries` **et** table pivot `application_country` synchronisée automatiquement ; sélecteur dans l’espace développeur. Règle implicite : **liste vide = tous les pays** |
| Validation                 | Les pays font déjà partie des champs de fiche : toute modification d’une app publiée passe par une demande de validation (aucune modification silencieuse)                                                            |
| Filtrage public            | **Aucun** : le pays de l’utilisateur n’est utilisé nulle part dans le catalogue                                                                                                                                       |
| Cache                      | Aucun cache sur le catalogue : rien à invalider aujourd’hui                                                                                                                                                           |
| Application hébergée (ZIP) | Servie à `pwa-{id}.<domaine>` : cette adresse ne connaît pas l’utilisateur et ne peut pas filtrer par pays                                                                                                            |

Points d’accès publics qui renvoient ou servent des applications (tous à filtrer) : accueil et compteurs (`HomeController::index`), catalogue et recherche (`ApplicationController::index`), suggestions, fiche (`show`), similaires, sélections, page éditeur, catégories et leurs compteurs, avis (lecture et dépôt), vues, lancement (`/apps/{id}/launch`), téléchargement de version, favoris, récents, installations et mises à jour de la bibliothèque, intentions d’installation, signalements, statistiques.

---

## 2. Conception

### Mode de distribution explicite

Nouveau champ de fiche `availability` : **`all`** (tous les pays) ou **`selected`** (pays sélectionnés, au moins un). Il remplace la règle implicite « liste vide = tous les pays », trop facile à déclencher par oubli. Les applications existantes à liste vide sont migrées en `all` (comportement inchangé). Le choix fait partie du dossier soumis, de l’instantané et du récapitulatif (« Votre application sera disponible dans 5 pays. »).

### Une seule règle, côté serveur

Un service central `CountryAvailability` et un filtre de requête `visibleIn(?pays)` :

> publiée **et** (disponible partout **ou** autorisée dans le pays de l’utilisateur)

Il est appliqué à **tous** les points d’accès listés ci-dessus, y compris les compteurs, pour que listes et totaux restent cohérents. Une fiche hors pays répond « Cette application n’est pas disponible dans votre pays. » (et non « introuvable »), sans révéler son contenu.

- **Même règle pour un développeur** qui consulte le catalogue public.
- **Sa gestion n’est jamais bloquée** : son espace développeur montre toutes ses applications, quels que soient les pays.
- L’**administration** garde l’accès aux dossiers pour modérer.

### Utilisateurs sans pays

- **Connecté sans pays** (ancien compte, pays désactivé) : un bandeau demande de choisir un pays. En attendant, seules les applications **disponibles partout** sont affichées. Jamais tout le catalogue par défaut.
- Le pays ne peut plus être effacé du profil.
- **Aucune déduction par l’adresse IP** n’est enregistrée dans le compte.

### Changement de pays

Modification depuis le profil. Les listes, classements, recommandations et favoris sont recalculés à la requête suivante (aucun cache côté serveur aujourd’hui ; côté application, les données du catalogue sont rechargées). Contre les abus : changement limité, et changements tracés.

### Applications hébergées par PWA Store (ZIP)

Le filtrage du catalogue, de la fiche et du lancement empêche l’accès **normal** depuis le Store. Mais quelqu’un qui connaît l’adresse `pwa-{id}.…` peut l’ouvrir directement : cette adresse ne sait pas qui la visite.

- **Niveau 1, proposé maintenant** : filtrage complet du Store (catalogue, fiche, lancement, téléchargement).
- **Niveau 2, si une obligation légale l’exige** : lancement par jeton signé de courte durée, vérifié par l’adresse de l’application. Cela empêche le partage d’un lien direct. Ce niveau ne s’applique pas aux applications hébergées par leur éditeur, puisque leur site ne dépend pas de PWA Store.

Le pays déclaré n’est **pas une preuve de résidence** : si une réglementation exige une vérification plus forte, elle devra être traitée à part.

---

## 3. Plan

| Étape | Contenu                                                                                                                                                                                                                                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Migration additive `availability` (+ reprise des apps existantes), service `CountryAvailability`, filtre `visibleIn`, exigence « au moins un pays » si `selected`                                                                                                                                                           |
| 2     | Application du filtre à tous les points d’accès et compteurs ; réponse « non disponible dans votre pays »                                                                                                                                                                                                                   |
| 3     | Profil : pays obligatoire, limitation et traçabilité des changements                                                                                                                                                                                                                                                        |
| 4     | Front : choix « Tous les pays / Pays sélectionnés » avec recherche, récapitulatif (« disponible dans N pays »), bandeau « choisissez votre pays », message sur la fiche, sélecteur pour les visiteurs                                                                                                                       |
| 5     | Dossier admin : mode, liste et nombre de pays ; comparaison avant / après lors d’une mise à jour                                                                                                                                                                                                                            |
| 6     | Traductions FR/EN                                                                                                                                                                                                                                                                                                           |
| 7     | Tests : utilisateurs ivoirien, français, sénégalais ; développeur connecté ; app mondiale, un pays, plusieurs pays ; app non publiée, suspendue ; sans pays ; changement de pays ; recherche, classements, accès direct à une fiche et à une version ; modification des pays ; approbation ; tentative d’accès non autorisé |
| 8     | Documentation                                                                                                                                                                                                                                                                                                               |

## 4. Décisions à valider

Voir le message de présentation : visiteurs non connectés, limite de changement de pays, bibliothèque des applications déjà installées, niveau de restriction des applications hébergées.
