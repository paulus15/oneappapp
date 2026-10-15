import { describe, expect, it } from 'vitest'
import { resolveAccess, unauthorizedRedirect } from '@/router/guards'

const route = (path, meta = {}) => ({ path, fullPath: path, meta })
const guest = { isAuthenticated: false, isAdmin: false, isDeveloper: false }
const user = { ...guest, isAuthenticated: true }
const developer = { ...user, isDeveloper: true }
const admin = { ...user, isAdmin: true }

describe('resolveAccess', () => {
  it('sends guests to login with a redirect back', () => {
    expect(
      resolveAccess(route('/account', { requiresAuth: true }), guest)
    ).toEqual({ path: '/login', query: { redirect: '/account' } })
  })

  it('keeps signed-in users away from guest-only pages', () => {
    expect(resolveAccess(route('/login', { guestOnly: true }), user)).toBe(
      '/account'
    )
  })

  it('reserves admin pages to admins', () => {
    const page = route('/admin', { requiresAuth: true, adminOnly: true })
    expect(resolveAccess(page, developer)).toBe('/errors/403')
    expect(resolveAccess(page, admin)).toBe(true)
  })

  it('sends users without a developer profile to activation', () => {
    const page = route('/developer', {
      requiresAuth: true,
      developerOnly: true
    })
    expect(resolveAccess(page, user)).toBe('/developer/activate')
    expect(resolveAccess(page, developer)).toBe(true)
  })

  it('opens the developer profile for developers, activation for others', () => {
    const profile = route('/developer/profile', {
      requiresAuth: true,
      developerOnly: true
    })
    const activate = route('/developer/activate', { requiresAuth: true })
    expect(resolveAccess(profile, guest)).toEqual({
      path: '/login',
      query: { redirect: '/developer/profile' }
    })
    expect(resolveAccess(profile, user)).toBe('/developer/activate')
    expect(resolveAccess(activate, user)).toBe(true)
    expect(resolveAccess(profile, developer)).toBe(true)
    expect(resolveAccess(activate, developer)).toBe('/developer/profile')
  })

  it('keeps developer capabilities and activation available on mobile', () => {
    const page = route('/developer', {
      requiresAuth: true,
      developerOnly: true
    })
    expect(resolveAccess(page, developer, { isMobile: true })).toBe(true)
    expect(resolveAccess(page, user, { isMobile: true })).toBe(
      '/developer/activate'
    )
    expect(resolveAccess(page, guest, { isMobile: true })).toEqual({
      path: '/login',
      query: { redirect: '/developer' }
    })
    expect(
      resolveAccess(
        route('/developer/activate', { requiresAuth: true }),
        user,
        {
          isMobile: true
        }
      )
    ).toBe(true)
  })

  it('checks the granular permission of admin pages', () => {
    const page = route('/admin/users', {
      requiresAuth: true,
      adminOnly: true,
      permission: 'users.manage'
    })
    const moderator = {
      ...admin,
      user: { admin_permissions: ['apps.moderate'] }
    }
    const manager = { ...admin, user: { admin_permissions: ['users.manage'] } }
    expect(resolveAccess(page, moderator)).toBe('/errors/403')
    expect(resolveAccess(page, manager)).toBe(true)
  })

  it('keeps the public developer portal page reachable on mobile', () => {
    expect(resolveAccess(route('/developers'), guest, { isMobile: true })).toBe(
      true
    )
  })
})

it('blocks draft creation and editing until developer validation', () => {
  for (const path of ['/developer/apps/create', '/developer/apps/1/edit']) {
    const page = route(path, {
      requiresAuth: true,
      developerOnly: true,
      requiresValidatedDeveloper: true
    })
    expect(resolveAccess(page, developer)).toBe('/developer/profile')
    expect(resolveAccess(page, { ...developer, canCreateApp: true })).toBe(true)
  }
})

describe('unauthorizedRedirect', () => {
  it('sends protected pages back to login with a redirect', () => {
    expect(
      unauthorizedRedirect(route('/account', { requiresAuth: true }))
    ).toEqual({ path: '/login', query: { redirect: '/account' } })
  })

  it('keeps visitors on public pages and on the login/OTP steps', () => {
    expect(unauthorizedRedirect(route('/app/demo'))).toBeNull()
    expect(
      unauthorizedRedirect(route('/login', { guestOnly: true }))
    ).toBeNull()
    expect(unauthorizedRedirect(undefined)).toBeNull()
  })
})
