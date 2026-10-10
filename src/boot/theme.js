import { boot } from 'quasar/wrappers'
import { applySavedTheme, THEME_STORAGE_KEY } from '@/composables/useTheme'

export default boot(() => {
  applySavedTheme()
  window.addEventListener('storage', event => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) applySavedTheme()
  })
})
