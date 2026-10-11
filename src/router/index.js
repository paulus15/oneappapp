import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'

import routes from './routes.js'
import { useAuthStore } from '@/stores/auth'
import { resolveAccess } from './guards.js'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  })

  const mobileView =
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)')
      : null
  mobileView?.addEventListener('change', event => {
    if (
      event.matches &&
      Router.currentRoute.value.path.startsWith('/developer')
    )
      Router.replace('/account')
  })
  Router.beforeEach(async to => {
    const auth = useAuthStore()
    if (auth.token && !auth.hydrated) {
      try {
        await auth.fetchUser()
      } catch {
        if (to.meta.requiresAuth && to.path !== '/account') return '/account'
      }
    }
    return resolveAccess(to, auth, { isMobile: !!mobileView?.matches })
  })

  Router.afterEach(to => {
    const titles = {
      '/': 'Découvrez les applications Web',
      '/popular': 'Applications populaires',
      '/recommended': 'Applications recommandées',
      '/trending': 'Tendances',
      '/login': 'Connexion',
      '/register': 'Inscription',
      '/forgot-password': 'Mot de passe oublié',
      '/verify-email': 'Code de confirmation',
      '/developer': 'Espace développeur',
      '/developer/stats': 'Statistiques',
      '/developer/reviews': 'Avis et retours',
      '/developer/apps/create': 'Publier une application',
      '/admin': 'Administration',
      '/account': 'Mon compte',
      '/developer/activate': 'Devenir développeur',
      '/developers': 'Portail développeur',
      '/categories': 'Catégories',
      '/contact': 'Contact',
      '/about': 'À propos',
      '/help': 'Centre d’aide',
      '/terms': 'Conditions d’utilisation',
      '/privacy': 'Politique de confidentialité',
      '/publishing-rules': 'Règles de publication',
      '/developer/profile': 'Profil développeur et quotas',
      '/admin/developers': 'Vérification des développeurs',
      '/admin/countries': 'Répartition par pays',
      '/admin/apps': 'Modération des applications',
      '/admin/users': 'Utilisateurs',
      '/admin/categories': 'Catégories',
      '/admin/audit': 'Journal d’audit',
      '/admin/collections': 'Sélections éditoriales',
      '/admin/reports': 'Signalements',
      '/admin/reviews': 'Modération des avis'
    }
    const title =
      titles[to.path] ||
      (to.path.startsWith('/developer/apps/')
        ? 'Modifier une application'
        : to.path.startsWith('/apps/')
          ? 'Fiche application'
          : {
              categories: 'Catégorie',
              collections: 'Sélection',
              publishers: 'Éditeur'
            }[to.path.split('/')[1]] || 'Page introuvable')
    document.title = `${title} · PWA Store`
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', document.title)
  })

  return Router
})
