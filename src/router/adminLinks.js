import { ui } from '@/i18n/text'

// Sections of the admin sidebar, in display order.
export const ADMIN_GROUPS = [
  {
    key: 'pilot',
    get label() {
      return ui('Pilotage')
    }
  },
  {
    key: 'moderation',
    get label() {
      return ui('Modération')
    }
  },
  {
    key: 'catalog',
    get label() {
      return ui('Catalogue')
    }
  },
  {
    key: 'community',
    get label() {
      return ui('Communauté')
    }
  },
  {
    key: 'platform',
    get label() {
      return ui('Plateforme')
    }
  }
]

// One list drives the admin navigation (tabs and sidebar) and the permission each page
// requires. `todo` names the overview counter shown as a badge next to the link.
export const adminLinks = [
  {
    to: '/admin',
    get label() {
      return ui('Tableau de bord')
    },
    icon: 'space_dashboard',
    group: 'pilot'
  },
  {
    to: '/admin/requests',
    get label() {
      return ui('Demandes de publication')
    },
    icon: 'fact_check',
    permission: 'apps.moderate',
    group: 'moderation',
    todo: 'publication_requests_pending'
  },
  {
    to: '/admin/apps',
    get label() {
      return ui('Applications')
    },
    icon: 'apps',
    permission: 'apps.moderate',
    group: 'moderation'
  },
  {
    to: '/admin/developers',
    get label() {
      return ui('Développeurs')
    },
    icon: 'verified_user',
    permission: 'developers.review',
    group: 'moderation',
    todo: 'developer_profiles_pending'
  },
  {
    to: '/admin/reviews',
    get label() {
      return ui('Avis')
    },
    icon: 'reviews',
    permission: 'reviews.moderate',
    group: 'moderation',
    todo: 'reviews_to_moderate'
  },
  {
    to: '/admin/reports',
    get label() {
      return ui('Signalements')
    },
    icon: 'flag',
    permission: 'reports.handle',
    group: 'moderation',
    todo: 'reports_open'
  },
  {
    to: '/admin/beta',
    get label() {
      return ui('Tests bêta')
    },
    icon: 'biotech',
    permission: 'apps.moderate',
    group: 'moderation',
    todo: 'beta_campaigns_pending',
    // Shown only when the platform tool is on.
    tool: 'beta'
  },
  {
    to: '/admin/categories',
    get label() {
      return ui('Catégories')
    },
    icon: 'category',
    permission: 'catalog.manage',
    group: 'catalog'
  },
  {
    to: '/admin/collections',
    get label() {
      return ui('Sélections')
    },
    icon: 'collections_bookmark',
    permission: 'catalog.manage',
    group: 'catalog'
  },
  {
    to: '/admin/publishers',
    get label() {
      return ui('Entreprises et individuels')
    },
    icon: 'business',
    permission: 'catalog.manage',
    group: 'catalog'
  },
  {
    to: '/admin/countries',
    get label() {
      return ui('Pays')
    },
    icon: 'public',
    permission: 'audit.view',
    group: 'catalog'
  },
  {
    to: '/admin/feedback',
    get label() {
      return ui('Retours sur la plateforme')
    },
    icon: 'forum',
    permission: 'reports.handle',
    group: 'community',
    todo: 'platform_feedback_new'
  },
  {
    to: '/admin/users',
    get label() {
      return ui('Utilisateurs')
    },
    icon: 'group',
    permission: 'users.manage',
    group: 'community'
  },
  {
    to: '/admin/settings',
    get label() {
      return ui('Paramètres')
    },
    icon: 'tune',
    permission: 'settings.manage',
    group: 'platform'
  },
  {
    to: '/admin/ai',
    get label() {
      return ui('Assistant IA')
    },
    icon: 'auto_awesome',
    permission: 'settings.manage',
    group: 'platform'
  },
  {
    to: '/admin/audit',
    get label() {
      return ui('Journal d’audit')
    },
    icon: 'history',
    permission: 'audit.view',
    group: 'platform'
  }
]

export const adminPermissionFor = path =>
  adminLinks.find(link => link.to === path)?.permission

// Links the admin may open: their permission and, for tool pages, the platform flag.
export const visibleAdminLinks = (permissions = [], tools = {}) =>
  adminLinks.filter(
    link =>
      (!link.tool || tools?.[link.tool] === true) &&
      (!link.permission ||
        (Array.isArray(permissions) && permissions.includes(link.permission)))
  )

// Sidebar sections with their visible links; empty sections are dropped.
export const groupedAdminLinks = (permissions, tools) => {
  const links = visibleAdminLinks(permissions, tools)
  return ADMIN_GROUPS.map(group => ({
    key: group.key,
    label: group.label,
    links: links.filter(link => link.group === group.key)
  })).filter(group => group.links.length)
}
