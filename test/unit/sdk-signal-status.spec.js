import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n, setLocale } from '@/i18n'
import SdkSignalStatus from '@/components/SdkSignalStatus.vue'

let wrapper
afterEach(() => wrapper?.unmount())
async function render(info, published = true) {
  await setLocale('fr')
  wrapper = mount(SdkSignalStatus, {
    props: { info, published },
    global: { plugins: [i18n], stubs: ['q-icon'] }
  })
  return wrapper.text()
}
describe('SDK collection status', () => {
  it('does not confuse an unchecked script with a missing script or zero users', async () => {
    const text = await render({ check: null, last_signal_at: null })
    expect(text).toContain('Script non vérifié')
    expect(text).toContain('Aucune donnée reçue')
    expect(text).toContain('Cela ne signifie pas')
  })
  it('distinguishes script detection from received data', async () => {
    expect(
      await render({ check: { status: 'connected' }, last_signal_at: null })
    ).toContain('Script détecté · en attente de données')
  })
  it('shows a missing script and preserves the date of historical signals', async () => {
    const text = await render({
      check: { status: 'missing' },
      last_signal_at: '2026-10-01T12:00:00Z'
    })
    expect(text).toContain('Script introuvable')
    expect(text).toContain('Signal reçu — dernier le')
    expect(text).not.toContain('Aucune donnée reçue')
  })
  it('reports a security policy blocking collection', async () => {
    expect(
      await render({
        check: { status: 'connected', csp_blocks: ['connect-src'] }
      })
    ).toContain('blocage de sécurité')
  })
  it('does not describe historical data as users currently online', async () => {
    const text = await render({ last_signal_at: '2026-10-01T12:00:00Z' })
    expect(text).toContain('Données reçues')
    expect(text).toContain('Signal reçu — dernier le')
    expect(text).not.toContain('connectés')
  })
})
