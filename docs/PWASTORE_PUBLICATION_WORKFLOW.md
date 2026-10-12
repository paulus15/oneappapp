# Processus de publication — conception cible et plan

Statut : **validé et implémenté** (12 octobre 2026). Décisions : §7. Les écarts entre cette conception et la réalisation sont signalés dans la note « État : implémenté ».
Diagnostic de départ : [PWASTORE_PUBLICATION_AUDIT.md](PWASTORE_PUBLICATION_AUDIT.md).

> Le développeur prépare → PWA Store analyse → le développeur soumet → l’administrateur décide → PWA Store publie.

Principes :

- **On réutilise** le cycle de vie, l’analyseur, la détection des ressources, le déploiement isolé et les notifications existants.
- **Migrations additives uniquement** (nouvelles tables et colonnes) ; aucune donnée supprimée, aucun statut existant renommé en base.
- **L’administrateur contrôle, il ne saisit pas.**
- **Le dossier examiné est figé** : ce que l’admin approuve est exactement ce qui sera publié.

---

## 1. La notion centrale : la demande de publication (« dossier »)

Nouvelle table `publication_requests` (additive) :

| Colonne                                                | Rôle                                                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `application_id`, `app_version_id` (null)              | Ce qui est soumis                                                                                           |
| `kind`                                                 | `initial` (première publication), `version` (nouvelle version), `listing` (modification de fiche publiée)   |
| `status`                                               | `pending`, `in_review`, `approved`, `changes_requested`, `rejected`, `withdrawn`                            |
| `snapshot` (JSON)                                      | Fiche complète, médias, source (URL ou hash du ZIP), résumé de l’analyse, ressources externes, contrôle URL |
| `checks` (JSON)                                        | Résultat des vérifications automatiques au moment de la soumission                                          |
| `submitted_by`, `submitted_at`                         | Développeur                                                                                                 |
| `reviewer_id`, `decided_at`, `reason`, `internal_note` | Décision                                                                                                    |

Règles :

- **Une seule demande ouverte par application** (contrainte + verrou) : pas de double soumission.
- Pendant une demande ouverte, la fiche et la version soumises sont **verrouillées** (409). Le développeur peut **retirer** sa demande pour modifier.
- À l’approbation, on vérifie que le hash du ZIP et la fiche n’ont pas changé depuis l’instantané (P2).
- `publication_events` et le journal d’audit restent la trace détaillée ; la demande y est référencée.

---

## 2. Parcours développeur cible

Un seul espace par application, **`/developer/apps/:id`**, avec une barre de progression commune :

| Étape                  | Contenu                                                                                                                                                                                                                                   | Enregistrement                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **1. Informations**    | Nom, description courte et longue, catégorie, langues, pays, e-mail de contact, site, assistance                                                                                                                                          | Brouillon créé dès la première sauvegarde, puis enregistrement automatique |
| **2. Médias**          | Icône (**dépôt de fichier**), captures mobile et tablette                                                                                                                                                                                 | Immédiat                                                                   |
| **3. Confidentialité** | URL de politique, données collectées (catégories simples : aucune, compte, localisation, paiement, analytics…), conditions d’utilisation                                                                                                  | Immédiat                                                                   |
| **4. Version**         | Choix **URL** ou **ZIP** à cet endroit uniquement. URL : contrôle automatique. ZIP : **un seul composant de dépôt** (remplace les trois actuels), numéro de version, notes ; analyse automatique, résultats et domaines détectés affichés | Version brouillon                                                          |
| **5. Récapitulatif**   | Tout le dossier sur une page : fiche telle que publiée, médias, méthode, version, résultats des contrôles, domaines externes, points à corriger avec un lien vers l’étape concernée                                                       | —                                                                          |
| **6. Soumettre**       | Bouton unique **« Soumettre à validation »**, actif seulement si le dossier est complet. Option : _« Publier automatiquement dès l’approbation »_                                                                                         | Création de la demande + instantané                                        |
| **Suivi**              | Statut de la demande, motif de l’admin mis en avant (« Ce qu’il faut corriger »), observations sur les ressources, historique des décisions, bouton « Retirer ma demande »                                                                | —                                                                          |

Conditions de soumission vérifiées par Laravel (et affichées au récapitulatif) :

- Profil développeur vérifié (inchangé).
- Fiche : catégorie, description ≥ 30 caractères, icône, **au moins une capture**, **e-mail de contact**, **politique de confidentialité**, au moins une langue.
- Source : version ZIP analysée (`passed` ou `quarantined`), ou URL contrôlée — le contrôle est **relancé automatiquement à la soumission** (A6).
- Numéro de version unique pour l’application.

Après la soumission :

- **Correction demandée** → le dossier redevient modifiable, le développeur corrige et soumet à nouveau (nouvelle demande, historique conservé).
- **Refus** → motif conservé ; le développeur peut corriger et soumettre une nouvelle demande.
- **Approuvée** → publication automatique si l’option était cochée, sinon bouton « Publier » (comportement actuel).

**App déjà publiée** :

- **Nouvelle version** : dépôt, analyse, soumission d’une demande `version`. L’ancienne version reste en ligne pendant l’examen. À l’approbation, bascule automatique (ou manuelle selon l’option).
- **Modification de fiche** : enregistrée comme **modifications en attente** ; la fiche publique et l’app **restent en ligne** (corrige C1). Soumission d’une demande `listing` ; à l’approbation, les modifications remplacent la fiche publique. Changements mineurs (captures) : appliqués sans revue, comme aujourd’hui.

Les pages actuelles sont regroupées : `CreateAppPage` + `EditAppPage` + `PublicationPage` deviennent l’espace unique ; la console liste les apps avec leur prochaine action.

---

## 3. Parcours administrateur cible

- **File d’attente** `/admin/requests` : toutes les demandes ouvertes (`pending` + `in_review`), première, version et fiche confondues, **de la plus ancienne à la plus récente**, avec le type, le développeur, l’ancienneté et les alertes (quarantaine, domaines à risque élevé). Les compteurs du tableau de bord pointent vers cette file (A8).
- **Dossier** `/admin/requests/:id` : **un seul écran**, construit à partir de l’instantané :
  - Développeur : identité, statut de vérification, autres apps.
  - Fiche telle qu’elle sera publiée, médias, confidentialité, contact ; pour une demande `listing`, **comparaison avant / après**.
  - Version : méthode, numéro, notes, résultat complet de l’analyse (erreurs, avertissements, fonctions sensibles), ressources externes avec comparaison, contrôle URL.
  - Historique des demandes et décisions, notes internes.
- **Trois décisions**, en bas du dossier :
  - **Approuver** : une seule action approuve l’app **et** sa version dans une transaction, après vérification des conditions (profil vérifié, hash inchangé, corrections de ressources traitées, fonctions sensibles reconnues par une case à cocher si quarantaine). Motif facultatif.
  - **Demander une correction** : motif obligatoire, éventuellement par rubrique (fiche, médias, version, ressources).
  - **Refuser** : motif obligatoire.
- La **suspension** et l’**archivage** restent disponibles sur les apps publiées (inchangé).
- **L’administrateur n’agit plus à la place du développeur** (C3) : il ne modifie plus la fiche, ne dépose plus de build, ne soumet ni ne publie pour lui. Il garde les actions de catalogue (mise en avant, score de confiance), la suspension et l’archivage.

---

## 4. Statuts

### Application (`applications.status`, inchangé en base)

`draft` → `submitted` → `in_review` → `approved` → `published`, avec `changes_requested`, `rejected`, `suspended`, `archived`. Ce qui change :

- Une app publiée **reste** `published` pendant l’examen d’une nouvelle version ou d’une modification de fiche (la demande porte l’examen).
- `suspended` → le développeur peut corriger et soumettre une demande (S3), en plus du réexamen par l’admin.

### Version (statut calculé `lifecycle`, sans renommer les colonnes existantes)

| Statut affiché          | Condition                                                   |
| ----------------------- | ----------------------------------------------------------- |
| Brouillon               | Déposée, non soumise                                        |
| Analyse en cours        | `scan_status = pending`                                     |
| Corrections nécessaires | Analyse refusée (aujourd’hui refus immédiat à l’envoi)      |
| Prête à soumettre       | Analysée (`passed` / `quarantined`), aucune demande ouverte |
| Soumise / En examen     | Demande ouverte `pending` / `in_review`                     |
| Approuvée               | `moderation_status = approved`, pas encore en ligne         |
| Refusée                 | `moderation_status = rejected`                              |
| Déployée                | `status = active` avec `runtime_path`                       |

Règles conservées : **une version non approuvée n’est jamais servie** ; l’ancienne version reste en ligne jusqu’à la bascule.

---

## 5. Documentation et traductions

- **Document maître** `docs/PWASTORE_DOCUMENTATION.md` (27 rubriques demandées, renvois vers les documents techniques existants).
- **Guides** : `PWASTORE_USER_GUIDE_FR/EN.md`, `PWASTORE_DEVELOPER_GUIDE_FR/EN.md`, `PWASTORE_CHANGELOG.md`. Contenus publics repris dans le centre d’aide du site, en français et en anglais.
- **Archivage** des documents obsolètes (`docs/project-audit/00–06`) dans `docs/archive/` (déplacement, aucune suppression) ; mise à jour de B/docs/pwa-distribution.md et B/README.md ; correction des règles de publication.
- **Traduction de toute l’interface**, par vagues :
  1. Parcours de publication (développeur et admin), refaits dans le cadre de ce chantier.
  2. Pages publiques (accueil, catalogue, fiche d’app, pages statiques).
  3. Compte, authentification, espace développeur restant, back-office restant.
- Utilitaire commun de formatage des dates et nombres selon la langue (remplace les 24 `fr-FR` figés).
- **Langue enregistrée sur le compte** (`users.locale`, additive) ; e-mails et notifications envoyés dans la langue du destinataire (gabarits fr/en).
- **Contrôles automatiques** : test de parité des clés fr/en, détection des textes codés en dur dans les fichiers déjà migrés.

---

## 6. Plan de travail

| Phase | Contenu                                                                                                                                                                                           | Tests                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 5a    | Backend : table `publication_requests`, instantané, verrouillage, retrait, approbation conjointe app + version, contrôle URL à la soumission, modifications de fiche en attente, garde-fous admin | Feature : soumission, double soumission, verrou, retrait, approbation conjointe, hash modifié, correction, refus, resoumission |
| 5b    | Backend : champs `contact_email`, `privacy` (JSON), unicité de version, `users.locale`, exigences de soumission, API de la file et du dossier                                                     | Feature : validations, accès non autorisés                                                                                     |
| 6a    | Front développeur : espace unique par app, composant de dépôt unique, récapitulatif, suivi et corrections, nouvelle version — entièrement traduits                                                | Unitaires + e2e                                                                                                                |
| 6b    | Front admin : file d’attente, écran dossier, trois décisions — entièrement traduits                                                                                                               | e2e                                                                                                                            |
| 7     | Intégration analyses / modération / publication automatique optionnelle ; notifications fr/en                                                                                                     | e2e parcours 1 à 16                                                                                                            |
| 8     | Vérification sécurité, non-régression complète (Laravel SQLite + MySQL, unitaires, e2e)                                                                                                           | Suite complète                                                                                                                 |
| 9     | Documentation maître, guides FR/EN, changelog, archivage ; traductions vagues 2 et 3                                                                                                              | Test de parité des clés                                                                                                        |

Scénarios de bout en bout visés : les 16 parcours de la mission (brouillon, médias, version URL, version ZIP, domaines, analyse, soumission, réception admin, approbation conjointe, publication, refus, correction, nouvelle soumission, nouvelle version, maintien de l’ancienne version, accès non autorisés).

Données existantes : les apps déjà `submitted` / `in_review` reçoivent une demande reconstituée à partir de leur état actuel (migration de données additive, réversible).

---

## 7. Décisions validées (12 octobre 2026)

| #   | Sujet                         | Décision du porteur de projet                                                                                                                                                                                         |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Administrateur non opérateur  | **Oui.** L’administrateur ne modifie plus la fiche, ne dépose rien, ne soumet ni ne publie à la place du développeur. Toute modification doit être soumise à l’administrateur avant d’être visible.                   |
| 2   | Fiche d’une app publiée       | L’application **reste en ligne** pendant l’examen des modifications (fiche, captures comprises, ou nouvelle version).                                                                                                 |
| 3   | Exigences de soumission       | **Toutes les informations sont obligatoires**, y compris le lien officiel de la PWA. Le développeur choisit ZIP ou lien ; un badge avec infobulle distingue « Hébergée par PWA Store » et « Hébergée par l’éditeur ». |
| 4   | Publication après approbation | L’approbation **publie immédiatement**, sans option.                                                                                                                                                                  |
| 5   | Motif                         | Facultatif pour approuver, obligatoire pour une demande de correction ou un refus.                                                                                                                                    |
| 6   | Anciens documents             | Archivés dans `docs/archive/`, renommés « PWA Store » (le produit s’est toujours appelé PWA Store).                                                                                                                   |

### État : implémenté

Différences avec la conception ci-dessus, à la suite des décisions :

- Deux types de demande seulement : `initial` (première publication) et `update` (modification de fiche et/ou nouvelle version d’une app en ligne), au lieu de `version` et `listing` séparés.
- Pas d’option « Publier automatiquement » : l’approbation publie. Si la mise en ligne échoue (hébergement des builds indisponible), l’app reste approuvée et le développeur la publie depuis son espace (« Publier maintenant »).
- Toute modification de fiche, captures comprises, passe par une demande ; plus d’application directe des changements mineurs.
- Le contrôle de l’URL est relancé à la soumission, sauf si un contrôle réussi date de moins d’une heure.

Fichiers principaux :

- Backend : `app/Services/PublicationWorkflow.php`, `app/Http/Controllers/Api/PublicationRequestController.php`, `app/Models/PublicationRequest.php`, migration `database/migrations/2026_10_12_000010_create_publication_requests.php` (table `publication_requests`, `applications.pending_changes`, `contact_email`, `privacy`, `users.locale`).
- Frontend : `src/pages/developer/AppWorkspacePage.vue`, `src/pages/developer/NewAppPage.vue`, `src/pages/admin/AdminRequestsPage.vue`, `src/pages/admin/AdminRequestPage.vue`, `src/components/HostingBadge.vue`, `src/components/BuildUploader.vue`.

Tests : `tests/Feature/PublicationRequestTest.php`, `QuarantineReviewTest.php`, `RequestLocaleTest.php`, `PublicationWorkflowTest.php`, `ExternalResourcesTest.php` (134 tests Laravel au total), 26 tests unitaires et 13 scénarios de bout en bout (`test/e2e/journey.spec.mjs`, `access.spec.mjs`, `external-resources.spec.mjs`).
