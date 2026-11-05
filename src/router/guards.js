// The developer workspace is /developer and its sub-pages, not the public /developers page.
export const isDeveloperArea = path =>
  path === '/developer' || path.startsWith('/developer/')

// The API remains authoritative; this avoids exposing disabled tool screens. Pages outside
// the developer space name their own way out (meta.toolFallback).
export function resolveToolAccess(to, platform) {
  return !to.meta.tool || platform?.tools?.[to.meta.tool] === true
    ? true
    : to.meta.toolFallback || '/developer/lab'
}

// With the Feedback Hub on, the former inbox (and its notification links
// /developer/suggestions?id=X) opens the new pages; with it off, nothing changes.
export function resolveLegacySuggestions(to, platform) {
  if (platform?.tools?.feedback_hub !== true) return true
  const id = Number(to.query?.id)
  return Number.isInteger(id) && id > 0
    ? `/developer/feedback/${id}`
    : '/developer/feedback'
}

// Public browsing is the default. Account, developer and admin routes declare
// requiresAuth in their metadata; downloads, activation and reviews guard their actions.
export function requiresSession(route) {
  return !!route?.meta?.requiresAuth
}

// Pure navigation rules, kept free of router/Quasar imports so they can be unit tested.
export function resolveAccess(to, auth) {
  if (to.meta.guestOnly && auth.isAuthenticated) return '/account'
  if (requiresSession(to) && !auth.isAuthenticated)
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

// Apply the same access policy when a session expires during a visit.
export function unauthorizedRedirect(route) {
  if (!route || !requiresSession(route) || route.path === '/login') return null
  return { path: '/login', query: { redirect: route.fullPath } }
}
