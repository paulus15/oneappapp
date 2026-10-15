// The developer workspace is /developer and its sub-pages, not the public /developers page.
export const isDeveloperArea = path =>
  path === '/developer' || path.startsWith('/developer/')

// The API remains authoritative; this avoids exposing disabled tool screens.
export function resolveToolAccess(to, platform) {
  return !to.meta.tool || platform?.tools?.[to.meta.tool] === true
    ? true
    : '/developer/lab'
}

// Pure navigation rules, kept free of router/Quasar imports so they can be unit tested.
export function resolveAccess(to, auth) {
  if (to.meta.guestOnly && auth.isAuthenticated) return '/account'
  if (to.meta.requiresAuth && !auth.isAuthenticated)
    return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.adminOnly && !auth.isAdmin) return '/errors/403'
  if (
    to.meta.permission &&
    !auth.user?.admin_permissions?.includes(to.meta.permission)
  )
    return '/errors/403'
  if (to.meta.developerOnly && !auth.isDeveloper) return '/developer/activate'
  // Activation is done once; afterwards every "developer space" entry opens the profile.
  if (to.path === '/developer/activate' && auth.isDeveloper)
    return '/developer/profile'
  if (to.meta.requiresValidatedDeveloper && !auth.canCreateApp)
    return '/developer/profile'
  return true
}

// After a 401: only pages that require a session send the visitor to the login page;
// public pages (catalogue, app details, login/OTP steps) stay where they are.
export function unauthorizedRedirect(route) {
  if (!route?.meta?.requiresAuth || route.path === '/login') return null
  return { path: '/login', query: { redirect: route.fullPath } }
}
