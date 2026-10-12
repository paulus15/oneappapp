# Guide du développeur PWA Store

Ce guide explique comment publier une Progressive Web App sur PWA Store, de la préparation à la mise à jour. Le portail développeur s’utilise sur ordinateur ou tablette (768 px de large au minimum). Une version courte est disponible dans le portail : **Guide du développeur** (`/developer/guide`).

> L’exemple utilisé dans ce guide, **SantéPlus**, est une application **fictive** de recherche de pharmacies de garde.

## 1. Devenir développeur

Conditions :

1. Un compte PWA Store avec une **adresse e-mail confirmée**.
2. Un **profil développeur activé** (gratuit), individuel ou organisation : « Mon espace » ou page **Développeurs**.
3. Un **profil complet** et une **pièce d’identité valide** (carte d’identité, passeport, titre de séjour ou permis de conduire). La pièce est conservée dans un stockage privé, consultable par les seuls vérificateurs, puis supprimée automatiquement au terme de sa durée de conservation.
4. La **vérification** de votre profil par un administrateur. En cas de refus, le motif est affiché : corrigez et soumettez à nouveau.

Tant que votre profil n’est pas vérifié, ou si votre pièce d’identité a expiré, vous ne pouvez pas soumettre d’application ; la raison est indiquée dans votre espace.

## 2. Le portail développeur

| Menu                         | Adresse               | Contenu                                                                                   |
| ---------------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| Vue d’ensemble               | `/developer`          | Chiffres clés, actions à faire                                                            |
| **Mes applications**         | `/developer/apps`     | Toutes vos applications, leur statut, la création d’une application                       |
| **Suivi des validations**    | `/developer/requests` | La dernière demande de chaque application et la décision                                  |
| Statistiques                 | `/developer/stats`    | Vues, ouvertures, installations sur 7, 30 ou 90 jours                                     |
| **Mesure des installations** | `/developer/measure`  | État du script de mesure et installations confirmées, application par application         |
| Avis et retours              | `/developer/reviews`  | Avis reçus, réponse (une par avis)                                                        |
| PWA Lab                      | `/developer/lab`      | Analyse d’une adresse : HTTPS, manifeste, icônes, service worker, critères d’installation |
| **Guide du développeur**     | `/developer/guide`    | Ce guide en version courte                                                                |
| Règles de publication        | `/publishing-rules`   | Ce qui est accepté ou refusé                                                              |

## 3. Informations à préparer

Pour créer le brouillon, il suffit du **nom** et du **lien HTTPS de votre PWA** (la catégorie peut être choisie tout de suite ou plus tard). Pour soumettre, **tout** doit être renseigné :

| Information                  | Règle                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| Catégorie                    | Obligatoire                                                                                             |
| Description courte           | Une phrase, 280 caractères au plus                                                                      |
| Description complète         | 30 caractères au moins                                                                                  |
| **Image de couverture**      | **Obligatoire.** 16:9, au moins 1280 × 720 px (1920 × 1080 recommandé), JPEG, PNG ou WebP, 3 Mo maximum |
| Icône                        | Fichier carré, 192 × 192 px minimum, PNG, JPG ou WebP, 1 Mo maximum                                     |
| Captures d’écran             | De 1 à 8 (téléphone ; tablette facultatif), PNG, JPG ou WebP, 5 Mo maximum chacune                      |
| Langues                      | Au moins une                                                                                            |
| Lien officiel de la PWA      | Adresse officielle de l’application ou de son site de présentation                                      |
| E-mail de contact            | Adresse valide                                                                                          |
| Politique de confidentialité | Adresse (URL) de la page                                                                                |
| Données collectées           | Au moins un choix (« Aucune donnée » compris)                                                           |
| Accès pour la vérification   | Accès libre, ou instructions et identifiants de test (onglet Contenu)                                   |
| Annonces                     | Oui ou non (onglet Contenu)                                                                             |
| Classification du contenu    | Questionnaire complet (onglet Contenu)                                                                  |

Facultatif : sous-catégorie, page d’assistance, conditions d’utilisation, appareils et fonctions pris en charge. Les images sont recodées à l’envoi : leurs métadonnées (position GPS, modèle d’appareil) sont supprimées.

## 4. Préparer votre PWA

Une PWA installable a besoin de :

- **HTTPS** sur une adresse publique (port 443).
- Un **manifeste** `manifest.webmanifest` ou `manifest.json` déclaré dans la page (`<link rel="manifest">`), avec au moins `name`, `short_name`, `start_url`, `display` et `icons`.
- Un **service worker**.
- Des **icônes** d’au moins 192 × 192 et 512 × 512 pixels.
- Une balise `<meta name="viewport">` pour un affichage mobile correct.

Exemple de manifeste pour SantéPlus :

```json
{
  "name": "SantéPlus — Pharmacies de garde",
  "short_name": "SantéPlus",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0b7a5c",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Utilisez **PWA Lab** pour vérifier votre adresse avant de soumettre.

## 5. Publier par lien (mode par défaut)

Votre PWA reste hébergée sur votre site. Badge public : **« Hébergée par l’éditeur »**.

- L’adresse est contrôlée sans exécuter votre code : accès, manifeste et identité de l’application (nom, icônes, adresse de départ, portée). Le contrôle est relancé à chaque soumission, puis toutes les 6 heures une fois l’application en ligne.
- Un **changement du manifeste** n’entraîne pas de suspension : il est signalé aux modérateurs, qui peuvent vous contacter.
- Si votre site devient **indisponible plusieurs fois de suite**, l’application peut être suspendue automatiquement ; vous êtes prévenu.
- Vous mettez à jour le code de votre application sur votre site, sans nouvelle soumission. Limite : le contrôle porte sur la page et le manifeste ; un script modifié après l’approbation n’est pas détecté, et vous restez responsable de son contenu.

> **Dépôt de fichiers ZIP** : désactivé par défaut sur PWA Store. Le choix « Déposer les fichiers de mon application (ZIP) » n’apparaît que si la plateforme l’a activé ; les sections 12 et 13 ne s’appliquent alors qu’aux applications fournies par ZIP.

## 6. Pays de distribution

Dans l’onglet **Informations**, choisissez **Tous les pays** ou **Pays sélectionnés**. Avec une sélection, l’application n’apparaît que pour les comptes de ces pays et pour les visiteurs qui ont choisi l’un de ces pays ; ailleurs, sa fiche répond « Cette application n’est pas disponible dans votre pays ».

Le pays d’un compte est celui de son profil ; il ne peut changer qu’une fois tous les 30 jours. Un visiteur non connecté choisit son pays dans le Store (le choix reste dans son navigateur ; il n’est jamais déduit de l’adresse IP). Sans pays choisi, seules les applications disponibles partout sont affichées.

## 7. Onglet Contenu

- **Accès pour la vérification** : si une partie de l’application exige une connexion, donnez des instructions et des **identifiants de test** (jamais un compte personnel). Ils sont **chiffrés**, visibles uniquement par vous et l’équipe de vérification, et chaque consultation par un modérateur est journalisée.
- **Annonces** : indiquez si l’application contient des annonces, y compris de réseaux publicitaires tiers. La fiche affiche « Contient des annonces ».
- **Classification du contenu** : répondez au questionnaire (violence, contenu sexuel, langage, drogues, jeux d’argent, contenus effrayants, et éléments interactifs : échanges entre utilisateurs, partage de la localisation, achats numériques). L’âge minimum (3+, 7+, 12+, 16+ ou 18+) est **calculé par PWA Store** à partir de vos réponses : ce n’est **pas** une classification officielle (IARC, PEGI, ESRB). L’équipe de vérification la contrôle ; une déclaration trompeuse peut entraîner la suspension.

## 8. Mesurer les installations

Dans l’onglet **Version** de l’application (et sur la page **Mesure des installations**), copiez la ligne de mesure et collez-la dans le HTML de votre PWA, juste avant `</body>` :

```html
<script
  src="https://pwastore.online/api/sdk.js"
  data-app="VOTRE_CLÉ"
  async
></script>
```

Cliquez ensuite sur **Vérifier mon site** : PWA Store lit votre page et indique si la ligne est en place, si la clé est la bonne, si elle pointe vers une autre adresse de PWA Store, ou si votre politique de sécurité (CSP) la bloque. Dans ce cas, autorisez l’adresse de PWA Store pour `script-src` et `connect-src`.

Le script ne transmet que deux événements : **installation** et **ouverture depuis l’écran d’accueil**, avec un identifiant pseudonyme de l’appareil, et seulement depuis l’adresse déclarée de l’application publiée. Il ne collecte rien de ce que font vos utilisateurs. Vous devez **informer vos utilisateurs** de cette mesure dans votre politique de confidentialité. Les chiffres sont des indicateurs, pas une preuve comptable.

Deux compteurs coexistent : **installations déclarées** (comptes du Store qui ont indiqué avoir installé l’application, comptées une fois par compte) et **installations confirmées** (signaux du script).

## 9. Erreurs fréquentes

| Message                                            | Solution                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Une URL HTTPS publique sur le port 443 est requise | Utilisez l’adresse publique de votre PWA, en `https://`, sans port ni identifiants.                              |
| Aucun manifeste PWA déclaré                        | Ajoutez `<link rel="manifest" href="...">` dans la page d’accueil.                                               |
| Le manifeste PWA est incomplet                     | Complétez `name`, `start_url` et `icons`.                                                                        |
| Contrôle du lien échoué                            | Vérifiez que l’adresse répond, sans redirection vers un réseau privé, en moins de 2 Mo.                          |
| Couverture refusée                                 | Image 16:9 d’au moins 1280 × 720 px, JPEG/PNG/WebP, 3 Mo maximum.                                                |
| Icône refusée                                      | Image carrée d’au moins 192 px, PNG/JPG/WebP, 1 Mo maximum.                                                      |
| « Vérifier mon site » ne trouve pas le script      | La ligne doit figurer dans le HTML envoyé par votre serveur ; un script ajouté par JavaScript n’est pas visible. |

## 10. Liste de vérification avant soumission

- [ ] Profil développeur vérifié, pièce d’identité valide
- [ ] Catégorie, description courte, description complète (≥ 30 caractères)
- [ ] Couverture 16:9, icône carrée, au moins une capture d’écran
- [ ] Au moins une langue, pays de distribution
- [ ] Lien officiel de la PWA, e-mail de contact
- [ ] Politique de confidentialité et données collectées
- [ ] Onglet Contenu : accès pour la vérification, annonces, classification
- [ ] Lien HTTPS qui répond, avec un manifeste complet
- [ ] (Recommandé) Ligne de mesure en place et « Vérifier mon site » au vert

L’onglet **Récapitulatif** affiche votre fiche telle que les visiteurs la verront et liste ce qui manque, avec un lien vers l’onglet concerné.

## 11. Examen et décisions

Cliquez sur **Soumettre à validation**. Votre dossier est figé : un modérateur examine exactement ce que vous avez envoyé. Pendant l’examen, l’application ne peut pas être modifiée ; vous pouvez **retirer votre demande** pour la changer.

| Décision                  | Ce qui se passe                                                                 |
| ------------------------- | ------------------------------------------------------------------------------- |
| **Approuvée**             | L’application est **publiée automatiquement**, sans autre action de votre part. |
| **Corrections demandées** | Le motif s’affiche en haut de votre espace. Corrigez puis soumettez à nouveau.  |
| **Refusée**               | Le motif est conservé. Vous pouvez corriger et soumettre une nouvelle demande.  |

Vous êtes prévenu dans l’application et par e-mail. Toutes vos demandes sont visibles dans **Suivi des validations** et dans l’onglet **Suivi** de chaque application. Si la mise en ligne automatique a échoué, un message vous le signale et le bouton **Publier maintenant** apparaît.

### Application suspendue

Une application peut être suspendue par la modération (avec motif) ou après des indisponibilités répétées. Vous pouvez **demander un réexamen** en soumettant depuis l’onglet **Récapitulatif**, même sans modification. Un modérateur peut la **rétablir** directement ou approuver le réexamen ; lever une suspension est toujours une décision explicite et journalisée.

### Application archivée

Vous pouvez archiver une application (elle quitte le Store, ses données sont conservées), puis la **réactiver en brouillon**.

## 12. Mettre à jour la fiche

- **Votre application reste en ligne** telle qu’elle a été approuvée.
- Modifiez la fiche (textes, images, contenu…) : les changements sont enregistrés **en attente**. Vous pouvez les annuler (« Annuler mes modifications »).
- Soumettez la mise à jour depuis **Récapitulatif**. À l’approbation, les changements remplacent la fiche publique.

## 13. Applications fournies par ZIP (si le dépôt est activé)

Envoyez le **résultat de la compilation** (jamais les sources) : `index.html` à la racine, manifeste, service worker, icônes. Limites : 50 Mo pour le ZIP (valeur par défaut), 200 Mo décompressé, 10 000 fichiers ; fichiers exécutables (`.php`, `.exe`, `.sh`…) refusés.

| Outil   | Commande              | Dossier à compresser     |
| ------- | --------------------- | ------------------------ |
| Quasar  | `quasar build -m pwa` | `dist/pwa/`              |
| Vite    | `npm run build`       | `dist/`                  |
| Angular | `ng build`            | `dist/<projet>/browser/` |

Chaque ZIP est analysé dès l’envoi, sans exécuter votre code : **Prête à soumettre**, **Fonctions sensibles détectées** (`eval()`, `new Function()`, `document.write()` : non bloquant, examiné par un modérateur) ou **Refus** avec la raison. Les domaines externes (polices, API, CDN, WebSockets…) sont **détectés automatiquement** ; vous n’avez rien à déclarer. L’application est servie sur une origine isolée, badge **« Hébergée par PWA Store »**. Une nouvelle version passe par une demande de mise à jour ; l’ancienne reste en ligne jusqu’à l’approbation.

## 14. Exemple complet : SantéPlus (fictif)

1. **Création** : nom « SantéPlus », lien `https://santeplus.example/`. Le brouillon est créé.
2. **Informations** : catégorie « Santé » ; description courte « Trouvez la pharmacie de garde la plus proche » ; description complète ; langues français et anglais ; lien officiel ; e-mail `contact@santeplus.example` ; pays sélectionnés : Côte d’Ivoire et Sénégal.
3. **Images** : couverture 1920 × 1080, icône 512 × 512 PNG, trois captures téléphone.
4. **Confidentialité** : politique `https://santeplus.example/confidentialite` ; données collectées : Localisation.
5. **Contenu** : accès libre ; pas d’annonces ; questionnaire : tout « Non » sauf partage de la localisation → classification 3+.
6. **Version** : ligne de mesure collée dans `index.html`, **Vérifier mon site** → « Script détecté ».
7. **Récapitulatif** : tout est vert ; **Soumettre à validation**.
8. **Décision** : le modérateur demande une correction : « La capture 2 montre des données réelles de patients. » Remplacement de la capture, nouvelle soumission, **approbation** : SantéPlus est en ligne avec le badge « Hébergée par l’éditeur », visible en Côte d’Ivoire et au Sénégal.
