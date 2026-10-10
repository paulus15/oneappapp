import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'

import routes from './routes.js'

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

  Router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('auth_token')
    const userJson = localStorage.getItem('user')
    const user = userJson ? JSON.parse(userJson) : null
    const isAuthenticated = !!token

    if (to.meta.guestOnly && isAuthenticated) {
      next('/')
    } else if (to.meta.requiresAuth && !isAuthenticated) {
      next('/login')
    } else if (
      to.meta.developerOnly &&
      user?.role !== 'developer' &&
      user?.role !== 'admin'
    ) {
      next('/')
    } else if (to.meta.adminOnly && user?.role !== 'admin') {
      next('/')
    } else {
      next()
    }
  })

  Router.afterEach(to => {
    const titles = {
      '/': 'Découvrez les applications Web',
      '/popular': 'Applications populaires',
      '/recommended': 'Applications recommandées',
      '/trending': 'Tendances',
      '/login': 'Connexion',
      '/register': 'Inscription',
      '/developer': 'Espace développeur',
      '/developer/apps/create': 'Publier une application',
      '/admin': 'Administration'
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
