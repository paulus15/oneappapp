# PWA Store — Journal des modifications

Les entrées les plus récentes sont en haut. Détails techniques et vérifications : journal de [PWASTORE_ROADMAP.md](PWASTORE_ROADMAP.md#journal).

## 2026-10-12

### Publication

- **Demandes de publication** (`publication_requests`) : le développeur soumet un dossier figé (fiche, source, empreinte de la version, résultat de l’analyse, statut du développeur). Une seule demande ouverte par application ; fiche et version verrouillées pendant l’examen ; retrait possible par le développeur. Deux types : première publication et mise à jour.
- **Espace unique par application** `/developer/apps/:id` : onglets Informations, Images, Confidentialité, Version, Récapitulatif, Suivi ; création simplifiée `/developer/apps/create` (nom, catégorie, ZIP ou lien) ; aide « Comment ça marche ? ». Les anciennes pages de création, d’édition et de publication sont remplacées.
- **File et dossier administrateur** `/admin/requests` et `/admin/requests/:id` : trois décisions (approuver, demander une correction, refuser), motif facultatif pour approuver et obligatoire sinon, notes internes, historique. L’administrateur n’agit plus à la place du développeur.
- **L’approbation publie immédiatement** l’application et sa version. Pour un build, la mise en ligne déploie automatiquement la version approuvée ; si elle échoue, le développeur peut publier lui-même.
- **Applications en ligne** : les modifications de fiche (captures comprises) et les nouvelles versions passent par une demande de mise à jour ; l’application et l’ancienne version restent en ligne jusqu’à l’approbation.
- **Informations obligatoires** avant soumission : catégorie, description courte, description ≥ 30 caractères, icône, au moins une capture, une langue, lien officiel de la PWA, e-mail de contact, politique de confidentialité, données collectées. **Icône par dépôt de fichier** (carrée, ≥ 192 px, ≤ 1 Mo). Contrôle de l’URL relancé automatiquement à la soumission.
- **Badge d’hébergement** « Hébergée par PWA Store » / « Hébergée par l’éditeur », avec infobulle, sur les cartes et les fiches.
- **Revue de la quarantaine** : les fonctions sensibles détectées sont affichées dans le dossier ; l’approbation d’un build en quarantaine exige une reconnaissance explicite.
- **Composant de dépôt unique** (`BuildUploader`) avec option de génération du manifeste et du service worker manquants.

### Hébergement des builds

- **CSP de compatibilité** sur les origines isolées : tout HTTPS/WSS, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`, `'unsafe-eval'` uniquement après reconnaissance. Remplace la liste blanche issue de l’analyse, qui bloquait des applications réelles.
- **Mise en ligne automatique** de la dernière version approuvée à la publication. Mode local documenté (Valet, `oneapp-pwa.test`).

### Ressources externes

- **Détection automatique** des ressources externes dans les builds (scripts, styles, polices, API, WebSockets…) avec classification, niveau de risque, comparaison entre versions et observations de l’administrateur. **Suppression de la déclaration manuelle des domaines.**
- Corrections après essai sur un vrai build (espaces de noms XML, fragments d’expressions régulières, noms de documentation).

### Langues

- **Sélecteur français / anglais** dans tous les layouts (vue-i18n), en-tête `Accept-Language` vers l’API, messages de soumission traduits côté Laravel. Traduits à ce jour : parcours de publication, navigation, statuts. Le reste de l’interface est **en cours** de traduction. Colonne `users.locale` créée, pas encore utilisée pour les e-mails.

### Interface

- **Signature de mouvement** : introduction unique de l’accueil, apparition en cascade des grilles, compteurs animés, micro-interactions (favori, cloche, thème, publication), `prefers-reduced-motion` respecté ([PWASTORE_MOTION.md](PWASTORE_MOTION.md)).

### Documentation

- Document maître [PWASTORE_DOCUMENTATION.md](PWASTORE_DOCUMENTATION.md), guides utilisateur et développeur (FR/EN), ce journal.
- Audit et conception du processus de publication ([audit](PWASTORE_PUBLICATION_AUDIT.md), [processus](PWASTORE_PUBLICATION_WORKFLOW.md)).
- Anciens documents d’audit déplacés dans [`docs/archive/`](archive/) et renommés « PWA Store ». Règles de publication et aide mises à jour.
- Plans à valider : [refonte du Store](PWASTORE_STORE_REDESIGN_PLAN.md), [distribution par pays](PWASTORE_GEO_DISTRIBUTION_PLAN.md).

### Lots précédents (12 octobre 2026)

- **Lot 12** : tests de bout en bout Playwright sur l’API réelle, tests backend sous MySQL, en-têtes de sécurité, CORS configurable, CSP construite au build, correction de l’envoi de fichiers, vitrine Blade remplacée par des redirections, guide de déploiement.
- **Lot 11** : polices Inter et Inter Tight auto-hébergées, transitions de page, corrections visuelles.
- **Lot 9** : PWA Lab (analyse statique d’une URL, score et verdict d’installation, historique).
- **Lot 10** : notifications in-app et e-mail, préférences, résumé quotidien des avis, paramètres administrateur (quotas, devise, contribution ; paiements désactivés).
- **Lot 8** : vues de fiche dédupliquées, statistiques développeur, boîte « Avis et retours ».
- **Lot 7** : avis paginés, réponses de l’éditeur, signalements, modération, préférences, export des données.
- **Lot 4** : historique des contrôles d’URL, surveillance toutes les 6 h avec suspension automatique, exigences de soumission explicites.
- **Lot 3** : accueil alimenté par l’API, catégories, sélections éditoriales, éditeur public, formulaire de contact, pages statiques, données inventées retirées.
- **Lot 2** : page `/developers`, filtres de la revue des profils.
- **Lot 6** : machine à états des applications, publication séparée de l’approbation, archivage, permissions administrateur granulaires, journal d’audit, back-office.
- **Lot 1** : mot de passe oublié, changement de mot de passe, sessions, verrou par compte, statut de compte, désactivation et anonymisation.
- **Lot 5** : indication de disponibilité de l’hébergement des builds, tests d’archives malveillantes, guide d’hébergement isolé.

## 2026-10-11

- **Lot 0** : visibilité publique réservée aux éditeurs vérifiés, envoi push simulé désactivé, analytics restreints et dédupliqués, avis limités, catégorie utilisée protégée, pagination admin, Vitest.
- Pays à l’inscription, confirmation de l’e-mail par code, double authentification par e-mail, tableau de bord développeur, pièce d’identité obligatoire.
- Audit, architecture, contrat d’API, plan de tests et roadmap.
