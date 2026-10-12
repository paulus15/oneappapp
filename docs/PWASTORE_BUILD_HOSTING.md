# Héberger les builds sur des origines isolées

Ce guide active la **méthode B** (dépôt d’un build) en production. Tant qu’il n’est pas appliqué, les builds peuvent être déposés, analysés et revus, mais pas servis : l’API `GET /api/platform` renvoie `build_hosting: false` et l’interface le signale aux développeurs.

## Principe

Chaque application publiée est servie sur son propre sous-domaine :

```
https://pwa-{id}.<PWA_RUNTIME_DOMAIN>/
```

- Une origine par application : une PWA ne peut ni lire les données d’une autre, ni les cookies ou le stockage du Store.
- Le domaine d’exécution doit être **distinct du domaine du Store**, idéalement un domaine enregistré à part (ex. Store sur `pwastore.example`, builds sur `pwastore-apps.example`). Le code refuse un domaine d’exécution égal au domaine du Store ou à l’un de ses sous-domaines.
- Le middleware `ServePwaRuntime` sert uniquement la version **active, approuvée et analysée** d’une application **publiée** dont l’éditeur est vérifié, en lecture seule (`GET`/`HEAD`), sans exécuter de code côté serveur et sans accès aux routes `/api` du Store.
- L’application se lance seule : le Store l’ouvre dans un nouvel onglet sur son origine, son manifeste et son service worker y fonctionnent, elle est installable. Les routes sans fichier (mode _history_, ex. `/commandes/12`) reçoivent `index.html`.
- Publier une application par build (« Publier dans le Store ») met automatiquement en ligne sa dernière version approuvée si aucune ne l’est encore. « Publier cette version » sert ensuite à la remplacer.
- En-têtes envoyés : `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (les clés d’API restreintes par site restent utilisables), et une CSP de compatibilité (`PwaRuntime::csp`).

### Politique CSP des builds

L’origine isolée ne contient rien du Store : la CSP n’y protège pas le Store, elle protège les utilisateurs de l’application. Une liste blanche déduite de l’analyse statique cassait les applications réelles (polices Google, websocket Pusher, Firebase, tuiles de carte construites à l’exécution) : 20 blocages mesurés sur un build Quasar réel. La politique appliquée :

- autorise tout service **HTTPS** / **WSS** (`upgrade-insecure-requests`, aucun HTTP) ;
- conserve `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` (pas d’intégration dans une autre page) ;
- n’autorise `'unsafe-eval'` que si un administrateur a reconnu `eval()` / `new Function()` lors de la levée de quarantaine.

Les ressources externes détectées restent inventoriées et soumises à la revue ; la CSP proposée dans le rapport reste indicative.

## 0. En local (Valet)

```bash
cd /chemin/vers/oneapp
valet link oneapp-pwa
valet secure oneapp-pwa   # certificat *.oneapp-pwa.test, demande sudo
```

Puis `PWA_RUNTIME_DOMAIN=oneapp-pwa.test` dans `.env` et `php artisan config:clear`. Les builds sont servis sur `https://pwa-{id}.oneapp-pwa.test/`, une origine distincte de `oneapp.test`.

## 1. Choisir le domaine

Exemple utilisé ci-dessous : `pwastore-apps.example` (à remplacer).

## 2. DNS

Créer un enregistrement générique vers le serveur Laravel :

```
*.pwastore-apps.example.   300   IN   A     <IP du serveur>
*.pwastore-apps.example.   300   IN   AAAA  <IPv6, si disponible>
```

## 3. Certificat TLS générique

Un certificat `*.pwastore-apps.example` est nécessaire. Avec Let’s Encrypt, un certificat générique exige le challenge **DNS-01** (pas HTTP-01), par exemple :

```bash
certbot certonly --manual --preferred-challenges dns \
  -d '*.pwastore-apps.example'
```

Automatiser le renouvellement avec le plugin DNS de votre fournisseur (Cloudflare, OVH, etc.).

## 4. Serveur web (nginx)

Les requêtes vers les sous-domaines d’exécution sont envoyées à la même application Laravel ; le middleware les reconnaît à leur nom d’hôte.

```nginx
server {
    listen 443 ssl http2;
    server_name ~^pwa-\d+\.pwastore-apps\.example$;

    ssl_certificate     /etc/letsencrypt/live/pwastore-apps.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pwastore-apps.example/privkey.pem;

    root /var/www/oneapp/public;
    index index.php;

    # Aucun fichier du dossier public du Store n'est servi directement sur ces origines.
    location / {
        rewrite ^ /index.php last;
    }

    location = /index.php {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root/index.php;
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;
    }
}
```

## 5. Variables d’environnement (backend)

```
PWA_RUNTIME_DOMAIN=pwastore-apps.example
PWA_FRONTEND_URL=https://pwastore.example
APP_URL=https://api.pwastore.example
```

Puis :

```bash
php artisan config:cache
```

## 6. Vérifications

1. `GET https://api.pwastore.example/api/platform` → `{"build_hosting": true, ...}`.
2. Publier une application de test par build : dépôt et analyse, soumission, puis une seule approbation dans le dossier admin, qui déploie et publie.
3. Ouvrir `https://pwa-<id>.pwastore-apps.example/` : la PWA s’affiche.
4. `https://pwa-<id>.pwastore-apps.example/api/apps` → 404 (aucun accès à l’API depuis une origine d’exécution).
5. Suspendre l’éditeur ou l’application : l’origine répond 404.
6. Vérifier les en-têtes (`curl -I`) : CSP, `nosniff`, `Referrer-Policy`.

## Limites connues

- Pas d’analyse antivirus des archives : les contrôles portent sur la structure (chemins, liens symboliques, taux de compression, extensions exécutables, fonctions sensibles ; les domaines externes sont détectés et présentés à l’administrateur, sans déclaration manuelle). Un antivirus (ClamAV) peut être ajouté si l’infrastructure le permet.
- `Cache-Control: no-store` est appliqué pour l’instant à tous les fichiers servis ; un cache long sur les fichiers versionnés pourra être activé après mesure.
