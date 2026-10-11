import { describe, expect, it } from 'vitest'
import { resolveAccess } from '@/router/guards'

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
    expect(resolveAccess(page, developer)).toBe('/account')
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

  it('hides every developer page on mobile, even for developers', () => {
    const page = route('/developer', {
      requiresAuth: true,
      developerOnly: true
    })
    expect(resolveAccess(page, developer, { isMobile: true })).toBe('/account')
    expect(
      resolveAccess(
        route('/developer/activate', { requiresAuth: true }),
        user,
        {
          isMobile: true
        }
      )
    ).toBe('/account')
  })
})
