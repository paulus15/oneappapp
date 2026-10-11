const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: 'account',
        component: () => import('@/pages/account/AccountPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'developer/activate',
        component: () => import('@/pages/developer/DeveloperProfilePage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'admin/developers',
        component: () => import('@/pages/admin/DeveloperReviewPage.vue'),
        meta: { requiresAuth: true, adminOnly: true }
      },
      {
        path: '',
        component: () => import('@/pages/store/StoreCatalogPage.vue')
      },
      {
        path: 'recommended',
        component: () => import('@/pages/store/AppListPage.vue')
      },
      {
        path: 'trending',
        component: () => import('@/pages/store/AppListPage.vue')
      },
      {
        path: 'popular',
        component: () => import('@/pages/store/AppListPage.vue')
      },
      {
        path: 'apps/:id',
        component: () => import('@/pages/store/AppDetailsPage.vue')
      },
      {
        path: 'admin',
        component: () => import('@/pages/admin/AdminConsolePage.vue'),
        meta: { requiresAuth: true, adminOnly: true }
      }
    ]
  },

  // Auth pages under dedicated AuthLayout
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'verify-email',
        component: () => import('@/pages/auth/VerifyEmailPage.vue')
      },
      {
        path: 'login',
        component: () => import('@/pages/auth/LoginPage.vue'),
        meta: { guestOnly: true }
      },
      {
        path: 'register',
        component: () => import('@/pages/auth/RegisterPage.vue'),
        meta: { guestOnly: true }
      }
    ]
  },

  {
    path: '/developer',
    component: () => import('@/layouts/DeveloperLayout.vue'),
    children: [
      {
        path: 'profile',
        component: () => import('@/pages/developer/DeveloperProfilePage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      },
      {
        path: 'apps/:id/publication',
        component: () => import('@/pages/developer/PublicationPage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      },
      {
        path: '',
        component: () => import('@/pages/developer/DeveloperConsolePage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      },
      {
        path: 'apps/create',
        component: () => import('@/pages/developer/CreateAppPage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      },
      {
        path: 'apps/:id/edit',
        component: () => import('@/pages/developer/EditAppPage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue')
  }
]

export default routes
