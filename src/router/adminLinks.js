import { ui } from '@/i18n/text'
// One list drives both the admin navigation and the permission each page requires.
export const adminLinks = [
  {
    to: '/admin/publishers',
    get label() {
      return ui('Entreprises et individuels')
    },
    icon: 'business',
    permission: 'catalog.manage'
  },
  {
    to: '/admin',
    get label() {
      return ui('Tableau de bord')
    },
    icon: 'space_dashboard'
  },
  {
    to: '/admin/requests',
    get label() {
      return ui('Demandes de publication')
    },
    icon: 'fact_check',
    permission: 'apps.moderate'
  },
  {
    to: '/admin/apps',
    get label() {
      return ui('Applications')
    },
    icon: 'apps',
    permission: 'apps.moderate'
  },
  {
    to: '/admin/developers',
    get label() {
      return ui('Développeurs')
    },
    icon: 'verified_user',
    permission: 'developers.review'
  },
  {
    to: '/admin/users',
    get label() {
      return ui('Utilisateurs')
    },
    icon: 'group',
    permission: 'users.manage'
  },
  {
    to: '/admin/reports',
    get label() {
      return ui('Signalements')
    },
    icon: 'flag',
    permission: 'reports.handle'
  },
  {
    to: '/admin/feedback',
    get label() {
      return ui('Retours sur la plateforme')
    },
    icon: 'forum',
    permission: 'reports.handle'
  },
  {
    to: '/admin/beta',
    get label() {
      return ui('Tests bêta')
    },
    icon: 'biotech',
    permission: 'apps.moderate',
    // Shown only when the platform tool is on.
    tool: 'beta'
  },
  {
    to: '/admin/reviews',
    get label() {
      return ui('Avis')
    },
    icon: 'reviews',
    permission: 'reviews.moderate'
  },
  {
    to: '/admin/categories',
    get label() {
      return ui('Catégories')
    },
    icon: 'category',
    permission: 'catalog.manage'
  },
  {
    to: '/admin/collections',
    get label() {
      return ui('Sélections')
    },
    icon: 'collections_bookmark',
    permission: 'catalog.manage'
  },
  {
    to: '/admin/countries',
    get label() {
      return ui('Pays')
    },
    icon: 'public',
    permission: 'audit.view'
  },
  {
    to: '/admin/settings',
    get label() {
      return ui('Paramètres')
    },
    icon: 'tune',
    permission: 'settings.manage'
  },
  {
    to: '/admin/audit',
    get label() {
      return ui('Journal')
    },
    icon: 'history',
    permission: 'audit.view'
  }
]

export const adminPermissionFor = path =>
  adminLinks.find(link => link.to === path)?.permission
