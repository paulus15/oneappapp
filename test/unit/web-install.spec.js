import { afterEach, describe, expect, it, vi } from 'vitest'
import { canWebInstall, webInstall } from '@/utils/webInstall'

const target = {
  manifest: 'https://agenda.example/manifest.json',
  manifest_id: 'https://agenda.example/agenda'
}

afterEach(() => {
  delete navigator.install
})

describe('web install', () => {
  it('is offered only with a target and a supporting browser', () => {
    expect(canWebInstall(target)).toBe(false)
    navigator.install = vi.fn()
    expect(canWebInstall(target)).toBe(true)
    expect(canWebInstall(null)).toBe(false)
  })

  it('passes the manifest and its id, and reports the outcome', async () => {
    navigator.install = vi.fn().mockResolvedValue({})
    expect(await webInstall(target)).toBe('installed')
    expect(navigator.install).toHaveBeenCalledWith({
      manifest: target.manifest,
      manifestId: target.manifest_id
    })
    navigator.install = vi
      .fn()
      .mockRejectedValue(new DOMException('no', 'AbortError'))
    expect(await webInstall(target)).toBe('cancelled')
    navigator.install = vi
      .fn()
      .mockRejectedValue(new DOMException('bad', 'DataError'))
    expect(await webInstall(target)).toBe('unavailable')
  })
})
