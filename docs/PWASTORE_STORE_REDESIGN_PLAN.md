# Refonte du Store et images de couverture — audit et plan

Date : 12 octobre 2026. Statut : **plan à valider** (aucun code modifié pour ce chantier).
Agents mobilisés : architecte, Laravel, Quasar, UX/UI et motion, sécurité, QA, documentation, et **Agent 10 — médias, images et performances Web**.

Principe : s’inspirer de la clarté de Google Play (navigation, rangées d’applications, fiches) en gardant l’identité PWA Store — bleu `#075BFF`, cyan `#08C8F8`, orange `#FF9416`, bleu nuit `#08132D`, fond `#F6F9FF`, Inter et Inter Tight (tous déjà en place dans `src/css/quasar.variables.scss` et `src/css/theme.scss`).

---

## 1. Audit

### Ce qui existe et sera réutilisé

| Élément               | Où                                                                                                         | État                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Accueil               | `src/pages/store/StoreCatalogPage.vue` alimenté par `GET /home`                                            | Sections réelles : à la une, populaires, nouveautés, sélections, récemment mises à jour, catégories |
| Listes                | `AppListPage.vue` (`/popular`, `/trending`, `/recommended`), `AppCollectionPage.vue`, `CategoriesPage.vue` | Filtres côté serveur (`GET /apps?filter=…&sort_by=…`)                                               |
| Carte compacte        | `AppCard.vue` + `utils/appCard.js` (aucune note inventée), `AppGrid.vue` (squelettes, cascade)             | À conserver                                                                                         |
| Fiche                 | `AppDetailsPage.vue`                                                                                       | Captures, description, avis, lancement réel ; chargement par spinner                                |
| Motion                | `src/motion/signature.js`, `.motion-cascade`, `useHeroIntro`, `prefers-reduced-motion` respecté            | À conserver                                                                                         |
| Médias backend        | `ApplicationMedia` (captures + icône téléversée), route `/api/media/{dossier}/{fichier}` avec `nosniff`    | Pas de couverture, pas de variantes, anciens fichiers jamais supprimés                              |
| Bibliothèque d’images | PHP GD 2.3 avec JPEG, PNG, **WebP et AVIF**, EXIF                                                          | Suffisant : aucune dépendance à ajouter                                                             |

### Écarts

1. **Aucune image de couverture** (ni colonne, ni validation, ni affichage).
2. Navigation : pas de « Découvrir » ni de « Classements » ; « Catégories » est une ancre de l’accueil, pas la page `/categories` ; « Apps » mène aux populaires.
3. **Données fictives** : `trendingQueries` (« Retro Games », « Taskify »…) affichées comme « Recherches populaires » dans `MainLayout.vue`.
4. La carte « À la une » utilise une couleur, pas une image.
5. La fiche se charge avec un spinner (pas de squelette) et n’affiche ni données collectées, ni contact, ni langues de façon structurée.
6. **Fuite de champs** : `GET /apps` renvoie le modèle complet (`trust_score`, `moderation_reason`, `external_report`…). Corrigé dans ce chantier par une sortie publique dédiée.
7. Les captures retirées restent sur le disque.

---

## 2. Image de couverture

### Règles (vérifiées par Laravel, jamais par l’extension seule)

| Contrôle         | Règle                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Type réel        | JPEG, PNG ou WebP, détecté sur le contenu (`finfo`) et confirmé par le décodage GD                            |
| Dimensions       | Minimum 1280 × 720, recommandé 1920 × 1080, **format 16:9** (tolérance de 2 %)                                |
| Poids            | 3 Mo maximum                                                                                                  |
| Sécurité mémoire | Refus au-delà de 40 mégapixels avant décodage ; fichier illisible ou tronqué refusé                           |
| Contenu          | Réencodage complet : métadonnées (EXIF, GPS) supprimées, orientation corrigée, aucun octet d’origine conservé |

### Traitement

- Variantes générées : **640, 1280 et 1920 px** de large, en **WebP** (et **AVIF** si le serveur le permet), plus un **JPEG** de repli.
- Stockage sur le disque configuré, dans un dossier propre à chaque envoi (`covers/{identifiant}/…`), jamais dans MySQL.
- La fiche garde la référence : `cover` = `{ variantes, largeur, hauteur, couleur dominante }`. La couleur dominante sert de fond pendant le chargement, ce qui évite les sauts de mise en page.
- **Aucun fichier n’est écrasé** : un remplacement crée un nouveau dossier. L’ancien n’est supprimé que lorsqu’il n’est plus référencé ni par la fiche publiée, ni par des modifications en attente, ni par une demande de publication (dont l’instantané le cite). Une tâche planifiée nettoie ensuite les fichiers orphelins de plus de 30 jours. Le même nettoyage s’applique aux captures et icônes.

### Place dans le workflow

- `cover` rejoint les **champs de fiche** : brouillon possible sans couverture, **soumission refusée sans couverture** (« Ajoutez une image de couverture pour continuer. »).
- Sur une application publiée, une nouvelle couverture reste **en attente** et n’apparaît qu’après validation (comme tous les autres champs).
- Figée dans l’instantané de la demande ; l’administrateur la voit dans le dossier et peut demander sa correction. **Aucune étape de validation séparée** pour l’image.

### Formulaire développeur (onglet Images)

Texte : « Ajoutez une image qui présente votre application. Elle sera utilisée dans le catalogue et sur sa fiche. » Zone de glisser-déposer, sélection de fichier, contrôle immédiat dans le navigateur (dimensions, poids, format) puis contrôle serveur, barre de progression, aperçu **ordinateur et mobile** (recadrages tels qu’affichés), remplacement et suppression avant soumission, messages simples :

- « Votre image est trop petite. Utilisez au moins 1280 × 720 pixels. »
- « La taille maximale autorisée est de 3 Mo. »
- « Utilisez une image au format paysage 16:9. »
- « Ce fichier n’est pas une image JPG, PNG ou WebP valide. »

---

## 3. Refonte publique

### Navigation (en-tête, menu latéral, barre mobile)

**Découvrir** (accueil) · **Applications** (tout le catalogue, filtres) · **Catégories** (`/categories`) · **Classements** (nouvelle page). Les entrées actuelles sont adaptées, pas dupliquées. Les recherches populaires fictives sont supprimées ; la recherche garde l’historique local et les suggestions réelles.

### Accueil « Découvrir »

1. **À la une** : carrousel de cartes avec couverture (applications mises en avant par l’administration ; à défaut, les plus récentes).
2. **Tendances**, **Nouveautés**, **Recommandées** : rangées horizontales défilantes (accrochage au défilement, flèches au clavier et à la souris).
3. **Catégories populaires** : tuiles.
4. **À découvrir** : grille.

Données réelles de `/home` uniquement ; une section vide est masquée ou remplacée par un état vide soigné. Aucune note, aucun téléchargement inventé.

### Cartes

- **Compacte** (existante) : icône, nom, catégorie, note seulement si des avis existent, badge d’hébergement.
- **Mise en avant** (nouvelle) : couverture 16:9, icône en surimpression, nom, description courte, catégorie, bouton « Découvrir ».

### Classements

Page `/rankings`, quatre onglets calculés sur des données réelles : **Populaires** (installations et note), **Tendances** (installations des 7 derniers jours), **Nouveautés** (date de publication), **Mieux notées** (au moins 3 avis). Rang affiché (1, 2, 3…).

### Fiche d’application

Couverture en bandeau, icône, nom, éditeur, catégorie, badge d’hébergement, bouton **Ouvrir** (ou **Installer** selon les capacités réelles du navigateur), captures en carrousel, description, bloc « Informations » (version, langues, pays, données collectées, contact, confidentialité), avis, applications similaires. Squelettes au chargement.

### Motion

Apparition progressive des rangées (cascade existante), survol des cartes (soulèvement de l’icône), défilement horizontal fluide, squelettes. Uniquement `transform` et `opacity` ; tout est désactivé avec `prefers-reduced-motion`.

### Performances

Images en `srcset` / `sizes` (le navigateur choisit 640, 1280 ou 1920), `<picture>` avec AVIF → WebP → JPEG, `loading="lazy"` hors écran, `fetchpriority="high"` pour la première couverture à la une, dimensions et couleur de fond réservées (aucun décalage de mise en page). Objectif : LCP < 2,5 s et CLS < 0,1 sur mobile.

---

## 4. Administration

Le dossier de validation affiche la couverture (et l’avant / après lors d’une mise à jour) avec l’icône, les captures, la fiche, la version, le rapport technique, les domaines externes et la sécurité. Une seule décision pour la première publication, comme aujourd’hui.

---

## 5. Plan

| Étape | Contenu                                                                                                                                                                                                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Backend : colonne `cover` (migration additive), service `CoverImage` (contrôles, réencodage, variantes), exigence de soumission, sortie publique sans champs internes, nettoyage planifié des médias orphelins                                                                                                                                   |
| 2     | Front développeur : téléverseur de couverture avec aperçu ordinateur / mobile                                                                                                                                                                                                                                                                    |
| 3     | Composants publics : carte mise en avant, rangée horizontale, image responsive, squelettes                                                                                                                                                                                                                                                       |
| 4     | Navigation, accueil « Découvrir », page Classements, fiche d’application                                                                                                                                                                                                                                                                         |
| 5     | Dossier admin : couverture et comparaison                                                                                                                                                                                                                                                                                                        |
| 6     | Traductions FR/EN de tous les écrans touchés                                                                                                                                                                                                                                                                                                     |
| 7     | Tests : brouillon sans couverture, soumission refusée, JPEG / PNG / WebP valides, > 3 Mo, < 1280 × 720, mauvais ratio, fichier corrompu, fausse extension, remplacement et échec de remplacement, variantes, affichage catalogue et fiche, mobile, validation admin, couverture approuvée conservée, modification d’une app publiée, traductions |
| 8     | Documentation (document maître, guides développeur FR/EN)                                                                                                                                                                                                                                                                                        |

## 6. Décisions à valider

Voir le message de présentation : couverture des applications déjà publiées, critères des classements, contenu du carrousel « À la une ».
