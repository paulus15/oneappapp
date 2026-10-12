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
// The developer's PWA: a reserved test host that the e2e backend serves from fixtures/pwa
// (see backend-router.php), so the journey never depends on a third-party website.
const pwaUrl = 'https://demo.pwastore-e2e.example/'
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

/** Saves the visible workspace section and waits for the server's answer (not a previous toast). */
async function save(page) {
  const [response] = await Promise.all([
    page.waitForResponse(
      r => /\/api\/apps\/\d+$/.test(r.url()) && r.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Enregistrer' }).click()
  ])
  expect(response.status(), await response.text()).toBe(200)
}

/** Opens a workspace tab and waits for the panel transition to end. */
async function openTab(page, name) {
  await page.getByRole('tab', { name }).click()
  await expect(page.locator('.q-tab-panel:visible')).toHaveCount(1)
}

/** A real PNG of the given size, drawn by the browser (icons and screenshots are checked server-side). */
async function png(page, width, height, name) {
  const data = await page.evaluate(
    ([w, h]) => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#075BFF'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#08C8F8'
      ctx.fillRect(w / 4, h / 4, w / 2, h / 2)
      return canvas.toDataURL('image/png').split(',')[1]
    },
    [width, height]
  )
  return { name, mimeType: 'image/png', buffer: Buffer.from(data, 'base64') }
}

test('the developer prepares a PWA listed by URL and submits it', async ({
  page,
  request
}) => {
  await useSession(page, await apiLogin(request, dev.email, dev.password))
  // 1. A draft needs only a name and how the app is provided.
  await page.goto('/developer/apps/create')
  await page.getByLabel('Nom de l’application').fill(appName)
  await page.getByText('Indiquer le lien de ma PWA déjà en ligne').click()
  await expect(page.getByText('Hébergée par l’éditeur').first()).toBeVisible()
  await page.getByLabel('Lien HTTPS de votre PWA').fill(pwaUrl)
  await page.getByRole('button', { name: 'Créer le brouillon' }).click()
  await expect(page).toHaveURL(/\/developer\/apps\/\d+/)
  appId = Number(page.url().match(/apps\/(\d+)/)[1])

  // 2. Details: every field is saved as a draft.
  await page
    .getByLabel('Description courte')
    .fill('Compression d’images hors ligne')
  await page
    .getByLabel('Description complète')
    .fill(
      'Compressez vos images directement dans le navigateur, sans envoi de fichier.'
    )
  await page.getByLabel('Catégorie', { exact: true }).click()
  await page.getByRole('option').first().click()
  await page.getByLabel('Langues de l’application').click()
  await page.getByRole('option', { name: 'Français' }).click()
  await page.keyboard.press('Escape')
  await page.getByLabel('Lien officiel de votre PWA').fill(pwaUrl)
  await page.getByLabel('E-mail de contact').fill('studio-awa@e2e.test')
  await save(page)

  // 3. Images: an uploaded icon and a screenshot.
  await openTab(page, /Images/)
  // The cover is checked and uploaded as soon as it is chosen.
  await page
    .locator('.cover-uploader input[type=file]')
    .setInputFiles(await png(page, 1920, 1080, 'cover.png'))
  await expect(notice(page, 'Brouillon enregistré.')).toBeVisible()
  await expect(page.getByText('Aperçu sur ordinateur')).toBeVisible()
  const files = page.locator(
    '.q-tab-panel:visible .plain-fieldset input[type=file]'
  )
  await files.nth(0).setInputFiles(await png(page, 512, 512, 'icon.png'))
  await files.nth(1).setInputFiles(await png(page, 540, 960, 'screen.png'))
  await save(page)

  // 4. Privacy.
  await openTab(page, /Confidentialité/)
  await page
    .getByLabel('Politique de confidentialité')
    .fill(`${pwaUrl}privacy.html`)
  await page.getByText('Aucune donnée').click()
  await save(page)

  // App content: access for the review, ads, content rating.
  await openTab(page, /Contenu/)
  await page
    .getByText(
      'Toutes les fonctionnalités sont accessibles sans accès particulier'
    )
    .click()
  await page.getByRole('button', { name: 'Enregistrer' }).first().click()
  await expect(
    notice(page, 'Accès pour la vérification enregistré.')
  ).toBeVisible()
  await page
    .getByText('Non, mon application ne contient pas d’annonces')
    .click()
  const questions = page.locator('.q-tab-panel:visible .question')
  for (let i = 0; i < (await questions.count()); i++)
    await questions
      .nth(i)
      .getByRole('radio', { name: 'Non', exact: true })
      .click()
  await expect(page.locator('.age-badge')).toHaveText('3+')
  const [content] = await Promise.all([
    page.waitForResponse(
      r => /\/api\/apps\/\d+$/.test(r.url()) && r.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Enregistrer' }).last().click()
  ])
  expect(content.status()).toBe(200)

  // 5. Summary: nothing missing; the help explains the journey.
  await openTab(page, /Récapitulatif/)
  await expect(page.getByText('Tout est prêt.')).toBeVisible()
  await page.getByRole('button', { name: 'Comment ça marche ?' }).click()
  await expect(
    page.getByText('Comment publier mon application ?')
  ).toBeVisible()
  await page.getByRole('button', { name: 'J’ai compris' }).click()

  // English also translates the server's messages; the choice is remembered.
  await page.getByRole('button', { name: 'Changer de langue' }).click()
  await page.getByRole('menuitemradio', { name: 'English' }).click()
  await expect(page.getByText('Ready for review?')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Ready for review?')).toBeVisible()
  await page.getByRole('button', { name: 'Change language' }).click()
  await page.getByRole('menuitemradio', { name: 'Français' }).click()
  await expect(page.getByText('Prête pour la validation ?')).toBeVisible()

  // 6. One button submits; the dossier is then locked.
  await page.getByRole('button', { name: 'Soumettre à validation' }).click()
  await page
    .locator('.q-dialog')
    .last()
    .getByRole('button', { name: 'Soumettre à validation' })
    .click()
  await expect(notice(page, 'Demande envoyée')).toBeVisible({ timeout: 30_000 })
  await expect(
    page.getByText(/Elle attend d’être examinée/).first()
  ).toBeVisible()
})

test('an administrator approves the dossier, which publishes the app', async ({
  page,
  request
}) => {
  await useSession(
    page,
    await apiLogin(request, 'admin@e2e.test', 'Admin-pass-123')
  )
  await page.goto('/admin/requests')
  await page.getByText(appName).click()
  await expect(page.getByText('Profil vérifié')).toBeVisible()
  await expect(
    page.getByText('Compressez vos images directement')
  ).toBeVisible()
  await page.getByRole('button', { name: 'Approuver et publier' }).click()
  await page
    .locator('.q-dialog')
    .last()
    .getByRole('button', { name: 'Approuver et publier' })
    .click()
  await expect(
    notice(page, 'Approuvée : l’application est en ligne.')
  ).toBeVisible()

  const list = await (await request.get(`${API}/apps`)).json()
  expect(list.data.map(a => a.id)).toContain(appId)
})

test('the published app appears in the Store with its hosting badge', async ({
  browser
}) => {
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
  await expect(
    guest.getByRole('link', { name: 'Studio Awa' }).first()
  ).toBeVisible()
  const badge = guest.getByRole('img', { name: /Hébergée par l’éditeur/ })
  await badge.hover()
  await expect(
    guest.getByText(/fonctionne sur le site de son éditeur/)
  ).toBeVisible()
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
    .locator('.queue-card', { hasText: 'demande(s) de publication à examiner' })
    .locator('strong')
  await expect(queue).toHaveText(String(stats.queues.applications_to_review))
  await context.close()
})
