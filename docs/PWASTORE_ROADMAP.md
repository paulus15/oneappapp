# PWA Store — Roadmap

Suivi des lots de développement. Références : `PWASTORE_AUDIT.md` (constats D1 à D13), `PWASTORE_ARCHITECTURE.md`, `PWASTORE_API_CONTRACT.md`, `PWASTORE_TEST_PLAN.md`.

**Statuts** : ⬜ à faire · 🟦 en cours · ✅ terminé et vérifié · ⏸ en attente de décision.
**Priorité** : P0 bloquant/sécurité · P1 parcours principal · P2 complément · P3 confort.

Un lot n'est ✅ que si ses critères d'acceptation sont vérifiés côté Laravel **et** Quasar, et si ses résultats de tests sont consignés dans son journal.

## Vue d'ensemble

| Lot | Thème                                    | Priorité | Dépend de         | Statut                                       |
| --- | ---------------------------------------- | -------- | ----------------- | -------------------------------------------- |
| 0   | Correctifs de sécurité et socle de tests | P0       | —                 | ✅                                           |
| 1   | Authentification et compte unique        | P0       | 0                 | ✅                                           |
| 2   | Activation et vérification développeur   | P1       | 1                 | ✅ (notifications au Lot 10)                 |
| 3   | Catalogue, accueil et fiches             | P1       | 0                 | ✅                                           |
| 4   | Soumission par URL                       | P1       | 2                 | ✅                                           |
| 5   | Builds et hébergement isolé              | P1       | 2, décision infra | 🟦 (domaine à fournir)                       |
| 6   | Administration, modération, statuts      | P0       | 1, 2              | ✅                                           |
| 7   | Espace utilisateur, avis, signalements   | P1       | 3, 6              | ✅                                           |
| 8   | Portail développeur et statistiques      | P2       | 6, 7              | ✅                                           |
| 9   | PWA Lab et surveillance                  | P2       | 4                 | ✅ (Lighthouse en attente d’infra)           |
| 10  | Notifications, quotas, facturation       | P2       | 6                 | ✅ (facturation reportée)                    |
| 11  | Motion design, performance, responsive   | P2       | 3                 | ✅ (LCP et découpage d’EditAppPage restants) |
| 12  | Tests finaux, sécurité, déploiement      | P0       | tous              | ✅ (revue juridique externe en attente)      |

Ordre d'exécution proposé : **0 → 1 → 6 → 2 → 3 → 4 → 7 → 8 → 10 → 9 → 5 → 11 → 12**.
Raisons : la machine à états et les permissions (Lot 6) conditionnent la visibilité, les avis, les statistiques et les notifications. Le Lot 5 dépend d'une décision d'infrastructure. Le motion design vient sur des écrans stabilisés.

---

## Lot 0 — Correctifs de sécurité et socle de tests (P0)

| Fonctionnalité                                                                          | Constat | Statut |
| --------------------------------------------------------------------------------------- | ------- | ------ |
| Désactiver l'envoi push simulé (410)                                                    | D1      | ✅     |
| Analytics : apps publiées seulement, throttle, déduplication                            | D2      | ✅     |
| Portée de visibilité publique unique (catalogue, fiche, launch, install-intents)        | D4      | ✅     |
| Avis : e-mail vérifié, 2000 car., throttle                                              | D5      | ✅     |
| Catégorie utilisée non supprimable                                                      | D7      | ✅     |
| Pagination `GET /admin/apps`                                                            | D8      | ✅     |
| Suppression du N+1 des notes                                                            | D9      | ✅     |
| Installer Vitest (Playwright au Lot 12), premiers tests du store `auth` et des gardes   | —       | ✅     |
| Reformater avec oxfmt les 3 fichiers signalés                                           | D12     | ✅     |
| Retrait du faux indicateur « Tous les services sont opérationnels » de la console admin | —       | ✅     |

**Critères d'acceptation**

- Un compte ne peut ni pousser vers un autre utilisateur, ni enregistrer d'événement sur une app non publiée ; 429 au-delà du seuil.
- Une app d'éditeur suspendu renvoie 404/absente sur les quatre routes publiques.
- Chaque correctif a un test qui échouait avant.
- `npm run test:unit` existe et passe.

## Lot 1 — Authentification et compte unique (P0)

Déjà livré : inscription avec pays, OTP e-mail, 2FA par e-mail, changement d'e-mail sécurisé, déconnexion.

| Fonctionnalité                                                                                | Statut |
| --------------------------------------------------------------------------------------------- | ------ |
| Mot de passe oublié + réinitialisation (backend + pages)                                      | ✅     |
| Changement de mot de passe                                                                    | ✅     |
| Expiration des jetons, liste et révocation des sessions                                       | ✅     |
| « Rester connecté » effectif (durée du jeton)                                                 | ✅     |
| Verrou par compte après échecs répétés                                                        | ✅     |
| Désactivation du compte (OTP), anonymisation à 30 jours                                       | ✅     |
| Statut de compte (`active`, `suspended`, `deactivated`) appliqué à la connexion et aux jetons | ✅     |

**Critères d'acceptation**

- La réponse de « mot de passe oublié » est identique qu'un e-mail existe ou non ; le lien expire en 60 min et ne sert qu'une fois ; toutes les sessions sont révoquées après réinitialisation.
- Un compte suspendu ou désactivé ne peut plus se connecter, et ses jetons sont invalides.
- Page « Sécurité du compte » : 2FA, mot de passe, sessions actives, sur mobile et desktop.

## Lot 2 — Activation et vérification développeur (P1)

Déjà livré : activation gratuite individuelle ou organisation, profil, 5 statuts, historique, justificatifs privés, pièce d'identité obligatoire, revue admin, blocage de publication motivé.

| Fonctionnalité                                                                                          | Statut                                        |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| CTA « Vous développez des applications ? Devenez développeur sur PWA Store » sur l'accueil et le compte | ✅ (existant, desktop/tablette)               |
| Page de présentation du portail développeur (`/developers`)                                             | ✅                                            |
| Notifications de décision                                                                               | ⬜ Lot 10                                     |
| Filtre par statut et recherche dans la revue admin (profils en attente en tête)                         | ✅                                            |
| Sort des 12 comptes `developer` historiques sans profil                                                 | ✅ apps masquées jusqu'à vérification (Lot 0) |

**Critères d'acceptation** : un visiteur comprend comment devenir développeur depuis l'accueil ; un développeur suit son statut et voit le motif de chaque décision.

## Lot 3 — Catalogue, accueil et fiches (P1)

| Fonctionnalité                                                                                                                                    | Statut |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Endpoint `/home` (mises en avant, nouveautés, populaires, mises à jour récentes, collections, catégories)                                         | ✅     |
| Accueil : retrait des catégories et arguments codés en dur                                                                                        | ✅     |
| Pages Catégories et « Applications d'une catégorie »                                                                                              | ✅     |
| Résultats de recherche, filtres, tri (sur l’accueil) ; pagination par catégorie                                                                   | ✅     |
| Fiche : éditeur public, langues, partage, apps similaires ; badge « Sécurité x/100 » retiré (signalement : Lot 7)                                 | ✅     |
| Profil public développeur                                                                                                                         | ✅     |
| Pages statiques : À propos, Devenir développeur, Aide, Contact, CGU, Confidentialité, Règles de publication (brouillons à valider par un juriste) | ✅     |
| Footer complet                                                                                                                                    | ✅     |

**Critères d'acceptation** : aucun contenu de catalogue n'est codé en dur ; une catégorie créée par l'admin apparaît sans redéploiement ; le bouton d'installation n'est affiché que si `beforeinstallprompt` est disponible ou si la plateforme le permet.

## Lot 4 — Soumission par URL (P1)

Déjà livré : choix de la source, contrôle anti-SSRF, rapport, soumission, contrôle quotidien et quarantaine sur changement.

| Fonctionnalité                                                                                                                               | Statut |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Historique des contrôles (`url_checks`) affiché au développeur et à l'admin                                                                  | ✅     |
| Parcours de publication en étapes sur la page de publication (fiche → source → aperçu → soumission), alimenté par `GET /apps/{id}/readiness` | ✅     |
| Aperçu de la fiche avant soumission                                                                                                          | ✅     |

**Critères d'acceptation** : le développeur voit chaque contrôle daté et ses résultats ; l'aperçu reflète exactement la fiche publique.

## Lot 5 — Builds et hébergement isolé (P1, ⏸)

Déjà livré : upload, analyse ZIP, versions, modération, déploiement, rollback, refus d'une origine partagée avec le Store.

| Fonctionnalité                                                                                                                           | Statut                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Configuration `PWA_RUNTIME_DOMAIN`, DNS et certificat wildcard, vhost                                                                    | ⏸ guide prêt (`docs/PWASTORE_BUILD_HOSTING.md`), domaine à fournir |
| Message clair quand l'hébergement n'est pas configuré (`GET /platform`, avertissement sur la page de publication)                        | ✅                                                                 |
| Tests d'archives malveillantes (lien symbolique, bombe de décompression, chemins absolus et Windows, exécutables, domaines non déclarés) | ✅                                                                 |
| Antivirus optionnel (ClamAV)                                                                                                             | ⏸                                                                  |

**Critères d'acceptation** : une version approuvée est servie sur `pwa-{id}.<domaine>`, sans accès aux cookies du Store ; le retour à une version antérieure approuvée fonctionne.

## Lot 6 — Administration, modération et statuts (P0)

| Fonctionnalité                                                                    | Statut |
| --------------------------------------------------------------------------------- | ------ |
| Machine à états des applications + migration des statuts (`ApplicationLifecycle`) | ✅     |
| Publication séparée de l'approbation ; archivage au lieu de la suppression        | ✅     |
| Permissions granulaires admin + Policies                                          | ✅     |
| Journal d'audit (`audit_logs`) et page de consultation                            | ✅     |
| Gestion des utilisateurs : liste, recherche, fiche, suspension motivée            | ✅     |
| File de modération filtrée et paginée, demande de correction                      | ✅     |
| Écran de gestion des catégories                                                   | ✅     |
| Mise en avant (collections éditoriales reportées au Lot 3)                        | ✅     |
| Tableau de bord admin (compteurs réels)                                           | ✅     |
| Historique de publication visible côté développeur et admin                       | ✅     |
| Confirmation des actions sensibles dans l'interface                               | ✅     |

**Critères d'acceptation** : toutes les transitions interdites renvoient 409 ; chaque action sensible écrit une ligne d'audit avec motif ; un admin sans permission reçoit 403 et ne voit pas l'écran.

## Lot 7 — Espace utilisateur, avis et signalements (P1)

| Fonctionnalité                                                                                   | Statut |
| ------------------------------------------------------------------------------------------------ | ------ |
| Espace personnel : onglets Mes avis, Préférences et données (en plus de bibliothèque et favoris) | ✅     |
| Avis paginés, modification, suppression, réponse développeur                                     | ✅     |
| Signalement d'une application ou d'un avis, traitement admin                                     | ✅     |
| « Mes avis »                                                                                     | ✅     |
| Préférences, « vus récemment » avec consentement                                                 | ✅     |
| Export des données personnelles                                                                  | ✅     |

**Critères d'acceptation** : un avis exige un compte vérifié et respecte les limites ; un avis masqué disparaît de la fiche et de la moyenne ; le signalement est traçable jusqu'à sa résolution.

## Lot 8 — Portail développeur et statistiques (P2)

| Fonctionnalité                                                                               | Statut |
| -------------------------------------------------------------------------------------------- | ------ |
| Tableau de bord développeur (existant) enrichi : vues, ouvertures, avis, signalements, notes | ✅     |
| Écrans : avis et retours, statistiques par application, paramètres                           | ✅     |
| Distinction claire vues / ouvertures / installations déclarées                               | ✅     |
| Graphiques                                                                                   | ✅     |

**Critères d'acceptation** : chaque chiffre affiché correspond à une requête vérifiable ; aucune valeur estimée n'est présentée comme mesurée.

## Lot 9 — PWA Lab et surveillance (P2)

| Fonctionnalité                                                                          | Statut           |
| --------------------------------------------------------------------------------------- | ---------------- |
| Analyse à la demande d'une URL (réutilise `ExternalPwaChecker`)                         | ✅               |
| Rapport : conformes, problèmes, recommandations ; historique                            | ✅               |
| Surveillance plus fréquente des apps URL publiées, alerte au développeur (Lots 4 et 10) | ✅               |
| Performance / accessibilité via Lighthouse                                              | ⏸ infra headless |

**Critères d'acceptation** : le rapport ne se présente jamais comme une certification de sécurité.

## Lot 10 — Notifications, quotas et facturation (P2)

| Fonctionnalité                                              | Statut                                                                                                                                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notifications Laravel `database` + `mail` en file d'attente | ✅                                                                                                                                                                          |
| Cloche, page Notifications, compteur non lu                 | ✅                                                                                                                                                                          |
| Préférences par type et canal                               | ✅                                                                                                                                                                          |
| Paramètres admin des quotas et de la devise                 | ✅                                                                                                                                                                          |
| Structure plans / factures                                  | ⏸ reportée : sans prestataire de paiement choisi, des tables vides n’apportent rien ; quotas, devise et contribution sont configurables et `payments_enabled` reste `false` |
| Intégration push réelle                                     | ⏸ fournisseur à choisir                                                                                                                                                     |

**Critères d'acceptation** : aucun paiement ne peut être déclenché ; chaque événement listé dans l'architecture émet sa notification et respecte les préférences.

## Lot 11 — Motion design, performance, responsive (P2)

| Fonctionnalité                                                                                                                            | Statut |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Inter et Inter Tight auto-hébergées (polices variables, sous-ensembles latins seuls en précache)                                          | ✅     |
| Hero et apparitions au défilement (GSAP + ScrollTrigger chargés à la demande, existant étendu), transitions de page, survol des cartes    | ✅     |
| Skeletons et états vides (grilles d’applications, listes)                                                                                 | ✅     |
| Découpage : `StoreCatalogPage` allégée (AppCard, AppGrid, AppFooter extraits) ; `EditAppPage` non découpée                                | 🟦     |
| Budget de performance : bundle initial mesuré (≈154 Ko JS principal, GSAP hors chemin critique) ; LCP non mesuré faute d’outil Lighthouse | 🟦     |

**Critères d'acceptation** : `prefers-reduced-motion` désactive toutes les animations non essentielles ; navigation complète au clavier ; aucune régression aux 3 largeurs de référence.

## Lot 12 — Tests finaux, sécurité, déploiement (P0)

| Fonctionnalité                                                                                                                 | Statut    |
| ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Parcours E2E complet et variantes négatives (Playwright, 11 scénarios)                                                         | ✅        |
| Revue sécurité : en-têtes, CSP générée au build, CORS configurable, historique Git sans secret, dépendances sans vulnérabilité | ✅        |
| Retrait de la vitrine Blade, redirection vers Quasar                                                                           | ✅        |
| Documentation de déploiement (`docs/PWASTORE_DEPLOYMENT.md`)                                                                   | ✅        |
| Revue juridique des contenus                                                                                                   | ⏸ externe |

Aucun déploiement public sans validation explicite.

---

## Décisions (validées le 11 octobre 2026)

| #   | Sujet                                | Décision                                                                                                                                                                                                   |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Applications de comptes non vérifiés | Un compte non vérifié ne publie pas : une application n'est publiquement visible que si son éditeur est vérifié (ou administrateur). Les apps historiques sont masquées jusqu'à vérification de l'éditeur. |
| 2   | Vitrine Blade                        | Retrait au profit de Quasar, `/apps/{slug}` redirigé vers la fiche Quasar (Lot 12).                                                                                                                        |
| 3   | Origines isolées                     | Sous-domaines `pwa-{id}.<PWA_RUNTIME_DOMAIN>` avec DNS et certificat wildcard. Le domaine reste à fournir par le porteur de projet.                                                                        |
| 4   | Statuts d'application                | Machine à états cible adoptée (Architecture §4).                                                                                                                                                           |
| 5   | Conservation                         | Compte désactivé anonymisé 30 jours après la désactivation ; avis conservés mais anonymisés.                                                                                                               |
| 6   | Outils de test frontend              | Vitest + Vue Test Utils + jsdom dès le Lot 0 ; Playwright au Lot 12 (téléchargement des navigateurs).                                                                                                      |
| 7   | Contenus légaux                      | Brouillons préparés par l'équipe, marqués « à valider par un juriste » (Lot 3).                                                                                                                            |

## Journal

| Date       | Lot  | Événement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Vérification                                                                                                                                                                                                                                              |
| ---------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-11 | 1, 2 | Country, OTP e-mail, 2FA, tableau de bord développeur, pièce d'identité obligatoire (backend `a61010e`, frontend `e7bd455`)                                                                                                                                                                                                                                                                                                                                                                                                            | `php artisan test` 59/59 ; `quasar build -m pwa` OK                                                                                                                                                                                                       |
| 2026-10-11 | —    | Audit et planification (ces documents)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Inspection du code ; aucune modification de code                                                                                                                                                                                                          |
| 2026-10-11 | 0    | Visibilité publique unique (éditeur vérifié requis), push simulé désactivé (410), analytics restreints + dédupliqués + throttle, avis (e-mail vérifié, 2000 car., throttle), catégorie utilisée protégée, `/admin/apps` paginé, N+1 supprimé, Vitest installé, garde de route extraite                                                                                                                                                                                                                                                 | `php artisan test` 67/67 ; `npm run test:unit` 8/8 ; `npx oxlint` et `npx oxfmt --check` propres ; `quasar build -m pwa` OK. Conséquence : 0 app publique sur 10 approuvées en local tant que les éditeurs ne sont pas vérifiés                           |
| 2026-10-12 | 1    | Mot de passe oublié par code OTP (réponse identique pour une adresse inconnue), changement de mot de passe, sessions (liste, révocation, durée 1 j / 30 j selon « Rester connecté »), verrou par compte (10 échecs / 15 min), statut de compte (actif, suspendu, désactivé) appliqué aux jetons, désactivation par OTP et anonymisation à 30 jours (`pwa:anonymize-accounts`)                                                                                                                                                          | `php artisan test` 74/74 ; `npm run test:unit` 12/12 ; oxlint/oxfmt propres ; build PWA OK ; appel réel `POST /auth/password/forgot` sur `oneapp.test` → 202. Écrans non vérifiés visuellement dans un navigateur                                         |
| 2026-10-12 | 6    | Machine à états (`ApplicationLifecycle`, 9 statuts) avec migration des données (pending→submitted, approved→published, quarantined→suspended), publication séparée de l’approbation, archivage au lieu de la suppression, permissions administrateur granulaires, `audit_logs`, back-office (tableau de bord, applications, utilisateurs, catégories, journal), historique de publication côté développeur                                                                                                                             | `php artisan test` 83/83 ; `npm run test:unit` 15/15 ; oxlint/oxfmt propres ; build PWA OK ; `GET /admin/stats`, `/admin/apps`, `/admin/users`, `/admin/audit-logs` → 200 sur `oneapp.test` (jeton temporaire supprimé). Écrans non vérifiés visuellement |
| 2026-10-12 | 2    | Page `/developers` (étapes, deux modes de publication, vérification, gratuité), lien depuis l’accueil et la barre de navigation, redirection conservée après inscription, filtres et recherche dans la revue des profils                                                                                                                                                                                                                                                                                                               | `php artisan test` 84/84 ; `npm run test:unit` 15/15 ; oxlint/oxfmt propres ; build PWA OK                                                                                                                                                                |
| 2026-10-12 | 3    | `/home` (à la une, populaires, nouveautés, récemment mises à jour, sélections, catégories), sélections éditoriales administrables, apps similaires, page éditeur public, formulaire de contact, pages À propos / Aide / CGU / Confidentialité / Règles de publication (brouillons juridiques signalés), pages Catégories, Catégorie et Sélection, pied de page complet, carte d’application partagée. Données inventées retirées de l’accueil (note 5.0 par défaut, tailles fictives, application fictive, « certifié par PWA Store ») | `php artisan test` 88/88 ; `npm run test:unit` 17/17 ; oxlint/oxfmt propres ; build PWA OK ; `GET /home` → 200 sur `oneapp.test` après correction d’un bug visible uniquement sous MySQL (les tests tournent sous SQLite)                                 |
| 2026-10-12 | 4    | Historique `url_checks` (manuel et automatique, réussites et échecs), contrôle automatique toutes les 6 h avec suspension après deux échecs consécutifs ou sur changement de contenu, exigences de soumission explicites (catégorie, description ≥ 30 caractères, icône, source vérifiée) via `readiness`, parcours de publication et aperçu de la fiche                                                                                                                                                                               | `php artisan test` 91/91 ; `npm run test:unit` 17/17 ; oxlint/oxfmt propres ; build PWA OK ; `GET /apps/{id}/readiness` et `/url-checks` → 200 sur `oneapp.test`                                                                                          |
| 2026-10-12 | 7    | Avis paginés avec répartition des notes, tri, modification et suppression ; réponse de l’éditeur ; un avis par compte (contrainte unique) ; avis masqués exclus des notes ; signalements d’applications et d’avis (dédupliqués) avec traitement admin ; modération des avis ; préférences (consultations récentes à consentement, notifications) ; export JSON des données ; pages admin Signalements et Avis                                                                                                                          | `php artisan test` 96/96 ; `npm run test:unit` 17/17 ; oxlint/oxfmt propres ; build PWA OK ; 6 routes du lot → 200 sur `oneapp.test` (MySQL)                                                                                                              |
| 2026-10-12 | 8    | Vues de fiche comptées (une par visiteur et par heure, hors éditeur et administrateurs, `application_daily_views`), `GET /developer/stats` (7/30/90 jours, par application) séparant vues, ouvertures et installations déclarées, note moyenne, répartition, signalements ouverts ; boîte « Avis et retours » ; page Statistiques (indicateurs, petits multiples, vue tableau, répartition des notes, tableau par application) ; couleurs de graphique validées (contraste ≥ 3:1 clair et sombre)                                      | `php artisan test` 99/99 ; `npm run test:unit` 18/18 ; oxlint/oxfmt propres ; build PWA OK ; graphique rendu dans Chrome sans recouvrement en thème clair et sombre ; 3 routes → 200 et upsert des vues vérifié sous MySQL (transaction annulée)          |
| 2026-10-12 | 10   | Notifications in-app (synchrones) et e-mail (file d’attente) pour bienvenue, activation, vérification, décisions d’application et de version, indisponibilité, avis, signalements, suspension, mot de passe, quota ; préférences respectées sauf sécurité ; anti-doublon 10 min ; résumé quotidien des avis ; cloche et page Notifications ; paramètres admin (quotas, contribution, devise) audités, paiements toujours désactivés. Faux indicateur de notification (pastille rouge permanente) retiré                                | `php artisan test` 104/104 ; `npm run test:unit` 19/19 ; oxlint/oxfmt propres ; build PWA OK ; 4 routes → 200 sur `oneapp.test` ; 5 tâches planifiées listées                                                                                             |
| 2026-10-12 | 9    | PWA Lab : analyse statique d’une URL via le client anti-SSRF (accès, métadonnées, manifeste, icônes, mode d’affichage, service worker détectable, viewport, langue, textes alternatifs, poids HTML, temps de réponse), score technique et verdict d’installation avec leurs limites, historique par développeur ; correctif PHP 8.5 (`curl_close` déprécié)                                                                                                                                                                            | `php artisan test` 107/107 ; build PWA OK ; analyse réelle de https://squoosh.app/ : 95/100, installable, résultats cohérents                                                                                                                             |
| 2026-10-12 | 5    | `GET /platform` (hébergement des builds disponible ou non), avertissement sur la page de publication, tests d’archives malveillantes, guide d’hébergement sur origines isolées (DNS, certificat générique DNS-01, nginx, variables, vérifications)                                                                                                                                                                                                                                                                                     | `php artisan test` 112/112 ; `npm run test:unit` 19/19 ; build PWA OK ; `GET /platform` → `build_hosting: false` en local (domaine non configuré)                                                                                                         |
| 2026-10-12 | 11   | Polices Inter / Inter Tight auto-hébergées, titres en Inter Tight, précache limité aux sous-ensembles latins (580 Ko → 4 fichiers), transitions de page avec mouvement réduit respecté, apparitions au défilement sur le portail, corrections visuelles (pied de page, carte développeur, graisse des titres) ; bug corrigé : `/developers` redirigeait vers la connexion sur mobile (préfixe `/developer`)                                                                                                                            | `npm run test:unit` 20/20 ; build PWA OK ; rendu réel contrôlé dans Chrome via le protocole DevTools à 390 et 1440 px (accueil, portail, À propos, connexion) : aucun débordement horizontal, contenu visible en mouvement réduit                         |
| 2026-10-12 | 12   | Tests backend sous MySQL (`composer test:mysql`), Playwright de bout en bout sur l’API réelle, en-têtes de sécurité, CORS configurable, CSP construite depuis l’adresse de l’API, dépendances corrigées (Laravel 13.35, Guzzle 8.2, Quasar, axios, Vue, Vitest 4), vitrine Blade remplacée par des redirections, guide de déploiement. Défauts corrigés : envoi de fichiers impossible depuis l’interface (pièce d’identité, justificatifs), CSP figée sur `oneapp.test`, `VITE_API_URL` ignoré au build                               | `php artisan test` 111/111 ; `composer test:mysql` 111/111 ; `npm run test:unit` 20/20 ; `npm run test:e2e` 11/11 (deux exécutions) ; `composer audit` et `npm audit` : 0 vulnérabilité                                                                   |
