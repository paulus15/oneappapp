# Guide du développeur PWA Store

Ce guide explique comment publier une Progressive Web App sur PWA Store, de la préparation à la mise à jour. Le portail développeur s’utilise sur ordinateur ou tablette (768 px de large au minimum).

> L’exemple utilisé dans ce guide, **SantéPlus**, est une application **fictive** de recherche de pharmacies de garde.

## 1. Devenir développeur

Conditions :

1. Un compte PWA Store avec une **adresse e-mail confirmée**.
2. Un **profil développeur activé** (gratuit), individuel ou organisation : « Mon espace » ou page **Développeurs**.
3. Un **profil complet** et une **pièce d’identité valide** (carte d’identité, passeport, titre de séjour ou permis de conduire).
4. La **vérification** de votre profil par un administrateur. En cas de refus, le motif est affiché : corrigez et soumettez à nouveau.

Tant que votre profil n’est pas vérifié, ou si votre pièce d’identité a expiré, vous ne pouvez pas soumettre d’application ; la raison est indiquée dans votre espace.

## 2. Informations à préparer

Pour créer le brouillon, il suffit du **nom**, de la **catégorie** et du choix **ZIP ou lien**. Pour soumettre, **tout** doit être renseigné :

| Information                  | Règle                                                                       |
| ---------------------------- | --------------------------------------------------------------------------- |
| Catégorie                    | Obligatoire                                                                 |
| Description courte           | Une phrase, 280 caractères au plus                                          |
| Description complète         | 30 caractères au moins                                                      |
| Icône                        | Fichier carré, 192 × 192 px minimum, PNG, JPG ou WebP, 1 Mo maximum         |
| Captures d’écran             | Au moins une (téléphone ; tablette facultatif), PNG, JPG ou WebP, 5 Mo max. |
| Langues                      | Au moins une                                                                |
| Lien officiel de la PWA      | Adresse officielle de l’application ou de son site de présentation          |
| E-mail de contact            | Adresse valide                                                              |
| Politique de confidentialité | Adresse (URL) de la page                                                    |
| Données collectées           | Au moins un choix (« Aucune donnée » compris)                               |

Facultatif : sous-catégorie, pays de disponibilité, page d’assistance, conditions d’utilisation, appareils et fonctions pris en charge.

## 3. Préparer votre PWA

Une PWA installable a besoin de :

- **HTTPS** (obligatoire pour le référencement par lien ; fourni par PWA Store pour un ZIP hébergé).
- Un **manifeste** `manifest.webmanifest` ou `manifest.json` avec au moins `name`, `short_name`, `start_url`, `display` et `icons`. Chaque icône déclarée doit exister dans les fichiers.
- Un **service worker** `sw.js` ou `service-worker.js` à la racine.
- Des **icônes** d’au moins 192 × 192 et 512 × 512 pixels.
- Une balise `<meta name="viewport">` dans `index.html` pour un affichage mobile correct.

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

## 4. Construire pour la production

Envoyez toujours le **résultat de la compilation**, jamais les sources. Exemples :

| Outil   | Commande              | Dossier à compresser     |
| ------- | --------------------- | ------------------------ |
| Quasar  | `quasar build -m pwa` | `dist/pwa/`              |
| Vite    | `npm run build`       | `dist/`                  |
| Angular | `ng build`            | `dist/<projet>/browser/` |

Compressez le **contenu** du dossier (ou le dossier lui-même) : `index.html` doit se trouver à la racine du build.

## 5. Structure attendue du ZIP

```
santeplus-1.0.0.zip
├── index.html
├── manifest.webmanifest
├── sw.js
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── assets/
    ├── index-3f9a1c.js
    └── index-8b2e44.css
```

Limites : 50 Mo pour le ZIP (valeur par défaut de la plateforme), 200 Mo une fois décompressé, 10 000 fichiers.

## 6. Lien (URL) ou fichiers (ZIP) ?

|                     | Lien de votre PWA                                         | Fichiers (ZIP)                                                  |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| Hébergement         | Sur votre site                                            | Par PWA Store, à une adresse dédiée et isolée                   |
| Badge public        | **« Hébergée par l’éditeur »**                            | **« Hébergée par PWA Store »**                                  |
| Contrôle            | Adresse contrôlée à chaque soumission, puis régulièrement | Analyse complète du build à chaque envoi                        |
| Mise à jour du code | Vous mettez à jour votre site                             | Vous envoyez une nouvelle version, examinée avant mise en ligne |

Le choix se fait à la création et ne peut plus changer après la première soumission. Une infobulle sur le badge explique la différence aux visiteurs.

Pour une application par lien : si votre site devient indisponible deux fois de suite, ou si son contenu change de façon inattendue, l’application peut être suspendue automatiquement ; vous êtes prévenu.

## 7. L’analyse automatique

Chaque ZIP est analysé dès l’envoi (sans exécuter votre code). Résultats possibles :

| Résultat                                        | Ce que ça veut dire                                                                                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prête à soumettre**                           | Tout va bien.                                                                                                                                                        |
| **Fonctions sensibles détectées** (quarantaine) | `eval()`, `new Function()` ou `document.write()` ont été trouvés, souvent dans une bibliothèque connue. **Ce n’est pas bloquant** : un administrateur les examinera. |
| **Refus**                                       | Le fichier a une vraie erreur (voir §9). Il est refusé dès l’envoi, avec la raison.                                                                                  |

L’analyse réduit des risques mais n’est pas une certification de sécurité.

## 8. Domaines externes

Les services externes utilisés par votre build (polices, API, CDN, WebSockets…) sont **détectés automatiquement**. Vous n’avez **rien à déclarer**. Après l’envoi, vous voyez le nombre de domaines détectés et le rapport détaillé dans l’onglet **Version**. Un administrateur peut y laisser une observation ou demander une correction ; une correction demandée doit être traitée avant l’approbation.

Une fois en ligne, votre application peut appeler tout service en **HTTPS** ou **WSS**. Les appels en HTTP sont forcés en HTTPS : un service qui ne le prend pas en charge ne répondra pas. Les plugins (`<object>`, `<embed>`) et l’intégration de votre application dans une autre page sont bloqués.

## 9. Erreurs fréquentes

| Message                                         | Solution                                                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html est absent de la racine du build`   | Vous avez compressé le mauvais dossier (sources, ou un niveau de trop). Compressez le dossier de production.                                                  |
| `Fichier exécutable interdit`                   | Retirez les fichiers `.php`, `.exe`, `.sh`, `.bat`, `.apk`, `.dll`… Seuls les fichiers Web sont acceptés.                                                     |
| Manifeste ou service worker absent              | Ajoutez-les (§3). Sinon, PWA Store propose de **les générer** : acceptez dans la fenêtre « Fichiers PWA manquants » pour que l’application reste installable. |
| `Champ manifest manquant` / icône introuvable   | Complétez le manifeste ; vérifiez le chemin de chaque icône.                                                                                                  |
| Fichier trop volumineux / compression excessive | Retirez les fichiers inutiles (cartes de sources, vidéos lourdes) et vérifiez la taille du ZIP.                                                               |
| Icône refusée                                   | Image carrée d’au moins 192 px, PNG/JPG/WebP, 1 Mo maximum.                                                                                                   |
| Contrôle du lien échoué                         | Vérifiez que l’adresse est publique, en HTTPS, et qu’elle répond.                                                                                             |

## 10. Liste de vérification avant soumission

- [ ] Profil développeur vérifié, pièce d’identité valide
- [ ] Catégorie, description courte, description complète (≥ 30 caractères)
- [ ] Icône carrée déposée, au moins une capture d’écran
- [ ] Au moins une langue
- [ ] Lien officiel de la PWA, e-mail de contact
- [ ] Politique de confidentialité et données collectées
- [ ] ZIP : une version analysée « Prête à soumettre » ou avec fonctions sensibles à examiner — ou lien HTTPS qui répond

L’onglet **Récapitulatif** affiche votre fiche telle que les visiteurs la verront et liste ce qui manque, avec un lien vers l’onglet concerné.

## 11. Examen et décisions

Cliquez sur **Soumettre à validation**. Votre dossier est figé : un administrateur examine exactement ce que vous avez envoyé. Pendant l’examen, l’application ne peut pas être modifiée ; vous pouvez **retirer votre demande** pour la changer.

| Décision                  | Ce qui se passe                                                                |
| ------------------------- | ------------------------------------------------------------------------------ |
| **Approuvée**             | L’application est publiée immédiatement.                                       |
| **Corrections demandées** | Le motif s’affiche en haut de votre espace. Corrigez puis soumettez à nouveau. |
| **Refusée**               | Le motif est conservé. Vous pouvez corriger et soumettre une nouvelle demande. |

Vous êtes prévenu dans l’application et par e-mail. Toutes les demandes et décisions sont gardées dans l’onglet **Suivi**.

## 12. Publication

L’approbation met l’application en ligne aussitôt. Si la mise en ligne automatique n’a pas pu se faire (par exemple, hébergement des builds momentanément indisponible), un message vous le signale : choisissez **Publier maintenant** dans l’espace de l’application.

## 13. Mettre à jour la fiche ou envoyer une nouvelle version

- **Votre application reste en ligne** telle qu’elle a été approuvée.
- Modifiez la fiche (textes, icône, captures…) : les changements sont enregistrés **en attente**. Vous pouvez les annuler (« Annuler mes modifications »).
- ZIP : dans l’onglet **Version**, choisissez **Envoyer une version** (utilisez un nouveau numéro, par exemple `1.1.0`). L’ancienne version reste servie pendant l’examen.
- Soumettez la mise à jour depuis **Récapitulatif**. À l’approbation, les changements remplacent la fiche publique et la nouvelle version est mise en ligne.
- Une version antérieure approuvée peut être remise en ligne si besoin.

## 14. Exemple complet : SantéPlus (fictif)

1. **Création** : nom « SantéPlus », catégorie « Santé », fourniture par **ZIP**. Le brouillon est créé.
2. **Informations** : description courte « Trouvez la pharmacie de garde la plus proche » ; description complète ; langues français et anglais ; lien officiel `https://santeplus.example` ; e-mail `contact@santeplus.example`.
3. **Images** : icône 512 × 512 PNG, trois captures téléphone.
4. **Confidentialité** : politique `https://santeplus.example/confidentialite` ; données collectées : Localisation.
5. **Version** : `quasar build -m pwa`, compression de `dist/pwa/`, envoi de la version `1.0.0`. Analyse : « Prête à soumettre », 2 domaines externes détectés (une police Web et une API de cartes).
6. **Récapitulatif** : tout est vert ; **Soumettre à validation**.
7. **Décision** : l’administrateur demande une correction : « La capture 2 montre des données réelles de patients. » Remplacement de la capture, nouvelle soumission, **approbation** : SantéPlus est en ligne avec le badge « Hébergée par PWA Store ».
8. **Mise à jour** : version `1.1.0` avec un mode sombre et une nouvelle capture. La 1.0.0 reste en ligne jusqu’à l’approbation de la mise à jour.
