// Pure navigation rules, kept free of router/Quasar imports so they can be unit tested.
export function resolveAccess(to, auth, { isMobile = false } = {}) {
  if (to.meta.guestOnly && auth.isAuthenticated) return '/account'
  if (to.meta.requiresAuth && !auth.isAuthenticated)
    return { path: '/login', query: { redirect: to.fullPath } }
  // Developer tools are desktop/tablet only; on mobile a developer is a regular user.
  if (isMobile && to.path.startsWith('/developer')) return '/account'
  if (to.meta.adminOnly && !auth.isAdmin) return '/account'
  if (to.meta.developerOnly && !auth.isDeveloper) return '/developer/activate'
  return true
}
