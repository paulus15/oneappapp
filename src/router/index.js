import { applySeo, routeSeo } from '@/utils/seo'
import { watch } from 'vue'
import { currentLocale } from '@/i18n'
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

  Router.beforeEach(async to => {
    const auth = useAuthStore()
    if (!auth.hydrated) {
      try {
        // Anonymous visitors (signed out last time) skip GET /auth/me.
        await auth.restoreSession()
      } catch {
        if (to.meta.requiresAuth && to.path !== '/account') return '/account'
      }
    }
    return resolveAccess(to, auth)
  })

  Router.onError((_error, to) => {
    if (!to?.path?.startsWith('/errors/')) {
      Router.replace({
        path: '/errors/500',
        query: { redirect: to?.fullPath || '/' }
      }).catch(() => {})
    }
  })

  function updateTitle(to) {
    applySeo(routeSeo(to, currentLocale()))
  }
  Router.afterEach(updateTitle)
  watch(currentLocale, () => updateTitle(Router.currentRoute.value))

  return Router
})
