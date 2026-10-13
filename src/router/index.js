import { ui } from '@/i18n/text'
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
import { isDeveloperArea, resolveAccess } from './guards.js'

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
    if (event.matches && isDeveloperArea(Router.currentRoute.value.path))
      Router.replace('/account')
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
    return resolveAccess(to, auth, { isMobile: !!mobileView?.matches })
  })

  function updateTitle(to) {
    const titles = {
      get '/'() {
        return ui('Découvrez les applications Web')
      },
      get '/popular'() {
        return ui('Applications populaires')
      },
      get '/recommended'() {
        return ui('Applications recommandées')
      },
      get '/trending'() {
        return ui('Tendances')
      },
      get '/login'() {
        return ui('Connexion')
      },
      get '/register'() {
        return ui('Inscription')
      },
      get '/forgot-password'() {
        return ui('Mot de passe oublié')
      },
      get '/verify-email'() {
        return ui('Code de confirmation')
      },
      get '/developer'() {
        return ui('Espace développeur')
      },
      get '/developer/stats'() {
        return ui('Statistiques')
      },
      get '/developer/reviews'() {
        return ui('Avis et retours')
      },
      get '/developer/lab'() {
        return ui('PWA Lab')
      },
      get '/developer/apps/create'() {
        return ui('Publier une application')
      },
      get '/admin'() {
        return ui('Administration')
      },
      get '/account'() {
        return ui('Mon compte')
      },
      get '/developer/activate'() {
        return ui('Devenir développeur')
      },
      get '/developers'() {
        return ui('Portail développeur')
      },
      get '/categories'() {
        return ui('Catégories')
      },
      get '/contact'() {
        return ui('Contact')
      },
      get '/about'() {
        return ui('À propos')
      },
      get '/help'() {
        return ui('Centre d’aide')
      },
      get '/terms'() {
        return ui('Conditions d’utilisation')
      },
      get '/privacy'() {
        return ui('Politique de confidentialité')
      },
      get '/publishing-rules'() {
        return ui('Règles de publication')
      },
      get '/developer/profile'() {
        return ui('Profil développeur et quotas')
      },
      get '/admin/developers'() {
        return ui('Vérification des développeurs')
      },
      get '/admin/countries'() {
        return ui('Répartition par pays')
      },
      get '/admin/apps'() {
        return ui('Modération des applications')
      },
      get '/admin/users'() {
        return ui('Utilisateurs')
      },
      get '/admin/categories'() {
        return ui('Catégories')
      },
      get '/admin/audit'() {
        return ui('Journal d’audit')
      },
      get '/admin/collections'() {
        return ui('Sélections éditoriales')
      },
      get '/admin/reports'() {
        return ui('Signalements')
      },
      get '/admin/feedback'() {
        return ui('Retours sur la plateforme')
      },
      get '/admin/reviews'() {
        return ui('Modération des avis')
      },
      get '/admin/settings'() {
        return ui('Paramètres et quotas')
      },
      get '/notifications'() {
        return ui('Notifications')
      }
    }
    const title =
      titles[to.path] ||
      (to.path.startsWith('/developer/apps/')
        ? ui('Modifier une application')
        : to.path.startsWith('/apps/')
          ? ui('Fiche application')
          : {
              get categories() {
                return ui('Catégorie')
              },
              get collections() {
                return ui('Sélection')
              },
              get publishers() {
                return ui('Éditeur')
              }
            }[to.path.split('/')[1]] || ui('Page introuvable'))
    document.title = `${title} · PWA Store`
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', document.title)
  }
  Router.afterEach(updateTitle)
  watch(currentLocale, () => updateTitle(Router.currentRoute.value))

  return Router
})
