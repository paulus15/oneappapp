import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { API, apiLogin, logSize, otpFor, useSession } from './helpers.mjs'

// A compiled build full of third-party origins is accepted without any declaration; the
// developer sees the automatic report and an administrator reviews it with an internal note.
const stamp = Date.now()
const dev = { email: `zip-${stamp}@e2e.test`, password: 'Zip-pass-12345' }

function buildZip() {
  const dir = mkdtempSync(join(tmpdir(), 'pwa-build-'))
  writeFileSync(
    join(dir, 'index.html'),
    '<!doctype html><html lang="fr"><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">' +
      '<script src="https://cdn.jsdelivr.net/npm/lib@1/x.js"></script></head><body>' +
      '<script>fetch("https://api.acme-shop.io/v1/items");new WebSocket("wss://live.acme-shop.io/ws");' +
      'const ns="http://www.w3.org/2000/svg"</script></body></html>'
  )
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify({
      name: 'Acme',
      short_name: 'Acme',
      start_url: '/',
      display: 'standalone',
      icons: [{ src: 'icon.png', sizes: '512x512' }]
    })
  )
  writeFileSync(join(dir, 'icon.png'), 'png')
  writeFileSync(join(dir, 'sw.js'), 'self.addEventListener("fetch",()=>{})')
  execFileSync(
    'zip',
    [
      '-qr',
      join(dir, 'build.zip'),
      'index.html',
      'manifest.json',
      'icon.png',
      'sw.js'
    ],
    { cwd: dir }
  )
  return readFileSync(join(dir, 'build.zip'))
}

test('a build is analysed automatically and reviewed without manual declaration', async ({
  page,
  request
}) => {
  // A verified developer, prepared through the API (the UI path is covered by journey.spec).
  const countries = await (await request.get(`${API}/countries`)).json()
  const before = logSize()
  const reg = await request.post(`${API}/auth/register`, {
    data: {
      name: 'Zip Dev',
      email: dev.email,
      password: dev.password,
      password_confirmation: dev.password,
      country_id: countries.find(c => c.code === 'CI').id
    }
  })
  await request.post(`${API}/auth/otp/verify`, {
    data: {
      challenge_id: (await reg.json()).challenge_id,
      code: await otpFor(dev.email, { after: before })
    }
  })
  const devToken = await apiLogin(request, dev.email, dev.password)
  const auth = {
    Authorization: `Bearer ${devToken}`,
    Accept: 'application/json'
  }
  await request.post(`${API}/developer/activate`, {
    headers: auth,
    data: { type: 'individual' }
  })
  await request.put(`${API}/developer/profile`, {
    headers: auth,
    data: {
      type: 'individual',
      public_name: 'Acme Studio',
      legal_name: 'Acme Kouassi',
      country_id: countries.find(c => c.code === 'CI').id
    }
  })
  await request.post(`${API}/developer/profile/identity`, {
    headers: auth,
    multipart: {
      type: 'passport',
      expires_at: new Date(Date.now() + 2 * 365 * 864e5)
        .toISOString()
        .slice(0, 10),
      file: {
        name: 'id.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n%%EOF\n')
      }
    }
  })
  await request.post(`${API}/developer/profile/submit`, { headers: auth })
  const adminToken = await apiLogin(request, 'admin@e2e.test', 'Admin-pass-123')
  const admin = {
    Authorization: `Bearer ${adminToken}`,
    Accept: 'application/json'
  }
  const profile = (
    await (
      await request.get(`${API}/developer/profile`, { headers: auth })
    ).json()
  ).profile
  expect(
    (
      await request.post(`${API}/admin/developers/${profile.id}/review`, {
        headers: admin,
        data: { status: 'verified', reason: 'Contrôlé' }
      })
    ).ok()
  ).toBe(true)

  const categories = await (await request.get(`${API}/categories`)).json()
  const app = await (
    await request.post(`${API}/apps`, {
      headers: auth,
      data: {
        name: `Acme ${stamp}`,
        identifier: `io.acme.e2e${stamp}`,
        description: 'Une boutique hors ligne qui synchronise ses commandes.',
        category_id: categories[0].id,
        icon_url: 'https://squoosh.app/c/icon-large-maskable-c2078ced.png'
      }
    })
  ).json()

  // No domain list is sent: the upload must still pass the analysis.
  const upload = await request.post(`${API}/versions`, {
    headers: auth,
    multipart: {
      application_id: String(app.id),
      version_number: '1.0.0',
      zip_file: {
        name: 'build.zip',
        mimeType: 'application/zip',
        buffer: buildZip()
      }
    }
  })
  expect(upload.status(), await upload.text()).toBe(201)
  const version = await upload.json()
  expect(version.scan_status).toBe('passed')
  expect(version.detected_domains).toEqual(
    expect.arrayContaining([
      'fonts.googleapis.com',
      'cdn.jsdelivr.net',
      'api.acme-shop.io',
      'live.acme-shop.io'
    ])
  )
  expect(version.detected_domains).not.toContain('www.w3.org')

  // The developer reads the automatic report.
  await useSession(page, devToken)
  await page.goto(`/developer/apps/${app.id}?tab=version`)
  const report = page.getByText('Ressources et domaines externes détectés')
  await expect(
    page.getByText('4 domaine(s) détecté(s) automatiquement')
  ).toBeVisible()
  await report.click()
  await expect(
    page.getByText('Espace de noms XML (jamais chargé)')
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Examiner / ajouter une observation' })
  ).toHaveCount(0)

  // An administrator reviews one resource with an internal note.
  await useSession(page, adminToken)
  await page.goto(`/developer/apps/${app.id}?tab=version`)
  await page.getByText('Ressources et domaines externes détectés').click()
  const card = page
    .locator('.resource-report .q-card', { hasText: 'live.acme-shop.io' })
    .first()
  await card
    .getByRole('button', { name: 'Examiner / ajouter une observation' })
    .click()
  const dialog = page.locator('.q-dialog').last()
  await dialog.getByLabel('Visibilité').click()
  await page.getByRole('option', { name: 'Interne à l’administration' }).click()
  await dialog
    .getByLabel('Observation')
    .fill('WebSocket de suivi des commandes : cohérent avec la fiche.')
  await dialog.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(card.getByText('Examen : Examinée')).toBeVisible()

  // The internal note never reaches the developer.
  const asDev = await (
    await request.get(`${API}/versions/${version.id}/external-resources`, {
      headers: auth
    })
  ).json()
  const ws = asDev.resources.find(r => r.hostname === 'live.acme-shop.io')
  expect(ws.review_status).toBe('reviewed')
  expect(ws.observations).toHaveLength(0)
  const asAdmin = await (
    await request.get(`${API}/versions/${version.id}/external-resources`, {
      headers: admin
    })
  ).json()
  expect(
    asAdmin.resources.find(r => r.hostname === 'live.acme-shop.io')
      .observations[0].visibility
  ).toBe('internal')
})
