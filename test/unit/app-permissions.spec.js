import { describe, expect, it } from 'vitest'
import { APP_PERMISSIONS, permissionInfo } from '@/utils/appPermissions'

describe('app permissions', () => {
  it('uses the same keys as Application::PERMISSIONS on the API', () => {
    expect(APP_PERMISSIONS).toEqual([
      'camera',
      'audio',
      'location',
      'notifications',
      'contacts',
      'storage',
      'screen',
      'clipboard',
      'bluetooth',
      'usb',
      'serial',
      'hid',
      'nfc',
      'midi',
      'sensors',
      'wake_lock',
      'files'
    ])
  })

  it('gives every permission a label and an icon, and keeps unknown keys readable', () => {
    for (const key of APP_PERMISSIONS) {
      const info = permissionInfo(key)
      expect(info.label).toBeTruthy()
      expect(info.icon).toBeTruthy()
    }
    expect(permissionInfo('legacy_thing')).toEqual({
      key: 'legacy_thing',
      icon: 'verified_user',
      label: 'legacy_thing'
    })
  })
})
