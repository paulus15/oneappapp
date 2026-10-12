import { expect, test } from '@playwright/test'
import {
  API,
  answerDialog,
  apiLogin,
  logSize,
  notice,
  otpFor,
  useSession
} from './helpers.mjs'

// The whole PWA Store journey, in order, against the real API:
// sign up → confirm by code → become developer → get verified → submit a PWA → approval →
// publication → visible in the Store → review from another user → publisher reply.
test.describe.configure({ mode: 'serial' })

const stamp = Date.now()
const dev = {
  name: 'Awa Développeuse',
  email: `dev-${stamp}@e2e.test`,
  password: 'Dev-pass-12345'
}
const reader = {
  name: 'Koffi Lecteur',
  email: `reader-${stamp}@e2e.test`,
  password: 'Reader-pass-123'
}
const appName = `Compresseur ${stamp}`
let appId

async function pickCountry(page, label, search = 'Côte') {
  await page.getByLabel(label).click()
  await page.keyboard.type(search)
  await page.getByRole('option', { name: /Côte d.Ivoire/ }).click()
}

test('a visitor signs up and confirms the address with a code', async ({
  page
}) => {
  const before = logSize()
  await page.goto('/register')
  await page.getByLabel('Nom complet').fill(dev.name)
  await page.getByLabel('Adresse e-mail').fill(dev.email)
  await page.getByLabel('Mot de passe', { exact: true }).fill(dev.password)
  await page.getByLabel('Confirmer le mot de passe').fill(dev.password)
  await pickCountry(page, 'Pays de résidence')
  await page.getByRole('button', { name: 'Créer mon compte' }).click()

  await expect(page).toHaveURL(/verify-email/)
  await page
    .getByLabel('Code de confirmation')
    .fill(await otpFor(dev.email, { after: before }))
  await page.getByRole('button', { name: 'Confirmer le code' }).click()
  await expect(page).toHaveURL(/\/account/)
})

test('the user becomes a developer and submits a verified identity', async ({
  page,
  request
}) => {
  await useSession(page, await apiLogin(request, dev.email, dev.password))
  await page.goto('/developer/activate')
  await page
    .getByRole('button', { name: 'Activer mon espace développeur' })
    .click()

  await page.getByLabel('Nom public').fill('Studio Awa')
  await page.getByLabel('Nom légal complet').fill('Awa Kouamé')
  await pickCountry(page, 'Pays de résidence du développeur')
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()
  await expect(notice(page, 'Profil enregistré.')).toBeVisible()

  await page.getByLabel('Type de pièce').click()
  await page.getByRole('option', { name: 'Passeport' }).click()
  const next = new Date(Date.now() + 3 * 365 * 864e5).toISOString().slice(0, 10)
  await page.getByLabel('Date d’expiration').fill(next)
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'passeport.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
    })
  await page
    .getByRole('button', { name: 'Déposer la pièce d’identité' })
    .click()
  await expect(notice(page, 'Pièce d’identité déposée.')).toBeVisible()

  await page.getByRole('button', { name: 'Soumettre à vérification' }).click()
  await expect(page.getByText('Vérification en attente').first()).toBeVisible()
})

test('an administrator verifies the developer profile', async ({
  page,
  request
}) => {
  await useSession(
    page,
    await apiLogin(request, 'admin@e2e.test', 'Admin-pass-123')
  )
  await page.goto('/admin/developers')
  const card = page.locator('.workspace-card', { hasText: 'Studio Awa' })
  await card.getByRole('button', { name: 'Vérifier' }).click()
  await answerDialog(page, 'Identité et profil contrôlés')
  await expect(notice(page, 'Décision enregistrée.')).toBeVisible()
})

test('the developer lists a real PWA by URL and submits it', async ({
  page,
  request
}) => {
  const token = await apiLogin(request, dev.email, dev.password)
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  }
  const categories = await (await request.get(`${API}/categories`)).json()
  // The 1100-line creation form is covered by the API here; the publication steps use the UI.
  const created = await request.post(`${API}/apps`, {
    headers,
    data: {
      name: appName,
      identifier: `app.squoosh.e2e${stamp}`,
      description:
        'Compressez vos images directement dans le navigateur, sans envoi de fichier.',
      short_description: 'Compression d’images hors ligne',
      category_id: categories[0].id,
      icon_url: 'https://squoosh.app/c/icon-large-maskable-c2078ced.png'
    }
  })
  expect(created.status()).toBe(201)
  appId = (await created.json()).id

  await useSession(page, token)
  await page.goto(`/developer/apps/${appId}/publication`)
  await page.getByText('PWA hébergée sur mon site').click()
  await page.getByLabel('Adresse HTTPS de la PWA').fill('https://squoosh.app/')
  await page.getByRole('button', { name: 'Enregistrer le mode' }).click()
  await expect(notice(page, 'Mode de distribution enregistré.')).toBeVisible()
  await page.getByRole('button', { name: 'Contrôler l’URL' }).click()
  await expect(notice(page, 'Contrôle de l’URL réussi.')).toBeVisible({
    timeout: 30_000
  })
  await expect(page.getByText('Manifeste trouvé').first()).toBeVisible()

  // The help explains the journey; the preview step is ticked once the listing is seen.
  await page.getByRole('button', { name: 'Comment ça marche ?' }).click()
  await expect(
    page.getByText('Comment publier mon application ?')
  ).toBeVisible()
  await page.getByRole('button', { name: 'J’ai compris' }).click()
  const previewStep = page.locator('.journey li', {
    hasText: 'Prévisualiser la fiche'
  })
  await expect(previewStep).not.toHaveClass(/done/)
  await previewStep.getByRole('button', { name: 'Aperçu' }).click()
  await expect(page.getByText('Aperçu de la fiche publique')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(previewStep).toHaveClass(/done/)

  // Switching to English also translates the server's messages; the choice is remembered.
  await page.getByRole('button', { name: 'Changer de langue' }).click()
  await page.getByRole('menuitemradio', { name: 'English' }).click()
  await expect(page.getByText('Publishing journey')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Publishing journey')).toBeVisible()
  await page.getByRole('button', { name: 'Change language' }).click()
  await page.getByRole('menuitemradio', { name: 'Français' }).click()
  await expect(page.getByText('Parcours de publication')).toBeVisible()

  await page.getByRole('button', { name: 'Soumettre à la revue' }).click()
  await expect(notice(page, 'Application soumise à revue.')).toBeVisible()
  await expect(page.getByText('Soumise').first()).toBeVisible()
})

test('an administrator approves the application, which is still not public', async ({
  page,
  request
}) => {
  await useSession(
    page,
    await apiLogin(request, 'admin@e2e.test', 'Admin-pass-123')
  )
  await page.goto('/admin/apps')
  await page.getByText(appName).click()
  await page.getByRole('button', { name: 'Approuver' }).click()
  await answerDialog(page, 'Conforme aux règles de publication')
  await expect(notice(page, /Décision enregistrée/)).toBeVisible()

  const list = await (await request.get(`${API}/apps`)).json()
  expect(list.data.map(a => a.id)).not.toContain(appId)
})

test('the developer publishes and the app appears in the Store', async ({
  page,
  request,
  browser
}) => {
  await useSession(page, await apiLogin(request, dev.email, dev.password))
  await page.goto(`/developer/apps/${appId}/publication`)
  await page.getByRole('button', { name: 'Publier dans le Store' }).click()
  await answerDialog(page)
  await expect(notice(page, 'Application publiée.')).toBeVisible()

  const visitor = await browser.newContext({
    locale: 'fr-FR',
    reducedMotion: 'reduce'
  })
  const guest = await visitor.newPage()
  await guest.goto('http://127.0.0.1:9124/')
  const card = guest.locator('a.app-card', { hasText: appName }).first()
  await expect(card).toBeVisible()
  await card.click()
  await expect(guest).toHaveURL(new RegExp(`/apps/${appId}$`))
  await expect(guest.getByRole('link', { name: 'Studio Awa' })).toBeVisible()
  await visitor.close()
})

test('another user reviews the app and the publisher replies', async ({
  page,
  request
}) => {
  const before = logSize()
  const reg = await request.post(`${API}/auth/register`, {
    data: {
      name: reader.name,
      email: reader.email,
      password: reader.password,
      password_confirmation: reader.password,
      country_id: (await (await request.get(`${API}/countries`)).json()).find(
        c => c.code === 'CI'
      ).id
    }
  })
  const verified = await request.post(`${API}/auth/otp/verify`, {
    data: {
      challenge_id: (await reg.json()).challenge_id,
      code: await otpFor(reader.email, { after: before })
    }
  })
  await useSession(page, (await verified.json()).access_token)

  await page.goto(`/apps/${appId}`)
  await page
    .locator('.reviews .q-rating')
    .first()
    .locator('.q-rating__icon-container')
    .nth(3)
    .click()
  await page
    .getByLabel('Votre commentaire (facultatif)')
    .fill('Rapide et efficace, même hors ligne.')
  await page.getByRole('button', { name: 'Publier mon avis' }).click()
  await expect(notice(page, 'Avis enregistré.')).toBeVisible()
  await expect(
    page.locator('.reviews').getByText('Rapide et efficace, même hors ligne.')
  ).toBeVisible()

  await useSession(page, await apiLogin(request, dev.email, dev.password))
  await page.goto('/developer/reviews')
  await page.getByRole('button', { name: 'Répondre' }).first().click()
  await answerDialog(page, 'Merci pour votre retour !')
  await expect(page.getByText('Merci pour votre retour !')).toBeVisible()

  const reviews = await (
    await request.get(`${API}/apps/${appId}/reviews`)
  ).json()
  expect(reviews.total).toBe(1)
  expect(reviews.data[0].reply.body).toBe('Merci pour votre retour !')
})

test('with full motion, the intro ends readable and tiles and counters land', async ({
  browser,
  request
}) => {
  const context = await browser.newContext({
    locale: 'fr-FR',
    reducedMotion: 'no-preference'
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:9124/')
  // The intro reveals the promise line by line and leaves it in place.
  await expect(page.locator('.hero-panel')).not.toHaveClass(/hero-intro/)
  await expect
    .poll(() =>
      page
        .locator('.line-inner')
        .first()
        .evaluate(e => getComputedStyle(e).transform)
    )
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/)
  // The published app tile cascades in and ends fully visible.
  const card = page.locator('a.app-card', { hasText: appName }).first()
  await card.scrollIntoViewIfNeeded()
  await expect
    .poll(() => card.evaluate(e => getComputedStyle(e).opacity))
    .toBe('1')

  // Admin counters count up to the real value.
  const token = await apiLogin(request, 'admin@e2e.test', 'Admin-pass-123')
  const stats = await (
    await request.get(`${API}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  ).json()
  await page.evaluate(t => localStorage.setItem('auth_token', t), token)
  await page.goto('http://127.0.0.1:9124/admin')
  const queue = page
    .locator('.queue-card', { hasText: 'application(s) à examiner' })
    .locator('strong')
  await expect(queue).toHaveText(String(stats.queues.applications_to_review))
  await context.close()
})
