> Document historique (archivé le 12 octobre 2026). Référence actuelle : [PWASTORE_DOCUMENTATION.md](../PWASTORE_DOCUMENTATION.md).

# PWA Store — UX/UI et système de design observé

> Audit du code accessible au 10 octobre 2026. **EXISTANT** : mécanisme constaté dans le code ; cela ne vaut pas recette en production. **PARTIEL** : chaîne incomplète ou incohérente. **ABSENT** : aucun mécanisme trouvé dans le périmètre examiné. **RECOMMANDÉ** : évolution proposée, non réalisée. **NON VÉRIFIÉ** : état inaccessible ou non testé.
>
> Références : **F:** = `/Users/apple/Documents/Quasar Projects/oneappapp/` ; **B:** = `/Users/apple/LaravelProjects/oneapp/`. Les chemins sont relatifs à ces racines. `Api/…Controller` désigne `B:app/Http/Controllers/Api/…Controller.php`. Le produit s’appelle **PWA Store** (nom affiché par le frontend) et la vitrine Laravel **OneApp**. Aucun projet Android Trusted Web Activity n'a été identifié.

## Périmètre et identité

**EXISTANT.** Quasar affiche PWA Store, avec logo horizontal et icône de sac bleue dans `public/brand` et `public/icons`. Blade conserve OneApp, un accent violet et un autre jeu d’assets. **NON VÉRIFIÉ.** Rendu effectif de toutes les pages et de tous les appareils pendant cet audit ; cette analyse repose sur templates, composants et CSS. Elle ne certifie ni contraste ni conformité d’accessibilité.

**RECOMMANDÉ.** Choisir l’interface et la marque de référence avant toute consolidation. Conserver les composants et styles utiles existants ; ne pas redessiner arbitrairement les écrans. Les fichiers d’images fournis lors du rebranding ne prouvent pas à eux seuls leur présence dans la vitrine Laravel.

## Couleurs et thèmes Quasar — EXISTANT

Sources : F:src/css/theme.scss, quasar.variables.scss, app.scss.

| Token / usage      | Clair                 | Sombre si différent |
| ------------------ | --------------------- | ------------------- |
| Primaire / liens   | `#075BFF`             | lien `#87B5FF`      |
| Secondaire         | `#08C8F8`             | Identique           |
| Accent             | `#FF9416`             | Identique           |
| Fond               | `#F6F9FF`             | `#08132D`           |
| Surface            | `#FFFFFF`             | `#142343`           |
| Texte principal    | `#08132D`             | `#F8FAFF`           |
| Texte secondaire   | `#64748B`             | `#AABBD7`           |
| Bordure            | `#DDE5F2`             | `#2D4163`           |
| Primaire atténué   | `#E8EFFF`             | `#18366B`           |
| Surface élevée     | `#EDF2FB`             | `#1C3053`           |
| Surface supérieure | `#E0E9F8`             | `#273D60`           |
| Positif / négatif  | `#16A34A` / `#EF4444` | Palette Quasar      |
| Avertissement      | `#F59E0B`             | Palette Quasar      |

Les alias `--page`, `--surface`, `--text`, `--muted`, `--outline`, `--primary` relient les styles aux tokens. Les variables sur body sont héritées par les menus et dialogues téléportés. Le thème utilise les modes clair, sombre et système via `src/composables/useTheme.js` et `src/boot/theme.js`, avec une clé historique `oneinstall-theme` et synchronisation de stockage. Ce nom technique ancien n’est pas une nouvelle marque visible.

Blade définit notamment `--brand:#5b5bd6`, `--brand-dark:#4444b8`, `--ink:#101828`, `--muted:#667085`, `--line:#e4e7ec`, `--soft:#f6f7fb` dans B:resources/css/app.css. Son `color-scheme: light` ne fournit pas un thème sombre équivalent à Quasar.

## Typographies, dimensions et mouvement

**EXISTANT — Quasar.** Inter Variable pour le texte, Inter Tight pour les titres selon app.scss ; fontes importées depuis les paquets locaux. Une dépendance Manrope demeure sans usage constaté dans le thème principal. Icônes Material Icons via Quasar ; logos de plateformes et assets de marque complémentaires.

| Token                 | Valeur constatée                 |
| --------------------- | -------------------------------- |
| Rayons xs/sm/md/lg    | 6 / 10 / 14 / 18 px              |
| Marge de page         | `clamp(12px, 2vw, 24px)`         |
| Intervalle de section | 16 px                            |
| Ombre petite          | `0 8px 24px rgba(24,24,27,.06)`  |
| Ombre moyenne         | `0 18px 48px rgba(24,24,27,.1)`  |
| Ombre grande          | `0 28px 80px rgba(24,24,27,.16)` |
| Courbe d’animation    | `cubic-bezier(.22,1,.36,1)`      |

D’autres valeurs locales restent dans les styles des pages : aucun catalogue exhaustif de taille de texte ou échelle d’espacement unique n’est déjà maintenu. Blade emploie Instrument Sans avec repli système et des espacements propres. **RECOMMANDÉ.** Consolider les valeurs répétées à partir de l’existant après inventaire visuel, sans imposer une nouvelle échelle sans besoin.

## Composants et comportements

| Élément                     | État observé / source                                    | Consolidation recommandée                                                                    |
| --------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| BrandLogo                   | EXISTANT, F:src/components/BrandLogo.vue                 | Garder variantes et texte alternatif cohérents                                               |
| AppIcon                     | EXISTANT, F:src/components/AppIcon.vue et utils/media.js | Confirmer résolution des URL, erreur image et CSP sur les origines retenues                  |
| Header et recherche         | EXISTANT, MainLayout                                     | États de requête, suggestions clavier, annulation des réponses obsolètes                     |
| Navigation développeur      | EXISTANT, DeveloperLayout                                | Distinguer liens actifs, inactifs et fonctions futures ; ne pas promettre des écrans absents |
| Boutons                     | QBtn, styles globaux et locaux                           | Unifier action primaire/secondaire/danger, attente et désactivation                          |
| Formulaires                 | QInput, QSelect, QFile, checkbox/toggle et assistant     | Associer libellé, aide, validation et erreurs API ; récapitulatif avant publication          |
| Cartes d’applications       | Répétées dans StoreCatalogPage et AppListPage            | Extraire seulement les comportements vraiment communs ; conserver variations utiles          |
| Dialogues                   | Quasar Dialog/QDialog et panneaux locaux                 | Focus initial, retour du focus et fermeture au clavier à recetter                            |
| Notifications               | Notify, messages intégrés et catches locaux              | Remplacer les erreurs silencieuses par une information actionnable                           |
| Notes/étoiles et badges     | Présents dans catalogue et fiche                         | Afficher « aucun avis » au lieu de transformer zéro en 5 ; expliciter provenance du score    |
| Guides d’installation Blade | Modales et HTML généré, resources/js/app.js              | Sécuriser interpolation et distinguer action manuelle/succès vérifié                         |

## Écrans et relation entre eux

**Accueil → listes → fiche.** Les blocs de découverte utilisent une même source d’applications mais affichent plusieurs angles éditoriaux. La présence de tailles fixes, d’applications de secours et de captures externes rend leur statut ambigu. **RECOMMANDÉ.** Remplacer les valeurs de démonstration par données réelles ou états d’absence explicites ; ne pas afficher une promesse de sandbox non démontrée.

**Connexion/inscription → espace.** AuthLayout isole les formulaires, mais la connexion revient à l’accueil et le lien utilisateur « Mon espace » mène à un espace de rôle différent. Le bouton de récupération et certaines actions de header n’ont pas d’effet. **RECOMMANDÉ.** Destinations selon rôle et retour vers l’action commencée.

**Console → création/édition.** La structure en étapes réduit la densité, les captures ont un aperçu local et les URL objet sont nettoyées. La validation cliente ne suffit pas à garantir la persistance serveur. **RECOMMANDÉ.** Statut explicite « fiche sauvegardée / version refusée », reprise sans perte et erreurs par étape.

**Admin → détail de modération.** Statuts, score et statistiques sont présentés, mais les contrats API cassés empêchent une expérience fiable. Ne pas entreprendre une refonte visuelle avant réparation des actions.

**Blade.** Catalogue, fiche, publication et bibliothèque forment un second ensemble avec connexion intégrée à certains parcours. Les mêmes concepts ne partagent ni session ni états UI avec Quasar.

## Chargement, vide, erreur et réussite

**EXISTANT.** Variables de chargement, indicateurs Quasar, messages de liste vide, notifications de formulaire et page 404. **PARTIEL.** Erreurs parfois limitées à console.error ; absence de pagination ; sauvegarde pouvant poursuivre après erreur ; guide d’installation donnant un succès déclaratif ; actions sans fonction dans menus/footer.

**RECOMMANDÉ — contrat d’état par écran.** Chaque liste distingue chargement, résultat vide, filtres sans résultat et indisponibilité serveur. Chaque mutation bloque les doublons pendant l’envoi, conserve la saisie sur erreur et ne confirme que les étapes réellement terminées. Les états de scan, approbation, publication et installation doivent rester distincts, avec libellés compréhensibles.

Sources : F:src/pages et layouts ; B:resources/js/app.js. Aucun taux de réussite utilisateur n’a été mesuré.

## Responsive et accessibilité

**EXISTANT.** Grilles responsive, classes Quasar et media queries locales, marges fluides ; adaptations de navigation et de densité selon écran. **NON VÉRIFIÉ.** Comportement complet à chaque largeur, reflow avec zoom, clavier mobile, lecteurs d’écran, taille tactile et contrastes réels. Les primitives accessibles d’un framework ne certifient pas leur assemblage.

**RECOMMANDÉ.** Recetter au minimum catalogue, fiche, auth, création et admin à largeur étroite et desktop ; zoom 200 %, navigation clavier seule, ordre de focus, fermeture des dialogues et annonces de chargement/erreur. Nommer les boutons uniquement iconographiques, relier les aides de champ, ne pas coder les statuts uniquement par couleur et vérifier les textes sur fonds dégradés. Vérifier également la réduction des animations selon la préférence utilisateur.

L’installation doit proposer une ouverture web utilisable lorsque le navigateur ne fournit pas d’installation native. Les instructions iOS doivent être adaptées au navigateur réel et n’affirmer que ce qui est confirmé.

## Plan de consolidation

**RECOMMANDÉ.** Réparer d’abord les données et contrats (A02–A05), puis les états et contenus (D01), la pagination (D02), l’accessibilité (D03) et la cohérence de marque après décision d’interface (A01/D04). Les composants existants constituent la base du design system ; la bibliothèque, la facturation ou les badges de vérification absents ne doivent pas apparaître comme composants fonctionnels déjà disponibles.

## Traduction UI des fonctionnalités Laravel

Le backend fournit des fonctions qui n’ont pas toutes une représentation Quasar. Cette correspondance complète le design system sans présenter des écrans proposés comme existants.

| Capacité serveur                                                       | UI constatée                                                          | Raccordement RECOMMANDÉ                                                                                                                          |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| BF04 — catégories et ordre/icône/couleur                               | Sélecteurs/listes utilisant la lecture ; gestion admin Quasar ABSENTE | Liste de gestion avec statut actif, édition et suppression confirmée ; expliquer que les fiches ne sont pas supprimées                           |
| BF07/BF08 — bibliothèque, appareils, archivage et dernières ouvertures | Bibliothèque Blade ; espace utilisateur Quasar ABSENT                 | Cartes basées sur les installations serveur, filtre d’archivage et indication de version ; distinguer masquer une entrée et désinstaller         |
| BF07 — mises à jour                                                    | API et lecture Blade PARTIELLES                                       | Montrer version installée/proposée et résultat de l’action après correction du calcul serveur                                                    |
| BF09 — intention de reprise                                            | Guides Blade et intention créée ; reprise complète ABSENTE            | État « action à reprendre », expiration et action déjà consommée ; jamais « installé » sur la seule création du token                            |
| BF05 — ZIP et analyse                                                  | Upload et versions présents                                           | Afficher réception, résultat d’analyse, approbation et publication comme états séparés ; réserver le téléchargement technique aux usages décidés |
| BF11 — statistiques                                                    | Présentation admin PARTIELLE, source API incorrecte                   | Utiliser les agrégats serveur ; afficher période non fournie comme limitation, pas inventer une courbe temporelle                                |
| BF10 — push                                                            | Aucun écran d’envoi Quasar identifié ; simulation serveur             | Ne pas afficher « livré » ; développer l’UI seulement avec un mode de simulation explicite ou une livraison réelle raccordée                     |

Sources : B:Api/CategoryController, InstallationController, InstallIntentController, AppVersionController, AnalyticsController, PushNotificationController ; F:src/pages/admin/AdminConsolePage.vue ; B:resources/views/apps/library.blade.php. Les améliorations de présentation ne suffisent pas à corriger les limites métier listées dans le PRD et le plan.

## Documents associés

[00](./00_PWA_STORE_AUDIT_SUMMARY.md) · [01](./01_PWA_STORE_PRD.md) · [02](./02_PWA_STORE_TRD.md) · [03](./03_PWA_STORE_APP_FLOW.md) · [04](./04_PWA_STORE_UX_UI.md) · [05](./05_PWA_STORE_BACKEND_SCHEMA.md) · [06](./06_PWA_STORE_IMPLEMENTATION_PLAN.md)
