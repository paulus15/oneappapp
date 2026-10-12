# Signature de mouvement

Le mouvement de PWA Store raconte un seul geste : **installer une application**. Une icône arrive vite, se pose, et ne bouge plus.

## Jetons

| Jeton                             | Valeur                              | Usage                                                                       |
| --------------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `--motion-settle` / `EASE.settle` | `cubic-bezier(0.16, 1, 0.3, 1)`     | Toute entrée et tout déplacement : arrive vite, se pose en douceur          |
| `--motion-drop` / `EASE.drop`     | `cubic-bezier(0.34, 1.36, 0.64, 1)` | Le léger rebond d’un élément « installé » (icône, tuile, cœur, soleil/lune) |
| `--motion-fast` / `DURATION.fast` | 160 ms                              | Réponses aux actions : pression, survol, fondu                              |
| `--motion-base` / `DURATION.base` | 420 ms                              | Éléments qui entrent : tuiles, micro-interactions                           |
| `--motion-hero` / `DURATION.hero` | 900 ms                              | Réservé à l’ouverture de l’accueil                                          |

CSS : `src/css/app.scss`. GSAP : `src/motion/signature.js` (`loadGsap()` charge GSAP, ScrollTrigger et CustomEase à la demande et enregistre les deux courbes).

## Où ça bouge, et pourquoi

| Moment                                        | Fichier                                              | Ce que ça raconte                                                                                       |
| --------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Ouverture de l’accueil (une fois par session) | `src/composables/useHeroIntro.js`                    | Les plateformes convergent vers le téléphone, l’icône PWA s’y dépose, la promesse monte ligne par ligne |
| Grilles d’applications                        | `AppGrid.vue` + `.motion-cascade`                    | Les tuiles se remplissent dans l’ordre de lecture, comme un écran d’accueil                             |
| Chiffres clés                                 | directive `v-count-up` (`src/directives/countUp.js`) | Les compteurs (statistiques, files admin) montent jusqu’à leur valeur quand ils deviennent visibles     |
| Carte d’application                           | `AppCard.vue`                                        | Survol : l’icône se soulève ; appui : la tuile cède sous le doigt                                       |
| Favori                                        | `AppDetailsPage.vue` (`.motion-pop`)                 | Le cœur se remplit avec un petit rebond                                                                 |
| Code OTP accepté                              | `VerifyEmailPage.vue`                                | Un trait de validation se dessine avant de continuer                                                    |
| Nouvelle notification                         | `NotificationBell.vue` (`.motion-ring`)              | La cloche oscille une fois                                                                              |
| Thème                                         | `MainLayout.vue` (`theme-swap`)                      | Le soleil se couche pendant que la lune se lève                                                         |
| Publication                                   | `PublicationPage.vue` (`.motion-launch`)             | La fusée décolle pendant l’envoi                                                                        |
| Changement de page                            | `app.scss` (`page-*`)                                | Fondu court, sans effet de scène                                                                        |

## Règles

1. **Un seul moment fort** : l’ouverture de l’accueil. Aucune autre page n’a de séquence d’entrée.
2. **Rien en boucle** une fois l’entrée terminée (sauf l’indicateur de publication pendant l’envoi).
3. **Défilement** : uniquement les grilles d’applications et les compteurs ; pas de fondus génériques ni de parallaxe.
4. **Seulement `transform` et `opacity`**, pour rester fluide sur mobile.
5. **`prefers-reduced-motion`** : tout est désactivé et le contenu s’affiche directement (vérifié par les tests de bout en bout, qui tournent dans les deux modes).
6. Le contenu n’est **jamais conditionné** à l’animation : l’intro a une sécurité qui affiche tout au bout de 2,5 s si GSAP ne charge pas.
7. Avec GSAP, si un élément a un `transform` CSS dans son état initial, fixer explicitement les autres axes (`y: 0`) : GSAP relit le `transform` calculé et le conserverait.
