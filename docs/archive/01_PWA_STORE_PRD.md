# TWA Store — PRD

> Audit du code accessible au 10 octobre 2026. **EXISTANT** : mécanisme constaté dans le code ; cela ne vaut pas recette en production. **PARTIEL** : chaîne incomplète ou incohérente. **ABSENT** : aucun mécanisme trouvé dans le périmètre examiné. **RECOMMANDÉ** : évolution proposée, non réalisée. **NON VÉRIFIÉ** : état inaccessible ou non testé.
>
> Références : **F:** = `/Users/apple/Documents/Quasar Projects/oneappapp/` ; **B:** = `/Users/apple/LaravelProjects/oneapp/`. Les chemins sont relatifs à ces racines. `Api/…Controller` désigne `B:app/Http/Controllers/Api/…Controller.php`. « TWA Store » est le nom demandé pour cette documentation ; le frontend affiche **PWA Store** et la vitrine Laravel **OneApp**. Aucun projet Android Trusted Web Activity n'a été identifié.

## Vision et proposition de valeur

**Intention produit.** Donner aux éditeurs de PWA un canal de découverte et aux utilisateurs un catalogue compréhensible, avec accès aux applications et informations permettant de juger leur provenance. Le contexte fourni envisage le référencement par URL, la vérification d’accessibilité, l’identification des éditeurs et une gratuité initiale. Il ne constitue pas une preuve d’implémentation.

**EXISTANT.** Le produit référence des fiches, classe les applications, reçoit des versions ZIP et peut les héberger. **PARTIEL.** La continuité entre publication, approbation, déploiement, installation et suivi d’usage n’est pas achevée. **ABSENT.** Le contrôle d’identité et le référencement vérifié d’une PWA distante n’ont pas de workflow dédié.

Le problème visé est la difficulté de découvrir et d’adopter une PWA hors des grandes places de marché. La valeur attendue repose sur la découverte, la qualité des fiches et la confiance dans la provenance ; le code actuel ne justifie pas une promesse de certification ou de protection universelle.

## Publics, rôles et permissions

| Profil                   | Besoin                                                  | Capacités observées                                                             | Limites                                                                            |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Visiteur                 | Découvrir, évaluer, ouvrir                              | Catalogue, recherche, fiche approuvée, avis lisibles, intentions d’installation | Ouverture Quasar liée à une extraction protégée                                    |
| Utilisateur (`user`)     | Installer et retrouver ses applications, donner un avis | Authentification, avis, API bibliothèque/installation                           | Aucun tableau de bord utilisateur Quasar ; « Mon espace » mène au rôle développeur |
| Éditeur (`developer`)    | Publier et maintenir                                    | Création, édition de ses fiches, versions, extraction de ses paquets            | Identité auto-déclarée ; bibliothèque média incomplète                             |
| Administrateur (`admin`) | Contrôler le catalogue                                  | API liste globale, statut/score, suppression, catégories, statistiques          | Console Quasar partiellement rompue ; pas de piste d’audit métier structurée       |

Sources : F:src/router/index.js, src/router/routes.js, src/layouts/MainLayout.vue ; B:AuthController, ApplicationController, CategoryController. L’inscription accepte user/developer, jamais admin. Le rôle ne constitue pas une preuve d’identité.

## Objectifs et périmètre fonctionnel

| ID   | Exigence                           | État et preuve                                                       | Critère d’acceptation cible — RECOMMANDÉ                                                                       |
| ---- | ---------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| PR01 | Inscrire, connecter et déconnecter | EXISTANT, AuthController et pages auth                               | Contrats valides ; erreur lisible ; déconnexion révoque le token et vide tout état client                      |
| PR02 | Afficher le catalogue publiable    | PARTIEL, index filtre approved + is_active ; autres accès divergents | Une règle d’éligibilité identique protège catalogue, détail, téléchargement et runtime                         |
| PR03 | Rechercher, filtrer, paginer       | PARTIEL, API paginate(12), pages sans navigation                     | Tous les résultats atteignables ; filtres et recherche conservés dans l’URL                                    |
| PR04 | Présenter une fiche exacte         | PARTIEL, AppDetailsPage et show                                      | Captures réelles, absence de note explicitée, tailles issues de la version, source/éditeur lisibles            |
| PR05 | Soumettre une application          | PARTIEL, CreateAppPage et store                                      | Métadonnées et médias persistés ; état pending ; erreur de ZIP récupérable sans doublon                        |
| PR06 | Mettre à jour fiche et versions    | PARTIEL, EditAppPage et AppVersionController                         | Échec de sauvegarde bloque la suite ; suppression média explicite ; historique conservé                        |
| PR07 | Modérer                            | PARTIEL, update admin, console divergente                            | Approver/quarantiner/désactiver fonctionne et produit une décision explicable                                  |
| PR08 | Ouvrir ou installer                | PARTIEL, extraction et guides                                        | Le visiteur ouvre une version déjà autorisée sans opération administrative ; annulation distinguée d’un succès |
| PR09 | Retrouver ses installations        | PARTIEL, InstallationController et page Blade library                | Une installation confirmée apparaît pour le seul compte concerné ; archivage et mises à jour cohérents         |
| PR10 | Évaluer une application            | EXISTANT côté API, PARTIEL côté expérience                           | Note 1–5, mise à jour de son avis, erreur visible et protection contre les doublons concurrents                |
| PR11 | Référencer une URL distante        | ABSENT comme workflow vérifié ; official_site_url seulement          | Mode produit décidé, URL contrôlée, preuve de domaine et statut de disponibilité explicites                    |
| PR12 | Vérifier les éditeurs              | ABSENT                                                               | Niveau de preuve, renouvellement, refus et recours définis ; badge uniquement après validation                 |
| PR13 | Récupérer un compte                | ABSENT, bouton sans action                                           | Demande non énumérante, jeton à durée limitée, changement de mot de passe et invalidation définie              |
| PR14 | Facturer une contribution          | ABSENT                                                               | Conditions, événement déclencheur, montant, remboursement et fournisseur décidés avant développement           |
| PR15 | Informer et mesurer                | PARTIEL, push simulé et analytics API                                | Aucun envoi marqué livré sans preuve ; métriques définies et instrumentation testée                            |

Aucune fonctionnalité n’est dite « en cours de développement » sur la seule présence d’un fichier : l’état PARTIEL décrit le code, pas un engagement d’équipe ou une échéance.

## Catalogue fonctionnel Laravel et intégration dans Quasar

Ce catalogue prend explicitement pour source **`/Users/apple/LaravelProjects/oneapp`**. L’état du backend et l’état du parcours client sont évalués séparément : une fonctionnalité serveur présente reste **EXISTANTE** même si aucun écran Quasar ne l’exploite. Sa chaîne utilisateur peut néanmoins être **PARTIELLE**. Les identifiants BF servent de correspondance avec les autres documents ; ils ne désignent pas de nouvelles fonctionnalités à reconstruire.

| ID   | Fonctionnalité et comportement serveur constaté                                                                                                                  | État backend                                                                   | Intégration Quasar / limite                                                                                               | Preuve backend                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| BF01 | Comptes : inscription user/developer, connexion, identité courante, révocation du token courant                                                                  | EXISTANT                                                                       | Login/register/logout raccordés ; réhydratation par me à compléter                                                        | Api/AuthController ; 4 routes auth                                      |
| BF02 | Découverte : catalogue paginé, recherche, suggestions, filtres catégorie/prix/plateforme, tris et fiche avec versions/avis                                       | EXISTANT                                                                       | Pages catalogue et fiche présentes ; pagination non exposée et règles de visibilité à uniformiser                         | Api/ApplicationController::index/suggestions/show                       |
| BF03 | Gestion des fiches : création pending, édition propriétaire/admin, listes personnelle/globale, désactivation, statut/score admin, suppression admin              | EXISTANT pour les opérations de fiche ; PARTIEL pour médias et retrait complet | Création/édition/console disponibles ; appels admin divergents                                                            | Api/ApplicationController::store/update/destroy/developerApps/adminApps |
| BF04 | Référentiel catégories : liste active ou complète, détail par ID/slug, compte des fiches approuvées, création/édition/suppression admin, ordre, icône et couleur | EXISTANT                                                                       | Lecture utilisée ; écran Quasar d’administration des catégories ABSENT                                                    | Api/CategoryController ; 5 routes categories                            |
| BF05 | Versions et paquets : upload ZIP, analyse, hash/HMAC, stockage, extraction récente/historique et téléchargement ZIP                                              | EXISTANT ; garanties de publication PARTIELLES                                 | Upload raccordé ; extraction couplée à tort à l’ouverture publique ; téléchargement ZIP non présenté comme parcours dédié | Api/AppVersionController ; app/Services/PwaPackageAnalyzer.php          |
| BF06 | Avis : note 1–5 et commentaire ; mise à jour de l’avis existant de l’auteur                                                                                      | EXISTANT                                                                       | Formulaire présent ; erreurs et unicité concurrente à fiabiliser                                                          | Api/ReviewController::store                                             |
| BF07 | Bibliothèque : installations personnelles non archivées ; recherche de version différente et indicateur update_available                                         | EXISTANT pour lecture/calcul ; PARTIEL pour exactitude des mises à jour        | Page Quasar ABSENTE ; page Blade existante ; alimentation depuis l’installation incomplète                                | Api/InstallationController::index/updates                               |
| BF08 | Suivi d’installation : création ou mise à jour par utilisateur/application/appareil ; état, dernière ouverture, archivage/désarchivage                           | EXISTANT côté API                                                              | Appels POST/PATCH non raccordés aux événements d’installation dans Quasar                                                 | Api/InstallationController::store/update                                |
| BF09 | Intentions : demande install/open/update, token UUID valable 30 minutes, URL de reprise, lecture avec consommation                                               | EXISTANT côté API ; consommation atomique et reprise PARTIELLES                | Aucun parcours Quasar raccordé ; création utilisée par Blade sans reprise complète                                        | Api/InstallIntentController::store/show                                 |
| BF10 | Notifications : cible utilisateur, choix déclaratif de passerelle selon installation et conservation du message                                                  | PARTIEL : simulation, livraison réelle ABSENTE                                 | Aucun centre d’envoi Quasar identifié ; ne pas présenter sent comme une preuve de livraison                               | Api/PushNotificationController::store                                   |
| BF11 | Mesures : ingestion open/close/crash/error ; synthèse installations/plateformes, ouvertures, crashes, ratio et appareils                                         | EXISTANT pour ingestion/agrégats ; fiabilité d’usage PARTIELLE                 | Appel de synthèse admin incorrect ; instrumentation des clients à raccorder                                               | Api/AnalyticsController::store/summary                                  |
| BF12 | Vitrine web Laravel : accueil, fiche par slug/identifiant, publication et bibliothèque, redirection d’ancienne URL                                               | EXISTANT ; parcours de publication/installation PARTIELS                       | Interface Blade distincte, pas un écran Quasar                                                                            | routes/web.php ; StorefrontController ; resources/views/apps            |
| BF13 | Installation du store et aides à l’adoption : manifeste/worker Blade, guides de navigateur, QR code, copie et partage de lien                                    | EXISTANT dans les ressources ; installation réelle NON VÉRIFIÉE                | Mécanismes Quasar séparés ; pas de garantie de synchronisation des sessions/workers                                       | public/oneapp-manifest.json, public/oneapp-sw.js, resources/js/app.js   |

**Règles métier à conserver lors du raccordement.** La bibliothèque appartient au compte, et chaque installation à un appareil déclaré. Archiver masque l’entrée de la bibliothèque ; cela ne désinstalle pas techniquement une PWA du navigateur. Déclarer un événement d’ouverture n’est pas la même opération que mettre à jour last_opened_at. Une intention d’installation n’est ni une installation réalisée ni un téléchargement. Un ZIP reçu n’est pas automatiquement une fiche approuvée. Ces distinctions doivent rester visibles dans le produit.

**RECOMMANDÉ.** Réutiliser BF04, BF07–BF09 et BF11 pour compléter les écrans et les appels clients, après correction de leurs limites recensées. Ne pas remplacer ces capacités par des données locales fictives ni créer des endpoints concurrents sans nécessité. BF10 demande une véritable intégration de livraison avant toute promesse de push opérationnel.

## Référencement et règles métier actuelles

**EXISTANT.** La création appartient à un développeur ou administrateur. `name`, `identifier` et `category` structurent la fiche ; `category_id` peut relier le référentiel. Une fiche est créée `pending` avec `trust_score = 100`. Un score initial de 100 n’indique donc pas un audit réussi. Le propriétaire peut modifier sa fiche ; seul l’administrateur change `status` et `trust_score`, ou supprime l’application. Le propriétaire dispose de `is_active` pour désactiver.

**PARTIEL.** Quasar exige une catégorie et une capture mobile avant création, mais le backend ne stocke pas réellement les fichiers reçus dans `media`. Le ZIP est facultatif dans ce parcours ; la vitrine Blade exige un ZIP et suit un formulaire différent. Un échec du second appel de téléversement laisse une fiche créée. La récupération de ce cas doit conserver l’identifiant serveur.

**EXISTANT.** Une version reçue passe une analyse statique. Erreurs de structure : refus 422. Un paquet valide mais suspect peut être enregistré en quarantaine ; un paquet passé est `validated`. L’extraction publie la version `active` et repasse les anciennes versions actives à `validated`.

**PARTIEL.** L’ordre des versions diffère selon les composants : date de création, `version_compare` ou `version_code`. Les domaines déclarés ne sont pas une permission réseau imposée à l’exécution. La signature HMAC ne prouve pas l’identité d’un éditeur tiers.

Sources : B:ApplicationController::store/update/destroy, AppVersionController::store/extract/deployVersion, app/Services/PwaPackageAnalyzer.php ; F:src/pages/developer.

## Modération, suspension et confiance

**EXISTANT.** États de fiche acceptés par l’API admin : `pending`, `approved`, `quarantined` ; activation séparée par `is_active`. États de version observés : `validated`, `active`, `quarantined`, avec `scan_status` distinct. `suspended_at` existe en base sans circuit de suspension complet identifié.

**PARTIEL.** L’interface admin ne correspond pas aux routes réelles. La visibilité publique n’applique pas uniformément les états. La dépublication de fichiers déjà exposés n’est pas garantie par un changement de statut. Il n’existe pas de justificatif structuré de décision, de circuit de recours ou de vérification des éditeurs constaté.

**RECOMMANDÉ.** Définir une politique unique distinguant fiche, version, éditeur et disponibilité du runtime. Une décision de retrait doit bloquer tous les points d’accès, conserver une trace et expliquer le résultat à l’éditeur. La modification substantielle d’une application approuvée doit avoir une règle de nouvelle revue explicite.

## Cas d’usage prioritaires

1. Découverte : visiteur → recherche/catégorie → fiche → application autorisée. Succès mesuré par une ouverture réelle, pas par un clic sur « installer ».
2. Publication : éditeur authentifié → fiche/médias → version → analyse → revue admin → déploiement isolé → ouverture publique.
3. Maintenance : propriétaire → modification → sauvegarde confirmée → nouvelle version contrôlée → mise à disposition ; l’ancienne version reste utilisable en cas d’échec avant bascule.
4. Modération : admin → dossier → décision motivée → changement effectif de visibilité et d’accès → notification selon mécanisme réellement disponible.
5. Retour utilisateur : compte connecté → avis → validation → fiche actualisée, sans duplications de la même contribution.

Les étapes recommandées dépassant le comportement actuel sont détaillées dans [App Flow](./03_TWA_STORE_APP_FLOW.md), notamment les blocages d’installation et de reprise après échec.

## Modèle économique et MVP

**EXISTANT.** `price` et filtres gratuit/payant sont des métadonnées de catalogue. **ABSENT.** Paiement, abonnement, contribution, commission, facture ou droits d’accès acquis. **Intention produit.** Gratuité initiale et contribution forfaitaire éventuelle ; seuil, montant et débiteur non définis. Ne pas afficher un paiement opérationnel ni déduire une facturation de la colonne `price`.

**RECOMMANDÉ — MVP à valider.** Retenir une interface canonique ; catalogue exact et paginé ; comptes et récupération ; dépôt/édition durable ; modération opérationnelle ; accès à une version autorisée ; isolation de l’hébergement si les ZIP sont retenus ; informations de provenance et support. La bibliothèque peut entrer dans le MVP si son suivi réel est achevé. Le push, la facturation et les recommandations personnalisées ne doivent pas bloquer ce périmètre sauf décision produit contraire.

Le référencement externe et la vérification d’éditeur sont des ambitions centrales de la demande mais absentes du code. Leur inclusion dans le premier lancement est une décision explicite, pas une fonction présumée existante.

## Exigences non fonctionnelles et indicateurs

| Domaine         | État        | Cible recommandée, non mesurée                                                                          |
| --------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| Sécurité        | PARTIEL     | Aucun P0 ouvert ; isolation des contenus tiers ; matrice d’accès testée ; données publiques minimisées  |
| Fiabilité       | PARTIEL     | Publication réversible, gestion des échecs, absence de faux succès ; restauration démontrée             |
| Accessibilité   | NON VÉRIFIÉ | Recette clavier, lecteur d’écran, contrastes et messages d’erreur sur les principaux parcours           |
| Performance     | NON VÉRIFIÉ | Budget de page, temps de réponse et volumes cibles définis après mesure sur environnement représentatif |
| Compatibilité   | PARTIEL     | Matrice Android/iOS/desktop ; distinguer ouverture web, aide manuelle et installation confirmée         |
| Confidentialité | PARTIEL     | Données collectées justifiées, durée de conservation décidée, aucun cache privé partagé                 |
| Exploitabilité  | PARTIEL     | Journaux corrélables, alertes et procédures de sauvegarde/restauration éprouvées                        |

**Indicateurs recommandés.** Taux de soumission aboutie = versions recevables / tentatives identifiées ; délai de modération = décision moins soumission ; conversion = ouvertures ou installations confirmées / visites de fiche éligibles ; taux de rejet par motif ; erreurs de publication ; retour d’usage après période définie. Les dénominateurs, consentements éventuels et exclusions de robots doivent être définis avant collecte.

Les compteurs actuels ne suffisent pas : `downloads_count` augmente à la création d’une installation, même échouée ; les tendances reposent sur des volumes cumulés ; les événements peuvent être déclarés par tout utilisateur authentifié. Aucun chiffre de trafic réel n’est déduit des seeders.

## Critères de sortie du MVP

**RECOMMANDÉ.** Les exigences retenues disposent d’une recette positive et négative ; les P0 du registre sont fermés ; un utilisateur non propriétaire accède uniquement aux applications autorisées ; le retrait coupe le runtime ; les médias survivent au rechargement ; aucun écran ne présente un état de succès après échec ; les mécanismes sensibles passent la matrice de rôles ; le déploiement et la restauration sont documentés. L’approbation du MVP doit reposer sur ces preuves, pas sur la présence de pages.

## Documents associés

[00](./00_TWA_STORE_AUDIT_SUMMARY.md) · [01](./01_TWA_STORE_PRD.md) · [02](./02_TWA_STORE_TRD.md) · [03](./03_TWA_STORE_APP_FLOW.md) · [04](./04_TWA_STORE_UX_UI.md) · [05](./05_TWA_STORE_BACKEND_SCHEMA.md) · [06](./06_TWA_STORE_IMPLEMENTATION_PLAN.md)
