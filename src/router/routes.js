const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
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
        path: '',
        component: () => import('@/pages/developer/DeveloperConsolePage.vue'),
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
