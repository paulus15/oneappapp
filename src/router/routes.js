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
        path: 'apps/:id',
        component: () => import('@/pages/store/AppDetailsPage.vue')
      },
      {
        path: 'developer',
        component: () => import('@/pages/developer/DeveloperConsolePage.vue')
      },
      {
        path: 'admin',
        component: () => import('@/pages/admin/AdminConsolePage.vue')
      },
      { path: 'login', component: () => import('@/pages/auth/LoginPage.vue') },
      {
        path: 'register',
        component: () => import('@/pages/auth/RegisterPage.vue')
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
