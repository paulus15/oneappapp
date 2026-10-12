# PWA Store

Marketplace d’applications Web existante, rebrandée sans changement des routes,
des contrats API ni des identifiants métier.

## Développement et builds

Utiliser Node 24.14.1 (voir `.nvmrc`).

```bash
nvm use
npm ci
npm ci --prefix src-pwa
npm run dev
npm run lint:check
npm run build
npm run build:pwa
```

Le build SPA se trouve dans `dist/spa`, le build installable dans `dist/pwa`.
Pour une mise en production, lancez le build avec `PWA_REQUIRE_API_URL=1` et `VITE_API_URL` renseignée : sans cette adresse, le build échoue au lieu de viser l’API locale `https://oneapp.test/api`.
Servir le dossier choisi avec le fallback des routes vers `index.html`.
La PWA nécessite HTTPS en production (localhost fonctionne pour les contrôles).
Les dépendances Workbox sont isolées dans `src-pwa/package.json` et son lockfile.

## Architecture et identité

Versions installées lors des vérifications : Quasar 2.21.4, Vue 3.5.40,
Quasar CLI Vite 3.0.1. Les routes existantes utilisent trois layouts :
`MainLayout` (catalogue et administration), `AuthLayout` (connexion/inscription)
et `DeveloperLayout` (console et publication).

- `src/css/quasar.variables.scss` : palette native Quasar.
- `src/css/theme.scss` : tokens PWA Store clairs/sombres, hérités aussi par les
  menus et dialogues téléportés dans le document.
- `src/css/app.scss` : composants, typographie Inter/Inter Tight, focus,
  transitions et réduction des animations.
- `src/boot/theme.js`, `src/composables/useTheme.js` : initialisation avec
  `Dark.set`, préférence système dynamique, choix persistant et synchronisation
  entre onglets. La clé historique `oneinstall-theme` reste compatible.
- `src/components/BrandLogo.vue` : logo réutilisable, icône compacte sur mobile.
- `public/brand/` : les deux PNG fournis, conservés à l’identique. Le fond clair
  du logo typographique est conservé pour ne pas dégrader son graphisme.
- `public/icons/`, `public/favicon.ico` : favicon, icônes d’installation,
  Apple Touch et variantes maskable dérivées du sac fourni.
- `src/layouts/*.vue` : logos, navigation, thème partagé et en-têtes.
- `src/pages/auth/*.vue`, `src/pages/store/*.vue`,
  `src/pages/developer/*.vue`, `src/pages/admin/AdminConsolePage.vue` et
  `src/pages/ErrorNotFound.vue` : libellés, couleurs sémantiques, formulaires,
  dialogues, footer et ajustements responsive. Les étapes de publication sont
  compactes sur smartphone ; la page 404 ne déborde plus horizontalement.
- `index.html`, `src/router/index.js`, `package.json` : identité du navigateur,
  titres de pages, description, Open Graph, langue et zoom accessible.
- `quasar.config.js`, `src-pwa/manifest.json`, `src-pwa/register-sw.js` : build
  PWA, manifest et enregistrement du Service Worker généré par Quasar/Workbox.

Aucun manifest ou Service Worker actif n’existait dans les sources au début de
l’intervention. Le mode PWA est maintenant disponible explicitement avec
`npm run build:pwa`. Le cache concerne les ressources de l’interface ; les
requêtes authentifiées de l’API ne font pas l’objet d’un cache ajouté ici.

Les URL `https://oneapp.test`, `VITE_API_URL`, les clés d’authentification,
`oneapp_search_history`, les identifiants d’applications et les formats de builds
sont conservés. Les références historiques restantes sont techniques, sans
libellé de marque visible. Aucun backend ni template d’email n’est présent dans
ce dépôt. Les modifications déjà présentes avant cette intervention ont été
conservées, notamment la logique de publication et les utilitaires média.

## Vérifications réalisées

- `npm run lint:check` : formatage et analyse statique.
- `npm run build` et `npm run build:pwa` : compilation de production et génération
  du Service Worker.
- Chrome headless / Playwright, aux largeurs 320, 768 et 1440 px, dans les deux
  thèmes : accueil, catalogue populaire, connexion, inscription, page 404,
  console développeur, création, édition, administration et fiche application.
- Contrôle du chargement des logos, titres de pages, absence de débordement du
  document et absence d’erreurs JavaScript sur ces parcours. Le carrousel de
  captures d’écran conserve son défilement horizontal interne.
- Vérification des couleurs des champs et du dialogue de téléversement en mode
  sombre ; contrôle des étapes de formulaire sur petit écran.
- Préférence système, changement manuel, conservation après rechargement et
  priorité du choix manuel sur le système.
- Connexion avec réponse API simulée, conservation du jeton, redirection des
  visiteurs et protection de l’administration selon le rôle.
- Manifest servi, Service Worker actif, rechargement hors ligne de la page de
  connexion et chargement des logos depuis le cache.
- Dimensions des icônes du manifest et comparaison SHA-256 des deux PNG
  originaux avec les fichiers fournis.
- `git diff --check` et recherche des anciennes marques visibles.

Les contrôles navigateur des données métier utilisent des réponses API simulées.
L’authentification réelle, l’envoi de fichiers, la modération côté serveur et
l’installation sur appareils physiques restent à valider avec le backend et
les appareils concernés. Le contrôle hors ligne porte sur l’interface déjà
mise en cache, pas sur la disponibilité des données de l’API.
