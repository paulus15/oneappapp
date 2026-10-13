import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export const API = 'https://127.0.0.1:8012/api'
const log = () =>
  join(
    process.env.E2E_BACKEND_DIR || join(homedir(), 'LaravelProjects/oneapp'),
    'storage/logs/laravel.log'
  )

/** Latest one-time code mailed to an address, read from the mail log (quoted-printable decoded). */
export async function otpFor(email, { after = 0 } = {}) {
  for (let i = 0; i < 40; i++) {
    // `after` is a byte offset: slice the buffer, not the decoded text (accents are multi-byte).
    const text = readFileSync(log())
      .subarray(after)
      .toString('utf8')
      .replace(/=\r?\n/g, '')
      .replace(/=3D/g, '=')
    const at = text.lastIndexOf(`To: ${email}`)
    if (at !== -1) {
      const code = text.slice(at).match(/letter-spacing:8px">(\d{6})</)
      if (code) return code[1]
    }
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error(`No code mailed to ${email}`)
}
export const logSize = () => readFileSync(log()).length

/** Bearer transport is used ONLY in the Node test runner to prepare fixtures. */
export async function apiLogin(request, email, password) {
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password, remember: true }
  })
  if (!res.ok())
    throw new Error(`login ${email}: ${res.status()} ${await res.text()}`)
  return (await res.json()).access_token
}
export async function useSession(page, token) {
  // Install an HttpOnly cookie through Playwright, never through page JavaScript.
  await page.context().addCookies([
    {
      name: '__Host-pwastore_auth',
      value: token,
      domain: new URL(API).hostname,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    }
  ])
}
/** Answers a Quasar prompt dialog. */
export async function answerDialog(page, text) {
  const dialog = page.locator('.q-dialog').last()
  if (text !== undefined)
    await dialog.locator('textarea, input').first().fill(text)
  await dialog.getByRole('button', { name: 'OK' }).click()
}
/** A Quasar notification toast with the given text. */
export const notice = (page, text) =>
  page.locator('.q-notification').filter({ hasText: text }).first()
