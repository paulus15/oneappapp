# Authentification par cookie — validation frontend

Le frontend utilise le mode cookie prévu par le middleware Laravel `AuthCookie`. La compatibilité Bearer conservée par le backend sert aux clients qui l’utilisent explicitement ; le frontend navigateur n’ajoute plus cet en-tête.

## Configuration

L’instance `api` de `src/boot/axios.js` utilise l’URL publique configurée au build (`https://api.pwastore.online/api` en production), `withCredentials: true` et `X-PWA-Auth: cookie`. Elle refuse les URL hors de l’API HTTPS configurée, retire tout Authorization et s’applique aussi aux réponses `blob` des justificatifs, exports et ZIP. L’instance Axios générale reste indépendante.

L’API et le frontend doivent être servis en HTTPS, y compris en développement. L’origine du navigateur doit correspondre exactement à `PWA_FRONTEND_URL`, sans changement de protocole, d’hôte ou de port. Avec le cookie `SameSite=Lax` du backend actuel, prévoir des origines du même site (en production `pwastore.online` et `api.pwastore.online`).

Côté backend :

- `PWA_FRONTEND_URL=https://pwastore.online` en production.
- CORS autorise cette origine exacte et les credentials (`Access-Control-Allow-Credentials: true`).
- La prérequête OPTIONS autorise notamment `X-PWA-Auth`, `Content-Type` et `X-Country`.
- Le serveur émet le cookie `__Host-pwastore_auth` avec `Secure`, `HttpOnly`, `Path=/` et sans `Domain`.
- Si TLS est terminé par un proxy, Laravel doit reconnaître correctement HTTPS ; gérer la confiance des proxies côté serveur.

`HttpOnly` et `Secure` sont des attributs imposés **par la réponse backend** : aucun code frontend ne peut prouver à lui seul leur présence en production.

## État utilisateur et stockage

Le store n’a plus de propriété `token`. Les réponses de connexion, validation OTP et réinitialisation sont acceptées à partir de leur utilisateur, sans exiger de jeton. Les anciennes clés `auth_token`, `access_token`, `token`, `user` et `auth` sont supprimées du stockage local et de session. Aucun plugin de persistance du store d’authentification n’est utilisé.

Les informations utiles au défi OTP sont conservées séparément pour permettre un rechargement de la page. Ce défi n’est pas une session authentifiée et sa persistance exclut les champs de jeton. Les préférences de thème, de langue et de pays restent conservées. Un indice `pwa-session` peut aussi mémoriser un état connecté/déconnecté, sans contenir de secret ni accorder d’accès. L’optimisation présente dans le dépôt consulte `/auth/me` au chargement si cet indice est connecté ou inconnu ; une valeur déconnectée évite cet appel jusqu’à une nouvelle connexion.

Une réponse 401 vide l’utilisateur. Un code OTP invalide ne supprime pas le défi encore nécessaire à une nouvelle tentative. Une réponse `/auth/me` arrivée après une déconnexion ne peut pas rouvrir l’état utilisateur.

La déconnexion appelle `/auth/logout` avant de vider le store. Sur une panne réseau ou une erreur serveur, elle signale l’échec et ne prétend pas avoir révoqué le cookie. Un 401 indique une session déjà invalide et permet de terminer la déconnexion locale.

## Parcours à exécuter avant production

Utiliser un compte de test et un environnement HTTPS. Dans les outils développeur, onglets **Network** et **Application / Storage**, vérifier les points suivants sans copier ni partager la valeur du cookie :

| Parcours                                  | Résultat attendu                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Connexion simple                          | Réponse sans `access_token`, cookie HttpOnly/Secure, affichage du compte.                                                                   |
| Connexion avec OTP                        | L’utilisateur reste anonyme avant le code ; la validation ouvre la session sans jeton JavaScript. Un code incorrect conserve le défi.       |
| Rechargement après connexion              | Le compte est restauré via `/auth/me` et le cookie, sans lecture de jeton dans le stockage.                                                 |
| Mot de passe oublié puis réinitialisation | Code reçu, nouveau mot de passe accepté, session reconnue sans `access_token`.                                                              |
| Justificatif privé                        | La requête `/developer-documents/<id>` transmet les cookies et `X-PWA-Auth: cookie`, sans Authorization ; le fichier téléchargé est valide. |
| Expiration / révocation de session        | Une requête protégée répond 401, l’état utilisateur se vide, une page protégée revient à la connexion.                                      |
| Déconnexion                               | `/auth/logout` reçoit le cookie, le serveur l’expire, le store se vide ; un rechargement ne restaure pas le compte.                         |
| Déconnexion hors ligne                    | Message d’échec explicite ; rétablir le réseau et réessayer pour supprimer réellement la session.                                           |
| Stockage JavaScript                       | Aucun jeton dans localStorage, sessionStorage ou le store Pinia. `document.cookie` ne donne pas accès au cookie HttpOnly.                   |
| Navigation et langues                     | La langue du compte, les redirections et les permissions restent cohérentes.                                                                |

Les tests unitaires simulent les réponses API et vérifient ces règles côté frontend. Les tests navigateur sont lancés manuellement avec la préparation HTTPS du [plan de test](PWASTORE_TEST_PLAN.md#8-validation-du-mode-cookie-https). Aucun résultat de test simulé ne remplace la vérification des attributs du vrai cookie dans le navigateur.

## Déploiement et Nginx

Après configuration du serveur, lancer `python3 scripts/deploy/check_runtime.py` pour vérifier le mode cookie sur un endpoint public, le CORS avec credentials, la prérequête OPTIONS, le cache et les en-têtes de sécurité. Ce contrôle complémentaire est indépendant du déploiement statique et ne connecte pas de compte de production.

Le snippet `deploy/nginx/pwastore-security-headers.conf` doit être installé sur le VPS et inclus dans chaque `location` qui définit `add_header`. Le contrôle complémentaire vérifie aussi les principaux en-têtes de sécurité. Les constats R5/R6 concernent le backend ; aucun changement frontend n’est nécessaire pour ces points. Les anciens ZIP exportés avec un ancien domaine SDK doivent être inspectés et leur snippet corrigé puis republié si nécessaire.

Références : [configuration Axios](https://axios-http.com/docs/req_config), [héritage des add_header Nginx](https://nginx.org/en/docs/http/ngx_http_headers_module.html).
