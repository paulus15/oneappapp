// One list drives both the admin navigation and the permission each page requires.
export const adminLinks = [
  { to: '/admin', label: 'Tableau de bord', icon: 'space_dashboard' },
  {
    to: '/admin/apps',
    label: 'Applications',
    icon: 'apps',
    permission: 'apps.moderate'
  },
  {
    to: '/admin/developers',
    label: 'Développeurs',
    icon: 'verified_user',
    permission: 'developers.review'
  },
  {
    to: '/admin/users',
    label: 'Utilisateurs',
    icon: 'group',
    permission: 'users.manage'
  },
  {
    to: '/admin/categories',
    label: 'Catégories',
    icon: 'category',
    permission: 'catalog.manage'
  },
  {
    to: '/admin/collections',
    label: 'Sélections',
    icon: 'collections_bookmark',
    permission: 'catalog.manage'
  },
  {
    to: '/admin/countries',
    label: 'Pays',
    icon: 'public',
    permission: 'audit.view'
  },
  {
    to: '/admin/audit',
    label: 'Journal',
    icon: 'history',
    permission: 'audit.view'
  }
]

export const adminPermissionFor = path =>
  adminLinks.find(link => link.to === path)?.permission
