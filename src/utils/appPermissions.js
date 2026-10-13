import { ui } from '@/i18n/text'

// Same keys as Application::PERMISSIONS and App\Services\PermissionDetector on the API.
const PERMISSIONS = {
  camera: { icon: 'photo_camera', label: () => ui('Caméra') },
  audio: { icon: 'mic', label: () => ui('Microphone') },
  location: { icon: 'location_on', label: () => ui('Localisation') },
  notifications: { icon: 'notifications', label: () => ui('Notifications') },
  contacts: { icon: 'contacts', label: () => ui('Contacts') },
  storage: { icon: 'storage', label: () => ui('Stockage persistant') },
  screen: { icon: 'screen_share', label: () => ui('Partage d’écran') },
  clipboard: {
    icon: 'content_paste',
    label: () => ui('Lecture du presse-papiers')
  },
  bluetooth: { icon: 'bluetooth', label: () => ui('Bluetooth') },
  usb: { icon: 'usb', label: () => ui('Appareils USB') },
  serial: { icon: 'cable', label: () => ui('Port série') },
  hid: { icon: 'keyboard', label: () => ui('Périphériques HID') },
  nfc: { icon: 'nfc', label: () => ui('NFC') },
  midi: { icon: 'piano', label: () => ui('Instruments MIDI') },
  sensors: { icon: 'screen_rotation', label: () => ui('Capteurs de mouvement') },
  wake_lock: { icon: 'light_mode', label: () => ui('Écran toujours allumé') },
  files: { icon: 'folder_open', label: () => ui('Fichiers de l’appareil') }
}

export const APP_PERMISSIONS = Object.keys(PERMISSIONS)

// Unknown keys (older versions) are shown as they are, with a generic icon.
export function permissionInfo(key) {
  const known = PERMISSIONS[key]
  return {
    key,
    icon: known?.icon || 'verified_user',
    label: known ? known.label() : key
  }
}
