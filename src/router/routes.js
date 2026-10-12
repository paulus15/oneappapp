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
        path: 'admin/countries',
        component: () => import('@/pages/admin/CountryOverviewPage.vue'),
        meta: { requiresAuth: true, adminOnly: true, permission: 'audit.view' }
      },
      {
        path: 'admin/developers',
        component: () => import('@/pages/admin/DeveloperReviewPage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'developers.review'
        }
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
        path: 'developers',
        component: () => import('@/pages/store/DevelopersPortalPage.vue')
      },
      {
        path: 'categories',
        component: () => import('@/pages/store/CategoriesPage.vue')
      },
      {
        path: 'categories/:slug',
        component: () => import('@/pages/store/AppCollectionPage.vue')
      },
      {
        path: 'collections/:slug',
        component: () => import('@/pages/store/AppCollectionPage.vue')
      },
      {
        path: 'publishers/:id(\\d+)',
        component: () => import('@/pages/store/PublisherPage.vue')
      },
      {
        path: 'contact',
        component: () => import('@/pages/static/ContactPage.vue')
      },
      {
        path: 'about',
        component: () => import('@/pages/static/StaticPage.vue'),
        meta: { page: 'about' }
      },
      {
        path: 'help',
        component: () => import('@/pages/static/StaticPage.vue'),
        meta: { page: 'help' }
      },
      {
        path: 'terms',
        component: () => import('@/pages/static/StaticPage.vue'),
        meta: { page: 'terms' }
      },
      {
        path: 'privacy',
        component: () => import('@/pages/static/StaticPage.vue'),
        meta: { page: 'privacy' }
      },
      {
        path: 'publishing-rules',
        component: () => import('@/pages/static/StaticPage.vue'),
        meta: { page: 'publishing-rules' }
      },
      {
        path: 'apps/:id',
        component: () => import('@/pages/store/AppDetailsPage.vue')
      },
      {
        path: 'admin',
        component: () => import('@/pages/admin/AdminDashboardPage.vue'),
        meta: { requiresAuth: true, adminOnly: true }
      },
      {
        path: 'admin/requests',
        component: () => import('@/pages/admin/AdminRequestsPage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'apps.moderate'
        }
      },
      {
        path: 'admin/requests/:id',
        component: () => import('@/pages/admin/AdminRequestPage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'apps.moderate'
        }
      },
      {
        path: 'admin/apps',
        component: () => import('@/pages/admin/AdminConsolePage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'apps.moderate'
        }
      },
      {
        path: 'admin/users',
        component: () => import('@/pages/admin/AdminUsersPage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'users.manage'
        }
      },
      {
        path: 'admin/categories',
        component: () => import('@/pages/admin/AdminCategoriesPage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'catalog.manage'
        }
      },
      {
        path: 'admin/collections',
        component: () => import('@/pages/admin/AdminCollectionsPage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'catalog.manage'
        }
      },
      {
        path: 'admin/reports',
        component: () => import('@/pages/admin/AdminReportsPage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'reports.handle'
        }
      },
      {
        path: 'admin/reviews',
        component: () => import('@/pages/admin/AdminReviewsPage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'reviews.moderate'
        }
      },
      {
        path: 'admin/settings',
        component: () => import('@/pages/admin/AdminSettingsPage.vue'),
        meta: {
          requiresAuth: true,
          adminOnly: true,
          permission: 'settings.manage'
        }
      },
      {
        path: 'notifications',
        component: () => import('@/pages/account/NotificationsPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'admin/audit',
        component: () => import('@/pages/admin/AdminAuditPage.vue'),
        meta: { requiresAuth: true, adminOnly: true, permission: 'audit.view' }
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
        path: 'forgot-password',
        component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
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
        path: 'apps/:id',
        component: () => import('@/pages/developer/AppWorkspacePage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      },
      // Former addresses, still used by notifications and bookmarks.
      {
        path: 'apps/:id/publication',
        redirect: to => ({
          path: `/developer/apps/${to.params.id}`,
          query: { tab: 'submit' }
        })
      },
      {
        path: 'apps/:id/edit',
        redirect: to => `/developer/apps/${to.params.id}`
      },
      {
        path: '',
        component: () => import('@/pages/developer/DeveloperConsolePage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      },
      {
        path: 'stats',
        component: () => import('@/pages/developer/DeveloperStatsPage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      },
      {
        path: 'reviews',
        component: () => import('@/pages/developer/DeveloperReviewsPage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      },
      {
        path: 'lab',
        component: () => import('@/pages/developer/PwaLabPage.vue'),
        meta: { requiresAuth: true, developerOnly: true }
      },
      {
        path: 'apps/create',
        component: () => import('@/pages/developer/NewAppPage.vue'),
        meta: {
          requiresAuth: true,
          developerOnly: true,
          requiresValidatedDeveloper: true
        }
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
