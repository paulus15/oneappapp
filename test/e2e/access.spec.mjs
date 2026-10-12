import { expect, test } from '@playwright/test'
import { API, apiLogin, useSession } from './helpers.mjs'

// Refusals and access rules, checked in the browser against the real API.

test('a guest is sent to the login page for private pages', async ({
  page
}) => {
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)account/)
})

test('an unconfirmed account gets a code challenge, never a session', async ({
  request
}) => {
  const email = `plain-${Date.now()}@e2e.test`
  const countries = await (await request.get(`${API}/countries`)).json()
  await request.post(`${API}/auth/register`, {
    data: {
      name: 'Simple',
      email,
      password: 'Plain-pass-123',
      password_confirmation: 'Plain-pass-123',
      country_id: countries[0].id
    }
  })
  // Unconfirmed address: the API answers with a code challenge instead of a session.
  const login = await request.post(`${API}/auth/login`, {
    data: { email, password: 'Plain-pass-123' }
  })
  expect(login.status()).toBe(202)
  expect((await login.json()).access_token).toBeUndefined()
})

test('the back-office is reserved to administrators', async ({
  page,
  request
}) => {
  const token = await apiLogin(request, 'admin@e2e.test', 'Admin-pass-123')
  const res = await request.get(`${API}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  expect(res.ok()).toBe(true)
  const anonymous = await request.get(`${API}/admin/stats`, {
    headers: { Accept: 'application/json' }
  })
  expect(anonymous.status()).toBe(401)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login/)
})

test.describe('on a phone', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  })

  test('developer tools are hidden and the public portal page stays reachable', async ({
    page,
    request
  }) => {
    await useSession(
      page,
      await apiLogin(request, 'admin@e2e.test', 'Admin-pass-123')
    )
    await page.goto('/developer')
    await expect(page).toHaveURL(/\/account/)
    await page.goto('/developers')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Devenez développeur'
    )
    await expect(
      page.getByText(
        'Le portail développeur s’utilise sur ordinateur ou tablette.'
      )
    ).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
