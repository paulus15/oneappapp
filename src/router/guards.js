// The developer workspace is /developer and its sub-pages, not the public /developers page.
export const isDeveloperArea = path =>
  path === '/developer' || path.startsWith('/developer/')

// Pure navigation rules, kept free of router/Quasar imports so they can be unit tested.
export function resolveAccess(to, auth, { isMobile = false } = {}) {
  if (to.meta.guestOnly && auth.isAuthenticated) return '/account'
  if (to.meta.requiresAuth && !auth.isAuthenticated)
    return { path: '/login', query: { redirect: to.fullPath } }
  // Developer tools are desktop/tablet only; on mobile a developer is a regular user.
  if (isMobile && isDeveloperArea(to.path)) return '/account'
  if (to.meta.adminOnly && !auth.isAdmin) return '/account'
  if (
    to.meta.permission &&
    !auth.user?.admin_permissions?.includes(to.meta.permission)
  )
    return '/admin'
  if (to.meta.developerOnly && !auth.isDeveloper) return '/developer/activate'
  return true
}
