import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'

import routes from './routes.js'
import { useAuthStore } from '@/stores/auth'
import { Screen } from 'quasar'

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

  Router.beforeEach(async to => {
    const auth = useAuthStore()
    if (auth.token && !auth.hydrated) {
      try {
        await auth.fetchUser()
      } catch {
        if (to.meta.requiresAuth && to.path !== '/account') return '/account'
      }
    }
    if (to.meta.guestOnly && auth.isAuthenticated) return '/account'
    if (to.meta.requiresAuth && !auth.isAuthenticated)
      return { path: '/login', query: { redirect: to.fullPath } }
    if (to.meta.adminOnly && !auth.isAdmin) return '/account'
    if (to.meta.developerOnly && Screen.lt.md) return '/account'
    if (to.meta.developerOnly && !auth.isDeveloper) return '/developer/activate'
    return true
  })

  Router.afterEach(to => {
    const titles = {
      '/': 'Découvrez les applications Web',
      '/popular': 'Applications populaires',
      '/recommended': 'Applications recommandées',
      '/trending': 'Tendances',
      '/login': 'Connexion',
      '/register': 'Inscription',
      '/verify-email': 'Code de confirmation',
      '/developer': 'Espace développeur',
      '/developer/apps/create': 'Publier une application',
      '/admin': 'Administration',
      '/account': 'Mon compte',
      '/developer/activate': 'Devenir développeur',
      '/developer/profile': 'Profil développeur et quotas',
      '/admin/developers': 'Vérification des développeurs'
    }
    const title =
      titles[to.path] ||
      (to.path.startsWith('/developer/apps/')
        ? 'Modifier une application'
        : to.path.startsWith('/apps/')
          ? 'Fiche application'
          : 'Page introuvable')
    document.title = `${title} · PWA Store`
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', document.title)
  })

  return Router
})
