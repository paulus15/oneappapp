import { expect, test } from '@playwright/test'
import { API } from './helpers.mjs'

async function assertCookieSession(page) {
  const cookie = (await page.context().cookies(API)).find(
    item => item.name === '__Host-pwastore_auth'
  )
  expect(cookie?.httpOnly).toBe(true)
  expect(cookie?.secure).toBe(true)
  expect(cookie?.sameSite).toBe('Lax')
  expect(cookie?.path).toBe('/')
  const exposed = await page.evaluate(() => ({
    cookieReadable: document.cookie.includes('__Host-pwastore_auth'),
    stored: [localStorage, sessionStorage].some(storage =>
      ['auth_token', 'access_token', 'token', 'auth', 'user'].some(
        key => storage.getItem(key) !== null
      )
    )
  }))
  expect(exposed).toEqual({ cookieReadable: false, stored: false })
}

async function signIn(page) {
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail').fill('admin@e2e.test')
  await page.getByLabel('Mot de passe', { exact: true }).fill('Admin-pass-123')
  const response = page.waitForResponse(
    r => r.url() === `${API}/auth/login` && r.request().method() === 'POST'
  )
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  const login = await response
  expect(login.ok()).toBe(true)
  expect((await login.json()).access_token).toBeUndefined()
  expect(login.request().headers()['x-pwa-auth']).toBe('cookie')
  expect(login.request().headers().authorization).toBeUndefined()
  await expect(page).toHaveURL(/\/account/)
  await assertCookieSession(page)
}

test('cookie login, page reload and real logout', async ({ page }) => {
  await signIn(page)
  const restored = page.waitForResponse(r => r.url() === `${API}/auth/me`)
  await page.reload()
  expect((await restored).status()).toBe(200)
  await expect(page).toHaveURL(/\/account/)
  await assertCookieSession(page)
  await page.locator('.profile-button').click()
  const loggedOut = page.waitForResponse(r => r.url() === `${API}/auth/logout`)
  await page.getByText('Déconnexion', { exact: true }).click()
  expect((await loggedOut).ok()).toBe(true)
  await expect(page).toHaveURL(/\/$/)
  expect(
    (await page.context().cookies(API)).some(
      c => c.name === '__Host-pwastore_auth'
    )
  ).toBe(false)
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login/)
})

test('an expired cookie clears the user on reload', async ({ page }) => {
  await signIn(page)
  await page.context().clearCookies()
  const expired = page.waitForResponse(r => r.url() === `${API}/auth/me`)
  await page.reload()
  expect((await expired).status()).toBe(401)
  await expect(page).toHaveURL(/\/login/)
})
